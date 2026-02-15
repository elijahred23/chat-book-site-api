import React, { useMemo, useState } from "react";
import ActionButtons from "./ui/ActionButtons";
import { getGeminiResponse } from "./utils/callGemini";

const CHALLENGES = [
  {
    id: "email",
    title: "Match simple emails",
    description: "Find basic emails like name@example.com",
    sample: "Reach me at alice@example.com or bob.smith@work.io but not at example@",
    mustMatch: ["alice@example.com", "bob.smith@work.io"],
    mustNotMatch: ["example@"],
  },
  {
    id: "date",
    title: "Match YYYY-MM-DD dates",
    description: "Capture dates like 2024-12-31",
    sample: "Today is 2024-12-31, yesterday was 2024-12-30, 24-12-31 is wrong",
    mustMatch: ["2024-12-31", "2024-12-30"],
    mustNotMatch: ["24-12-31"],
  },
  {
    id: "ipv4",
    title: "IPv4 address",
    description: "Match valid IPv4 addresses (0-255 in each octet)",
    sample: "Servers: 192.168.0.1, 10.0.0.255, 256.1.1.1 (invalid), 01.02.03.04 (leading zeros?)",
    mustMatch: ["192.168.0.1", "10.0.0.255"],
    mustNotMatch: ["256.1.1.1"],
  },
  {
    id: "uuid",
    title: "UUID v4",
    description: "Match canonical UUID v4 strings",
    sample: "IDs: 123e4567-e89b-12d3-a456-426614174000, 123e4567-e89b-12d3-a456-42661417400Z (invalid)",
    mustMatch: ["123e4567-e89b-12d3-a456-426614174000"],
    mustNotMatch: ["123e4567-e89b-12d3-a456-42661417400Z"],
  },
  {
    id: "htmlTag",
    title: "HTML tags",
    description: "Match simple HTML tags (opening tags with attributes)",
    sample: "<div class=\"card\"> <img src='x.png'> <div>nested</div> </ custom>",
    mustMatch: ["<div class=\"card\">", "<img src='x.png'>"],
    mustNotMatch: ["</ custom>"],
  },
  {
    id: "currency",
    title: "Currency amounts",
    description: "Match amounts like $12.34 or €1,234.00",
    sample: "Prices: $12.34, €1,234.00, $12,34 (wrong), 12.34 (no symbol)",
    mustMatch: ["$12.34", "€1,234.00"],
    mustNotMatch: ["$12,34"],
  },
  {
    id: "hashtag",
    title: "Match hashtags",
    description: "Find hashtags with letters or numbers",
    sample: "#Regex is fun. #100DaysOfCode #C++ # space",
    mustMatch: ["#Regex", "#100DaysOfCode"],
    mustNotMatch: ["#C++", "#", "# space"],
  },
  {
    id: "url",
    title: "Match http/https URLs",
    description: "Capture links beginning with http or https",
    sample: "Docs at https://example.com/path, http://localhost:3000/test, ftp://nope",
    mustMatch: ["https://example.com/path", "http://localhost:3000/test"],
    mustNotMatch: ["ftp://nope"],
  },
];

const flagList = [
  { key: "g", label: "g (global)" },
  { key: "i", label: "i (ignore case)" },
  { key: "m", label: "m (multiline)" },
  { key: "s", label: "s (dotall)" },
  { key: "u", label: "u (unicode)" },
  { key: "y", label: "y (sticky)" },
];

