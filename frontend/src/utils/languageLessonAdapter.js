export const normalizeLanguageItems = (items = [], scriptKey) => items.map((item) => ({
  ...item,
  script: item.script ?? item[scriptKey] ?? "",
  words: item.words?.map((word) => ({ ...word, script: word.script ?? word[scriptKey] ?? "" })) || [],
}));

export const normalizeLanguageLesson = (lesson, scriptKey) => ({
  ...lesson,
  phrases: normalizeLanguageItems(lesson?.phrases, scriptKey),
  vocab: normalizeLanguageItems(lesson?.vocab, scriptKey),
});
