import { hostname } from "../utils/hostname";


const readResponse = async (response, fallbackMessage) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || fallbackMessage);
  return data;
}

export const getGeminiModelList = async ({ refresh = false } = {}) => {
  const response = await fetch(`${hostname}/geminiModelList${refresh ? '?refresh=1' : ''}`);
  const data = await readResponse(response, "Could not load Gemini models.");
  return Array.isArray(data.models) ? data.models : [];
}
export const getGeminiModel = async () => {
  const response = await fetch(`${hostname}/geminiModel`);
  const data = await readResponse(response, "Could not load the current Gemini model.");
  return data.model || null;
}
export const updateGeminiModel = async (model) => {
  const response = await fetch(`${hostname}/geminiModel`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model })
  });
  const data = await readResponse(response, "Could not update the Gemini model.");
  return data.model;
}
export const getGeminiResponse = async (prompt) => {
  try {
    const response = await fetch(`${hostname}/gpt/prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt })
    });

    // Handle HTTP errors like 400, 500, etc.
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData?.message || `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    const data = await response.json();

    if (!data.gptResponse || !data?.success) {
      console.log({ data });
      throw new Error(data.gptResponse?.error || "No response from Gemini model.");
    }

    return data.gptResponse;
  } catch (error) {
    const errorMessage = error?.message || String(error);
    console.error("generating response:", errorMessage);
    throw error;
  }
};
