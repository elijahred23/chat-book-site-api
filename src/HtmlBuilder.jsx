import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FaBolt,
  FaCode,
  FaDesktop,
  FaDownload,
  FaExternalLinkAlt,
  FaFileUpload,
  FaMobileAlt,
  FaPlay,
  FaTabletAlt,
  FaTrashAlt,
} from 'react-icons/fa';
import { getGeminiResponse } from './utils/callGemini';
import { useAppState, useAppDispatch, actions } from './context/AppContext';
import CopyButton from './ui/CopyButton';
import PasteButton from './ui/PasteButton';
import './HtmlBuilder.css';

const STARTER_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Page</title>
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; background: #f8fafc; color: #0f172a; }
    main { min-height: 100vh; display: grid; place-items: center; padding: 2rem; text-align: center; }
    h1 { font-size: clamp(2.5rem, 8vw, 5rem); margin: 0; }
    p { color: #475569; font-size: 1.125rem; }
  </style>
</head>
<body>
  <main>
    <div>
      <h1>Hello, world.</h1>
      <p>Start editing to make this page your own.</p>
    </div>
  </main>
</body>
</html>`;

const DEVICES = {
  desktop: { label: 'Desktop', icon: FaDesktop, width: '100%' },
  tablet: { label: 'Tablet', icon: FaTabletAlt, width: '768px' },
  mobile: { label: 'Mobile', icon: FaMobileAlt, width: '390px' },
};

const looksLikeHtml = (value) => /<!doctype html|<html|<body|<main|<div/i.test(value || '');

const HtmlBuilder = () => {
  const { htmlBuilder } = useAppState();
  const dispatch = useAppDispatch();
  const source = htmlBuilder.input || '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewHtml, setPreviewHtml] = useState(() => looksLikeHtml(source) ? source : '');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [device, setDevice] = useState('desktop');
  const [fileName, setFileName] = useState('generated-page.html');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const stats = useMemo(() => ({
    characters: source.length,
    lines: source ? source.split('\n').length : 0,
  }), [source]);

  const isHtml = looksLikeHtml(source);
  const previewIsCurrent = previewHtml === source;

  useEffect(() => {
    if (!autoRefresh || !isHtml) return undefined;
    const timer = window.setTimeout(() => setPreviewHtml(source), 350);
    return () => window.clearTimeout(timer);
  }, [autoRefresh, isHtml, source]);

  const updateSource = (value) => {
    dispatch(actions.setHtmlInput(value));
    setError('');
  };

  const extractHtml = (text) => {
    if (!text) return '';
    let cleaned = text.trim();
    const fenced = cleaned.match(/```(?:html)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) cleaned = fenced[1].trim();
    const doctypeMatch = cleaned.match(/<!DOCTYPE html[\s\S]*?<\/html>/i);
    if (doctypeMatch) return doctypeMatch[0].trim();
    const htmlMatch = cleaned.match(/<html[\s\S]*?<\/html>/i);
    if (htmlMatch) return htmlMatch[0].trim();
    const bodyGuess = cleaned.match(/<body[\s\S]*?<\/body>/i);
    if (bodyGuess) return `<!DOCTYPE html><html><head></head>${bodyGuess[0]}</html>`;
    return cleaned;
  };

  const handleGenerate = async () => {
    if (!source.trim()) {
      setError('Describe the page you want before generating.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const fullPrompt = `
You are an expert front-end generator. Output ONLY the contents of a single file named "index.html".
Requirements:
- Self-contained: inline CSS inside <style>, inline JS inside <script>.
- No external CDNs or links.
- Modern, responsive, attractive layout.
- Accessible semantic HTML and keyboard-friendly controls.
- Do not wrap the HTML in markdown fences unless unavoidable; if you must, return exactly one fenced block of the full index.html.

User request:
${source}
      `.trim();

      const fullHTML = extractHtml(await getGeminiResponse(fullPrompt));
      if (!fullHTML.toLowerCase().includes('<html')) {
        throw new Error('The generated response was not a complete HTML document.');
      }

      dispatch(actions.setHtmlInput(fullHTML));
      dispatch(actions.setGeneratedHtml(fullHTML));
      setPreviewHtml(fullHTML);
    } catch (err) {
      setError(err.message || 'HTML generation failed.');
    } finally {
      setLoading(false);
    }
  };

  const loadFile = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
      setError('Choose an .html or .htm file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const value = String(event.target?.result || '');
      updateSource(value);
      dispatch(actions.setGeneratedHtml(value));
      setPreviewHtml(value);
      setFileName(file.name);
    };
    reader.onerror = () => setError('The selected file could not be read.');
    reader.readAsText(file);
  };

  const handleDownload = () => {
    if (!source) return;
    const safeName = (fileName.trim() || 'generated-page.html').replace(/[^a-zA-Z0-9._-]/g, '-');
    const finalName = /\.html?$/i.test(safeName) ? safeName : `${safeName}.html`;
    const url = window.URL.createObjectURL(new Blob([source], { type: 'text/html' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = finalName;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const openInNewTab = () => {
    if (!source) return;
    const url = window.URL.createObjectURL(new Blob([source], { type: 'text/html' }));
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  };

  const clearBuilder = () => {
    updateSource('');
    dispatch(actions.setGeneratedHtml(''));
    setPreviewHtml('');
  };

  const handleEditorKeyDown = (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      if (isHtml) setPreviewHtml(source);
      else handleGenerate();
    }
  };

  return (
    <main className="html-builder">
      <header className="html-builder__hero">
        <div>
          <span className="html-builder__eyebrow"><FaBolt /> AI-powered workspace</span>
          <h1>Build, edit, and preview HTML</h1>
          <p>Describe a page for Gemini or paste a complete document, then test it instantly at multiple screen sizes.</p>
        </div>
        <div className="html-builder__hero-badge" aria-label="Single file output">
          <FaCode />
          <span><strong>index.html</strong>Single-file output</span>
        </div>
      </header>

      {error && <div className="html-builder__alert" role="alert">{error}</div>}

      <div className="html-builder__workspace">
        <section className="html-builder__panel html-builder__editor-panel">
          <div className="html-builder__panel-header">
            <div>
              <span className="html-builder__step">01</span>
              <div>
                <h2>{isHtml ? 'HTML editor' : 'Describe your page'}</h2>
                <p>{isHtml ? 'Edit the document directly.' : 'Be specific about layout, content, and style.'}</p>
              </div>
            </div>
            <span className={`html-builder__mode ${isHtml ? 'is-code' : ''}`}>{isHtml ? 'HTML' : 'Prompt'}</span>
          </div>

          <div
            className={`html-builder__editor ${isDragging ? 'is-dragging' : ''}`}
            onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              loadFile(event.dataTransfer.files?.[0]);
            }}
          >
            <textarea
              value={source}
              onChange={(event) => updateSource(event.target.value)}
              onKeyDown={handleEditorKeyDown}
              spellCheck={!isHtml}
              aria-label={isHtml ? 'HTML source' : 'Page description'}
              placeholder="Describe the page you want, or paste a complete HTML document here..."
            />
            {isDragging && <div className="html-builder__drop-overlay"><FaFileUpload /> Drop HTML file here</div>}
            <footer className="html-builder__editor-footer">
              <span>{stats.lines} lines</span>
              <span>{stats.characters.toLocaleString()} characters</span>
              <span className="html-builder__shortcut">⌘/Ctrl + Enter</span>
            </footer>
          </div>

          <div className="html-builder__primary-actions">
            <button type="button" className="html-builder__button is-primary" onClick={handleGenerate} disabled={loading || !source.trim()}>
              <FaBolt /> {loading ? 'Generating…' : 'Generate with Gemini'}
            </button>
            <button type="button" className="html-builder__button" onClick={() => setPreviewHtml(source)} disabled={!isHtml}>
              <FaPlay /> Run preview
            </button>
          </div>

          <div className="html-builder__tools" aria-label="Editor tools">
            <button type="button" className="html-builder__button is-subtle" onClick={() => { updateSource(STARTER_HTML); setPreviewHtml(STARTER_HTML); }}>Starter</button>
            <PasteButton setPasteText={updateSource} className="html-builder__button is-subtle" />
            <CopyButton text={source} buttonText="Copy HTML" className="html-builder__button is-subtle" />
            <button type="button" className="html-builder__button is-subtle" onClick={() => fileInputRef.current?.click()}>
              <FaFileUpload /> Upload
            </button>
            <input ref={fileInputRef} type="file" accept=".html,.htm,text/html" onChange={(event) => loadFile(event.target.files?.[0])} hidden />
            <button type="button" className="html-builder__button is-subtle is-danger" onClick={clearBuilder} disabled={!source}>
              <FaTrashAlt /> Clear
            </button>
          </div>
        </section>

        <section className="html-builder__panel html-builder__preview-panel">
          <div className="html-builder__panel-header html-builder__preview-header">
            <div>
              <span className="html-builder__step">02</span>
              <div>
                <h2>Preview</h2>
                <p className={previewIsCurrent ? 'is-current' : 'is-stale'}>{previewIsCurrent ? 'Preview is up to date' : 'Changes waiting to run'}</p>
              </div>
            </div>
            <div className="html-builder__device-picker" aria-label="Preview size">
              {Object.entries(DEVICES).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <button key={key} type="button" className={device === key ? 'is-active' : ''} onClick={() => setDevice(key)} aria-label={`${config.label} preview`} title={config.label}>
                    <Icon />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="html-builder__preview-toolbar">
            <label className="html-builder__toggle">
              <input type="checkbox" checked={autoRefresh} onChange={(event) => setAutoRefresh(event.target.checked)} />
              <span aria-hidden="true" /> Auto refresh
            </label>
            <button type="button" onClick={openInNewTab} disabled={!source}><FaExternalLinkAlt /> Pop out</button>
          </div>

          <div className="html-builder__preview-stage">
            {previewHtml ? (
              <iframe
                key={device}
                srcDoc={previewHtml}
                sandbox="allow-forms allow-modals allow-popups allow-scripts"
                style={{ width: DEVICES[device].width }}
                title="HTML preview"
              />
            ) : (
              <div className="html-builder__empty-preview">
                <span><FaDesktop /></span>
                <h3>Your preview will appear here</h3>
                <p>Generate a page, load the starter, or paste HTML into the editor.</p>
              </div>
            )}
          </div>

          <div className="html-builder__export">
            <input value={fileName} onChange={(event) => setFileName(event.target.value)} aria-label="Download file name" />
            <button type="button" className="html-builder__button is-primary" onClick={handleDownload} disabled={!source}>
              <FaDownload /> Download
            </button>
          </div>
        </section>
      </div>
    </main>
  );
};

export default HtmlBuilder;
