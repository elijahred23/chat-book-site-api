const CACHE_NAME = "google-tts-audio-v1";
const memoryCache = new Map();
const inFlightRequests = new Map();

export const GOOGLE_BENGALI_VOICE_KEY = "google-cloud-tts__bn-IN";

const cacheKey = (text, lang) => `${lang}\u0000${text}`;

const persistentCacheRequest = async (key) => {
  if (!window.isSecureContext || !window.caches || !window.crypto?.subtle) return null;
  const bytes = new TextEncoder().encode(key);
  const digest = await window.crypto.subtle.digest("SHA-256", bytes);
  const hash = [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
  return new Request(`${window.location.origin}/.google-tts-cache/${hash}`);
};

const readPersistentCache = async (request) => {
  if (!request) return null;
  try {
    const cache = await window.caches.open(CACHE_NAME);
    const response = await cache.match(request);
    return response?.ok ? response.blob() : null;
  } catch {
    return null;
  }
};

const writePersistentCache = async (request, audioBlob) => {
  if (!request) return;
  try {
    const cache = await window.caches.open(CACHE_NAME);
    await cache.put(request, new Response(audioBlob, {
      headers: { "Content-Type": audioBlob.type || "audio/mpeg" },
    }));
  } catch {
    // Memory caching still prevents duplicate requests during this page visit.
  }
};

const requestGoogleTtsAudio = async (text, lang, request) => {
  const cachedBlob = await readPersistentCache(request);
  if (cachedBlob) return cachedBlob;

  const response = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Google speech failed (${response.status}).`);
  }

  const audioBlob = await response.blob();
  await writePersistentCache(request, audioBlob);
  return audioBlob;
};

export const getGoogleTtsAudio = async (text, lang = "bn-IN") => {
  const normalizedText = text?.trim();
  if (!normalizedText) throw new Error("Text is required for Google speech.");

  const key = cacheKey(normalizedText, lang);
  if (memoryCache.has(key)) return memoryCache.get(key);
  if (inFlightRequests.has(key)) return inFlightRequests.get(key);

  const request = (async () => {
    const persistentRequest = await persistentCacheRequest(key);
    const audioBlob = await requestGoogleTtsAudio(normalizedText, lang, persistentRequest);
    memoryCache.set(key, audioBlob);
    return audioBlob;
  })();

  inFlightRequests.set(key, request);
  try {
    return await request;
  } finally {
    inFlightRequests.delete(key);
  }
};

const splitTextByUtf8Bytes = (text, maxBytes = 4500) => {
  const encoder = new TextEncoder();
  const chunks = [];
  let currentChunk = "";

  String(text || "").match(/\S+\s*/gu)?.forEach((token) => {
    if (encoder.encode(currentChunk + token).length <= maxBytes) {
      currentChunk += token;
      return;
    }
    if (currentChunk.trim()) chunks.push(currentChunk.trim());
    currentChunk = token;
  });
  if (currentChunk.trim()) chunks.push(currentChunk.trim());
  return chunks;
};

export const getGoogleTtsMp3Download = async (text, lang = "bn-IN") => {
  const chunks = splitTextByUtf8Bytes(text);
  if (!chunks.length) throw new Error("Bengali text is required for Google speech.");

  const response = await fetch("/api/tts/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: chunks.map((chunk) => ({ text: chunk, lang })) }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || `Google speech download failed (${response.status}).`);
  }
  return response.blob();
};