const SYNTAX_DRILLS = [
  { name: "Character classes", pattern: "[A-Za-z0-9_]+", text: "User_123 matched. But * should not. ____ is blank.", note: "Bracket expressions: include sets or ranges." },
  { name: "Boundaries", pattern: "\\bcat\\b", text: "cat scatter bobcat cat.", note: "\\b matches word edges; avoids matching inside longer words." },
  { name: "Quantifiers", pattern: "a{2,4}", text: "a aa aaa aaaa aaaaa", note: "{min,max} controls repetitions." },
  { name: "Groups & alternation", pattern: "(red|green|blue)", text: "red orange green teal blue", note: "( ) capture; | alternates." },
  { name: "Lookahead", pattern: "\\w+(?=\\.)", text: "file.txt doc.pdf readme", note: "Positive lookahead matches before a following pattern." },
  { name: "Lookbehind", pattern: "(?<=\\$)\\d+(?:\\.\\d{2})?", text: "Prices: $12.00 and $9.5", note: "Match numbers preceded by $ using lookbehind." },
  { name: "Non-greedy", pattern: "<.+?>", text: "<tag>content</tag> <a>link</a>", note: "Use ? to make quantifiers lazy." },
  { name: "Anchors", pattern: "^Hello", text: "Hello world\nHi there\nHello again", note: "^ and $ anchor to start/end (multiline with m flag)." },
  { name: "POSIX classes", pattern: "[[:alpha:]]+", text: "abc123 ÄÖÜ ß", note: "POSIX-style classes in some regex engines." },
  { name: "Backreferences", pattern: "(\\b\\w+) \\1", text: "go go stop stopstop", note: "Match repeated words with \\1." },
  { name: "Named groups", pattern: "(?<area>\\d{3})-(?<num>\\d{4})", text: "Call 555-1234 or 212-9876", note: "Use (?<name> ) to name captures." },
  { name: "Conditional (engine-specific)", pattern: "(?(?=https)https?|http)://\\S+", text: "https://a.com http://b.com ftp://c.com", note: "Conditionals vary by engine; shown for advanced practice." },
  { name: "Unicode properties", pattern: "\\p{L}+", text: "Hello 你好 Привет 123", note: "Requires Unicode /u flag in many engines." },
  { name: "Atomic groups", pattern: "(?>a+)+b", text: "aaaaab aaab", note: "Atomic groups prevent backtracking; engine-dependent." },
  { name: "Word boundaries Unicode-aware", pattern: "\\bПривет\\b", text: "Привет,мир Привет мир", note: "Test boundaries with non-Latin scripts." },
];

const highlightMatches = (text, pattern, flags) => {
  if (!pattern) return text;
  try {
    const re = new RegExp(pattern, flags.includes("g") ? flags : flags + "g");
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = re.exec(text)) !== null) {
      const start = match.index;
      const end = start + (match[0]?.length || 0);
      if (end === start) {
        // avoid zero-length infinite loops
        re.lastIndex += 1;
        continue;
      }
      if (start > lastIndex) parts.push(text.slice(lastIndex, start));
      parts.push(<mark key={start} style={{ background: "#fef08a", padding: "0 2px" }}>{match[0]}</mark>);
      lastIndex = end;
    }
    if (lastIndex < text.length) parts.push(text.slice(lastIndex));
    return parts;
  } catch {
    return text;
  }
};

