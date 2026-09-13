// Boots an in-memory MongoDB and the express app for smoke testing.
// Used only by the local smoke script (not part of production runtime).
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');

async function startTestServer() {
  const mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri());
  const server = app.listen(0);
  const port = server.address().port;
  return { server, port, mem };
}

module.exports = { startTestServer };