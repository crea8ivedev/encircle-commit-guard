'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DEFAULT_LOCKFILES = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'npm-shrinkwrap.json'];
const DEP_FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

function git(args, projectRoot) {
  try {
    return execSync(`git ${args}`, {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString();
  } catch {
    return null;
  }
}

function getStagedFiles(projectRoot) {
  const out = git('diff --cached --name-only', projectRoot);
  if (out === null) {
    return null;
  }
  return out
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean);
}

// Reads package.json as it existed in the last commit (before this one),
// so we can tell whether dependencies actually changed vs. e.g. a script
// or description edit that wouldn't touch the lockfile at all.
function getPreviousPackageJson(projectRoot) {
  const out = git('show HEAD:package.json', projectRoot);
  if (out === null) {
    return {};
  }
  try {
    return JSON.parse(out);
  } catch {
    return {};
  }
}

function depsEqual(a, b) {
  return JSON.stringify(a || {}) === JSON.stringify(b || {});
}

async function check(config, projectRoot) {
  const lockConfig = config.lockfileSync || {};
  const lockfileNames = lockConfig.lockfiles || DEFAULT_LOCKFILES;

  const staged = getStagedFiles(projectRoot);

  // Not a git repo, or `git diff --cached` failed for some other reason —
  // nothing we can safely enforce.
  if (staged === null) {
    return { name: 'lockfileSync', passed: true, issues: [] };
  }

  if (!staged.includes('package.json')) {
    return { name: 'lockfileSync', passed: true, issues: [] };
  }

  let currentPkg;
  try {
    currentPkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  } catch {
    // Can't parse package.json — leave that failure to a different check.
    return { name: 'lockfileSync', passed: true, issues: [] };
  }

  const previousPkg = getPreviousPackageJson(projectRoot);
  const depsChanged = DEP_FIELDS.some((field) => !depsEqual(currentPkg[field], previousPkg[field]));

  if (!depsChanged) {
    return { name: 'lockfileSync', passed: true, issues: [] };
  }

  const existingLockfiles = lockfileNames.filter((name) => fs.existsSync(path.join(projectRoot, name)));

  // No lockfile in use in this project — nothing to keep in sync.
  if (existingLockfiles.length === 0) {
    return { name: 'lockfileSync', passed: true, issues: [] };
  }

  const anyLockfileStaged = existingLockfiles.some((name) => staged.includes(name));

  if (!anyLockfileStaged) {
    return {
      name: 'lockfileSync',
      passed: false,
      issues: [
        {
          file: 'package.json',
          line: null,
          message: `Dependencies changed in package.json but ${existingLockfiles.join(' / ')} wasn't staged — run your package manager's install command and \`git add\` the updated lockfile.`,
        },
      ],
    };
  }

  return { name: 'lockfileSync', passed: true, issues: [] };
}

module.exports = { check };
