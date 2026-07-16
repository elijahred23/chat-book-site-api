# Page guidance

## Bengali Tutor scope

The instructions in this section apply only to `BengaliTutor*.jsx`, `BengaliTutor*.css`, and Bengali Tutor utilities or data changed as part of the same task. Do not apply Bengali-specific content rules to unrelated pages in this directory.

## Lesson sources

- Bengali Tutor lessons are repository-owned JSON files in `../bengali_lessons/`. Treat those files as the authoritative lesson content.
- Register new lessons in the `SAVED_LESSONS` imports and list in `BengaliTutor.jsx` so they appear in the saved-lesson selector.
- Do not reintroduce generated lessons, Gemini lesson generation, JSON uploads, or JSON downloads. The Tutor and Word Loop must use saved repository lessons only.
- Use a stable lowercase, hyphenated `id`. Give each lesson a clear `title`, `summary`, `level`, `topic`, and `focus`.
- Do not modify a user's external source file when importing a lesson. Normalize and save a copy under `../bengali_lessons/`.

## Lesson schema and content

- Preserve the established top-level shape: `id`, `title`, `summary`, `level`, `topic`, `focus`, `phrases`, `vocab`, `practice`, and `notes`.
- Every vocabulary item must include non-empty `bn`, `pronunciation`, and `en` values. Include `category` and a `sourcePhrase` containing or demonstrating that vocabulary item.
- Every phrase must include non-empty `bn`, `pronunciation`, `en`, and `context` values. Include `category` and an ordered `words` array when materializing breakdown data in JSON.
- Each phrase breakdown word uses `{ "bn": "...", "pronunciation": "...", "en": "..." }`. Keep entries in Bengali spoken order and provide a meaningful English gloss for every entry.
- Whenever adding a Bengali lesson JSON file or adding words or phrases to an existing lesson, add every new Bengali token and inflected form to `../data/bengali-glosses.json`. Include common context-dependent meanings separated by slashes so phrase breakdowns never display the `part of “…”` fallback.
- Keep natural English sentence translations in `phrase.en`. Build literal breakdown English by joining the ordered word glosses; do not rewrite the natural translation into Bengali word order.
- Retain intentional repeated headwords only when they teach distinct meanings or usages. Remove accidental duplicate phrases when a named collection promises a fixed unique count.
- Prefer accurate, natural Bengali and consistent Latin-script pronunciation over mechanically padded content. Do not claim a count that the saved JSON does not contain.

## Tutor and Word Loop behavior

- Always display pronunciation alongside Bengali because users may not read Bengali script.
- The Tutor phrase view should show the complete ordered breakdown together, not one hidden word at a time.
- Word Loop's Phrase Breakdown dataset treats one complete phrase as one playback item. Speak the full Bengali phrase in one utterance.
- In bilingual Phrase Breakdown playback, speak literal English glosses in Bengali word order. Continue showing the natural English translation separately for comparison.
- Preserve the reading modes: Bengali only, Bengali then English, and English then Bengali.
- Keep breakdown cards responsive. On narrow mobile screens, avoid horizontal scrolling, allow pronunciation and definitions to wrap, and use compact touch-friendly controls.

## Validation

- Validate changed lesson JSON with `jq` and verify promised vocabulary and phrase counts from the saved files.
- Confirm every required string is non-empty and every saved breakdown has at least one word.
- Audit all changed phrases against `../data/bengali-glosses.json` and confirm that every token resolves to a real gloss with zero `part of “…”` fallbacks.
- Run targeted ESLint on changed Bengali Tutor JavaScript/JSX files.
- Run `npm run build` from `frontend/` after lesson imports, Tutor UI changes, or Word Loop changes.
- The repository-wide lint command has existing unrelated failures. Report those separately rather than attributing them to Bengali Tutor changes.
