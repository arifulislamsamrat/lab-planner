/* eslint-disable no-console */
// Lists users in the real MongoDB (id, email, name, role, isActive) without printing secrets.
// Usage: node scripts/listUsers.js

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set in .env'); process.exit(1); }
  await mongoose.connect(uri);
  try {
    const users = await User.find().sort({ createdAt: 1 }).lean();
    if (users.length === 0) {
      console.log('No users in the database. The next visitor will see the bootstrap form.');
      process.exit(0);
    }
    console.log(`Found ${users.length} user(s):`);
    for (const u of users) {
      console.log(`  - id=${u._id}  email=${u.email}  name=${u.name}  role=${u.role}  isActive=${u.isActive}  createdAt=${u.createdAt.toISOString()}`);
    }
    process.exit(0);
  } catch (e) {
    console.error('Failed:', e.message || e);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
})();
