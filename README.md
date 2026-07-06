# Chat Book Site API

Chat Book Site API is a React/Vite web app with an Express backend. It powers a personal AI tool site that includes chat prompts, Gemini responses, YouTube search and transcript tools, text-to-speech, PDF-to-text extraction, a simple web search helper, URL extraction from public pages, and a small CPU simulator.

The project is designed as one deployable app: Vite builds the frontend into `dist`, and the Express server serves both the API routes and the built React app.

## Features

- React/Vite frontend with multiple tool pages and drawer-based utilities
- Express API server
- Gemini prompt generation and model selection
- YouTube search, trending, news, video details, playlists, comments, and transcript routes
- Google Cloud Text-to-Speech support
- PDF-to-text upload and extraction
- Public page URL extraction
- DuckDuckGo-based web search helper
- CPU simulator API with sample programs, compile/load, step, and reset support
- Basic request logging with an in-browser log viewer

## Tech Stack

- React 18
- Vite
- Express
- Node.js ES modules
- Google Gemini API
- Google Cloud Text-to-Speech
- YouTube Data API helpers
- Supadata transcript support
- Multer for uploads
- pdf-parse for PDF text extraction

## Project Structure

```text
.
├── api/
│   ├── server.js              # Compatibility wrapper for api/src/server.js
│   ├── src/
│   │   ├── app.js             # Express app, middleware, static hosting, route registration
│   │   ├── server.js          # HTTP server startup
│   │   ├── config/            # Environment and path configuration
│   │   ├── controllers/       # HTTP request/response handlers
│   │   ├── middleware/        # Logging, uploads, and error handling
│   │   ├── routes/            # Endpoint definitions
│   │   ├── services/          # Provider integrations and feature logic
│   │   └── utils/             # Shared backend utilities
│   ├── package.json           # API-specific dependencies/scripts
│   ├── chatGPT.js             # Legacy re-export for service module
│   ├── gemini.js              # Legacy re-export for service module
│   ├── youtube.js             # Legacy re-export for service module
│   ├── transcriptService.js   # Legacy re-export for service module
│   ├── supadata.js            # Legacy re-export for service module
│   └── logs/                  # Runtime API logs
├── shared/
│   └── cpuSimulator.js        # CPU simulator/compiler logic
├── src/
│   ├── App.jsx                # React routes and drawer layout
│   └── ...                    # Tool components
├── dist/                      # Built frontend output
├── package.json               # Root frontend/server scripts
└── vite.config.js             # Vite config and local API proxy
```

## Requirements

- Node.js 18 or newer
- npm
- API keys and credentials for the features you want to use

Some tools work without credentials, but Gemini, YouTube, Supadata, and Google Cloud TTS require environment variables.

## Environment Variables

Create a `.env` file in the project root or inside `api/`, depending on how you run the server.

Common variables used by the API include:

```env
PORT=8080

# Gemini / Google GenAI
GEMINI_API_KEY=your_gemini_api_key

# OpenAI, if used by helper modules
CHAT_GPT_API_KEY=your_openai_api_key

# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key

# Supadata
SUPA_DATA_API_KEY=your_supadata_api_key

# Google Cloud Text-to-Speech
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Optional: provide service account JSON directly
TTS_SA_JSON={"type":"service_account",...}

# Optional PDF upload size in MB
PDF_UPLOAD_MAX_MB=1024
```

Do not commit real API keys, service account JSON, or secrets.

## Install

Install dependencies from the root:

```bash
npm install
```

The API folder also has its own package file. If you are running the API directly from `api/`, install those dependencies too:

```bash
cd api
npm install
```

## Development

Run the Vite dev server from the root:

```bash
npm run dev
```

The frontend runs on:

```text
http://localhost:3006
```

During development, Vite proxies `/api` requests to the Express server on port `8080`.

In a second terminal, start the API:

```bash
npm start
```

Or from the `api` folder:

```bash
cd api
npm start
```

The API runs on:

```text
http://localhost:8080
```

## Build

Build the React app:

```bash
npm run build
```

This creates the production frontend in `dist`.

## Production Start

After building the frontend, start the Express server:

```bash
npm start
```

The server will:

1. Serve API routes from `/api/...`
2. Serve static frontend files from `dist`
3. Fall back to `index.html` for React Router routes

Default production URL:

```text
http://localhost:8080
```

## Main Frontend Routes

