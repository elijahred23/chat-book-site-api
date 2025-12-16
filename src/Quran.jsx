import React, { useEffect, useState, useMemo } from 'react';
import { ClipLoader } from 'react-spinners';
import ReactMarkdown from 'react-markdown';
import { getGeminiResponse } from "./utils/callGemini";
import CopyButton from './ui/CopyButton';
import { actions, useAppDispatch } from './context/AppContext';
import AutoScroller from './ui/AutoScroller';
import ActionButtons from './ui/ActionButtons';
const Quran = () => {
  const [quranData, setQuranData] = useState(() => {
    try {
      const cached = localStorage.getItem("quran_surahs");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [selectedSurahNumber, setSelectedSurahNumber] = useState(() => {
    const stored = localStorage.getItem("selectedSurahNumber");
    return stored ? parseInt(stored, 10) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [promptResponses, setPromptResponses] = useState([]);
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedSegments, setSelectedSegments] = useState([]);
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState("read"); // "read" or "prompt"
  const [showAllPrompts, setShowAllPrompts] = useState(false);

  const promptSuggestions = [
    { label: "Summary", value: "Summarize this Surah" },
    { label: "Key Points", value: "Extract key points from this Surah" },
    { label: "Simple", value: "Explain this Surah simply" },
    { label: "Elaborate", value: "Elaborate on this Surah" },
    { label: "Historical Context", value: "Provide historical context for this Surah" },
    { label: "Themes", value: "List the main themes in this Surah" },
    { label: "Lessons", value: "Extract lessons and morals from this Surah" },
    { label: "Connections", value: "Explain how this Surah connects to others" },
    { label: "Keywords", value: "Identify key terms and concepts in this Surah" },
  ];

  const promptResponsesText = useMemo(() => promptResponses.join('\n\n'), [promptResponses]);
  // Fetch Quran data on load (cache in localStorage)
  useEffect(() => {
    if (quranData) {
      setLoading(false);
      return;
    }
    fetch('https://api.alquran.cloud/v1/quran/en.asad')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch Quran data');
        }
        return res.json();
      })
      .then((data) => {
        setQuranData(data.data.surahs);
        localStorage.setItem("quran_surahs", JSON.stringify(data.data.surahs));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [quranData]);

  // Set selected surah once data is available
  useEffect(() => {
    if (!quranData || selectedSurah) return;
    const initial =
      (selectedSurahNumber && quranData.find((s) => s.number === selectedSurahNumber)) ||
      quranData[0];
    setSelectedSurah(initial);
  }, [quranData, selectedSurah, selectedSurahNumber]);

  const chunkIntoSentences = (text, maxWords = 5000) => {
    const sentences = text.match(/[^.!?]+[.!?]+|\S+/g) || [text];
    const chunks = [];
    let buffer = [];
    let count = 0;
    sentences.forEach((s) => {
      const words = s.trim().split(/\s+/).filter(Boolean).length;
      if (count + words > maxWords && buffer.length) {
        chunks.push(buffer.join(" ").trim());
        buffer = [s];
        count = words;
      } else {
        buffer.push(s);
        count += words;
      }
    });
    if (buffer.length) chunks.push(buffer.join(" ").trim());
    return chunks;
  };

  const splitAyahSmart = (text, maxLen = 220) => {
    if (!text) return [];
    if (text.length <= maxLen) return [text];
    const sentences = text.split(/(?<=[.!?])\s+/);
    const chunks = [];
    let buffer = "";
    sentences.forEach((s) => {
      if ((buffer + " " + s).trim().length > maxLen && buffer) {
        chunks.push(buffer.trim());
        buffer = s;
      } else {
        buffer = buffer ? `${buffer} ${s}` : s;
      }
    });
    if (buffer.trim()) chunks.push(buffer.trim());
    return chunks;
  };

  const allSegments = useMemo(() => {
    if (!selectedSurah) return [];
    return selectedSurah.ayahs.flatMap((ayah) =>
      splitAyahSmart(ayah.text).map((chunk, idx) => ({
        key: `${ayah.number}-${idx}`,
        text: chunk,
        start: ayah.numberInSurah,
        idx,
        label: `${ayah.numberInSurah}`,
      }))
    );
  }, [selectedSurah]);

  const groupsOfTen = useMemo(() => {
    const groups = [];
    for (let i = 0; i < allSegments.length; i += 10) {
      groups.push(allSegments.slice(i, i + 10));
    }
    return groups;
  }, [allSegments]);

  const selectedText = useMemo(() => selectedSegments.map((s) => s.text).join(' '), [selectedSegments]);
  const selectedPromptText = useMemo(() => {
    if (!selectedSurah) return selectedText;
    const header = selectedSegments.length ? `${selectedSurah.englishName} (Surah ${selectedSurah.number})\n` : "";
    return header + selectedSegments.map((s) => `${s.label ? `${s.label}: ` : ""}${s.text}`).join(' ');
  }, [selectedSegments, selectedSurah]);

  const executePrompt = async () => {
    if (!selectedSurah || !prompt) return;
    try {
      setLoadingPrompt(true);
      setProgress(0);
      const content = selectedSegments.length
        ? selectedText
        : selectedSurah.ayahs.map(ayah => `${ayah.numberInSurah}. ${ayah.text}`).join(' ');
      const chunks = chunkIntoSentences(content, 5000);
      const responses = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const resp = await getGeminiResponse(`${prompt}\n\nContent:\n${chunk}`);
        responses.push(resp);
        setProgress(Math.round(((i + 1) / chunks.length) * 100));
      }
      setPromptResponses(responses);
      setActiveTab("prompt");
    } catch (err) {
      console.error("Gemini error:", err);
    } finally {
      setLoadingPrompt(false);
    }
  };


  // Handle surah selection
  const handleSurahChange = (e) => {
    const surahNumber = parseInt(e.target.value);
    const surah = quranData.find((s) => s.number === surahNumber);
    setSelectedSurah(surah);
    setSelectedSurahNumber(surahNumber);
    localStorage.setItem("selectedSurahNumber", surahNumber);
    setSelectedSegments([]);
  };

  if (loading) return <ClipLoader color="#000" loading={loading} size={50} />;
  if (error) return <div style={{ padding: 20, color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem' }}>
      <style>{`
        .q-shell {
          background: linear-gradient(145deg, #f8fafc, #e2e8f0);
          color: #0f172a;
          border-radius: 18px;
          padding: 1.25rem;
          box-shadow: 0 20px 48px rgba(15,23,42,0.15);
        }
        .card {
          background: #ffffff;
          border: 1px solid rgba(148,163,184,0.35);
          border-radius: 14px;
          padding: 1rem;
          color: #0f172a;
        }
        .tab-bar {
          display: flex;
          gap: 8px;
          margin: 12px 0;
        }
        .tab-btn {
          flex: 1;
          padding: 0.55rem 0.75rem;
          border-radius: 12px;
          border: 1px solid rgba(148,163,184,0.35);
          background: #f8fafc;
          color: #0f172a;
          cursor: pointer;
        }
        .tab-btn.active {
          background: linear-gradient(135deg, #2563eb, #22d3ee);
          color: #0b1220;
          border-color: transparent;
          box-shadow: 0 10px 24px rgba(34,211,238,0.25);
        }
        .input, .textarea, select {
          width: 100%;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #0f172a;
          box-sizing: border-box;
        }
        .btn {
          padding: 0.6rem 0.9rem;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background: #f8fafc;
          color: #0f172a;
          cursor: pointer;
        }
        .btn.primary {
          background: linear-gradient(135deg, #2563eb, #22d3ee);
          color: #0b1220;
          border: none;
        }
        .suggestion-btn {
          padding: 0.45rem 0.75rem;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background: #f1f5f9;
          color: #0f172a;
        }
      `}</style>

      <div className="q-shell">
        <h1 style={{ margin: 0 }}>📖 Quran Viewer (Asad Translation)</h1>

        <div className="card" style={{ marginTop: '12px' }}>
          <label htmlFor="surah-select" style={{ fontWeight: 700, display: 'block', marginBottom: '6px' }}>Select Surah</label>
          <select id="surah-select" onChange={handleSurahChange} value={selectedSurah?.number || ''}>
            {quranData.map((surah) => (
              <option key={surah.number} value={surah.number}>
                {surah.number}. {surah.englishName} ({surah.englishNameTranslation})
              </option>
            ))}
          </select>
        </div>

        <div className="tab-bar">
          <button className={`tab-btn ${activeTab === "read" ? "active" : ""}`} onClick={() => setActiveTab("read")}>Read</button>
          <button className={`tab-btn ${activeTab === "prompt" ? "active" : ""}`} onClick={() => setActiveTab("prompt")}>Prompt Responses</button>
        </div>

        {activeTab === "read" && selectedSurah && (
          <div className="card" style={{ display: 'grid', gap: '12px' }}>
            <div>
              <h2 style={{ margin: 0 }}>{selectedSurah.name} ({selectedSurah.englishName})</h2>
              <p style={{ margin: '4px 0', color: '#cbd5e1' }}>{selectedSurah.englishNameTranslation} • {selectedSurah.revelationType}</p>
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              <input
                className="input"
                value={prompt}
                placeholder="Prompt (e.g. Summarize this Surah)"
                onChange={(e) => setPrompt(e.target.value)}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(showAllPrompts ? promptSuggestions : promptSuggestions.slice(0, 4)).map((text, index) => (
                  <button key={index} onClick={() => setPrompt(text.value)} className="suggestion-btn">{text.label}</button>
                ))}
                <button
                  className="suggestion-btn"
                  onClick={() => setShowAllPrompts((v) => !v)}
                  style={{ fontWeight: 700 }}
                >
                  {showAllPrompts ? "Show Less" : "Show More"}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  className="btn primary"
                  onClick={executePrompt}
                  disabled={loadingPrompt || !prompt}
                  style={{ position: 'relative', overflow: 'hidden' }}
                >
                  {loadingPrompt ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <ClipLoader size={12} color="#0b1220" /> Processing…
                    </span>
                  ) : (
                    "Execute Prompt"
                  )}
                </button>
                <ActionButtons promptText={selectedSegments.length ? selectedPromptText : `${selectedSurah.englishName} (Surah ${selectedSurah.number}): ${selectedSurah.ayahs.map(a => `${a.numberInSurah}: ${a.text}`).join(' ')}`} />
                <div style={{ fontSize: '0.9rem', color: '#334155', display: 'grid', gap: 8 }}>
                  <span>{selectedSegments.length > 0 ? `${selectedSegments.length} segments selected` : 'No specific segments selected'}</span>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      className="btn"
                      onClick={() => {
                        if (selectedSegments.length) {
                          setSelectedSegments([]);
                          return;
                        }
                        setSelectedSegments(allSegments);
                      }}
                    >
                      {selectedSegments.length ? "Deselect All" : "Select All"}
                    </button>
                    {groupsOfTen.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        {groupsOfTen.map((group, idx) => {
                          const labelStart = group[0]?.start || idx * 10 + 1;
                          const labelEnd = labelStart + group.length - 1;
                          const allSelected = group.every((g) => selectedSegments.some((s) => s.key === g.key));
                          return (
                            <button
                              key={idx}
                              className="btn"
                              style={{
                                background: allSelected ? 'linear-gradient(135deg,#2563eb,#60a5fa)' : '#f8fafc',
                                color: allSelected ? '#fff' : '#0f172a',
                                borderColor: allSelected ? '#2563eb' : '#cbd5e1',
                              }}
                              onClick={() => {
                                setSelectedSegments((prev) => {
                                  const prevKeys = new Set(prev.map((p) => p.key));
                                  const groupKeys = new Set(group.map((g) => g.key));
                                  const allIn = group.every((g) => prevKeys.has(g.key));
                                  if (allIn) {
                                    return prev.filter((p) => !groupKeys.has(p.key));
                                  }
                                  const merged = [...prev];
                                  group.forEach((g) => {
                                    if (!prevKeys.has(g.key)) merged.push(g);
                                  });
                                  return merged;
                                });
                              }}
                            >
                              {labelStart}-{labelEnd}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {loadingPrompt && (
                <div style={{ marginTop: '8px' }}>
                  <label style={{ fontWeight: 'bold' }}>Processing chunks... {progress}%</label>
                  <div style={{ height: 10, borderRadius: 8, background: '#e2e8f0', overflow: 'hidden', marginTop: 4 }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(135deg,#2563eb,#22d3ee)', transition: 'width 0.2s ease' }} />
                  </div>
                </div>
              )}
            </div>

            <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '10px', background: '#ffffff' }}>
              {selectedSurah.ayahs.map((ayah) => {
                const chunks = splitAyahSmart(ayah.text);
                return (
                  <div key={ayah.number} style={{ margin: '0.6rem 0', lineHeight: 1.6, paddingBottom: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                      {ayah.numberInSurah}.
                    </div>
                    {chunks.map((chunk, idx) => {
                      const key = `${ayah.number}-${idx}`;
                      const isSelected = selectedSegments.some((s) => s.key === key);
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setSelectedSegments((prev) =>
                              prev.some((s) => s.key === key)
                                ? prev.filter((s) => s.key !== key)
                                : [...prev, { key, text: chunk, label: `${ayah.numberInSurah}` }]
                            );
                          }}
                          style={{
                            display: 'grid',
                            gap: 6,
                            marginBottom: 10,
                            padding: '10px 12px',
                            borderRadius: 12,
                            background: isSelected ? 'linear-gradient(135deg,#e0f2fe,#eef2ff)' : '#f8fafc',
                            border: `1px solid ${isSelected ? '#93c5fd' : '#e2e8f0'}`,
                            boxShadow: isSelected ? '0 6px 18px rgba(59,130,246,0.15)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <div style={{ color: '#0f172a' }}>
                            {chunk}
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            {isSelected && (
                              <span style={{ padding: '4px 8px', borderRadius: 999, background: '#1d4ed8', color: '#fff', fontSize: '0.78rem', fontWeight: 700 }}>
                                Selected
                              </span>
                            )}
                            <ActionButtons limitButtons promptText={`${selectedSurah.englishName} (Surah ${selectedSurah.number}) - ${ayah.numberInSurah}: ${chunk}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loadingPrompt && (
          <div style={{ marginTop: '10px' }}>
            <label style={{ fontWeight: 'bold' }}>Processing chunks... {progress}%</label>
            <div style={{ height: 10, borderRadius: 8, background: '#e2e8f0', overflow: 'hidden', marginTop: 6 }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(135deg,#2563eb,#22d3ee)' }} />
            </div>
          </div>
        )}

        {activeTab === "prompt" && (
          <div className="card" style={{ display: 'grid', gap: '10px' }}>
            <h2 style={{ margin: 0 }}>Prompt Responses</h2>
            {promptResponses.length > 0 && (
              <>
                <CopyButton text={promptResponsesText} buttonText="Copy All" className="btn copy-btn" />
                <ActionButtons promptText={promptResponsesText} />
              </>
            )}

            <AutoScroller activeIndex={0} >
              {promptResponses.map((res, i) => (
                <div key={i} data-index={i} style={{ padding: "1rem 0", borderBottom: "1px solid #1f2937" }}>
                  <ReactMarkdown className="markdown-body">{res}</ReactMarkdown>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                    <CopyButton text={res} className="btn copy-btn" />
                    <ActionButtons promptText={res} />
                  </div>
                </div>
              ))}
            </AutoScroller>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quran;
