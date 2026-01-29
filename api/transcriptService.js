import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { YoutubeTranscript } from 'youtube-transcript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const errorLogPath = path.join(__dirname, 'error.log');
const PY_SCRIPT = path.join(__dirname, 'youtube_service.py');

const ILLEGAL_FILENAME_CHARS = /[\\/*?:"<>|]/g;
const DEFAULT_LANGS = ['en', 'en-US', 'en-GB'];

const logError = (err, context = '') => {
  const msg = err instanceof Error ? `${err.message}\n${err.stack || ''}` : String(err);
  const line = `[${new Date().toISOString()}] transcriptService${context ? ` ${context}` : ''}: ${msg}\n`;
  try {
    fs.appendFile(errorLogPath, `${line}\n`, () => {});
  } catch {
    // ignore
  }
  console.error(line);
};

export const sanitizeFilename = (title = '') => title.replace(ILLEGAL_FILENAME_CHARS, '');

export const extractVideoId = (input = '') => {
  const trimmed = String(input || '').trim();
  if (!trimmed) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = new URL(trimmed);
    const host = url.hostname || '';
    if (host.includes('youtu.be')) return url.pathname.replace('/', '') || null;
    if (host.includes('youtube.com')) {
      const v = url.searchParams.get('v');
      if (v) return v;
      const match = url.pathname.match(/\/(embed|shorts)\/([a-zA-Z0-9_-]{11})/);
      if (match?.[2]) return match[2];
    }
  } catch {
    // not a URL, ignore
  }
  return null;
};

const getVideoTitle = async (videoId) => {
  const oembed = `https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${videoId}&format=json`;
  try {
    const resp = await fetch(oembed, { method: 'GET' });
    if (!resp.ok) throw new Error(`title status ${resp.status}`);
    const data = await resp.json();
    return data?.title || `Video_${videoId}`;
  } catch (err) {
    logError(err, `getVideoTitle video=${videoId}`);
    return `Video_${videoId}`;
  }
};

const joinTranscript = (items = []) =>
  items
    .map((i) => i?.text || '')
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

const runPythonTranscript = (input) =>
  new Promise((resolve, reject) => {
    const child = spawn('python3', [PY_SCRIPT, input], {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 20000,
    });

    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code !== 0 && !stdout) {
        return reject(new Error(stderr || `python exited ${code}`));
      }
      try {
        const json = JSON.parse(stdout || '{}');
        if (json?.error) {
          const err = new Error(json.error);
          err.stage = 'python';
          return reject(err);
        }
        resolve(json);
      } catch (err) {
        reject(new Error(`Failed to parse python output: ${stderr || stdout}`));
      }
    });
  });

export const fetchTranscriptForVideo = async (videoIdOrUrl) => {
  let lastErr = null;

  // 1) Try Python service (proxied + Redis)
  try {
    const pyResult = await runPythonTranscript(videoIdOrUrl);
    if (pyResult?.transcript) return pyResult.transcript;
  } catch (err) {
    lastErr = err;
    logError(err, 'pythonTranscript');
  }

  // 2) Fallback: youtube-transcript npm package
  for (const lang of DEFAULT_LANGS) {
    try {
      const items = await YoutubeTranscript.fetchTranscript(videoIdOrUrl, { lang });
      const text = joinTranscript(items);
      if (text) return text;
      throw new Error(`empty transcript lang=${lang}`);
    } catch (err) {
      lastErr = err;
      logError(err, `fetchTranscript npm lang=${lang}`);
    }
  }

  // 3) Package default language choice
  try {
    const items = await YoutubeTranscript.fetchTranscript(videoIdOrUrl);
    const text = joinTranscript(items);
    if (text) return text;
  } catch (err) {
    lastErr = err;
    logError(err, 'fetchTranscript npm default');
  }

  throw lastErr || new Error('Failed to fetch transcript');
};

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

export const fetchTranscriptWithMetadata = async (urlOrId) => {
  const videoId = extractVideoId(urlOrId) || urlOrId;
  if (!videoId) {
    return { error: 'Invalid YouTube URL or video ID', status: 400, stage: 'validation' };
  }

  let lastErr = null;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const transcript = await fetchTranscriptForVideo(videoId);
      const title = await getVideoTitle(videoId);
      return {
        videoId,
        title,
        filename: sanitizeFilename(title),
        transcript,
      };
    } catch (err) {
      lastErr = err;
      logError(err, `fetchTranscriptWithMetadata attempt=${attempt + 1} video=${videoId}`);
      if (attempt < 3) await delay(400 * (attempt + 1));
    }
  }

  return {
    error: lastErr?.message || 'Failed to fetch transcript',
    status: 502,
    stage: lastErr?.stage || 'transcript_fetch',
  };
};
