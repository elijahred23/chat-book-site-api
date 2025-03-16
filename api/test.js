import { generateGeminiResponse } from "./gemini.js";
import { fetchTranscript } from "./youtube.js";

const message = "What is time according to Einstein";

const response = await generateGeminiResponse(message);
console.log({response})

// let url = "https://www.youtube.com/watch?v=Fi3_BjVzpqk&pp=ygUMc2RsYyBwcm9jZXNz"
// let transcript = await fetchTranscript(url);
