import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 8080),
  chatGptApiKey: process.env.CHAT_GPT_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL?.trim() || '',
  supadataApiKey: process.env.SUPA_DATA_API_KEY || '',
  youtubeApiKey: process.env.YOUTUBE_API_KEY || '',
  pdfUploadMaxMb: Number(process.env.PDF_UPLOAD_MAX_MB || 1024),
  ttsServiceAccountJson: process.env.TTS_SA_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || '',
  googleApplicationCredentials: process.env.GOOGLE_APPLICATION_CREDENTIALS || '',
  plantUmlServerUrl: process.env.PLANTUML_SERVER_URL?.trim() || 'https://www.plantuml.com/plantuml',
};
