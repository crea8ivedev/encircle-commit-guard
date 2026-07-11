'use strict';

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const { minimatch } = require('minimatch');

// Matches `catch { ... }` or `catch (e) { ... }` / `catch (e: unknown) { ... }`,
// capturing the position of the opening brace.
const CATCH_REGEX = /\bcatch\s*(\([^)]*\))?\s*\{/g;

function matchesAny(filePath, patterns) {
  return patterns.some((pattern) => minimatch(filePath, pattern, { matchBase: true, dot: true }));
}

function lineAt(content, index) {
  return content.slice(0, index).split('\n').length;
}

// A block is "empty" only if the very next non-whitespace character after
// the opening brace is the closing brace. A block containing even just a
// comment (e.g. `catch { /* ignored intentionally */ }`) is NOT flagged —
// that's documented intent, not a silently swallowed error.
function isEmptyBlock(content, openBraceIndex) {
  let i = openBraceIndex + 1;
  while (i < content.length && /\s/.test(content[i])) {
    i++;
  }
  return content[i] === '}';
}

async function check(config, projectRoot) {
  const issues = [];
  const ecConfig = config.emptyCatch || {};
  const includePatterns = ecConfig.include || ['src/**/*.{ts,js,jsx,tsx}'];
  const excludePatterns = ecConfig.exclude || ['**/*.test.*', '**/*.spec.*'];

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

    CATCH_REGEX.lastIndex = 0;
    let match;
    while ((match = CATCH_REGEX.exec(content)) !== null) {
      const openBraceIndex = match.index + match[0].length - 1;
      if (isEmptyBlock(content, openBraceIndex)) {
        issues.push({
          file: relPath,
          line: lineAt(content, match.index),
          message: 'Empty catch block — the error is being silently swallowed. Log it, rethrow it, or add a comment explaining why it is intentionally ignored.',
        });
      }
    }
  }

  return {
    name: 'emptyCatch',
    passed: issues.length === 0,
    issues,
  };
}

module.exports = { check };
