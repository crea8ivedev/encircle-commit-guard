'use strict';

// Messages that don't actually describe anything — block these by default.
const GENERIC_MESSAGES = new Set([
  'fix', 'fixes', 'fixed', 'fix bug', 'bug fix',
  'update', 'updates', 'updated',
  'wip', 'test', 'tests', 'testing',
  'temp', 'tmp', 'asdf', 'changes', 'change',
  'stuff', 'misc', 'minor fix', 'small fix', 'quick fix',
  '.', 'commit', 'checkpoint', 'x',
]);

// Validates a raw commit message (as read from the file git passes to the
// commit-msg hook). Unlike the other checkers this doesn't scan project
// files — it's invoked separately via `commit-guard commit-msg <file>`.
function checkMessage(config, rawMessage) {
  const msgConfig = config.commitMessage || {};
  const issues = [];

  // Strip git's comment lines (start with '#') and surrounding whitespace.
  const cleaned = (rawMessage || '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n')
    .trim();

  const headerLine = cleaned.split('\n')[0] || '';

  const minLength = msgConfig.minLength != null ? msgConfig.minLength : 10;
  const maxHeaderLength = msgConfig.maxHeaderLength != null ? msgConfig.maxHeaderLength : 100;
  const disallowGeneric = msgConfig.disallowGeneric !== false; // default: on
  const pattern = msgConfig.pattern || null;

  if (!cleaned) {
    issues.push({ file: '', line: null, message: 'Commit message is empty' });
    return { name: 'commitMessage', passed: false, issues };
  }

  if (cleaned.length < minLength) {
    issues.push({
      file: '',
      line: null,
      message: `Commit message is too short (${cleaned.length} < ${minLength} characters): "${headerLine}"`,
    });
  }

  if (headerLine.length > maxHeaderLength) {
    issues.push({
      file: '',
      line: null,
      message: `First line is too long (${headerLine.length} > ${maxHeaderLength} characters)`,
    });
  }

  if (disallowGeneric && GENERIC_MESSAGES.has(headerLine.trim().toLowerCase())) {
    issues.push({
      file: '',
      line: null,
      message: `Commit message is too generic: "${headerLine}" — describe what actually changed`,
    });
  }

  if (pattern && !pattern.test(headerLine)) {
    issues.push({
      file: '',
      line: null,
      message: `Commit message does not match the required pattern (${pattern}): "${headerLine}"`,
    });
  }

  return {
    name: 'commitMessage',
    passed: issues.length === 0,
    issues,
  };
}

module.exports = { checkMessage };
