# Backend Reorganization Guide

This guide describes how to reorganize the backend for `chat-book-site-api` so it matches the cleaner frontend structure introduced on the `refactor/reorganize-frontend-structure` branch.

The goal is not to change behavior first. The goal is to move the backend from one large Express entry point into small, predictable modules that are easier to read, test, and extend.

## Current Backend Shape

The backend currently lives mostly in `api/`.

```text
api/
├── server.js
├── chatGPT.js
├── gemini.js
├── youtube.js
├── transcriptService.js
├── supadata.js
├── package.json
└── logs/
```

`server.js` acts as the main application file and also owns a large amount of route wiring, middleware setup, feature logic, and production static-file behavior.

That works for a small app, but as the project grows it becomes harder to answer simple questions like:

- Where does a route live?
- Which module owns a feature?
- Where should validation happen?
- Where should API integrations be placed?
- What can be tested without starting the whole server?

## Target Backend Shape

Move toward a feature-based backend structure.

```text
api/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   └── env.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   ├── requestLogger.js
│   │   └── upload.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── health.routes.js
│   │   ├── gemini.routes.js
│   │   ├── youtube.routes.js
│   │   ├── transcript.routes.js
│   │   ├── tts.routes.js
│   │   ├── pdf.routes.js
│   │   ├── web.routes.js
│   │   ├── simulator.routes.js
│   │   └── logs.routes.js
│   ├── controllers/
│   │   ├── health.controller.js
│   │   ├── gemini.controller.js
│   │   ├── youtube.controller.js
│   │   ├── transcript.controller.js
│   │   ├── tts.controller.js
│   │   ├── pdf.controller.js
│   │   ├── web.controller.js
│   │   ├── simulator.controller.js
│   │   └── logs.controller.js
│   ├── services/
│   │   ├── gemini.service.js
│   │   ├── youtube.service.js
│   │   ├── transcript.service.js
│   │   ├── supadata.service.js
│   │   ├── tts.service.js
│   │   ├── pdf.service.js
│   │   ├── webSearch.service.js
│   │   ├── pageUrls.service.js
│   │   └── simulator.service.js
│   ├── utils/
│   │   ├── asyncHandler.js
│   │   ├── httpErrors.js
│   │   └── urlSafety.js
│   └── constants/
│       └── routes.js
├── logs/
├── package.json
└── README.md
```

## Folder Responsibilities

### `src/server.js`

Starts the HTTP server.

Keep this file small. It should load environment variables, import the Express app, pick the port, and call `listen`.

```js
import app from './app.js';
import { env } from './config/env.js';

app.listen(env.port, () => {
  console.log(`API listening on port ${env.port}`);
});
```

### `src/app.js`

Builds and configures the Express app.

This is where shared middleware, route registration, frontend static hosting, and the global error handler should be wired together.

```js
import express from 'express';
import routes from './routes/index.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(express.json());
app.use(requestLogger);
app.use('/api', routes);
app.use(errorHandler);

export default app;
```

### `src/routes/`

Routes define URLs and HTTP methods only.

A route file should not contain heavy business logic. It should point requests to controller functions.

Example:

```js
import { Router } from 'express';
import { listModels, generatePrompt } from '../controllers/gemini.controller.js';

const router = Router();

router.get('/geminiModelList', listModels);
router.get('/gemini/prompt', generatePrompt);

export default router;
```

### `src/controllers/`

Controllers translate HTTP requests into service calls.

They should handle request params, query strings, request bodies, response status codes, and response JSON shape.

They should not know the details of Gemini, YouTube, PDF parsing, or simulator internals.

### `src/services/`

Services contain feature logic and external API calls.

Examples:

- Gemini model selection and prompt calls
- YouTube search and metadata lookup
- Supadata transcript retrieval
- Google Cloud TTS generation
- PDF text extraction
- CPU simulator execution helpers
- DuckDuckGo search parsing
- Public page URL extraction

Services should be easy to call from tests without starting Express.

### `src/middleware/`

Middleware handles cross-cutting request behavior.

Good candidates:

- Request logging
- CORS setup
- Upload handling with Multer
- Error handling
- JSON body limits
- API timing logs

### `src/config/`

Configuration should be centralized.

Use this folder for environment variables, defaults, feature flags, upload limits, and integration settings.

Example:

```js
export const env = {
  port: Number(process.env.PORT || 8080),
  geminiApiKey: process.env.GEMINI_API_KEY,
  youtubeApiKey: process.env.YOUTUBE_API_KEY,
  supadataApiKey: process.env.SUPADATA_API_KEY,
  pdfUploadMaxMb: Number(process.env.PDF_UPLOAD_MAX_MB || 1024),
};
```

### `src/utils/`

Utilities should be small and reusable.

Good candidates:

- Safe async route wrapper
- HTTP error helper
- URL validation helpers
- Private IP or localhost blocking helpers
- Shared string parsing helpers

## Suggested Migration Plan

### Phase 1: Create the New Backend Skeleton

Create the new folders under `api/src/`.

Add empty route, controller, service, middleware, config, and utility files. Keep the current `api/server.js` working while the new structure is introduced.

### Phase 2: Split App Startup from Route Logic

Move Express app creation into `api/src/app.js`.

Move server startup into `api/src/server.js`.

Then make the old `api/server.js` a temporary compatibility wrapper:

```js
import './src/server.js';
```

This keeps existing `npm start` scripts working while the internals move.

### Phase 3: Move Routes One Feature at a Time

Move one route group at a time instead of moving everything at once.

Recommended order:

