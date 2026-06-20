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

  // ── Set up Git pre-commit hook ───────────────────────────────────────────────
  const gitDir = path.join(projectRoot, '.git');
  if (!fs.existsSync(gitDir)) {
    console.log('[commit-guard] No .git directory found — skipping pre-commit hook setup.');
    return;
  }

  const gitHooksDir = path.join(gitDir, 'hooks');
  const hookPath = path.join(gitHooksDir, 'pre-commit');
  const hookContent = `#!/bin/sh\n# Added by @encircle/commit-guard\nnpx commit-guard\n`;

  try {
    if (!fs.existsSync(gitHooksDir)) {
      fs.mkdirSync(gitHooksDir, { recursive: true });
    }

    if (fs.existsSync(hookPath)) {
      const existing = fs.readFileSync(hookPath, 'utf8');
      if (existing.includes('project-check')) {
        console.log('[commit-guard] pre-commit hook already set up — skipping.');
      } else {
        fs.appendFileSync(hookPath, '\n# Added by @encircle/commit-guard\nnpx commit-guard\n');
        console.log('[commit-guard] Added project-check to existing pre-commit hook.');
      }
    } else {
      fs.writeFileSync(hookPath, hookContent, 'utf8');
      fs.chmodSync(hookPath, '755');
      console.log('[commit-guard] Git pre-commit hook installed.');
    }

    console.log('[commit-guard] Every git commit will now run: npx commit-guard');
  } catch (err) {
    console.warn('[commit-guard] Could not install pre-commit hook:', err.message);
    console.warn('    Run manually: echo "#!/bin/sh\\nnpx commit-guard" > .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit');
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
