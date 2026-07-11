'use strict';

const { execSync } = require('child_process');
const { minimatch } = require('minimatch');

function git(args, projectRoot) {
  try {
    return execSync(`git ${args}`, {
      cwd: projectRoot,
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 1024 * 1024 * 20,
    }).toString('utf8');
  } catch {
    return null;
  }
}

function getStagedFiles(projectRoot) {
  const out = git('diff --cached --name-only --diff-filter=ACMR', projectRoot);
  if (out === null) {
    return null;
  }
  return out
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean);
}

// Reads the file exactly as it sits in the index (what would actually be
// committed), not the working tree copy, which may have further edits.
function getStagedContent(relPath, projectRoot) {
  return git(`show ":${relPath}"`, projectRoot);
}

function matchesAny(filePath, patterns) {
  return patterns.some((pattern) => minimatch(filePath, pattern, { matchBase: true, dot: true }));
}

function lineFromPosition(content, position) {
  if (typeof position !== 'number' || Number.isNaN(position)) {
    return null;
  }
  return content.slice(0, position).split('\n').length;
}

function describeJsonError(content, err) {
  const match = /position (\d+)/.exec(err.message);
  const position = match ? parseInt(match[1], 10) : null;
  return { line: lineFromPosition(content, position), message: err.message };
}

async function check(config, projectRoot) {
  const syntaxConfig = config.jsonYamlSyntax || {};
  const includePatterns = syntaxConfig.include || ['**/*.{json,yml,yaml}'];
  const excludePatterns = syntaxConfig.exclude || [
    'node_modules/**',
    '**/*.lock',
    'package-lock.json',
  ];

  const staged = getStagedFiles(projectRoot);

  // Not a git repo, or nothing staged — nothing to enforce.
  if (staged === null) {
    return { name: 'jsonYamlSyntax', passed: true, issues: [] };
  }

  let yaml;
  try {
    yaml = require('js-yaml');
  } catch {
    yaml = null;
  }

  const issues = [];

  for (const relPath of staged) {
    if (!matchesAny(relPath, includePatterns) || matchesAny(relPath, excludePatterns)) {
      continue;
    }

    const content = getStagedContent(relPath, projectRoot);
    if (content === null || !content.trim()) {
      continue; // couldn't read it, or an empty file (not worth flagging)
    }

    const isJson = /\.json$/i.test(relPath);
    const isYaml = /\.ya?ml$/i.test(relPath);

    if (isJson) {
      try {
        JSON.parse(content);
      } catch (err) {
        const { line, message } = describeJsonError(content, err);
        issues.push({ file: relPath, line, message: `Invalid JSON: ${message}` });
      }
    } else if (isYaml) {
      if (!yaml) {
        issues.push({
          file: relPath,
          line: null,
          message: 'js-yaml is not installed — skipping YAML validation for this file (run npm install to enable)',
          warning: true,
        });
        continue;
      }
      try {
        yaml.load(content);
      } catch (err) {
        const line = err.mark && typeof err.mark.line === 'number' ? err.mark.line + 1 : null;
        issues.push({ file: relPath, line, message: `Invalid YAML: ${err.message.split('\n')[0]}` });
      }
    }
  }

  const errors = issues.filter((i) => !i.warning);
  return {
    name: 'jsonYamlSyntax',
    passed: errors.length === 0,
    issues,
  };
}

module.exports = { check };