1. Health check routes
2. Logs routes
3. Gemini routes
4. YouTube routes
5. Transcript routes
6. Web search and page URL routes
7. PDF-to-text route
8. TTS routes
9. CPU simulator routes

After each route group is moved, verify that the old endpoint still responds with the same URL and response shape.

### Phase 4: Extract Controllers

For each feature, move HTTP-specific code into a controller.

The controller should handle:

- `req.params`
- `req.query`
- `req.body`
- response status codes
- response JSON
- request-specific error messages

### Phase 5: Extract Services

Move feature logic into services.

Existing helper files can be renamed and moved gradually:

```text
api/gemini.js              -> api/src/services/gemini.service.js
api/youtube.js             -> api/src/services/youtube.service.js
api/transcriptService.js   -> api/src/services/transcript.service.js
api/supadata.js            -> api/src/services/supadata.service.js
api/chatGPT.js             -> api/src/services/chat.service.js
shared/cpuSimulator.js     -> api/src/services/simulator.service.js or shared/simulator/
```

If `shared/cpuSimulator.js` is also used by the frontend, keep it in `shared/` and wrap it from a backend service instead of moving it outright.

### Phase 6: Centralize Environment Variables

Move direct `process.env` reads into `api/src/config/env.js`.

This makes missing configuration easier to detect and prevents environment access from being scattered across route files.

### Phase 7: Add Error Handling

Introduce a shared error handler so controllers can throw errors instead of repeating response logic.

```js
export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;

  res.status(status).json({
    error: err.message || 'Internal server error',
  });
}
```

Add an `asyncHandler` utility so async controllers do not need repetitive `try/catch` blocks.

```js
export const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};
```

### Phase 8: Update Scripts

Once `api/src/server.js` is stable, update scripts to point to it directly.

Root `package.json` can keep starting the backend from the root:

```json
{
  "scripts": {
    "start": "node api/src/server.js"
  }
}
```

API `package.json` can use:

```json
{
  "scripts": {
    "start": "node src/server.js",
    "debug": "node --watch --inspect src/server.js"
  }
}
```

### Phase 9: Update Documentation

Update the root README after the backend structure is moved.

The README should explain:

- Where the API entry point lives
- Where routes live
- Where services live
- How to add a new backend feature
- How to run the backend locally
- Which environment variables are required

## Route Group Mapping

| Feature | Current Location | New Route File | New Controller | New Service |
| --- | --- | --- | --- | --- |
| Health check | `api/server.js` | `health.routes.js` | `health.controller.js` | Optional |
| Gemini | `api/server.js`, `api/gemini.js` | `gemini.routes.js` | `gemini.controller.js` | `gemini.service.js` |
| YouTube | `api/server.js`, `api/youtube.js` | `youtube.routes.js` | `youtube.controller.js` | `youtube.service.js` |
| Transcript | `api/server.js`, `api/transcriptService.js`, `api/supadata.js` | `transcript.routes.js` | `transcript.controller.js` | `transcript.service.js`, `supadata.service.js` |
| Text-to-speech | `api/server.js` | `tts.routes.js` | `tts.controller.js` | `tts.service.js` |
| PDF to text | `api/server.js` | `pdf.routes.js` | `pdf.controller.js` | `pdf.service.js` |
| Web search | `api/server.js` | `web.routes.js` | `web.controller.js` | `webSearch.service.js` |
| Page URL extraction | `api/server.js` | `web.routes.js` | `web.controller.js` | `pageUrls.service.js` |
| CPU simulator | `api/server.js`, `shared/cpuSimulator.js` | `simulator.routes.js` | `simulator.controller.js` | `simulator.service.js` |
| Logs | `api/server.js`, `api/logs/` | `logs.routes.js` | `logs.controller.js` | Optional |

## Naming Guidelines

Use predictable backend file names:

```text
feature.routes.js
feature.controller.js
feature.service.js
```

Examples:

```text
gemini.routes.js
gemini.controller.js
gemini.service.js
```

This makes the backend feel like a well-labeled toolbox instead of a drawer full of cables.

## Import Rules

Use a simple dependency direction:

```text
routes -> controllers -> services -> utilities/config
```

Avoid imports in the opposite direction.

Good:

```js
// controller imports service
import { searchVideos } from '../services/youtube.service.js';
```

Avoid:

```js
// service should not import controller
import { searchVideosController } from '../controllers/youtube.controller.js';
```

## Validation Checklist

After each backend migration step, verify:

- Existing API URLs still work
- The frontend still calls the same endpoints
- `npm start` still starts the API
- `npm run dev` still proxies frontend API calls correctly
- PDF upload still respects size limits
- TTS credentials are still read correctly
- YouTube and Supadata routes still handle missing API keys cleanly
- CPU simulator programs still load, step, reset, and generate correctly
- `/api/logs` and `/logs` still work
- No secrets or generated log files are committed

## Example Feature Add Flow

When adding a new backend feature later:

1. Add the route in `api/src/routes/newFeature.routes.js`.
2. Add request handling in `api/src/controllers/newFeature.controller.js`.
3. Add business logic in `api/src/services/newFeature.service.js`.
4. Register the route in `api/src/routes/index.js`.
5. Add any new environment variables to `api/src/config/env.js`.
6. Update the README if the feature adds public endpoints or setup requirements.

## Recommended First Pull Request Scope

Keep the first backend reorganization PR small.

A good first PR would only do this:

- Create `api/src/app.js`
- Create `api/src/server.js`
- Create `api/src/routes/index.js`
- Move the health check route
- Add `api/src/middleware/errorHandler.js`
- Keep `api/server.js` as a compatibility wrapper

That gives the backend a new skeleton without trying to move the whole castle in one wagon. 🏗️
