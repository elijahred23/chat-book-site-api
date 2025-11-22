import { useState, useEffect, useMemo, useRef } from 'react';
import { ClipLoader } from "react-spinners";
import ReactMarkdown from 'react-markdown';
import { getGeminiResponse } from "./utils/callGemini";
import PasteButton from './ui/PasteButton';
import CopyButton from './ui/CopyButton';
import { hostname } from './utils/hostname';
import { useFlyout } from './context/FlyoutContext';
import AutoScroller from './ui/AutoScroller';
import YouTubeSearchDrawer from './YouTubeSearchDrawer';
import { actions, useAppDispatch, useAppState } from './context/AppContext';
import ActionButtons from './ui/ActionButtons';
import { getSupadataTranscript } from './utils/callSupadata';
import { getFlaskYoutubeTranscript } from './utils/callFlaskYoutubeTranscript';

// Constants
const wordSplitNumber = 5000;
const isValidYouTubeUrl = (url) => {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(\S*)?$/;
    return regex.test(url);
};

// Fetch transcript from external API when selected
const fetchYouTubeTranscriptExternal = async (video_url) => {
    
};

// Split a string into roughly equal word chunks
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

// Generic sleep helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Execute a prompt against each transcript chunk
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
                    showMessage?.({ type: "success", message: `Gemini succeeded on part ${i + index + 1}`, duration: 1000 });
                    return response;
                } catch (err) {
                    console.error(`Gemini error on chunk ${i + index + 1}:`, err);
                    showMessage?.({ type: "error", message: `Gemini failed on part ${i + index + 1}: ${err.message}` });
                    return `Error: Gemini failed on part ${i + index + 1}`;
                }
            })
        );
        results.push(...batchResults);
    }
    return results;
};

// Count number of words in a string
const countWords = (s) => (s.match(/\b\w+\b/g) || []).length;

