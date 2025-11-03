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

  return (
    <div
      className={`${darkMode ? "dark" : ""} p-4 bg-gray-50 dark:bg-slate-900 min-h-screen`}
    >
      <div className="mx-auto max-w-screen-lg">
        <h2 className="text-2xl font-bold mb-4 text-center text-indigo-600 dark:text-indigo-400">
          🌿 PlantUML Class Diagram Viewer
        </h2>
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:gap-2 mb-4">
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
            rows={3}
            className="flex-1 p-3 border rounded dark:bg-slate-800 w-full"
          />
          <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
            <button
              onClick={handlePromptPaste}
              disabled={loading}
              className="flex-1 sm:flex-none bg-purple-600 text-white px-3 py-2 rounded shadow"
            >
              Paste
            </button>
            <button
              onClick={handleGenerateFromPrompt}
              disabled={loading}
              className="flex-1 sm:flex-none bg-blue-600 text-white px-3 py-2 rounded shadow flex items-center justify-center"
            >
              {loading && (
                <span className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full"></span>
              )}
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>
        {error && <div className="text-red-600 mb-2">{error}</div>}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <textarea
            value={uml}
            onChange={(e) => setUml(e.target.value)}
            className="w-full h-40 p-3 rounded border dark:bg-slate-800"
          />
          <div className="flex flex-col gap-2">
            <button onClick={handleCopy} className="bg-purple-600 text-white px-3 py-2 rounded shadow">
              Copy UML
            </button>
            <button onClick={handlePaste} className="bg-pink-600 text-white px-3 py-2 rounded shadow">
              Paste UML
            </button>
            <button onClick={renderDiagram} className="bg-green-600 text-white px-3 py-2 rounded shadow">
              Render
            </button>
            <button onClick={() => downloadAs("png")} className="bg-red-600 text-white px-3 py-2 rounded shadow">
              Download PNG
            </button>
            <button onClick={() => downloadAs("puml")} className="bg-yellow-600 text-white px-3 py-2 rounded shadow">
              Download UML
            </button>
            <button onClick={openPngInNewTab} className="bg-indigo-600 text-white px-3 py-2 rounded shadow">
              Open PNG in New Tab
            </button>
            <label className="bg-teal-600 text-white px-3 py-2 rounded shadow cursor-pointer text-center">
              Upload UML
              <input
                type="file"
                accept=".puml,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
          <div className="text-sm opacity-80">
            <p>
              <b>Tip:</b> If you see "not DEFLATE", switch encoding to <i>zlib deflate (~1)</i>.
            </p>
            <p className="mt-2">Pinch to zoom & drag to pan the diagram.</p>
            <p className="mt-2">
              The “Generate” button will always produce a class diagram from your description.
            </p>
          </div>
        </div>
        <div
          ref={stageRef}
          className="min-h-[45vh] rounded border mt-6 grid place-items-center p-4 bg-white dark:bg-slate-800"
        >
          <p className="opacity-60">Paste, upload, or generate UML and click Render.</p>
        </div>
      </div>
    </div>
  );
}