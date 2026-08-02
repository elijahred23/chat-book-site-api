import GLOSSES from "../data/bengali-glosses.json";
import { buildPhraseWordsWithGlosses } from "./bengaliPhraseBreakdownCore.js";

export const buildPhraseWords = (phrase) => buildPhraseWordsWithGlosses(phrase, GLOSSES);

export const withPhraseWords = (lesson) => {
  const phrases = (lesson?.phrases || []).map((phrase) => ({ ...phrase, words: buildPhraseWords(phrase) }));
  return { ...lesson, phrases };
};

export const phraseBreakdownItems = (lesson) => (lesson?.phrases || []).map((phrase) => ({
  ...phrase,
  words: buildPhraseWords(phrase),
  breakdownEnglish: buildPhraseWords(phrase).map((word) => word.en).join(" "),
}));
