'use strict';

const { execSync } = require('child_process');
const { minimatch } = require('minimatch');

function git(args, projectRoot) {
  try {
    return execSync(`git ${args}`, {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 1024 * 1024 * 20,
    }).toString('utf8');
  } catch {
    return null;
  }
}

function getStagedFiles(projectRoot) {
  const out = git('diff --cached --name-only --diff-filter=ACMR', projectRoot);
  if (out === null) {
    return null;
  }
  return out
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean);
}

// Size of the blob as it sits in the index (i.e. what would actually be
// committed), not the working tree file, which may differ.
function getStagedBlobSize(relPath, projectRoot) {
  const out = git(`cat-file -s ":${relPath}"`, projectRoot);
  if (out === null) {
    return null;
  }
  const size = parseInt(out.trim(), 10);
  return Number.isNaN(size) ? null : size;
}

function matchesAny(filePath, patterns) {
  return patterns.some((pattern) => minimatch(filePath, pattern, { matchBase: true, dot: true }));
}

async function check(config, projectRoot) {
  const lfConfig = config.largeFiles || {};
  const maxSizeKb = lfConfig.maxSizeKb != null ? lfConfig.maxSizeKb : 500;
  const maxSizeBytes = maxSizeKb * 1024;
  const excludePatterns = lfConfig.exclude || [
    'node_modules/**',
    '**/*.lock',
    'package-lock.json',
  ];

  const staged = getStagedFiles(projectRoot);

  // Not a git repo, or nothing staged — nothing to enforce.
  if (staged === null) {
    return { name: 'largeFiles', passed: true, issues: [] };
  }

  const issues = [];

  for (const relPath of staged) {
    if (matchesAny(relPath, excludePatterns)) {
      continue;
    }

    const size = getStagedBlobSize(relPath, projectRoot);
    if (size === null) {
      continue;
    }

    if (size > maxSizeBytes) {
      const sizeKb = (size / 1024).toFixed(1);
      issues.push({
        file: relPath,
        line: null,
        message: `File is ${sizeKb} KB, exceeds the ${maxSizeKb} KB limit — avoid committing large binaries/build output (raise largeFiles.maxSizeKb if this file is intentional)`,
      });
    }
  }

  return {
    name: 'largeFiles',
    passed: issues.length === 0,
    issues,
  };
}

module.exports = { check };
