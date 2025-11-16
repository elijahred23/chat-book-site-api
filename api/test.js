import { generateGeminiResponse, listGeminiModels } from "./gemini.js";
import { fetchTranscript } from "./youtube.js";
import { getTranscript } from "./supadata.js";


const url = "https://www.youtube.com/watch?v=rgLQWutNxKc"

let transcript = await getTranscript(url);

console.log({transcript})

// let url = "https://www.youtube.com/watch?v=Fi3_BjVzpqk&pp=ygUMc2RsYyBwcm9jZXNz"
// let transcript = await fetchTranscript(url);
