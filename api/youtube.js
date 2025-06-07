import { google } from 'googleapis';
import dotenv from 'dotenv';
import { fetchTranscript as fetchYoutubeTranscript } from 'youtube-transcript-plus';

dotenv.config();

const apiKey = process.env.YOUTUBE_API_KEY || '';
const youtube = google.youtube({
  version: 'v3',
  auth: apiKey
});

function extractVideoId(input) {
  if (!input) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  const urlPattern = /(?:v=|\/embed\/|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})/;
  const match = input.match(urlPattern);
  return match ? match[1] : null;
}

export async function fetchTranscript(urlOrId) {
  const videoId = extractVideoId(urlOrId);
  if (!videoId) return '';

  try {
    const transcript = await fetchYoutubeTranscript(videoId, {
      lang: 'en',
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    });

    // Combine all text fields into a single string
    console.log({transcript})
    const transcriptText = transcript.map(entry => entry.text).join(' ');
    return transcriptText;
  } catch (error) {
    console.error('Transcript fetch failed:', error);
    return '';
  }
}


/**
 * Search YouTube videos based on a query string
 * @param {string} query
 * @param {number} maxResults
 * @returns {Promise<Array>} List of videos with title, videoId, and URL
 */
export async function searchYouTube(query, maxResults = 100) {
  try {
    const searchResponse = await youtube.search.list({
      part: 'snippet',
      q: query,
      maxResults,
      type: 'video'
    });

    if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
      return [];
    }

    const videoIds = searchResponse.data.items.map(item => item.id.videoId);

    // Fetch additional details (duration, likes) for these videos
    let videoDetailsMap = new Map();
    if (videoIds.length > 0) {
      try {
        const detailsResponse = await youtube.videos.list({
          part: 'contentDetails,statistics', // Request contentDetails for duration, statistics for likes
          id: videoIds.join(','),          // Comma-separated list of video IDs
        });

        detailsResponse.data.items.forEach(video => {
          videoDetailsMap.set(video.id, {
            duration: video.contentDetails?.duration,
            likeCount: video.statistics?.likeCount,
            viewCount: video.statistics?.viewCount, // Also available if needed
          });
        });
      } catch (detailsError) {
        console.error('YouTube Video Details Error (in searchYouTube):', detailsError);
        // If fetching details fails, we'll proceed with the basic info from search results.
        // Duration and likeCount will be undefined for the items.
      }
    }

    return searchResponse.data.items.map(item => {
      const details = videoDetailsMap.get(item.id.videoId) || {};
      return {
        title: item.snippet.title,
        videoId: item.id.videoId,
        url: `https://youtube.com/watch?v=${item.id.videoId}`,
        thumbnail: item.snippet.thumbnails.default.url,
        channelTitle: item.snippet.channelTitle,
        duration: details.duration, // e.g., "PT5M30S"
        likeCount: details.likeCount,
        viewCount: details.viewCount,
        publishedAt: item.snippet.publishedAt,
        description: item.snippet.description,
        channelId: item.snippet.channelId,
      };
    });

  } catch (searchError) {
    console.error('YouTube Search Error:', searchError);
    return [];
  }
}


export async function getTrendingVideos(maxResults = 50) {
  try {
    const response = await youtube.videos.list({
      part: 'snippet,statistics',
      chart: 'mostPopular',
      maxResults,
      regionCode: 'US'
    });

    return response.data.items.map(item => ({
      title: item.snippet.title,
      videoId: item.id,
      url: `https://youtube.com/watch?v=${item.id.videoId}`,
      thumbnail: item.snippet.thumbnails.default.url,
      channelTitle: item.snippet.channelTitle
    }));
  } catch (error) {
    console.error('YouTube Trending Videos Error:', error);
    return [];
  }
}

export async function getNewsVideos(maxResults = 50){
  let results = await searchYouTube('news', maxResults);

  return results;
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

export async function searchYouTubePlaylists(query, maxResults = 50) {
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

    const videoIds = response.data.items.map(item => item.snippet.resourceId.videoId);

    // Fetch additional details (duration, likes) for these videos
    let videoDetailsMap = new Map();
    if (videoIds.length > 0) {
      try {
        const detailsResponse = await youtube.videos.list({
          part: 'contentDetails,statistics', // Request contentDetails for duration, statistics for likes
          id: videoIds.join(','),          // Comma-separated list of video IDs
        });

        detailsResponse.data.items.forEach(video => {
          videoDetailsMap.set(video.id, {
            duration: video.contentDetails?.duration,
            likeCount: video.statistics?.likeCount,
            viewCount: video.statistics?.viewCount, // Also available if needed
          });
        });
      } catch (detailsError) {
        console.error('YouTube Video Details Error (in getPlaylistItems):', detailsError);
        // If fetching details fails, we'll proceed with the basic info from search results.
        // Duration and likeCount will be undefined for the items.
      }
    }

    return response.data.items.map(item => {
      const details = videoDetailsMap.get(item.snippet.resourceId.videoId) || {};
      return {
        title: item.snippet.title,
        videoId: item.snippet.resourceId.videoId,
        url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
        thumbnail: item.snippet.thumbnails?.default?.url,
        channelTitle: item.snippet.videoOwnerChannelTitle,
        duration: details.duration, // e.g., "PT5M30S"
        likeCount: details.likeCount,
        viewCount: details.viewCount,
      };
    });
  } catch (error) {
    console.error('Error fetching playlist items:', error);
    return [];
  }
}

/**
 * Get top-level comments from a YouTube video
 * @param {string} videoUrlOrId - YouTube video URL or video ID
 * @param {number} maxResults - Number of comments to fetch (max 100 per API call)
 * @returns {Promise<Array>} List of comments with author and text
 */
export async function getVideoComments(videoUrlOrId, maxResults = 200) {
  try {
    const videoId = extractVideoId(videoUrlOrId);
    if (!videoId) {
      console.error('Invalid video URL or ID');
      return [];
    }

    const response = await youtube.commentThreads.list({
      part: 'snippet',
      videoId: videoId,
      maxResults: maxResults
    });

    return response.data.items.map(item => ({
      author: item.snippet.topLevelComment.snippet.authorDisplayName,
      comment: item.snippet.topLevelComment.snippet.textDisplay,
      publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
      likeCount: item.snippet.topLevelComment.snippet.likeCount
    }));
  } catch (error) {
    console.error('Error fetching video comments:', error);
    return [];
  }
}
