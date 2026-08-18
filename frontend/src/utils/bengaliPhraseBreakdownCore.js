const cleanTokens = (value) => String(value || "").trim().split(/\s+/).map((token) => token.replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, "")).filter(Boolean);

const INDEPENDENT_VOWELS = {
  "অ": "o", "আ": "a", "ই": "i", "ঈ": "i", "উ": "u", "ঊ": "u", "ঋ": "ri",
  "এ": "e", "ঐ": "oi", "ও": "o", "ঔ": "ou",
};
const CONSONANTS = {
  "ক": "k", "খ": "kh", "গ": "g", "ঘ": "gh", "ঙ": "ng", "চ": "ch", "ছ": "chh",
  "জ": "j", "ঝ": "jh", "ঞ": "ny", "ট": "t", "ঠ": "th", "ড": "d", "ঢ": "dh",
  "ণ": "n", "ত": "t", "থ": "th", "দ": "d", "ধ": "dh", "ন": "n", "প": "p",
  "ফ": "ph", "ব": "b", "ভ": "bh", "ম": "m", "য": "j", "র": "r", "ল": "l",
  "শ": "sh", "ষ": "sh", "স": "s", "হ": "h", "ড়": "r", "ঢ়": "rh", "য়": "y", "ৎ": "t",
};
const VOWEL_MARKS = {
  "া": "a", "ি": "i", "ী": "i", "ু": "u", "ূ": "u", "ৃ": "ri",
  "ে": "e", "ৈ": "oi", "ো": "o", "ৌ": "ou",
};

export const romanizeBengaliWord = (value) => {
  const characters = Array.from(String(value || "").normalize("NFC"));
  let pronunciation = "";

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index];
    const nextCharacter = characters[index + 1];

    if (INDEPENDENT_VOWELS[character]) {
      pronunciation += INDEPENDENT_VOWELS[character];
    } else if (CONSONANTS[character]) {
      const vowelMark = VOWEL_MARKS[nextCharacter];
      const hasantaFollows = nextCharacter === "্";
      pronunciation += CONSONANTS[character] + (vowelMark || hasantaFollows ? "" : "o");
    } else if (VOWEL_MARKS[character]) {
      pronunciation = pronunciation.replace(/o$/u, "") + VOWEL_MARKS[character];
    } else if (character === "্") {
      pronunciation = pronunciation.replace(/o$/u, "");
    } else if (character === "ং") {
      pronunciation += "ng";
    } else if (character === "ঁ") {
      pronunciation += "n";
    } else if (character === "ঃ") {
      pronunciation += "h";
    } else if (/\s/u.test(character)) {
      pronunciation += character;
    }
  }

  return CONSONANTS[characters.at(-1)] ? pronunciation.replace(/o$/u, "") : pronunciation;
};

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

export const buildPhraseWordsWithGlosses = (phrase, glosses) => {
  if (Array.isArray(phrase?.words) && phrase.words.length) return phrase.words;
  const bengali = cleanTokens(phrase?.bn);
  const pronunciation = alignPronunciation(bengali, phrase?.pronunciation);
  return bengali.map((bn, index) => ({
    bn,
    pronunciation: pronunciation[index] || romanizeBengaliWord(bn),
    en: glosses[bn] || "meaning unavailable",
  }));
};
