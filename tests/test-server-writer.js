import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  validateServerName,
  serverExistsInEnv,
  serverExistsInToml,
  addServerToEnv,
  addServerToToml,
  writeServerConfig,
} from '../src/server-writer.js';

let passed = 0;
function ok(label) { console.log(`\x1b[32m✓\x1b[0m ${label}`); passed++; }

const tmpdir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-ssh-writer-'));

// ── validateServerName ────────────────────────────────────────────────────────

function testValidateServerName() {
  const valid = ['myserver', 'web1', 'prod_db', 'a', 'A1_b2'];
  for (const name of valid) {
    assert.doesNotThrow(() => validateServerName(name), `"${name}" should be valid`);
  }
  ok('validateServerName: accepts valid names');

  const invalid = ['', '1server', 'my-server', 'my server', 'srv!', null, undefined];
  for (const name of invalid) {
    assert.throws(() => validateServerName(name), `"${name}" should be invalid`);
  }
  ok('validateServerName: rejects invalid names');
}

// ── serverExistsInEnv ─────────────────────────────────────────────────────────

function testServerExistsInEnv() {
  const dir = tmpdir();
  const envPath = path.join(dir, '.env');

  assert.strictEqual(serverExistsInEnv('myserver', envPath), false, 'returns false for missing file');
  ok('serverExistsInEnv: returns false when file does not exist');

  fs.writeFileSync(envPath, [
    'SSH_SERVER_MYSERVER_HOST=1.2.3.4',
    'SSH_SERVER_MYSERVER_USER=root',
    'SSH_SERVER_MYSERVER_PORT=22',
    '',
  ].join('\n'));

  assert.strictEqual(serverExistsInEnv('myserver', envPath), true);
  assert.strictEqual(serverExistsInEnv('MYSERVER', envPath), true, 'case-insensitive lookup');
  assert.strictEqual(serverExistsInEnv('other', envPath), false);
  ok('serverExistsInEnv: correctly detects existing and missing servers');
}

// ── serverExistsInToml ────────────────────────────────────────────────────────

function testServerExistsInToml() {
  const dir = tmpdir();
  const tomlPath = path.join(dir, 'ssh-config.toml');

  assert.strictEqual(serverExistsInToml('myserver', tomlPath), false, 'returns false for missing file');
  ok('serverExistsInToml: returns false when file does not exist');

  fs.writeFileSync(tomlPath, [
    '[ssh_servers.myserver]',
    'host = "1.2.3.4"',
    'user = "root"',
    'port = 22',
    '',
  ].join('\n'));

  assert.strictEqual(serverExistsInToml('myserver', tomlPath), true);
  assert.strictEqual(serverExistsInToml('MYSERVER', tomlPath), true, 'case-insensitive lookup');
  assert.strictEqual(serverExistsInToml('other', tomlPath), false);
  ok('serverExistsInToml: correctly detects existing and missing servers');

  // Invalid TOML — catch block must return false, not throw
  const badPath = path.join(dir, 'bad.toml');
  fs.writeFileSync(badPath, '[[[[invalid toml!!!', 'utf8');
  assert.strictEqual(serverExistsInToml('any', badPath), false);
  ok('serverExistsInToml: returns false for invalid TOML (catch branch)');
}

// ── addServerToEnv ────────────────────────────────────────────────────────────

function testAddServerToEnvPassword() {
  const dir = tmpdir();
  const envPath = path.join(dir, '.env');

  addServerToEnv(envPath, {
    name: 'prod',
    host: '10.0.0.1',
    user: 'ubuntu',
    port: 22,
    password: 'secret',
    description: 'Production server',
  });

  const content = fs.readFileSync(envPath, 'utf8');
  assert.ok(content.includes('SSH_SERVER_PROD_HOST=10.0.0.1'), 'HOST written');
  assert.ok(content.includes('SSH_SERVER_PROD_USER=ubuntu'), 'USER written');
  assert.ok(content.includes('SSH_SERVER_PROD_PORT=22'), 'PORT written');
  assert.ok(content.includes('SSH_SERVER_PROD_PASSWORD="secret"'), 'PASSWORD written');
  assert.ok(content.includes('SSH_SERVER_PROD_DESCRIPTION="Production server"'), 'DESCRIPTION written');
  assert.ok(!content.includes('KEYPATH'), 'no KEYPATH for password auth');
  ok('addServerToEnv: password auth writes correct .env block');
}

