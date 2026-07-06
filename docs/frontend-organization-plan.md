# Frontend Reorganization Plan

## Proposed Structure

src/
  components/
    chat/
    flashcards/
    media/
    tts/
    markdown/
    youtube/
    cpu/
    common/
  pages/
  context/
  hooks/
  services/
  utils/
  layouts/
  ui/
  styles/
  assets/

## Goals

- Group related components together.
- Reduce the size of App.jsx.
- Keep feature-specific CSS next to components.
- Move shared utilities into dedicated folders.
- Prepare the app for additional features without turning src into a junk drawer.
