# encircle-commit-guard

A CLI tool that automatically validates your Node.js/TypeScript project against configurable rules on every git commit — branch protection, branch naming, author email, secret scanning, commit message quality, lockfile sync, merge conflict markers, large files, JSON/YAML syntax, case-collision filenames, folder/file structure, console/debugger statements, focused/skipped tests, empty catch blocks, TODOs, ESLint, and unused imports.

## What it does

- **Protected branches check** — blocks commits made directly on branches you name (e.g. `main`, `master`)
- **Branch naming check** — requires new branches to follow a naming convention (e.g. `feature/xyz`)
- **Author email check** — requires the committer's git email to be on an approved domain (opt-in)
- **Secrets check** — scans staged/source files for likely API keys, tokens, and private keys before they get committed
- **Commit message check** — validates the commit message itself (length, generic messages, optional Conventional Commits pattern)
- **Lockfile sync check** — warns if `package.json` dependencies changed but the lockfile wasn't updated to match
- **Merge conflict marker check** — catches leftover `<<<<<<<`/`=======`/`>>>>>>>` markers from a sloppily-resolved merge
- **Large file check** — blocks committing files over a size limit
- **JSON/YAML syntax check** — fails on invalid staged `.json`/`.yml`/`.yaml` files
- **Case-collision check** — flags a new file whose path differs only by letter case from an existing one
- **Structure check** — verifies required files/folders exist and forbidden patterns are absent
- **Console log check** — detects `console.log`, `console.warn`, `console.error`, `console.debug` in source files
- **Debugger statement check** — detects leftover `debugger;` statements
- **Focused/skipped test check** — flags `.only(`/`.skip(` left in test files
- **Empty catch block check** — flags a `catch` block with nothing inside it
- **TODO/FIXME tracker** — surfaces lingering `TODO`/`FIXME`/`HACK`/`XXX` comments (informational by default)
- **ESLint check** — runs ESLint using the project's own `.eslintrc` config
- **Dead imports check** — detects imported symbols that are never used in the file body

## Installation

```bash
npm install --save-dev encircle-commit-guard
```

After installation, three things happen automatically:
1. `check.config.js` is created in your project root with all rules documented
2. `.git/hooks/pre-commit` is set up — runs structure/secrets/console-log/ESLint/dead-import checks on every `git commit`
3. `.git/hooks/commit-msg` is set up — validates the commit message text itself

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

  protectedBranches: {
    branches: ['main', 'master'],
  },

  branchNaming: {
    // pattern: /^(feature|feat|bugfix|fix|hotfix|release|chore|docs|refactor|test)\/[a-z0-9._-]+$/,
    exempt: ['main', 'master', 'develop'],
  },

  authorEmail: {
    allowedEmails: [
      // 'jane@yourcompany.com',
    ],
    allowedUsernames: [
      // 'Jane Smith',
    ],
  },

  secrets: {
    include: ['**/*.{ts,js,jsx,tsx,json,yml,yaml}', '.env*'],
    exclude: ['node_modules/**', 'check.config.js'],
    allowlist: [
      // 'AKIAIOSFODNN7EXAMPLE',
    ],
  },

  commitMessage: {
    minLength: 10,
    maxHeaderLength: 100,
    disallowGeneric: true,
    // pattern: /^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)(\(.+\))?: .+/,
  },

  mergeConflicts: {
    exclude: ['node_modules/**', 'package-lock.json'],
  },

  largeFiles: {
    maxSizeKb: 500,
    exclude: ['node_modules/**', 'package-lock.json'],
  },

  jsonYamlSyntax: {
    include: ['**/*.{json,yml,yaml}'],
    exclude: ['node_modules/**', 'package-lock.json'],
  },

  caseCollision: {
    exclude: ['node_modules/**'],
  },

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

  debuggerStatements: {
    include: ['src/**/*.{ts,js,jsx,tsx}'],
    exclude: ['**/*.test.*', '**/*.spec.*'],
  },

  focusedTests: {
    include: ['**/*.{test,spec}.{ts,js,jsx,tsx}'],
    failOnSkip: true,
  },

  emptyCatch: {
    include: ['src/**/*.{ts,js,jsx,tsx}'],
    exclude: ['**/*.test.*', '**/*.spec.*'],
  },

  todoTracker: {
    include: ['src/**/*.{ts,js,jsx,tsx}'],
    markers: ['TODO', 'FIXME', 'HACK', 'XXX'],
    blocking: false,
  },

  lockfileSync: {
    lockfiles: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'npm-shrinkwrap.json'],
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

