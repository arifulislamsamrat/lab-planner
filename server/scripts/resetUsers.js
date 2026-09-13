/* eslint-disable no-console */
// DESTRUCTIVE: deletes ALL users from the database.
// Use this when the bootstrap form is gated because a previous admin already exists,
// but you don't remember the credentials. Course/milestone/module/lab data is NOT touched.
// Usage:
//   node scripts/resetUsers.js              # requires interactive "yes" confirmation
//   FORCE_RESET_USERS=1 node scripts/resetUsers.js   # skips confirmation (CI / scripted)

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const readline = require('readline');
const mongoose = require('mongoose');
const User = require('../src/models/User');

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => { rl.close(); resolve(answer); });
  });
}

async function main() {
  const force = process.env.FORCE_RESET_USERS === '1';
  if (!force) {
    const ans = (await ask('This will DELETE every user and re-enable the bootstrap form. Type "yes" to continue: ')).trim();
    if (ans !== 'yes') {
      console.log('Aborted.');
      process.exit(0);
    }
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set in .env'); process.exit(1); }
  await mongoose.connect(uri);
  try {
    const before = await User.countDocuments();
    const result = await User.deleteMany({});
    console.log(`Deleted ${result.deletedCount} user(s) (was ${before}).`);
    console.log('Refresh the app — the Create-first-admin form will appear again.');
    process.exit(0);
  } catch (e) {
    console.error('Failed:', e.message || e);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
