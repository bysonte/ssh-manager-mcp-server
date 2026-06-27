import fs from 'fs';
import os from 'os';
import path from 'path';
import TOML from '@iarna/toml';

const VALID_SERVER_NAME = /^[a-zA-Z][a-zA-Z0-9_]*$/;

export function validateServerName(name) {
  if (!name || !VALID_SERVER_NAME.test(name)) {
    throw new Error(
      `Invalid server name "${name}". Use only letters, numbers, and underscores, starting with a letter.`
    );
  }
}

export function serverExistsInEnv(name, envPath) {
  if (!envPath || !fs.existsSync(envPath)) return false;
  const upperName = name.toUpperCase();
  const content = fs.readFileSync(envPath, 'utf8');
  return content.includes(`SSH_SERVER_${upperName}_HOST=`);
}

export function serverExistsInToml(name, tomlPath) {
  if (!tomlPath || !fs.existsSync(tomlPath)) return false;
  try {
    const content = fs.readFileSync(tomlPath, 'utf8');
    const config = TOML.parse(content);
    return !!(config.ssh_servers && config.ssh_servers[name.toLowerCase()]);
  } catch {
    return false;
  }
}

export function addServerToEnv(envPath, config) {
  const { name, host, user = 'root', port = 22, password, keyPath, passphrase, defaultDir, description } = config;
  const upperName = name.toUpperCase();

  const lines = [
    '',
    `# Server: ${name}`,
    `SSH_SERVER_${upperName}_HOST=${host}`,
    `SSH_SERVER_${upperName}_USER=${user}`,
    `SSH_SERVER_${upperName}_PORT=${port}`,
  ];

  if (password) lines.push(`SSH_SERVER_${upperName}_PASSWORD="${password}"`);
  if (keyPath) lines.push(`SSH_SERVER_${upperName}_KEYPATH=${keyPath}`);
  if (passphrase) lines.push(`SSH_SERVER_${upperName}_PASSPHRASE="${passphrase}"`);
  if (defaultDir) lines.push(`SSH_SERVER_${upperName}_DEFAULT_DIR=${defaultDir}`);
  if (description) lines.push(`SSH_SERVER_${upperName}_DESCRIPTION="${description}"`);
  lines.push('');

  if (!fs.existsSync(envPath)) {
    const dir = path.dirname(envPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(envPath, '', 'utf8');
  }

  fs.appendFileSync(envPath, lines.join('\n'), 'utf8');
}

export function addServerToToml(tomlPath, config) {
  const { name, host, user = 'root', port = 22, password, keyPath, passphrase, defaultDir, description } = config;

  let tomlConfig = { ssh_servers: {} };

  if (fs.existsSync(tomlPath)) {
    const content = fs.readFileSync(tomlPath, 'utf8');
    tomlConfig = TOML.parse(content);
    if (!tomlConfig.ssh_servers) tomlConfig.ssh_servers = {};
  } else {
    const dir = path.dirname(tomlPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const serverEntry = { host, user, port };
  if (password) serverEntry.password = password;
  if (keyPath) serverEntry.key_path = keyPath;
  if (passphrase) serverEntry.passphrase = passphrase;
  if (defaultDir) serverEntry.default_dir = defaultDir;
  if (description) serverEntry.description = description;

  tomlConfig.ssh_servers[name.toLowerCase()] = serverEntry;

  fs.writeFileSync(tomlPath, TOML.stringify(tomlConfig), 'utf8');
}

export function writeServerConfig(config, options = {}) {
  const envPath = options.envPath ||
    process.env.SSH_ENV_PATH ||
    path.join(os.homedir(), '.ssh-manager', '.env');

  const tomlPath = options.tomlPath ||
    process.env.SSH_CONFIG_PATH ||
    path.join(os.homedir(), '.codex', 'ssh-config.toml');

  const preferToml = options.preferToml ?? (process.env.PREFER_TOML_CONFIG === 'true');

  if (preferToml) {
    addServerToToml(tomlPath, config);
    return { format: 'toml', filePath: tomlPath };
  }

  addServerToEnv(envPath, config);
  return { format: 'env', filePath: envPath };
}
