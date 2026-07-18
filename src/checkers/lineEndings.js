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

// Counts CRLF ("\r\n") line endings vs. bare-LF ("\n" not preceded by "\r")
// line endings in the same file.
function countLineEndings(content) {
  let crlf = 0;
  let lfOnly = 0;

  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\n') {
      if (i > 0 && content[i - 1] === '\r') {
        crlf++;
      } else {
        lfOnly++;
      }
    }
  }

  return { crlf, lfOnly };
}

async function check(config, projectRoot) {
  const leConfig = config.lineEndings || {};
  const includePatterns = leConfig.include || ['**/*'];
  const excludePatterns = leConfig.exclude || [
    'node_modules/**',
    '**/*.lock',
    'package-lock.json',
    '**/*.{png,jpg,jpeg,gif,ico,woff,woff2,ttf,eot,pdf,zip}',
  ];
  // 'lf' or 'crlf' to also enforce a single style repo-wide. Leaving this
  // unset only catches a file with a MIX of both within itself, which is
  // almost always an accidental partial conversion, not an intentional choice.
  const enforce = leConfig.enforce || null;

  const staged = getStagedFiles(projectRoot);

  // Not a git repo, or nothing staged — nothing to enforce.
  if (staged === null) {
    return { name: 'lineEndings', passed: true, issues: [] };
  }

  const issues = [];

  for (const relPath of staged) {
    if (!matchesAny(relPath, includePatterns) || matchesAny(relPath, excludePatterns)) {
      continue;
    }

    const content = getStagedContent(relPath, projectRoot);
    if (content === null || /\x00/.test(content)) {
      continue; // couldn't read it, or looks binary
    }

    const { crlf, lfOnly } = countLineEndings(content);

    if (crlf === 0 && lfOnly === 0) {
      continue; // single line, or empty file — nothing to compare
    }

    if (crlf > 0 && lfOnly > 0) {
      issues.push({
        file: relPath,
        line: null,
        message: `Mixed line endings: ${crlf} line(s) end in CRLF and ${lfOnly} end in LF. This is almost always an editor partially converting the file, and it's why merges/diffs show the WHOLE file as changed even when nothing meaningful was edited. Re-save the file with a single, consistent line ending.`,
      });
      continue;
    }

    if (enforce === 'lf' && crlf > 0) {
      issues.push({
        file: relPath,
        line: null,
        message: `File uses CRLF line endings, but this project enforces LF. Convert it (most editors have a "line ending" setting in the status bar).`,
      });
    } else if (enforce === 'crlf' && lfOnly > 0) {
      issues.push({
        file: relPath,
        line: null,
        message: 'File uses LF line endings, but this project enforces CRLF.',
      });
    }
  }

  return {
    name: 'lineEndings',
    passed: issues.length === 0,
    issues,
  };
}

module.exports = { check };
