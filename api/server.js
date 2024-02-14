import express from 'express';
import { generateResponse, safeGenerateResponse } from './chatGPT.js';
import bodyParser from 'body-parser';

const app = express();

app.use(bodyParser.urlencoded({ extended: false }))

const port = 3000;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET', 'POST', 'PUT', 'DELETE');
    res.header('Access-Control-Allow-Headers', 'Contenty-Type');
    next();
});


app.get('/', (req, res) => {
    res.send({ message: 'HELLO WORLD, THIS IS YOUR CHAT BOOK API' });
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