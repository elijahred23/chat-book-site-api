import { translateBengaliToEnglish } from './gemini.service.js';

export const translateText = async ({ text, source = 'bn', target = 'en' }) => {
  if (source !== 'bn' || target !== 'en') {
    throw new Error('Gemini phrase breakdown currently supports Bengali to English only.');
  }
  const result = await translateBengaliToEnglish(text);
  return { ...result, provider: 'gemini' };
};
