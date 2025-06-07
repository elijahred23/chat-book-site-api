import { generateGeminiResponse, listGeminiModels } from "./gemini.js";
import { fetchTranscript } from "./youtube.js";


const url = "https://www.youtube.com/watch?v=Y7DbxeJc7yE"

fetchTranscript(url);

// let url = "https://www.youtube.com/watch?v=Fi3_BjVzpqk&pp=ygUMc2RsYyBwcm9jZXNz"
// let transcript = await fetchTranscript(url);
