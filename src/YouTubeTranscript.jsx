import { useState, useEffect, useMemo } from 'react';
import { ClipLoader } from "react-spinners";
import ReactMarkdown from 'react-markdown';
import { getGeminiResponse } from "./utils/callGemini";
import PasteButton from './ui/PasteButton';
import CopyButton from './ui/CopyButton';
import { hostname } from './utils/hostname';
import { useFlyout } from './context/FlyoutContext';
import AutoScroller from './ui/AutoScroller';

const isValidYouTubeUrl = (url) => {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(\S*)?$/;
    return regex.test(url);
};

const fetchYouTubeTranscript = async (video_url) => {
    const url = "https://api.kome.ai/api/tools/youtube-transcripts";
    const requestBody = { video_id: video_url, format: true };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching transcript:", error);
    }
};

const splitStringByWords = (str, splitCount) => {
    if (!str || splitCount < 1) return [];
    const words = str.split(/\s+/);
    const wordsPerChunk = Math.ceil(words.length / splitCount);
    const result = [];
    for (let i = 0; i < words.length; i += wordsPerChunk) {
        result.push(words.slice(i, i + wordsPerChunk).join(" "));
    }
    return result;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const promptTranscript = async (prompt, transcripts, setProgress, showMessage) => {
    const batchSize = 5;
    const results = [];

    for (let i = 0; i < transcripts.length; i += batchSize) {
        const batch = transcripts.slice(i, i + batchSize);
        const batchResults = await Promise.all(
            batch.map(async (chunk, index) => {
                try {
                    const response = await getGeminiResponse(`${prompt}: ${chunk}`);
                    setProgress(prev => prev + 1);
                    showMessage({ type: "success", message: `Gemini succeeded on part ${i + index + 1}`, duration: 1000 });
                    return response;
                } catch (err) {
                    console.error(`Gemini error on chunk ${i + index + 1}:`, err);
                    showMessage({ type: "error", message: `Gemini failed on part ${i + index + 1}: ${err.message}` });
                    return `Error: Gemini failed on part ${i + index + 1}`;
                }
            })
        );
        results.push(...batchResults);
        if (i < (transcripts.length - 1)) await sleep(1000);
    }
    return results;
};

const countWords = (s) => (s.match(/\b\w+\b/g) || []).length;

export default function YouTubeTranscript() {
    const { showMessage } = useFlyout();
    const [activeTab, setActiveTab] = useState("transcript");
    const [url, setUrl] = useState("");
    const [prompt, setPrompt] = useState(() => localStorage.getItem("yt_prompt") || "");
    const [transcript, setTranscript] = useState(() => localStorage.getItem("yt_transcript") || "");
    const [splitLength, setSplitLength] = useState(() => localStorage.getItem("yt_split_length") || 1);
    const [splitTranscript, setSplitTranscript] = useState([]);
    const [promptResponses, setPromptResponses] = useState(() => JSON.parse(localStorage.getItem("yt_promptResponses")) || []);
    const [loadingPrompt, setLoadingPrompt] = useState(false);
    const [manuallyEnteredTranscript, setManuallyEnteredTranscript] = useState("");
    const [progress, setProgress] = useState(0);
    const [lastFetchedUrl, setLastFetchedUrl] = useState("");
    const [retryIndex, setRetryIndex] = useState(null);
    const [retryPromptText, setRetryPromptText] = useState("");
    const [retryLoadingIndex, setRetryLoadingIndex] = useState(null);


    const promptSuggestions = [
        "Summarize this transcript",
        "Extract key points from this content",
        "Explain this content simply"
    ];

    const promptResponsesText = useMemo(() => promptResponses.join('\n\n'), [promptResponses]);
    const transcriptWordCount = useMemo(() => countWords(transcript), [transcript])

    const executePrompt = async () => {
        try {
            setLoadingPrompt(true);
            setProgress(0);
            const responses = await promptTranscript(prompt, splitTranscript, setProgress, showMessage);
            setPromptResponses(responses);
            setActiveTab("responses")
        } finally {
            setLoadingPrompt(false);
        }
    };

    useEffect(() => {
        localStorage.setItem("yt_transcript", transcript);
        localStorage.setItem("yt_prompt", prompt);
        localStorage.setItem("yt_split_length", splitLength);
        localStorage.setItem("yt_promptResponses", JSON.stringify(promptResponses));
    }, [transcript, prompt, splitLength, promptResponses]);

    useEffect(() => {
        const wc = countWords(manuallyEnteredTranscript);
        setTranscript(manuallyEnteredTranscript);
        setSplitLength(Math.ceil(wc / 3000));
    }, [manuallyEnteredTranscript])

    useEffect(() => {
        if (splitLength > 0 && transcript?.length > 0) {
            setSplitTranscript(splitStringByWords(transcript, splitLength));
        }
    }, [splitLength, transcript]);

    useEffect(() => {
        const loadTranscript = async () => {
            if (url && isValidYouTubeUrl(url) && url !== lastFetchedUrl) {
                try {
                    const data = await fetchYouTubeTranscript(url);
                    if (data?.transcript) {
                        const newTranscript = data.transcript;
                        const wordCount = countWords(newTranscript);
                        const splits = Math.ceil(wordCount / 3000);
                        setTranscript(newTranscript);
                        setSplitLength(splits);
                        setLastFetchedUrl(url);
                        showMessage?.({ type: "success", message: "Transcript found." });
                    } else {
                        showMessage?.({ type: "error", message: "Transcript not found." });
                    }
                } catch (err) {
                    showMessage?.({ type: "error", message: "Failed to load transcript." });
                }
            }
        };
        loadTranscript();
    }, [url]);

    return (
        <div className="container">
            <h2>YouTube Transcript Analyzer</h2>

            <div className="tab-bar">
                <button className={`tab-btn ${activeTab === "transcript" ? "active" : ""}`} onClick={() => setActiveTab("transcript")}>Transcript</button>
                <button className={`tab-btn ${activeTab === "responses" ? "active" : ""}`} onClick={() => setActiveTab("responses")}>Prompt Responses</button>
            </div>


            {activeTab === "transcript" &&
                <>
                    <div className="input-group">
                        <input className="input" type="text" value={url} placeholder="YouTube URL"
                            onChange={(e) => setUrl(e.target.value)} />
                        <PasteButton setPasteText={setUrl} className="btn paste-btn" />
                    </div>

                    <textarea
                        className="textarea"
                        rows={6}
                        value={manuallyEnteredTranscript}
                        onChange={(e) => setManuallyEnteredTranscript(e.target.value)}
                        placeholder="Or manually enter transcript here..."
                    />
                    <div className="button-group">
                        <PasteButton
                            setPasteText={setManuallyEnteredTranscript}
                            className="btn paste-btn"
                        />
                        <CopyButton
                            text={manuallyEnteredTranscript}
                            className="btn copy-btn"
                        />
                        <button
                            className="btn secondary-btn"
                            onClick={() => setManuallyEnteredTranscript("")}
                        >
                            Clear
                        </button>

                        {/* ✅ Upload TXT File */}
                        <label className="btn secondary-btn" style={{ cursor: 'pointer' }}>
                            Upload .txt
                            <input
                                type="file"
                                accept=".txt"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;

                                    const reader = new FileReader();
                                    reader.onload = (event) => {
                                        setManuallyEnteredTranscript(event.target.result);
                                    };
                                    reader.readAsText(file);
                                }}
                            />
                        </label>
                    </div>
                    <div className="input-group">
                        <input
                            className="input"
                            value={prompt}
                            placeholder="Prompt (e.g. Summarize this)"
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                        <PasteButton setPasteText={setPrompt} className="btn paste-btn" />
                    </div>
                    <div className="prompt-suggestions">
                        {promptSuggestions.map((text, index) => (
                            <button key={index} onClick={() => setPrompt(text)} className="suggestion-btn">{text}</button>
                        ))}
                    </div>
                    <button className="btn primary-btn" onClick={executePrompt} disabled={loadingPrompt || !prompt}>
                        {loadingPrompt ? <ClipLoader size={12} color="white" /> : "Execute Prompt"}
                    </button>
                </>
            }



            {loadingPrompt && (
                <div style={{ marginTop: '10px' }}>
                    <label style={{ fontWeight: 'bold' }}>Progress: {progress}/{splitTranscript.length}</label>
                    <div style={{ width: '100%', height: '10px', backgroundColor: '#ddd', borderRadius: '5px', overflow: 'hidden', marginTop: '4px' }}>
                        <div style={{ width: `${(progress / splitTranscript.length) * 100}%`, height: '100%', backgroundColor: '#4caf50', transition: 'width 0.4s ease-in-out' }} />
                    </div>
                </div>
            )}

            {activeTab === "responses" && (
                <>
                    <h2>Prompt Responses</h2>
                    {promptResponses.length > 0 && (
                        <CopyButton text={promptResponsesText} buttonText="📋 Copy All Prompt Responses" className="btn copy-btn" />
                    )}

                    <AutoScroller activeIndex={0} >
                        {promptResponses.map((res, i) => (
                            <div key={i} data-index={i} style={{ padding: "1rem 0", borderBottom: "1px solid #ddd" }}>
                                <ReactMarkdown>{res}</ReactMarkdown>
                                <CopyButton text={res} className="btn copy-btn" />
                                <button className="btn secondary-btn" onClick={() => {
                                    setRetryIndex(i);
                                    setRetryPromptText(prompt);
                                }}>
                                    🔁 Retry
                                </button>

                                {retryIndex === i && (
                                    <div className="retry-box">
                                        <input
                                            className="input"
                                            value={retryPromptText}
                                            onChange={(e) => setRetryPromptText(e.target.value)}
                                            placeholder="New prompt for retry"
                                        />

                                        <div className="button-group">
                                            <button
                                                className="btn primary-btn"
                                                disabled={retryLoadingIndex === i}
                                                onClick={async () => {
                                                    try {
                                                        setRetryLoadingIndex(i);
                                                        setProgress(0);
                                                        const retryChunk = [splitTranscript[i]];
                                                        const retryResponse = await promptTranscript(
                                                            retryPromptText,
                                                            retryChunk,
                                                            setProgress,
                                                            showMessage
                                                        );
                                                        const updatedResponses = [...promptResponses];
                                                        updatedResponses[i] = retryResponse[0];
                                                        setPromptResponses(updatedResponses);
                                                        showMessage({
                                                            type: "success",
                                                            message: `✅ Retry successful for part ${i + 1}`,
                                                        });
                                                    } catch (err) {
                                                        showMessage({
                                                            type: "error",
                                                            message: `❌ Retry failed: ${err.message}`,
                                                        });
                                                    } finally {
                                                        setRetryLoadingIndex(null);
                                                        setRetryIndex(null);
                                                        setRetryPromptText("");
                                                    }
                                                }}
                                            >
                                                {retryLoadingIndex === i ? <ClipLoader size={12} color="white" /> : "Submit Retry"}
                                            </button>

                                            <button
                                                className="btn secondary-btn"
                                                onClick={() => {
                                                    setRetryIndex(null);
                                                    setRetryPromptText("");
                                                }}
                                                disabled={retryLoadingIndex === i}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                            </div>
                        ))}
                    </AutoScroller>


                </>
            )}

            {activeTab === "transcript" && (
                <>
                    <h2>
                        Transcript Preview <span style={{ fontSize: '0.9rem', color: '#666' }}>({transcriptWordCount} words)</span>
                    </h2>
                    <CopyButton text={transcript} buttonText="📋 Copy Complete Transcript" className="btn copy-btn" />
                    <div className="card scrollable-card">
                        {splitTranscript.map((chunk, i) => (
                            <div key={i} className="chunk">
                                <ReactMarkdown>{chunk}</ReactMarkdown>
                                <CopyButton text={chunk} className="btn copy-btn" />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
