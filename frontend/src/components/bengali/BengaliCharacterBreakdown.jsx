import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FaEraser, FaPrint } from "react-icons/fa";
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
const DECOMPOSED_NUKTA_SOUNDS = { "ড": "ṛ", "ঢ": "ṛh", "য": "y" };
const COMMON_BENGALI_KEYBOARD_ROWS = [
  ["অ", "আ", "ই", "ঈ", "উ", "ঊ", "ঋ", "এ", "ঐ", "ও", "ঔ"],
  ["ক", "খ", "গ", "ঘ", "ঙ", "চ", "ছ", "জ", "ঝ", "ঞ"],
  ["ট", "ঠ", "ড", "ঢ", "ণ", "ত", "থ", "দ", "ধ", "ন"],
  ["প", "ফ", "ব", "ভ", "ম", "য", "র", "ল", "শ", "ষ", "স", "হ"],
  ["ড়", "ঢ়", "য়", "ৎ", "ং", "ঃ", "ঁ", "়", "া", "ি", "ী", "ু", "ূ", "ৃ", "ে", "ৈ", "ো", "ৌ", "্"],
];
const commonKeyboardCharacters = new Set(COMMON_BENGALI_KEYBOARD_ROWS.flat());
const additionalBengaliCharacters = [
  "।",
  "॥",
  ...Array.from({ length: 0x80 }, (_, index) => String.fromCodePoint(0x0980 + index))
    .filter((character) => /\p{Assigned}/u.test(character)),
].filter((character, index, characters) =>
  !commonKeyboardCharacters.has(character) && characters.indexOf(character) === index
);
const PUNCTUATION_KEYBOARD_ROWS = [
  [",", ".", "?", "!", ":", ";", "…", "-", "—", "/", "\\"],
  ["'", "\"", "‘", "’", "“", "”", "(", ")", "[", "]", "{", "}"],
];
const BENGALI_KEYBOARD_ROWS = [
  ...COMMON_BENGALI_KEYBOARD_ROWS,
  ...Array.from(
    { length: Math.ceil(additionalBengaliCharacters.length / 14) },
    (_, index) => additionalBengaliCharacters.slice(index * 14, index * 14 + 14)
  ),
  ...PUNCTUATION_KEYBOARD_ROWS,
];

