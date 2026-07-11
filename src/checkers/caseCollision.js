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

// All paths as they currently sit in the index — i.e. the full file listing
// that would exist right after this commit (already reflects staged adds,
// removes, and renames).
function getAllIndexedFiles(projectRoot) {
  const out = git('ls-files', projectRoot);
  if (out === null) {
    return null;
  }
  return out.split('\n').map((f) => f.trim()).filter(Boolean);
}

// Only files newly added/copied/renamed in this commit — we only want to
// flag a collision if THIS commit is the one introducing it, not fail every
// future commit because of a pre-existing collision nobody touched.
function getNewOrRenamedStagedFiles(projectRoot) {
  const out = git('diff --cached --name-only --diff-filter=ACR', projectRoot);
  if (out === null) {
    return null;
  }
  return out.split('\n').map((f) => f.trim()).filter(Boolean);
}

function matchesAny(filePath, patterns) {
  return patterns.some((pattern) => minimatch(filePath, pattern, { matchBase: true, dot: true }));
}

async function check(config, projectRoot) {
  const ccConfig = config.caseCollision || {};
  const excludePatterns = ccConfig.exclude || ['node_modules/**'];

  const allFiles = getAllIndexedFiles(projectRoot);
  const newFiles = getNewOrRenamedStagedFiles(projectRoot);

  // Not a git repo, or nothing newly added/renamed — nothing to enforce.
  if (allFiles === null || newFiles === null || newFiles.length === 0) {
    return { name: 'caseCollision', passed: true, issues: [] };
  }

  const byLowerPath = new Map();
  for (const file of allFiles) {
    if (matchesAny(file, excludePatterns)) {
      continue;
    }
    const key = file.toLowerCase();
    if (!byLowerPath.has(key)) {
      byLowerPath.set(key, new Set());
    }
    byLowerPath.get(key).add(file);
  }

  const issues = [];
  const alreadyReported = new Set();

  for (const newFile of newFiles) {
    if (matchesAny(newFile, excludePatterns)) {
      continue;
    }

    const key = newFile.toLowerCase();
    const group = byLowerPath.get(key);

    if (group && group.size > 1 && !alreadyReported.has(key)) {
      alreadyReported.add(key);
      const others = [...group].sort();
      issues.push({
        file: newFile,
        line: null,
        message: `Case-collision: these paths differ only by letter case and will conflict on case-insensitive filesystems (Windows / default macOS): ${others.join(', ')}`,
      });
    }
  }

  return {
    name: 'caseCollision',
    passed: issues.length === 0,
    issues,
  };
}

module.exports = { check };
