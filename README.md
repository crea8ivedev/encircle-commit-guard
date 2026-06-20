# project-check

A CLI tool that validates a Node.js/TypeScript project against configurable rules. It checks folder/file structure, detects console statements, runs ESLint, and finds unused imports.

## What it does

- **Structure check** — verifies required files/folders exist and forbidden patterns are absent
- **Console log check** — detects `console.log`, `console.warn`, `console.error`, `console.debug` in source files
- **ESLint check** — runs ESLint using the project's own `.eslintrc` config
- **Dead imports check** — detects imported symbols that are never used in the file body

## Installation

### Global install
```bash
npm install -g project-check
```

### Or run with npx (no install needed)
```bash
npx project-check
```

## Usage

1. Copy `check.config.js` into the root of the project you want to check:

```bash
cp node_modules/project-check/check.config.js ./check.config.js
# or download it directly
```

2. Edit `check.config.js` to match your project's expected structure.

3. Run the tool from your project root:

```bash
project-check
# or
npx project-check
```

The tool exits with code `0` if all checks pass, or `1` if any check fails.

## Config file

Create a `check.config.js` file in the root of the project being checked:

```js
module.exports = {
  root: '.', // project root, relative to this config file

  structure: {
    required: [
      'src/app.ts',
      'src/server.ts',
      'tsconfig.json',
      '.env.example',
    ],
    forbidden: [
      'src/**/*.js', // no plain JS files in a TS project
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

## Config options

### `root`
Type: `string`  
Default: `'.'`

The project root directory, relative to `check.config.js`. Usually `.` when the config is in the project root.

---

### `structure`

Controls the file/folder structure check.

| Option | Type | Description |
|---|---|---|
| `required` | `string[]` | Paths or glob patterns that must exist. Use exact paths like `src/app.ts` or globs like `src/**/*.ts`. |
| `forbidden` | `string[]` | Glob patterns that must NOT match any files. |

Set `structure: false` to skip this check entirely.

---

### `consoleLogs`

Controls the console statement detector.

| Option | Type | Default | Description |
|---|---|---|---|
| `include` | `string[]` | `['src/**/*.{ts,js}']` | Glob patterns for files to scan. |
| `exclude` | `string[]` | `['**/*.test.*', '**/*.spec.*']` | Glob patterns for files to skip. |

Detects: `console.log`, `console.warn`, `console.error`, `console.debug`.

Set `consoleLogs: false` to skip this check.

---

### `eslint`

Runs ESLint using the project's own ESLint configuration.

| Option | Type | Default | Description |
|---|---|---|---|
| `extensions` | `string[]` | `['.ts', '.js']` | File extensions to lint. |
| `patterns` | `string[]` | `['src/**']` | Glob patterns passed to ESLint. |

If no `.eslintrc` is found in the project, the check reports a warning instead of failing.

Set `eslint: false` to skip this check.

---

### `deadImports`

Detects imported symbols that are never used in the file.

| Option | Type | Default | Description |
|---|---|---|---|
| `include` | `string[]` | `['src/**/*.{ts,js}']` | Glob patterns for files to scan. |

Handles named imports (`import { X } from '...'`), default imports (`import X from '...'`), and namespace imports (`import * as X from '...'`).

Set `deadImports: false` to skip this check.

---

## Example output

```
=== project-check results ===

[PASS] STRUCTURE

[FAIL] CONSOLELOGS
  src/services/user.service.ts:42 - console statement found: console.log('user created', user)
  src/controllers/auth.controller.ts:17 - console statement found: console.error('auth failed')

[PASS] ESLINT

[FAIL] DEADIMPORTS
  src/utils/helpers.ts:3 - Unused import: 'formatDate'

Summary: 2 checks passed, 2 checks failed, 3 total issues
```

## Disabling individual checks

Set any check key to `false` in your config to skip it:

```js
module.exports = {
  root: '.',
  structure: { required: ['src/'], forbidden: [] },
  consoleLogs: false,   // skip console log check
  eslint: false,        // skip ESLint
  deadImports: { include: ['src/**/*.ts'] },
};
```