function describeCharacter(character) {
  const code = `U+${character.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`;
  if (LETTER_NAMES[character]) return { name: LETTER_NAMES[character], type: "Letter", code };
  if (MARK_NAMES[character]) return { name: MARK_NAMES[character], type: "Vowel/phonetic mark", code };
  if (DIGIT_NAMES[character]) return { name: `Bengali ${DIGIT_NAMES[character]}`, type: "Digit", code };
  if (PUNCTUATION_NAMES[character]) return { name: PUNCTUATION_NAMES[character], type: "Symbol", code };
  if (character === "\u200D") return { name: "Zero-width joiner (shapes a conjunct)", type: "Joiner", code };
  if (character === "\u200C") return { name: "Zero-width non-joiner (blocks a conjunct)", type: "Joiner", code };
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

function groupSegmentsIntoWords(segments) {
  const groups = [];
  let currentGroup = [];

  segments.forEach((segment) => {
    const whitespace = segment.characters.every(({ type }) => type === "Whitespace");
    if (whitespace) {
      if (currentGroup.length) groups.push(currentGroup);
      currentGroup = [];
      return;
    }
    const punctuation = segment.characters.every(({ type }) => type === "Symbol");
    if (punctuation) {
      if (currentGroup.length) groups.push(currentGroup);
      groups.push([segment]);
      currentGroup = [];
      return;
    }
    currentGroup.push(segment);
  });

  if (currentGroup.length) groups.push(currentGroup);
  return groups;
}

function approximatePronunciation(word) {
  let pronunciation = "";
  const characters = Array.from(word.normalize("NFC"));
  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index];
    const previousCharacter = characters[index - 1];
    const nextCharacter = characters[index + 1];
    const conjunctCharacter = nextCharacter === "্" ? characters[index + 2] : "";
    const decomposedNuktaSound = nextCharacter === "়" ? DECOMPOSED_NUKTA_SOUNDS[character] : "";
    const isYaPhala = character === "য" && previousCharacter === "্";

    if (character === "ক" && conjunctCharacter === "ষ") {
      pronunciation += `${pronunciation ? "kkh" : "kh"}ô`;
      index += 2;
    } else if (character === "জ" && conjunctCharacter === "ঞ") {
      pronunciation += "ggô";
      index += 2;
    } else if (decomposedNuktaSound) {
      pronunciation += `${decomposedNuktaSound}ô`;
      index += 1;
    } else if (PRONUNCIATION_LETTERS[character]) {
      const isConsonant = Boolean(LETTER_NAMES[character]) && !/^[অআইঈউঊঋএঐওঔ]$/u.test(character);
      const sound = isYaPhala ? "y" : PRONUNCIATION_LETTERS[character];
      pronunciation += sound + (isConsonant ? "ô" : "");
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

function nextCharacterPronunciation(character) {
  if (character === "্") return "joins letters; no vowel";
  if (character === "়") return "modifies the preceding consonant";
  if (character === "।") return "sentence stop";
  if (character === "॥") return "double sentence stop";
  if (character === "ঁ") return "nasal sound";
  if (character === "ং") return "ng";
  if (character === "ঃ") return "h";
  if (DIGIT_NAMES[character]) return DIGIT_NAMES[character];
  if (character === " ") return "space";
  if (character === "\n") return "line break";
  const pronunciation = approximatePronunciation(character);
  return pronunciation === "—" ? describeCharacter(character).name : pronunciation;
}

function approximateTextPronunciation(text) {
  return text
    .split(/(\s+)/u)
    .map((part) => {
      if (/\s/u.test(part)) return part;
      const pronunciation = approximatePronunciation(part);
      return pronunciation === "—" ? "" : pronunciation;
    })
    .join("")
    .trim();
}

function wordAtCharacterIndex(text, characterIndex) {
  const characters = Array.from(text);
  if (!characters.length) return { word: "", start: 0 };
  let index = Math.min(characterIndex, characters.length - 1);
  if (/\s/u.test(characters[index]) && index > 0) index -= 1;
  let start = index;
  let end = index + 1;
  while (start > 0 && !/\s/u.test(characters[start - 1])) start -= 1;
  while (end < characters.length && !/\s/u.test(characters[end])) end += 1;
  return { word: characters.slice(start, end).join(""), start };
}

function keyboardKeyLabel(character) {
  return /\p{Mark}/u.test(character) ? `◌${character}` : character;
}

function characterSoundLabel(character) {
  if (PRONUNCIATION_LETTERS[character]) {
    return LETTER_NAMES[character]?.split(" — ")[1] || PRONUNCIATION_LETTERS[character];
  }
  if (MARK_NAMES[character]) return MARK_NAMES[character].split(" — ")[1];
  if (DIGIT_NAMES[character]) return DIGIT_NAMES[character];
  if (character === "।") return "stop";
  if (character === "॥") return "double stop";
  return describeCharacter(character).name;
}

function characterSoundEntries(word) {
  const characters = Array.from(word.normalize("NFC"));
  const entries = [];

  for (let index = 0; index < characters.length; index += 1) {
    const character = characters[index];
    const nextCharacter = characters[index + 1];
    const decomposedNuktaSound = nextCharacter === "়" ? DECOMPOSED_NUKTA_SOUNDS[character] : "";

    if (decomposedNuktaSound) {
      const vowelFollows = Boolean(PRONUNCIATION_MARKS[characters[index + 2]]);
      entries.push({
        character: `${character}${nextCharacter}`,
        sound: vowelFollows ? `${decomposedNuktaSound} · vowel follows` : `${decomposedNuktaSound}ô`,
      });
      index += 1;
    } else if (PRONUNCIATION_LETTERS[character] && nextCharacter === "্") {
      let clusterEnd = index;
      let hasJoiner = false;
      while (characters[clusterEnd + 1] === "্") {
        let joinedIndex = clusterEnd + 2;
        if (characters[joinedIndex] === "\u200D" || characters[joinedIndex] === "\u200C") {
          hasJoiner = true;
          joinedIndex += 1;
        }
        if (!PRONUNCIATION_LETTERS[characters[joinedIndex]]) break;
        clusterEnd = joinedIndex;
      }
      if (clusterEnd === index) {
        entries.push({ character, sound: `${PRONUNCIATION_LETTERS[character]} · hasanta removes ô` });
        continue;
      }
      const cluster = characters.slice(index, clusterEnd + 1).join("");
      const vowelFollows = Boolean(PRONUNCIATION_MARKS[characters[clusterEnd + 1]]);
      const clusterSound = approximatePronunciation(cluster).replace(vowelFollows ? /ô$/u : /$^/u, "");
      entries.push({
        character: cluster,
        sound: `${clusterSound} · conjunct${hasJoiner ? " · joiner-shaped" : ""}${vowelFollows ? " · vowel follows" : ""}`,
      });
      index = clusterEnd;
    } else if (PRONUNCIATION_LETTERS[character] && PRONUNCIATION_MARKS[nextCharacter]) {
      const baseSound = character === "ফ" ? "ph / f" : PRONUNCIATION_LETTERS[character];
      entries.push({ character, sound: `${baseSound} · vowel follows` });
    } else if (character === "ং") {
      entries.push({ character, sound: "ng · contextual nasal" });
    } else if (character === "ফ") {
      entries.push({ character, sound: "ph / f · word-dependent" });
    } else if (character === "ি") {
      entries.push({ character, sound: "i-kar · stored after, written before" });
    } else if (character === "\u200D") {
      entries.push({ character: "ZWJ", sound: "shapes a conjunct · silent" });
    } else if (character === "\u200C") {
      entries.push({ character: "ZWNJ", sound: "blocks a conjunct · silent" });
    } else {
      entries.push({ character, sound: characterSoundLabel(character) });
    }
  }

  return entries;
}

function splitWorksheetSentences(text) {
  return (text.match(/[^।॥.!?\n]+(?:[।॥.!?]+|$)/gu) || [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default function BengaliCharacterBreakdown({ isOpen }) {
  const dispatch = useAppDispatch();
  const { bengaliBreakdownText } = useAppState();
  const [activeTab, setActiveTab] = useState("breakdown");
  const [typedText, setTypedText] = useState("");
  const [worksheetText, setWorksheetText] = useState(bengaliBreakdownText || "বাংলা");
  const [worksheetRepeats, setWorksheetRepeats] = useState(8);
  const [worksheetLetterSize, setWorksheetLetterSize] = useState(48);
  const [sentenceRepeats, setSentenceRepeats] = useState({});
  const typingInputRef = useRef(null);
  const wasOpenRef = useRef(false);
  const previousPracticeTextRef = useRef(bengaliBreakdownText);
  const segments = useMemo(() => segmentText(bengaliBreakdownText), [bengaliBreakdownText]);
  const wordGroups = useMemo(() => groupSegmentsIntoWords(segments), [segments]);
  const targetCharacters = useMemo(() => Array.from(bengaliBreakdownText), [bengaliBreakdownText]);
  const typedCharacters = useMemo(() => Array.from(typedText), [typedText]);
  const correctCount = typedCharacters.findIndex((character, index) => character !== targetCharacters[index]);
  const matchedCount = correctCount === -1 ? typedCharacters.length : correctCount;
  const hasMistake = correctCount !== -1;
  const nextCharacter = targetCharacters[matchedCount];
  const currentWordDetails = wordAtCharacterIndex(bengaliBreakdownText, matchedCount);
  const currentWord = currentWordDetails.word;
  const currentWordSegments = segmentText(currentWord);
  const practiceComplete = Boolean(targetCharacters.length && matchedCount === targetCharacters.length && !hasMistake);
  const bengaliCount = segments.filter(({ characters }) =>
    characters.some(({ character }) => bengaliPattern.test(character))
  ).length;
  const worksheetLength = segmentText(worksheetText).length;
  const worksheetSentences = useMemo(() => splitWorksheetSentences(worksheetText), [worksheetText]);
  const hasMultipleWorksheetSentences = worksheetSentences.length > 1;
  const worksheetLayout = hasMultipleWorksheetSentences || worksheetLength > 12
    ? "is-sentence"
    : worksheetLength <= 2 ? "is-character" : "is-word";
  const worksheetEntries = hasMultipleWorksheetSentences
    ? worksheetSentences.flatMap((sentence, sentenceIndex) =>
      Array.from(
        { length: sentenceRepeats[sentenceIndex] ?? worksheetRepeats },
        () => ({ sentence, sentenceIndex })
      )
    )
    : Array.from({ length: worksheetRepeats }, () => ({ sentence: worksheetText, sentenceIndex: 0 }));

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      setTypedText("");
      setWorksheetText(bengaliBreakdownText);
      setSentenceRepeats({});
    }
    wasOpenRef.current = isOpen;
  }, [bengaliBreakdownText, isOpen]);

  useEffect(() => {
    if (previousPracticeTextRef.current !== bengaliBreakdownText) {
      setTypedText("");
      previousPracticeTextRef.current = bengaliBreakdownText;
    }
  }, [bengaliBreakdownText]);

  const editTypedText = (replacement, removePrevious = false) => {
    const input = typingInputRef.current;
    const start = input?.selectionStart ?? typedText.length;
    const end = input?.selectionEnd ?? typedText.length;
    let editStart = start;

    if (removePrevious && start === end && start > 0) {
      const beforeCursor = typedText.slice(0, start);
      const previousSegments = segmentText(beforeCursor);
      editStart = start - (previousSegments.at(-1)?.grapheme.length || 1);
    }

    const nextText = typedText.slice(0, editStart) + replacement + typedText.slice(end);
    const nextCursor = editStart + replacement.length;
    setTypedText(nextText);
    window.requestAnimationFrame(() => {
      input?.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const printWorksheet = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }

    const columns = worksheetLayout === "is-sentence" ? 1 : 2;
    const traceRows = worksheetEntries
      .map(({ sentence }) => `<div class="trace" lang="bn">${escapeHtml(sentence)}</div>`)
      .join("");

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Bengali Trace Worksheet</title>
          <style>
            @page { size: letter portrait; margin: 0.45in; }
            * { box-sizing: border-box; }
            html, body { margin: 0; padding: 0; background: #fff; }
            .sheet {
              display: grid;
              grid-template-columns: repeat(${columns}, minmax(0, 1fr));
              gap: 16px;
              font-family: "Noto Sans Bengali", "Nirmala UI", "Vrinda", sans-serif;
            }
            .trace {
              min-width: 0;
              min-height: ${Math.round(worksheetLetterSize * 1.55)}px;
              display: flex;
              align-items: center;
              overflow-wrap: anywhere;
              break-inside: avoid;
              border-bottom: 2px solid #d7dde5;
              color: #e3e7ec;
              background-image: linear-gradient(to bottom, transparent 49%, #edf0f4 50%, transparent 51%);
              font-size: ${worksheetLetterSize}px;
              font-weight: 400;
              line-height: 1.25;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            @media (max-width: 600px) {
              .sheet { grid-template-columns: 1fr; }
            }
          </style>
        </head>
        <body>
          <main class="sheet">${traceRows}</main>
        </body>
      </html>`);
    printWindow.document.close();
    const openPrintDialog = () => {
      printWindow.focus();
      printWindow.print();
    };
    if (printWindow.document.readyState === "complete") {
      window.setTimeout(openPrintDialog, 100);
    } else {
      printWindow.addEventListener("load", openPrintDialog, { once: true });
    }
  };

  return (
    <div className="bengali-breakdown">
      <div className="bengali-breakdown__tabs" role="tablist" aria-label="Bengali tools">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "breakdown"}
          className={activeTab === "breakdown" ? "is-active" : ""}
          onClick={() => setActiveTab("breakdown")}
        >
          Character breakdown
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "typing"}
          className={activeTab === "typing" ? "is-active" : ""}
          onClick={() => setActiveTab("typing")}
        >
          Typing practice
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "worksheet"}
          className={activeTab === "worksheet" ? "is-active" : ""}
          onClick={() => setActiveTab("worksheet")}
        >
          Trace &amp; write
        </button>
      </div>

      {activeTab !== "worksheet" ? <section className="bengali-breakdown__intro">
        <p>{activeTab === "breakdown"
          ? "Paste a Bengali word, sentence, paragraph, or mixed text. Each written character is separated, including the Unicode parts inside conjuncts and vowel signs."
          : "Enter the Bengali text you want to practice, then type it below. The guide will show the next character."}</p>
        <label className="ui-field">
          <span className="ui-field__label">{activeTab === "breakdown" ? "Bengali text" : "Practice text"}</span>
          <textarea
            className="ui-input bengali-breakdown__input"
            lang="bn"
            value={bengaliBreakdownText}
            onChange={(event) => dispatch(actions.setBengaliBreakdownText(event.target.value))}
            placeholder="উদাহরণ: আমি বাংলা শিখছি।"
            autoFocus={activeTab === "breakdown"}
          />
        </label>
        {activeTab === "breakdown" ? (
          <div className="bengali-breakdown__toolbar">
            <span role="status">{segments.length} written characters · {bengaliCount} Bengali</span>
            <Button variant="ghost" onClick={() => dispatch(actions.setBengaliBreakdownText(""))} disabled={!bengaliBreakdownText}>
              <FaEraser aria-hidden="true" /> Clear
            </Button>
          </div>
        ) : null}
      </section> : null}

      {activeTab === "worksheet" ? (
        <section className="bengali-worksheet-builder" aria-label="Bengali trace and write worksheet builder">
          <div className="bengali-worksheet-controls">
            <div>
              <h3>Create a Bengali practice sheet</h3>
              <p>Use one character, a word, or a complete sentence. The layout adjusts automatically.</p>
            </div>
            <label className="ui-field bengali-worksheet-controls__text">
              <span className="ui-field__label">Text to trace and write</span>
              <textarea
                className="ui-input"
                lang="bn"
                value={worksheetText}
                onChange={(event) => {
                  setWorksheetText(event.target.value);
                  setSentenceRepeats({});
                }}
                placeholder="ক, বাংলা, or আমি বাংলা শিখছি।"
              />
            </label>
            <div className="bengali-worksheet-controls__grid">
              <label className="ui-field">
                <span className="ui-field__label">Number of repetitions</span>
                <input
                  className="ui-input"
                  type="number"
                  min="1"
                  max="40"
                  value={worksheetRepeats}
                  onChange={(event) => setWorksheetRepeats(Math.min(40, Math.max(1, Number(event.target.value) || 1)))}
                />
              </label>
              <label className="ui-field">
                <span className="ui-field__label">Letter size: {worksheetLetterSize}px</span>
                <input
                  className="bengali-worksheet-controls__range"
                  type="range"
                  min="24"
                  max="96"
                  step="4"
                  value={worksheetLetterSize}
                  onChange={(event) => setWorksheetLetterSize(Number(event.target.value))}
                />
              </label>
            </div>
            {hasMultipleWorksheetSentences ? (
              <fieldset className="bengali-worksheet-sentences">
                <legend>Repetitions for each sentence</legend>
                {worksheetSentences.map((sentence, index) => (
                  <label key={`${sentence}-${index}`}>
                    <span lang="bn">{sentence}</span>
                    <input
                      className="ui-input"
                      type="number"
                      min="1"
                      max="40"
                      aria-label={`Repetitions for sentence ${index + 1}`}
                      value={sentenceRepeats[index] ?? worksheetRepeats}
                      onChange={(event) => {
                        const repeats = Math.min(40, Math.max(1, Number(event.target.value) || 1));
                        setSentenceRepeats((current) => ({ ...current, [index]: repeats }));
                      }}
                    />
                  </label>
                ))}
              </fieldset>
            ) : null}
            <Button variant="primary" onClick={printWorksheet} disabled={!worksheetText.trim()}>
              <FaPrint aria-hidden="true" /> Print or save as PDF
            </Button>
          </div>

          <div
            className={`bengali-worksheet ${worksheetLayout}`}
            style={{ "--worksheet-letter-size": `${worksheetLetterSize}px` }}
          >
            {worksheetText.trim() ? (
              <div className="bengali-worksheet__practice">
                {worksheetEntries.map(({ sentence, sentenceIndex }, index) => (
                  <div className="bengali-worksheet__entry" key={`${sentenceIndex}-${index}`}>
                    <div className="bengali-worksheet__trace" lang="bn">{sentence}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bengali-worksheet__empty">Enter Bengali text to create your sheet.</div>
            )}
          </div>
        </section>
      ) : activeTab === "typing" ? (
        <section className="bengali-typing" aria-label="Bengali typing practice">
          {segments.length ? (
            <>
              <div className={`bengali-typing__prompt${hasMistake ? " is-error" : ""}${practiceComplete ? " is-complete" : ""}`} role="status" aria-live="polite">
                {practiceComplete ? (
                  <>
                    <span className="bengali-typing__prompt-label">Complete</span>
                    <strong>দারুণ! Great work.</strong>
                  </>
                ) : (
                  <>
                    <span className="bengali-typing__prompt-label">{hasMistake ? "Try this character" : "Type next"}</span>
                    <div className="bengali-typing__current-word">
                      <small>Current word</small>
                      <b lang="bn">
                        {currentWordSegments.map(({ grapheme, offset }) => {
                          const segmentEnd = currentWordDetails.start
                            + Array.from(currentWord.slice(0, offset)).length
                            + Array.from(grapheme).length;
                          return (
                            <span
                              className={segmentEnd <= matchedCount ? "is-filled" : ""}
                              key={`${grapheme}-${offset}`}
                            >
                              {grapheme}
                            </span>
                          );
                        })}
                      </b>
                      <span className="bengali-typing__current-pronunciation">{approximatePronunciation(currentWord)}</span>
                    </div>
                    <div className="bengali-typing__next">
                      <strong lang="bn">{nextCharacter && /\p{Mark}/u.test(nextCharacter) ? `◌${nextCharacter}` : nextCharacter || "—"}</strong>
                      {nextCharacter ? (
                        <span>
                          {nextCharacterPronunciation(nextCharacter)}
                        </span>
                      ) : null}
                    </div>
                    {hasMistake ? <small>Your last character did not match. Delete it and try again.</small> : null}
                  </>
                )}
              </div>

              <div className="bengali-typing__target" lang="bn" aria-label="Practice text">
                {segments.map(({ grapheme, offset }) => (
                  <span
                    className={(() => {
                      const segmentStart = Array.from(bengaliBreakdownText.slice(0, offset)).length;
                      const segmentEnd = segmentStart + Array.from(grapheme).length;
                      if (segmentEnd <= matchedCount) return "is-correct";
                      if (segmentStart <= matchedCount && matchedCount < segmentEnd) return "is-next";
                      return "";
                    })()}
                    key={`${offset}-${grapheme}`}
                  >
                    {grapheme === " " ? "\u00A0" : grapheme}
                  </span>
                ))}
              </div>
              <p className="bengali-typing__target-pronunciation">
                <span>Possible pronunciation</span>
                <strong>{approximateTextPronunciation(bengaliBreakdownText)}</strong>
              </p>

              <label className="ui-field">
                <span className="ui-field__label">Type here with your Bengali keyboard</span>
                <textarea
                  ref={typingInputRef}
                  className={`ui-input bengali-typing__input${hasMistake ? " is-error" : ""}`}
                  lang="bn"
                  inputMode="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  autoFocus
                  value={typedText}
                  onChange={(event) => setTypedText(event.target.value)}
                  placeholder="এখানে টাইপ করুন…"
                />
                <span className="ui-field__hint">On mobile, use your keyboard’s globe or language key to switch to Bengali.</span>
              </label>
              <section className="bengali-keyboard" aria-label="On-screen Bengali keyboard">
                <div className="bengali-keyboard__heading">
                  <div>
                    <strong>On-screen Bengali keyboard</strong>
                    <span>Tap letters if your device does not have a Bengali keyboard.</span>
                  </div>
                </div>
                <div className="bengali-keyboard__rows">
                  <div className="bengali-keyboard__row bengali-keyboard__controls">
                    <button
                      type="button"
                      onClick={() => editTypedText(" ")}
                      className={nextCharacter === " " ? "is-suggested" : ""}
                      aria-label="Type a space"
                    >
                      Space
                    </button>
                    <button type="button" onClick={() => editTypedText("", true)} aria-label="Delete previous character">⌫ Backspace</button>
                  </div>
                  {BENGALI_KEYBOARD_ROWS.map((row, rowIndex) => (
                    <div className="bengali-keyboard__row" key={rowIndex}>
                      {row.map((character) => (
                        <button
                          type="button"
                          lang="bn"
                          onClick={() => editTypedText(character)}
                          className={character === nextCharacter ? "is-suggested" : ""}
                          aria-label={`Type ${LETTER_NAMES[character] || MARK_NAMES[character] || character}`}
                          key={character}
                        >
                          {keyboardKeyLabel(character)}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </section>
              <div className="bengali-breakdown__toolbar">
                <span>{matchedCount} of {targetCharacters.length} characters correct</span>
                <Button variant="ghost" onClick={() => setTypedText("")} disabled={!typedText}>
                  <FaEraser aria-hidden="true" /> Start over
                </Button>
              </div>
            </>
          ) : (
            <div className="bengali-breakdown__empty">
              <span lang="bn" aria-hidden="true">ক খ গ</span>
              <p>Add some Bengali practice text above to begin.</p>
            </div>
          )}
        </section>
      ) : segments.length ? (
        <ol className="bengali-breakdown__list" aria-label="Character breakdown">
          {wordGroups.map((wordSegments, wordIndex) => {
            const completedWord = wordSegments.map(({ grapheme }) => grapheme).join("");
            const soundEntries = characterSoundEntries(completedWord);
            return (
                <li className="bengali-breakdown__item is-completed-word" key={`word-${wordIndex}-${wordSegments[0].offset}`}>
                  <div className="bengali-breakdown__completed-glyph">
                    <strong lang="bn">{completedWord}</strong>
                    <div className="bengali-breakdown__character-sounds" aria-label={`${completedWord} characters and sounds`}>
                      {soundEntries.map(({ character, sound }, characterIndex) => (
                        <span className="bengali-breakdown__character-sound" key={`${character}-${characterIndex}`}>
                          <b lang="bn">{character}</b>
                          <small>{sound}</small>
                        </span>
                      ))}
                    </div>
                    <span className="bengali-breakdown__combined-pronunciation">
                      ({approximatePronunciation(completedWord)})
                    </span>
                  </div>
                </li>
            );
          })}
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

BengaliCharacterBreakdown.propTypes = {
  isOpen: PropTypes.bool.isRequired,
};
