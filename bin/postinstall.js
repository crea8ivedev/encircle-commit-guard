#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const configContent = `// ─────────────────────────────────────────────────────────────────────────────
// @encircle/commit-guard — configuration file
// Auto-generated. Customize the rules below for your project.
// Run: npx commit-guard
// Re-generate: npx commit-guard init --force
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  // Root of the project to check, relative to this config file
  root: '.',

  // ── REMINDERS ────────────────────────────────────────────────────────────────
  // A final interactive confirmation prompt for things no automated check
  // can verify (docs updated? tests run locally?). Only appears once every
  // other check has already passed AND at least one message is configured
  // below — with messages empty (the default) this is fully invisible.
  // Answering anything other than y/yes blocks the commit. In a
  // non-interactive environment (CI, scripts) it's skipped automatically.
  // Set to false to disable this check entirely.
  reminders: {
    messages: [
      // 'Did you update the README/docs if needed?',
      // 'Did you run the test suite locally?',
      // 'Did you check for hardcoded secrets or config values?',
    ],
  },

  // ── PROTECTED BRANCHES CHECK ─────────────────────────────────────────────────
  // Blocks commits made directly on these branches (e.g. force people onto
  // feature branches + PRs). Exact names or glob patterns both work.
  // Set to false to disable this check entirely.
  protectedBranches: {
    branches: [
      'main',
      'master',
      // 'release/*',   // glob patterns work too
    ],
  },

  // ── BRANCH NAMING CHECK ──────────────────────────────────────────────────────
  // Requires new branches to follow a naming convention, e.g. feature/xyz.
  // Long-lived branches listed in "exempt" skip the check entirely.
  // Set to false to disable this check entirely.
  branchNaming: {
    // pattern: /^(feature|feat|bugfix|fix|hotfix|release|chore|docs|refactor|test)\/[a-z0-9._-]+$/,
    exempt: ['main', 'master', 'develop'],
  },

  // ── AUTHOR EMAIL CHECK ───────────────────────────────────────────────────────
  // Requires the committer's configured git email and/or name to be on an
  // approved list. Catches a personal git identity accidentally used on a
  // work machine. Opt-in: leave both lists empty (the default) to disable.
  // Set to false to disable this check entirely.
  authorEmail: {
    // Exact email addresses allowed to author commits:
    allowedEmails: [
      // 'jane@yourcompany.com',
    ],
    // Exact git user.name values allowed (checked independently of email —
    // both must pass if both are set):
    allowedUsernames: [
      // 'Jane Smith',
    ],
  },

  // ── SECRETS CHECK ────────────────────────────────────────────────────────────
  // Scans staged/source files for likely API keys, tokens, private keys, and
  // other credentials so they never get committed.
  // Set to false to disable this check entirely.
  secrets: {
    include: ['**/*.{ts,js,jsx,tsx,json,yml,yaml}', '.env*'],
    exclude: ['node_modules/**', '**/*.lock', 'package-lock.json', 'check.config.js', '**/*.test.*', '**/*.spec.*'],
    // Exact strings to never flag (e.g. a known-safe example key in docs):
    allowlist: [
      // 'AKIAIOSFODNN7EXAMPLE',
    ],
  },

  // ── COMMIT MESSAGE CHECK ─────────────────────────────────────────────────────
  // Validates the commit message itself. Runs via the separate commit-msg
  // git hook (installed automatically alongside pre-commit).
  // Set to false to disable this check entirely.
  commitMessage: {
    minLength: 10,
    maxHeaderLength: 100,
    disallowGeneric: true, // blocks messages like "fix", "wip", "update"
    // Uncomment to enforce Conventional Commits (feat:, fix:, chore:, ...):
    // pattern: /^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)(\(.+\))?: .+/,
  },

  // ── LOCKFILE SYNC CHECK ──────────────────────────────────────────────────────
  // If package.json's dependencies changed in this commit, makes sure the
  // matching lockfile was updated and staged too.
  // Set to false to disable this check entirely.
  lockfileSync: {
    lockfiles: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'npm-shrinkwrap.json'],
  },

  // ── MERGE CONFLICT MARKER CHECK ──────────────────────────────────────────────
  // Scans staged files for leftover conflict markers (<<<<<<<, =======, >>>>>>>).
  // Git only blocks a commit while a file is unmerged in the index — once you
  // stage it with "git add", git trusts it's resolved and never re-checks the
  // content. This catches a conflict resolved by hand that missed a marker.
  // Set to false to disable this check entirely.
  mergeConflicts: {
    exclude: ['node_modules/**', '**/*.lock', 'package-lock.json', '**/*.min.js'],
  },

  // ── LINE ENDING CHECK ────────────────────────────────────────────────────────
  // Flags a file with MIXED line endings (some lines CRLF, others LF) within
  // itself — almost always an editor partially converting the file, and the
  // reason a merge/diff sometimes shows a WHOLE file as changed even though
  // nothing meaningful was edited. Set "enforce" to require one style
  // repo-wide instead of only catching a mix.
  // Set to false to disable this check entirely.
  lineEndings: {
    exclude: [
      'node_modules/**',
      '**/*.lock',
      'package-lock.json',
      '**/*.{png,jpg,jpeg,gif,ico,woff,woff2,ttf,eot,pdf,zip}',
    ],
    // enforce: 'lf', // or 'crlf' — require this line ending everywhere
  },

  // ── LARGE FILE CHECK ─────────────────────────────────────────────────────────
  // Blocks committing files over a size limit — catches accidentally staged
  // build output, database dumps, videos, zips, etc.
  // Set to false to disable this check entirely.
  largeFiles: {
    maxSizeKb: 500,
    exclude: ['node_modules/**', '**/*.lock', 'package-lock.json'],
  },

  // ── JSON / YAML SYNTAX CHECK ─────────────────────────────────────────────────
  // Parses staged .json/.yml/.yaml files and fails on syntax errors before
  // they reach the next person's install/build/CI run.
  // Set to false to disable this check entirely.
  jsonYamlSyntax: {
    include: ['**/*.{json,yml,yaml}'],
    exclude: ['node_modules/**', '**/*.lock', 'package-lock.json'],
  },

  // ── CASE-COLLISION CHECK ─────────────────────────────────────────────────────
  // Flags a newly added/renamed file whose path differs only by letter case
  // from another tracked file (e.g. Utils.ts vs utils.ts) — these coexist fine
  // on Linux but collide on case-insensitive filesystems (Windows, default
  // macOS). Only fires when THIS commit introduces the collision.
  // Set to false to disable this check entirely.
  caseCollision: {
    exclude: ['node_modules/**'],
  },

  // ── STRUCTURE CHECK ──────────────────────────────────────────────────────────
  // Ensures required files/folders exist and forbidden patterns are absent.
  // Use exact paths or glob patterns. Set to false to disable this check.
  structure: {
    required: [
      // Add paths that MUST exist in your project:
      // 'src/app.ts',
      // 'src/server.ts',
      // 'src/config/env.ts',
      // 'src/routes/index.ts',
      // 'src/controllers/',
      // 'src/services/',
      // 'src/middlewares/',
      // 'src/utils/',
      // 'src/types/',
      // 'prisma/schema.prisma',
      // '.env.example',
      // 'tsconfig.json',
    ],
    forbidden: [
      // Add glob patterns that must NOT exist in your project:
      // 'src/**/*.js',        // no plain JS in a TS project
      // '**/*.log',           // no log files committed
      // '.env',               // never commit .env
    ],
  },

  // ── CONSOLE LOG CHECK ────────────────────────────────────────────────────────
  // Detects console.log / console.warn / console.error / console.debug in source.
  // Set to false to disable this check entirely.
  consoleLogs: {
    // Glob patterns to scan
    include: ['src/**/*.{ts,js}'],
    // Glob patterns to skip (test files are excluded by default)
    exclude: ['**/*.test.*', '**/*.spec.*'],
  },

  // ── DEBUGGER STATEMENT CHECK ─────────────────────────────────────────────────
  // Detects leftover "debugger;" statements. Commented-out ones are ignored.
  // Set to false to disable this check entirely.
  debuggerStatements: {
    include: ['src/**/*.{ts,js,jsx,tsx}'],
    exclude: ['**/*.test.*', '**/*.spec.*'],
  },

  // ── HARDCODED LOCAL PATH CHECK ────────────────────────────────────────────────
  // Flags an absolute path from someone's own machine left in source (e.g.
  // /Users/john/project/config.json, /home/john/..., C:\Users\John\...) —
  // works for the author, breaks for everyone else. Doc-style examples like
  // "/Users/yourname/..." and commented-out lines are ignored.
  // Set to false to disable this check entirely.
  hardcodedPaths: {
    include: ['src/**/*.{ts,js,jsx,tsx}'],
    exclude: ['**/*.test.*', '**/*.spec.*'],
    // Add your own RegExp objects here to flag additional path shapes:
    extraPatterns: [],
  },

  // ── FOCUSED / SKIPPED TEST CHECK ─────────────────────────────────────────────
  // Flags .only(/.skip( (and Jasmine's fdescribe/fit/xdescribe/xit) left in
  // test files. A forgotten .only means CI silently stops running the rest
  // of the suite.
  // Set to false to disable this check entirely.
  focusedTests: {
    include: ['**/*.{test,spec}.{ts,js,jsx,tsx}'],
    exclude: ['node_modules/**'],
    failOnSkip: true, // set false to only warn (not block) on .skip/xit
  },

  // ── EMPTY CATCH BLOCK CHECK ──────────────────────────────────────────────────
  // Flags empty "catch" blocks — catch (e) {} with nothing inside — a
  // silently swallowed error. A catch block containing at least a comment
  // is treated as documented intent and is not flagged.
  // Set to false to disable this check entirely.
  emptyCatch: {
    include: ['src/**/*.{ts,js,jsx,tsx}'],
    exclude: ['**/*.test.*', '**/*.spec.*'],
  },

  // ── TODO / FIXME TRACKER ─────────────────────────────────────────────────────
  // Surfaces TODO/FIXME/HACK/XXX comments. Informational by default (shown
  // as warnings, doesn't block the commit) — set blocking: true to enforce
  // zero lingering markers.
  // Set to false to disable this check entirely.
  todoTracker: {
    include: ['src/**/*.{ts,js,jsx,tsx}'],
    exclude: ['**/*.test.*', '**/*.spec.*'],
    markers: ['TODO', 'FIXME', 'HACK', 'XXX'],
    blocking: false,
  },

  // ── ESLINT CHECK ─────────────────────────────────────────────────────────────
  // Runs ESLint using your project's own .eslintrc config.
  // Requires eslint to be installed in your project (peer dependency).
  // Set to false to disable this check entirely.
  eslint: {
    // File extensions to lint
    extensions: ['.ts', '.js'],
    // Glob patterns to lint
    patterns: ['src/**'],
  },

  // ── DEAD IMPORTS CHECK ───────────────────────────────────────────────────────
  // Detects imported symbols that are never used in the file body.
  // Set to false to disable this check entirely.
  deadImports: {
    // Glob patterns to scan
    include: ['src/**/*.{ts,js}'],
  },
};
`;

function run(projectRoot, opts) {
  const force = opts && opts.force;
  const configDest = path.join(projectRoot, 'check.config.js');

  // ── Create config ────────────────────────────────────────────────────────────
  if (fs.existsSync(configDest) && !force) {
    console.log('[commit-guard] check.config.js already exists — skipping. (use --force to overwrite)');
  } else {
    try {
      fs.writeFileSync(configDest, configContent, 'utf8');
      console.log('[commit-guard] Created check.config.js — open it to configure your rules.');
    } catch (err) {
      console.warn('[commit-guard] Could not create check.config.js:', err.message);
    }
  }

  // ── Set up Git hooks ─────────────────────────────────────────────────────────
  const gitDir = path.join(projectRoot, '.git');
  if (!fs.existsSync(gitDir)) {
    console.log('[commit-guard] No .git directory found — skipping git hook setup.');
    return;
  }

  const gitHooksDir = path.join(gitDir, 'hooks');
  try {
    if (!fs.existsSync(gitHooksDir)) {
      fs.mkdirSync(gitHooksDir, { recursive: true });
    }
  } catch (err) {
    console.warn('[commit-guard] Could not create .git/hooks directory:', err.message);
    return;
  }

  installHook(gitHooksDir, 'pre-commit', 'npx commit-guard');
  installHook(gitHooksDir, 'commit-msg', 'npx commit-guard commit-msg "$1"');
}

// Installs (or appends to) a single git hook file, marking anything it adds
// with a "commit-guard" comment so re-runs / other hooks don't duplicate it.
function installHook(gitHooksDir, hookName, commandLine) {
  const hookPath = path.join(gitHooksDir, hookName);
  const marker = '# Added by @encircle/commit-guard';
  const hookContent = `#!/bin/sh\n${marker}\n${commandLine}\n`;

  try {
    if (fs.existsSync(hookPath)) {
      const existing = fs.readFileSync(hookPath, 'utf8');
      if (existing.includes('commit-guard')) {
        console.log(`[commit-guard] ${hookName} hook already set up — skipping.`);
      } else {
        fs.appendFileSync(hookPath, `\n${marker}\n${commandLine}\n`);
        fs.chmodSync(hookPath, '755');
        console.log(`[commit-guard] Added commit-guard to existing ${hookName} hook.`);
      }
    } else {
      fs.writeFileSync(hookPath, hookContent, 'utf8');
      fs.chmodSync(hookPath, '755');
      console.log(`[commit-guard] Git ${hookName} hook installed.`);
    }
  } catch (err) {
    console.warn(`[commit-guard] Could not install ${hookName} hook:`, err.message);
    console.warn(`    Run manually: printf '#!/bin/sh\\n${commandLine}\\n' > .git/hooks/${hookName} && chmod +x .git/hooks/${hookName}`);
  }
}

function resolveProjectRoot() {
  // Most reliable: if installed inside node_modules, walk up 3 levels
  // __dirname = <project>/node_modules/@encircle/commit-guard/bin
  const fromNodeModules = path.resolve(__dirname, '..', '..', '..');
  const pkgInNodeModules = path.join(fromNodeModules, 'package.json');

  if (fs.existsSync(pkgInNodeModules)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgInNodeModules, 'utf8'));
      if (pkg.name !== '@encircle/commit-guard') {
        return fromNodeModules;
      }
    } catch { /* ignore */ }
  }

  // Fallback: INIT_CWD set by npm, then cwd
  return process.env.INIT_CWD || process.cwd();
}

// When run directly as postinstall script
if (require.main === module) {
  const projectRoot = resolveProjectRoot();

  // Don't run when installing the package itself
  const destPkg = path.join(projectRoot, 'package.json');
  if (fs.existsSync(destPkg)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(destPkg, 'utf8'));
      if (pkg.name === '@encircle/commit-guard') process.exit(0);
    } catch { /* ignore */ }
  }

  run(projectRoot, { force: false });
}

module.exports = { run };
