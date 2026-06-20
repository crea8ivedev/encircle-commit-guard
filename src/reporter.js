'use strict';

const chalk = require('chalk');

function report(results) {
  let totalIssues = 0;
  let passed = 0;
  let failed = 0;

  console.log('');
  console.log(chalk.bold('=== commit-guard results ==='));
  console.log('');

  for (const result of results) {
    const header = chalk.bold(result.name.toUpperCase());

    if (result.passed) {
      console.log(chalk.green(`[PASS] ${header}`));
      passed++;
    } else {
      console.log(chalk.red(`[FAIL] ${header}`));
      failed++;
    }

    if (result.issues && result.issues.length > 0) {
      for (const issue of result.issues) {
        totalIssues++;
        const location = issue.file
          ? issue.line
            ? `  ${issue.file}:${issue.line}`
            : `  ${issue.file}`
          : '';

        if (issue.warning) {
          console.log(chalk.yellow(`  [warn] ${location ? location + ' - ' : ''}${issue.message}`));
        } else {
          console.log(chalk.red(`  [issue]${location ? ' ' + location.trim() + ' -' : ''} ${issue.message}`));
        }
      }
    }

    console.log('');
  }

  const summaryPassed = chalk.green(`${passed} checks passed`);
  const summaryFailed = failed > 0 ? chalk.red(`${failed} checks failed`) : chalk.green(`${failed} checks failed`);
  const summaryIssues = totalIssues > 0 ? chalk.red(`${totalIssues} total issues`) : chalk.green(`${totalIssues} total issues`);

  console.log(chalk.bold(`Summary: ${summaryPassed}, ${summaryFailed}, ${summaryIssues}`));
  console.log('');
}

module.exports = { report };
