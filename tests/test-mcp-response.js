import { normalizeToolResult, toolErrorResponse } from '../src/mcp-response.js';

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

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

console.log('\n' + YELLOW + 'Running MCP Response Tests...' + NC + '\n');

test('normalizeToolResult preserves successful responses', () => {
  const result = normalizeToolResult({
    content: [{ type: 'text', text: JSON.stringify({ success: true }) }],
  });
  assertTrue(!result.isError, 'Successful response should not be marked as error');
});

test('normalizeToolResult marks JSON success false as MCP error', () => {
  const result = normalizeToolResult({
    content: [{ type: 'text', text: JSON.stringify({ success: false, error: 'Denied' }) }],
  });
  assertEqual(result.isError, true, 'Failed JSON response should be marked as error');
});

test('normalizeToolResult marks text error prefix as MCP error', () => {
  const result = normalizeToolResult({
    content: [{ type: 'text', text: '❌ Failed to close tunnel' }],
  });
  assertEqual(result.isError, true, 'Error text response should be marked as error');
});

test('normalizeToolResult leaves non-object and plain isError responses stable', () => {
  assertEqual(normalizeToolResult(null), null, 'Null result should pass through');
  assertEqual(normalizeToolResult('ok'), 'ok', 'String result should pass through');
  const explicitError = normalizeToolResult({ isError: true });
  assertEqual(explicitError.isError, true, 'Explicit isError should be preserved without content');
});

test('normalizeToolResult ignores non-text and invalid JSON content', () => {
  const result = normalizeToolResult({
    content: [
      { type: 'image', data: 'abc' },
      { type: 'text', text: '{not-json' },
      { type: 'text', text: JSON.stringify({ ok: true }) },
    ],
  });
  assertTrue(!result.isError, 'Non-error mixed content should not be marked as error');
});

test('normalizeToolResult marks JSON error payload as MCP error', () => {
  const result = normalizeToolResult({
    content: [{ type: 'text', text: JSON.stringify({ error: 'Denied' }) }],
  });
  assertEqual(result.isError, true, 'JSON error payload should be marked as error');
});

test('toolErrorResponse returns isError true', () => {
  const result = toolErrorResponse(new Error('Boom'), { server: 'prod' });
  const payload = JSON.parse(result.content[0].text);
  assertEqual(result.isError, true, 'Error helper should set isError');
  assertEqual(payload.success, false, 'Payload should include success false');
  assertEqual(payload.error, 'Boom', 'Payload should include error message');
  assertEqual(payload.server, 'prod', 'Payload should include extra metadata');
});

test('toolErrorResponse accepts non-Error values', () => {
  const result = toolErrorResponse('plain failure');
  const payload = JSON.parse(result.content[0].text);
  assertEqual(payload.error, 'plain failure', 'String errors should be converted to message text');
});

console.log('\n' + '='.repeat(60));
console.log(`${GREEN}Passed: ${passedTests}${NC}`);
console.log(`${RED}Failed: ${failedTests}${NC}`);
console.log('='.repeat(60) + '\n');

process.exit(failedTests > 0 ? 1 : 0);
