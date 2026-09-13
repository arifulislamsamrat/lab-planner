/**
 * Markdown renderer shared between the authenticated resource endpoint
 * (`/api/labs/:id/resource`) and the public share endpoint
 * (`/api/public/readme/:token`).
 *
 * Returns a payload ready to send to the client — the HTML is pre-rendered
 * server-side so the client doesn't need to ship `marked`.
 */

const { marked } = require('marked');

/**
 * Render a lab's readme to HTML, supporting both pasted (mdContent) and linked
 * (mdLink) sources. Returns:
 *   { source: 'inline' | 'link', title, html, requestedUrl, fetchedUrl, contentType }
 *
 * Throws ApiError(404) if neither source is set, 502 on link-fetch failure,
 * 413 if the linked resource exceeds the byte cap.
 */
async function renderLabReadme(lab) {
  const rawLink = (lab.mdLink || '').trim();
  const rawContent = (lab.mdContent || '').trim();

  if (!rawLink && rawContent) {
    return {
      source: 'inline',
      title: lab.title,
      html: marked.parse(rawContent),
      requestedUrl: '',
      fetchedUrl: '',
      contentType: 'text/markdown',
    };
  }

  if (rawLink) {
    // Delegate the fetch+normalize logic to resourceService to avoid duplication.
    // We re-implement a small wrapper here so the public endpoint stays
    // independent of the auth context.
    const { normalizeMarkdownUrl } = require('./resourceService');
    const fetchUrl = normalizeMarkdownUrl(rawLink);
    let res;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 10_000);
      try {
        res = await fetch(fetchUrl, {
          headers: { 'User-Agent': 'lab-planner/0.1' },
          signal: ctrl.signal,
          redirect: 'follow',
        });
      } finally {
        clearTimeout(t);
      }
    } catch (e) {
      const ApiError = require('../utils/ApiError');
      throw new ApiError(502, `Could not fetch the resource: ${e.message || 'network error'}`);
    }

    if (!res.ok) {
      const ApiError = require('../utils/ApiError');
      throw new ApiError(502, `Resource returned HTTP ${res.status}`);
    }

    const contentType = res.headers.get('content-type') || '';
    // Bound to 2MB.
    const MAX = 2 * 1024 * 1024;
    const declared = Number(res.headers.get('content-length') || 0);
    if (declared && declared > MAX) {
      const ApiError = require('../utils/ApiError');
      throw new ApiError(413, `Resource too large (${declared} bytes)`);
    }
    const reader = res.body.getReader();
    let received = 0;
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > MAX) {
        try { await reader.cancel(); } catch {}
        const ApiError = require('../utils/ApiError');
        throw new ApiError(413, `Resource too large (> ${MAX} bytes)`);
      }
      chunks.push(value);
    }
    const text = Buffer.concat(chunks).toString('utf-8');

    const looksLikeMarkdown =
      /^\s*(#|\*|-|\+|>|```|\[|\d+\.)/m.test(text) || contentType.includes('markdown');
    const html = looksLikeMarkdown ? marked.parse(text) : `<pre>${escapeHtml(text)}</pre>`;

    return {
      source: 'link',
      title: lab.title,
      html,
      requestedUrl: rawLink,
      fetchedUrl: fetchUrl,
      contentType,
    };
  }

  const ApiError = require('../utils/ApiError');
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

module.exports = { renderLabReadme };
