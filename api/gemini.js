import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();
const geminiApiKey = process.env.GEMINI_API_KEY || "";
const defaultGeminiModel = "gemini-flash-latest";
const modelListUrl = "https://generativelanguage.googleapis.com/v1beta/models";
const modelListCacheTtlMs = 5 * 60 * 1000;
const maxModelListResponseChars = 1_000_000;
let modelListCache = { models: null, expiresAt: 0 };

// Initialize the Google GenAI client
const ai = new GoogleGenAI({ apiKey: geminiApiKey });

export class GeminiModel {
    static currentModel = process.env.GEMINI_MODEL?.trim() || defaultGeminiModel;
}

    
function normalizeGeminiModel(model) {
    return typeof model === "string" ? model.trim().replace(/^models\//, "") : "";
}

function isTextGenerationModel(model) {
    const id = normalizeGeminiModel(model.name || model.baseModelId);
    const methods = model.supportedGenerationMethods || [];
    return id.startsWith("gemini-")
        && methods.includes("generateContent")
        && !/(?:embedding|image|audio|tts|live)/i.test(id);
}

function formatGeminiModel(model) {
    const id = normalizeGeminiModel(model.name || model.baseModelId);
    return {
        id,
        name: model.displayName || id,
        description: model.description || "General-purpose Gemini text generation model.",
        inputTokenLimit: model.inputTokenLimit || null,
        outputTokenLimit: model.outputTokenLimit || null,
        thinking: Boolean(model.thinking),
    };
}

async function readModelListResponse(response) {
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > maxModelListResponseChars) {
        throw new Error("Gemini model discovery returned an unexpectedly large response.");
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("Gemini model discovery returned an empty response.");
    const decoder = new TextDecoder();
    let responseSize = 0;
    let responseText = "";
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        responseSize += value.byteLength;
        if (responseSize > maxModelListResponseChars) {
            await reader.cancel();
            throw new Error("Gemini model discovery returned an unexpectedly large response.");
        }
        responseText += decoder.decode(value, { stream: true });
    }
    responseText += decoder.decode();

    try {
        return JSON.parse(responseText);
    } catch {
        throw new Error("Gemini model discovery returned an invalid response.");
    }
}

