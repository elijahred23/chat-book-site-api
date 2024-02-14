import OpenAI from "openai";
import { apiKey } from "./apiKey";
const openai = new OpenAI({
    apiKey: apiKey
});

export const generateResponse = async (systemContent, prompt) => {
    const completion = await openai.chat.completions.create({
        messages: [{ role: 'system', content: systemContent },
        { role: 'user', content: prompt }],
        model: 'gpt-3.5-turbo',
    });
    let response = completion.choices[0];
    return response;
};