export const getFlaskYoutubeTranscript = async (url) => {
  const encoded = encodeURIComponent(url);

  const response = await fetch(`http://157.230.202.59/transcript?url=${encoded}`);

  if (!response.ok) {
    throw new Error("Failed to fetch transcript from Flask YouTube service.");
  }

  return await response.json();
};