export default function YouTubeTranscript() {
    const state = useAppState();
    const [activeTab, setActiveTab] = useState("transcript");  // Options: transcript, comments, responses, transcript-iframes
    const [comments, setComments] = useState([]);
    const [splitComments, setSplitComments] = useState([]);
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
    const [drawerOpen, setDrawerOpen] = useState(false);
    const { showMessage } = useFlyout();
    const latestRetryRef = useRef({});
    const [youtubeIframeShowing, setYoutubeIframeShowing] = useState(() => {
        const storedValue = localStorage.getItem("yt_iframe_showing");
        return storedValue !== null ? JSON.parse(storedValue) : false;
    });
    const [isMinimized, setIsMinimized] = useState(() => {
        const storedValue = localStorage.getItem("yt_iframe_minimized");
        return storedValue !== null ? JSON.parse(storedValue) : false;
    });
    const dispatch = useAppDispatch();
    const [loadingTranscript, setLoadingTranscript] = useState(false);

    // Helpers to fetch transcript and comments based on selected provider
    const fetchYouTubeTranscript = async (video_url) => {
            return transcript;
    };

    const promptSuggestions = [
        { label: "Summary", value: "Summarize this transcript" },
        { label: "Key Points", value: "Extract key points from this content" },
        { label: "Simple", value: "Explain this content simply" },
        { label: "Elaborate", value: "Elaborate on this transcript" },
        { label: "Code", value: "Show code examples" },
    ];

    const promptResponsesText = useMemo(() => promptResponses.join('\n\n'), [promptResponses]);
    const transcriptWordCount = useMemo(() => countWords(transcript), [transcript]);

    const fetchYouTubeComments = async (video_url) => {
        try {
            const response = await fetch(`${hostname}/youtube/comments?video=${encodeURIComponent(video_url)}&maxResults=50`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("Error fetching comments:", error);
            return [];
        }
    };

    // Execute prompt on transcript
    const executePrompt = async () => {
        try {
            setLoadingPrompt(true);
            setProgress(0);
            const responses = await promptTranscript(prompt, splitTranscript, setProgress, showMessage);
            setPromptResponses(responses);
            setActiveTab("responses");
        } finally {
            setLoadingPrompt(false);
        }
    };

    // Execute prompt on comments
    const executePromptOnComments = async () => {
        try {
            setLoadingPrompt(true);
            setProgress(0);
            const responses = await promptTranscript(prompt, splitComments, setProgress, showMessage);
            setPromptResponses(responses);
            setActiveTab("responses");
        } finally {
            setLoadingPrompt(false);
        }
    };

    const hasValidURL = useMemo(() => {
        return url && isValidYouTubeUrl(url);
    }, [url]);

    // Load comments when URL changes
    useEffect(() => {
        const loadComments = async () => {
            if (url && validYoutubeUrl && url !== lastFetchedUrl) {
                try {
                    const data = await fetchYouTubeComments(url);
                    if (data.length > 0) {
                        const commentsText = data.map(c => `• ${c.author}: ${c.comment}`).join('\n\n');
                        const wordCount = countWords(commentsText);
                        const splits = Math.ceil(wordCount / wordSplitNumber);
                        setComments(commentsText);
                        setSplitComments(splitStringByWords(commentsText, splits));
                        setLastFetchedUrl(url);
                        showMessage?.({ type: "success", message: "Comments loaded." });
                    } else {
                        showMessage?.({ type: "error", message: "No comments found." });
                    }
                } catch (err) {
                    showMessage?.({ type: "error", message: "Failed to load comments." });
                }
            }
        };
        loadComments();
    }, [url]);

    // Persist settings to localStorage
    useEffect(() => {
        localStorage.setItem("yt_transcript", transcript);
        localStorage.setItem("yt_prompt", prompt);
        localStorage.setItem("yt_split_length", splitLength);
        localStorage.setItem("yt_promptResponses", JSON.stringify(promptResponses));
        localStorage.setItem("yt_iframe_showing", JSON.stringify(youtubeIframeShowing));
        localStorage.setItem("yt_iframe_minimized", JSON.stringify(isMinimized));
    }, [transcript, prompt, splitLength, promptResponses, youtubeIframeShowing, isMinimized]);

    // Update transcript and split length when manual transcript changes
    useEffect(() => {
        const wc = countWords(manuallyEnteredTranscript);
        setTranscript(manuallyEnteredTranscript);
        setSplitLength(Math.ceil(wc / wordSplitNumber));
    }, [manuallyEnteredTranscript]);

    // Split transcript into chunks when length or content changes
    useEffect(() => {
        if (splitLength > 0 && transcript?.length > 0) {
            setSplitTranscript(splitStringByWords(transcript, splitLength));
        }
    }, [splitLength, transcript]);

    const loadFlaskYoutubeTranscript = async () => {
        setLoadingTranscript(true);
        try {
            let data = await getFlaskYoutubeTranscript(url);
            if(data?.transcript?.length > 0){
                const newTranscript = data.transcript;
                const wordCount = countWords(newTranscript);
                const splits = Math.ceil(wordCount / wordSplitNumber);
                setTranscript(newTranscript);
                setSplitLength(splits);
                setLastFetchedUrl(url);
                showMessage?.({ type: "success", message: "Transcript found." });
            }

        } catch (err) {
            showMessage?.({ type: "error", message: "Failed to load transcript." });    
        }
        setLoadingTranscript(false);
    };

    const loadTranscriptSupaData = async () => {
        setLoadingTranscript(true);
        try {
            let data = await getSupadataTranscript(video_url);

            if (data?.transcript?.content) {
                const newTranscript = data.transcript.content;
                const wordCount = countWords(newTranscript);
                const splits = Math.ceil(wordCount / wordSplitNumber);
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
        setLoadingTranscript(false);
    };

    const validYoutubeUrl = useMemo(() => {
        return isValidYouTubeUrl(url);
    }, [url]);

    // Internal styles scoped to this component. These override any external styles and ensure good mobile layout.
    const styles = `
        .yt-container {
            max-width: 640px;
            margin: 0 auto;
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            font-family: Arial, sans-serif;
        }
        .tab-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            border-bottom: 1px solid #ccc;
            padding-bottom: 0.5rem;
        }
        .tab-btn {
            flex: 1 1 auto;
            padding: 0.5rem 0.75rem;
            border: none;
            border-radius: 4px;
            background: #f0f0f0;
            cursor: pointer;
            text-align: center;
            font-size: 0.9rem;
        }
        .tab-btn.active {
            background: #4a7afe;
            color: #fff;
            font-weight: bold;
        }
        .btn {
            padding: 0.5rem 0.75rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
        }
        .primary-btn {
            background: #4a7afe;
            color: #fff;
        }
        .secondary-btn {
            background: #e0e0e0;
            color: #333;
        }
        .primary-btn:hover {
            background: #3b64d8;
        }
        .secondary-btn:hover {
            background: #d0d0d0;
        }
        .input-group,
        .button-group,
        .prompt-suggestions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        .input {
            flex: 1 1 auto;
            padding: 0.5rem;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 0.9rem;
        }
        .textarea {
            width: 100%;
            min-height: 6rem;
            padding: 0.5rem;
            border: 1px solid #ccc;
            border-radius: 4px;
            font-size: 0.9rem;
            resize: vertical;
        }
        .suggestion-btn {
            padding: 0.4rem 0.6rem;
            border: none;
            border-radius: 4px;
            background: #f7f7f7;
            cursor: pointer;
            font-size: 0.85rem;
        }
        .suggestion-btn:hover {
            background: #e0e0e0;
        }
        .scrollable-card {
            max-height: 300px;
            overflow-y: auto;
            padding: 0.5rem;
            border: 1px solid #eee;
            border-radius: 4px;
            background: #f9f9f9;
        }
        .chunk {
            margin-bottom: 0.75rem;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }
        .progress-container {
            margin-top: 0.5rem;
        }
        .progress-bar-wrapper {
            width: 100%;
            height: 10px;
            background: #ddd;
            border-radius: 5px;
            overflow: hidden;
        }
        .progress-bar {
            height: 100%;
            background: #4caf50;
            transition: width 0.4s ease-in-out;
        }
        .retry-box {
            margin-top: 0.5rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding: 0.5rem;
            border: 1px solid #eee;
            border-radius: 4px;
            background: #f9f9f9;
        }
        @media (max-width: 480px) {
            .tab-btn {
                flex-basis: 100%;
            }
            .input-group,
            .button-group,
            .prompt-suggestions {
                flex-direction: column;
            }
            .btn,
            .primary-btn,
            .secondary-btn,
            .tab-btn {
                width: 100%;
            }
        }
    `;

    return (
        <div className="yt-container">
            <style>{styles}</style>
            {/* Tab navigation */}
            <div className="tab-bar">
                <button className={`tab-btn ${activeTab === "transcript-iframes" ? "active" : ""}`} onClick={() => setActiveTab("transcript-iframes")}>Transcript Generator</button>
                <button className={`tab-btn ${activeTab === "transcript" ? "active" : ""}`} onClick={() => setActiveTab("transcript")}>Transcript</button>
                {validYoutubeUrl && (
                    <button className={`tab-btn ${activeTab === "comments" ? "active" : ""}`} onClick={() => setActiveTab("comments")}>Comments</button>
                )}
                <button className={`tab-btn ${activeTab === "responses" ? "active" : ""}`} onClick={() => setActiveTab("responses")}>Prompt Responses</button>
                <button className="btn primary-btn" onClick={async () => {
                    setYoutubeIframeShowing(!youtubeIframeShowing);
                }}>
                    {youtubeIframeShowing ? "Hide Iframe" : "Show Iframe"}
                </button>
                {youtubeIframeShowing && (
                    <button className="btn secondary-btn" onClick={() => setIsMinimized((prev) => !prev)}>
                        {isMinimized ? "Expand Video" : "Minimize Video"}
                    </button>
                )}
            </div>

            {/* Video iframe section */}
            {youtubeIframeShowing && (
                <div
                    className={`iframe-container ${isMinimized ? "minimized-iframe" : ""}`}
                    style={isMinimized ? {
                        position: 'fixed',
                        bottom: '10px',
                        right: '10px',
                        width: '320px',
                        height: '180px',
                        zIndex: 1000,
                        boxShadow: '0 0 10px rgba(0,0,0,0.3)'
                    } : {
                        width: '100%',
                        height: '200px',
                        marginBottom: '1rem'
                    }}
                >
                    {validYoutubeUrl && (
                        <iframe
                            src={`https://www.youtube.com/embed/${url.split('v=')[1]}`}
                            title="YouTube Video"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '8px'
                            }}
                        ></iframe>
                    )}
                </div>
            )}

            {/* Iframe generator tab */}
            {activeTab === 'transcript-iframes' && (
                <div className="iframe-container">
                    <iframe
                        src={`https://kome.ai/tools/youtube-transcript-generator`}
                        title="YouTube Transcript Generator"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ width: '100%', height: '300px' }}
                    ></iframe>
                </div>
            )}

            {/* Transcript tab */}
            {activeTab === "transcript" && (
                <>
                    <div className="input-group">
                        <input className="input" type="text" value={url} placeholder="YouTube URL" onChange={(e) => setUrl(e.target.value)} />
                        <button disabled={!hasValidURL || loadingTranscript} className="btn primary-btn" onClick={loadFlaskYoutubeTranscript}>
                            Load Flask Transcript
                        </button>
                        <button disabled={!hasValidURL || loadingTranscript} className="btn primary-btn" onClick={loadTranscriptSupaData}>
                            Load SupaData Transcript
                        </button>
                    </div>
                    <div className="input-group">
                        <div className="button-group">
                            <button className="btn secondary-btn" onClick={() => setDrawerOpen(true)}>
                                🔎 Search YouTube
                            </button>
                        </div>
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
                        {promptSuggestions.map((item, index) => (
                            <button key={index} onClick={() => setPrompt(item.value)} className="suggestion-btn">{item.label}</button>
                        ))}
                    </div>
                    <button className="btn primary-btn" onClick={executePrompt} disabled={loadingPrompt || !prompt}>
                        {loadingPrompt ? <ClipLoader size={12} color="white" /> : "Execute Prompt"}
                    </button>
                    <YouTubeSearchDrawer
                        isOpen={drawerOpen}
                        onClose={() => setDrawerOpen(false)}
                        onSelectVideo={(selectedUrl) => {
                            setUrl(selectedUrl);
                            setDrawerOpen(false);
                        }}
                        setUrl={(url) => {
                            setUrl(url);
                            setDrawerOpen(false);
                        }}
                    />
                </>
            )}

            {/* Prompt loading progress */}
            {loadingPrompt && (
                <div className="progress-container">
                    <label style={{ fontWeight: 'bold' }}>Progress: {progress}/{splitTranscript.length}</label>
                    <div className="progress-bar-wrapper">
                        <div className="progress-bar" style={{ width: `${(progress / splitTranscript.length) * 100}%` }} />
                    </div>
                </div>
            )}

            {/* Comments tab */}
            {activeTab === "comments" && (
                <>
                    <h2>Comments Preview</h2>
                    <CopyButton text={comments} buttonText="📋 Copy All Comments" className="btn copy-btn" />
                    <div className="prompt-suggestions">
                        {promptSuggestions.map((item, index) => (
                            <button key={index} onClick={() => setPrompt(item.value)} className="suggestion-btn">{item.label}</button>
                        ))}
                    </div>
                    <button className="btn primary-btn" onClick={executePromptOnComments} disabled={loadingPrompt || !prompt}>
                        {loadingPrompt ? <ClipLoader size={12} color="white" /> : "Execute Prompt on Comments"}
                    </button>
                    <div className="scrollable-card">
                        {splitComments.map((chunk, i) => (
                            <div key={i} className="chunk">
                                <ReactMarkdown className="markdown-body">{chunk}</ReactMarkdown>
                                <CopyButton text={chunk} className="btn copy-btn" />
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Responses tab */}
            {activeTab === "responses" && (
                <>
                    <h2>Prompt Responses</h2>
                    {promptResponses.length > 0 && (
                        <>
                            <CopyButton text={promptResponsesText} buttonText="Copy All" className="btn copy-btn" />
                            <ActionButtons promptText={promptResponsesText} />
                            <button className="btn secondary-btn" onClick={() => {
                                setManuallyEnteredTranscript(promptResponsesText);
                                setActiveTab("transcript");
                            }}>Copy to Transcript</button>
                        </>
                    )}
                    {/* --- Alternate Compact Retry View (Improved: Mobile + Race-Safe) --- */}
<div
    style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        marginBottom: "1rem",
        padding: "0.75rem",
        border: "1px solid #ddd",
        borderRadius: "10px",
        background: "#fafafa"
    }}
>
    {promptResponses.map((res, i) => {
        const isError =
            res?.startsWith("Error: Gemini failed on part") ||
            res?.includes("❌");
        const isSuccess = !isError;

        return (
            <div
                key={i}
                style={{
                    border: "1px solid #ccc",
                    borderRadius: "8px",
                    padding: "6px",
                    width: "120px",              // 👈 looks good on both mobile & desktop
                    flexShrink: 0,
                    background: isSuccess ? "#d6ffd6" : "#ffd6d6",
                    display: "flex",
                    flexDirection: "column"
                }}
            >
                {/* Part label */}
                <div
                    style={{
                        fontSize: "0.75rem",
                        marginBottom: "4px",
                        fontWeight: 600,
                        textAlign: "center"
                    }}
                >
                    Part {i + 1}
                </div>

                {/* Mini retry input */}
                <input
                    style={{
                        width: "100%",
                        fontSize: "0.7rem",
                        padding: "4px",
                        marginBottom: "6px",
                        borderRadius: "4px",
                        border: "1px solid #bbb"
                    }}
                    value={retryIndex === i ? retryPromptText : ""}
                    placeholder="New text"
                    onChange={(e) => {
                        setRetryIndex(i);
                        setRetryPromptText(e.target.value);
                    }}
                    onFocus={() => {
                        setRetryIndex(i);
                        setRetryPromptText(prompt);
                    }}
                />

                {/* Mini Retry Button */}
                <button
                    style={{
                        width: "100%",
                        fontSize: "0.7rem",
                        padding: "6px",
                        background: retryLoadingIndex === i ? "#999" : "#007bff",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: retryLoadingIndex === i ? "default" : "pointer"
                    }}
                    disabled={retryLoadingIndex === i}
                    onClick={async () => {
                        // --- ✔️ Add race condition protection with request ID ---
                        const requestId = crypto.randomUUID();
                        latestRetryRef.current[i] = requestId;

                        try {
                            setRetryLoadingIndex(i);
                            setProgress(0);

                            const retryChunk = [splitTranscript[i]];
                            const retryResponse = await promptTranscript(
                                retryPromptText || prompt,
                                retryChunk,
                                setProgress,
                                showMessage
                            );

                            // ---- ✔️ Only update if request is still latest for this index ----
                            if (latestRetryRef.current[i] === requestId) {
                                const updated = [...promptResponses];
                                updated[i] = retryResponse[0];
                                setPromptResponses(updated);

                                showMessage?.({
                                    type: "success",
                                    message: `Retry successful for part ${i + 1}`,
                                });
                            }
                        } catch (err) {
                            // Ignore stale errors (race-safe)
                            if (latestRetryRef.current[i] === requestId) {
                                showMessage?.({
                                    type: "error",
                                    message: `Retry failed: ${err.message}`,
                                });
                            }
                        } finally {
                            if (latestRetryRef.current[i] === requestId) {
                                setRetryLoadingIndex(null);
                                setRetryIndex(null);
                                setRetryPromptText("");
                            }
                        }
                    }}
                >
                    {retryLoadingIndex === i ? "..." : "Retry"}
                </button>
            </div>
        );
    })}
</div>


                    <AutoScroller activeIndex={0}>
                        {promptResponses.map((res, i) => (
                            <div key={i} data-index={i} style={{ padding: "1rem 0", borderBottom: "1px solid #ddd" }}>
                                <ReactMarkdown className="markdown-body">{res}</ReactMarkdown>
                                <CopyButton text={res} className="btn copy-btn" />
                                <button className="btn secondary-btn" onClick={() => {
                                    setRetryIndex(i);
                                    setRetryPromptText(prompt);
                                }}>
                                    🔁 Retry
                                </button>
                                <ActionButtons promptText={res} />
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
                                                        showMessage?.({
                                                            type: "success",
                                                            message: `✅ Retry successful for part ${i + 1}`,
                                                        });
                                                    } catch (err) {
                                                        showMessage?.({
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

            {/* Transcript preview in transcript tab */}
            {activeTab === "transcript" && (
                <>
                    <h2>
                        Transcript Preview <span style={{ fontSize: '0.9rem', color: '#666' }}>({transcriptWordCount} words)</span>
                    </h2>
                    <CopyButton text={transcript} buttonText="📋 Copy Complete Transcript" className="btn copy-btn" />
                    <div className="scrollable-card">
                        {splitTranscript.map((chunk, i) => (
                            <div key={i} className="chunk">
                                <textarea readOnly className="textarea">
                                    {chunk}
                                </textarea>
                                <CopyButton text={chunk} className="btn copy-btn" />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}