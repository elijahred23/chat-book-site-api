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
