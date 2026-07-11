'use strict';

const { execSync } = require('child_process');
const { minimatch } = require('minimatch');

function getCurrentBranch(projectRoot) {
  // symbolic-ref works even before the first commit exists (unborn HEAD),
  // unlike `git rev-parse --abbrev-ref HEAD` which fails in that case.
  try {
    const branch = execSync('git symbolic-ref --short HEAD', {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    return branch;
  } catch {
    // Detached HEAD (symbolic-ref fails) or not a git repo at all
    return null;
  }
}

async function check(config, projectRoot) {
  const branchConfig = config.protectedBranches || {};
  const protectedList = branchConfig.branches || ['main', 'master'];

  const currentBranch = getCurrentBranch(projectRoot);

  // Not a git repo, git not installed, or detached HEAD — nothing to enforce
  if (!currentBranch || currentBranch === 'HEAD') {
    return {
      name: 'protectedBranches',
      passed: true,
      issues: [],
    };
  }

  const isProtected = protectedList.some((pattern) => minimatch(currentBranch, pattern));

  if (isProtected) {
    return {
      name: 'protectedBranches',
      passed: false,
      issues: [
        {
          file: '',
          line: null,
          message: `Direct commits to '${currentBranch}' are blocked. Create a feature branch and open a pull request instead.`,
        },
      ],
    };
  }

  return {
    name: 'protectedBranches',
    passed: true,
    issues: [],
  };
}

module.exports = { check };
