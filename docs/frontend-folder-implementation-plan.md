# Frontend Folder Implementation Plan

This plan explains how to move the React/Vite frontend into its own `frontend/` folder while keeping the Express API in `api/` and preserving the existing full-stack deployment flow.

The goal is to make the repository easier to navigate:

```text
chat-book-site-api/
├── api/          # Express backend
├── frontend/     # React/Vite frontend
├── shared/       # Code used by both sides, if still needed
├── var/          # Runtime uploads/secrets, ignored from git
├── package.json  # Optional root orchestration scripts
└── README.md
```

This should be done as a migration, not a giant rip-and-replace. Move the frontend files first, then adjust scripts, build output, backend static hosting, and docs.

## Current Frontend Shape

The frontend currently lives at the repository root.

```text
.
├── index.html
├── vite.config.js
├── package.json
├── src/
├── public/
└── dist/
```

The root `package.json` currently runs Vite directly:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "start": "node api/src/server.js",
    "preview": "vite preview"
  }
}
```

The backend currently serves the built frontend from the root-level `dist/` directory through `api/src/config/paths.js`.

```js
export const distDir = path.join(projectRoot, 'dist');
```

After the move, the frontend build output should live under `frontend/dist/`, and the backend should serve that folder in production.

## Target Frontend Shape

```text
frontend/
├── index.html
├── package.json
├── vite.config.js
├── eslint.config.js or .eslintrc.*
├── public/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   ├── utils/
│   └── styles/
└── dist/
```

The backend should remain here:

```text
api/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── utils/
├── package.json
└── logs/
```

## Recommended Final Repository Shape

```text
.
├── api/
│   ├── src/
│   ├── package.json
│   └── logs/
├── frontend/
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── dist/
├── shared/
│   └── cpuSimulator.js
├── docs/
│   ├── backend-reorganization.md
│   └── frontend-folder-implementation-plan.md
├── var/
├── package.json
└── README.md
```

## Migration Strategy

Use two layers of scripts:

1. `frontend/package.json` owns frontend commands.
2. Root `package.json` optionally delegates to `frontend/` and `api/` so common commands still work from the repo root.

This keeps local development friendly while making the project structure clear.

## Phase 1: Create the `frontend/` Folder

Create the new folder:

```bash
mkdir frontend
```

Move frontend-only files into it:

```bash
git mv index.html frontend/index.html
git mv vite.config.js frontend/vite.config.js
git mv src frontend/src
```

If these folders or files exist, move them too:

```bash
git mv public frontend/public
git mv eslint.config.js frontend/eslint.config.js
git mv .eslintrc.cjs frontend/.eslintrc.cjs
git mv .eslintrc.js frontend/.eslintrc.js
git mv postcss.config.js frontend/postcss.config.js
git mv tailwind.config.js frontend/tailwind.config.js
```

Do not move `api/`, `shared/`, `docs/`, or `var/` into `frontend/`.

## Phase 2: Split Frontend Dependencies

Create `frontend/package.json` for the React/Vite app.

A good starting version:

```json
{
  "name": "chat-book-site-frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "@panzoom/panzoom": "^4.6.0",
    "@tanstack/react-query": "^5.49.2",
    "pako": "^2.1.0",
    "prismjs": "^1.30.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-icons": "^5.5.0",
    "react-markdown": "^9.0.1",
    "react-router-dom": "^6.22.0",
    "react-simple-code-editor": "^0.14.1",
    "react-spinners": "^0.13.8",
    "uuid": "^11.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@vitejs/plugin-react": "^4.2.1",
    "eslint": "^8.56.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "vite": "^5.1.0"
  }
}
```

Then remove frontend-only dependencies from the root `package.json` if the root will only orchestrate commands.

Backend-only packages should stay in `api/package.json`.

Frontend-only packages should live in `frontend/package.json`.

## Phase 3: Update Root Scripts

Keep root scripts as shortcuts so you can still work from the repository root.

Recommended root `package.json`:

```json
{
  "name": "chat-book-site-api",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "npm --prefix frontend run dev",
    "dev:frontend": "npm --prefix frontend run dev",
    "dev:api": "npm --prefix api run debug",
    "build": "npm --prefix frontend run build",
    "lint": "npm --prefix frontend run lint",
    "start": "node api/src/server.js",
    "preview": "npm --prefix frontend run preview",
    "install:all": "npm install && npm --prefix frontend install && npm --prefix api install"
  }
}
```

If you want one command to run both frontend and backend during development, add a tool such as `concurrently` later. Keep the first migration simple.

## Phase 4: Update Vite Config

Move the existing Vite config into `frontend/vite.config.js`.

The dev server can keep the same port and proxy:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => {
  return {
    plugins: [react()],
    resolve: { dedupe: ['react', 'react-dom'] },
    optimizeDeps: { include: ['react', 'react-dom'] },
    ...(command === 'serve' && {
      server: {
        watch: { usePolling: true },
        host: 'localhost',
        strictPort: true,
        port: 3006,
        proxy: {
          '/api': {
            target: 'http://localhost:8080',
            changeOrigin: true
          }
        },
        allowedHosts: ['localhost']
      }
    })
  };
});
```

Vite will now output production files to:

```text
frontend/dist/
```

because the config is running from inside `frontend/`.

## Phase 5: Update Backend Static File Path

Update `api/src/config/paths.js` so the backend serves `frontend/dist` instead of root `dist`.

Current idea:

```js
export const distDir = path.join(projectRoot, 'dist');
```