The React app includes routes such as:

```text
/
/chatBook
/apiCheck
/youTubeTranscript
/wiki
/htmlBuilder
/webBrowser
/Quran
/typingTest
/flashCards
/plantUML
/jsGenerator
/bengali
/coding
/cpu-simulator
/system-design
/pdf-to-text
/media-player
/action-buttons-studio
/markdown-viewer
```

## Main API Routes

### Health Check

```http
GET /api/check
```

Returns a random API status message.

### Gemini

```http
GET /api/geminiModelList
GET /api/geminiModel
POST /api/geminiModel
GET /api/gemini/prompt?prompt=...
POST /api/gpt/prompt
```

Used for listing Gemini models, setting the active model, and generating AI responses.

### YouTube

```http
GET /api/youtube/search?q=...
GET /api/youtube/trending
GET /api/youtube/news
GET /api/youtube/video/:id
GET /api/youtube/comments?video=...&maxResults=20
GET /api/youtube/transcript?url=...
GET /api/youtube/search/playlists?q=...
GET /api/youtube/playlist/:playlistId
```

Supports YouTube search, metadata, playlist lookup, comments, and transcript retrieval.

### Supadata Transcript

```http
GET /api/supadata/transcript?url=...
```

Fetches a transcript through the Supadata integration.

### Text-to-Speech

```http
POST /api/tts
POST /api/tts/batch
```

Example request:

```json
{
  "text": "Hello world",
  "lang": "en-US"
}
```

Batch example:

```json
{
  "items": [
    { "text": "Hello", "lang": "en-US" },
    { "text": "স্বাগতম", "lang": "bn-IN" }
  ]
}
```

These routes return MP3 audio.

### PDF to Text

```http
POST /api/pdf-to-text
```

Upload a PDF with form-data using the field name:

```text
file
```

The API returns extracted text:

```json
{
  "text": "Extracted PDF text..."
}
```

### Web Search

```http
GET /api/websearch?q=...
```

Returns parsed DuckDuckGo results and a best-effort reachable URL.

### Page URL Extraction

```http
GET /api/page-urls?url=https://example.com
```

Fetches a public HTML page and extracts links, images, scripts, CSS URLs, and other page references.

Localhost, private network addresses, credentialed URLs, oversized HTML pages, and unsupported protocols are rejected.

### CPU Simulator

```http
GET /api/programs
POST /api/simulator
POST /api/simulator/:id/step
POST /api/simulator/:id/reset
POST /api/simulator/generate
```

Used by the Clockwork-style CPU simulator. The simulator can load binary, assembly, or MiniScript-style source, then step through execution.

Example load request:

```json
{
  "language": "assembly",
  "source": "LDI A, 10\nOUT A\nHLT"
}
```

### Logs

```http
GET /api/logs
GET /logs
```

`/api/logs` returns recent request logs as JSON.

`/logs` shows a simple browser-based log viewer.

## Notes

- The server writes request logs to `api/logs/api.log`.
- Uploaded PDFs are temporarily stored under `var/uploads`.
- Google TTS credentials can be supplied as a normal credentials file or through service account JSON in an environment variable.
- The app uses a simple permissive CORS setup for development.
- The project currently does not define a real test suite.

## Scripts

Root `package.json`:

```bash
npm run dev      # Start Vite dev server
npm run build    # Build frontend
npm run start    # Start Express server from api/src/server.js
npm run preview  # Preview built Vite app
npm run lint     # Run ESLint
```

API `package.json`:

```bash
npm start        # Start api/src/server.js
npm run debug    # Start API with Node inspector and watch mode
```

## Adding Backend Features

Add new backend behavior in the same dependency direction as the existing modules:

1. Add the URL and HTTP method in `api/src/routes/<feature>.routes.js`.
2. Put request parsing and response shaping in `api/src/controllers/<feature>.controller.js`.
3. Put external API calls or feature logic in `api/src/services/<feature>.service.js`.
4. Register the route module in `api/src/routes/index.js`.
5. Add new configuration names to `api/src/config/env.js` and document blank values in `api/.env-template`.

## Deployment

A basic deployment flow is:

```bash
npm install
npm run build
npm start
```

Make sure production environment variables are configured before starting the server.

For most hosts, set:

```env
PORT=8080
```

Then expose that port through the hosting platform.

## License

This project currently uses the license declared in `api/package.json`.
