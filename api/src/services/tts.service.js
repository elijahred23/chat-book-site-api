import fs from 'fs';
import path from 'path';
import textToSpeech from '@google-cloud/text-to-speech';
import { env } from '../config/env.js';
import { secretsDir } from '../config/paths.js';
import { logErrorToFile } from '../utils/errorLog.js';

const ensureTtsCredentialsFile = () => {
  const rawJson = env.ttsServiceAccountJson;
  if (!rawJson) return null;

  try {
    const parsed = JSON.parse(rawJson);
    const credentialsPath = env.googleApplicationCredentials || path.join(secretsDir, 'tts-sa.json');
    fs.mkdirSync(path.dirname(credentialsPath), { recursive: true });
    fs.writeFileSync(credentialsPath, JSON.stringify(parsed, null, 2));

    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
    }

    console.log(`TTS credentials file created at ${credentialsPath}`);
    return credentialsPath;
  } catch (err) {
    console.error('Failed to parse TTS service account JSON from env', err.message);
    logErrorToFile(err);
    return null;
  }
};

let ttsClient = null;
try {
  ensureTtsCredentialsFile();
  ttsClient = new textToSpeech.TextToSpeechClient();
  console.log('Google TTS client initialized');
} catch (err) {
  console.warn('Google TTS client not initialized (missing credentials?)', err.message);
}

export const synthesizeSpeech = async ({ text, lang = 'bn-IN' }) => {
  if (!ttsClient) throw new Error('TTS client not initialized. Set GOOGLE_APPLICATION_CREDENTIALS.');
  const request = {
    input: { text },
    voice: {
      languageCode: lang,
      ssmlGender: 'FEMALE',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 1.0,
    },
  };
  const [response] = await ttsClient.synthesizeSpeech(request);
  return response.audioContent;
};

export const synthesizeSpeechBatch = async (items) => {
  const audioBuffers = [];
  for (const item of items) {
    const text = item?.text;
    const lang = item?.lang || 'bn-IN';
    if (!text || typeof text !== 'string') continue;
    const audioContent = await synthesizeSpeech({ text, lang });
    if (audioContent) audioBuffers.push(audioContent);
  }
  return Buffer.concat(audioBuffers.map((buffer) => Buffer.from(buffer)));
};
