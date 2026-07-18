'use strict';

// DEPRECATED / UNUSED — reminders are no longer a normal pass/fail checker.
// They now need an interactive y/N prompt and must run only after every
// other check has passed, neither of which fits the standard
// `check(config, projectRoot)` checker interface used by everything else
// in this folder. That logic now lives in `src/reminders.js` and is wired
// directly into `src/runner.js` as a final step, not through the checkers
// array. This file is kept only because it can't be deleted from here;
// it is not required or referenced anywhere.
module.exports = {};
