'use strict';

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const CONSOLE_REGEX = /console\.(log|warn|error|debug)\s*\(/;

function matchesAny(filePath, patterns) {
  const { minimatch } = require('minimatch');
  return patterns.some((pattern) => minimatch(filePath, pattern, { matchBase: true, dot: true }));
}

async function check(config, projectRoot) {
  const issues = [];
  const consoleConfig = config.consoleLogs || {};
  const includePatterns = consoleConfig.include || ['src/**/*.{ts,js}'];
  const excludePatterns = consoleConfig.exclude || ['**/*.test.*', '**/*.spec.*'];

  const files = [];
  for (const pattern of includePatterns) {
    const matches = await glob(pattern, { cwd: projectRoot, dot: true, absolute: true });
    files.push(...matches);
  }

  // Deduplicate
  const uniqueFiles = [...new Set(files)];

  for (const filePath of uniqueFiles) {
    const relPath = path.relative(projectRoot, filePath);

    // Check exclusions
    if (matchesAny(relPath, excludePatterns)) {
      continue;
    }

    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (CONSOLE_REGEX.test(line)) {
        issues.push({
          file: relPath,
          line: index + 1,
          message: `console statement found: ${line.trim()}`,
        });
      }
    });
  }

  return {
    name: 'consoleLogs',
    passed: issues.length === 0,
    issues,
  };
}

module.exports = { check };
