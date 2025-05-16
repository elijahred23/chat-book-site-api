import { hostname } from "./hostname";

/**
 * Search YouTube videos
 * @param {string} query
 * @returns {Promise<Array>} Array of video objects with title, videoId, url, etc.
 */
export const searchYouTubeVideos = async (query) => {
  try {
    const response = await fetch(`${hostname}/youtube/search?q=${encodeURIComponent(query)}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData?.message || `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error("Unexpected response format from YouTube search.");
    }

    return data;
  } catch (error) {
    const errorMessage = error?.message || String(error);
    console.error("YouTube search error:", errorMessage);
    throw error;
  }
};

/**
 * Get details for a single YouTube video by ID
 * @param {string} videoId
 * @returns {Promise<Object>} Video details (title, views, likes, etc.)
 */
export const getYouTubeVideoDetails = async (videoId) => {
  try {
    const response = await fetch(`${hostname}/youtube/video/${videoId}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData?.message || `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    const data = await response.json();

    if (!data || !data.title) {
      throw new Error("Invalid response when fetching video details.");
    }

    return data;
  } catch (error) {
    const errorMessage = error?.message || String(error);
    console.error("YouTube video details error:", errorMessage);
    throw error;
  }
};

export const searchYouTubePlaylists = async (query) => {
  try {
    const response = await fetch(`${hostname}/youtube/search/playlists?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("Playlist search failed");
    return await response.json();
  } catch (error) {
    console.error('Playlist search error:', error);
    throw error;
  }
};

export const getPlaylistVideos = async (playlistId) => {
  try {
    const response = await fetch(`${hostname}/youtube/playlist/${playlistId}`);
    if (!response.ok) throw new Error("Failed to fetch playlist videos");
    return await response.json();
  } catch (err) {
    console.error("Playlist items fetch error:", err);
    throw err;
  }
};

/**
 * Get comments for a YouTube video by URL or ID
 * @param {string} videoUrlOrId - The YouTube video URL or video ID
 * @param {number} maxResults - Number of comments to fetch (default 20)
 * @returns {Promise<Array>} Array of comments with author, text, etc.
 */
export const getYouTubeVideoComments = async (videoUrlOrId, maxResults = 20) => {
  try {
    const url = `${hostname}/youtube/comments?video=${encodeURIComponent(videoUrlOrId)}&maxResults=${maxResults}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData?.message || `Request failed with status ${response.status}`;
      throw new Error(message);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("Unexpected response format when fetching comments.");
    }

    return data;
  } catch (error) {
    const errorMessage = error?.message || String(error);
    console.error("YouTube comments fetch error:", errorMessage);
    throw error;
  }
};

export const getTrendingVideos = async () => {
  try {
    const url = `${hostname}/youtube/trending`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch trending videos");
    return await response.json();
  }
  catch (error) {
    console.error('YouTube trending videos fetch error:', error);
    throw error;
  }
};

export const getNewsVideos = async () => {
  try {
    const url = `${hostname}/youtube/news`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch news videos");
    return await response.json();
  } catch (error) {
    const errorMessage = error?.message || String(error);
    console.error("YouTube news fetch error:", errorMessage);
    throw error;
  }
}