'use strict';

const readline = require('readline');

function askYesNo(question) {
  return new Promise((resolve) => {

    if (!process.stdin.isTTY) {
      resolve(true);
      return;
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  }); 
}

async function confirmReminders(config) {
  const remindersConfig = config.reminders || {};
  const messages = remindersConfig.messages || [];

  if (messages.length === 0) {
    return true;
  }

  console.log('');
  console.log('Before you commit, please confirm:');
  messages.forEach((message) => console.log(`  [ ] ${message}`));
  console.log('');

  const confirmed = await askYesNo('Continue with commit? (y/N): ');

  if (!confirmed) {
    console.log('');
    console.log('Commit aborted.');
  }

  return confirmed;
}

module.exports = { confirmReminders };
