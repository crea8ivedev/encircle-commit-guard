'use strict';

const { execSync } = require('child_process');

// Reads a git config value as it will effectively apply to the commit being
// made right now (local config overrides global, same resolution git itself
// uses for both user.email and user.name).
function gitConfig(key, projectRoot) {
  try {
    return execSync(`git config ${key}`, {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

async function check(config, projectRoot) {
  const aeConfig = config.authorEmail || {};
  const allowedEmails = aeConfig.allowedEmails || [];
  const allowedUsernames = aeConfig.allowedUsernames || [];

  // Nothing configured at all — nothing to enforce (fully opt-in check).
  if (allowedEmails.length === 0 && allowedUsernames.length === 0) {
    return { name: 'authorEmail', passed: true, issues: [] };
  }

  const issues = [];

  // ── Email allowlist check ────────────────────────────────────────────────────
  if (allowedEmails.length > 0) {
    const email = gitConfig('user.email', projectRoot);

    if (!email) {
      issues.push({
        file: '',
        line: null,
        message: 'No git user.email is configured for this commit. Run: git config user.email "you@yourcompany.com"',
      });
    } else {
      const emailAllowed = allowedEmails.some((e) => e.toLowerCase() === email.toLowerCase());

      if (!emailAllowed) {
        issues.push({
          file: '',
          line: null,
          message: `Commit author email '${email}' isn't on the approved list (${allowedEmails.join(', ')}). This usually means a personal git identity got used on a work machine — fix with: git config user.email "${allowedEmails[0] || 'you@yourcompany.com'}"`,
        });
      }
    }
  }

  // ── Username allowlist check ─────────────────────────────────────────────────
  if (allowedUsernames.length > 0) {
    const username = gitConfig('user.name', projectRoot);

    if (!username) {
      issues.push({
        file: '',
        line: null,
        message: 'No git user.name is configured for this commit. Run: git config user.name "Your Name"',
      });
    } else {
      const usernameAllowed = allowedUsernames.some((u) => u.toLowerCase() === username.toLowerCase());

      if (!usernameAllowed) {
        issues.push({
          file: '',
          line: null,
          message: `Commit author name '${username}' isn't on the approved list (${allowedUsernames.join(', ')}). Fix with: git config user.name "Your Name"`,
        });
      }
    }
  }

  return {
    name: 'authorEmail',
    passed: issues.length === 0,
    issues,
  };
}

module.exports = { check };