Change to:

```js
export const frontendRoot = path.join(projectRoot, 'frontend');
export const distDir = path.join(frontendRoot, 'dist');
```

Keep `projectRoot`, `uploadsDir`, `secretsDir`, and backend log paths unchanged unless there is a separate reason to move them.

## Phase 6: Check Frontend Imports

Most frontend imports should keep working because the internal `src/` layout moves together.

Before:

```text
src/components/Button.jsx
src/pages/Home.jsx
```

After:

```text
frontend/src/components/Button.jsx
frontend/src/pages/Home.jsx
```

Relative imports inside `src/` usually do not need changes.

Imports that reach outside `src/` need review.

Search for references to root-level paths:

```bash
grep -R "../shared\|../../shared\|/src/\|dist\|public" frontend/src frontend/index.html frontend/vite.config.js
```

If frontend code imports from `shared/`, either:

1. Keep `shared/` at the root and update the relative import path.
2. Move browser-safe shared code into `frontend/src/shared/`.
3. Create a package/workspace later if sharing becomes more formal.

For the CPU simulator, be careful. If both frontend and backend need the simulator, root-level `shared/` may still be the cleanest place.

## Phase 7: Update Build and Deployment Flow

The production flow becomes:

```bash
npm --prefix frontend install
npm --prefix frontend run build
npm --prefix api install
npm start
```

Or, using root shortcuts:

```bash
npm run install:all
npm run build
npm start
```

The Express server still serves:

1. API routes from `/api/...`
2. Static frontend files from `frontend/dist`
3. `index.html` fallback for React Router routes

No frontend URL should change because of the folder move.

## Phase 8: Update `.gitignore`

Make sure generated frontend output is ignored in its new location.

Recommended entries:

```gitignore
node_modules/
frontend/node_modules/
api/node_modules/

dist/
frontend/dist/

.env
api/.env
frontend/.env

var/uploads/
var/secrets/
api/logs/
api/error.log
```

If `dist/` is currently committed, decide whether the repo should keep generated builds. Usually, `frontend/dist/` should not be committed unless the hosting platform requires it.

## Phase 9: Update README

Update the README project structure section from root-level frontend files to `frontend/`.

Document these commands:

```bash
npm run dev          # frontend dev server
npm run dev:api      # backend dev server
npm run build        # frontend production build
npm start            # backend serving API and built frontend
```

Also update any wording that says Vite runs from the root.

## Phase 10: Verify Locally

Run these checks after the move:

```bash
npm run install:all
npm run dev
npm run dev:api
npm run build
npm start
```

Manual checks:

- `http://localhost:3006` opens the Vite frontend
- Frontend calls to `/api/...` proxy to `http://localhost:8080`
- `http://localhost:8080/api/check` works
- `http://localhost:8080` serves the built frontend after `npm run build`
- React Router routes still fall back to `index.html`
- Static assets load correctly
- PDF upload route still works
- CPU simulator route still works
- Logs page still works at `/logs`

## Suggested Commit Order

Small commits make this migration easier to review.

### Commit 1: Create frontend folder

```text
refactor: move frontend files into frontend folder
```

Move:

- `src/`
- `index.html`
- `vite.config.js`
- `public/`, if present
- frontend lint/config files, if present

### Commit 2: Add frontend package scripts

```text
chore: add frontend package scripts
```

Add `frontend/package.json` and adjust root scripts.

### Commit 3: Update backend static path

```text
fix: serve frontend build from frontend dist
```

Update `api/src/config/paths.js` to point at `frontend/dist`.

### Commit 4: Update docs and ignore rules

```text
docs: update project structure for frontend folder
```

Update README and `.gitignore`.

## Risk Areas

### Build Output Path

The biggest break risk is the backend serving the wrong `dist` folder.

After this migration, production static files should come from:

```text
frontend/dist
```

not:

```text
dist
```

### Install Location

Running `npm install` only at the root will not install frontend dependencies if dependencies are moved into `frontend/package.json`.

Use:

```bash
npm --prefix frontend install
```

or root script:

```bash
npm run install:all
```

### Shared Code Imports

Any frontend import that reaches outside `frontend/` should be reviewed carefully. Vite can import files outside the project root in some cases, but it is better to keep browser-safe code inside the frontend or intentionally maintain a root `shared/` folder.

### Environment Variables

Frontend environment variables must use Vite conventions.

Browser-exposed variables should be named with the `VITE_` prefix:

```env
VITE_SOME_PUBLIC_VALUE=example
```

Do not put backend secrets in `frontend/.env`.

## Done Definition

The migration is complete when:

- All React/Vite files live in `frontend/`
- Root scripts delegate to `frontend/` where appropriate
- Backend still starts from `api/src/server.js`
- Backend serves production files from `frontend/dist`
- Development proxy still sends `/api` calls to port `8080`
- README shows the new folder layout
- `.gitignore` covers `frontend/dist` and nested `node_modules`
- Existing user-facing routes still work

## Recommended First Implementation Slice

Start with the smallest safe version:

1. Move `src/`, `index.html`, and `vite.config.js` into `frontend/`.
2. Add `frontend/package.json`.
3. Change root scripts to delegate to `frontend/`.
4. Update `distDir` to `frontend/dist`.
5. Run `npm --prefix frontend run build` and `npm start`.

Once that works, clean up docs, dependencies, and any shared-code imports. That keeps the migration tidy instead of turning the repo into a shoebox full of startled wires. 🧵
