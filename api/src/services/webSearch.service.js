const checkReachable = async (url) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return false;
    const xfo = response.headers.get('x-frame-options');
    if (xfo && xfo.toLowerCase() !== 'allowall') return false;
    const csp = response.headers.get('content-security-policy') || '';
    if (csp.toLowerCase().includes("frame-ancestors 'none'") || csp.toLowerCase().includes("frame-ancestors 'self'")) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

const decodeDuckLink = (href = '') => {
  try {
    const urlObj = new URL(href.startsWith('//') ? `https:${href}` : href);
    const uddg = urlObj.searchParams.get('uddg');
    if (uddg) return decodeURIComponent(uddg);
    return href;
  } catch {
    return href;
  }
};

export const searchWeb = async (query) => {
  const ddgUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetch(ddgUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
    },
  });
  if (!response.ok) throw new Error(`DuckDuckGo request failed (${response.status})`);
  const html = await response.text();
  const results = [];
  const anchorRegex = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gim;
  let match;
  while ((match = anchorRegex.exec(html)) !== null && results.length < 20) {
    const href = match[1];
    const titleHtml = match[2] || '';
    const url = decodeDuckLink(href);
    const title = titleHtml.replace(/<[^>]+>/g, '').trim();
    if (url && title) results.push({ title, url });
  }

  let preferredUrl = null;
  for (const result of results.slice(0, 8)) {
    if (await checkReachable(result.url)) {
      preferredUrl = result.url;
      break;
    }
  }

  return { results, preferredUrl };
};
