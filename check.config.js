// ─────────────────────────────────────────────────────────────────────────────
// @encircle/commit-guard — configuration file
// Auto-generated. Customize the rules below for your project.
// Run: npx commit-guard
// Re-generate: npx commit-guard init --force
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  // Root of the project to check, relative to this config file
  root: '.',

  // ── PROTECTED BRANCHES CHECK ─────────────────────────────────────────────────
  // Blocks commits made directly on these branches (e.g. force people onto
  // feature branches + PRs). Exact names or glob patterns both work.
  // Disabled here because this repo's own workflow currently commits
  // directly to main — flip this back on (remove `: false` and uncomment
  // `branches`) once/if a feature-branch + PR flow is adopted for this repo.
  protectedBranches: false,

  // ── BRANCH NAMING CHECK ──────────────────────────────────────────────────────
  // Requires new branches to follow a naming convention, e.g. feature/xyz.
  // Long-lived branches listed in "exempt" skip the check entirely.
  // Set to false to disable this check entirely.
  branchNaming: {
    // pattern: /^(feature|feat|bugfix|fix|hotfix|release|chore|docs|refactor|test)/[a-z0-9._-]+$/,
    // exempt: ['main', 'master', 'develop'],
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
      'BIshanET',
    ],
  },

  // ── SECRETS CHECK ────────────────────────────────────────────────────────────
  // Scans staged/source files for likely API keys, tokens, private keys, and
  // other credentials so they never get committed.
  // Set to false to disable this check entirely.
  secrets: {
    include: ['**/*.{ts,js,jsx,tsx,json,yml,yaml}', '.env*'],
    exclude: ['node_modules/**', '**/*.lock', 'package-lock.json', 'check.config.js', '**/*.test.*', '**/*.spec.*'],
    // AWS's own documented placeholder key — referenced as an example in
    // bin/postinstall.js's generated config template, not a real secret.
    allowlist: ['AKIAIOSFODNN7EXAMPLE'],
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
    // pattern: /^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)((.+))?: .+/,
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
    include: ['src/**/*.{ts,js}'],
    // reporter.js's console.log calls ARE the tool's output, not debug
    // leftovers — exclude it from this check.
    exclude: ['**/*.test.*', '**/*.spec.*', 'src/reporter.js'],
  },

  // ── DEBUGGER STATEMENT CHECK ─────────────────────────────────────────────────
  // Detects leftover "debugger;" statements. Commented-out ones are ignored.
  // Set to false to disable this check entirely.
  debuggerStatements: {
    include: ['src/**/*.{ts,js,jsx,tsx}'],
    exclude: ['**/*.test.*', '**/*.spec.*'],
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
