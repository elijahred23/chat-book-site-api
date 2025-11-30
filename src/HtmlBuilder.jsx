import React, { useRef, useState } from 'react';
import { getGeminiResponse } from './utils/callGemini';
import { useAppState, useAppDispatch, actions } from './context/AppContext';
import CopyButton from './ui/CopyButton';
import PasteButton from './ui/PasteButton';

const HtmlBuilder = () => {
  const { htmlBuilder } = useAppState();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef(null);

  const extractHtml = (text) => {
    if (!text) return "";
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
    try {
      setLoading(true);

      const fullPrompt = `
You are an expert front-end generator. Output ONLY the contents of a single file named "index.html".
Requirements:
- Self-contained: inline CSS inside <style>, inline JS inside <script>.
- No external CDNs or links.
- Modern, responsive, attractive layout.
- Do not wrap the HTML in markdown fences unless unavoidable; if you must, return exactly one fenced block of the full index.html.

User request:
${htmlBuilder.input}
      `.trim();

      const raw = await getGeminiResponse(fullPrompt);
      const fullHTML = extractHtml(raw);

      if (!fullHTML.toLowerCase().includes("<html")) {
        throw new Error("Model did not return a valid HTML document.");
      }

      dispatch(actions.setHtmlInput(fullHTML));
      dispatch(actions.setGeneratedHtml(fullHTML));
    } catch (err) {
      alert("Error generating HTML: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      dispatch(actions.setHtmlInput(event.target.result));
      dispatch(actions.setGeneratedHtml(event.target.result));
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    const blob = new Blob([htmlBuilder.input], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated_page.html';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const openInNewTab = () => {
    const blob = new Blob([htmlBuilder.input], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem' }}>
      <div style={{
        background: 'radial-gradient(circle at 10% 20%, rgba(37,99,235,0.12), transparent 30%), radial-gradient(circle at 80% 0%, rgba(14,165,233,0.16), transparent 35%), #0b1220',
        borderRadius: '18px',
        padding: '1.25rem',
        boxShadow: '0 20px 48px rgba(0,0,0,0.35)',
        color: '#e2e8f0'
      }}>
        <h2 style={{ marginTop: 0 }}>🛠 HTML Builder</h2>
        <p style={{ marginTop: 0, color: '#cbd5e1' }}>Generate a single, self-contained <code>index.html</code> and preview it instantly.</p>

        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr', alignItems: 'start' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.3)', borderRadius: '14px', padding: '1rem' }}>
            <label style={{ fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>Prompt or HTML</label>
            <textarea
              value={htmlBuilder.input}
              onChange={(e) => dispatch(actions.setHtmlInput(e.target.value))}
              placeholder="Describe the page you want or paste full HTML here..."
              rows={10}
              style={{
                width: '100%',
                padding: '12px',
                fontFamily: 'monospace',
                fontSize: '14px',
                borderRadius: '10px',
                border: '1px solid #1f2937',
                resize: 'vertical',
                boxSizing: 'border-box',
                background: '#0b1220',
                color: '#e2e8f0'
              }}
            />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '12px' }}>
              <button className="btn primary" onClick={handleGenerate} disabled={loading} style={{ background: 'linear-gradient(135deg, #2563eb, #22d3ee)', color: '#0b1220', border: 'none' }}>
                {loading ? 'Generating...' : 'Generate with Gemini'}
              </button>
              <button className="btn" onClick={() => { dispatch(actions.setHtmlInput("")); dispatch(actions.setGeneratedHtml("")); }} disabled={!htmlBuilder.input}>
                Clear
              </button>
              <CopyButton text={htmlBuilder.input} />
              <PasteButton onPaste={(text)=> dispatch(actions.setHtmlInput(text))} />
              <button className="btn" onClick={handleDownload}>Download HTML</button>
              <label
                className="btn"
                style={{
                  cursor: 'pointer',
                  background: '#111827',
                  color: '#e2e8f0',
                  border: '1px solid #1f2937'
                }}
              >
                Upload HTML
                <input type="file" accept=".html" onChange={handleFileUpload} style={{ display: 'none' }} />
              </label>
              <button className="btn" onClick={openInNewTab} disabled={!htmlBuilder.input}>Open in New Tab</button>
            </div>
          </div>

          {htmlBuilder.input && (
            <div style={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.3)', borderRadius: '14px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, color: '#e2e8f0' }}>🔍 Live Preview</h3>
                <button className="btn" onClick={openInNewTab} style={{ background: '#111827', color: '#e2e8f0' }}>Pop Out</button>
              </div>
              <iframe
                ref={iframeRef}
                srcDoc={htmlBuilder.input}
                style={{
                  width: '100%',
                  height: '520px',
                  border: '1px solid #1f2937',
                  borderRadius: '10px',
                  background: '#0b1220'
                }}
                title="HTML Preview"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HtmlBuilder;
