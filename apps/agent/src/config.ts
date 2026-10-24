import dotenv from 'dotenv';
import os from 'os';

dotenv.config();

export const config = {
  masterUrl: process.env.MASTER_URL || 'ws://127.0.0.1:4000',
  nodeToken: process.env.NODE_TOKEN || 'token-node-eu-01-secret',
  nodeName: process.env.NODE_NAME || os.hostname(),
  nodeIp: process.env.NODE_IP || '127.0.0.1',
  driver: (process.env.DRIVER || 'mock').toLowerCase() as 'docker' | 'kvm' | 'mock',
  port: parseInt(process.env.PORT || '4001', 10),
  heartbeatIntervalMs: 10000
};
