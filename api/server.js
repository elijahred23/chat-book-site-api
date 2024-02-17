import express from 'express';
import { generateResponse, safeGenerateResponse } from './chatGPT.js';
import bodyParser from 'body-parser';
import cors from 'cors';

const app = express();

const allowedOrigins = ['http://localhost:3006', 'http://159.203.85.164:3006', '*'];
// Enable CORS with dynamic origin support
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin) || !origin) {
            // Allow specific origins or if no origin is provided (e.g., when request is made from localhost)
            callback(null, true);
        } else {
            // Potentially allow other origins, depending on business requirements
            callback(null, true); // Replace this with `callback(new Error('Not allowed by CORS'))` to block other origins
        }
    },
    credentials: true // This option is to allow cookies to be sent with the request
}));

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


app.listen(port, () => {
    console.log(`Listening on port ${port}`);
})