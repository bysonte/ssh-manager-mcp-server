import { EventEmitter } from 'events';
import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';

import * as backup from '../src/backup-manager.js';
import * as db from '../src/database-manager.js';
import * as health from '../src/health-monitor.js';
import * as deploy from '../src/deploy-helper.js';
import * as groups from '../src/server-groups.js';
import * as sessions from '../src/session-manager.js';
import * as tunnels from '../src/tunnel-manager.js';
import SSHManager from '../src/ssh-manager.js';
import {
  isHostKnown,
  getCurrentHostKey,
  listKnownHosts,
  detectSSHKeyError,
  extractHostFromSSHError,
  addHostKey,
  setKnownHostsPathForTesting
} from '../src/ssh-key-manager.js';

const testKnownHostsDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-ssh-known-hosts-'));
const testKnownHostsPath = path.join(testKnownHostsDirectory, 'known_hosts');
setKnownHostsPathForTesting(testKnownHostsPath);

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const NC = '\x1b[0m';

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  Promise.resolve()
    .then(fn)
    .then(() => {
      console.log(`${GREEN}✓${NC} ${name}`);
      passedTests++;
    })
    .catch((error) => {
      console.log(`${RED}✗${NC} ${name}`);
      console.log(`  ${RED}Error: ${error.stack || error.message}${NC}`);
      failedTests++;
    });
}

const registered = [];
function register(name, fn) {
  registered.push({ name, fn });
}

function assertIncludes(value, needle) {
  assert.ok(value.includes(needle), `Expected ${JSON.stringify(value)} to include ${JSON.stringify(needle)}`);
}

console.log('\n' + YELLOW + 'Running Manager Unit Tests...' + NC + '\n');

register('backup manager builds commands and parses metadata', () => {
  const id = backup.generateBackupId('mysql', 'main');
  assert.match(id, /^mysql_main_/);
  assert.strictEqual(backup.getBackupMetadataPath('b1', '/tmp/backups'), path.join('/tmp/backups', 'b1.meta.json'));
  assert.strictEqual(backup.getBackupFilePath('b1', '/tmp/backups', '.sql'), path.join('/tmp/backups', 'b1.sql'));

  assertIncludes(backup.buildMySQLDumpCommand({ database: 'app', user: 'root', password: 'pw', outputFile: '/b.sql.gz' }), 'mysqldump');
  assertIncludes(backup.buildPostgreSQLDumpCommand({ database: 'app', user: 'pg', password: 'pw', outputFile: '/b.dump', compress: false }), 'PGPASSWORD=');
  assertIncludes(backup.buildMongoDBDumpCommand({ database: 'app', outputDir: '/tmp/mongo' }), 'mongodump');
  assert.strictEqual(backup.buildFilesBackupCommand({ paths: ['/etc', '/var/www'], outputFile: '/b.tgz', exclude: ['*.log'] }), 'tar -czf \'/b.tgz\' --exclude=\'*.log\' \'/etc\' \'/var/www\'');
  assert.throws(() => backup.buildFilesBackupCommand({ paths: [], outputFile: '/b.tgz' }), /paths/);

  assertIncludes(backup.buildRestoreCommand(backup.BACKUP_TYPES.MYSQL, '/b.sql.gz', { database: 'app' }), 'gunzip -c');
  assertIncludes(backup.buildRestoreCommand(backup.BACKUP_TYPES.POSTGRESQL, '/b.dump', { database: 'app' }), 'pg_restore');
  assertIncludes(backup.buildRestoreCommand(backup.BACKUP_TYPES.MONGODB, '/b.tar.gz', {}), 'mongorestore');
  assertIncludes(backup.buildRestoreCommand(backup.BACKUP_TYPES.FILES, '/b.tgz', { targetPath: '/restore' }), '-C');
  assert.throws(() => backup.buildRestoreCommand('bad', '/b'), /Unknown backup type/);

  const metadata = backup.createBackupMetadata('id1', 'files', { server: 's1', paths: ['/etc'], compress: false, retention: 3 });
  assert.strictEqual(metadata.compressed, false);
  assertIncludes(backup.buildSaveMetadataCommand({ name: 'a\'b' }, '/tmp/m.json'), 'a\'\\\'\'b');
  assertIncludes(backup.buildListBackupsCommand('/b', 'mysql'), 'grep "mysql_"');
  assert.deepStrictEqual(backup.parseBackupsList(''), []);
  const list = backup.parseBackupsList('{"id":"old","created_at":"2020-01-01T00:00:00.000Z"}\n---\n{"id":"new","created_at":"2021-01-01T00:00:00.000Z"}\n---');
  assert.strictEqual(list[0].id, 'new');
  assertIncludes(backup.buildCleanupCommand('/b', 9), '-mtime +9');
  assertIncludes(backup.buildCronScheduleCommand('0 2 * * *', 'echo ok', 'backup'), 'crontab -');
});