function testAddServerToEnvKey() {
  const dir = tmpdir();
  const envPath = path.join(dir, '.env');

  addServerToEnv(envPath, {
    name: 'staging',
    host: '10.0.0.2',
    user: 'root',
    port: 2222,
    keyPath: '~/.ssh/id_rsa',
  });

  const content = fs.readFileSync(envPath, 'utf8');
  assert.ok(content.includes('SSH_SERVER_STAGING_HOST=10.0.0.2'), 'HOST written');
  assert.ok(content.includes('SSH_SERVER_STAGING_PORT=2222'), 'PORT written');
  assert.ok(content.includes('SSH_SERVER_STAGING_KEYPATH=~/.ssh/id_rsa'), 'KEYPATH written');
  assert.ok(!content.includes('PASSWORD'), 'no PASSWORD for key auth');
  ok('addServerToEnv: key auth writes correct .env block');
}

function testAddServerToEnvOptionalFields() {
  const dir = tmpdir();
  const envPath = path.join(dir, '.env');

  addServerToEnv(envPath, { name: 'minimal', host: '1.1.1.1', user: 'root', port: 22 });

  const content = fs.readFileSync(envPath, 'utf8');
  assert.ok(!content.includes('PASSWORD'), 'no PASSWORD when not provided');
  assert.ok(!content.includes('KEYPATH'), 'no KEYPATH when not provided');
  assert.ok(!content.includes('PASSPHRASE'), 'no PASSPHRASE when not provided');
  assert.ok(!content.includes('DEFAULT_DIR'), 'no DEFAULT_DIR when not provided');
  assert.ok(!content.includes('DESCRIPTION'), 'no DESCRIPTION when not provided');
  ok('addServerToEnv: optional fields are omitted when not provided');

  // Now test with all optional fields present
  const envPath2 = path.join(dir, '.env2');
  addServerToEnv(envPath2, {
    name: 'full',
    host: '3.3.3.3',
    user: 'admin',
    port: 2222,
    keyPath: '~/.ssh/id_rsa',
    passphrase: 'mypass',
    defaultDir: '/var/www',
    description: 'Full server',
  });
  const content2 = fs.readFileSync(envPath2, 'utf8');
  assert.ok(content2.includes('PASSPHRASE="mypass"'), 'PASSPHRASE written when provided');
  assert.ok(content2.includes('DEFAULT_DIR=/var/www'), 'DEFAULT_DIR written when provided');
  ok('addServerToEnv: passphrase and defaultDir written when provided');
}

function testAddServerToEnvAppendsToExisting() {
  const dir = tmpdir();
  const envPath = path.join(dir, '.env');

  fs.writeFileSync(envPath, '# existing content\nSSH_SERVER_OLD_HOST=9.9.9.9\n');

  addServerToEnv(envPath, { name: 'newserver', host: '5.5.5.5', user: 'root', port: 22 });

  const content = fs.readFileSync(envPath, 'utf8');
  assert.ok(content.includes('SSH_SERVER_OLD_HOST=9.9.9.9'), 'existing content preserved');
  assert.ok(content.includes('SSH_SERVER_NEWSERVER_HOST=5.5.5.5'), 'new server appended');
  ok('addServerToEnv: appends to existing file without overwriting');
}

function testAddServerToEnvCreatesFile() {
  const dir = tmpdir();
  const envPath = path.join(dir, 'subdir', '.env');

  addServerToEnv(envPath, { name: 'fresh', host: '2.2.2.2', user: 'root', port: 22 });

  assert.ok(fs.existsSync(envPath), 'file created');
  const content = fs.readFileSync(envPath, 'utf8');
  assert.ok(content.includes('SSH_SERVER_FRESH_HOST=2.2.2.2'));
  ok('addServerToEnv: creates file and parent directories if they do not exist');
}

// ── addServerToToml ───────────────────────────────────────────────────────────

