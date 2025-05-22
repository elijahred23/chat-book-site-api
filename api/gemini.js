import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();
const geminiApiKey = process.env.GEMINI_API_KEY || "";

// Initialize the GoogleGenerativeAI instance
const genAI = new GoogleGenerativeAI(geminiApiKey);

export class GeminiModel {
    // static variable for current model
    static currentModel = "gemini-1.5-flash"}

    
async function listGeminiModels() {    
    return [
        { name: "Gemini 2.5 Flash Preview 05-20", id: "gemini-2.5-flash-preview-05-20", input: "Audio, images, videos, and text", output: "Text", description: "Adaptive thinking, cost efficiency" },
        { name: "Gemini 2.5 Flash Native Audio", id: "gemini-2.5-flash-preview-native-audio-dialog", input: "Audio, videos, and text", output: "Text and audio, interleaved", description: "High quality, natural conversational audio outputs, with or without thinking" },
        { name: "Gemini 2.5 Flash Native Audio (Thinking)", id: "gemini-2.5-flash-exp-native-audio-thinking-dialog", input: "Audio, videos, and text", output: "Text and audio, interleaved", description: "High quality, natural conversational audio outputs, with or without thinking" },
        { name: "Gemini 2.5 Flash Preview TTS", id: "gemini-2.5-flash-preview-tts", input: "Text", output: "Audio", description: "Low latency, controllable, single- and multi-speaker text-to-speech audio generation" },
        { name: "Gemini 2.5 Pro Preview", id: "gemini-2.5-pro-preview-05-06", input: "Audio, images, videos, and text", output: "Text", description: "Enhanced thinking and reasoning, multimodal understanding, advanced coding, and more" },
        { name: "Gemini 2.5 Pro Preview TTS", id: "gemini-2.5-pro-preview-tts", input: "Text", output: "Audio", description: "Low latency, controllable, single- and multi-speaker text-to-speech audio generation" },
        { name: "Gemini 2.0 Flash", id: "gemini-2.0-flash", input: "Audio, images, videos, and text", output: "Text", description: "Next generation features, speed, thinking, and realtime streaming." },
        { name: "Gemini 2.0 Flash Preview Image Generation", id: "gemini-2.0-flash-preview-image-generation", input: "Audio, images, videos, and text", output: "Text, images", description: "Conversational image generation and editing" },
        { name: "Gemini 2.0 Flash-Lite", id: "gemini-2.0-flash-lite", input: "Audio, images, videos, and text", output: "Text", description: "Cost efficiency and low latency" },
        { name: "Gemini 1.5 Flash", id: "gemini-1.5-flash", input: "Audio, images, videos, and text", output: "Text", description: "Fast and versatile performance across a diverse variety of tasks" },
        { name: "Gemini 1.5 Flash-8B", id: "gemini-1.5-flash-8b", input: "Audio, images, videos, and text", output: "Text", description: "High volume and lower intelligence tasks" },
        { name: "Gemini 1.5 Pro", id: "gemini-1.5-pro", input: "Audio, images, videos, and text", output: "Text", description: "Complex reasoning tasks requiring more intelligence" },
        { name: "Gemini Embedding", id: "gemini-embedding-exp", input: "Text", output: "Text embeddings", description: "Measuring the relatedness of text strings" },
        { name: "Imagen 3", id: "imagen-3.0-generate-002", input: "Text", output: "Images", description: "Our most advanced image generation model" },
        { name: "Veo 2", id: "veo-2.0-generate-001", input: "Text, images", output: "Video", description: "High quality video generation" },
        { name: "Gemini 2.0 Flash Live", id: "gemini-2.0-flash-live-001", input: "Audio, video, and text", output: "Text, audio", description: "Realtime interaction" }
    ];
}




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


export { generateGeminiResponse, listGeminiModels };
