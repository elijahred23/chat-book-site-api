import express from 'express';
import dotenv from "dotenv";
dotenv.config();
import path from 'path';
import { fileURLToPath } from 'url';
import { generateResponse, safeGenerateResponse } from './chatGPT.js';
import { generateGeminiResponse } from './gemini.js';
import bodyParser from 'body-parser';
import MarkdownIt from 'markdown-it';
import fs from 'fs';
import puppeteer from 'puppeteer';
import { fetchTranscript } from './youtube.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


(async () => {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      await page.goto('https://example.com');
      console.log('Browser launched successfully');
      await browser.close();
    } catch (error) {
      console.error('Failed to launch browser:', error);
    }
  })();
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

app.get('/api/check', (req, res) => {
  const randomIndex = Math.floor(Math.random() * messages.length);
  res.send({ message: messages[randomIndex] });
});

app.get('/youtube/transcript', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).send({ error: 'Bad Request', message: 'YouTube URL is required' });
    }

    const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (!videoIdMatch) {
      return res.status(400).send({ error: 'Bad Request', message: 'Invalid YouTube URL' });
    }

    let transcript = await fetchTranscript(url);

    res.send({ transcript });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Server Error', message: 'Failed to fetch transcript' });
  }
});

app.post('/gpt/prompt', async (req, res) => {
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



app.post('/generate-pdf', async (req, res) => {
    const { markdown, messagesToCombine, pdfFileName } = req.body;
    console.log({ markdown, messagesToCombine });
  
    if (!markdown && !messagesToCombine) {
      return res.status(400).send('Markdown content or messages to combine are required');
    }
  
    // Combine messages if provided
    let finalMarkdown = markdown || '';
    if (messagesToCombine && Array.isArray(messagesToCombine)) {
      finalMarkdown += '\n\n' + messagesToCombine.join('\n\n');
    }
  
    // Convert markdown to HTML
    const htmlContent = md.render(finalMarkdown);
    console.log({ htmlContent });
  
    try {
      // Launch a headless browser
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
  
      // Set a longer default navigation timeout
      page.setDefaultNavigationTimeout(60000); // 60 seconds
  
      // Set the content of the page
      await page.setContent(`
        <html>
          <head>
            <style>
              body {
                font-family: 'Helvetica', sans-serif;
                padding: 20px;
              }
              pre, code {
                background: #f4f4f4;
                padding: 10px;
                border-radius: 5px;
                font-family: 'Courier New', monospace;
              }
            </style>
          </head>
          <body>
            ${htmlContent}
          </body>
        </html>
      `, { waitUntil: 'networkidle0' });
  
      // Generate the PDF from the page content
      const pdfBuffer = await page.pdf({ format: 'A4' });
  
      await browser.close();
  
      // Set headers to send PDF as a response
      res.setHeader('Content-disposition', `attachment; filename=${pdfFileName}.pdf`);
      res.setHeader('Content-type', 'application/pdf');
  
      // Send the PDF buffer as the response
      res.send(pdfBuffer);
    } catch (error) {
      console.error(error);
      logErrorToFile(error);
      res.status(500).send('Error generating PDF');
    }
  });
app.get('/gemini/prompt', async (req, res) => {
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
