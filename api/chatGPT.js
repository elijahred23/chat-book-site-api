import OpenAI from "openai";

const chatGptApiKey = process.env.CHAT_GPT_API_KEY || "";

const openai = new OpenAI({
    apiKey: chatGptApiKey
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