function testAddServerToTomlNew() {
  const dir = tmpdir();
  const tomlPath = path.join(dir, 'ssh-config.toml');

  addServerToToml(tomlPath, {
    name: 'web',
    host: '10.0.1.1',
    user: 'deploy',
    port: 22,
    description: 'Web frontend',
  });

  assert.ok(fs.existsSync(tomlPath), 'file created');
  const content = fs.readFileSync(tomlPath, 'utf8');
  assert.ok(content.includes('10.0.1.1'), 'host written');
  assert.ok(content.includes('deploy'), 'user written');
  assert.ok(content.includes('Web frontend'), 'description written');
  ok('addServerToToml: creates a new TOML file with server entry');
}

function testAddServerToTomlOptionalFields() {
  const dir = tmpdir();
  const tomlPath = path.join(dir, 'ssh-config.toml');

  addServerToToml(tomlPath, {
    name: 'fullserver',
    host: '10.0.2.1',
    user: 'root',
    port: 22,
    password: 'secret',
    keyPath: '~/.ssh/id_rsa',
    passphrase: 'keypass',
    defaultDir: '/var/app',
    description: 'Full options server',
  });

  const content = fs.readFileSync(tomlPath, 'utf8');
  assert.ok(content.includes('secret'), 'password written');
  assert.ok(content.includes('id_rsa'), 'key_path written');
  assert.ok(content.includes('keypass'), 'passphrase written');
  assert.ok(content.includes('/var/app'), 'default_dir written');
  ok('addServerToToml: writes all optional fields when provided');
}

function testAddServerToTomlNoSshServersSection() {
  const dir = tmpdir();
  const tomlPath = path.join(dir, 'ssh-config.toml');

  // TOML file with unrelated content but no [ssh_servers] section
  fs.writeFileSync(tomlPath, '[other_section]\nkey = "value"\n', 'utf8');

  addServerToToml(tomlPath, { name: 'newsrv', host: '5.5.5.5', user: 'root', port: 22 });

  const content = fs.readFileSync(tomlPath, 'utf8');
  assert.ok(content.includes('5.5.5.5'), 'server added to existing file without ssh_servers');
  assert.ok(content.includes('other_section') || content.includes('newsrv'), 'file updated');
  ok('addServerToToml: handles existing TOML file without ssh_servers section');
}

function testAddServerToTomlAppends() {
  const dir = tmpdir();
  const tomlPath = path.join(dir, 'ssh-config.toml');

  addServerToToml(tomlPath, { name: 'alpha', host: '1.1.1.1', user: 'root', port: 22 });
  addServerToToml(tomlPath, { name: 'beta', host: '2.2.2.2', user: 'root', port: 22 });

  const content = fs.readFileSync(tomlPath, 'utf8');
  assert.ok(content.includes('1.1.1.1'), 'alpha preserved');
  assert.ok(content.includes('2.2.2.2'), 'beta added');
  ok('addServerToToml: second call preserves existing entries');
}

function testAddServerToTomlCreatesParentDir() {
  const dir = tmpdir();
  const tomlPath = path.join(dir, 'subdir', 'ssh-config.toml');

  addServerToToml(tomlPath, { name: 'nested', host: '6.6.6.6', user: 'root', port: 22 });

  assert.ok(fs.existsSync(tomlPath), 'file created inside new subdirectory');
  const content = fs.readFileSync(tomlPath, 'utf8');
  assert.ok(content.includes('6.6.6.6'), 'host written');
  ok('addServerToToml: creates parent directory when it does not exist');
}

// ── writeServerConfig ─────────────────────────────────────────────────────────

function testWriteServerConfigEnv() {
  const dir = tmpdir();
  const envPath = path.join(dir, '.env');

  const result = writeServerConfig(
    { name: 'testenv', host: '3.3.3.3', user: 'root', port: 22 },
    { envPath, tomlPath: path.join(dir, 'unused.toml'), preferToml: false }
  );

  assert.strictEqual(result.format, 'env');
  assert.strictEqual(result.filePath, envPath);
  assert.ok(fs.existsSync(envPath));
  ok('writeServerConfig: writes to .env when preferToml is false');
}

