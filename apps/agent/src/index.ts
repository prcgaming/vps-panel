import { NodeAgent } from './agent.js';

const agent = new NodeAgent();

process.on('SIGINT', () => {
  console.log('\n[Agent] Received SIGINT. Shutting down gracefully...');
  agent.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Agent] Received SIGTERM. Shutting down gracefully...');
  agent.stop();
  process.exit(0);
});

agent.start().catch((err) => {
  console.error('[Agent] Fatal error during startup:', err);
  process.exit(1);
});
