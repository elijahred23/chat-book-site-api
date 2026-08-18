import GLOSSES from "../data/bengali-glosses.json";
import { buildPhraseWordsWithGlosses, romanizeBengaliWord } from "./bengaliPhraseBreakdownCore.js";

export const buildPhraseWords = (phrase) => buildPhraseWordsWithGlosses(phrase, GLOSSES);

export const withPhraseWords = (lesson) => {
  const vocab = (lesson?.vocab || []).map((item) => ({
    ...item,
    pronunciation: item.pronunciation || romanizeBengaliWord(item.bn),
  }));
  const phrases = (lesson?.phrases || []).map((phrase) => {
    const words = buildPhraseWords(phrase);
    return {
      ...phrase,
      pronunciation: phrase.pronunciation || words.map((word) => word.pronunciation).join(" "),
      words,
    };
  });
  return { ...lesson, vocab, phrases };
};

export const phraseBreakdownItems = (lesson) => (lesson?.phrases || []).map((phrase) => ({
  ...phrase,
  words: buildPhraseWords(phrase),
  breakdownEnglish: buildPhraseWords(phrase).map((word) => word.en).join(" "),
}));
