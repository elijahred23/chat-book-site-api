import React, { useEffect, useMemo, useState } from "react";
import { getGeminiResponse } from "./utils/callGemini.js";
import { useAppState } from "./context/AppContext.jsx";

const DEFAULT_BASE_URL = "http://143.244.214.172";
const SAMPLE_YAML = `title: Simple Web App on AWS
nodes:
  - id: vpc
    type: aws.network.VPC
    label: Main VPC
  - id: alb
    type: aws.network.ELB
    label: Public ALB
  - id: asg
    type: aws.compute.EC2
    label: App EC2 (ASG)
  - id: rds
    type: aws.database.RDS
    label: User DB
edges:
  - from: alb
    to: asg
    label: HTTP/HTTPS
  - from: asg
    to: rds
    label: DB traffic
  - from: vpc
    to: alb
    label: Internet-facing
`;

function parseFilename(disposition) {
  if (!disposition) return "";
  const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
  if (!match?.[1]) return "";
  return match[1].replace(/['"]/g, "");
}

export default function ArchitectureDiagram() {
  const { architecturePrompt } = useAppState();
  const [apiBase, setApiBase] = useState(DEFAULT_BASE_URL);
  const [yaml, setYaml] = useState(SAMPLE_YAML);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [health, setHealth] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageBlob, setImageBlob] = useState(null);
  const [fileName, setFileName] = useState("diagram.png");

  const normalizedBase = useMemo(() => {
    return apiBase.replace(/^https?:\/\/https?:\/\//i, "http://").replace(/\/+$/, "");
  }, [apiBase]);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  useEffect(() => {
    if (architecturePrompt) setPrompt(architecturePrompt);
  }, [architecturePrompt]);

  const buildPromptInstruction = (subject) => `
You are generating YAML for the Python diagrams library. Include a valid YAML block (parsable by yaml.safe_load) and keep commentary brief—no example YAML beyond the final output. Schema description: root keys are title (string), nodes (list), edges (list), optional groups (list); each node has id (unique slug), type (diagrams class path like aws.compute.ECS), label (string); each edge has from/to (node ids) and optional label; each group (optional) has id, label, nodes (list of node ids). Rules: use only real diagrams classes (aws.*, onprem.*, generic.*, etc.) with correct casing (ECS, ALB, RDS, CloudFront, Route53, DynamoDB, StepFunctions, Eventbridge); IDs must be unique and references valid; YAML must be syntactically correct (spaces, no tabs); target subject: ${subject} keep the architecture concise (6–12 nodes).
`;

  const extractYaml = (text) => {
    if (!text || typeof text !== "string") return "";
    const fenced = text.match(/```(?:yaml|yml)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) return fenced[1].trim();
    const trimmed = text.trim();
    const titleIndex = trimmed.toLowerCase().indexOf("title:");
    if (titleIndex !== -1) {
      return trimmed.slice(titleIndex).trim();
    }
    return trimmed;
  };

  const handleHealthCheck = async () => {
    setError("");
    setHealth("");
    setStatus("");
    try {
      const res = await fetch(`${normalizedBase}/health`);
      if (!res.ok) throw new Error(`Health check failed (${res.status})`);
      const data = await res.json();
      setHealth(data?.status || "ok");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGenerate = async (source) => {
    setLoading(true);
    setError("");
    setHealth("");
    setStatus("");
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl("");
    setImageBlob(null);
    try {
      let yamlToSend = yaml;
      const subject = prompt.trim();
      if (source === "prompt") {
        if (!subject) throw new Error("Please enter a prompt first.");
        setStatus("Requesting YAML from Gemini...");
        const geminiResponse = await getGeminiResponse(buildPromptInstruction(subject));
        const extracted = extractYaml(geminiResponse);
        if (!extracted) throw new Error("Gemini response did not include YAML.");
        yamlToSend = extracted;
        setYaml(extracted);
      } else {
        if (!yaml.trim()) throw new Error("Please enter YAML to generate.");
      }

      setStatus("Rendering diagram...");
      const res = await fetch(`${normalizedBase}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yaml: yamlToSend }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Generate failed (${res.status})`);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      setImageUrl(objectUrl);
      setImageBlob(blob);
      setFileName(parseFilename(res.headers.get("content-disposition")) || "diagram.png");
      setStatus("PNG ready");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setYaml(text);
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = fileName || "diagram.png";
    link.click();
  };

  const handleOpenInNewTab = () => {
    if (!imageUrl) return;
    // Use the existing object URL directly; open synchronously to avoid popup blockers.
    const tab = window.open("about:blank", "_blank", "noopener,noreferrer");
    if (tab) {
      tab.location.href = imageUrl;
      return;
    }
    // Fallback anchor if the tab was blocked
    const link = document.createElement("a");
    link.href = imageUrl;
    link.target = "_blank";
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyImage = async () => {
    if (!imageBlob || !navigator.clipboard?.write) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          [imageBlob.type]: imageBlob,
        }),
      ]);
    } catch (err) {
      setError(`Copy failed: ${err.message}`);
    }
  };

  const styles = `
    .diagram-shell {
      max-width: 1100px;
      margin: 0 auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .diagram-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 0.85rem;
      box-shadow: 0 10px 24px rgba(15,23,42,0.08);
    }
    .diagram-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 1rem;
    }
    .diagram-btn {
      padding: 0.75rem 1rem;
      border-radius: 12px;
      border: 1px solid #d1d5db;
      background: #111827;
      color: #fff;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s ease;
    }
    .diagram-btn.secondary {
      background: #f8fafc;
      color: #111827;
    }
    .diagram-btn[disabled] {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .diagram-input {
      width: 100%;
      min-height: 340px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 0.75rem;
      font-size: 0.95rem;
      font-family: "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      background: #f9fafb;
      box-sizing: border-box;
    }
    .diagram-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }
    .diagram-status {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      font-size: 0.95rem;
      color: #374151;
    }
    .diagram-preview {
      width: 100%;
      min-height: 320px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #f8fafc;
      display: grid;
      place-items: center;
      padding: 0.6rem;
      box-sizing: border-box;
    }
    .diagram-preview img {
      max-width: 260px;
      width: 220px;
      height: auto;
      border-radius: 12px;
      box-shadow: 0 12px 28px rgba(0,0,0,0.08);
    }
    @media (max-width: 900px) {
      .diagram-grid {
        grid-template-columns: 1fr;
      }
      .diagram-input {
        min-height: 220px;
      }
      .diagram-card {
        padding: 0.75rem;
      }
      .diagram-toolbar {
        justify-content: flex-start;
      }
      .diagram-preview {
        min-height: 220px;
      }
    }
  `;

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>
      <style>{styles}</style>
      <div className="diagram-shell">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0 }}>Architecture Diagram Generator</h2>
            <p style={{ margin: 0, color: "#4b5563" }}>
              Describe an architecture or paste YAML, then render the returned PNG from the FastAPI backend.
            </p>
          </div>
          <div className="diagram-toolbar">
            <button className="diagram-btn secondary" onClick={handleHealthCheck}>Check Health</button>
            <button className="diagram-btn secondary" onClick={() => setYaml(SAMPLE_YAML)}>Load Sample</button>
            <button className="diagram-btn secondary" onClick={() => setYaml("")}>Clear</button>
          </div>
        </div>

        <div className="diagram-card">
          <div className="diagram-grid">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <label style={{ fontWeight: 600, color: "#111827" }}>
                Prompt (optional)
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Event-driven data pipeline with S3 ingest, Lambda transforms, and Redshift analytics"
                  className="diagram-input"
                  style={{ minHeight: "120px" }}
                />
              </label>
              <div className="diagram-toolbar">
                <button
                  className="diagram-btn"
                  disabled={!prompt.trim() || loading}
                  onClick={() => handleGenerate("prompt")}
                >
                  {loading ? "Generating..." : "Generate from Prompt"}
                </button>
                <button
                  className="diagram-btn"
                  disabled={!yaml.trim() || loading}
                  onClick={() => handleGenerate("yaml")}
                >
                  {loading ? "Generating..." : "Generate from YAML"}
                </button>
                <button
                  className="diagram-btn secondary"
                  onClick={() => setPrompt("")}
                  disabled={!prompt.trim()}
                >
                  Clear Prompt
                </button>
                <span style={{ color: "#6b7280", fontSize: "0.95rem" }}>
                  Use prompt to auto-generate YAML or send your own YAML below.
                </span>
              </div>
              <label style={{ fontWeight: 600, color: "#111827" }}>
                API Base URL
                <input
                  type="text"
                  value={apiBase}
                  onChange={(e) => setApiBase(e.target.value)}
                  style={{ width: "100%", padding: "0.65rem", borderRadius: "10px", border: "1px solid #e5e7eb", marginTop: "0.35rem" }}
                  placeholder="http://143.244.214.172"
                />
              </label>
              <label style={{ fontWeight: 600, color: "#111827" }}>
                Diagram YAML
                <textarea
                  className="diagram-input"
                  value={yaml}
                  onChange={(e) => setYaml(e.target.value)}
                  placeholder="title: My architecture..."
                />
              </label>
              <div className="diagram-toolbar">
                <label className="diagram-btn secondary" style={{ cursor: "pointer" }}>
                  Upload YAML
                  <input type="file" accept=".yml,.yaml,.txt" style={{ display: "none" }} onChange={handleFileUpload} />
                </label>
              </div>
              <div className="diagram-status">
                {health && <span>Health: <strong>{health}</strong></span>}
                {error && (
                  <span style={{ color: "#dc2626", display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                    Error: {error}
                    <button
                      className="diagram-btn secondary"
                      onClick={() => setPrompt((p) => `${p ? `${p}\n` : ""}Prevent this error: ${error}`)}
                      style={{ padding: "0.35rem 0.6rem" }}
                    >
                      Add to prompt
                    </button>
                  </span>
                )}
                {imageUrl && !error && <span style={{ color: "#16a34a" }}>PNG ready</span>}
                {status && <span>{status}</span>}
                {loading && <span>Contacting renderer...</span>}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div className="diagram-preview">
                {imageUrl ? (
                  <img src={imageUrl} alt="Architecture diagram" />
                ) : (
                  <p style={{ color: "#6b7280", textAlign: "center", padding: "0 0.5rem" }}>
                    PNG output will appear here. For larger viewing, use "Open in new tab" after generating.
                  </p>
                )}
              </div>
              <div className="diagram-toolbar">
                <button className="diagram-btn secondary" disabled={!imageUrl} onClick={handleDownload}>Download</button>
                <button className="diagram-btn secondary" disabled={!imageUrl} onClick={handleOpenInNewTab}>Open in new tab</button>
                <button className="diagram-btn secondary" disabled={!imageBlob || !navigator.clipboard?.write} onClick={handleCopyImage}>Copy image</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
