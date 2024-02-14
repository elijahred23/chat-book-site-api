import OpenAI from "openai";
import { apiKey } from "./apiKey.js";
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

export const safeGenerateResponse = async (systemContent, prompt) => {
    try {
        const response = await generateResponse(systemContent, prompt);
        return response;
    } catch (error) {
        console.error("Error generating response:", error);
        // Return a default message or handle the error as needed
        return { text: "Sorry, something went wrong." };
    }
};
// Function to generate a response using OpenAI's API with chat history
export const generateResponseWithHistory = async (systemContent, prompt, history) => {
    // Prepare messages array with system content and history
    const messages = [{ role: 'system', content: systemContent }, ...history, { role: 'user', content: prompt }];

    const completion = await openai.chat.completions.create({
        messages: messages,
        model: 'gpt-3.5-turbo',
    });
    let response = completion.choices[0];
    return response;
};

// Safe wrapper function to handle errors and incorporate chat history
export const safeGenerateResponseWithHistory = async (systemContent, prompt, history) => {
    try {
        const response = await generateResponseWithHistory(systemContent, prompt, history);
        return response;
    } catch (error) {
        console.error("Error generating response:", error);
        // Return a default message or handle the error as needed
        return { text: "Sorry, something went wrong." };
    }
};

/**
 * 
 * // Example conversation history
let conversationHistory = [
    { role: 'system', content: 'This is a chatbot that can answer your questions.' },
    { role: 'user', content: 'Who is the president of the United States?' },
    { role: 'system', content: 'The president of the United States is Joe Biden.' },
    // Add more messages as the conversation progresses
];
safeGenerateResponseWithHistory(systemContent, userPrompt, conversationHistory)
    .then(response => {
        console.log("ChatGPT says:", response.text);
        // Update the conversation history with the new system response
        conversationHistory.push({ role: 'system', content: response.text });
    })
    .catch(error => {
        console.error("Failed to generate response:", error);
    });
 */
