import express from 'express';
import { generateResponse, safeGenerateResponse } from './chatGPT.js';
import { generateGeminiResponse } from './gemini.js';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();

app.use((req,res,next)=>{
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET','POST','PUT','DELETE');
    res.header('Access-Control-Allow-Headers', 'Contenty-Type');
    next();
});

app.use(bodyParser.urlencoded({ extended: false }))

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



app.get('/', (req, res) => {
    const randomIndex = Math.floor(Math.random() * messages.length);
    res.send({ message: messages[randomIndex] });
});

app.get('/gpt/prompt', async (req, res) => {
    let prompt = req.query.prompt;

    if (prompt === null || prompt === undefined || prompt === '' || prompt?.length === 0) {
        return res.status(400).send({ error: 'Bad Request', message: 'Prompt parameter is missing' });
    }

    try {
        let gptResponse = await safeGenerateResponse('You are a helpful assistant', prompt);

        if (gptResponse?.text?.includes('Sorry, something went wrong.')) throw new Error(gptResponse?.text)
        return res.send({ gptResponse: gptResponse, message: "success" });
    } catch (error) {
        return res.status(500).send({ error: 'Server Error', message: error?.message ?? "Failed to generate chatGPT response." })
    }
});

app.get('/gemini/prompt', async (req,res) => {
    let prompt = req.query.prompt;

    if (prompt === null || prompt === undefined || prompt === '' || prompt?.length === 0) {
        return res.status(400).send({ error: 'Bad Request', message: 'Prompt parameter is missing' });
    }

    try {
        let geminiResponse = await generateGeminiResponse(prompt);

        if (geminiResponse?.text?.includes('Sorry, something went wrong.')) throw new Error(geminiResponse?.text)
        return res.send({ geminiResponse: geminiResponse, message: "success" });
    } catch (error) {
        return res.status(500).send({ error: 'Server Error', message: error?.message ?? "Failed to generate chatGPT response." })
    }
})

app.post('/chatTemplate', async (req,res) => {
    
})

app.get('/chatTemplate', async (req,res) => {
    
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})