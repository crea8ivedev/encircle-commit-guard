'use strict';

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const { minimatch } = require('minimatch');

// Jest/Mocha/Jasmine/Cypress style focus + skip modifiers.
const FOCUSED_REGEX = /\b(describe|it|test|context|specify)\.only\s*\(/;
const SKIPPED_REGEX = /\b(describe|it|test|context|specify)\.skip\s*\(/;
const JASMINE_FOCUSED_REGEX = /\b(fdescribe|fit)\s*\(/;
const JASMINE_SKIPPED_REGEX = /\b(xdescribe|xit)\s*\(/;

function matchesAny(filePath, patterns) {
  return patterns.some((pattern) => minimatch(filePath, pattern, { matchBase: true, dot: true }));
}

function isCommentLine(trimmed) {
  return trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*');
}

async function check(config, projectRoot) {
  const issues = [];
  const ftConfig = config.focusedTests || {};
  const includePatterns = ftConfig.include || ['**/*.{test,spec}.{ts,js,jsx,tsx}'];
  const excludePatterns = ftConfig.exclude || ['node_modules/**'];
  const failOnSkip = ftConfig.failOnSkip !== false; // default: true

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

      if (FOCUSED_REGEX.test(line) || JASMINE_FOCUSED_REGEX.test(line)) {
        issues.push({
          file: relPath,
          line: index + 1,
          message: `Focused test found (runs ONLY this block, skipping the rest of the suite): ${trimmed}`,
        });
      } else if (SKIPPED_REGEX.test(line) || JASMINE_SKIPPED_REGEX.test(line)) {
        issues.push({
          file: relPath,
          line: index + 1,
          message: `Skipped test found: ${trimmed}`,
          warning: !failOnSkip,
        });
      }
    });
  }

  const errors = issues.filter((i) => !i.warning);

  return {
    name: 'focusedTests',
    passed: errors.length === 0,
    issues,
  };
}

module.exports = { check };
