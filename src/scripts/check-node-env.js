const { engines } = require('../../package.json');
const semver = require('semver'); // Requires semver to be installed, but we can do a simple check

const expectedNodeVersion = '>=18.0.0'; 
const currentNodeVersion = process.version;

// Simple version check without semver package dependency for postinstall
const currentMajor = parseInt(currentNodeVersion.replace('v', '').split('.')[0], 10);

if (currentMajor < 18) {
  console.error('\x1b[31m%s\x1b[0m', '=========================================================');
  console.error('\x1b[31m%s\x1b[0m', 'ERROR: Unsupported Node.js version.');
  console.error('\x1b[31m%s\x1b[0m', `Campus Hub requires Node.js v18 or higher.`);
  console.error('\x1b[31m%s\x1b[0m', `You are running ${currentNodeVersion}.`);
  console.error('\x1b[31m%s\x1b[0m', 'Please upgrade Node.js before running npm install.');
  console.error('\x1b[31m%s\x1b[0m', '=========================================================');
  process.exit(1);
} else {
  console.log('\x1b[32m%s\x1b[0m', `Node version check passed (v${currentMajor}).`);
}
