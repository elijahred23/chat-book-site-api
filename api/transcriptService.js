import { getSubtitles } from 'youtube-captions-scraper';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ProxyAgent, setGlobalDispatcher } from 'undici';

// ----------------------------
//   Proxy setup (Webshare)
// ----------------------------
const WEBSHARE_PROXY_URL = 'http://mbrbdnsi:qlxjwi1vboda@p.webshare.io:80';
if (!process.env.HTTPS_PROXY) process.env.HTTPS_PROXY = WEBSHARE_PROXY_URL;
if (!process.env.HTTP_PROXY) process.env.HTTP_PROXY = WEBSHARE_PROXY_URL;
try {
  setGlobalDispatcher(new ProxyAgent(WEBSHARE_PROXY_URL));
} catch (err) {
  // If undici proxy configuration fails we still proceed without crashing.
  console.error('Failed to set proxy dispatcher', err);
}

const ILLEGAL_FILENAME_CHARS = /[\\/*?:"<>|]/g;
const PREFERRED_LANGS = ['en', 'en-US', 'en-GB'];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const errorLogPath = path.join(__dirname, 'error.log');

const logTranscriptError = (err, context = '') => {
  const msg = err instanceof Error ? `${err.message}\n${err.stack || ''}` : String(err);
  const entry = `[${new Date().toISOString()}] transcriptService${context ? ` ${context}` : ''}: ${msg}\n\n`;
  try {
    fs.appendFile(errorLogPath, entry, () => {});
  } catch {
    // ignore logging errors
  }
  console.error(entry);
};

export function extractVideoId(input = '') {
  const trimmed = String(input || '').trim();
  if (!trimmed) return null;

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname || '';
    if (hostname.includes('youtu.be')) {
      const candidate = parsed.pathname.replace('/', '');
      if (candidate) return candidate;
    }
    if (hostname.includes('youtube.com')) {
      const candidate = parsed.searchParams.get('v');
      if (candidate) return candidate;
      const pathMatch = parsed.pathname.match(/\/(embed|shorts)\/([a-zA-Z0-9_-]{11})/);
      if (pathMatch?.[2]) return pathMatch[2];
    }
  } catch {
    // ignore parsing failure
  }

  return null;
}

export async function getVideoTitle(videoId) {
  const oembed = `https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${videoId}&format=json`;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch(oembed, { signal: controller.signal });
    clearTimeout(timer);
    if (!resp.ok) throw new Error(`Title lookup failed ${resp.status}`);
    const data = await resp.json();
    return data?.title || `Video_${videoId}`;
  } catch {
    logTranscriptError(new Error(`Title lookup failed for ${videoId}`));
    return `Video_${videoId}`;
  }
}

export function sanitizeFilename(title = '') {
  return title.replace(ILLEGAL_FILENAME_CHARS, '');
}

async function fetchTranscriptForVideo(videoId) {
  let lastError = null;

  const tryLanguage = async (lang) => {
    const captions = await getSubtitles({ videoID: videoId, lang });
    const text = captions
      .map((c) => c?.text || '')
      .filter(Boolean)
      .join(' ')
      .trim();
    if (!text) throw new Error('No transcript lines found');
    return text;
  };

  for (const lang of PREFERRED_LANGS) {
    try {
      return await tryLanguage(lang);
    } catch (err) {
      lastError = err;
      logTranscriptError(err, `fetchTranscriptForVideo lang=${lang} video=${videoId}`);
    }
  }

  // Final fallback: let the scraper decide default language
  try {
    return await tryLanguage('en');
  } catch (err) {
    lastError = err;
    logTranscriptError(err, `fetchTranscriptForVideo fallback video=${videoId}`);
  }

  throw lastError || new Error('Failed to fetch transcript');
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchTranscriptWithMetadata(urlOrId) {
  const videoId = extractVideoId(urlOrId);
  if (!videoId) {
    return { error: 'Invalid YouTube URL or video ID' };
  }

  let lastError = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      console.log({videoId, attempt})
      const transcript = await fetchTranscriptForVideo(videoId);
      const title = await getVideoTitle(videoId);
      return {
        videoId,
        title,
        filename: sanitizeFilename(title),
        transcript,
      };
    } catch (err) {
      lastError = err;
      logTranscriptError(err, `fetchTranscriptWithMetadata attempt=${attempt + 1} video=${videoId}`);
      if (attempt < 3) {
        await delay(500 * (attempt + 1));
      }
    }
  }

  logTranscriptError(lastError, `fetchTranscriptWithMetadata finalFailure video=${videoId}`);
  return { error: lastError?.message || 'Failed to fetch transcript' };
}
