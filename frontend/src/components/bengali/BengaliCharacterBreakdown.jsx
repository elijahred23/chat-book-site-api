import { useMemo } from "react";
import { FaEraser } from "react-icons/fa";
import { actions, useAppDispatch, useAppState } from "../../context/AppContext.jsx";
import Button from "../../ui/Button.jsx";
import "./BengaliCharacterBreakdown.css";

const LETTER_NAMES = {
  "অ": "অ — ô", "আ": "আ — a", "ই": "ই — i", "ঈ": "ঈ — ī", "উ": "উ — u", "ঊ": "ঊ — ū",
  "ঋ": "ঋ — ri", "এ": "এ — e", "ঐ": "ঐ — oi", "ও": "ও — o", "ঔ": "ঔ — ou",
  "ক": "ক — kô", "খ": "খ — khô", "গ": "গ — gô", "ঘ": "ঘ — ghô", "ঙ": "ঙ — ngô",
  "চ": "চ — cô", "ছ": "ছ — chô", "জ": "জ — jô", "ঝ": "ঝ — jhô", "ঞ": "ঞ — ñô",
  "ট": "ট — ṭô", "ঠ": "ঠ — ṭhô", "ড": "ড — ḍô", "ঢ": "ঢ — ḍhô", "ণ": "ণ — ṇô",
  "ত": "ত — tô", "থ": "থ — thô", "দ": "দ — dô", "ধ": "ধ — dhô", "ন": "ন — nô",
  "প": "প — pô", "ফ": "ফ — phô/fô", "ব": "ব — bô", "ভ": "ভ — bhô", "ম": "ম — mô",
  "য": "য — jô", "র": "র — rô", "ল": "ল — lô", "শ": "শ — shô", "ষ": "ষ — ṣô",
  "স": "স — sô", "হ": "হ — hô", "ড়": "ড় — ṛô", "ঢ়": "ঢ় — ṛhô", "য়": "য় — yô",
  "ৎ": "ৎ — khôndô tô",
};

const MARK_NAMES = {
  "া": "া — a-kar", "ি": "ি — i-kar", "ী": "ী — ī-kar", "ু": "ু — u-kar", "ূ": "ূ — ū-kar",
  "ৃ": "ৃ — ri-kar", "ে": "ে — e-kar", "ৈ": "ৈ — oi-kar", "ো": "ো — o-kar", "ৌ": "ৌ — ou-kar",
  "্": "্ — hasanta", "ঁ": "ঁ — candrabindu", "ং": "ং — anusvara", "ঃ": "ঃ — visarga",
  "়": "় — nukta", "ৗ": "ৗ — au length mark",
};

const DIGIT_NAMES = {
  "০": "zero", "১": "one", "২": "two", "৩": "three", "৪": "four",
  "৫": "five", "৬": "six", "৭": "seven", "৮": "eight", "৯": "nine",
};

const PUNCTUATION_NAMES = { "।": "dari (sentence mark)", "॥": "double dari", "৳": "taka sign" };
const bengaliPattern = /[\u0980-\u09FF]/u;
const PRONUNCIATION_LETTERS = {
  "অ": "ô", "আ": "a", "ই": "i", "ঈ": "i", "উ": "u", "ঊ": "u", "ঋ": "ri",
  "এ": "e", "ঐ": "oi", "ও": "o", "ঔ": "ou", "ক": "k", "খ": "kh", "গ": "g",
  "ঘ": "gh", "ঙ": "ng", "চ": "ch", "ছ": "chh", "জ": "j", "ঝ": "jh", "ঞ": "ny",
  "ট": "ṭ", "ঠ": "ṭh", "ড": "ḍ", "ঢ": "ḍh", "ণ": "ṇ", "ত": "t", "থ": "th",
  "দ": "d", "ধ": "dh", "ন": "n", "প": "p", "ফ": "ph", "ব": "b", "ভ": "bh",
  "ম": "m", "য": "j", "র": "r", "ল": "l", "শ": "sh", "ষ": "ṣ", "স": "s",
  "হ": "h", "ড়": "ṛ", "ঢ়": "ṛh", "য়": "y", "ৎ": "t",
};
const PRONUNCIATION_MARKS = {
  "া": "a", "ি": "i", "ী": "i", "ু": "u", "ূ": "u", "ৃ": "ri",
  "ে": "e", "ৈ": "oi", "ো": "o", "ৌ": "ou",
};

function describeCharacter(character) {
  const code = `U+${character.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`;
  if (LETTER_NAMES[character]) return { name: LETTER_NAMES[character], type: "Letter", code };
  if (MARK_NAMES[character]) return { name: MARK_NAMES[character], type: "Vowel/phonetic mark", code };
  if (DIGIT_NAMES[character]) return { name: `Bengali ${DIGIT_NAMES[character]}`, type: "Digit", code };
  if (PUNCTUATION_NAMES[character]) return { name: PUNCTUATION_NAMES[character], type: "Symbol", code };
  if (character === "\n") return { name: "Line break", type: "Whitespace", code };
  if (character === "\t") return { name: "Tab", type: "Whitespace", code };
  if (/\s/u.test(character)) return { name: "Space", type: "Whitespace", code };
  if (/\p{Mark}/u.test(character)) return { name: "Combining mark", type: "Mark", code };
  if (bengaliPattern.test(character)) return { name: "Bengali character", type: "Character", code };
  if (/\p{Letter}/u.test(character)) return { name: "Non-Bengali letter", type: "Letter", code };
  if (/\p{Number}/u.test(character)) return { name: "Number", type: "Digit", code };
  return { name: "Punctuation or symbol", type: "Symbol", code };
}

