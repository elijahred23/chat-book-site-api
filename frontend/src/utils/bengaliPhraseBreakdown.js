import GLOSSES from "../data/bengali-glosses.json";

const cleanTokens = (value) => String(value || "").trim().split(/\s+/).map((token) => token.replace(/[।,?!“”"'’…:;]/g, "")).filter(Boolean);

export const buildPhraseWords = (phrase) => {
  if (Array.isArray(phrase?.words) && phrase.words.length) return phrase.words;
  const bengali = cleanTokens(phrase?.bn);
  const pronunciation = cleanTokens(phrase?.pronunciation);
  return bengali.map((bn, index) => ({
    bn,
    pronunciation: pronunciation[index] || bn,
    en: GLOSSES[bn] || `part of “${phrase.en}”`,
  }));
};

export const withPhraseWords = (lesson) => {
  const phrases = (lesson?.phrases || []).map((phrase) => ({ ...phrase, words: buildPhraseWords(phrase) }));
  return { ...lesson, phrases };
};

export const phraseBreakdownItems = (lesson) => (lesson?.phrases || []).map((phrase) => ({
  ...phrase,
  words: buildPhraseWords(phrase),
  breakdownEnglish: buildPhraseWords(phrase).map((word) => word.en).join(" "),
}));
