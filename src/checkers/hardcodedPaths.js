'use strict';

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const { minimatch } = require('minimatch');

// Each rule requires an actual username-shaped path segment (letters,
// digits, dots, underscores, hyphens) followed by another path separator —
// this is what distinguishes a real machine-specific path like
// "/Users/john/project/file.ts" from an Express route like "/Users/:id"
// (the ":" isn't a valid username character, so it never matches).
const PATH_RULES = [
  { name: 'macOS user path', regex: /\/Users\/[A-Za-z0-9._-]+\// },
  { name: 'Linux home directory path', regex: /\/home\/[A-Za-z0-9._-]+\// },
  // Backslashes appear doubled in source (`\\`) since that's how JS/TS/JSON
  // string literals escape a single literal backslash — match 1 or 2.
  { name: 'Windows user path', regex: /[A-Za-z]:\\{1,2}Users\\{1,2}[A-Za-z0-9._-]+\\{1,2}/ },
];

// Skip obvious documentation/example placeholders (e.g. a comment showing
// "/Users/yourname/project" as a generic illustration, not a real path).
const PLACEHOLDER_REGEX = /(yourname|your[_-]?name|username|your[_-]?user(name)?|youruser|placeholder|changeme|\bexample\b)/i;

function matchesAny(filePath, patterns) {
  return patterns.some((pattern) => minimatch(filePath, pattern, { matchBase: true, dot: true }));
}

function isCommentLine(trimmed) {
  return trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*');
}

async function check(config, projectRoot) {
  const issues = [];
  const hpConfig = config.hardcodedPaths || {};
  const includePatterns = hpConfig.include || ['src/**/*.{ts,js,jsx,tsx}'];
  const excludePatterns = hpConfig.exclude || ['**/*.test.*', '**/*.spec.*'];
  const extraPatterns = hpConfig.extraPatterns || [];

  const rules = [
    ...PATH_RULES,
    ...extraPatterns.map((regex, i) => ({ name: `custom pattern #${i + 1}`, regex })),
  ];

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
      if (!trimmed || isCommentLine(trimmed) || PLACEHOLDER_REGEX.test(line)) {
        return;
      }

      for (const rule of rules) {
        if (rule.regex.test(line)) {
          issues.push({
            file: relPath,
            line: index + 1,
            message: `Hardcoded ${rule.name} found: ${trimmed.slice(0, 160)} — use a relative path, an environment variable, or os.homedir() instead so this doesn't break on anyone else's machine.`,
          });
          break; // one rule match per line is enough
        }
      }
    });
  }

  return {
    name: 'hardcodedPaths',
    passed: issues.length === 0,
    issues,
  };
}

module.exports = { check };
