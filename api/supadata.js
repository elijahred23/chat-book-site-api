import { Supadata } from "@supadata/js";

const supadata = new Supadata({
  apiKey: process.env.SUPA_DATA_API_KEY, // <-- recommended
});

/**
 * Fetch transcript from a supported media URL (YouTube, TikTok, IG, X)
 * @param {string} url - The video URL
 * @param {object} options - Optional settings (lang, text, mode)
 * @returns {Promise<string>} - The transcript text
 */
export async function getTranscript(url, options = {}) {
  if (!url) throw new Error("A video URL must be provided.");

  const {
    lang = "en",
    text = true,
    mode = "auto",
  } = options;

  try {
    const transcriptResult = await supadata.transcript({
      url,
      lang,
      text,
      mode,
    });

    return transcriptResult; // returns plain text if text: true
  } catch (error) {
    console.error("Error fetching transcript:", error);
    throw error;
  }
}
