import React, { useEffect, useState, useMemo } from 'react';
import { ClipLoader } from 'react-spinners';
import ReactMarkdown from 'react-markdown';
import { getGeminiResponse } from "./utils/callGemini";
import CopyButton from './ui/CopyButton';
import { actions, useAppDispatch } from './context/AppContext';
import AutoScroller from './ui/AutoScroller';
const Quran = () => {
  const [quranData, setQuranData] = useState(null);
  const [selectedSurah, setSelectedSurah] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [promptResponses, setPromptResponses] = useState([]);
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const dispatch = useAppDispatch();
  const [activeTab, setActiveTab] = useState("read"); // "read" or "prompt"

  const promptSuggestions = [
    { label: "Summary", value: "Summarize this Surah" },
    { label: "Key Points", value: "Extract key points from this Surah" },
    { label: "Simple", value: "Explain this Surah simply" },
    { label: "Elaborate", value: "Elaborate on this Surah" },
  ];

  const promptResponsesText = useMemo(() => promptResponses.join('\n\n'), [promptResponses]);
  // Fetch Quran data on load
  useEffect(() => {
    fetch('https://api.alquran.cloud/v1/quran/en.asad')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Failed to fetch Quran data');
        }
        return res.json();
      })
      .then((data) => {
        setQuranData(data.data.surahs);
        setSelectedSurah(data.data.surahs[0]); // default to first surah
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const executePrompt = async () => {
    if (!selectedSurah || !prompt) return;
    try {
      setLoadingPrompt(true);
      const content = selectedSurah.ayahs.map(ayah => `${ayah.numberInSurah}. ${ayah.text}`).join('\n');
      const response = await getGeminiResponse(`${prompt}: ${content}`);
      setPromptResponses([response]);
      setActiveTab("prompt");
    } catch (err) {
      console.error("Gemini error:", err);
      // Handle error appropriately, e.g., display an error message
    } finally {
      setLoadingPrompt(false);
    }
  };


  // Handle surah selection
  const handleSurahChange = (e) => {
    const surahNumber = parseInt(e.target.value);
    const surah = quranData.find((s) => s.number === surahNumber);
    setSelectedSurah(surah);
  };

  if (loading) return <ClipLoader color="#000" loading={loading} size={50} />;
  if (error) return <div style={{ padding: 20, color: 'red' }}>Error: {error}</div>;

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
      <h1>📖 Quran Viewer (Asad Translation)</h1>

      <label htmlFor="surah-select"><strong>Select Surah:</strong></label>
      <select
        id="surah-select"
        onChange={handleSurahChange}
        value={selectedSurah?.number || ''}
        style={{ marginLeft: '10px', padding: '5px' }}
      >
        {quranData.map((surah) => (
          <option key={surah.number} value={surah.number}>
            {surah.number}. {surah.englishName} ({surah.englishNameTranslation})
          </option>
        ))}
      </select>

      <div className="tab-bar">
        <button className={`tab-btn ${activeTab === "read" ? "active" : ""}`} onClick={() => setActiveTab("read")}>Read Surah</button>
        <button className={`tab-btn ${activeTab === "prompt" ? "active" : ""}`} onClick={() => setActiveTab("prompt")}>Prompt Responses</button>
      </div>

      {activeTab === "read" && selectedSurah && (
        <div style={{ marginTop: '20px' }}>
          <div className="input-group">
            <input
              className="input"
              value={prompt}
              placeholder="Prompt (e.g. Summarize this Surah)"
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          <div className="prompt-suggestions">
            {promptSuggestions.map((text, index) => (
              <button key={index} onClick={() => setPrompt(text.value)} className="suggestion-btn">{text.label}</button>
            ))}
          </div>
          <button className="btn primary-btn" onClick={executePrompt} disabled={loadingPrompt || !prompt}>
            {loadingPrompt ? <ClipLoader size={12} color="white" /> : "Execute Prompt"}
          </button>
        </div>
      )}
      {activeTab === "read" && selectedSurah && (
        <>
          <hr />
          <div>
            <h2>
              {selectedSurah.name} ({selectedSurah.englishName}) - {selectedSurah.englishNameTranslation}
            </h2>
            <p><em>Revelation Type: {selectedSurah.revelationType}</em></p>

            <div style={{ marginTop: '20px' }}>
              {selectedSurah.ayahs.map((ayah) => (
                <p key={ayah.number}>
                  <strong>{ayah.numberInSurah}.</strong> {ayah.text}
                </p>
              ))}
            </div>
          </div>
        </>
      )}


      {loadingPrompt && (
        <div style={{ marginTop: '10px' }}>
          <label style={{ fontWeight: 'bold' }}>Loading...</label>
          {/* You can add a progress bar or spinner here if needed */}
        </div>
      )}

      {activeTab === "prompt" && (
        <>
          <h2>Prompt Responses</h2>
          {promptResponses.length > 0 && (
            <>
              <CopyButton text={promptResponsesText} buttonText="Copy All" className="btn copy-btn" />
              <button onClick={() => {
                localStorage.setItem('selectedText', promptResponsesText);
                dispatch(actions.setIsChatOpen(true));
                dispatch(actions.setSelectedText(promptResponsesText))
              }} className="btn primary-btn">Ask AI</button>
            </>
          )}

          <AutoScroller activeIndex={0} >
            {promptResponses.map((res, i) => (
              <div key={i} data-index={i} style={{ padding: "1rem 0", borderBottom: "1px solid #ddd" }}>
                <ReactMarkdown className="markdown-body">{res}</ReactMarkdown>
                <CopyButton text={res} className="btn copy-btn" />
                <button onClick={() => {
                  localStorage.setItem('selectedText', res);
                  dispatch(actions.setIsChatOpen(true));
                  dispatch(actions.setSelectedText(res))
                }} className="btn primary-btn">Ask AI</button>
              </div>
            ))}
          </AutoScroller>
        </>
      )}
    </div>
  );
};

export default Quran;
