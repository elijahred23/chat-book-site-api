import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { buildPhraseWordsWithGlosses, romanizeBengaliWord } from "../src/utils/bengaliPhraseBreakdownCore.js";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lessonsDirectory = path.join(frontendRoot, "src/bengali_lessons");
const classLessonsPath = path.join(frontendRoot, "src/data/bengaliClassLessons.js");
const glossesPath = path.join(frontendRoot, "src/data/bengali-glosses.json");
const invalidGlossPattern = /part of [“"]|meaning unavailable/i;
const glosses = JSON.parse(await readFile(glossesPath, "utf8"));

const readJsonLessons = async () => {
  const filenames = (await readdir(lessonsDirectory)).filter((filename) => filename.endsWith(".json"));
  return Promise.all(filenames.map(async (filename) => ({
    source: filename,
    lesson: JSON.parse(await readFile(path.join(lessonsDirectory, filename), "utf8")),
  })));
};

const readClassPhrases = async () => {
  const source = (await readFile(classLessonsPath, "utf8")).split("const LEVEL_NAMES")[0];
  return source.split("\n").flatMap((line) => {
    const candidate = line.trim().replace(/,$/, "");
    if (!candidate.startsWith('["')) return [];

    try {
      const [bn, pronunciation, en, ...extra] = JSON.parse(candidate);
      return extra.length || !bn || !pronunciation || !en ? [] : [{ bn, pronunciation, en }];
    } catch {
      return [];
    }
  });
};

const assertCompleteBreakdown = (phrase, source) => {
  const words = buildPhraseWordsWithGlosses(phrase, glosses);
  assert.ok(words.length > 0, `${source}: no breakdown words for “${phrase.bn}”`);

  words.forEach((word) => {
    assert.ok(String(word.bn || "").trim(), `${source}: missing Bengali word in “${phrase.bn}”`);
    assert.ok(String(word.pronunciation || "").trim(), `${source}: missing pronunciation for “${word.bn}” in “${phrase.bn}”`);
    assert.ok(String(word.en || "").trim(), `${source}: missing English gloss for “${word.bn}” in “${phrase.bn}”`);
    assert.doesNotMatch(String(word.en), invalidGlossPattern, `${source}: unresolved gloss for “${word.bn}” in “${phrase.bn}”`);
  });
};

test("all saved lesson phrases have complete breakdown glosses", async () => {
  const lessons = await readJsonLessons();
  let phraseCount = 0;

  lessons.forEach(({ source, lesson }) => {
    (lesson.phrases || []).forEach((phrase) => {
      phraseCount += 1;
      assertCompleteBreakdown(phrase, source);
    });
  });

  assert.ok(phraseCount > 0, "expected saved lesson phrases to be audited");
});

test("all generated Bengali class phrases resolve through the shared glossary", async () => {
  const phrases = await readClassPhrases();
  assert.equal(phrases.length, 96, "expected all 12 classes with 8 core phrases each");
  phrases.forEach((phrase) => assertCompleteBreakdown(phrase, "bengaliClassLessons.js"));
});

test("known regression words have learner-friendly meanings", () => {
  const phrase = {
    bn: "আমরা গ্রন্থাগারে বই পড়ি। চাবি দিয়ে দরজা খোলো।",
    pronunciation: "amra gronthagare boi poṛi chabi diye dorja kholo",
    en: "We read books in the library. Open the door with the key.",
  };
  const phraseGlosses = Object.fromEntries(buildPhraseWordsWithGlosses(phrase, glosses).map((word) => [word.bn, word.en]));

  assert.equal(phraseGlosses["গ্রন্থাগারে"], "in the library");
  assert.equal(phraseGlosses["খোলো"], "open");
});

test("missing pronunciations fall back to Latin-script Bengali sounds", () => {
  assert.equal(romanizeBengaliWord("আমি"), "ami");
  assert.equal(romanizeBengaliWord("আমার"), "amar");
  assert.equal(romanizeBengaliWord("বন্ধ করা"), "bondho kora");

  const words = buildPhraseWordsWithGlosses({ bn: "আমি ভালো আছি।" }, glosses);
  assert.deepEqual(words.map((word) => word.pronunciation), ["ami", "bhalo", "achhi"]);
  words.forEach((word) => assert.doesNotMatch(word.pronunciation, /\p{Script=Bengali}/u));
});
