import textToSpeech from '@google-cloud/text-to-speech';
import { googleClientOptions, hasGoogleCredentials } from '../config/googleCredentials.js';

let ttsClient = null;
try {
  ttsClient = new textToSpeech.TextToSpeechClient(googleClientOptions());
  console.log(`Google TTS client initialized (${hasGoogleCredentials() ? 'configured credentials' : 'application default credentials'})`);
} catch (err) {
  console.warn('Google TTS client not initialized:', err.message);
}

export const synthesizeSpeech = async ({ text, lang = 'bn-IN' }) => {
  if (!ttsClient) throw new Error('TTS client not initialized. Set TTS_SA_JSON or GOOGLE_APPLICATION_CREDENTIALS.');
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
