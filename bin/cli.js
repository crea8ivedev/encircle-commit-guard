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

// npx commit-guard commit-msg <path-to-message-file>
// Invoked by the git `commit-msg` hook (not `pre-commit`) — validates the
// commit message text itself rather than scanning project files.
if (args[0] === 'commit-msg') {
  const msgFilePath = args[1];
  const fs = require('fs');

  if (!msgFilePath) {
    console.error('[commit-guard] commit-msg hook invoked without a message file path');
    process.exit(1);
  }

  const msgConfigPath = path.join(projectRoot, 'check.config.js');
  let msgConfig = {};
  if (fs.existsSync(msgConfigPath)) {
    try {
      msgConfig = require(msgConfigPath);
    } catch (err) {
      console.error(`[commit-guard] Failed to load check.config.js: ${err.message}`);
      process.exit(1);
    }
  }

  if (msgConfig.commitMessage === false) {
    process.exit(0);
  }

  let rawMessage;
  try {
    rawMessage = fs.readFileSync(msgFilePath, 'utf8');
  } catch (err) {
    console.error(`[commit-guard] Could not read commit message file: ${err.message}`);
    process.exit(1);
  }

  const commitMessageChecker = require('../src/checkers/commitMessage');
  const reporter = require('../src/reporter');
  const result = commitMessageChecker.checkMessage(msgConfig, rawMessage);
  reporter.report([result]);
  process.exit(result.passed ? 0 : 1);
}

const configPath = path.join(projectRoot, 'check.config.js');

// Auto-create config if missing (e.g. after npm update or accidental delete)
if (!require('fs').existsSync(configPath)) {
  postinstall.run(projectRoot, { force: false });
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
