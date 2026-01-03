import React, { useMemo, useState } from "react";
import conceptsData from "./system_design/concepts.json";
import boeData from "./system_design/concepts-boe.json";
import sdiData from "./system_design/concepts-sdi-framework.json";
import rateLimitingData from "./system_design/concepts-rate-limiting.json";
import hashingData from "./system_design/concepts-consistent-hashing.json";
import kvStoreData from "./system_design/concepts-key-value-store.json";
import uidData from "./system_design/concepts-uid-generation.json";
import urlShortenerData from "./system_design/concepts-url-shortener.json";
import webCrawlerData from "./system_design/concepts-web-crawler.json";
import notificationData from "./system_design/concepts-notification-system.json";
import newsfeedData from "./system_design/concepts-newsfeed.json";
import chatSystemData from "./system_design/concepts-chat-system.json";
import searchAutocompleteData from "./system_design/concepts-search-autocomplete.json";
import videoStreamingData from "./system_design/concepts-video-streaming.json";
import cloudStorageData from "./system_design/concepts-cloud-storage.json";
import learningRoadmapData from "./system_design/concepts-learning-roadmap.json";
import ActionButtons from "./ui/ActionButtons.jsx";
import { useFlyout } from "./context/FlyoutContext";

function shuffle(arr = []) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function LieFinderGame({ truths = [], pool = [], gameKey }) {
  const [playing, setPlaying] = useState(false);
  const [options, setOptions] = useState([]);
  const [lie, setLie] = useState("");
  const [feedback, setFeedback] = useState("");
  const { showMessage } = useFlyout();

  if (truths.length < 2 || pool.length === 0) return null;

  const start = () => {
    const truthsPicked = shuffle(truths).slice(0, 2);
    const lieCandidate = shuffle(pool.filter((p) => !truths.includes(p)))[0];
    if (!lieCandidate) {
      setPlaying(false);
      return;
    }
    const opts = shuffle([...truthsPicked, lieCandidate]);
    setOptions(opts);
    setLie(lieCandidate);
    setFeedback("");
    setPlaying(true);
  };

  const check = (choice) => {
    const ok = choice === lie;
    setFeedback(ok ? "✅ You found the lie!" : "❌ That's actually true here.");
    showMessage?.({
      type: ok ? "success" : "error",
      message: ok ? "Nice catch!" : "Try picking the statement that doesn't belong.",
      duration: 2000,
    });
  };

  return (
    <div className="cp-card" style={{ padding: 10, background: "#f0fdf4", border: "1px dashed #bbf7d0" }} key={gameKey}>
      {!playing ? (
        <button className="cp-btn" onClick={start} style={{ width: "100%", justifyContent: "center" }}>
          Play Two Truths & a Lie
        </button>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button className="cp-btn" onClick={() => check(lie)}>Reveal Lie</button>
            <button className="cp-btn secondary" onClick={start}>New Round</button>
            <button className="cp-btn secondary" onClick={() => { setPlaying(false); setFeedback(""); }}>Close</button>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {options.map((opt, idx) => (
              <button
                key={`${gameKey}-${idx}`}
                onClick={() => check(opt)}
                style={{
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  fontSize: 13,
                  color: "#0f172a",
                  cursor: "pointer",
                }}
              >
                {opt}
              </button>
            ))}
          </div>
          {feedback && <div style={{ fontWeight: 700, color: feedback.startsWith("✅") ? "#16a34a" : "#dc2626" }}>{feedback}</div>}
        </div>
      )}
    </div>
  );
}

function FillWordGame({ items = [], gameKey }) {
  const [playing, setPlaying] = useState(false);
  const [line, setLine] = useState("");
  const [missing, setMissing] = useState("");
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState("");
  const { showMessage } = useFlyout();
  if (!items.length) return null;

  const start = () => {
    const poolLine = items[Math.floor(Math.random() * items.length)];
    const words = poolLine.split(/\s+/).filter(Boolean);
    if (words.length < 2) {
      setPlaying(false);
      return;
    }
    const target = words[Math.floor(Math.random() * words.length)];
    const distractorPool = items.join(" ").split(/\s+/).filter(Boolean).filter((w) => w !== target);
    const distractors = shuffle(distractorPool).filter((w, i, arr) => arr.indexOf(w) === i).slice(0, 2);
    const opts = shuffle([target, ...distractors]);
    setLine(poolLine);
    setMissing(target);
    setOptions(opts);
    setFeedback("");
    setPlaying(true);
  };

  const check = (choice) => {
    const ok = choice === missing;
    setFeedback(ok ? "✅ Correct word!" : "❌ Try again.");
    showMessage?.({
      type: ok ? "success" : "error",
      message: ok ? "Nice!" : "Pick a different word.",
      duration: 2000,
    });
  };

  const renderLine = () => line.split(/\s+/).map((w) => (w === missing ? "____" : w)).join(" ");

  return (
    <div className="cp-card" style={{ padding: 10, background: "#fef2f2", border: "1px dashed #fecdd3" }} key={gameKey}>
      {!playing ? (
        <button className="cp-btn" onClick={start} style={{ width: "100%", justifyContent: "center" }}>
          Play Word Game
        </button>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button className="cp-btn" onClick={start}>New Round</button>
            <button className="cp-btn secondary" onClick={() => setPlaying(false)}>Close</button>
          </div>
          <div style={{ background: "#fff", border: "1px solid #fecdd3", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ fontSize: 13 }}>{renderLine()}</div>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {options.map((opt, idx) => (
              <button
                key={`${gameKey}-opt-${idx}`}
                onClick={() => check(opt)}
                style={{
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  fontSize: 13,
                  color: "#0f172a",
                  cursor: "pointer",
                }}
              >
                {opt}
              </button>
            ))}
          </div>
          {feedback && <div style={{ fontWeight: 700, color: feedback.startsWith("✅") ? "#16a34a" : "#dc2626" }}>{feedback}</div>}
        </div>
      )}
    </div>
  );
}

