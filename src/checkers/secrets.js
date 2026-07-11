'use strict';

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');
const { minimatch } = require('minimatch');

// Each rule matches a specific, well-known secret format. Keeping these
// narrow (rather than one giant "looks random" heuristic) keeps false
// positives low.
const SECRET_RULES = [
  { name: 'AWS Access Key ID', regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: 'AWS Secret Access Key', regex: /\b(aws_secret_access_key|aws_secret_key)\s*[:=]\s*['"][A-Za-z0-9/+=]{40}['"]/i },
  { name: 'Private key block', regex: /-----BEGIN\s?(RSA|EC|DSA|OPENSSH|PGP)?\s?PRIVATE KEY-----/ },
  { name: 'GitHub token', regex: /\bgh[pousr]_[A-Za-z0-9]{36}\b/ },
  { name: 'Slack token', regex: /\bxox[baprs]-[0-9A-Za-z-]{10,48}\b/ },
  { name: 'Google API key', regex: /\bAIza[0-9A-Za-z\-_]{35}\b/ },
  { name: 'Stripe key', regex: /\b(sk|rk|pk)_(live|test)_[0-9A-Za-z]{16,}\b/ },
  { name: 'JWT', regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  {
    name: 'Generic API key/secret assignment',
    regex: /\b(api[_-]?key|apikey|secret|token|passwd|password|access[_-]?key)\b\s*[:=]\s*['"][A-Za-z0-9_\-/+=]{16,}['"]/i,
  },
];

// Common placeholder values that would otherwise trip the generic rule.
const PLACEHOLDER_REGEX = /(xxxxxxxx|your[_-]?(api|secret|token|key|password)|<[^>]+>|\bexample\b|changeme|placeholder|dummy|redacted|0000000000|process\.env\.)/i;

function matchesAny(filePath, patterns) {
  return patterns.some((pattern) => minimatch(filePath, pattern, { matchBase: true, dot: true }));
}

async function check(config, projectRoot) {
  const issues = [];
  const secretsConfig = config.secrets || {};
  const includePatterns = secretsConfig.include || [
    '**/*.{ts,js,jsx,tsx,json,yml,yaml}',
    '.env*',
  ];
  const excludePatterns = secretsConfig.exclude || [
    'node_modules/**',
    '**/*.lock',
    'package-lock.json',
    'check.config.js', // the tool's own config — its comments reference example keys
    '**/*.test.*',
    '**/*.spec.*',
  ];
  const allowlist = secretsConfig.allowlist || [];

  const files = [];
  for (const pattern of includePatterns) {
    const matches = await glob(pattern, { cwd: projectRoot, dot: true, absolute: true, nodir: true });
    files.push(...matches);
  }

  const uniqueFiles = [...new Set(files)];

  for (const filePath of uniqueFiles) {
    const relPath = path.relative(projectRoot, filePath);

    if (matchesAny(relPath, excludePatterns)) {
      continue;
    }

    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    // Skip binary files (null byte is a reliable signal it's not source text)
    if (content.indexOf('\u0000') !== -1) {
      continue;
    }

    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (allowlist.some((entry) => line.includes(entry))) {
        return;
      }

      if (PLACEHOLDER_REGEX.test(line)) {
        return;
      }

      // Rules are ordered from most specific to most generic — report only
      // the first (most specific) match per line to avoid duplicate noise
      // when e.g. both the Stripe rule and the generic rule match the same key.
      for (const rule of SECRET_RULES) {
        if (rule.regex.test(line)) {
          issues.push({
            file: relPath,
            line: index + 1,
            message: `Possible ${rule.name} found — remove it before committing (or add the exact string to secrets.allowlist if this is a false positive)`,
          });
          break;
        }
      }
    });
  }

  return {
    name: 'secrets',
    passed: issues.length === 0,
    issues,
  };
}

module.exports = { check };
