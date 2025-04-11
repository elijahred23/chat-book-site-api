import { hostname } from "./hostname";

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
