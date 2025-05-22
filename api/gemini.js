import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();
const geminiApiKey = process.env.GEMINI_API_KEY || "";

// Initialize the GoogleGenerativeAI instance
const genAI = new GoogleGenerativeAI(geminiApiKey);

export class GeminiModel {
    // static variable for current model
    static currentModel = "gemini-1.5-flash"}

async function generateGeminiResponse(msg, gemini_model = null) {
    try {
        if (gemini_model === null) {
            gemini_model = GeminiModel.currentModel;
        }
        if (!gemini_model) {
            throw new Error("Model not specified");
        }
        const model = genAI.getGenerativeModel({ model: gemini_model });

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
                maxOutputTokens: 100000,
            },
        });

        const result = await chat.sendMessage(msg);
        const response = await result.response;
        const text = await response.text();

        return { success: true, text };
    } catch (error) {
        const errorMessage = error?.message || String(error);
        console.error("Error generating response:", errorMessage);

        return {
            success: false,
            text: "Sorry, there was an error processing your request.",
            error: errorMessage
        };
    }
}


export { generateGeminiResponse };
