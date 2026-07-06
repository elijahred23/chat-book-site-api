import { fetchTranscriptWithMetadata } from '../services/transcript.service.js';
import { getTranscript } from '../services/supadata.service.js';

export const youtubeTranscript = async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing URL parameter' });

  try {
    const result = await fetchTranscriptWithMetadata(url);
    if (result?.error) {
      const status = Number(result.status) || 400;
      return res.status(status).json({
        error: result.error,
        stage: result.stage || 'unknown',
      });
    }
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Failed to fetch transcript', stage: 'server' });
  }
};

export const supadataTranscript = async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing URL parameter' });

  try {
    const transcript = await getTranscript(url);
    return res.json({ transcript });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch transcript' });
  }
};
