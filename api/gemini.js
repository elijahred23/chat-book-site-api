import { GoogleGenerativeAI } from "@google/generative-ai";
import { geminiApiKey } from "./apiKey.js";

// Initialize the GoogleGenerativeAI instance
const genAI = new GoogleGenerativeAI(geminiApiKey);

async function generateGeminiResponse(msg) {
    try {
        // Access the gemini-pro model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        // Start the chat with initial conversation history
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: "Hello, you are a helpful assistant." }],
                },
                {
                    role: "model",
                    parts: [{ text: "Great to meet you. What would you like to know?" }],
                },
            ],
            generationConfig: {
                maxOutputTokens: 2000,
            },
        });

        // Send the message and await the response
        const result = await chat.sendMessage(msg);
        const response = await result.response;
        const text = await response.text();  // Call the text() method
        // Return the generated text
        return text;
    } catch (error) {
        console.error("Error generating response:", error);
        return "Sorry, there was an error processing your request.";
    }
}

export { generateGeminiResponse };