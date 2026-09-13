const express = require('express');
const cors = require('cors');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// CORS: prefer env var, fall back to known production frontend.
// To add another allowed origin (e.g. a custom domain), update CLIENT_ORIGIN
// in the deployment environment, or extend FALLBACK_CLIENT_ORIGINS.
const FALLBACK_CLIENT_ORIGINS = [
  'https://arifulislamsamrat-lab-planner-6d2c.vercel.app',
  'http://localhost:5173', // Vite dev server
];
const allowedOrigins = (process.env.CLIENT_ORIGIN
  ? process.env.CLIENT_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean)
  : FALLBACK_CLIENT_ORIGINS
);
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow same-origin / no-origin (curl, server-to-server) and explicit allowlist.
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      return cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: false,
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'lab-planner-server', time: new Date().toISOString() });
});

app.use('/api', routes);

app.use((req, res) => {
  res.status(404).json({ error: { message: `Not found: ${req.method} ${req.originalUrl}` } });
});

app.use(errorHandler);

module.exports = app;