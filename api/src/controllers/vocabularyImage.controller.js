import { getVocabularyImage } from '../services/vocabularyImage.service.js';

export const vocabularyImage = async (req, res, next) => {
  const query = String(req.query.q || '').trim();
  if (!query) return res.status(400).json({ error: 'Missing vocabulary image query.' });
  if (query.length > 120) return res.status(400).json({ error: 'Vocabulary image query is too long.' });

  try {
    return res.json(await getVocabularyImage(query));
  } catch (error) {
    return next(error);
  }
};
