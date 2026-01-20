import { hostname } from "./hostname";

export const getFlaskYoutubeTranscript = async (url) => {
  const encoded = encodeURIComponent(url);
  const response = await fetch(`${hostname}/youtube/transcript?url=${encoded}`);

  if (!response.ok) {
    throw new Error("Failed to fetch transcript from API.");
  }

  return await response.json();
};
