const Lab = require('../models/Lab');
const ApiError = require('../utils/ApiError');
const { marked } = require('marked');

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const TIMEOUT_MS = 10_000;

/**
 * Convert a github.com blob URL to its raw.githubusercontent.com equivalent
 * so the response is plain markdown instead of an HTML page.
 *
 * Examples:
 *   https://github.com/user/repo/blob/main/README.md
 *     → https://raw.githubusercontent.com/user/repo/main/README.md
 *
 *   https://github.com/user/repo/blob/master/docs/x.md?plain=1
 *     → https://raw.githubusercontent.com/user/repo/master/docs/x.md
 */
function normalizeMarkdownUrl(input) {
  let url;
  try { url = new URL(input); } catch { return input; }
  if (url.hostname !== 'github.com') return input;
  // Path looks like /<user>/<repo>/blob/<ref>/<...>
  const m = url.pathname.match(/^\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)$/);
  if (!m) return input;
  const [, user, repo, ref, filePath] = m;
  return `https://raw.githubusercontent.com/${user}/${repo}/${ref}/${filePath}${url.search || ''}`;
}

async function fetchWithTimeout(url, opts = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal, redirect: 'follow' });
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function readBounded(res) {
  const contentLength = Number(res.headers.get('content-length') || 0);
  if (contentLength && contentLength > MAX_BYTES) {
    throw new ApiError(413, `Resource too large (${contentLength} bytes)`);
  }
  const reader = res.body.getReader();
  let received = 0;
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_BYTES) {
      try { await reader.cancel(); } catch {}
      throw new ApiError(413, `Resource too large (> ${MAX_BYTES} bytes)`);
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

async function getLabResource(labId) {
  const lab = await Lab.findById(labId).lean();
  if (!lab) throw new ApiError(404, 'Lab not found');

  const rawLink = (lab.mdLink || '').trim();
  const rawContent = (lab.mdContent || '').trim();

  // --- Path 1: inline markdown content takes priority when there's no link ---
  if (!rawLink && rawContent) {
    const html = marked.parse(rawContent);
    return {
      data: {
        labId,
        requestedUrl: '',
        fetchedUrl: '',
        source: 'inline',
        title: lab.title,
        contentType: 'text/markdown',
        html,
      },
    };
  }

  // --- Path 2: link mode (existing behaviour) ---
  if (rawLink) {
    const fetchUrl = normalizeMarkdownUrl(rawLink);
    let res;
    try {
      res = await fetchWithTimeout(fetchUrl, { headers: { 'User-Agent': 'lab-planner/0.1' } });
    } catch (e) {
      throw new ApiError(502, `Could not fetch the resource: ${e.message || 'network error'}`);
    }

    if (!res.ok) {
      throw new ApiError(502, `Resource returned HTTP ${res.status}`);
    }

    const contentType = res.headers.get('content-type') || '';
    const text = await readBounded(res);

    const looksLikeMarkdown =
      /^\s*(#|\*|-|\+|>|```|\[|\d+\.)/m.test(text) || contentType.includes('markdown');

    const html = looksLikeMarkdown ? marked.parse(text) : `<pre>${escapeHtml(text)}</pre>`;

    return {
      data: {
        labId,
        requestedUrl: rawLink,
        fetchedUrl: fetchUrl,
        source: 'link',
        title: lab.title,
        contentType,
        html,
      },
    };
  }

  // --- Neither ---
  throw new ApiError(404, 'No resource set for this lab (link or pasted content)');
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { getLabResource, normalizeMarkdownUrl };