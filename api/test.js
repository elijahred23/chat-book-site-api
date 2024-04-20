import { generateGeminiResponse } from "./gemini.js";


// const message = "What is time according to Einstein";

// const response = await generateGeminiResponse(message);



let response = await fetch('http://localhost:3005/gemini/prompt?prompt=hello').then(res=>res.json());

console.log({response})