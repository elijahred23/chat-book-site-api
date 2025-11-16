import { hostname } from "./hostname";

export const getSupadataTranscript = async (url) => {
  const response = await fetch(`${hostname}/supadata/transcript?url=${encodeURIComponent(url)}`);
  if (response.ok) {
    const data = await response.json();
    return data;
  }
  throw new Error("Failed to fetch transcript from Supadata.");
}