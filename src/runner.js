'use strict';

const path = require('path');
const reporter = require('./reporter');

async function run(config, projectRoot) {
  if (!projectRoot) {
    projectRoot = process.cwd();
  }

  const resolvedRoot = path.resolve(projectRoot, config.root || '.');
  const results = [];

  const checkers = [
    { key: 'structure', module: './checkers/structure' },
    { key: 'consoleLogs', module: './checkers/consoleLogs' },
    { key: 'eslint', module: './checkers/eslintCheck' },
    { key: 'deadImports', module: './checkers/deadImports' },
  ];

  for (const { key, module: modulePath } of checkers) {
    if (config[key] === false) {
      continue;
    }

    let checker;
    try {
      checker = require(modulePath);
    } catch (err) {
      results.push({
        name: key,
        passed: false,
        issues: [{ file: '', line: null, message: `Failed to load checker: ${err.message}` }],
      });
      continue;
    }

    try {
      const result = await checker.check(config, resolvedRoot);
      results.push(result);
    } catch (err) {
      results.push({
        name: key,
        passed: false,
        issues: [{ file: '', line: null, message: `Checker crashed: ${err.message}` }],
      });
    }
  }

  reporter.report(results);

  const allPassed = results.every((r) => r.passed);
  return allPassed;
}

module.exports = { run };
