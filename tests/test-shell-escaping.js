import { shellArg, shellEnvAssignment } from '../src/shell-escape.js';
import { buildMySQLDumpCommand } from '../src/database-manager.js';
import { buildDeploymentStrategy } from '../src/deploy-helper.js';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const NC = '\x1b[0m';

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`${GREEN}✓${NC} ${name}`);
    passedTests++;
  } catch (error) {
    console.log(`${RED}✗${NC} ${name}`);
    console.log(`  ${RED}Error: ${error.message}${NC}`);
    failedTests++;
  }
}

function assertTrue(condition, message) {
  if (!condition) throw new Error(message);
}

console.log('\n' + YELLOW + 'Running Shell Escaping Tests...' + NC + '\n');

test('shellArg wraps values and escapes single quotes', () => {
  const escaped = shellArg('pa\'ss; rm -rf /');
  assertTrue(escaped.startsWith('\'') && escaped.endsWith('\''), 'value should be single-quoted');
  assertTrue(escaped.includes('\'"\'"\''), 'single quote should be escaped safely');
  assertTrue(shellArg(null) === '\'\'', 'null should become an empty shell string');
  assertTrue(shellArg(undefined) === '\'\'', 'undefined should become an empty shell string');
});

test('shellEnvAssignment escapes values', () => {
  const assignment = shellEnvAssignment('PGPASSWORD', 'pa\'ss');
  assertTrue(assignment === 'PGPASSWORD=\'pa\'"\'"\'ss\'', 'env assignment should be escaped');
  let invalidNameRejected = false;
  try {
    shellEnvAssignment('BAD-NAME', 'x');
  } catch (_error) {
    invalidNameRejected = true;
  }
  assertTrue(invalidNameRejected, 'invalid env name should throw');
});

test('database command builder escapes password and paths', () => {
  const command = buildMySQLDumpCommand({
    database: 'app db',
    user: 'root',
    password: 'p\'ass; touch /tmp/pwned',
    outputFile: '/tmp/app backup.sql.gz',
  });
  assertTrue(command.includes('-p\'p\'"\'"\'ass; touch /tmp/pwned\''), 'password should be quoted as one argument');
  assertTrue(command.includes('\'app db\''), 'database should be quoted');
  assertTrue(command.includes('> \'/tmp/app backup.sql.gz\''), 'output path should be quoted');
});

test('deploy strategy validates owner and permissions', () => {
  let rejectedOwner = false;
  let rejectedPerms = false;
  try {
    buildDeploymentStrategy('/etc/app.conf', { owner: 'root;rm -rf /' });
  } catch (_error) {
    rejectedOwner = true;
  }
  try {
    buildDeploymentStrategy('/etc/app.conf', { permissions: '644;rm -rf /' });
  } catch (_error) {
    rejectedPerms = true;
  }
  assertTrue(rejectedOwner, 'invalid owner should be rejected');
  assertTrue(rejectedPerms, 'invalid permissions should be rejected');
});

console.log('\n' + '='.repeat(60));
console.log(`${GREEN}Passed: ${passedTests}${NC}`);
console.log(`${RED}Failed: ${failedTests}${NC}`);
console.log('='.repeat(60) + '\n');

process.exit(failedTests > 0 ? 1 : 0);
