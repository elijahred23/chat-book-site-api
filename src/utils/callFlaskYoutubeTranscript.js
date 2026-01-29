import { hostname } from "./hostname";

export const getFlaskYoutubeTranscript = async (url) => {
  const encoded = encodeURIComponent(url);
  const response = await fetch(`${hostname}/youtube/transcript?url=${encoded}`);

  let data = null;
  try {
    data = await response.json();
  } catch {
    // ignore JSON parse errors; we'll fall back to status text
  }

  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      `Failed to fetch transcript (HTTP ${response.status})`;
    const err = new Error(message);
    err.status = response.status;
    err.stage = data?.stage;
    throw err;
  }

  return data;
};
