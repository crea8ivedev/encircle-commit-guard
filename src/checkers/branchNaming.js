'use strict';

const { execSync } = require('child_process');
const { minimatch } = require('minimatch');

// Requires prefix/short-description, e.g. feature/add-login, fix/null-check.
const DEFAULT_PATTERN = /^(feature|feat|bugfix|fix|hotfix|release|chore|docs|refactor|test)\/[a-z0-9._-]+$/;
// Branches that are exempt from the naming convention entirely (long-lived
// branches, not ad-hoc work branches).
const DEFAULT_EXEMPT = ['main', 'master', 'develop'];

function getCurrentBranch(projectRoot) {
  // symbolic-ref works even before the first commit exists (unborn HEAD),
  // unlike `git rev-parse --abbrev-ref HEAD` which fails in that case.
  try {
    return execSync('git symbolic-ref --short HEAD', {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    // Detached HEAD (symbolic-ref fails) or not a git repo at all
    return null;
  }
}

async function check(config, projectRoot) {
  const bnConfig = config.branchNaming || {};
  const pattern = bnConfig.pattern || DEFAULT_PATTERN;
  const exempt = bnConfig.exempt || DEFAULT_EXEMPT;

  const currentBranch = getCurrentBranch(projectRoot);

  // Not a git repo, git not installed, or detached HEAD — nothing to enforce
  if (!currentBranch || currentBranch === 'HEAD') {
    return { name: 'branchNaming', passed: true, issues: [] };
  }

  const isExempt = exempt.some((p) => minimatch(currentBranch, p));
  if (isExempt) {
    return { name: 'branchNaming', passed: true, issues: [] };
  }

  if (!pattern.test(currentBranch)) {
    return {
      name: 'branchNaming',
      passed: false,
      issues: [
        {
          file: '',
          line: null,
          message: `Branch name '${currentBranch}' doesn't match the required naming convention (${pattern}). Rename it, e.g. 'feature/short-description'.`,
        },
      ],
    };
  }

  return { name: 'branchNaming', passed: true, issues: [] };
}

module.exports = { check };
