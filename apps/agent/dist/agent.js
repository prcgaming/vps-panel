import { WebSocket } from 'ws';
import { config } from './config.js';
import { getHostMetrics } from './metrics.js';
import { MockDriver } from './drivers/MockDriver.js';
import { DockerDriver } from './drivers/DockerDriver.js';
import { KvmDriver } from './drivers/KvmDriver.js';
export class NodeAgent {
    ws = null;
    driver;
    heartbeatTimer = null;
    reconnectTimer = null;
    terminalSessions = new Map();
    isRunning = false;
    constructor() {
        if (config.driver === 'docker') {
            this.driver = new DockerDriver();
        }
        else if (config.driver === 'kvm') {
            this.driver = new KvmDriver();
        }
        else {
            this.driver = new MockDriver();
        }
    }
    async start() {
        this.isRunning = true;
        console.log(`[Agent] Starting Worker Node Agent '${config.nodeName}' with driver '${this.driver.name}'...`);
        await this.driver.init();
        this.connect();
    }
    connect() {
        if (!this.isRunning)
            return;
        let wsUrl = config.masterUrl;
        if (wsUrl.startsWith('http://'))
            wsUrl = wsUrl.replace('http://', 'ws://');
        if (wsUrl.startsWith('https://'))
            wsUrl = wsUrl.replace('https://', 'wss://');
        if (!wsUrl.includes('/ws/node')) {
            wsUrl = `${wsUrl.replace(/\/$/, '')}/ws/node`;
        }
        const fullUrl = `${wsUrl}?token=${encodeURIComponent(config.nodeToken)}`;
        console.log(`[Agent] Connecting to Master Panel at ${wsUrl}...`);
        try {
            this.ws = new WebSocket(fullUrl);
            this.ws.on('open', () => {
                console.log(`[Agent] Connected and paired with Master Controller!`);
                this.sendHeartbeat();
                this.startHeartbeatLoop();
            });
            this.ws.on('message', async (data) => {
                try {
                    const msg = JSON.parse(data.toString());
                    await this.handleMasterMessage(msg);
                }
                catch (e) {
                    console.error('[Agent] Failed to handle message:', e);
                }
            });
            this.ws.on('close', (code, reason) => {
                console.warn(`[Agent] Connection lost (${code} - ${reason.toString() || 'closed'}). Reconnecting in 5s...`);
                this.cleanup();
                this.scheduleReconnect();
            });
            this.ws.on('error', (err) => {
                console.error(`[Agent] WebSocket error: ${err.message}`);
            });
        }
        catch (err) {
            console.error(`[Agent] Connection attempt failed: ${err.message}`);
            this.scheduleReconnect();
        }
    }
    async handleMasterMessage(msg) {
        // 1. Command handling
        if (msg.type === 'command' && msg.commandId) {
            const { commandId, action, payload } = msg;
            console.log(`[Agent] Executing action: ${action} for VPS: ${payload?.id || 'unknown'}`);
            try {
                let result = null;
                switch (action) {
                    case 'vps_create':
                        await this.driver.createVps(payload);
                        break;
                    case 'vps_start':
                        await this.driver.startVps(payload.id);
                        break;
                    case 'vps_stop':
                        await this.driver.stopVps(payload.id, payload.force);
                        break;
                    case 'vps_restart':
                        await this.driver.restartVps(payload.id);
                        break;
                    case 'vps_delete':
                        await this.driver.deleteVps(payload.id);
                        break;
                    case 'vps_reinstall':
                        await this.driver.reinstallVps(payload.id, payload.os_image, payload.root_password);
                        break;
                    default:
                        throw new Error(`Unsupported action: ${action}`);
                }
                this.send({
                    type: 'command_response',
                    commandId,
                    success: true,
                    data: result
                });
            }
            catch (err) {
                console.error(`[Agent] Action '${action}' failed:`, err);
                this.send({
                    type: 'command_response',
                    commandId,
                    success: false,
                    error: err.message
                });
            }
        }
        // 2. Web Console Terminal Session Attach
        if (msg.type === 'terminal_attach') {
            const { sessionId, vpsId, cols = 80, rows = 24 } = msg;
            console.log(`[Agent] Opening console session for VPS ${vpsId} (session: ${sessionId})`);
            const session = this.driver.attachTerminal(vpsId, (chunk) => {
                this.send({
                    type: 'terminal_output',
                    sessionId,
                    data: chunk
                });
            });
            session.resize(cols, rows);
            this.terminalSessions.set(sessionId, session);
        }
        // 3. Terminal Input Keystrokes
        if (msg.type === 'terminal_input' && msg.sessionId) {
            const session = this.terminalSessions.get(msg.sessionId);
            if (session) {
                session.write(msg.data);
            }
        }
        // 4. Terminal Resize
        if (msg.type === 'terminal_resize' && msg.sessionId) {
            const session = this.terminalSessions.get(msg.sessionId);
            if (session) {
                session.resize(msg.cols, msg.rows);
            }
        }
        // 5. Terminal Detach / Close
        if (msg.type === 'terminal_detach' && msg.sessionId) {
            const session = this.terminalSessions.get(msg.sessionId);
            if (session) {
                session.close();
                this.terminalSessions.delete(msg.sessionId);
            }
        }
    }
    sendHeartbeat() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN)
            return;
        const stats = getHostMetrics(this.driver.getRunningVpsCount());
        this.send({
            type: 'heartbeat',
            timestamp: Date.now(),
            driver: this.driver.name,
            stats
        });
    }
    startHeartbeatLoop() {
        if (this.heartbeatTimer)
            clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = setInterval(() => {
            this.sendHeartbeat();
        }, config.heartbeatIntervalMs);
    }
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    }
    scheduleReconnect() {
        if (this.reconnectTimer)
            clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
            this.connect();
        }, 5000);
    }
    cleanup() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        for (const session of this.terminalSessions.values()) {
            session.close();
        }
        this.terminalSessions.clear();
    }
    stop() {
        this.isRunning = false;
        this.cleanup();
        if (this.reconnectTimer)
            clearTimeout(this.reconnectTimer);
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        console.log('[Agent] Node agent stopped.');
    }
}
