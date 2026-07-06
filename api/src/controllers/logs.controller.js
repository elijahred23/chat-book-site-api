import { getRecentLogs } from '../middleware/requestLogger.js';

export const logs = (req, res) => {
  res.json({ logs: getRecentLogs() });
};

export const logViewer = (req, res) => {
  res.type('html').send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>API Logs</title>
        <style>
          body { font-family: Arial, sans-serif; background: #0b1220; color: #e2e8f0; padding: 1rem; }
          h1 { margin-top: 0; }
          .panel { background: #0f172a; border: 1px solid #1f2937; border-radius: 10px; padding: 1rem; box-shadow: 0 10px 30px rgba(0,0,0,0.25); }
          ol { padding-left: 1.2rem; }
          li { margin: 0.35rem 0; font-family: "SFMono-Regular", Menlo, Consolas, monospace; word-break: break-all; }
          button { background: linear-gradient(135deg, #2563eb, #22d3ee); border: none; color: #0b1220; padding: 0.5rem 0.9rem; border-radius: 8px; cursor: pointer; font-weight: 700; }
        </style>
      </head>
      <body>
        <h1>API Logs</h1>
        <div class="panel">
          <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom:0.5rem;">
            <div>Most recent first</div>
            <button id="refresh">Refresh</button>
          </div>
          <ol id="logList"></ol>
        </div>
        <script>
          const listEl = document.getElementById('logList');
          async function loadLogs() {
            try {
              const res = await fetch('/api/logs');
              const data = await res.json();
              listEl.innerHTML = '';
              (data.logs || []).forEach((line) => {
                const li = document.createElement('li');
                li.textContent = line;
                listEl.appendChild(li);
              });
            } catch (err) {
              console.error('Failed to load logs', err);
            }
          }
          document.getElementById('refresh').addEventListener('click', loadLogs);
          loadLogs();
          setInterval(loadLogs, 5000);
        </script>
      </body>
    </html>
  `);
};
