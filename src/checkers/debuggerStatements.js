'use strict';

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const { minimatch } = require('minimatch');

// Matches `debugger` used as a statement — e.g. `debugger;`, `if (x) debugger;`,
// a bare `debugger` on its own line — without matching identifiers that merely
// start with the word, like `debuggerFlag`.
const DEBUGGER_REGEX = /(?:^|[;{}]|\s)debugger\s*(?:;|$|\/\/)/;

function matchesAny(filePath, patterns) {
  return patterns.some((pattern) => minimatch(filePath, pattern, { matchBase: true, dot: true }));
}

function isCommentLine(trimmed) {
  return trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*');
}

async function check(config, projectRoot) {
  const issues = [];
  const debuggerConfig = config.debuggerStatements || {};
  const includePatterns = debuggerConfig.include || ['src/**/*.{ts,js,jsx,tsx}'];
  const excludePatterns = debuggerConfig.exclude || ['**/*.test.*', '**/*.spec.*'];

  const files = [];
  for (const pattern of includePatterns) {
    const matches = await glob(pattern, { cwd: projectRoot, dot: true, absolute: true });
    files.push(...matches);
  }

  const uniqueFiles = [...new Set(files)];

  for (const filePath of uniqueFiles) {
    const relPath = path.relative(projectRoot, filePath);

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
      const trimmed = line.trim();
      if (!trimmed || isCommentLine(trimmed)) {
        return;
      }

      if (DEBUGGER_REGEX.test(line)) {
        issues.push({
          file: relPath,
          line: index + 1,
          message: `debugger statement found: ${trimmed}`,
        });
      }
    });
  }

  return {
    name: 'debuggerStatements',
    passed: issues.length === 0,
    issues,
  };
}

module.exports = { check };
