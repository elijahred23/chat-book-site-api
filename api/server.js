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
import { fetchTranscript, getNewsVideos, getVideoComments } from './youtube.js';
import { searchYouTube, getVideoDetails, searchYouTubePlaylists, getPlaylistItems, getTrendingVideos } from './youtube.js';
import { getTranscript } from './supadata.js';
GeminiModel.currentModel = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


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
    const transcript = await fetchTranscript(url);
    res.json({ transcript });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transcript' });
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

  if (!query) {
    return res.status(400).json({ error: 'Missing search query.' });
  }

  try {
    const results = await searchYouTube(query);
    res.json(results);
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ error: 'Internal server error.' });
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

// Catch-all: send index.html for client-side routes (e.g. React Router)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(8080, () => {
  console.log(`Server listening on port 8080`);
});