register('database manager builds safe database commands', () => {
  assertIncludes(db.buildMySQLDumpCommand({ database: 'app', outputFile: '/tmp/a.sql', tables: ['users'], compress: false }), '\'users\'');
  assertIncludes(db.buildPostgreSQLDumpCommand({ database: 'app', outputFile: '/tmp/a.dump', tables: ['public.users'] }), '-t \'public.users\'');
  assertIncludes(db.buildMongoDBDumpCommand({ database: 'app', outputDir: '/tmp/m', collections: ['users'], compress: false }), '--collection \'users\'');
  assertIncludes(db.buildMySQLImportCommand({ database: 'app', inputFile: '/tmp/a.sql.gz' }), 'gunzip -c');
  assertIncludes(db.buildPostgreSQLImportCommand({ database: 'app', inputFile: '/tmp/a.dump' }), 'pg_restore');
  assertIncludes(db.buildMongoDBRestoreCommand({ inputPath: '/tmp/m.tar.gz', drop: false }), 'tar -xzf');
  assertIncludes(db.buildMySQLListDatabasesCommand({}), 'SHOW DATABASES');
  assertIncludes(db.buildMySQLListTablesCommand({ database: 'app' }), 'SHOW TABLES');
  assertIncludes(db.buildPostgreSQLListDatabasesCommand({}), 'pg_database');
  assertIncludes(db.buildPostgreSQLListTablesCommand({ database: 'app' }), 'pg_tables');
  assertIncludes(db.buildMongoDBListDatabasesCommand({}), 'listDatabases');
  assertIncludes(db.buildMongoDBListCollectionsCommand({ database: 'app' }), 'getCollectionNames');
  assertIncludes(db.buildMySQLQueryCommand({ database: 'app', query: 'SELECT * FROM users' }), 'mysql');
  assertIncludes(db.buildPostgreSQLQueryCommand({ database: 'app', query: 'select 1' }), 'psql');
  assertIncludes(db.buildMongoDBQueryCommand({ database: 'app', collection: 'users', query: '{"active":true}' }), 'find');
  assert.throws(() => db.buildMySQLQueryCommand({ database: 'app', query: 'DELETE FROM users' }), /Only SELECT/);
  assert.strictEqual(db.isSafeQuery(' select name from users '), true);
  assert.strictEqual(db.isSafeQuery('select * from users; drop table users'), false);
  assert.strictEqual(db.isSafeQuery('select * into outfile \'/tmp/users\' from users'), false);
  assert.throws(() => db.buildMongoDBQueryCommand({ database: 'app', collection: 'users', query: '{active:true}' }), /valid JSON/);
  assert.deepStrictEqual(db.parseDatabaseList('mysql\napp\nsys\n', db.DB_TYPES.MYSQL), ['app']);
  assert.deepStrictEqual(db.parseTableList('users\norders\n'), ['users', 'orders']);
  assert.strictEqual(db.parseSize('abc'), 0);
  assert.strictEqual(db.formatBytes(1024 * 1024), '1 MB');
});

register('health monitor parses checks and validates process commands', () => {
  assertIncludes(health.buildServiceStatusCommand('nginx'), 'systemctl is-active \'nginx\'');
  assert.deepStrictEqual(health.parseServiceStatus('ACTIVE\nENABLED\n123\nrunning', 'nginx'), {
    name: 'nginx', status: 'running', enabled: 'yes', pid: 123, details: 'running', health: health.HEALTH_STATUS.HEALTHY
  });
  assertIncludes(health.buildProcessListCommand({ sortBy: 'memory', limit: 5, filter: 'node' }), 'grep -i -- \'node\'');
  assert.deepStrictEqual(health.parseProcessList('{"pid":1,"command":"init"}\nnot-json'), [{ pid: 1, command: 'init' }]);
  assert.strictEqual(health.buildKillProcessCommand(42, 'KILL'), 'kill -KILL 42');
  assert.throws(() => health.buildKillProcessCommand(0), /Invalid PID/);
  assert.throws(() => health.buildKillProcessCommand(42, 'BAD'), /Invalid signal/);
  assertIncludes(health.buildProcessInfoCommand(42), 'ps -p 42');
  assert.strictEqual(health.createAlertConfig({ cpu: 70 }).cpu, 70);
  assertIncludes(health.buildSaveAlertConfigCommand({ a: 'b\'c' }, '/tmp/a.json'), 'b\'\\\'\'c');
  assert.strictEqual(health.buildLoadAlertConfigCommand('/tmp/a.json'), 'cat "/tmp/a.json" 2>/dev/null || echo \'{}\'');
  const alerts = health.checkAlertThresholds({ cpu: { percent: 90 }, memory: { percent: 91 }, disks: [{ mount: '/', percent: 99 }] }, { cpu: 80, memory: 90, disk: 85 });
  assert.deepStrictEqual(alerts.map(a => a.type), ['cpu', 'memory', 'disk']);
  const output = '=== CPU ===\n10\n=== MEMORY ===\n{"total":100,"used":20,"free":80,"percent":20}\n=== DISK ===\n{"mount":"/","size":"10G","used":"1G","avail":"9G","percent":10}\n=== LOAD ===\n0.1 0.2 0.3\n=== UPTIME ===\nup 1 day\n=== NETWORK ===\n{"interface":"eth0","rx_bytes":1048576,"tx_bytes":2097152}';
  const parsed = health.parseComprehensiveHealthCheck(output);
  assert.strictEqual(parsed.overall_status, health.HEALTH_STATUS.HEALTHY);
  assert.strictEqual(health.resolveServiceName('postgresql'), 'postgresql');
});

