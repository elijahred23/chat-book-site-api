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
import { FaCloudDownloadAlt, FaDatabase, FaPaste, FaFileAlt, FaLightbulb, FaCommentDots, FaClipboardList, FaClipboardCheck, FaSearch } from "react-icons/fa";
import { createPortal } from "react-dom";

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
    const [commentResponses, setCommentResponses] = useState([]);
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
  const [isMinimized, setIsMinimized] = useState(false);
  const [miniCollapsed, setMiniCollapsed] = useState(false);
  const dispatch = useAppDispatch();
  const [loadingTranscript, setLoadingTranscript] = useState(false);
  const { youtubeSearchText } = useAppState();
  const [externalSearchText, setExternalSearchText] = useState("");
  const [showAllPrompts, setShowAllPrompts] = useState(false);
  const [transcriptRespTab, setTranscriptRespTab] = useState("responses"); // "responses" | "retry"
  const [commentRespTab, setCommentRespTab] = useState("responses"); // "responses" | "retry"

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
        { label: "Sentiment", value: "Analyze the tone and sentiment" },
        { label: "Chapters", value: "Create timestamped chapters" },
        { label: "Action Items", value: "List action items and tasks" },
        { label: "Definitions", value: "Extract key terms and definitions" },
        { label: "Q&A", value: "Generate Q&A pairs from this content" },
        { label: "Translate", value: "Translate and summarize in Spanish" },
        { label: "Highlights", value: "List highlights and memorable quotes" },
        { label: "Next Steps", value: "Suggest next steps and follow-ups" },
        { label: "Compare", value: "Compare this with a related topic" },
        { label: "Counterpoints", value: "Provide counterpoints or critiques" },
    ];

  const promptResponsesText = useMemo(() => promptResponses.join('\n\n'), [promptResponses]);
    const commentResponsesText = useMemo(() => commentResponses.join('\n\n'), [commentResponses]);
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
            setActiveTab("transcriptResponses");
            setTranscriptRespTab("responses");
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
            setCommentResponses(responses);
            setActiveTab("commentResponses");
            setCommentRespTab("responses");
        } finally {
            setLoadingPrompt(false);
        }
    };

    const retryPart = async (idx) => {
        const retryPrompt = retryPromptText || prompt;
        if (!retryPrompt) {
            showMessage?.({ type: "error", message: "Please enter a retry prompt first." });
            return;
        }
        const requestId = (crypto && crypto.randomUUID) ? crypto.randomUUID() : `retry-${Date.now()}-${idx}`;
        latestRetryRef.current[idx] = requestId;
        try {
            setRetryLoadingIndex(idx);
            setProgress(0);
            const chunk =
                splitTranscript[idx] ||
                splitComments[idx] ||
                promptResponses[idx] ||
                transcript;
            const retryChunk = chunk ? [chunk] : [];
            if (!retryChunk.length) {
                showMessage?.({ type: "error", message: "Nothing to retry for this part yet." });
                return;
            }
            const retryResponse = await promptTranscript(
                retryPrompt,
                retryChunk,
                setProgress,
                showMessage
            );
            if (latestRetryRef.current[idx] === requestId) {
                const updated = [...promptResponses];
                updated[idx] = retryResponse[0];
                setPromptResponses(updated);
                showMessage?.({
                    type: "success",
                    message: `Retry successful for part ${idx + 1}`,
                });
            }
        } catch (err) {
            if (latestRetryRef.current[idx] === requestId) {
                showMessage?.({
                    type: "error",
                    message: `Retry failed: ${err.message}`,
                });
            }
        } finally {
            if (latestRetryRef.current[idx] === requestId) {
                setRetryLoadingIndex(null);
                setRetryIndex(null);
            }
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
        localStorage.setItem("yt_iframe_minimized", JSON.stringify(isMinimized));
    }, [transcript, prompt, splitLength, promptResponses, isMinimized]);

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
        } else {
            setSplitTranscript([]);
        }
    }, [splitLength, transcript]);

    const loadFlaskYoutubeTranscript = async () => {
        setLoadingTranscript(true);
        try {
            const maxAttempts = 4;
            let attempt = 0;
            let success = false;
            while (attempt < maxAttempts && !success) {
                try {
                    const data = await getFlaskYoutubeTranscript(url);
                    if (data?.transcript?.length > 0) {
                        const newTranscript = data.transcript;
                        const wordCount = countWords(newTranscript);
                        const splits = Math.ceil(wordCount / wordSplitNumber);
                        setTranscript(newTranscript);
                        setSplitLength(splits);
                        setLastFetchedUrl(url);
                        showMessage?.({ type: "success", message: `Transcript found${attempt ? ` after retry ${attempt}` : ""}.` });
                        setActiveTab("prompt");
                        success = true;
                        break;
                    } else {
                        throw new Error("Empty transcript");
                    }
                } catch (err) {
                    attempt += 1;
                    if (attempt < maxAttempts) {
                        showMessage?.({ type: "error", message: `Transcript load failed (attempt ${attempt}). Retrying...` });
                    } else {
                        showMessage?.({ type: "error", message: "Failed to load transcript after retries." });
                    }
                }
            }
        } finally {
            setLoadingTranscript(false);
        }
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
                setActiveTab("prompt");
            } else {
                showMessage?.({ type: "error", message: "Transcript not found." });
            }
        } catch (err) {
            showMessage?.({ type: "error", message: "Failed to load transcript." });
        }
        setLoadingTranscript(false);
    };

    const validYoutubeUrl = useMemo(() => isValidYouTubeUrl(url), [url]);

    const embedUrl = useMemo(() => {
        if (!validYoutubeUrl) return "";
        try {
            const urlObj = new URL(url);
            const idFromQuery = urlObj.searchParams.get("v");
            if (idFromQuery) return `https://www.youtube.com/embed/${idFromQuery}`;
            const pathParts = urlObj.pathname.split("/").filter(Boolean);
            const maybeId = pathParts[pathParts.length - 1];
            if (maybeId) return `https://www.youtube.com/embed/${maybeId}`;
        } catch {
            // fallback for raw IDs
            if (url.length === 11) return `https://www.youtube.com/embed/${url}`;
        }
        return "";
    }, [url, validYoutubeUrl]);

    useEffect(() => {
        if (youtubeSearchText) {
            setDrawerOpen(true);
            setExternalSearchText(youtubeSearchText);
        }
    }, [youtubeSearchText]);

    useEffect(() => {
        setActiveTab("transcript");
    }, []);

    // Auto-load transcript when a valid URL is entered
    useEffect(() => {
        if (!validYoutubeUrl) return;
        if (loadingTranscript) return;
        if (url && url !== lastFetchedUrl) {
            loadFlaskYoutubeTranscript();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [validYoutubeUrl, url]);

    // Internal styles scoped to this component. These override any external styles and ensure good mobile layout.
    const styles = `
      .yt-container {
        max-width: 980px;
        margin: 0 auto;
        padding: 1rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        font-family: "Inter", "Segoe UI", system-ui, -apple-system, sans-serif;
      }
      .surface {
        background: linear-gradient(135deg, #0b1220 0%, #0f172a 60%, #111827 100%);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 16px;
        padding: 1rem;
        box-shadow: 0 20px 60px rgba(0,0,0,0.35);
        color: #e2e8f0;
      }
      .tab-bar {
        display: flex;
        gap: 0.5rem;
        padding: 0.6rem;
        border-radius: 14px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.06);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.05);
      }
      .tab-btn {
        flex: 1 1 80px;
        padding: 0.5rem 0.65rem;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px;
        background: rgba(255,255,255,0.06);
        cursor: pointer;
        text-align: center;
        font-size: 0.95rem;
        color: #e2e8f0;
        transition: all 0.2s ease;
      }
      .tab-btn.active {
        background: linear-gradient(135deg, #2563eb, #22d3ee);
        color: #0b1220;
        border-color: transparent;
        box-shadow: 0 10px 28px rgba(34,211,238,0.25);
      }
      .tab-btn.icon-only {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1rem;
      }
      .btn {
        padding: 0.55rem 0.9rem;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 10px;
        cursor: pointer;
        font-size: 0.95rem;
        transition: all 0.2s ease;
        background: rgba(255,255,255,0.08);
        color: #e2e8f0;
      }
      .primary-btn {
        background: linear-gradient(135deg, #2563eb, #22d3ee);
        color: #0b1220;
        border: none;
        box-shadow: 0 12px 28px rgba(37, 99, 235, 0.35);
      }
      .secondary-btn {
        background: rgba(255,255,255,0.08);
        color: #e2e8f0;
      }
      .primary-btn:hover {
        transform: translateY(-1px);
      }
      .secondary-btn:hover {
        background: rgba(255,255,255,0.12);
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
        padding: 0.7rem;
        border: 1px solid rgba(15,23,42,0.12);
        border-radius: 10px;
        font-size: 0.95rem;
        background: #f8fafc;
        color: #0f172a;
      }
      .input:focus,
      .textarea:focus {
        outline: 2px solid #38bdf8;
        border-color: #22d3ee;
      }
      .textarea {
        width: 100%;
        min-height: 7rem;
        padding: 0.7rem;
        border: 1px solid rgba(15,23,42,0.12);
        border-radius: 10px;
        font-size: 0.95rem;
        resize: vertical;
        background: #f8fafc;
        color: #0f172a;
      }
      .suggestion-btn {
        padding: 0.45rem 0.75rem;
        border: 1px solid rgba(15,23,42,0.12);
        border-radius: 10px;
        background: #e2e8f0;
        cursor: pointer;
        font-size: 0.9rem;
        color: #0f172a;
      }
      .suggestion-btn:hover {
        background: #cbd5e1;
      }
      .scrollable-card {
        max-height: 320px;
        overflow-y: auto;
        padding: 0.75rem;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 12px;
        background: rgba(255,255,255,0.04);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
      }
      .chunk {
        margin-bottom: 0.85rem;
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        padding: 0.5rem;
        border-radius: 10px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.08);
        color: #e2e8f0;
      }
      .progress-container {
        margin-top: 0.5rem;
      }
      .progress-bar-wrapper {
        width: 100%;
        height: 12px;
        background: rgba(255,255,255,0.08);
        border-radius: 999px;
        overflow: hidden;
      }
      .progress-bar {
        height: 100%;
        background: linear-gradient(135deg, #22c55e, #4ade80);
        transition: width 0.4s ease-in-out;
      }
      .iframe-container {
        background: #0f172a;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #1e293b;
        box-shadow: 0 10px 30px rgba(15,23,42,0.35);
      }
      .video-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        margin-bottom: 0.65rem;
      }
      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.75rem;
        color: #94a3b8;
        margin: 0;
      }
      @media (max-width: 480px) {
        .tab-btn {
          flex-basis: 22%;
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
            {/* Toolbar */}
            <div className="tab-bar" style={{ alignItems: 'center' }}>
                <button
                    className={`tab-btn ${activeTab === "transcript" ? "active" : ""} icon-only`}
                    onClick={() => setActiveTab("transcript")}
                    aria-label="Transcript"
                    title="Transcript"
                >
                    <FaFileAlt />
                </button>
                <button
                    className={`tab-btn ${activeTab === "prompt" ? "active" : ""} icon-only`}
                    onClick={() => setActiveTab("prompt")}
                    aria-label="Prompt & Preview"
                    title="Prompt & Preview"
                >
                    <FaLightbulb />
                </button>
                <button
                    className={`tab-btn ${activeTab === "comments" ? "active" : ""} icon-only`}
                    onClick={() => setActiveTab("comments")}
                    aria-label="Comments"
                    title="Comments"
                >
                    <FaCommentDots />
                </button>
                <button
                    className={`tab-btn ${activeTab === "transcriptResponses" ? "active" : ""} icon-only`}
                    onClick={() => setActiveTab("transcriptResponses")}
                    aria-label="Transcript Responses"
                    title="Transcript Responses"
                >
                    <FaClipboardCheck />
                </button>
                <button
                    className={`tab-btn ${activeTab === "commentResponses" ? "active" : ""} icon-only`}
                    onClick={() => setActiveTab("commentResponses")}
                    aria-label="Comment Responses"
                    title="Comment Responses"
                >
                    <FaClipboardList />
                </button>
                <button
                    className="btn primary-btn icon-only"
                    style={{ marginLeft: 'auto' }}
                    onClick={() => setDrawerOpen(true)}
                    aria-label="Search YouTube"
                    title="Search YouTube"
                >
                    <FaSearch />
                </button>
            </div>

            {/* Video iframe section */}
            {embedUrl && (
                <div className="iframe-container" style={{ width: '100%', marginBottom: '1rem', position: 'relative' }}>
                    <div className="video-bar">
                        <div>
                            <p className="eyebrow">Now playing</p>
                            <strong style={{ color: '#e2e8f0' }}>{url}</strong>
                        </div>
                        <button className="btn secondary-btn" onClick={() => setIsMinimized((prev) => !prev)}>
                            {isMinimized ? "Expand" : "Minimize"}
                        </button>
                    </div>
                    {!isMinimized && (
                        <div style={{
                            width: '100%',
                            height: '240px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                        }}>
                            <iframe
                                src={embedUrl}
                                title="YouTube Video"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                style={{ width: '100%', height: '100%', border: 'none' }}
                            ></iframe>
                        </div>
                    )}
                </div>
            )}

            {/* Floating mini player */}
            {isMinimized && embedUrl && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        left: '12px',
                        bottom: '12px',
                        width: '240px',
                        height: '135px',
                        zIndex: 15000,
                        boxShadow: '0 18px 38px rgba(0,0,0,0.35)',
                        borderRadius: '14px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.08)',
                        backdropFilter: 'blur(8px)',
                        background: '#0b1220',
                        transform: miniCollapsed ? 'translateX(-228px)' : 'translateX(0)',
                        transition: 'transform 0.25s ease',
                    }}
                >
                    <button
                        onClick={() => setMiniCollapsed((v) => !v)}
                        style={{
                            position: 'absolute',
                            right: '-10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '30px',
                            height: '90px',
                            borderRadius: '0 12px 12px 0',
                            border: '1px solid rgba(255,255,255,0.25)',
                            background: 'linear-gradient(135deg, #22d3ee, #0ea5e9)',
                            color: '#0b1220',
                            cursor: 'pointer',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.35)',
                            fontWeight: 900,
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        aria-label={miniCollapsed ? "Show mini player" : "Hide mini player"}
                        title={miniCollapsed ? "Show mini player" : "Hide mini player"}
                    >
                        {miniCollapsed ? '▶' : '◀'}
                    </button>
                    <iframe
                        src={embedUrl}
                        title="YouTube Video Mini"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ width: '100%', height: '100%', border: 'none' }}
                    ></iframe>
                </div>,
                document.body
            )}

            {/* Keep drawer accessible across tabs */}
            <YouTubeSearchDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSelectVideo={(selectedUrl) => {
                    setUrl(selectedUrl);
                    setDrawerOpen(false);
                }}
                externalQuery={externalSearchText}
                setUrl={(url) => {
                    setUrl(url);
                    setDrawerOpen(false);
                }}
            />
            {/* Transcript tab */}
            {activeTab === "transcript" && (
                <>
                    <div className="input-group">
                        <input className="input" type="text" value={url} placeholder="YouTube URL" onChange={(e) => setUrl(e.target.value)} />
                        <button
                            disabled={!hasValidURL || loadingTranscript}
                            className="btn primary-btn icon-only"
                            onClick={loadFlaskYoutubeTranscript}
                            aria-label="Load transcript (Flask)"
                            title="Load transcript (Flask)"
                        >
                            <FaCloudDownloadAlt />
                        </button>
                        <button
                            disabled={!hasValidURL || loadingTranscript}
                            className="btn primary-btn icon-only"
                            onClick={loadTranscriptSupaData}
                            aria-label="Load transcript (SupaData)"
                            title="Load transcript (SupaData)"
                        >
                            <FaDatabase />
                        </button>
                    </div>
                    <div className="input-group">
                        <PasteButton
                            setPasteText={async () => {
                                try {
                                    let text = "";
                                    if (navigator.clipboard?.readText) {
                                        text = await navigator.clipboard.readText();
                                    } else {
                                        text = window.prompt("Paste YouTube URL here:") || "";
                                    }
                                    setUrl(text);
                                } catch {
                                    showMessage?.({ type: "error", message: "Clipboard blocked." });
                                }
                            }}
                            className="btn paste-btn"
                            aria-label="Paste URL"
                        />
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
                </>
            )}

            {/* Prompt & Preview tab */}
            {activeTab === "prompt" && (
                <>
                    <div className="input-group">
                        <input
                            className="input"
                            value={prompt}
                            placeholder="Prompt (e.g. Summarize this transcript)"
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                        <PasteButton
                            setPasteText={async () => {
                                try {
                                    let text = "";
                                    if (navigator.clipboard?.readText) {
                                        text = await navigator.clipboard.readText();
                                    } else {
                                        text = window.prompt("Paste prompt here:") || "";
                                    }
                                    setPrompt(text);
                                } catch {
                                    showMessage?.({ type: "error", message: "Clipboard blocked." });
                                }
                            }}
                            className="btn paste-btn"
                        />
                    </div>
                    <div className="prompt-suggestions">
                        {(showAllPrompts ? promptSuggestions : promptSuggestions.slice(0, 4)).map((item, index) => (
                            <button key={index} onClick={() => setPrompt(item.value)} className="suggestion-btn">{item.label}</button>
                        ))}
                        <button
                            className="suggestion-btn"
                            onClick={() => setShowAllPrompts((v) => !v)}
                            style={{ fontWeight: 700 }}
                        >
                            {showAllPrompts ? "Show Less" : "Show More"}
                        </button>
                    </div>
                    <div className="button-group">
                        <button className="btn primary-btn" onClick={executePrompt} disabled={loadingPrompt || !prompt || !splitTranscript.length}>
                            {loadingPrompt ? <ClipLoader size={12} color="white" /> : "Execute Prompt on Transcript"}
                        </button>
                        <button className="btn secondary-btn" onClick={() => setActiveTab("transcriptResponses")} disabled={!promptResponses.length}>
                            View Transcript Responses
                        </button>
                    </div>
                    {loadingPrompt && (
                        <div className="progress-container">
                            <label style={{ fontWeight: 'bold' }}>Progress: {progress}/{splitTranscript.length}</label>
                            <div className="progress-bar-wrapper">
                                <div className="progress-bar" style={{ width: `${(progress / splitTranscript.length) * 100}%` }} />
                            </div>
                        </div>
                    )}

                    <h2>
                        Transcript Preview <span style={{ fontSize: '0.9rem', color: '#666' }}>({transcriptWordCount} words)</span>
                    </h2>
                    <CopyButton text={transcript} buttonText="📋 Copy Complete Transcript" className="btn copy-btn" />
                    <ActionButtons promptText={transcript} />
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

            {/* Comments tab */}
            {activeTab === "comments" && (
                <>
                    <h2>Comments Preview</h2>
                    <CopyButton text={comments} buttonText="📋 Copy All Comments" className="btn copy-btn" />
                    <div className="input-group">
                        <input
                            className="input"
                            value={prompt}
                            placeholder="Prompt to run on comments"
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                        <PasteButton
                            setPasteText={async () => {
                                try {
                                    let text = "";
                                    if (navigator.clipboard?.readText) {
                                        text = await navigator.clipboard.readText();
                                    } else {
                                        text = window.prompt("Paste prompt here:") || "";
                                    }
                                    setPrompt(text);
                                } catch {
                                    showMessage?.({ type: "error", message: "Clipboard blocked." });
                                }
                            }}
                            className="btn paste-btn"
                        />
                    </div>
                    <div className="button-group">
                        <button className="btn primary-btn" onClick={executePromptOnComments} disabled={loadingPrompt || !prompt || !splitComments.length}>
                            {loadingPrompt ? <ClipLoader size={12} color="white" /> : "Execute Prompt on Comments"}
                        </button>
                        <button className="btn secondary-btn" onClick={() => setActiveTab("commentResponses")} disabled={!commentResponses.length}>
                            View Comment Responses
                        </button>
                    </div>
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


            {/* Prompt loading progress */}
            {loadingPrompt && (
                <div className="progress-container">
                    <label style={{ fontWeight: 'bold' }}>Progress: {progress}/{splitTranscript.length}</label>
                    <div className="progress-bar-wrapper">
                        <div className="progress-bar" style={{ width: `${(progress / splitTranscript.length) * 100}%` }} />
                    </div>
                </div>
            )}

            {/* Responses tab */}
            {activeTab === "transcriptResponses" && (
                <>
                    <h2>Transcript Responses</h2>
                    <div className="tab-bar" style={{ marginBottom: '0.75rem' }}>
                        <button
                            className={`tab-btn ${transcriptRespTab === "responses" ? "active" : ""}`}
                            onClick={() => setTranscriptRespTab("responses")}
                        >
                            Responses
                        </button>
                        <button
                            className={`tab-btn ${transcriptRespTab === "retry" ? "active" : ""}`}
                            onClick={() => setTranscriptRespTab("retry")}
                        >
                            Retry
                        </button>
                    </div>
                    {transcriptRespTab === "responses" && (
                        promptResponses.length > 0 ? (
                            <>
                                <CopyButton text={promptResponsesText} buttonText="Copy All Transcript Responses" className="btn copy-btn" />
                                <ActionButtons promptText={promptResponsesText} />
                                <AutoScroller activeIndex={0}>
                                    {promptResponses.map((res, i) => (
                                        <div key={i} data-index={i} style={{ padding: "1rem 0", borderBottom: "1px solid #ddd" }}>
                                            <ReactMarkdown className="markdown-body">{res}</ReactMarkdown>
                                            <CopyButton text={res} className="btn copy-btn" />
                                            <ActionButtons promptText={res} />
                                        </div>
                                    ))}
                                </AutoScroller>
                            </>
                        ) : (
                            <p style={{ color: '#475569' }}>Run a prompt on the transcript to see responses here.</p>
                        )
                    )}
                    {transcriptRespTab === "retry" && promptResponses.length > 0 && (
                        <>
                            <div className="input-group" style={{ marginTop: "0.5rem" }}>
                                <input
                                    className="input"
                                    value={retryPromptText}
                                    placeholder="Retry prompt (defaults to main prompt)"
                                    onChange={(e) => setRetryPromptText(e.target.value)}
                                />
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "10px",
                                    marginTop: "10px",
                                }}
                            >
                                {promptResponses.map((res, i) => {
                                    const isError = res?.startsWith("Error:") || res?.includes("❌");
                                    return (
                                        <div
                                            key={`status-${i}`}
                                            style={{
                                                border: "1px solid #e2e8f0",
                                                borderRadius: "10px",
                                                padding: "8px",
                                                minWidth: "140px",
                                                background: isError ? "#ffe2e2" : "#e0ffe2",
                                            }}
                                        >
                                            <div style={{ fontWeight: 700, marginBottom: 6 }}>Part {i + 1}</div>
                                            <div style={{ fontSize: "0.85rem", color: "#334155", marginBottom: 6 }}>
                                                {isError ? "❌ Failed" : "✅ Success"}
                                            </div>
                                            <button
                                                className="btn secondary-btn"
                                                disabled={retryLoadingIndex === i}
                                                onClick={() => {
                                                    setRetryPromptText((prev) => prev || prompt);
                                                    retryPart(i);
                                                }}
                                                style={{ width: "100%" }}
                                            >
                                                {retryLoadingIndex === i ? "Retrying..." : "Retry"}
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
                                        <ActionButtons promptText={res} />
                                        <button
                                            className="btn secondary-btn"
                                            style={{ marginTop: "0.5rem" }}
                                            onClick={() => {
                                                setRetryIndex(i);
                                                setRetryPromptText((prev) => prev || prompt);
                                            }}
                                            disabled={retryLoadingIndex === i}
                                        >
                                            {retryIndex === i ? "Editing retry…" : "Retry this part"}
                                        </button>
                                        {retryIndex === i && (
                                            <div className="chunk" style={{ marginTop: "0.5rem" }}>
                                                <input
                                                    className="input"
                                                    value={retryPromptText}
                                                    onChange={(e) => setRetryPromptText(e.target.value)}
                                                    placeholder="New prompt for this part"
                                                />
                                                <div className="button-group">
                                                    <button
                                                        className="btn primary-btn"
                                                        disabled={retryLoadingIndex === i}
                                                        onClick={async () => {
                                                            await retryPart(i);
                                                            setRetryIndex(null);
                                                            setRetryPromptText("");
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
                </>
            )}

            {activeTab === "commentResponses" && (
                <>
                    <h2>Comment Responses</h2>
                    <div className="tab-bar" style={{ marginBottom: '0.75rem' }}>
                        <button
                            className={`tab-btn ${commentRespTab === "responses" ? "active" : ""}`}
                            onClick={() => setCommentRespTab("responses")}
                        >
                            Responses
                        </button>
                        <button
                            className={`tab-btn ${commentRespTab === "retry" ? "active" : ""}`}
                            onClick={() => setCommentRespTab("retry")}
                        >
                            Retry
                        </button>
                    </div>
                    {commentRespTab === "responses" && (
                        commentResponses.length > 0 ? (
                            <>
                                <CopyButton text={commentResponsesText} buttonText="Copy All Comment Responses" className="btn copy-btn" />
                                <ActionButtons promptText={commentResponsesText} />
                                <AutoScroller activeIndex={0}>
                                    {commentResponses.map((res, i) => (
                                        <div key={`c-${i}`} data-index={i} style={{ padding: "1rem 0", borderBottom: "1px solid #ddd" }}>
                                            <ReactMarkdown className="markdown-body">{res}</ReactMarkdown>
                                            <CopyButton text={res} className="btn copy-btn" />
                                            <ActionButtons promptText={res} />
                                        </div>
                                    ))}
                                </AutoScroller>
                            </>
                        ) : (
                            <p style={{ color: '#475569' }}>Run a prompt on comments to see responses here.</p>
                        )
                    )}
                    {commentRespTab === "retry" && (
                        <p style={{ color: '#475569' }}>Retry logic is only available for transcript chunks.</p>
                    )}
                </>
            )}
        </div>
    );
}
