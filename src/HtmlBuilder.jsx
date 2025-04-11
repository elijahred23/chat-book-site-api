import React, { useRef, useState } from 'react';
import { getGeminiResponse } from './utils/callGemini';
import { useAppState, useAppDispatch, actions } from './context/AppContext';

const HtmlBuilder = () => {
    const { htmlBuilder } = useAppState();
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState(false);
    const iframeRef = useRef(null);

    const handleGenerate = async () => {
        try {
            setLoading(true);

            const fullPrompt = `
Generate a single HTML file that includes:
- Embedded CSS using <style> tag
- Embedded JavaScript using <script> tag
- All content self-contained in one file
DO NOT include external links (e.g., CDN, scripts, stylesheets)

Prompt:
${htmlBuilder.input}
            `.trim();

            let fullHTML = await getGeminiResponse(fullPrompt);

            // Strip markdown formatting
            fullHTML = fullHTML.trim();
            if (fullHTML.startsWith("```html")) fullHTML = fullHTML.replace(/^```html/, '').trim();
            if (fullHTML.endsWith("```")) fullHTML = fullHTML.replace(/```$/, '').trim();

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


    const toggleFullscreen = () => {
        const iframe = iframeRef.current;
        if (iframe.requestFullscreen) iframe.requestFullscreen();
        else if (iframe.webkitRequestFullscreen) iframe.webkitRequestFullscreen();
        else if (iframe.msRequestFullscreen) iframe.msRequestFullscreen();
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
            <h2>🛠 HTML Builder</h2>

            <div style={{ marginBottom: '10px' }}>
                <textarea
                    value={htmlBuilder.input}
                    onChange={(e) => dispatch(actions.setHtmlInput(e.target.value))}
                    placeholder="Type your prompt or paste full HTML here..."
                    rows={10}
                    style={{
                        width: '100%',
                        padding: '12px',
                        fontFamily: 'monospace',
                        fontSize: '14px',
                        borderRadius: '6px',
                        border: '1px solid #ccc',
                        resize: 'vertical',
                        boxSizing: 'border-box'
                    }}
                />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '1rem' }}>
                <button onClick={() => { dispatch(actions.setHtmlInput("")) }} disabled={htmlBuilder.input?.length == 0}>
                    Clear
                </button>
                <button onClick={handleGenerate} disabled={loading}>
                    {loading ? 'Generating...' : 'Generate with Gemini'}
                </button>
                <button onClick={handleDownload}>Download HTML</button>
                <label
                    style={{
                        display: 'inline-block',
                        cursor: 'pointer',
                        padding: '6px 12px',
                        background: '#eee',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                    }}
                >
                    Upload HTML
                    <input type="file" accept=".html" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
            </div>

            {htmlBuilder.input && (
                <>
                    <h3>🔍 Live Preview</h3>
                    <button onClick={openInNewTab} style={{ marginBottom: '10px' }}>
                        Open in New Tab
                    </button>
                    <iframe
                        ref={iframeRef}
                        srcDoc={htmlBuilder.input}
                        style={{
                            width: '100%',
                            height: '500px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            marginBottom: '2rem'
                        }}
                        title="HTML Preview"
                    />
                </>
            )}

        </div>
    );
};

export default HtmlBuilder;
