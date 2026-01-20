import { getSubtitles } from 'youtube-captions-scraper';

const ILLEGAL_FILENAME_CHARS = /[\\/*?:"<>|]/g;
const PREFERRED_LANGS = ['en', 'en-US', 'en-GB'];
const MAX_TRANSCRIPT_CACHE = 50;

// In-memory LRU cache
const transcriptCache = new Map();

function touchLocalCache(videoId, transcript) {
  if (transcriptCache.has(videoId)) {
    transcriptCache.delete(videoId);
  }
  transcriptCache.set(videoId, transcript);
  if (transcriptCache.size > MAX_TRANSCRIPT_CACHE) {
    const oldestKey = transcriptCache.keys().next().value;
    transcriptCache.delete(oldestKey);
  }
}

function cacheTranscript(videoId, transcript) {
  touchLocalCache(videoId, transcript);
}

function getCachedTranscript(videoId) {
  if (transcriptCache.has(videoId)) {
    const cached = transcriptCache.get(videoId);
    touchLocalCache(videoId, cached);
    return cached;
  }
  return null;
}

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
    }
  }

  // Final fallback: let the scraper decide default language
  try {
    return await tryLanguage('en');
  } catch (err) {
    lastError = err;
  }

  throw lastError || new Error('Failed to fetch transcript');
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchTranscriptWithMetadata(urlOrId) {
  const videoId = extractVideoId(urlOrId);
  if (!videoId) {
    return { error: 'Invalid YouTube URL or video ID' };
  }

  const cached = await getCachedTranscript(videoId);
  if (cached) {
    const title = await getVideoTitle(videoId);
    return {
      videoId,
      title,
      filename: sanitizeFilename(title),
      transcript: cached,
      cached: true,
    };
  }

  let lastError = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const transcript = await fetchTranscriptForVideo(videoId);
      await cacheTranscript(videoId, transcript);
      const title = await getVideoTitle(videoId);
      return {
        videoId,
        title,
        filename: sanitizeFilename(title),
        transcript,
        cached: false,
      };
    } catch (err) {
      lastError = err;
      if (attempt < 3) {
        await delay(500 * (attempt + 1));
      }
    }
  }

  return { error: lastError?.message || 'Failed to fetch transcript' };
}
