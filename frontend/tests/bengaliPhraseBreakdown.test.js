import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { buildPhraseWordsWithGlosses, romanizeBengaliWord } from "../src/utils/bengaliPhraseBreakdownCore.js";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lessonsDirectory = path.join(frontendRoot, "src/bengali_lessons");
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

test("all non-class saved lesson phrases have complete breakdown glosses", async () => {
  const lessons = await readJsonLessons();
  let phraseCount = 0;

  lessons.forEach(({ source, lesson }) => {
    if (/^class-(?:[1-9]|1[0-2])$/.test(lesson.id)) return;

    (lesson.phrases || []).forEach((phrase) => {
      phraseCount += 1;
      assertCompleteBreakdown(phrase, source);
    });
  });

  assert.ok(phraseCount > 0, "expected saved lesson phrases to be audited");
});

test("all twelve Bengali class lessons are saved as JSON", async () => {
  const lessons = await readJsonLessons();
  const classLessons = lessons
    .filter(({ lesson }) => /^class-(?:[1-9]|1[0-2])$/.test(lesson.id))
    .sort((a, b) => Number(a.lesson.id.slice(6)) - Number(b.lesson.id.slice(6)));
  const expectedVocabCounts = [421, 582, 530, 503, 542, 503, 452, 428, 537, 607, 737, 814];
  const expectedPhraseCounts = [200, 205, 212, 196, 185, 191, 98, 89, 58, 87, 82, 85];

  assert.deepEqual(classLessons.map(({ lesson }) => lesson.id), Array.from({ length: 12 }, (_, index) => `class-${index + 1}`));
  classLessons.forEach(({ source, lesson }, index) => {
    assert.equal(source, `${lesson.id}.json`);
    assert.equal(lesson.vocab.length, expectedVocabCounts[index], `${source}: unexpected vocabulary count`);
    assert.equal(lesson.phrases.length, expectedPhraseCounts[index], `${source}: unexpected phrase count`);
    assert.equal(lesson.practice.length, 3, `${source}: unexpected practice count`);
    assert.equal(lesson.notes.length, 3, `${source}: unexpected notes count`);
    [...lesson.vocab, ...lesson.phrases].forEach((item) => {
      assert.ok(String(item.pronunciation || "").trim(), `${source}: missing pronunciation for “${item.bn}”`);
      assert.doesNotMatch(item.pronunciation, /\p{Script=Bengali}/u, `${source}: Bengali script found in pronunciation for “${item.bn}”`);
    });
  });
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
