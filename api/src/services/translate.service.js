import { translateLanguageToEnglish } from './gemini.service.js';

export const translateText = async ({ text, source = 'bn', target = 'en' }) => {
  if (!['bn', 'ar'].includes(source) || target !== 'en') throw new Error('Gemini phrase breakdown supports Bengali or Arabic to English.');
  const result = await translateLanguageToEnglish(text, source === 'ar' ? 'Arabic' : 'Bengali');
  return { ...result, provider: 'gemini' };
};
