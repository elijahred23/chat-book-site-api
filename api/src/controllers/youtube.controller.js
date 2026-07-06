import { getNewsVideos, getPlaylistItems, getTrendingVideos, getVideoComments, getVideoDetails, searchYouTube, searchYouTubePlaylists } from '../services/youtube.service.js';

export const getComments = async (req, res) => {
  const videoParam = req.query.video;
  const maxResults = parseInt(req.query.maxResults) || 20;
  if (!videoParam) return res.status(400).json({ error: 'Missing video URL or ID.' });

  try {
    const comments = await getVideoComments(videoParam, maxResults);
    return res.json(comments);
  } catch (error) {
    console.error('Comments API error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

export const searchVideos = async (req, res) => {
  const query = req.query.q;
  const pageToken = req.query.pageToken || '';
  const pageSize = parseInt(req.query.pageSize, 10) || 50;
  if (!query) return res.status(400).json({ error: 'Missing search query.' });

  try {
    const results = await searchYouTube(query, pageToken, pageSize);
    return res.json(results);
  } catch (error) {
    console.error('Search API error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

export const trending = async (req, res) => {
  try {
    const results = await getTrendingVideos();
    return res.json(results);
  } catch (error) {
    console.error('Trending API error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

export const news = async (req, res) => {
  try {
    const results = await getNewsVideos();
    return res.json(results);
  } catch (error) {
    console.error('News API error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getVideo = async (req, res) => {
  try {
    const details = await getVideoDetails(req.params.id);
    if (!details) return res.status(404).json({ error: 'Video not found.' });
    return res.json(details);
  } catch (error) {
    console.error('Video details API error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

export const searchPlaylists = async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ message: 'Missing search query' });

  try {
    const playlists = await searchYouTubePlaylists(query);
    return res.json(playlists);
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to fetch playlists' });
  }
};

export const playlistItems = async (req, res) => {
  try {
    const videos = await getPlaylistItems(req.params.playlistId);
    return res.json(videos);
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to fetch playlist items' });
  }
};