### `protectedBranches`

| Option | Type | Default | Description |
|---|---|---|---|
| `branches` | `string[]` | `['main', 'master']` | Branch names (or glob patterns, e.g. `'release/*'`) that cannot be committed to directly |

Fails the check if the current branch matches any entry. Useful for forcing everyone onto feature branches + pull requests. Has no effect outside a git repo or in detached HEAD state.

Set `protectedBranches: false` to skip this check.

---

### `branchNaming`

| Option | Type | Default | Description |
|---|---|---|---|
| `pattern` | `RegExp` | `/^(feature\|feat\|bugfix\|fix\|hotfix\|release\|chore\|docs\|refactor\|test)\/[a-z0-9._-]+$/` | Pattern the branch name must match |
| `exempt` | `string[]` | `['main', 'master', 'develop']` | Branch names (or glob patterns) that skip the check entirely |

Fails if the current branch doesn't match `pattern` and isn't in `exempt`. Has no effect outside a git repo or in detached HEAD state.

Set `branchNaming: false` to skip this check.

---

### `authorEmail`

| Option | Type | Default | Description |
|---|---|---|---|
| `allowedEmails` | `string[]` | `[]` | Exact email addresses allowed to author commits (case-insensitive) |
| `allowedUsernames` | `string[]` | `[]` | Exact `git config user.name` values allowed (case-insensitive) |

Reads the effective `git config user.email` / `user.name` (whatever will actually be attached to the commit) and fails if either configured list isn't matched. Both lists are independent and opt-in — leave one empty to skip that particular check. With both empty (the default) this check always passes. Useful for catching a personal git identity accidentally used on a work machine, or restricting commits to a known set of committers.

Set `authorEmail: false` to skip this check.

---

### `secrets`

| Option | Type | Default | Description |
|---|---|---|---|
| `include` | `string[]` | `['**/*.{ts,js,jsx,tsx,json,yml,yaml}', '.env*']` | Files to scan |
| `exclude` | `string[]` | `['node_modules/**', '**/*.lock', 'package-lock.json', 'check.config.js', '**/*.test.*', '**/*.spec.*']` | Files to skip |
| `allowlist` | `string[]` | `[]` | Exact substrings to never flag (e.g. a documented example key) |

Looks for AWS access keys, private key blocks, GitHub/Slack/Stripe/Google tokens, JWTs, and generic `key/secret/token/password = "..."` assignments. Skips lines that look like placeholders (`your_api_key_here`, `<REDACTED>`, `changeme`, etc.).

Set `secrets: false` to skip this check.

---

### `commitMessage`

| Option | Type | Default | Description |
|---|---|---|---|
| `minLength` | `number` | `10` | Minimum length of the (comment-stripped) commit message |
| `maxHeaderLength` | `number` | `100` | Maximum length of the first line |
| `disallowGeneric` | `boolean` | `true` | Blocks non-descriptive messages like `fix`, `wip`, `update` |
| `pattern` | `RegExp` | `null` | If set, the first line must match this pattern (e.g. Conventional Commits) |

Unlike the other checks, this one runs via the separate `commit-msg` git hook (installed automatically) rather than `pre-commit`, since it needs the commit message text rather than project files.

Set `commitMessage: false` to skip this check.

---

### `lockfileSync`

| Option | Type | Default | Description |
|---|---|---|---|
| `lockfiles` | `string[]` | `['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'npm-shrinkwrap.json']` | Lockfile names to check for |

If `package.json`'s `dependencies` / `devDependencies` / `peerDependencies` / `optionalDependencies` changed compared to the last commit, fails unless a matching lockfile (whichever one actually exists in the project) is also staged. Non-dependency edits to `package.json` (scripts, description, etc.) don't trigger it. Has no effect outside a git repo.

Set `lockfileSync: false` to skip this check.

---

### `mergeConflicts`