function SectionGuessGame({ sectionName = "", sectionPoints = [], allSectionNames = [], gameKey }) {
  const [playing, setPlaying] = useState(false);
  const [statement, setStatement] = useState("");
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState("");
  const { showMessage } = useFlyout();

  if (!sectionName || !sectionPoints.length || allSectionNames.length < 2) return null;

  const start = () => {
    const stmt = sectionPoints[Math.floor(Math.random() * sectionPoints.length)];
    const others = shuffle(allSectionNames.filter((n) => n !== sectionName)).slice(0, 2);
    const opts = shuffle([sectionName, ...others]);
    setStatement(stmt);
    setOptions(opts);
    setFeedback("");
    setPlaying(true);
  };

  const check = (choice) => {
    const ok = choice === sectionName;
    setFeedback(ok ? "✅ Correct section!" : "❌ Try another section.");
    showMessage?.({
      type: ok ? "success" : "error",
      message: ok ? "Nice — you matched the right section." : "Pick the section this statement belongs to.",
      duration: 2000,
    });
  };

  return (
    <div className="cp-card" style={{ padding: 10, background: "#eef2ff", border: "1px dashed #c7d2fe" }} key={gameKey}>
      {!playing ? (
        <button className="cp-btn" onClick={start} style={{ width: "100%", justifyContent: "center" }}>
          Guess the Section
        </button>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button className="cp-btn" onClick={start}>New Prompt</button>
            <button className="cp-btn secondary" onClick={() => setPlaying(false)}>Close</button>
          </div>
          <div style={{ background: "#fff", border: "1px solid #c7d2fe", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ fontSize: 13 }}>{statement}</div>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {options.map((opt, idx) => (
              <button
                key={`${gameKey}-sec-${idx}`}
                onClick={() => check(opt)}
                style={{
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  fontSize: 13,
                  color: "#0f172a",
                  cursor: "pointer",
                }}
              >
                {opt}
              </button>
            ))}
          </div>
          {feedback && <div style={{ fontWeight: 700, color: feedback.startsWith("✅") ? "#16a34a" : "#dc2626" }}>{feedback}</div>}
        </div>
      )}
    </div>
  );
}

function GlobalPointGuessGame({ concepts = [], gameKey }) {
  const [current, setCurrent] = useState(null);
  const [options, setOptions] = useState([]);
  const [feedback, setFeedback] = useState("");
  const { showMessage } = useFlyout();

  if (!concepts.length) return null;

  const start = () => {
    const entries = [];
    concepts.forEach((c) => c.sections?.forEach((s) => (s.points || []).forEach((p) => entries.push({ point: p, concept: c.title, section: s.name }))));
    if (!entries.length) return;
    const pick = entries[Math.floor(Math.random() * entries.length)];
    const distractors = shuffle(concepts.map((c) => c.title).filter((t) => t !== pick.concept)).slice(0, 2);
    const opts = shuffle([pick.concept, ...distractors]);
    setCurrent(pick);
    setOptions(opts);
    setFeedback("");
  };

  const check = (choice) => {
    if (!current) return;
    const ok = choice === current.concept;
    setFeedback(ok ? "✅ Correct concept!" : `❌ Belongs to: ${current.concept}`);
    showMessage?.({
      type: ok ? "success" : "error",
      message: ok ? "Nice recall!" : "Try another concept title.",
      duration: 2000,
    });
  };

  return (
    <div className="cp-card" style={{ padding: 10, background: "#fff7ed", border: "1px dashed #fed7aa" }} key={gameKey}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontWeight: 900 }}>Concept Guess</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button className="cp-btn" onClick={start}>New Prompt</button>
          {current && <button className="cp-btn secondary" onClick={() => { setCurrent(null); setFeedback(""); }}>Clear</button>}
        </div>
      </div>
      {current ? (
        <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
          <div style={{ background: "#fff", border: "1px solid #fed7aa", borderRadius: 8, padding: "8px 10px" }}>
            <div style={{ fontSize: 13 }}>{current.point}</div>
            <div className="cp-muted" style={{ fontSize: 12, marginTop: 4 }}>Section: {current.section}</div>
          </div>
          <div style={{ display: "grid", gap: 6 }}>
            {options.map((opt, idx) => (
              <button
                key={`${gameKey}-global-${idx}`}
                onClick={() => check(opt)}
                style={{
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: 8,
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  fontSize: 13,
                  color: "#0f172a",
                  cursor: "pointer",
                }}
              >
                {opt}
              </button>
            ))}
          </div>
          {feedback && <div style={{ fontWeight: 700, color: feedback.startsWith("✅") ? "#16a34a" : "#dc2626" }}>{feedback}</div>}
        </div>
      ) : (
        <div className="cp-muted" style={{ marginTop: 6 }}>Generate a prompt to guess which concept this point belongs to.</div>
      )}
    </div>
  );
}

