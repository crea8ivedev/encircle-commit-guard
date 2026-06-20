'use strict';

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

async function check(config, projectRoot) {
  const issues = [];
  const structureConfig = config.structure || {};
  const required = structureConfig.required || [];
  const forbidden = structureConfig.forbidden || [];

  // Check required paths/patterns
  for (const pattern of required) {
    const isGlobPattern = /[*?{}[\]]/.test(pattern);

    if (isGlobPattern) {
      const matches = await glob(pattern, { cwd: projectRoot, dot: true });
      if (matches.length === 0) {
        issues.push({ file: pattern, line: null, message: 'Required pattern matched no files' });
      }
    } else {
      const fullPath = path.join(projectRoot, pattern);
      if (!fs.existsSync(fullPath)) {
        issues.push({ file: pattern, line: null, message: 'Required path does not exist' });
      }
    }
  }

  // Check forbidden patterns
  for (const pattern of forbidden) {
    const matches = await glob(pattern, { cwd: projectRoot, dot: true });
    for (const match of matches) {
      issues.push({ file: match, line: null, message: 'Forbidden path exists' });
    }
  }

  return {
    name: 'structure',
    passed: issues.length === 0,
    issues,
  };
}

module.exports = { check };
