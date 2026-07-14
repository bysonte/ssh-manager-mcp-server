import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { ToolConfigManager } from '../src/tool-config-manager.js';

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-ssh-tools-'));
const configPath = path.join(directory, 'tools-config.json');

try {
  const defaultManager = new ToolConfigManager(configPath);
  await defaultManager.load();
  assert.strictEqual(defaultManager.getSummary().mode, 'agentic');
  assert.strictEqual(defaultManager.getSummary().enabledCount, 17);
  assert.strictEqual(defaultManager.isToolEnabled('ssh_execute'), true);
  assert.strictEqual(defaultManager.isToolEnabled('ssh_add_server'), false);

  fs.writeFileSync(configPath, JSON.stringify({ version: '1.0', mode: 'all', groups: {}, tools: {} }));
  const existingManager = new ToolConfigManager(configPath);
  await existingManager.load();
  assert.strictEqual(existingManager.getSummary().mode, 'all');
  assert.strictEqual(existingManager.getSummary().enabledCount, 38);

  console.log('Tool configuration profiles passed');
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
