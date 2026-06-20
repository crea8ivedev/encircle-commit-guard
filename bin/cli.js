#!/usr/bin/env node

'use strict';

const path = require('path');
const runner = require('../src/runner');
const postinstall = require('./postinstall');

const projectRoot = process.cwd();
const args = process.argv.slice(2);

// npx commit-guard init — re-runs postinstall (creates config + hook)
if (args[0] === 'init') {
  postinstall.run(projectRoot, { force: args.includes('--force') });
  process.exit(0);
}

const configPath = path.join(projectRoot, 'check.config.js');

// Auto-create config if missing (e.g. after npm update or accidental delete)
if (!require('fs').existsSync(configPath)) {
  console.log('[commit-guard] No check.config.js found — creating one now...');
  postinstall.run(projectRoot, { force: false });
  console.log('[commit-guard] Open check.config.js to configure your rules, then run "npx commit-guard" again.');
  process.exit(0);
}

let config;
try {
  config = require(configPath);
} catch (err) {
  console.error(`[commit-guard] Failed to load check.config.js: ${err.message}`);
  process.exit(1);
}

runner.run(config, projectRoot).then((passed) => {
  process.exit(passed ? 0 : 1);
}).catch((err) => {
  console.error('[commit-guard] Unexpected error:', err.message);
  process.exit(1);
});
