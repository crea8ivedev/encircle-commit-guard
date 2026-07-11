'use strict';

const { execSync } = require('child_process');
const { minimatch } = require('minimatch');

// Git only refuses to commit while a file is still "unmerged" in the index —
// i.e. before you `git add` it. Once staged, git trusts you fully and never
// re-checks the content, so a conflict resolved by hand that missed a marker
// sails straight through. This checker catches that.
const START_REGEX = /^<{7}(\s|$)/;
const END_REGEX = /^>{7}(\s|$)/;
// '=======' alone is ambiguous (it's also a common plain-text section divider),
// so it's only treated as a real marker when paired with a start/end marker
// in the same file.
const MID_REGEX = /^={7}$/;

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

// Reads the file exactly as it sits in the index (what would actually be
// committed), not the working tree copy, which may have further edits.
function getStagedContent(relPath, projectRoot) {
  return git(`show ":${relPath}"`, projectRoot);
}

function matchesAny(filePath, patterns) {
  return patterns.some((pattern) => minimatch(filePath, pattern, { matchBase: true, dot: true }));
}

async function check(config, projectRoot) {
  const mcConfig = config.mergeConflicts || {};
  const excludePatterns = mcConfig.exclude || [
    'node_modules/**',
    '**/*.lock',
    'package-lock.json',
    '**/*.min.js',
  ];

  const staged = getStagedFiles(projectRoot);

  // Not a git repo, or nothing staged — nothing to enforce.
  if (staged === null) {
    return { name: 'mergeConflicts', passed: true, issues: [] };
  }

  const issues = [];

  for (const relPath of staged) {
    if (matchesAny(relPath, excludePatterns)) {
      continue;
    }

    const content = getStagedContent(relPath, projectRoot);
    if (content === null || /\x00/.test(content)) {
      continue; // couldn't read it, or looks binary
    }

    const lines = content.split('\n');
    const hits = { start: [], end: [], mid: [] };

    lines.forEach((line, index) => {
      if (START_REGEX.test(line)) hits.start.push(index + 1);
      else if (END_REGEX.test(line)) hits.end.push(index + 1);
      else if (MID_REGEX.test(line)) hits.mid.push(index + 1);
    });

    const hasDirectional = hits.start.length > 0 || hits.end.length > 0;

    for (const lineNum of hits.start) {
      issues.push({ file: relPath, line: lineNum, message: 'Unresolved merge conflict marker: <<<<<<<' });
    }
    for (const lineNum of hits.end) {
      issues.push({ file: relPath, line: lineNum, message: 'Unresolved merge conflict marker: >>>>>>>' });
    }
    if (hasDirectional) {
      for (const lineNum of hits.mid) {
        issues.push({ file: relPath, line: lineNum, message: 'Unresolved merge conflict marker: =======' });
      }
    }
  }

  return {
    name: 'mergeConflicts',
    passed: issues.length === 0,
    issues,
  };
}

module.exports = { check };
