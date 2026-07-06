import { getPageUrls } from '../services/pageUrls.service.js';
import { searchWeb } from '../services/webSearch.service.js';
import { logErrorToFile } from '../utils/errorLog.js';

export const webSearch = async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Missing query' });

  try {
    const { results, preferredUrl } = await searchWeb(q);
    if (!results.length) return res.json({ results: [], message: 'No results parsed; site may have changed.' });
    return res.json({ results, preferredUrl });
  } catch (err) {
    console.error('Web search error:', err);
    logErrorToFile(err);
    return res.status(500).json({ error: 'Search failed', message: err.message });
  }
};

export const pageUrls = async (req, res) => {
  const requestedUrl = (req.query.url || '').trim();
  if (!requestedUrl) return res.status(400).json({ error: 'Missing URL.' });

  try {
    const result = await getPageUrls(requestedUrl);
    return res.json(result);
  } catch (error) {
    const message = error?.name === 'AbortError'
      ? 'The page took too long to respond.'
      : error?.message || 'Unable to inspect the page.';
    console.error('Page URL extraction error:', error);
    logErrorToFile(error);
    return res.status(422).json({ error: message });
  }
};