Scans staged files for leftover conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`). Git only blocks a commit while a file is in the "unmerged" state — once you `git add` a file, git trusts that it's resolved and never re-checks the content. This catches the case where a conflict was resolved by hand but a marker was missed.

Set `mergeConflicts: false` to skip this check.

---

### `largeFiles`

| Option | Type | Default | Description |
|---|---|---|---|
| `maxSizeKb` | `number` | `500` | Maximum size (in KB) for any staged file |
| `exclude` | `string[]` | `['node_modules/**', '**/*.lock', 'package-lock.json']` | Files to skip |

Checks the actual size of each staged file as it sits in git's index (what would really be committed). Useful for keeping build output, database dumps, videos, and zips out of history — git never really forgets a large blob once it's committed.

Set `largeFiles: false` to skip this check.

---

### `jsonYamlSyntax`

| Option | Type | Default | Description |
|---|---|---|---|
| `include` | `string[]` | `['**/*.{json,yml,yaml}']` | Files to scan |
| `exclude` | `string[]` | `['node_modules/**', '**/*.lock', 'package-lock.json']` | Files to skip |

Parses each staged JSON file with `JSON.parse` and each staged YAML file with `js-yaml`, reporting the line number of any syntax error. Catches a stray trailing comma or bad indent in `package.json`, `tsconfig.json`, CI config files, etc. before it breaks the next person's install or build. Empty files are skipped rather than flagged.

Set `jsonYamlSyntax: false` to skip this check.

---

### `caseCollision`

| Option | Type | Default | Description |
|---|---|---|---|
| `exclude` | `string[]` | `['node_modules/**']` | Files to skip |

Flags a newly added or renamed staged file whose path differs only by letter case from another tracked file (e.g. `Utils.ts` vs `utils.ts`). Both exist happily side-by-side on Linux, but collide on case-insensitive filesystems (Windows, default macOS), causing confusing checkout/build failures for some teammates. Only fires when the current commit is the one introducing the collision — a pre-existing one elsewhere in the repo won't block unrelated commits.

Set `caseCollision: false` to skip this check.

---

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

### `debuggerStatements`

| Option | Type | Default | Description |
|---|---|---|---|
| `include` | `string[]` | `['src/**/*.{ts,js,jsx,tsx}']` | Files to scan |
| `exclude` | `string[]` | `['**/*.test.*', '**/*.spec.*']` | Files to skip |

Detects `debugger;` used as a statement (e.g. `debugger;`, `if (x) debugger;`). Doesn't flag identifiers like `debuggerFlag` or commented-out lines.

Set `debuggerStatements: false` to skip this check.

---

### `focusedTests`

| Option | Type | Default | Description |
|---|---|---|---|
| `include` | `string[]` | `['**/*.{test,spec}.{ts,js,jsx,tsx}']` | Files to scan |
| `exclude` | `string[]` | `['node_modules/**']` | Files to skip |
| `failOnSkip` | `boolean` | `true` | Whether `.skip(`/`xit`/`xdescribe` fail the check (vs. just warn) |

Detects Jest/Mocha/Jasmine/Cypress-style `.only(` (and `fdescribe`/`fit`) — which runs *only* that block and silently skips the rest of the suite — and `.skip(` (and `xdescribe`/`xit`). `.only` always fails; `.skip` fails only if `failOnSkip` is true.

Set `focusedTests: false` to skip this check.

---

### `emptyCatch`

| Option | Type | Default | Description |
|---|---|---|---|
| `include` | `string[]` | `['src/**/*.{ts,js,jsx,tsx}']` | Files to scan |
| `exclude` | `string[]` | `['**/*.test.*', '**/*.spec.*']` | Files to skip |

Flags a `catch` block with nothing inside it (`catch {}`, `catch (e) {}`) — a silently swallowed error. A catch block containing even just a comment (e.g. `catch (e) { /* expected during retries */ }`) is treated as documented intent and left alone.

Set `emptyCatch: false` to skip this check.

---

### `todoTracker`

| Option | Type | Default | Description |
|---|---|---|---|
| `include` | `string[]` | `['src/**/*.{ts,js,jsx,tsx}']` | Files to scan |
| `exclude` | `string[]` | `['**/*.test.*', '**/*.spec.*']` | Files to skip |
| `markers` | `string[]` | `['TODO', 'FIXME', 'HACK', 'XXX']` | Comment markers to look for |
| `blocking` | `boolean` | `false` | If true, found markers fail the check instead of just being shown as warnings |

Only counts a marker when it appears inside an actual comment, not e.g. a variable named `todoList`.

Set `todoTracker: false` to skip this check.

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

## Git hooks

Both hooks are installed automatically. To set them up manually:

```bash
# pre-commit — runs structure/secrets/console-log/ESLint/dead-import checks
printf '#!/bin/sh\nnpx commit-guard\n' > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

# commit-msg — validates the commit message text
printf '#!/bin/sh\nnpx commit-guard commit-msg "$1"\n' > .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg
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