async function listGeminiModels({ forceRefresh = false } = {}) {
    if (!geminiApiKey) throw new Error("Gemini model discovery requires GEMINI_API_KEY.");
    if (!forceRefresh && modelListCache.models && Date.now() < modelListCache.expiresAt) {
        return modelListCache.models;
    }

    const models = [];
    let pageToken = "";
    let pageCount = 0;
    do {
        pageCount += 1;
        if (pageCount > 10) throw new Error("Gemini model discovery returned too many pages.");
        const url = new URL(modelListUrl);
        url.searchParams.set("pageSize", "1000");
        if (pageToken) url.searchParams.set("pageToken", pageToken);
        const response = await fetch(url, {
            headers: { "x-goog-api-key": geminiApiKey },
            signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw new Error(`Gemini model discovery failed with status ${response.status}.`);
        const data = await readModelListResponse(response);
        models.push(...(Array.isArray(data.models) ? data.models : []));
        pageToken = data.nextPageToken || "";
    } while (pageToken);

    const availableModels = models
        .filter(isTextGenerationModel)
        .map(formatGeminiModel)
        .sort((left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id));
    if (!availableModels.length) throw new Error("Gemini returned no compatible text-generation models.");

    modelListCache = { models: availableModels, expiresAt: Date.now() + modelListCacheTtlMs };
    return availableModels;
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

const cpuProgramSystemInstruction = `You write programs for Clockwork, a small 32-bit educational CPU with 256 words of memory. Convert the user's request into one complete runnable program.

Return JSON matching the supplied schema. The language must be binary, assembly, or simple, and code must contain only source code for that language (no Markdown fences or explanation). Prefer MiniScript (simple) for straightforward high-level requests and assembly when instruction-level control is useful. Use binary only when the user explicitly requests binary.

ASSEMBLY SYNTAX
- One instruction per line. Comments start with #, ;, or //. Labels use name: and may be jump/call operands.
- Registers: A, B, C, D. The program may contain at most 256 encoded words.
- Numbers are unsigned decimal, 0x-prefixed hexadecimal, or $-prefixed hexadecimal.
- Instructions:
  NOP; HLT; RET
  LDI reg, immediate (0..4194303); LUI reg, upperHalf (0..65535)
  LDR reg, address; STR reg, address (addresses 0..255)
  MOV reg, reg
  ADD/SUB/MUL/DIV/MOD/AND/OR/XOR/CMP reg, reg
  LDRI destinationReg, addressReg; STRI sourceReg, addressReg (uses the low 8 address bits)
  ADDI/SUBI reg, immediate (0..4194303)
  NOT/SHL/SHR/ROL/ROR/NEG/INC/DEC/OUT/PUSH/POP reg
  JMP/JZ/JNZ/JC/JN/CALL address-or-label
  .WORD value or DW value (0..4294967295)
- OUT copies a register to the visible output. End with HLT. Values wrap to unsigned 32 bits.
- A 32×32 monochrome LED display is write-mapped to addresses 224..255. STR to address 224 updates row 0, address 225 updates row 1, and so on. Bit 31 controls the left pixel and bit 0 controls the right pixel. Load a 32-bit row with LDI/LUI, then STR it to the row address.

MINISCRIPT SYNTAX (language "simple")
- JavaScript-like statements. End statements with semicolons. Comments use //, /* */, or #.
- MiniScript is strongly typed. Every declaration uses let name: Type = expression; or const name: Type = constantExpression; There are no implicit conversions.
- Primitive types are u32 and bool. Methods return void. u32 values are unsigned integers 0..4294967295; decimal and 0x hexadecimal literals are supported.
- A maximum of four runtime primitive values or object fields may exist because they map to registers A-D. Constants do not consume registers.
- Fixed arrays use let values: u32[3] = [10, 20, 30]; or bool[N]. They live in reserved high memory, expose values.length, and support indexed reads, assignments, compound assignments, ++, and --. Indices must be compile-time constants. Arrays cannot be combined with push/pop.
- Classes support typed fields, one typed constructor, and typed methods: class Counter { value: u32; constructor(start: u32) { this.value = start; } method add(step: u32): void { this.value += step; } }
- Construct objects with let counter: Counter = new Counter(0);. Access fields with counter.value and call methods with counter.add(1);. Methods are inlined, cannot return values, and cannot declare local variables.
- Assignments can target variables or memory, for example x = memory[address]; or memory[address] = x;. A memory address may be a constant or u32 variable; runtime addresses use their low 8 bits and compile to LDRI/STRI.
- Updates: x++; x--; x += value; x -= value; x *= value; x /= value; x %= value; x &= value; x |= value; x ^= value.
- Runtime binary assignment must keep the destination on the left, for example x = x + y. Supported operators are +, -, *, /, %, &, |, ^.
- Control flow: if (condition) { ... } else { ... }; while (condition) { ... }; break; continue.
- Conditions must be bool and support !, &&, ||, ==, ===, !=, !==. Runtime comparisons are equality/inequality only. The built-in flag names carry, zero, and negative are bool.
- Functions: output(variable), halt(), push(variable), pop(variable), nop(), rol(variable), ror(variable), and neg(variable). rotateLeft and rotateRight alias rol and ror; print and stop alias output and halt.
- Constant memory addresses must be in 0..255; runtime address variables use their low 8 bits. Add halt() at the end.
- The LED display uses memory[224] through memory[255] as rows 0 through 31. Assign a 32-bit row pattern to those addresses; bit 31 is leftmost and bit 0 is rightmost. Do not declare arrays in LED programs because arrays also reserve high memory.

BINARY SYNTAX
- Each non-comment token must be exactly 32 binary digits. Use one word per line and no address prefixes.
- Binary programs must encode the same instruction set and fit in 256 words.

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


export { generateCpuProgram, generateGeminiResponse, listGeminiModels, normalizeGeminiModel };
