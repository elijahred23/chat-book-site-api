# Frontend guidance

## Architecture

- This directory is a React 18 client written in JavaScript/JSX. `main.jsx` installs the application providers, and `App.jsx` owns routes, tool launchers, and drawer composition.
- Cross-tool state lives in `context/AppContext.jsx`. When adding a drawer, update its initial state, action type and creator, reducer case, `drawerKeyToState`, `closeAllPanels`, and the corresponding launcher/rendering in `App.jsx` together.
- Reusable primitives belong in `ui/`. Use them before adding feature-local versions of buttons, cards, drawers, fields, progress indicators, or page shells.
- Network helpers belong in `utils/`. API routes are rooted at `/api`; use the existing hostname helper when matching current callers, or a relative `/api/...` URL when the feature must work through Vite and the production Express origin.

## UI and state conventions

- Use function components and hooks. Keep transient, feature-local state in the component; put state in `AppContext` only when another tool or global shell must read or change it.
- Preserve the drawer stack behavior: opening a drawer makes it active, closing it restores the previous drawer, and only one drawer state flag should be active.
- Global design tokens and base rules live in `styles/foundation.css`; shared component and shell rules live in `styles/components.css` and `styles/shell.css`. Keep feature-specific styles beside their feature in the existing `Component.css` pattern.
- Provide accessible labels for icon-only controls, keep native button semantics, and preserve keyboard/focus behavior when changing drawers or menus.
- Treat `code_problems/*.json` and `system_design/*.json` as authored content. Match the neighboring file schema and avoid bulk normalization unless explicitly requested.

## Validation

- Run `npm run lint` after JSX or hook changes and resolve new warnings in touched code.
- Run `npm run build` after changes to routes, imports, context, shared UI, or data loading.
- Manually verify the affected route plus drawer open/close/back-stack behavior when changing `App.jsx`, `AppContext.jsx`, or `SideDrawer.jsx`.