register('deployment helper covers direct, backup and sudo strategies', () => {
  assert.match(deploy.getTempFilename('/etc/nginx/nginx.conf'), /^\/tmp\/nginx_\d+_[a-f0-9]+\.conf$/);
  assert.strictEqual(deploy.detectDeploymentNeeds('/etc/app.conf').sudo, true);
  assert.strictEqual(deploy.detectDeploymentNeeds('/tmp/app.conf').sudo, false);
  const direct = deploy.buildDeploymentStrategy('/tmp/app.conf', {});
  assert.strictEqual(direct.requiresSudo, false);
  const backupStrategy = deploy.buildDeploymentStrategy('/tmp/app.conf', { backup: true, owner: 'root:root', permissions: '644', restart: 'nginx' });
  assert.strictEqual(backupStrategy.requiresSudo, true);
  assert.ok(backupStrategy.steps.some(step => step.command.includes('cp')));
  const sudo = deploy.buildDeploymentStrategy('/etc/app.conf', { sudoPassword: 'pw' });
  assert.strictEqual(sudo.requiresSudo, true);
  assert.throws(() => deploy.buildDeploymentStrategy('/etc/app.conf', { permissions: 'bad' }), /permissions/);
});

register('server groups execute parallel and sequential flows without SSH', async () => {
  const groupName = `unit-${Date.now()}`;
  const created = groups.createGroup(groupName, ['A', 'B'], { overwrite: true, strategy: 'parallel' });
  assert.deepStrictEqual(created.servers, ['A', 'B']);
  groups.addServersToGroup(groupName, ['b', 'c']);
  assert.ok(groups.listGroups().some(group => group.name === groupName));
  const parallel = await groups.executeOnGroup(groupName, async server => `ok:${server}`, { strategy: 'parallel' });
  assert.strictEqual(parallel.summary.successful, 4);
  groups.updateGroup(groupName, { strategy: 'sequential', stopOnError: true, servers: ['ok', 'bad', 'skip'] });
  const sequential = await groups.executeOnGroup(groupName, async server => {
    if (server === 'bad') throw new Error('boom');
    return server;
  });
  assert.strictEqual(sequential.summary.total, 2);
  groups.removeServersFromGroup(groupName, ['ok']);
  await assert.rejects(() => groups.executeOnGroup(groupName, async () => null, { strategy: 'unknown' }), /Unknown execution strategy/);
  assert.strictEqual(groups.deleteGroup(groupName), true);
});

class MockShell extends EventEmitter {
  constructor() {
    super();
    this.stderr = new EventEmitter();
    this.writes = [];
  }
  write(command) {
    this.writes.push(command);
    const ready = command.match(/printf '\\n(ready_[a-f0-9]+)\\n'/);
    if (ready) setImmediate(() => this.emit('data', `\n${ready[1]}\n`));
    const cmd = command.match(/printf '\\n(cmd_[a-f0-9]+):%s\\n'/);
    if (cmd) setImmediate(() => this.emit('data', `command output\n${cmd[1]}:0\n`));
  }
  end() {
    this.emit('close');
  }
}

register('session manager runs shell sessions with mocked shell', async () => {
  const shell = new MockShell();
  const ssh = { requestShell: async () => shell };
  const session = await sessions.createSession('mock-server', ssh);
  assert.strictEqual(session.serverName, 'mock-server');
  session.setVariable('token', 'abc');
  assert.strictEqual(session.getVariable('token'), 'abc');
  const result = await session.execute('echo hello');
  assert.strictEqual(result.success, true);
  assert.ok(sessions.listSessions().some(item => item.id === session.id));
  assert.strictEqual(sessions.getSession(session.id), session);
  assert.strictEqual(sessions.closeSession(session.id), true);
  assert.throws(() => sessions.getSession(session.id), /not found|closed/);
});

