/* eslint-disable no-console */
// Creates (or resets) an admin user directly against the real MongoDB.
// Usage:
//   node scripts/createAdmin.js                          # interactive (uses readline)
//   ADMIN_EMAIL=a@b.com ADMIN_PASSWORD=hunter22 node scripts/createAdmin.js
//
// What it does:
//   - Connects to MONGODB_URI from .env.
//   - If a user with ADMIN_EMAIL exists, updates passwordHash + name + role=ADMIN + isActive=true.
//   - Otherwise, creates a new admin.
//   - Exits 0 on success, 1 on failure.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
if (!process.env.JWT_SECRET) {
  // We don't actually sign a token here, but requireAuth reads JWT_SECRET, and
  // we want the env to be consistent with the server's expectations.
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'cli-createAdmin-temp-secret';
}

const readline = require('readline');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    // Hide password input.
    if (question.toLowerCase().includes('password')) {
      const stdin = process.stdin;
      const stdout = process.stdout;
      stdout.write(question);
      stdin.setRawMode?.(true);
      stdin.resume();
      stdin.setEncoding('utf8');
      let buf = '';
      const onData = (ch) => {
        if (ch === '\n' || ch === '\r' || ch === '\u0003') {
          stdin.setRawMode?.(false);
          stdin.removeListener('data', onData);
          stdin.pause();
          stdout.write('\n');
          rl.close();
          resolve(buf);
        } else if (ch === '\u0008' || ch === '\u007f') {
          buf = buf.slice(0, -1);
        } else {
          buf += ch;
          stdout.write('*');
        }
      };
      stdin.on('data', onData);
    } else {
      rl.question(question, (answer) => { rl.close(); resolve(answer); });
    }
  });
}

async function main() {
  let email = (process.env.ADMIN_EMAIL || '').trim();
  let name = (process.env.ADMIN_NAME || '').trim();
  let password = process.env.ADMIN_PASSWORD || '';

  if (!email) email = (await ask('Admin email: ')).trim();
  if (!name) name = (await ask('Admin name (or press enter to skip): ')).trim();
  if (!password) password = await ask('Admin password (min 8 chars): ');

  email = email.toLowerCase();
  if (!email || !email.includes('@')) { console.error('Invalid email'); process.exit(1); }
  if (password.length < 8) { console.error('Password must be at least 8 characters'); process.exit(1); }

  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI is not set in .env'); process.exit(1); }

  await mongoose.connect(uri);
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const existing = await User.findOne({ email });
    let user;
    if (existing) {
      existing.passwordHash = passwordHash;
      existing.role = 'ADMIN';
      existing.isActive = true;
      if (name) existing.name = name;
      user = await existing.save();
      console.log(`Updated existing user → admin: ${user.email}`);
    } else {
      user = await User.create({
        email,
        name: name || email.split('@')[0],
        role: 'ADMIN',
        isActive: true,
        passwordHash,
      });
      console.log(`Created admin: ${user.email} (id=${user._id})`);
    }
    process.exit(0);
  } catch (e) {
    console.error('Failed:', e.message || e);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

main();