function testWriteServerConfigToml() {
  const dir = tmpdir();
  const tomlPath = path.join(dir, 'ssh-config.toml');

  const result = writeServerConfig(
    { name: 'testtoml', host: '4.4.4.4', user: 'root', port: 22 },
    { envPath: path.join(dir, 'unused.env'), tomlPath, preferToml: true }
  );

  assert.strictEqual(result.format, 'toml');
  assert.strictEqual(result.filePath, tomlPath);
  assert.ok(fs.existsSync(tomlPath));
  ok('writeServerConfig: writes to TOML when preferToml is true');
}

function testWriteServerConfigEnvFallback() {
  const dir = tmpdir();
  const envPath = path.join(dir, 'via-env-var.env');
  const prevEnv = process.env.SSH_ENV_PATH;
  process.env.SSH_ENV_PATH = envPath;

  try {
    // No envPath in options — should fall back to SSH_ENV_PATH
    const result = writeServerConfig(
      { name: 'envfallback', host: '11.11.11.11', user: 'root', port: 22 },
      { tomlPath: path.join(dir, 'unused.toml'), preferToml: false }
    );
    assert.strictEqual(result.filePath, envPath);
    assert.ok(fs.existsSync(envPath));
    ok('writeServerConfig: falls back to SSH_ENV_PATH when envPath not in options');
  } finally {
    if (prevEnv !== undefined) {
      process.env.SSH_ENV_PATH = prevEnv;
    } else {
      delete process.env.SSH_ENV_PATH;
    }
  }
}

function testWriteServerConfigTomlFallback() {
  const dir = tmpdir();
  const tomlPath = path.join(dir, 'via-env-var.toml');
  const prevEnv = process.env.SSH_CONFIG_PATH;
  process.env.SSH_CONFIG_PATH = tomlPath;

  try {
    // No tomlPath in options — should fall back to SSH_CONFIG_PATH
    const result = writeServerConfig(
      { name: 'tomlfallback', host: '12.12.12.12', user: 'root', port: 22 },
      { envPath: path.join(dir, 'unused.env'), preferToml: true }
    );
    assert.strictEqual(result.filePath, tomlPath);
    assert.ok(fs.existsSync(tomlPath));
    ok('writeServerConfig: falls back to SSH_CONFIG_PATH when tomlPath not in options');
  } finally {
    if (prevEnv !== undefined) {
      process.env.SSH_CONFIG_PATH = prevEnv;
    } else {
      delete process.env.SSH_CONFIG_PATH;
    }
  }
}

function testWriteServerConfigPreferTomlFallback() {
  const dir = tmpdir();
  const envPath = path.join(dir, 'prefer-test.env');

  // No preferToml in options — falls back to PREFER_TOML_CONFIG env var (unset → false)
  const prevEnv = process.env.PREFER_TOML_CONFIG;
  delete process.env.PREFER_TOML_CONFIG;

  try {
    const result = writeServerConfig(
      { name: 'prefertest', host: '13.13.13.13', user: 'root', port: 22 },
      { envPath, tomlPath: path.join(dir, 'unused.toml') }
    );
    assert.strictEqual(result.format, 'env', 'defaults to env when PREFER_TOML_CONFIG unset');
    ok('writeServerConfig: preferToml ?? env var evaluated when not provided in options');
  } finally {
    if (prevEnv !== undefined) {
      process.env.PREFER_TOML_CONFIG = prevEnv;
    }
  }
}

// ── main ──────────────────────────────────────────────────────────────────────

function main() {
  testValidateServerName();
  testServerExistsInEnv();
  testServerExistsInToml();
  testAddServerToEnvPassword();
  testAddServerToEnvKey();
  testAddServerToEnvOptionalFields();
  testAddServerToEnvAppendsToExisting();
  testAddServerToEnvCreatesFile();
  testAddServerToTomlNew();
  testAddServerToTomlOptionalFields();
  testAddServerToTomlNoSshServersSection();
  testAddServerToTomlAppends();
  testAddServerToTomlCreatesParentDir();
  testWriteServerConfigEnv();
  testWriteServerConfigToml();
  testWriteServerConfigEnvFallback();
  testWriteServerConfigTomlFallback();
  testWriteServerConfigPreferTomlFallback();

  console.log(`\n✅ server-writer tests passed (${passed} checks)`);
}

main();