export default function SystemDesignPrep() {
  const dataSets = [
    conceptsData,
    boeData,
    hashingData,
    sdiData,
    rateLimitingData,
    kvStoreData,
    uidData,
    urlShortenerData,
    webCrawlerData,
    notificationData,
    newsfeedData,
    chatSystemData,
    searchAutocompleteData,
    videoStreamingData,
    cloudStorageData,
    learningRoadmapData,
  ]
    .filter(Boolean)
    .map((ds, idx) => ({
      id: ds?.meta?.id ?? `ds-${idx}`,
      order: ds?.meta?.order ?? idx,
      title: ds?.meta?.topic ?? "Untitled",
      data: ds,
    }))
    .sort((a, b) => a.order - b.order);

  const [activeDatasetId, setActiveDatasetId] = useState(dataSets[0]?.id ?? "");

  const activeDataset = dataSets.find((d) => d.id === activeDatasetId) ?? dataSets[0];
  const concepts = activeDataset?.data?.concepts ?? [];
  const allPoints = useMemo(() => {
    const pts = [];
    concepts.forEach((c) => c.sections?.forEach((s) => (s.points || []).forEach((p) => pts.push(p))));
    return pts;
  }, [concepts]);
  const sectionNames = useMemo(() => {
    const names = [];
    concepts.forEach((c) => c.sections?.forEach((s) => names.push(s.name)));
    return names;
  }, [concepts]);

  const flatSummary = useMemo(() => {
    const allPoints = [];
    concepts.forEach((c) => {
      c.sections?.forEach((s) => {
        s.points?.forEach((p) => allPoints.push(`${s.name}: ${p}`));
      });
    });
    return allPoints.join("\n");
  }, [concepts]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px", display: "grid", gap: 12 }}>
      <div className="cp-card" style={{ display: "grid", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0 }}>System Design Prep</h2>
            <div className="cp-muted">Pick a lesson set, study the cards, and practice quick estimations.</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <label className="cp-muted" style={{ fontWeight: 800 }}>Lesson Set</label>
            <select
              className="cp-select"
              value={activeDatasetId}
              onChange={(e) => setActiveDatasetId(e.target.value)}
            >
      {dataSets.map((d) => (
        <option key={d.id} value={d.id}>
          {d.order + 1}. {d.title}
        </option>
      ))}
    </select>
    <ActionButtons promptText={`System Design Prep\n\n${flatSummary}`} limitButtons />
  </div>
</div>
      </div>

      <GlobalPointGuessGame concepts={concepts} gameKey={`${activeDatasetId}:global-concept-guess`} />

      {concepts.map((concept) => (
        <div key={concept.id} className="cp-card" style={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h3 style={{ margin: 0 }}>{concept.title}</h3>
              <div className="cp-muted" style={{ marginTop: 4 }}>{concept.summary}</div>
            </div>
            <ActionButtons promptText={`${concept.title}\n\n${concept.summary}`} limitButtons />
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {concept.sections?.map((section) => (
              <div key={section.name} className="cp-q" style={{ background: "#f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 900 }}>{section.name}</div>
                  <ActionButtons promptText={`${section.name}\n${section.points?.join("\n") || ""}`} limitButtons />
                </div>
                <ul style={{ margin: "8px 0 0 0", paddingLeft: 18, color: "#0f172a" }}>
                  {(section.points || []).map((point, idx) => (
                    <li key={idx} style={{ marginBottom: 4, lineHeight: 1.45 }}>{point}</li>
                  ))}
                </ul>
                <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                  <LieFinderGame
                    truths={section.points || []}
                    pool={allPoints.filter((p) => !(section.points || []).includes(p))}
                    gameKey={`${activeDatasetId}:${concept.id}:${section.name}:lie`}
                  />
                  <FillWordGame items={section.points || []} gameKey={`${activeDatasetId}:${concept.id}:${section.name}:fill`} />
                  <SectionGuessGame
                    sectionName={section.name}
                    sectionPoints={section.points || []}
                    allSectionNames={sectionNames}
                    gameKey={`${activeDatasetId}:${concept.id}:${section.name}:guess-section`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
