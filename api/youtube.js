import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.YOUTUBE_API_KEY || '';
const youtube = google.youtube({
  version: 'v3',
  auth: apiKey
});

export async function fetchTranscript(url){
    
    return url;
}

/**
 * Search YouTube videos based on a query string
 * @param {string} query
 * @param {number} maxResults
 * @returns {Promise<Array>} List of videos with title, videoId, and URL
 */
export async function searchYouTube(query, maxResults = 20) {
  try {
    const response = await youtube.search.list({
      part: 'snippet',
      q: query,
      maxResults,
      type: 'video'
    });

    return response.data.items.map(item => ({
      title: item.snippet.title,
      videoId: item.id.videoId,
      url: `https://youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails.default.url,
      channelTitle: item.snippet.channelTitle
    }));
  } catch (error) {
    console.error('YouTube Search Error:', error);
    return [];
  }
}

/**
 * Get detailed stats and metadata for a video
 * @param {string} videoId
 * @returns {Promise<Object>} Video details (title, views, likes, etc.)
 */
export async function getVideoDetails(videoId) {
  try {
    const response = await youtube.videos.list({
      part: 'snippet,statistics',
      id: videoId
    });

    const video = response.data.items[0];
    return {
      title: video.snippet.title,
      description: video.snippet.description,
      views: video.statistics.viewCount,
      likes: video.statistics.likeCount,
      channelTitle: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt
    };
  } catch (error) {
    console.error('YouTube Video Detail Error:', error);
    return null;
  }
}

export async function searchYouTubePlaylists(query, maxResults = 20) {
  try {
    const response = await youtube.search.list({
      part: 'snippet',
      q: query,
      maxResults,
      type: 'playlist',
    });

    return response.data.items.map(item => ({
      title: item.snippet.title,
      playlistId: item.id.playlistId,
      url: `https://www.youtube.com/playlist?list=${item.id.playlistId}`,
      thumbnail: item.snippet.thumbnails?.default?.url,
      channelTitle: item.snippet.channelTitle,
    }));
  } catch (error) {
    console.error('YouTube Playlist Search Error:', error);
    return [];
  }
}

export async function getPlaylistItems(playlistId, maxResults = 25) {
  try {
    const response = await youtube.playlistItems.list({
      part: 'snippet',
      playlistId,
      maxResults,
    });

    return response.data.items.map(item => ({
      title: item.snippet.title,
      videoId: item.snippet.resourceId.videoId,
      url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
      thumbnail: item.snippet.thumbnails?.default?.url,
      channelTitle: item.snippet.videoOwnerChannelTitle,
    }));
  } catch (error) {
    console.error('Error fetching playlist items:', error);
    return [];
  }
}
