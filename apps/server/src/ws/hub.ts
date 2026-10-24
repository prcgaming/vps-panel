import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { config } from '../config.js';
import { AuthUser } from '../middleware/auth.js';

interface NodeConnection {
  nodeId: string;
  ws: WebSocket;
  lastPing: number;
}

interface PendingCommand {
  resolve: (value: any) => void;
  reject: (reason: any) => void;
  timer: NodeJS.Timeout;
}

export class WebSocketHub {
  private nodeWss: WebSocketServer;
  private terminalWss: WebSocketServer;
  private nodeSockets = new Map<string, NodeConnection>();
  private pendingCommands = new Map<string, PendingCommand>();
  private terminalSessions = new Map<string, { clientWs: WebSocket; nodeWs: WebSocket; vpsId: string }>();

  constructor() {
    this.nodeWss = new WebSocketServer({ noServer: true });
    this.terminalWss = new WebSocketServer({ noServer: true });

    this.setupNodeWss();
    this.setupTerminalWss();
    this.startHeartbeatMonitor();
  }

  public handleUpgrade(req: IncomingMessage, socket: any, head: Buffer) {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (pathname === '/ws/node') {
      this.nodeWss.handleUpgrade(req, socket, head, (ws) => {
        this.nodeWss.emit('connection', ws, req);
      });
    } else if (pathname === '/ws/terminal') {
      this.terminalWss.handleUpgrade(req, socket, head, (ws) => {
        this.terminalWss.emit('connection', ws, req);
      });
    } else {
      socket.destroy();
    }
  }

