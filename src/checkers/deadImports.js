'use strict';

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Match: import { X, Y, Z } from '...'
const NAMED_IMPORT_REGEX = /^import\s*\{([^}]+)\}\s*from\s*['"][^'"]+['"]/;
// Match: import X from '...'
const DEFAULT_IMPORT_REGEX = /^import\s+(\w+)\s+from\s*['"][^'"]+['"]/;
// Match: import * as X from '...'
const NAMESPACE_IMPORT_REGEX = /^import\s+\*\s+as\s+(\w+)\s+from\s*['"][^'"]+['"]/;

function countOccurrences(content, symbol) {
  // Use word boundary to avoid partial matches
  const regex = new RegExp(`\\b${symbol}\\b`, 'g');
  const matches = content.match(regex);
  return matches ? matches.length : 0;
}

async function check(config, projectRoot) {
  const issues = [];
  const deadConfig = config.deadImports || {};
  const includePatterns = deadConfig.include || ['src/**/*.{ts,js}'];

  const files = [];
  for (const pattern of includePatterns) {
    const matches = await glob(pattern, { cwd: projectRoot, dot: true, absolute: true });
    files.push(...matches);
  }

  const uniqueFiles = [...new Set(files)];

  for (const filePath of uniqueFiles) {
    const relPath = path.relative(projectRoot, filePath);

    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    const lines = content.split('\n');

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const lineNum = index + 1;

      // Check named imports: import { X, Y } from '...'
      const namedMatch = trimmed.match(NAMED_IMPORT_REGEX);
      if (namedMatch) {
        const symbols = namedMatch[1]
          .split(',')
          .map((s) => s.trim().split(/\s+as\s+/).pop().trim()) // handle "X as Y" — use alias Y
          .filter(Boolean);

        for (const symbol of symbols) {
          if (!symbol) continue;
          const count = countOccurrences(content, symbol);
          // count === 1 means it only appears in the import line
          if (count === 1) {
            issues.push({
              file: relPath,
              line: lineNum,
              message: `Unused import: '${symbol}'`,
            });
          }
        }
        return;
      }

      // Check default imports: import X from '...'
      const defaultMatch = trimmed.match(DEFAULT_IMPORT_REGEX);
      if (defaultMatch) {
        const symbol = defaultMatch[1];
        const count = countOccurrences(content, symbol);
        if (count === 1) {
          issues.push({
            file: relPath,
            line: lineNum,
            message: `Unused import: '${symbol}'`,
          });
        }
        return;
      }

      // Check namespace imports: import * as X from '...'
      const nsMatch = trimmed.match(NAMESPACE_IMPORT_REGEX);
      if (nsMatch) {
        const symbol = nsMatch[1];
        const count = countOccurrences(content, symbol);
        if (count === 1) {
          issues.push({
            file: relPath,
            line: lineNum,
            message: `Unused import: '${symbol}'`,
          });
        }
      }
    });
  }

  return {
    name: 'deadImports',
    passed: issues.length === 0,
    issues,
  };
}

module.exports = { check };
