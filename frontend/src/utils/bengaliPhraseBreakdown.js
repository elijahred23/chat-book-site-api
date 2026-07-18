import GLOSSES from "../data/bengali-glosses.json";

const cleanTokens = (value) => String(value || "").trim().split(/\s+/).map((token) => token.replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, "")).filter(Boolean);

// Bengali case endings and classifiers are attached to the preceding word in
// Bengali script, but are frequently separated in learner transliterations.
const ROMANIZED_SUFFIXES = new Set(["e", "er", "gulo", "ke", "ta", "te", "ti"]);

const alignPronunciation = (bengali, value) => {
  const pronunciation = cleanTokens(value);
  if (pronunciation.length <= bengali.length) return pronunciation;

  const aligned = [...pronunciation];
  for (let index = 1; index < aligned.length && aligned.length > bengali.length; index += 1) {
    if (!ROMANIZED_SUFFIXES.has(aligned[index].toLowerCase())) continue;
    aligned.splice(index - 1, 2, `${aligned[index - 1]}${aligned[index]}`);
    index -= 1;
  }
  return aligned;
};

export const buildPhraseWords = (phrase) => {
  if (Array.isArray(phrase?.words) && phrase.words.length) return phrase.words;
  const bengali = cleanTokens(phrase?.bn);
  const pronunciation = alignPronunciation(bengali, phrase?.pronunciation);
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
