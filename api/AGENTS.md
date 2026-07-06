# API guidance

## Runtime and structure

- The API is an Express 4 ES-module application. `server.js` defines middleware, HTTP routes, static frontend serving, and startup on `PORT` (default 8080).
- Keep provider-specific logic in the existing modules (`chatGPT.js`, `gemini.js`, `youtube.js`, `supadata.js`, and `transcriptService.js`) instead of expanding `server.js` with SDK details.
- All application endpoints must remain under `/api`. The final non-API catch-all serves `../frontend/dist/index.html` for React Router, so add API routes before that catch-all.
- `youtube_service.py` and `requirements.txt` support the Python-side service/tooling. Do not introduce a Python dependency for a Node route unless the deployment and invocation path are updated too.

## API behavior and security

- Validate required query, path, body, and upload inputs before calling an external provider. Return an appropriate 4xx status for caller errors and a JSON error payload for failures.
- Do not return provider credentials, raw credential objects, internal file paths, or verbose stack traces to clients.
- Preserve the public-URL protections in `server.js`: redirects must be revalidated and private, loopback, link-local, and credential-bearing URLs must remain blocked.
- Keep request timeouts and response-size limits on remote fetches. Clean up temporary uploads on both success and error paths.
- Load configuration from environment variables. Add new variable names with blank examples to `.env-template`; never add real values or service-account JSON to tracked files.
- Avoid logging full prompts, uploaded content, tokens, or secrets. Runtime logs belong in ignored log files, not source control.

## Validation

- Run `node --check api/server.js` and `node --check` for every changed API JavaScript module.
- Start with `npm start` from the repository root or `npm start --prefix api`, then exercise the changed endpoint, including one invalid-input case.
- Provider-backed routes need the corresponding environment variables and may make billable network calls. Do not invoke them without suitable test credentials and intent; document when verification was limited for that reason.
- There is no working automated API test script yet; `api/package.json` contains a failing placeholder.