  // 1. Worker Node Agent WebSocket Handler
  private setupNodeWss() {
    this.nodeWss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token') || (req.headers['x-node-token'] as string);

      if (!token) {
        ws.close(4001, 'Node token missing');
        return;
      }

      // Check if node exists with this token or check if it's a join token
      let node = db.prepare('SELECT * FROM nodes WHERE auth_token = ?').get(token) as any;

      if (!node) {
        // Check join tokens
        const joinToken = db.prepare('SELECT * FROM node_join_tokens WHERE token = ? AND used = 0 AND expires_at > CURRENT_TIMESTAMP').get(token) as any;
        if (!joinToken) {
          ws.close(4003, 'Unauthorized node token');
          return;
        }

        // Auto-register new node
        const nodeId = `node-${Date.now().toString(36)}`;
        const nodeName = joinToken.name || `Node-${nodeId.slice(-4)}`;
        const clientIp = req.socket.remoteAddress || '127.0.0.1';

        db.prepare(`
          INSERT INTO nodes (id, name, hostname, ip_address, port, auth_token, status, driver, cpu_cores, ram_total, disk_total, vps_count)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(nodeId, nodeName, nodeName.toLowerCase(), clientIp, 4001, token, 'online', 'docker', 4, 8192, 100, 0);

        db.prepare('UPDATE node_join_tokens SET used = 1 WHERE token = ?').run(token);
        node = db.prepare('SELECT * FROM nodes WHERE id = ?').get(nodeId) as any;
        console.log(`[Hub] New node auto-registered: ${node.name} (${node.id})`);
      }

      // Save socket connection
      this.nodeSockets.set(node.id, { nodeId: node.id, ws, lastPing: Date.now() });

      // Mark node online
      db.prepare(`UPDATE nodes SET status = 'online', last_heartbeat = CURRENT_TIMESTAMP WHERE id = ?`).run(node.id);
      console.log(`[Hub] Node connected: ${node.name} (${node.id})`);

      // Greet node
      ws.send(JSON.stringify({ type: 'connected', nodeId: node.id, message: 'Welcome to cluster' }));

      // Handle messages from agent
      ws.on('message', (data: Buffer | string) => {
        try {
          const msg = JSON.parse(data.toString());
          this.handleNodeMessage(node.id, msg, ws);
        } catch (err) {
          console.error('[Hub] Invalid JSON from node:', err);
        }
      });

      ws.on('close', () => {
        console.log(`[Hub] Node disconnected: ${node.name} (${node.id})`);
        this.nodeSockets.delete(node.id);
        db.prepare(`UPDATE nodes SET status = 'offline' WHERE id = ?`).run(node.id);
      });

      ws.on('error', (err) => {
        console.error(`[Hub] Node WS error (${node.id}):`, err);
      });
    });
  }

  private handleNodeMessage(nodeId: string, msg: any, ws: WebSocket) {
    // 1. Heartbeat & Metrics
    if (msg.type === 'heartbeat') {
      const conn = this.nodeSockets.get(nodeId);
      if (conn) conn.lastPing = Date.now();

      db.prepare(`
        UPDATE nodes SET
          status = 'online',
          last_heartbeat = CURRENT_TIMESTAMP,
          cpu_cores = COALESCE(?, cpu_cores),
          ram_total = COALESCE(?, ram_total),
          disk_total = COALESCE(?, disk_total),
          vps_count = COALESCE(?, vps_count),
          driver = COALESCE(?, driver)
        WHERE id = ?
      `).run(
        msg.stats?.cpuCores,
        msg.stats?.ramTotalMb,
        msg.stats?.diskTotalGb,
        msg.stats?.vpsCount,
        msg.driver,
        nodeId
      );

      // Reply pong
      ws.send(JSON.stringify({ type: 'heartbeat_ack', timestamp: Date.now() }));
    }

    // 2. Command Response
    if (msg.type === 'command_response' && msg.commandId) {
      const pending = this.pendingCommands.get(msg.commandId);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingCommands.delete(msg.commandId);
        if (msg.success) {
          pending.resolve(msg.data);
        } else {
          pending.reject(new Error(msg.error || 'Command execution failed on node'));
        }
      }
    }

    // 3. VPS Terminal Output from Agent -> forward to Client
    if (msg.type === 'terminal_output' && msg.sessionId) {
      const session = this.terminalSessions.get(msg.sessionId);
      if (session && session.clientWs.readyState === WebSocket.OPEN) {
        session.clientWs.send(JSON.stringify({ type: 'output', data: msg.data }));
      }
    }
  }

  // 2. Browser Client Terminal WebSocket Handler (xterm.js proxy)
  private setupTerminalWss() {
    this.terminalWss.on('connection', (clientWs: WebSocket, req: IncomingMessage) => {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      const vpsId = url.searchParams.get('vpsId');

      if (!token || !vpsId) {
        clientWs.close(4000, 'Token and vpsId parameters required');
        return;
      }

      // Verify JWT auth
      let user: AuthUser;
      try {
        user = jwt.verify(token, config.jwtSecret) as AuthUser;
      } catch (e) {
        clientWs.close(4001, 'Unauthorized');
        return;
      }

      // Fetch VPS
      const vps = db.prepare('SELECT * FROM vps_instances WHERE id = ?').get(vpsId) as any;
      if (!vps) {
        clientWs.close(4004, 'VPS not found');
        return;
      }

      if (user.role !== 'admin' && vps.user_id !== user.id) {
        clientWs.close(4003, 'Permission denied');
        return;
      }

      // Get Node Socket
      const nodeConn = this.nodeSockets.get(vps.node_id);
      if (!nodeConn || nodeConn.ws.readyState !== WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: 'output',
          data: `\r\n\x1b[31;1m[ERROR] Host Node (${vps.node_id}) is currently OFFLINE.\x1b[0m\r\nCannot attach web console. Please ensure node daemon is running.\r\n`
        }));
        return;
      }

      const sessionId = `term-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      this.terminalSessions.set(sessionId, { clientWs, nodeWs: nodeConn.ws, vpsId });

      // Instruct node to open terminal session
      nodeConn.ws.send(JSON.stringify({
        type: 'terminal_attach',
        sessionId,
        vpsId: vps.id,
        cols: parseInt(url.searchParams.get('cols') || '80', 10),
        rows: parseInt(url.searchParams.get('rows') || '24', 10)
      }));

      // Forward client keystrokes / resize to node
      clientWs.on('message', (data: Buffer | string) => {
        try {
          const clientMsg = JSON.parse(data.toString());
          if (clientMsg.type === 'input') {
            nodeConn.ws.send(JSON.stringify({
              type: 'terminal_input',
              sessionId,
              vpsId: vps.id,
              data: clientMsg.data
            }));
          } else if (clientMsg.type === 'resize') {
            nodeConn.ws.send(JSON.stringify({
              type: 'terminal_resize',
              sessionId,
              vpsId: vps.id,
              cols: clientMsg.cols,
              rows: clientMsg.rows
            }));
          }
        } catch (e) {
          // If raw string sent
          nodeConn.ws.send(JSON.stringify({
            type: 'terminal_input',
            sessionId,
            vpsId: vps.id,
            data: data.toString()
          }));
        }
      });

      clientWs.on('close', () => {
        if (nodeConn.ws.readyState === WebSocket.OPEN) {
          nodeConn.ws.send(JSON.stringify({
            type: 'terminal_detach',
            sessionId,
            vpsId: vps.id
          }));
        }
        this.terminalSessions.delete(sessionId);
      });
    });
  }

  // 3. Send command to node agent with Promise response
  public async sendCommandToNode(nodeId: string, action: string, payload: any, timeoutMs = 30000): Promise<any> {
    const conn = this.nodeSockets.get(nodeId);
    if (!conn || conn.ws.readyState !== WebSocket.OPEN) {
      throw new Error(`Worker Node [${nodeId}] is currently offline or unreachable`);
    }

    const commandId = `cmd-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingCommands.delete(commandId);
        reject(new Error(`Command '${action}' timed out after ${timeoutMs / 1000}s on node ${nodeId}`));
      }, timeoutMs);

      this.pendingCommands.set(commandId, { resolve, reject, timer });

      conn.ws.send(JSON.stringify({
        type: 'command',
        commandId,
        action,
        payload
      }));
    });
  }

  public isNodeOnline(nodeId: string): boolean {
    const conn = this.nodeSockets.get(nodeId);
    return !!conn && conn.ws.readyState === WebSocket.OPEN;
  }

  private startHeartbeatMonitor() {
    setInterval(() => {
      const now = Date.now();
      for (const [nodeId, conn] of this.nodeSockets.entries()) {
        if (now - conn.lastPing > 45000) { // 45s without ping
          console.warn(`[Hub] Node ${nodeId} heartbeat timed out. Marking offline.`);
          conn.ws.terminate();
          this.nodeSockets.delete(nodeId);
          db.prepare(`UPDATE nodes SET status = 'offline' WHERE id = ?`).run(nodeId);
        }
      }
    }, 15000);
  }
}

export const wsHub = new WebSocketHub();
