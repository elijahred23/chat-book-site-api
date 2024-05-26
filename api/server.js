import express from 'express';
import { generateResponse, safeGenerateResponse } from './chatGPT.js';
import { generateGeminiResponse } from './gemini.js';
import bodyParser from 'body-parser';
import MarkdownIt from 'markdown-it';
import fs from 'fs';
import puppeteer from 'puppeteer';

const app = express();
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

const md = new MarkdownIt();
app.use(bodyParser.json());

const port = 3005;

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

app.get('/', (req, res) => {
  const randomIndex = Math.floor(Math.random() * messages.length);
  res.send({ message: messages[randomIndex] });
});

app.get('/gpt/prompt', async (req, res) => {
  let prompt = req.query.prompt;

  if (!prompt) {
    return res.status(400).send({ error: 'Bad Request', message: 'Prompt parameter is missing' });
  }

  try {
    let gptResponse = await safeGenerateResponse('You are a helpful assistant', prompt);

    if (gptResponse?.text?.includes('Sorry, something went wrong.')) throw new Error(gptResponse?.text);
    return res.send({ gptResponse: gptResponse, message: "success" });
  } catch (error) {
    console.error(error);
    logErrorToFile(error);
    return res.status(500).send({ error: 'Server Error', message: error?.message ?? "Failed to generate chatGPT response." });
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

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
