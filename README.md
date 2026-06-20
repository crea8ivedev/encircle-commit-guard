# encircle-commit-guard

A CLI tool that automatically validates your Node.js/TypeScript project against configurable rules on every git commit. It checks folder/file structure, detects console statements, runs ESLint, and finds unused imports.

## What it does

- **Structure check** — verifies required files/folders exist and forbidden patterns are absent
- **Console log check** — detects `console.log`, `console.warn`, `console.error`, `console.debug` in source files
- **ESLint check** — runs ESLint using the project's own `.eslintrc` config
- **Dead imports check** — detects imported symbols that are never used in the file body

## Installation

```bash
npm install --save-dev encircle-commit-guard
```

After installation, two things happen automatically:
1. `check.config.js` is created in your project root with all rules documented
2. `.git/hooks/pre-commit` is set up — every `git commit` runs the checks automatically

## Usage

```bash
npx commit-guard
```

### Re-create config if deleted

```bash
npx commit-guard init
```

### Overwrite existing config with a fresh copy

```bash
npx commit-guard init --force
```

### Skip the hook in an emergency

```bash
git commit -m "your message" --no-verify
```

The tool exits with code `0` if all checks pass, or `1` if any check fails.

---

## Configuration (check.config.js)

The config file is auto-created on install. Open it and uncomment the rules you want. Set any checker to `false` to disable it entirely.

```js
module.exports = {
  root: '.', // project root, relative to this config file

  structure: {
    required: [
      // 'src/app.ts',
      // 'src/controllers/',
      // 'tsconfig.json',
    ],
    forbidden: [
      // 'src/**/*.js',  // no plain JS in a TS project
      // '.env',         // never commit .env
    ],
  },

  consoleLogs: {
    include: ['src/**/*.{ts,js}'],
    exclude: ['**/*.test.*', '**/*.spec.*'],
  },

  eslint: {
    extensions: ['.ts', '.js'],
    patterns: ['src/**'],
  },

  deadImports: {
    include: ['src/**/*.{ts,js}'],
  },
};
```

---

## Config options

### `structure`

| Option | Type | Description |
|---|---|---|
| `required` | `string[]` | Paths or glob patterns that must exist |
| `forbidden` | `string[]` | Glob patterns that must NOT match any files |

Set `structure: false` to skip this check.

---

### `consoleLogs`

| Option | Type | Default | Description |
|---|---|---|---|
| `include` | `string[]` | `['src/**/*.{ts,js}']` | Files to scan |
| `exclude` | `string[]` | `['**/*.test.*', '**/*.spec.*']` | Files to skip |

Set `consoleLogs: false` to skip this check.

---

### `eslint`

| Option | Type | Default | Description |
|---|---|---|---|
| `extensions` | `string[]` | `['.ts', '.js']` | File extensions to lint |
| `patterns` | `string[]` | `['src/**']` | Glob patterns passed to ESLint |

Requires `eslint` installed in your project. If no `.eslintrc` is found, the check reports a warning instead of failing.

Set `eslint: false` to skip this check.

---

### `deadImports`

| Option | Type | Default | Description |
|---|---|---|---|
| `include` | `string[]` | `['src/**/*.{ts,js}']` | Files to scan |

Handles named imports (`import { X }`), default imports (`import X`), and namespace imports (`import * as X`).

Set `deadImports: false` to skip this check.

---

## Example output

```
=== commit-guard results ===

[PASS] STRUCTURE

[FAIL] CONSOLELOGS
  src/services/user.service.ts:42 - console statement found: console.log(user)
  src/controllers/auth.controller.ts:17 - console statement found: console.log(token)

[PASS] ESLINT

[FAIL] DEADIMPORTS
  src/utils/helpers.ts:3 - unused import: formatDate

Summary: 2 checks passed, 2 checks failed, 3 total issues
```

---

## Git pre-commit hook

The hook is installed automatically. To set it up manually:

```bash
echo "#!/bin/sh" > .git/hooks/pre-commit
echo "npx commit-guard" >> .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

---

## Updating

```bash
npm update encircle-commit-guard
```

Your `check.config.js` is never overwritten on update. If the file was deleted, running `npx commit-guard` will recreate it automatically.

---

## Requirements

- Node.js >= 16.0.0
- `eslint` (optional — only needed for the ESLint check)

## License

MIT
