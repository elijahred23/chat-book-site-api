import express from 'express';
import dotenv from "dotenv";
dotenv.config();
import path from 'path';
import { fileURLToPath } from 'url';
import { generateResponse, safeGenerateResponse } from './chatGPT.js';
import { generateGeminiResponse, GeminiModel, listGeminiModels } from './gemini.js';
import bodyParser from 'body-parser';
import MarkdownIt from 'markdown-it';
import fs from 'fs';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { getNewsVideos, getVideoComments } from './youtube.js';
import { searchYouTube, getVideoDetails, searchYouTubePlaylists, getPlaylistItems, getTrendingVideos } from './youtube.js';
import { fetchTranscriptWithMetadata } from './transcriptService.js';
import { getTranscript } from './supadata.js';
import textToSpeech from '@google-cloud/text-to-speech';
GeminiModel.currentModel = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple request logging
const logDir = path.join(__dirname, 'logs');
fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'api.log');
const recentLogs = [];
const pushLog = (entry) => {
  recentLogs.push(entry);
  if (recentLogs.length > 500) recentLogs.shift();
  fs.appendFile(logFile, entry + '\n', () => {});
};
const MAX_PDF_MB = Number(process.env.PDF_UPLOAD_MAX_MB || 1024); // default 1GB (sync with front-end hint)
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dest = path.join(__dirname, "../var/uploads");
      fs.mkdirSync(dest, { recursive: true });
      cb(null, dest);
    },
    filename: (req, file, cb) => {
      const safeName = file.originalname?.replace(/[^a-zA-Z0-9._-]/g, "_") || "upload.pdf";
      cb(null, `${Date.now()}-${safeName}`);
    },
  }),
  limits: { fileSize: MAX_PDF_MB * 1024 * 1024 },
}); // configurable size limit stored on disk

app.use((req, res, next) => {
  const entry = `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${req.ip}`;
  pushLog(entry);
  next();
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../dist')));

const md = new MarkdownIt();
app.use(bodyParser.json());

const messages = [
  "HELLO WORLD, THIS IS ELI GPT REPORTING FOR DUTY",
  "Greetings! Eli GPT here, ready to assist.",
  "Hello there! Eli GPT at your service.",
  "Good day! Eli GPT here to help you.",
  "Hey, it's Eli GPT! How can I assist you today?",
  "Welcome! Eli GPT here, ready to provide support.",
  "Hi! Eli GPT checking in for duty.",
  "Greetings, world! This is Eli GPT reporting in.",
  "Hey there! Eli GPT here to lend a hand.",
  "Hello everyone! Eli GPT ready to assist you."
];

const logErrorToFile = (error) => {
  const errorLog = `${new Date().toISOString()} - ${error.message}\n${error.stack}\n\n`;
  fs.appendFileSync('error.log', errorLog, 'utf8');
};

// If the service-account JSON is provided via env, write it to disk so
// Google TTS can read it from GOOGLE_APPLICATION_CREDENTIALS.
const ensureTtsCredentialsFile = () => {
  const rawJson = process.env.TTS_SA_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!rawJson) return null;

  try {
    const parsed = JSON.parse(rawJson);
    const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '../var/secrets/tts-sa.json');
    fs.mkdirSync(path.dirname(credentialsPath), { recursive: true });
    fs.writeFileSync(credentialsPath, JSON.stringify(parsed, null, 2));

    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
    }

    console.log(`TTS credentials file created at ${credentialsPath}`);
    return credentialsPath;
  } catch (err) {
    console.error('Failed to parse TTS service account JSON from env', err.message);
    logErrorToFile(err);
    return null;
  }
};

