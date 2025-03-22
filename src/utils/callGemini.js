import { hostname } from "./hostname";


export const getGeminiResponse = async (prompt) => {
    const response = await fetch(`${hostname}/gemini/prompt?prompt=${encodeURIComponent(prompt)}`);
    const data = await response.json();
    let geminiResponse = data.geminiResponse;
    return geminiResponse
}