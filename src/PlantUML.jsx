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
  const [autoRender, setAutoRender] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const stageRef = useRef(null);

  useEffect(() => {
    setPrompt(plantUMLPrompt ?? "");
  }, [plantUMLPrompt])

  // --- Extract PlantUML from Gemini response ---
  function extractPlantUmlFromResponse(text) {
    if (!text || typeof text !== "string") return null;
    const fenced = text.match(/```(?:plantuml)?\s*([\s\S]*?)```/i);
    if (fenced && fenced[1]) text = fenced[1].trim();
    const block = text.match(/(@startuml[\s\S]*?@enduml)/i);
    if (block) return block[1].trim();
    return null;
  }

  // --- Generate UML from prompt ---
  const handleGenerateFromPrompt = async () => {
    if (!prompt) return;
    try {
      setLoading(true);
      const instruction = `Generate a PlantUML diagram for the following description: "${prompt}".
Return ONLY valid PlantUML code between @startuml and @enduml.
Do NOT wrap in markdown fences or explanations.`;
      const rawResponse = await getGeminiResponse(instruction);
      const umlCode = extractPlantUmlFromResponse(rawResponse);
      if (!umlCode) throw new Error("Gemini response did not contain valid PlantUML.");
      setUml(umlCode);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Clipboard ---
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

  // --- Encoding helpers ---
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

  // --- Render diagram ---
  // --- Render diagram ---
const renderDiagram = () => {
  if (!uml.trim() || !stageRef.current) return;
  const url = buildUrl(uml, format, encoding);
  const stage = stageRef.current;
  stage.innerHTML = "";

  if (format.endsWith("svg")) {
    const obj = document.createElement("object");
    obj.type = "image/svg+xml";
    obj.data = url;
    obj.style.width = "200px";       // ✅ Small base width
    obj.style.maxWidth = "60vw";     // ✅ Scales nicely on mobile
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

    // ✅ Compact, mobile-friendly sizing
    img.style.width = "200px";        // Small default width
    img.style.maxWidth = "60vw";      // On small screens, shrink automatically
    img.style.height = "auto";        // Keep aspect ratio
    img.style.display = "block";
    img.style.margin = "0 auto";      // Center it visually
    img.style.borderRadius = "8px";
    img.style.boxShadow = "0 2px 6px rgba(0,0,0,0.1)";

    stage.appendChild(img);

    img.addEventListener("load", () =>
      Panzoom(img, { maxScale: 6, contain: "outside" })
    );
  }
};


  // --- Auto render ---
  useEffect(() => {
    if (!autoRender) return;
    const timeout = setTimeout(renderDiagram, 600);
    return () => clearTimeout(timeout);
  }, [uml, format, encoding, server, autoRender]);

  // --- Downloads / Open ---
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

  // --- Upload UML file ---
  const handleFileUpload = async (e) => {
    const f = e.target.files?.[0];
    if (f) setUml(await f.text());
  };

  return (
    <div className={`${darkMode ? "dark" : ""} p-4 bg-gray-50 dark:bg-slate-900`}>
      <h2 className="text-xl font-bold mb-3 text-center text-indigo-600 dark:text-indigo-400">
        🌿 PlantUML React Viewer
      </h2>

      {/* Prompt input for Gemini */}
      <div className="flex gap-2 mb-4">
        <textarea
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleGenerateFromPrompt();
            }
          }}
          placeholder="Describe a diagram..."
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={handleGenerateFromPrompt}
          disabled={loading}
          className="bg-blue-600 text-white px-3 py-1 rounded flex items-center"
        >
          {loading && (
            <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
          )}
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}

      {/* UML editor + controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <textarea
          value={uml}
          onChange={(e) => setUml(e.target.value)}
          className="w-full h-40 p-3 rounded border dark:bg-slate-800"
        />
        <div className="flex flex-col gap-2">
          <button onClick={handleCopy} className="bg-purple-600 text-white px-3 py-1 rounded">
            Copy UML
          </button>
          <button onClick={handlePaste} className="bg-pink-600 text-white px-3 py-1 rounded">
            Paste UML
          </button>
          <button onClick={renderDiagram} className="bg-green-600 text-white px-3 py-1 rounded">
            Render
          </button>
          <button onClick={() => downloadAs("png")} className="bg-red-600 text-white px-3 py-1 rounded">
            Download PNG
          </button>
          <button onClick={() => downloadAs("puml")} className="bg-yellow-600 text-white px-3 py-1 rounded">
            Download UML
          </button>
          <button onClick={openPngInNewTab} className="bg-indigo-600 text-white px-3 py-1 rounded">
            Open PNG in New Tab
          </button>
          <label className="bg-teal-600 text-white px-3 py-1 rounded cursor-pointer text-center">
            Upload UML
            <input type="file" accept=".puml,.txt" className="hidden" onChange={handleFileUpload} />
          </label>
          <label className="inline-flex items-center mt-2">
            <input
              type="checkbox"
              checked={autoRender}
              onChange={(e) => setAutoRender(e.target.checked)}
              className="mr-2"
            />
            Auto render
          </label>
        </div>
        <div className="text-sm opacity-80">
          <p><b>Tip:</b> If you see "not DEFLATE", switch encoding to <i>zlib deflate (~1)</i>.</p>
          <p className="mt-2">Pinch to zoom & drag to pan.</p>
        </div>
      </div>

      {/* Rendered diagram */}
      <div
        ref={stageRef}
        className="min-h-[45vh] rounded border mt-4 grid place-items-center bg-white dark:bg-slate-800"
      >
        <p className="opacity-60">Paste, upload, or generate UML and click Render.</p>
      </div>
    </div>
  );
}
