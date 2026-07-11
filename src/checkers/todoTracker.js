'use strict';

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const { minimatch } = require('minimatch');

// Only counts a marker if it actually appears inside a comment, not e.g. a
// variable named `todoList` or a string that happens to contain the word.
const HAS_COMMENT_REGEX = /(\/\/|\/\*|^\s*\*)/;

function matchesAny(filePath, patterns) {
  return patterns.some((pattern) => minimatch(filePath, pattern, { matchBase: true, dot: true }));
}

async function check(config, projectRoot) {
  const issues = [];
  const todoConfig = config.todoTracker || {};
  const includePatterns = todoConfig.include || ['src/**/*.{ts,js,jsx,tsx}'];
  const excludePatterns = todoConfig.exclude || ['**/*.test.*', '**/*.spec.*'];
  const markers = todoConfig.markers || ['TODO', 'FIXME', 'HACK', 'XXX'];
  // By default these are informational (shown but don't fail the commit).
  // Set blocking: true to make them fail the check instead.
  const blocking = todoConfig.blocking === true;

  const markerPattern = new RegExp(`\\b(${markers.join('|')})\\b`);

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
      if (!HAS_COMMENT_REGEX.test(line)) {
        return;
      }
      const match = markerPattern.exec(line);
      if (match) {
        issues.push({
          file: relPath,
          line: index + 1,
          message: `${match[1]} comment found: ${line.trim()}`,
          warning: !blocking,
        });
      }
    });
  }

  const errors = issues.filter((i) => !i.warning);

  return {
    name: 'todoTracker',
    passed: errors.length === 0,
    issues,
  };
}

module.exports = { check };
