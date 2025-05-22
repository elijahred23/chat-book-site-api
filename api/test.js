import { generateGeminiResponse, listGeminiModels } from "./gemini.js";
import { fetchTranscript } from "./youtube.js";

const models = await listGeminiModels();

console.log("Gemini Models:", models);

// let url = "https://www.youtube.com/watch?v=Fi3_BjVzpqk&pp=ygUMc2RsYyBwcm9jZXNz"
// let transcript = await fetchTranscript(url);
