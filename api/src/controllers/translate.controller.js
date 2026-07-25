import { translateText } from '../services/translate.service.js';

const LANGUAGE_CODE = /^[a-z]{2,3}(?:-[A-Z]{2})?$/;

export const createTranslation = async (req, res) => {
  const { text, source = 'bn', target = 'en' } = req.body || {};
  if (typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: "Missing 'text' string." });
  }
  if (text.length > 5000) {
    return res.status(400).json({ error: 'Text must be 5,000 characters or fewer.' });
  }
  if (!LANGUAGE_CODE.test(source) || !LANGUAGE_CODE.test(target)) {
    return res.status(400).json({ error: 'Invalid source or target language.' });
  }

  try {
    const result = await translateText({ text: text.trim(), source, target });
    return res.json({ ...result, source, target });
  } catch (error) {
    console.error('Translation error:', error?.message || String(error));
    return res.status(502).json({
      error: 'Translation is unavailable. Configure GEMINI_API_KEY and try again.',
    });
  }
};
