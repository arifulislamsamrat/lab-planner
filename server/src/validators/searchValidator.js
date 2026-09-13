const { z } = require('zod');

// Query-string schema for GET /api/search?q=...&limit=...
// `q` is the search term, 1..100 chars, trimmed.
// `limit` caps results per group (default 8, max 20).
const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100),
  limit: z.coerce.number().int().min(1).max(20).optional().default(8),
});

module.exports = { searchQuerySchema };
