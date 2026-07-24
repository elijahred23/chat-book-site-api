import { google } from 'googleapis';
import { googleAuthOptions } from '../config/googleCredentials.js';
import { env } from '../config/env.js';
import { translateBengaliToEnglish } from './gemini.service.js';

const CLOUD_PLATFORM_SCOPE = 'https://www.googleapis.com/auth/cloud-platform';

const decodeHtmlEntities = (value) => value
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&');

export const translateText = async ({ text, source = 'bn', target = 'en' }) => {
  try {
    const auth = new google.auth.GoogleAuth(googleAuthOptions([CLOUD_PLATFORM_SCOPE]));
    const client = await auth.getClient();
    const response = await client.request({
      url: 'https://translation.googleapis.com/language/translate/v2',
      method: 'POST',
      data: { q: text, source, target, format: 'text' },
    });
    const translation = response.data?.data?.translations?.[0]?.translatedText;
    if (!translation) throw new Error('Google Translate returned no translation.');
    return { translation: decodeHtmlEntities(translation), provider: 'google-cloud-translate' };
  } catch (googleError) {
    if (!env.geminiApiKey || source !== 'bn' || target !== 'en') throw googleError;
    const translation = await translateBengaliToEnglish(text);
    return { translation, provider: 'gemini' };
  }
};
