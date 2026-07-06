import { synthesizeSpeech, synthesizeSpeechBatch } from '../services/tts.service.js';

export const createSpeech = async (req, res) => {
  try {
    const { text, lang = 'bn-IN' } = req.body || {};
    if (!text || typeof text !== 'string') return res.status(400).json({ error: "Missing 'text' string." });

    const audioContent = await synthesizeSpeech({ text, lang });
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'inline; filename="speech.mp3"');
    return res.send(audioContent);
  } catch (err) {
    console.error('TTS error', err);
    const message = err.message === 'TTS client not initialized. Set GOOGLE_APPLICATION_CREDENTIALS.'
      ? err.message
      : 'TTS failed.';
    return res.status(500).json({ error: message });
  }
};

export const createSpeechBatch = async (req, res) => {
  try {
    const { items } = req.body || {};
    if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: "Missing 'items' array." });

    const combined = await synthesizeSpeechBatch(items);
    if (!combined.length) return res.status(400).json({ error: 'No audio generated for provided items.' });
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'attachment; filename="lesson.mp3"');
    return res.send(combined);
  } catch (err) {
    console.error('Batch TTS error', err);
    const message = err.message === 'TTS client not initialized. Set GOOGLE_APPLICATION_CREDENTIALS.'
      ? err.message
      : 'Batch TTS failed.';
    return res.status(500).json({ error: message });
  }
};
