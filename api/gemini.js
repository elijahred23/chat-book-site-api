import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
const geminiApiKey = process.env.GEMINI_API_KEY || "";
const defaultGeminiModel = "gemini-2.5-pro";

// Initialize the Google GenAI client
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

export class GeminiModel {
    static currentModel = process.env.GEMINI_MODEL?.trim() || defaultGeminiModel;
}

    
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
        const response = await ai.models.generateContent({
            model: gemini_model,
            contents: msg,
            config: {
                maxOutputTokens: 100000,
            },
        });
        const text = response?.text ?? "";

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

const cpuProgramSystemInstruction = `You write programs for Clockwork, a small 16-bit educational CPU with 64 words of memory. Convert the user's request into one complete runnable program.

Return JSON matching the supplied schema. The language must be binary, assembly, or simple, and code must contain only source code for that language (no Markdown fences or explanation). Prefer MiniScript (simple) for straightforward high-level requests and assembly when instruction-level control is useful. Use binary only when the user explicitly requests binary.

ASSEMBLY SYNTAX
- One instruction per line. Comments start with #, ;, or //. Labels use name: and may be jump/call operands.
- Registers: A, B, C, D. The program may contain at most 64 encoded words.
- Numbers are unsigned decimal, 0x-prefixed hexadecimal, or $-prefixed hexadecimal.
- Instructions:
  NOP; HLT; RET
  LDI reg, immediate (0..511); LUI reg, byte (0..255)
  LDR reg, address; STR reg, address (addresses 0..63)
  MOV reg, reg
  ADD/SUB/MUL/MOD/AND/OR/XOR/CMP reg, reg
  ADDI/SUBI reg, immediate (0..511)
  NOT/SHL/SHR/INC/DEC/OUT/PUSH/POP reg
  JMP/JZ/JNZ/JC/JN/CALL address-or-label
  .WORD value or DW value (0..65535)
- OUT copies a register to the visible output. End with HLT. Values wrap to unsigned 16 bits.

MINISCRIPT SYNTAX (language "simple")
- JavaScript-like statements. End statements with semicolons. Comments use //, /* */, or #.
- Runtime variables: let name = expression; A maximum of four runtime variables may exist because they map to registers A-D.
- Compile-time constants: const name = constantExpression; Constants do not consume registers.
- Values are unsigned integers 0..65535; decimal and 0x hexadecimal literals are supported.
- Assignments: x = value; x = memory[constantAddress]; memory[constantAddress] = x;
- Updates: x++; x--; x += value; x -= value; x *= value; x %= value; x &= value; x |= value; x ^= value.
- Runtime binary assignment must keep the destination on the left, for example x = x + y. Supported operators are +, -, *, %, &, |, ^.
- Control flow: if (condition) { ... } else { ... }; while (condition) { ... }; break; continue.
- Conditions support !, &&, ||, ==, ===, !=, !==. Runtime comparisons are equality/inequality only. The built-in flag names carry, zero, and negative may be tested.
- Functions: output(variable), halt(), push(variable), pop(variable), nop(). print and stop are aliases for output and halt.
- Memory addresses must be compile-time constants from 0..63. Add halt() at the end.

BINARY SYNTAX
- Each non-comment token must be exactly 16 binary digits. Use one word per line and no address prefixes.
- Binary programs must encode the same instruction set and fit in 64 words.

Make the smallest program that clearly fulfills the request. Ensure every referenced variable or label is declared, every loop can terminate when requested, and the program compiles under the syntax above.`;

async function generateCpuProgram(prompt, gemini_model = null) {
    const model = gemini_model || GeminiModel.currentModel;
    if (!model) throw new Error("Model not specified");

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            systemInstruction: cpuProgramSystemInstruction,
            temperature: 0.2,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    language: {
                        type: Type.STRING,
                        enum: ["binary", "assembly", "simple"],
                        description: "The source language used by code.",
                    },
                    code: {
                        type: Type.STRING,
                        description: "A complete runnable Clockwork CPU program with no Markdown fences.",
                    },
                },
                required: ["language", "code"],
            },
        },
    });

    const result = JSON.parse(response?.text || "{}");
    if (!["binary", "assembly", "simple"].includes(result.language) || typeof result.code !== "string" || !result.code.trim()) {
        throw new Error("Gemini returned an invalid CPU program response.");
    }
    return { language: result.language, code: result.code.trim() };
}


export { generateCpuProgram, generateGeminiResponse, listGeminiModels };
