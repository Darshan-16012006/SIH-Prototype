const { fork, spawn } = require('child_process');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', '====================================================');
console.log('\x1b[36m%s\x1b[0m', '🚀 SIH 2026 Integrated Project Monitoring System');
console.log('\x1b[36m%s\x1b[0m', '   Team Titans — Problem Statement 26103');
console.log('\x1b[36m%s\x1b[0m', '====================================================\n');

// 1. Fork Backend API Server (Node built-in, no Python needed)
const backendScript = path.join(__dirname, 'backend', 'server.js');
const backend = fork(backendScript, [], { stdio: 'inherit' });

backend.on('error', (err) => {
  console.error('\x1b[31m[Backend Error]\x1b[0m', err.message);
});

// 2. Spawn Frontend Vite Dev Server
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true   // required on Windows for npm/npx
});

frontend.on('error', (err) => {
  console.error('\x1b[31m[Frontend Error]\x1b[0m', err.message);
});

const cleanup = () => {
  console.log('\n\x1b[33m%s\x1b[0m', 'Shutting down SIH 2026 servers...');
  try { backend.kill(); } catch (e) {}
  try { frontend.kill(); } catch (e) {}
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