function segmentText(text) {
  if (!text) return [];
  const segmenter = typeof Intl.Segmenter === "function"
    ? new Intl.Segmenter("bn", { granularity: "grapheme" })
    : null;
  const graphemes = segmenter ? [...segmenter.segment(text)].map(({ segment }) => segment) : Array.from(text);
  let offset = 0;
  return graphemes.map((grapheme, index) => {
    const characters = Array.from(grapheme).map((character) => ({ character, ...describeCharacter(character) }));
    const item = { grapheme, characters, index, offset };
    offset += grapheme.length;
    return item;
  });
}

function completedWordBefore(segments, index) {
  const characters = [];
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const segment = segments[cursor];
    if (segment.characters.every(({ type }) => type === "Whitespace")) break;
    characters.unshift(segment.grapheme);
  }
  return characters.join("");
}

function approximatePronunciation(word) {
  let pronunciation = "";
  for (const character of Array.from(word.normalize("NFC"))) {
    if (PRONUNCIATION_LETTERS[character]) {
      const isConsonant = Boolean(LETTER_NAMES[character]) && !/^[অআইঈউঊঋএঐওঔ]$/u.test(character);
      pronunciation += PRONUNCIATION_LETTERS[character] + (isConsonant ? "ô" : "");
    } else if (PRONUNCIATION_MARKS[character]) {
      pronunciation = pronunciation.replace(/ô$/u, "") + PRONUNCIATION_MARKS[character];
    } else if (character === "্") {
      pronunciation = pronunciation.replace(/ô$/u, "");
    } else if (character === "ং") {
      pronunciation += "ng";
    } else if (character === "ঁ") {
      pronunciation += "̃";
    } else if (character === "ঃ") {
      pronunciation += "h";
    }
  }
  return pronunciation || "—";
}

export default function BengaliCharacterBreakdown() {
  const dispatch = useAppDispatch();
  const { bengaliBreakdownText } = useAppState();
  const segments = useMemo(() => segmentText(bengaliBreakdownText), [bengaliBreakdownText]);
  const bengaliCount = segments.filter(({ characters }) =>
    characters.some(({ character }) => bengaliPattern.test(character))
  ).length;
  const lastSegment = segments[segments.length - 1];
  const finalWord = lastSegment && !lastSegment.characters.every(({ type }) => type === "Whitespace")
    ? completedWordBefore(segments, segments.length)
    : "";

  return (
    <div className="bengali-breakdown">
      <section className="bengali-breakdown__intro">
        <p>Paste a Bengali word, sentence, paragraph, or mixed text. Each written character is separated, including the Unicode parts inside conjuncts and vowel signs.</p>
        <label className="ui-field">
          <span className="ui-field__label">Bengali text</span>
          <textarea
            className="ui-input bengali-breakdown__input"
            lang="bn"
            value={bengaliBreakdownText}
            onChange={(event) => dispatch(actions.setBengaliBreakdownText(event.target.value))}
            placeholder="উদাহরণ: আমি বাংলা শিখছি।"
            autoFocus
          />
        </label>
        <div className="bengali-breakdown__toolbar">
          <span role="status">{segments.length} written characters · {bengaliCount} Bengali</span>
          <Button variant="ghost" onClick={() => dispatch(actions.setBengaliBreakdownText(""))} disabled={!bengaliBreakdownText}>
            <FaEraser aria-hidden="true" /> Clear
          </Button>
        </div>
      </section>

      {segments.length ? (
        <ol className="bengali-breakdown__list" aria-label="Character breakdown">
          {segments.map(({ grapheme, characters, index, offset }) => {
            const whitespace = characters.every(({ type }) => type === "Whitespace");
            const completedWord = whitespace ? completedWordBefore(segments, index) : "";
            const pronunciation = completedWord ? approximatePronunciation(completedWord) : "";
            if (whitespace && !completedWord) return null;
            return (
              <li className={`bengali-breakdown__item${whitespace ? " is-completed-word" : ""}`} key={`${offset}-${grapheme}`}>
                <div className="bengali-breakdown__glyph" lang="bn" aria-label={whitespace ? characters[0].name : grapheme}>
                  {whitespace ? completedWord : grapheme}
                </div>
                <div className="bengali-breakdown__details">
                  <span className="bengali-breakdown__position">{whitespace ? "Completed word" : `Character ${index + 1}`}</span>
                  {whitespace ? (
                    <div className="bengali-breakdown__word-boundary">
                      <b lang="bn">{completedWord}</b>
                      <span>Possible pronunciation: <strong>{pronunciation}</strong></span>
                      <small>Approximate; pronunciation may vary.</small>
                    </div>
                  ) : (
                    characters.map(({ character, name, type, code }, partIndex) => (
                      <div className="bengali-breakdown__part" key={`${code}-${partIndex}`}>
                        <b lang="bn">{character}</b>
                        <span>{name}</span>
                        <small>{type} · {code}</small>
                      </div>
                    ))
                  )}
                </div>
              </li>
            );
          })}
          {finalWord ? (
            <li className="bengali-breakdown__item is-completed-word" key="final-completed-word">
              <div className="bengali-breakdown__glyph" lang="bn">{finalWord}</div>
              <div className="bengali-breakdown__details">
                <span className="bengali-breakdown__position">Completed word</span>
                <div className="bengali-breakdown__word-boundary">
                  <b lang="bn">{finalWord}</b>
                  <span>Possible pronunciation: <strong>{approximatePronunciation(finalWord)}</strong></span>
                  <small>Approximate; pronunciation may vary.</small>
                </div>
              </div>
            </li>
          ) : null}
        </ol>
      ) : (
        <div className="bengali-breakdown__empty">
          <span lang="bn" aria-hidden="true">অ আ ক খ</span>
          <p>Your character breakdown will appear here as you type.</p>
        </div>
      )}
    </div>
  );
}
