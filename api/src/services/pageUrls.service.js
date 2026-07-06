import { validatePublicPageUrl } from '../utils/urlSafety.js';

const PAGE_HTML_LIMIT_BYTES = 5 * 1024 * 1024;
const PAGE_FETCH_TIMEOUT_MS = 12000;
const PAGE_FETCH_REDIRECT_LIMIT = 5;

const fetchPublicHtml = async (initialUrl) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PAGE_FETCH_TIMEOUT_MS);
  let nextUrl = initialUrl;

  try {
    for (let redirectCount = 0; redirectCount <= PAGE_FETCH_REDIRECT_LIMIT; redirectCount += 1) {
      const parsed = await validatePublicPageUrl(nextUrl);
      const response = await fetch(parsed, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ChatBookUrlExtractor/1.0)',
          Accept: 'text/html,application/xhtml+xml',
        },
      });

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        if (!location) throw new Error(`Page redirect ${response.status} did not include a location.`);
        if (redirectCount === PAGE_FETCH_REDIRECT_LIMIT) throw new Error('The page redirected too many times.');
        nextUrl = new URL(location, parsed).href;
        continue;
      }

      if (!response.ok) throw new Error(`Page request failed (${response.status}).`);
      const contentType = response.headers.get('content-type') || '';
      if (!/\b(?:text\/html|application\/xhtml\+xml)\b/i.test(contentType)) {
        throw new Error('The URL did not return an HTML page.');
      }

      const declaredLength = Number(response.headers.get('content-length') || 0);
      if (declaredLength > PAGE_HTML_LIMIT_BYTES) throw new Error('The HTML page is too large to inspect.');

      const reader = response.body?.getReader();
      if (!reader) return { html: await response.text(), finalUrl: parsed.href };
      const chunks = [];
      let received = 0;
      let streamComplete = false;
      while (!streamComplete) {
        const { done, value } = await reader.read();
        if (done) {
          streamComplete = true;
          continue;
        }
        received += value.byteLength;
        if (received > PAGE_HTML_LIMIT_BYTES) {
          await reader.cancel();
          throw new Error('The HTML page is too large to inspect.');
        }
        chunks.push(value);
      }
      const bytes = new Uint8Array(received);
      let offset = 0;
      chunks.forEach((chunk) => {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
      });
      return { html: new TextDecoder().decode(bytes), finalUrl: parsed.href };
    }
  } finally {
    clearTimeout(timeout);
  }

  throw new Error('Unable to fetch the page.');
};

const decodeHtmlUrl = (value = '') => value
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&apos;|&#39;/gi, "'")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));

const extractPageUrls = (html, pageUrl) => {
  const urls = new Set();
  const baseMatch = html.match(/<base\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i);
  const rawBase = decodeHtmlUrl(baseMatch?.[1] || baseMatch?.[2] || baseMatch?.[3] || '');
  let baseUrl = pageUrl;
  try {
    if (rawBase) baseUrl = new URL(rawBase, pageUrl).href;
  } catch {
    // Keep the fetched page URL as the base when the document's base URL is invalid.
  }

  const addUrl = (rawValue) => {
    const value = decodeHtmlUrl(rawValue).trim();
    if (!value || value.startsWith('#')) return;
    if (/^data:image\/[a-z0-9.+-]+(?:;[^,]*)?,/i.test(value)) {
      urls.add(value);
      return;
    }
    try {
      const resolved = new URL(value, baseUrl);
      if (resolved.protocol === 'http:' || resolved.protocol === 'https:') {
        resolved.hash = '';
        urls.add(resolved.href);
      }
    } catch {
      // Ignore malformed and non-URL attribute values.
    }
  };

  const attributePattern = /\b(?:href|src|poster|action|formaction|cite|data|background|longdesc|manifest)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi;
  let match;
  while ((match = attributePattern.exec(html)) !== null) addUrl(match[1] || match[2] || match[3] || '');

  const srcsetPattern = /\bsrcset\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/gi;
  while ((match = srcsetPattern.exec(html)) !== null) {
    const srcset = decodeHtmlUrl(match[1] || match[2] || match[3] || '');
    const candidates = srcset.match(/data:image\/[^\s,]+,[^\s,]+|[^\s,]+/gi) || [];
    candidates.forEach((candidate) => {
      if (!/^\d+(?:\.\d+)?[wx]$/i.test(candidate)) addUrl(candidate);
    });
  }

  const cssUrlPattern = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)'"]+))\s*\)/gi;
  while ((match = cssUrlPattern.exec(html)) !== null) addUrl(match[1] || match[2] || match[3] || '');

  const inlineAbsolutePattern = /(?:https?:\/\/|data:image\/)[^\s"'<>`]+/gi;
  while ((match = inlineAbsolutePattern.exec(html)) !== null) addUrl(match[0].replace(/[),.;]+$/, ''));

  return [...urls];
};

export const getPageUrls = async (requestedUrl) => {
  const { html, finalUrl } = await fetchPublicHtml(requestedUrl);
  return { urls: extractPageUrls(html, finalUrl), finalUrl };
};