// Quick reachability check (HTTP HEAD) with timeout
const checkReachable = async (url) => {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(url, { method: "HEAD", redirect: "follow", signal: controller.signal });
    clearTimeout(t);
    if (!resp.ok) return false;
    const xfo = resp.headers.get("x-frame-options");
    if (xfo && xfo.toLowerCase() !== "allowall") return false;
    const csp = resp.headers.get("content-security-policy") || "";
    if (csp.toLowerCase().includes("frame-ancestors 'none'") || csp.toLowerCase().includes("frame-ancestors 'self'")) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

// Helper: decode DuckDuckGo redirect URL (uddg param)
const decodeDuckLink = (href = "") => {
  try {
    const urlObj = new URL(href.startsWith("//") ? `https:${href}` : href);
    const uddg = urlObj.searchParams.get("uddg");
    if (uddg) return decodeURIComponent(uddg);
    return href;
  } catch {
    return href;
  }
};

// GET /api/websearch?q=term
app.get('/api/websearch', async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.status(400).json({ error: "Missing query" });
  try {
    const ddgUrl = `https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
    const response = await fetch(ddgUrl, {
      headers: {
        // mimic browser to avoid blocking
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
      },
    });
    if (!response.ok) throw new Error(`DuckDuckGo request failed (${response.status})`);
    const html = await response.text();
    const results = [];
    const anchorRegex = /<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gim;
    let match;
    while ((match = anchorRegex.exec(html)) !== null && results.length < 20) {
      const href = match[1];
      const titleHtml = match[2] || "";
      const url = decodeDuckLink(href);
      const title = titleHtml.replace(/<[^>]+>/g, "").trim();
      if (url && title) {
        results.push({ title, url });
      }
    }
    let preferredUrl = null;
    // Try to find the first reachable URL (best-effort)
    for (const r of results.slice(0, 8)) {
      if (await checkReachable(r.url)) {
        preferredUrl = r.url;
        break;
      }
    }

    if (!results.length) {
      return res.json({ results: [], message: "No results parsed; site may have changed." });
    }
    return res.json({ results, preferredUrl });
  } catch (err) {
    console.error("Web search error:", err);
    logErrorToFile(err);
    return res.status(500).json({ error: "Search failed", message: err.message });
  }
});

// === Google TTS client ===
let ttsClient = null;
try {
  // Allow service account JSON to be provided via env var (TTS_SA_JSON or GOOGLE_APPLICATION_CREDENTIALS_JSON)
  ensureTtsCredentialsFile();
  ttsClient = new textToSpeech.TextToSpeechClient();
  console.log("Google TTS client initialized");
} catch (err) {
  console.warn("Google TTS client not initialized (missing credentials?)", err.message);
}

app.get('/api/supadata/transcript', async (req, res) => {

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }
  try {
    const transcript = await getTranscript(url);
    res.json({ transcript });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transcript' });
  }
});

app.get('/api/check', (req, res) => {
  const randomIndex = Math.floor(Math.random() * messages.length);
  res.send({ message: messages[randomIndex] });
});

app.get('/api/geminiModelList', async (req, res) => {
  try {
    const models = await listGeminiModels();
    return res.send({ models });
  } catch (error) {
    console.error(error);
    logErrorToFile(error);
    return res.status(500).send({ error: 'Server Error', message: error.message });
  }
}
);
app.get('/api/geminiModel', (req, res) => {
  const currentModel = GeminiModel.currentModel;
  if (!currentModel) {
    return res.status(400).send({ error: 'Bad Request', message: 'Model parameter is missing' });
  }
  try {
    return res.send({ model: currentModel });
  } catch (error) {
    console.error(error);
    logErrorToFile(error);
    return res.status(500).send({ error: 'Server Error', message: error.message });
  }
});

app.post('/api/geminiModel', async (req, res) => {
  const { model } = req.body;
  if (!model) {
    return res.status(400).send({ error: 'Bad Request', message: 'Model parameter is missing' });
  }

  try {
    GeminiModel.currentModel = model;
    return res.send({ message: `Model set to ${model}` });
  } catch (error) {
    console.error(error);
    logErrorToFile(error);
    return res.status(500).send({ error: 'Server Error', message: error.message });
  }
});

app.get('/api/youtube/transcript', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ error: 'Missing URL parameter' });
  }

  try {
    const result = await fetchTranscriptWithMetadata(url);
    if (result?.error) {
      const status = Number(result.status) || 400;
      return res.status(status).json({
        error: result.error,
        stage: result.stage || 'unknown',
      });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err?.message || 'Failed to fetch transcript', stage: 'server' });
  }
});

// GET /youtube/comments?video=VIDEO_URL_OR_ID&maxResults=20
app.get('/api/youtube/comments', async (req, res) => {
  const videoParam = req.query.video;
  const maxResults = parseInt(req.query.maxResults) || 20;

  if (!videoParam) {
    return res.status(400).json({ error: 'Missing video URL or ID.' });
  }

  try {
    const comments = await getVideoComments(videoParam, maxResults);
    res.json(comments);
  } catch (error) {
    console.error('Comments API error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /youtube/search?q=nodejs
app.get('/api/youtube/search', async (req, res) => {
  const query = req.query.q;
  const pageToken = req.query.pageToken || '';
  const pageSize = parseInt(req.query.pageSize, 10) || 50;

  if (!query) {
    return res.status(400).json({ error: 'Missing search query.' });
  }

  try {
    const results = await searchYouTube(query, pageToken, pageSize);
    res.json(results);
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/tts - returns MP3 audio for given text (Bengali or English)
app.post('/api/tts', async (req, res) => {
  try {
    const { text, lang = 'bn-IN' } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: "Missing 'text' string." });
    }
    if (!ttsClient) {
      return res.status(500).json({ error: "TTS client not initialized. Set GOOGLE_APPLICATION_CREDENTIALS." });
    }
    const request = {
      input: { text },
      voice: {
        languageCode: lang,
        ssmlGender: 'FEMALE',
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
      },
    };
    const [response] = await ttsClient.synthesizeSpeech(request);
    const audioContent = response.audioContent;
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'inline; filename="speech.mp3"');
    return res.send(audioContent);
  } catch (err) {
    console.error('TTS error', err);
    return res.status(500).json({ error: 'TTS failed.' });
  }
});

// POST /api/tts/batch - combine multiple TTS outputs into a single MP3
app.post('/api/tts/batch', async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "Missing 'items' array." });
    }
    if (!ttsClient) {
      return res.status(500).json({ error: "TTS client not initialized. Set GOOGLE_APPLICATION_CREDENTIALS." });
    }
    const audioBuffers = [];
    for (const item of items) {
      const text = item?.text;
      const lang = item?.lang || 'bn-IN';
      if (!text || typeof text !== 'string') continue;
      const request = {
        input: { text },
        voice: { languageCode: lang, ssmlGender: 'FEMALE' },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0 },
      };
      const [response] = await ttsClient.synthesizeSpeech(request);
      if (response?.audioContent) {
        audioBuffers.push(response.audioContent);
      }
    }
    if (!audioBuffers.length) {
      return res.status(400).json({ error: "No audio generated for provided items." });
    }
    const combined = Buffer.concat(audioBuffers.map((b) => Buffer.from(b)));
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="lesson.mp3"');
    return res.send(combined);
  } catch (err) {
    console.error('Batch TTS error', err);
    return res.status(500).json({ error: 'Batch TTS failed.' });
  }
});

// GET trending youtube
app.get('/api/youtube/trending', async (req, res) => {
    try {
      const results = await getTrendingVideos();
      res.json(results);
    } catch (error) {
      console.error('Trending API error:', error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  }
);

// endpoint to get news
app.get('/api/youtube/news', async (req, res) => {
  try {
    const results = await getNewsVideos();
    res.json(results);
  } catch (error) {
    console.error('News API error:', error);

    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /youtube/video/:id
app.get('/api/youtube/video/:id', async (req, res) => {
  const videoId = req.params.id;

  try {
    const details = await getVideoDetails(videoId);

    if (!details) {
      return res.status(404).json({ error: 'Video not found.' });
    }

    res.json(details);
  } catch (error) {
    console.error('Video details API error:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
app.get('/api/youtube/search/playlists', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ message: 'Missing search query' });

  try {
    const playlists = await searchYouTubePlaylists(query);
    res.json(playlists);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch playlists' });
  }
});

app.get('/api/youtube/playlist/:playlistId', async (req, res) => {
  try {
    const playlistId = req.params.playlistId;
    const videos = await getPlaylistItems(playlistId);
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: err.message || 'Failed to fetch playlist items' });
  }
});


app.post('/api/gpt/prompt', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).send({ error: 'Bad Request', message: 'Prompt parameter is missing' });
  }

  try {
    const gptResponse = await generateGeminiResponse(prompt);

    if (!gptResponse.success) {
      throw new Error(gptResponse.text);
    }

    return res.send({ gptResponse: gptResponse.text, message: "success", success: 1 });
  } catch (error) {
    console.error(error);
    logErrorToFile(error);
    return res.status(500).send({ error: 'Server Error', message: error.message });
  }
});

app.get('/api/gemini/prompt', async (req, res) => {
  let prompt = req.query.prompt;

  if (!prompt) {
    return res.status(400).send({ error: 'Bad Request', message: 'Prompt parameter is missing' });
  }

  try {
    let geminiResponse = await generateGeminiResponse(prompt);
    if (geminiResponse?.text?.includes('Sorry, something went wrong.')) throw new Error(geminiResponse?.text);
    return res.send({ geminiResponse: geminiResponse, message: "success" });
  } catch (error) {
    console.error(error);
    logErrorToFile(error);
    return res.status(500).send({ error: 'Server Error', message: error?.message ?? "Failed to generate chatGPT response." });
  }
});

// POST /api/pdf-to-text - upload a PDF and return extracted plain text
app.post('/api/pdf-to-text', (req, res, next) => {
  upload.single('file')(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: `File too large. Max ${MAX_PDF_MB}MB.` });
      }
      return res.status(400).json({ error: err.message || 'Upload failed.' });
    } else if (err) {
      return res.status(400).json({ error: err.message || 'Upload failed.' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Missing file upload (field name: file).' });
    }
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Only PDF files are supported.' });
    }
    const buffer = await fs.promises.readFile(req.file.path);
    const parsed = await pdfParse(buffer);
    const text = parsed?.text || '';
    // Clean up uploaded temp file
    fs.promises.unlink(req.file.path).catch(() => {});
    return res.json({ text });
  } catch (err) {
    console.error('PDF parse error', err);
    logErrorToFile(err);
    return res.status(500).json({ error: 'Failed to parse PDF.' });
  }
});

// Logs API
app.get('/api/logs', (req, res) => {
  res.json({ logs: [...recentLogs].reverse() });
});

// Simple log viewer
app.get('/logs', (req, res) => {
  res.type('html').send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>API Logs</title>
        <style>
          body { font-family: Arial, sans-serif; background: #0b1220; color: #e2e8f0; padding: 1rem; }
          h1 { margin-top: 0; }
          .panel { background: #0f172a; border: 1px solid #1f2937; border-radius: 10px; padding: 1rem; box-shadow: 0 10px 30px rgba(0,0,0,0.25); }
          ol { padding-left: 1.2rem; }
          li { margin: 0.35rem 0; font-family: "SFMono-Regular", Menlo, Consolas, monospace; word-break: break-all; }
          button { background: linear-gradient(135deg, #2563eb, #22d3ee); border: none; color: #0b1220; padding: 0.5rem 0.9rem; border-radius: 8px; cursor: pointer; font-weight: 700; }
        </style>
      </head>
      <body>
        <h1>API Logs</h1>
        <div class="panel">
          <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom:0.5rem;">
            <div>Most recent first</div>
            <button id="refresh">Refresh</button>
          </div>
          <ol id="logList"></ol>
        </div>
        <script>
          const listEl = document.getElementById('logList');
          async function loadLogs() {
            try {
              const res = await fetch('/api/logs');
              const data = await res.json();
              listEl.innerHTML = '';
              (data.logs || []).forEach((line) => {
                const li = document.createElement('li');
                li.textContent = line;
                listEl.appendChild(li);
              });
            } catch (err) {
              console.error('Failed to load logs', err);
            }
          }
          document.getElementById('refresh').addEventListener('click', loadLogs);
          loadLogs();
          setInterval(loadLogs, 5000);
        </script>
      </body>
    </html>
  `);
});

// Catch-all: send index.html for client-side routes (e.g. React Router)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(8080, () => {
  console.log(`Server listening on port 8080`);
});
