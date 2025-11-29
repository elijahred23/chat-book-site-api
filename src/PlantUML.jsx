import React, { useState, useEffect, useRef } from "react";
import pako from "pako";
import Panzoom from "@panzoom/panzoom";
import { getGeminiResponse } from "./utils/callGemini.js";
import { useAppState } from "./context/AppContext.jsx";

export default function PlantUMLViewer() {
  const { plantUMLPrompt } = useAppState();
  const [uml, setUml] = useState("@startuml\nAlice -> Bob: Hello\n@enduml");
  const [prompt, setPrompt] = useState("");
  const [server, setServer] = useState("https://www.plantuml.com/plantuml");
  const [format, setFormat] = useState("svg");
  const [encoding, setEncoding] = useState("raw");
  
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const stageRef = useRef(null);

  useEffect(() => {
    setPrompt(plantUMLPrompt ?? "");
  }, [plantUMLPrompt]);

  function extractPlantUmlFromResponse(text) {
    if (!text || typeof text !== "string") return null;
    const fenced = text.match(/```(?:plantuml)?\s*([\s\S]*?)```/i);
    if (fenced && fenced[1]) text = fenced[1].trim();
    const block = text.match(/(@startuml[\s\S]*?@enduml)/i);
    if (block) return block[1].trim();
    return null;
  }

  const handleGenerateFromPrompt = async () => {
    if (!prompt) return;
    try {
      setLoading(true);
      const instruction = `Generate a PlantUML class diagram for the following description: "${prompt}".\nReturn ONLY valid PlantUML code between @startuml and @enduml for a class diagram.\nDo NOT wrap the output in markdown fences or explanations.`;
      const rawResponse = await getGeminiResponse(instruction);
      const umlCode = extractPlantUmlFromResponse(rawResponse);
      if (!umlCode) throw new Error("Gemini response did not contain valid PlantUML.");
      // Update the UML state so the diagram renders in the component
      setUml(umlCode);
      setError(null);
      // Render the diagram immediately in the stage
      renderDiagram();
      // Build the PNG URL and prefetch it. To avoid popup blocking, open a tab
      // synchronously on the user-initiated event, then update its location once
      // the PlantUML server responds with the PNG. Waiting for fetch ensures
      // the server has generated the image before navigating the new tab.
      const newTab = window.open("", "_blank");
      const pngUrl = buildUrl(umlCode, "png", encoding);
      try {
        // Prefetch the PNG to ensure the diagram has been generated. We ignore
        // the fetched data; the call is only to await completion. If this
        // fails, we'll still attempt to open the PNG URL.
        await fetch(pngUrl);
      } catch {}
      if (newTab) {
        newTab.location.href = pngUrl;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      // Ensure the loading state is cleared regardless of success or failure
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(uml);
    } catch {
      alert("Failed to copy UML");
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.includes("@startuml")) setUml(text);
      else alert("Clipboard does not contain valid PlantUML code");
    } catch {
      alert("Failed to paste UML");
    }
  };

  const handlePromptPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPrompt(text);
    } catch {
      alert("Failed to paste into prompt");
    }
  };

  const encode6bit = (b) => {
    if (b < 10) return String.fromCharCode(48 + b);
    b -= 10;
    if (b < 26) return String.fromCharCode(65 + b);
    b -= 26;
    if (b < 26) return String.fromCharCode(97 + b);
    b -= 26;
    if (b === 0) return "-";
    if (b === 1) return "_";
    return "?";
  };
  const append3bytes = (b1, b2, b3) => {
    const c1 = b1 >> 2;
    const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
    const c3 = ((b2 & 0xf) << 2) | (b3 >> 6);
    const c4 = b3 & 0x3f;
    return (
      encode6bit(c1 & 0x3f) +
      encode6bit(c2 & 0x3f) +
      encode6bit(c3 & 0x3f) +
      encode6bit(c4 & 0x3f)
    );
  };
  const bytesToPlantUml = (bytes) => {
    let r = "";
    for (let i = 0; i < bytes.length; i += 3) {
      const b1 = bytes[i];
      const b2 = i + 1 < bytes.length ? bytes[i + 1] : 0;
      const b3 = i + 2 < bytes.length ? bytes[i + 2] : 0;
      r += append3bytes(b1, b2, b3);
    }
    return r;
  };
  const buildUrl = (src, fmt, encMode) => {
    const u8 = new TextEncoder().encode(src);
    const deflated = encMode === "raw" ? pako.deflateRaw(u8) : pako.deflate(u8);
    const payload = bytesToPlantUml(deflated);
    const header = encMode === "zlib" ? "~1" : "";
    const base = server.replace(/\/+$/, "");
    return `${base}/${fmt}/${header}${payload}`;
  };

  // Render a given PlantUML string to the stage and return a promise
  // that resolves once the SVG or IMG element has fully loaded. This
  // ensures that subsequent actions (like opening a new tab) only occur
  // after the diagram has rendered. The provided UML string is used
  // directly rather than relying on component state, allowing callers
  // to render newly generated diagrams immediately.
  const renderDiagramAndWait = (umlString) => {
    return new Promise((resolve) => {
      if (!umlString || !umlString.trim() || !stageRef.current) {
        resolve();
        return;
      }
      const url = buildUrl(umlString, format, encoding);
      const stage = stageRef.current;
      stage.innerHTML = "";
      if (format.endsWith("svg")) {
        const obj = document.createElement("object");
        obj.type = "image/svg+xml";
        obj.data = url;
        obj.style.width = "260px";
        obj.style.maxWidth = "100%";
        obj.style.height = "auto";
        obj.style.display = "block";
        obj.style.margin = "0 auto";
        stage.appendChild(obj);
        obj.addEventListener(
          "load",
          () => {
            try {
              const svg = obj.contentDocument?.querySelector("svg");
              if (svg) Panzoom(svg, { maxScale: 6, contain: "outside" });
            } catch {}
            resolve();
          },
          { once: true }
        );
      } else {
        const img = document.createElement("img");
        img.src = url;
        img.style.width = "260px";
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        img.style.display = "block";
        img.style.margin = "0 auto";
        img.style.borderRadius = "8px";
        img.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
        stage.appendChild(img);
        img.addEventListener(
          "load",
          () => {
            Panzoom(img, { maxScale: 6, contain: "outside" });
            resolve();
          },
          { once: true }
        );
      }
    });
  };

  const renderDiagram = () => {
    if (!uml.trim() || !stageRef.current) return;
    const url = buildUrl(uml, format, encoding);
    const stage = stageRef.current;
    stage.innerHTML = "";
    if (format.endsWith("svg")) {
      const obj = document.createElement("object");
      obj.type = "image/svg+xml";
      obj.data = url;
      obj.style.width = "260px";
      obj.style.maxWidth = "100%";
      obj.style.height = "auto";
      obj.style.display = "block";
      obj.style.margin = "0 auto";
      stage.appendChild(obj);
      obj.addEventListener("load", () => {
        try {
          const svg = obj.contentDocument?.querySelector("svg");
          if (svg) Panzoom(svg, { maxScale: 6, contain: "outside" });
        } catch {}
      });
    } else {
      const img = document.createElement("img");
      img.src = url;
      img.style.width = "260px";
      img.style.maxWidth = "100%";
      img.style.height = "auto";
      img.style.display = "block";
      img.style.margin = "0 auto";
      img.style.borderRadius = "8px";
      img.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";
      stage.appendChild(img);
      img.addEventListener("load", () =>
        Panzoom(img, { maxScale: 6, contain: "outside" })
      );
    }
  };

  useEffect(() => {
    renderDiagram();
  }, [uml, format, encoding, server]);

  const downloadAs = async (type) => {
    if (type === "puml") {
      const blob = new Blob([uml], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "diagram.puml";
      link.click();
      return;
    }
    if (type === "png") {
      const url = buildUrl(uml, "png", encoding);
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "diagram.png";
      link.click();
    }
  };
  const openPngInNewTab = () => {
    const url = buildUrl(uml, "png", encoding);
    window.open(url, "_blank");
  };
  const handleFileUpload = async (e) => {
    const f = e.target.files?.[0];
    if (f) setUml(await f.text());
  };

  const styles = `
    .uml-shell {
      max-width: 1100px;
      margin: 0 auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
    }
    .uml-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1rem;
      box-shadow: 0 10px 24px rgba(15,23,42,0.08);
    }
    .uml-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 0.75rem;
    }
    .uml-actions {
      display: grid;
      gap: 0.5rem;
    }
    .uml-btn {
      padding: 0.65rem 0.9rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #0f172a;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s ease;
    }
    .uml-btn.primary {
      background: linear-gradient(135deg, #2563eb, #60a5fa);
      color: #fff;
      border: none;
      box-shadow: 0 10px 24px rgba(37,99,235,0.25);
    }
    .uml-btn.danger {
      background: linear-gradient(135deg, #f97316, #ea580c);
      color: #fff;
      border: none;
    }
    .uml-input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      background: #ffffff;
      color: #0f172a;
      font-size: 0.95rem;
    }
    .uml-select {
      padding: 0.65rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      background: #fff;
      width: 100%;
    }
    .uml-stage {
      min-height: 50vh;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      background: #ffffff;
      display: grid;
      place-items: center;
      padding: 1rem;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.6);
    }
    @media (max-width: 768px) {
      .uml-grid {
        grid-template-columns: 1fr;
      }
      .uml-actions {
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      }
    }
  `;

  return (
    <div className={`${darkMode ? "dark" : ""}`} style={{ background: darkMode ? "#0b1220" : "#f8fafc", minHeight: "100vh", padding: "0.75rem" }}>
      <style>{styles}</style>
      <div className="uml-shell">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, color: darkMode ? "#e2e8f0" : "#0f172a" }}>🌿 PlantUML Class Diagram</h2>
          <button
            className="uml-btn"
            onClick={() => setDarkMode((d) => !d)}
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>
        </div>

        <div className="uml-card">
          <div className="uml-grid">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerateFromPrompt();
                  }
                }}
                placeholder="Describe the class diagram you want to see..."
                rows={4}
                className="uml-input"
                style={{ minHeight: "120px" }}
              />
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button className="uml-btn" onClick={handlePromptPaste} disabled={loading}>Paste Prompt</button>
                <button className="uml-btn primary" onClick={handleGenerateFromPrompt} disabled={loading}>
                  {loading ? "Generating..." : "Generate Diagram"}
                </button>
              </div>
              {error && <div style={{ color: "#dc2626" }}>{error}</div>}
            </div>

            <div className="uml-actions">
              <label style={{ fontWeight: 600 }}>PlantUML Code</label>
              <textarea
                value={uml}
                onChange={(e) => setUml(e.target.value)}
                className="uml-input"
                style={{ minHeight: "140px" }}
              />
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <select value={format} onChange={(e) => setFormat(e.target.value)} className="uml-select">
                  <option value="svg">SVG</option>
                  <option value="png">PNG</option>
                </select>
                <select value={encoding} onChange={(e) => setEncoding(e.target.value)} className="uml-select">
                  <option value="raw">Raw deflate</option>
                  <option value="zlib">Zlib (~1)</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button onClick={handleCopy} className="uml-btn">Copy UML</button>
                <button onClick={handlePaste} className="uml-btn">Paste UML</button>
                <button onClick={renderDiagram} className="uml-btn primary">Render</button>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button onClick={() => downloadAs("png")} className="uml-btn">Download PNG</button>
                <button onClick={() => downloadAs("puml")} className="uml-btn">Download .puml</button>
                <button onClick={openPngInNewTab} className="uml-btn">Open PNG</button>
              </div>
              <label className="uml-btn" style={{ textAlign: "center", cursor: "pointer" }}>
                Upload UML
                <input
                  type="file"
                  accept=".puml,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="uml-card">
          <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>Diagram</div>
          <div
            ref={stageRef}
            className="uml-stage"
            style={{ background: darkMode ? "#0f172a" : "#ffffff", borderColor: darkMode ? "#1e293b" : "#e2e8f0" }}
          >
            <p style={{ opacity: 0.6, color: darkMode ? "#cbd5e1" : "#475569" }}>Paste, upload, or generate UML and click Render.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