register('tunnel manager validates config and lists mocked tunnels', async () => {
  await assert.rejects(() => tunnels.createTunnel('s', {}, { type: 'bad', localPort: 1234 }), /Invalid tunnel type/);
  await assert.rejects(() => tunnels.createTunnel('s', {}, { type: 'local', localPort: 1234 }), /Remote host/);
  await assert.rejects(() => tunnels.createTunnel('s', {}, { type: 'dynamic' }), /Local port/);
  const ssh = {
    forwardIn: async () => {},
    unforwardIn: async () => {},
    on: () => {}
  };
  const tunnel = await tunnels.createTunnel('server-a', ssh, { type: 'remote', localHost: '127.0.0.1', localPort: 8080, remoteHost: '0.0.0.0', remotePort: 9000 });
  assert.strictEqual(tunnel.getInfo().state, 'active');
  assert.ok(tunnels.listTunnels('server-a').some(item => item.id === tunnel.id));
  assert.strictEqual(tunnels.closeTunnel(tunnel.id), true);
  assert.throws(() => tunnels.closeTunnel('missing'), /not found/);
  assert.strictEqual(tunnels.closeServerTunnels('server-a'), 0);
});

register('ssh manager methods use mocked client and sftp only', async () => {
  const manager = new SSHManager({ host: 'example', user: 'u', hostKeyVerification: false });
  let ended = false;
  const stream = new EventEmitter();
  stream.stderr = new EventEmitter();
  stream.write = () => {};
  stream.end = () => {};
  stream.destroy = () => {};
  manager.client = {
    destroyed: false,
    exec: (command, cb) => {
      setImmediate(() => {
        cb(null, stream);
        setImmediate(() => {
          stream.emit('data', command.includes('echo ping') ? 'ping\n' : '/home/mock\n');
          stream.stderr.emit('data', '');
          stream.emit('close', 0, null);
        });
      });
    },
    sftp: (cb) => cb(null, {
      fastPut: (_local, _remote, cb2) => cb2(null),
      fastGet: (_remote, _local, cb2) => cb2(null),
      end: () => { ended = true; }
    }),
    shell: (_options, cb) => cb(null, stream),
    forwardOut: (_src, _srcPort, _dst, _dstPort, cb) => cb(null, stream),
    end: () => { ended = true; }
  };
  manager.connected = true;
  assert.strictEqual(await manager.ping(), true);
  assert.strictEqual(await manager.resolveHomePath(), '/home/mock');
  const temp = new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1');
  await manager.putFile(temp, '~/remote');
  await manager.getFile('/tmp/local', '~/remote');
  const results = await manager.putFiles([{ local: temp, remote: '/r' }]);
  assert.strictEqual(results[0].success, true);
  assert.strictEqual(manager.isConnected(), true);
  assert.strictEqual(await manager.forwardOut('127.0.0.1', 1, '127.0.0.1', 2), stream);
  manager.dispose();
  assert.strictEqual(ended, true);
});

register('ssh key manager reads local known_hosts safely', async () => {
  const key = Buffer.from('fake-key').toString('base64');
  try {
    await addHostKey('unit.local', 2222, `[unit.local]:2222 ssh-ed25519 ${key} unit-test`);
    assert.strictEqual(isHostKnown('unit.local', 2222), true);
    assert.ok(getCurrentHostKey('unit.local', 2222)[0].fingerprint.startsWith('SHA256:'));
    assert.ok(listKnownHosts().some(host => host.host === 'unit.local' && host.port === 2222));
    assert.strictEqual(detectSSHKeyError('WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED'), true);
    assert.deepStrictEqual(extractHostFromSSHError('Host key for [unit.local]:2222 has changed'), { host: 'unit.local', port: 2222 });
    assert.strictEqual(extractHostFromSSHError('plain error'), null);
  } finally {
    fs.rmSync(testKnownHostsDirectory, { recursive: true, force: true });
  }
});

for (const item of registered) {
  test(item.name, item.fn);
}

process.on('beforeExit', () => {
  console.log('\n' + '='.repeat(60));
  console.log(`${GREEN}Passed: ${passedTests}${NC}`);
  console.log(`${RED}Failed: ${failedTests}${NC}`);
  console.log('='.repeat(60) + '\n');
  if (failedTests > 0) process.exitCode = 1;
});