export default function RegexTrainer() {
  const [pattern, setPattern] = useState("\\b\\w+@\\w+\\.\\w+\\b");
  const [flags, setFlags] = useState("g");
  const [sample, setSample] = useState(CHALLENGES[0].sample);
  const [challengeId, setChallengeId] = useState(CHALLENGES[0].id);
  const [customText, setCustomText] = useState("");
  const [error, setError] = useState("");
  const [sampleLoading, setSampleLoading] = useState(false);
  const [showCheats, setShowCheats] = useState(false);
  const [activeTab, setActiveTab] = useState("practice"); // practice | syntax

  const challenge = useMemo(() => CHALLENGES.find((c) => c.id === challengeId) || CHALLENGES[0], [challengeId]);

  const activeText = customText.trim() ? customText : challenge.sample;

  const evaluation = useMemo(() => {
    if (!pattern) return null;
    try {
      const re = new RegExp(pattern, flags);
      const matchesMust = challenge.mustMatch?.map((m) => re.test(m));
      const matchesNot = challenge.mustNotMatch?.map((m) => re.test(m));
      return { matchesMust, matchesNot, ok: matchesMust?.every(Boolean) && matchesNot?.every((v) => !v) };
    } catch (err) {
      return { error: err.message };
    }
  }, [pattern, flags, challenge]);

  const toggleFlag = (key) => {
    setFlags((prev) => (prev.includes(key) ? prev.replace(key, "") : prev + key));
  };

  const handlePatternChange = (val) => {
    setPattern(val);
    try {
      new RegExp(val || ".", flags);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  const previewMatches = (drill) => {
    setCustomText(drill.text);
    setPattern(drill.pattern);
  };

  const parseJson = (text) => {
    if (!text) throw new Error("Empty response");
    const codeMatch = text.match(/```json\\s*([\\s\\S]*?)```/i);
    const raw = codeMatch?.[1] ?? text;
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace === -1 || lastBrace === -1) throw new Error("No JSON found");
    return JSON.parse(raw.slice(firstBrace, lastBrace + 1));
  };

  const generateSample = async () => {
    try {
      setSampleLoading(true);
      setError("");
      const prompt = `Return JSON only, no prose. Shape: { "sample": "text with diverse cases to test regex" }.
Create a fresh sample text for training a regex on "${challenge.title}". Include both positive and negative cases in one paragraph.`;
      const resp = await getGeminiResponse(prompt);
      const parsed = parseJson(resp);
      const newSample = parsed?.sample || "";
      if (!newSample) throw new Error("No sample in response");
      setCustomText(newSample);
    } catch (err) {
      setError(err?.message || "Failed to generate sample");
    } finally {
      setSampleLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "1rem" }}>
      <style>{`
        .regex-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 1rem; box-shadow: 0 12px 28px rgba(15,23,42,0.08); display: grid; gap: 12px; }
        .regex-grid { display: grid; gap: 10px; grid-template-columns: 1fr; }
        @media (min-width: 900px) { .regex-grid { grid-template-columns: 1.1fr 0.9fr; } }
        @media (max-width: 640px) {
          .regex-card { padding: 0.85rem; }
          .btn { width: 100%; text-align: center; }
          .flag { width: calc(50% - 6px); text-align: center; }
          .flag:last-child { width: 100%; }
          .sample-box { min-height: 120px; }
        }
        .pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border-radius: 999px; background: #eef2ff; color: #1e293b; font-weight: 700; border: 1px solid #c7d2fe; }
        .btn { padding: 0.65rem 0.9rem; border-radius: 12px; border: 1px solid #e2e8f0; background: #0f172a; color: #fff; font-weight: 700; cursor: pointer; }
        .btn.secondary { background: #f8fafc; color: #0f172a; }
        .flag { border: 1px solid #cbd5e1; border-radius: 10px; padding: 6px 10px; cursor: pointer; background: #e2e8f0; color: #0b1220; font-weight: 700; }
        .flag.active { background: #0f172a; color: #fff; border-color: #0f172a; }
        .sample-box { border: 1px solid #e2e8f0; border-radius: 12px; padding: 10px; background: #f8fafc; min-height: 160px; }
        .input { width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; font-family: "SFMono-Regular", Menlo, Consolas, monospace; }
        .cheat-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.65); backdrop-filter: blur(6px); display: grid; place-items: center; z-index: 10000; }
        .cheat-card { max-width: 760px; width: calc(100% - 2rem); background: #0f172a; color: #e2e8f0; border-radius: 18px; padding: 1.2rem; box-shadow: 0 18px 40px rgba(0,0,0,0.35); border: 1px solid rgba(226,232,240,0.2); }
        .cheat-grid { display: grid; gap: 8px; grid-template-columns: repeat(auto-fit, minmax(220px,1fr)); }
        .cheat-item { background: rgba(226,232,240,0.08); border: 1px solid rgba(226,232,240,0.15); border-radius: 12px; padding: 10px; }
        .cheat-item code { color: #bae6fd; font-weight: 700; }
        @media (max-width: 640px) {
          .cheat-card { width: calc(100% - 1rem); padding: 1rem; }
          .cheat-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="regex-card">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className={`btn ${activeTab === "practice" ? "" : "secondary"}`} type="button" onClick={() => setActiveTab("practice")}>
            Practice & Challenges
          </button>
          <button className={`btn ${activeTab === "syntax" ? "" : "secondary"}`} type="button" onClick={() => setActiveTab("syntax")}>
            Syntax Drills
          </button>
        </div>

        {activeTab === "practice" && (
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h2 style={{ margin: 0 }}>Regex Trainer</h2>
            <div style={{ color: "#475569" }}>Write patterns, test against samples, and tackle curated challenges.</div>
          </div>
          <ActionButtons promptText={pattern} limitButtons />
        </div>
        )}

        {activeTab === "practice" && (
        <div className="regex-grid">
          <div style={{ display: "grid", gap: 10 }}>
            <label style={{ fontWeight: 700 }}>Pattern</label>
            <input
              className="input"
              value={pattern}
              onChange={(e) => handlePatternChange(e.target.value)}
              placeholder="e.g., \\b[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}\\b"
            />
            {error && <div style={{ color: "#b91c1c", fontWeight: 700 }}>{error}</div>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {flagList.map((f) => (
                <button
                  key={f.key}
                  className={`flag ${flags.includes(f.key) ? "active" : ""}`}
                  onClick={() => toggleFlag(f.key)}
                  type="button"
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              <label style={{ fontWeight: 700 }}>Sample text</label>
              <textarea
                className="input"
                style={{ minHeight: 140 }}
                value={customText || challenge.sample}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Paste or type text to test your regex"
              />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className="btn secondary" type="button" onClick={generateSample} disabled={sampleLoading}>
                  {sampleLoading ? "Generating…" : "Generate sample with Gemini"}
                </button>
                {customText && (
                  <button className="btn secondary" type="button" onClick={() => setCustomText("")}>
                    Reset to challenge sample
                  </button>
                )}
                <button className="btn secondary" type="button" onClick={() => setShowCheats(true)}>
                  Regex syntax reference
                </button>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Matches</div>
              <div className="sample-box">
                {highlightMatches(activeText, pattern, flags)}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <label style={{ fontWeight: 700 }}>Challenge</label>
            <select
              className="input"
              style={{ fontFamily: "Inter, system-ui" }}
              value={challengeId}
              onChange={(e) => {
                const next = e.target.value;
                setChallengeId(next);
                const c = CHALLENGES.find((ch) => ch.id === next);
                setSample(c?.sample || "");
                setCustomText("");
              }}
            >
              {CHALLENGES.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <div style={{ background: "#f1f5f9", borderRadius: 12, padding: 10, border: "1px solid #e2e8f0" }}>
              <div style={{ fontWeight: 700 }}>{challenge.title}</div>
              <div style={{ color: "#475569", marginTop: 4 }}>{challenge.description}</div>
              <div style={{ marginTop: 8 }}>
                <strong>Must match:</strong>
                <ul style={{ margin: "4px 0 0 16px" }}>
                  {challenge.mustMatch?.map((m) => <li key={m}>{m}</li>)}
                </ul>
                <strong>Must NOT match:</strong>
                <ul style={{ margin: "4px 0 0 16px" }}>
                  {challenge.mustNotMatch?.map((m) => <li key={m}>{m}</li>)}
                </ul>
              </div>
              {evaluation?.error && <div style={{ color: "#b91c1c", fontWeight: 700, marginTop: 6 }}>{evaluation.error}</div>}
              {!evaluation?.error && (
                <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span className="pill" style={{ background: evaluation?.ok ? "#dcfce7" : "#fee2e2", borderColor: evaluation?.ok ? "#22c55e" : "#ef4444" }}>
                    {evaluation?.ok ? "Challenge passing" : "Keep refining"}
                  </span>
                  <span className="pill">Matches required: {evaluation?.matchesMust?.filter(Boolean).length ?? 0}/{challenge.mustMatch?.length}</span>
                  <span className="pill">Blocking errors: {evaluation?.matchesNot?.filter(Boolean).length ?? 0}</span>
                </div>
              )}
            </div>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Tips</div>
              <ul style={{ color: "#475569", lineHeight: 1.5, marginLeft: 18 }}>
                <li>Start small, then add anchors (^, $) and groups.</li>
                <li>Use non-greedy patterns like <code>.+?</code> when needed.</li>
                <li>Test with and without the <code>g</code> flag to see match differences.</li>
                <li>Beware of catastrophic backtracking; prefer explicit character classes.</li>
              </ul>
            </div>
          </div>
        </div>
        )}

        {activeTab === "syntax" && (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div>
                <h2 style={{ margin: 0 }}>Syntax Drills</h2>
                <div style={{ color: "#475569" }}>Pick a regex construct and practice with curated text.</div>
              </div>
              <button className="btn secondary" type="button" onClick={() => setShowCheats(true)}>
                View syntax reference
              </button>
            </div>
            <div className="cheat-grid">
              {SYNTAX_DRILLS.map((d) => (
                <div key={d.name} className="cheat-item" style={{ background: "#f8fafc", color: "#0f172a", borderColor: "#e2e8f0" }}>
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>{d.name}</div>
                  <div style={{ color: "#475569", marginBottom: 6 }}>{d.note}</div>
                  <div style={{ fontFamily: "'SFMono-Regular', Menlo, Consolas, monospace", marginBottom: 6 }}>
                    Pattern: <code style={{ color: "#0f172a" }}>{d.pattern}</code>
                  </div>
                  <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 8, background: "#fff", minHeight: 80 }}>
                    {highlightMatches(d.text, pattern === d.pattern ? pattern : d.pattern, flags)}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                    <button
                      className="btn secondary"
                      type="button"
                      onClick={() => {
                        handlePatternChange(d.pattern);
                        setCustomText(d.text);
                        setActiveTab("practice");
                      }}
                    >
                      Load into editor
                    </button>
                    <button
                      className="btn secondary"
                      type="button"
                      onClick={() => previewMatches(d)}
                    >
                      Preview here
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showCheats && (
        <div className="cheat-overlay" onClick={() => setShowCheats(false)}>
          <div className="cheat-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Regex Syntax Reference</h3>
              <button className="btn secondary" type="button" onClick={() => setShowCheats(false)}>Close</button>
            </div>
            <div className="cheat-grid">
              <div className="cheat-item"><code>.</code> any char (except newline by default)</div>
              <div className="cheat-item"><code>\\d</code> digit • <code>\\w</code> word • <code>\\s</code> whitespace</div>
              <div className="cheat-item"><code>\\D</code> not digit • <code>\\W</code> not word • <code>\\S</code> not whitespace</div>
              <div className="cheat-item"><code>[abc]</code> any of a,b,c • <code>[^abc]</code> none of a,b,c</div>
              <div className="cheat-item"><code>a?</code> 0 or 1 • <code>a*</code> 0+ • <code>a+</code> 1+</div>
              <div className="cheat-item"><code>a{`{3}`}</code> exactly 3 • <code>a{`{2,4}`}</code> 2 to 4 • <code>a{`{2,}`}</code> 2 or more</div>
              <div className="cheat-item"><code>^</code> start • <code>$</code> end • <code>\\b</code> word boundary</div>
              <div className="cheat-item"><code>( )</code> capture group • <code>(?: )</code> non-capture</div>
              <div className="cheat-item"><code>|</code> alternation: this OR that</div>
              <div className="cheat-item"><code>(?=...)</code> positive lookahead • <code>(?!...)</code> negative lookahead</div>
              <div className="cheat-item"><code>(?&lt;=...)</code> lookbehind • <code>(?&lt;!...)</code> negative lookbehind</div>
              <div className="cheat-item"><code>(?i)</code> inline ignore-case • <code>(?m)</code> multiline</div>
              <div className="cheat-item"><code>.+?</code> lazy quantifier (minimal match)</div>
              <div className="cheat-item"><code>\\</code> escape special chars like <code>\\. \\* \\?</code></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
