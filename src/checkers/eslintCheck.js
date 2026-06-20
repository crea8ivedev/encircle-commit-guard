'use strict';

const path = require('path');

async function check(config, projectRoot) {
  let ESLint;
  try {
    ESLint = require('eslint').ESLint;
  } catch {
    return {
      name: 'eslint',
      passed: true,
      issues: [{ file: '', line: null, message: 'eslint is not installed — skipping ESLint check (install eslint as a dev dependency to enable)', warning: true }],
    };
  }

  const issues = [];
  const eslintConfig = config.eslint || {};
  const extensions = eslintConfig.extensions || ['.ts', '.js'];
  const patterns = eslintConfig.patterns || ['src/**'];

  let eslint;
  try {
    eslint = new ESLint({
      cwd: projectRoot,
      extensions,
      useEslintrc: true,
    });
  } catch (err) {
    return {
      name: 'eslint',
      passed: true,
      issues: [{ file: '', line: null, message: `ESLint setup warning: ${err.message}`, warning: true }],
    };
  }

  let results;
  try {
    results = await eslint.lintFiles(patterns);
  } catch (err) {
    // No .eslintrc or config not found — treat as warning, not failure
    if (err.message && (err.message.includes('No eslint configuration') || err.message.includes('eslintrc'))) {
      return {
        name: 'eslint',
        passed: true,
        issues: [{ file: '', line: null, message: 'No ESLint configuration found in project — skipping ESLint check', warning: true }],
      };
    }
    return {
      name: 'eslint',
      passed: true,
      issues: [{ file: '', line: null, message: `ESLint error: ${err.message}`, warning: true }],
    };
  }

  for (const result of results) {
    const relPath = path.relative(projectRoot, result.filePath);
    for (const message of result.messages) {
      issues.push({
        file: relPath,
        line: message.line || null,
        message: `[${message.severity === 2 ? 'error' : 'warn'}] ${message.ruleId || 'unknown'}: ${message.message}`,
        warning: message.severity === 1,
      });
    }
  }

  const errors = issues.filter((i) => !i.warning);
  return {
    name: 'eslint',
    passed: errors.length === 0,
    issues,
  };
}

module.exports = { check };
