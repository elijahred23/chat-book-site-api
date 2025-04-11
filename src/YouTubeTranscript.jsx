import { useState, useEffect, useMemo } from 'react';
import { ClipLoader } from "react-spinners";
import ReactMarkdown from 'react-markdown';
import { getGeminiResponse } from "./utils/callGemini";
import PasteButton from './ui/PasteButton';
import CopyButton from './ui/CopyButton';
import { hostname } from './utils/hostname';
import { useFlyout } from './context/FlyoutContext';


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
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching transcript:", error);
    }
};

function splitStringByWords(str, splitCount) {
    if (!str || splitCount < 1) return [];
    const words = str.split(/\s+/);
    const wordsPerChunk = Math.ceil(words.length / splitCount);
    const result = [];
    for (let i = 0; i < words.length; i += wordsPerChunk) {
        result.push(words.slice(i, i + wordsPerChunk).join(" "));
    }
    return result;
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
async function promptTranscript(prompt, transcripts, setProgress, showMessage) {
    const batchSize = 5;
    const results = [];

    for (let i = 0; i < transcripts.length; i += batchSize) {
        const batch = transcripts.slice(i, i + batchSize);

        const batchResults = await Promise.all(
            batch.map(async (chunk, index) => {
                try {
                    const response = await getGeminiResponse(`${prompt}: ${chunk}`);
                    setProgress((prev) => prev + 1);
                    showMessage({
                        type: "success",
                        message: `Gemini succeeded on part ${i + index + 1}`,
                        duration: 1000
                    });
                    return response;
                } catch (err) {
                    console.error(`Gemini error on chunk ${i + index + 1}:`, err);
                    showMessage({
                        type: "error",
                        message: `Gemini failed on part ${i + index + 1}: ${err.message || "Unknown error"}`,
                        duration: 5000
                    });
                    return `Error: Gemini failed on part ${i + index + 1}`;
                }
            })
        );

        results.push(...batchResults);
        if (i < (transcripts.length - 1)) {
            await sleep(1000);
        }
    }

    return results;
}


const countWords = (s) => (s.match(/\b\w+\b/g) || []).length;

export default function YouTubeTranscript() {
    const { showMessage } = useFlyout();
    const [url, setUrl] = useState("");
    const [prompt, setPrompt] = useState(() => localStorage.getItem("yt_prompt") || "");
    const [lastUrl, setLastUrl] = useState("");
    const [valid, setValid] = useState(false);
    const [transcript, setTranscript] = useState(() => localStorage.getItem("yt_transcript") || "");
    const localStorageWordCount = localStorage.getItem("yt_word_count") || 0;
    const [wordCount, setWordCount] = useState(localStorageWordCount);
    const [splitLength, setSplitLength] = useState(() => localStorage.getItem("yt_split_length") || 1);
    const [splitTranscript, setSplitTranscript] = useState([]);
    const [promptResponses, setPromptResponses] = useState(() => {
        const saved = localStorage.getItem("yt_promptResponses");
        return saved ? JSON.parse(saved) : [];
    });
    const [loadingPrompt, setLoadingPrompt] = useState(false);
    const [manuallyEnteredTranscript, setManuallyEnteredTranscript] = useState("");
    const [progress, setProgress] = useState(0);
    const [loadingPDF, setLoadingPDF] = useState(false);
    const [retryIndex, setRetryIndex] = useState(null);
    const [retryPromptText, setRetryPromptText] = useState("");



    useEffect(() => {
        setValid(isValidYouTubeUrl(url));
    }, [url]);

    const generatePDF = async () => {
        if (!transcript) return;
        try {
            setLoadingPDF(true);
            let pdfFileName = "Youtube Transcript";

            const response = await fetch(`${hostname}/generate-pdf`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    markdown: transcript,
                    messagesToCombine: [promptResponses],
                    pdfFileName: pdfFileName
                })
            });

            if (!response.ok) throw new Error('Failed to generate PDF');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${pdfFileName}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();

            showMessage({ type: "success", message: "✅ PDF generated and downloaded!" });
        } catch (error) {
            console.error('Error generating PDF:', error);
            showMessage({ type: "error", message: `❌ PDF generation failed: ${error.message}` });
        } finally {
            setLoadingPDF(false);
        }
    };


    const getTranscript = async () => {
        try {
            setLastUrl(url);
            let data = await fetchYouTubeTranscript(url);
            let newTranscript = data?.transcript;
            if (!newTranscript) throw new Error("Transcript not found.");
            setTranscript(newTranscript);

            let newWordCount = countWords(newTranscript);
            let newSplitLength = Math.ceil(newWordCount / 3000);
            setWordCount(newWordCount);
            setSplitLength(newSplitLength);

            showMessage({ type: "success", message: "Transcript loaded successfully!" });
        } catch (err) {
            console.error(err);
            showMessage({ type: "error", message: `Error loading transcript: ${err.message}` });
        }
    };


    useEffect(() => {
        if (valid && url !== lastUrl && url != "") {
            getTranscript();
        }
    }, [url, valid]);

    useEffect(() => {
        if (splitLength > 0 && transcript?.length > 0) {
            setSplitTranscript(splitStringByWords(transcript, splitLength));
        }
    }, [splitLength, transcript]);

    const executePrompt = async () => {
        try {
            setLoadingPrompt(true);
            setProgress(0);
            const responses = await promptTranscript(prompt, splitTranscript, setProgress, showMessage);
            setPromptResponses(responses);
            showMessage({ type: "success", message: "✅ Prompt execution finished!" });
        } catch (err) {
            console.error("Prompt execution failed:", err);
            showMessage({ type: "error", message: `❌ Prompt execution error: ${err.message}` });
        } finally {
            setLoadingPrompt(false);
        }
    };


    // Save data to localStorage
    useEffect(() => {
        localStorage.setItem("yt_transcript", transcript);
        localStorage.setItem("yt_prompt", prompt);
        localStorage.setItem("yt_split_length", splitLength);
        localStorage.setItem("yt_word_count", wordCount);
        localStorage.setItem("yt_promptResponses", JSON.stringify(promptResponses));
    }, [transcript, prompt, promptResponses, splitLength, wordCount]);

    const clearAll = () => {
        setTranscript("");
        setPrompt("");
        setPromptResponses([]);
        setManuallyEnteredTranscript("");
        setUrl("");
        setSplitLength(1);
        setWordCount(0);
        setSplitTranscript([]);
        localStorage.removeItem("yt_transcript");
        localStorage.removeItem("yt_prompt");
        localStorage.removeItem("yt_split_length");
        localStorage.removeItem("yt_word_count");
        localStorage.removeItem("yt_promptResponses");
    };

    const promptSuggestions = [
        "Summarize",
        "Explain in simple terms",
        "Extract key takeaways",
        "Identify the speaker's main arguments",
        "Create flashcards",
    ];

    const promptResponsesText = useMemo(() => {
        if (!(promptResponses?.length > 0)) {
            return '';
        }
        return promptResponses.join(' \n');
    }, [promptResponses]);

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "1rem" }}>
            <div style={{ height: "10px", width: "10px", backgroundColor: valid ? 'green' : 'red' }}></div>

            <input
                value={url}
                placeholder="YouTube URL"
                onChange={e => setUrl(e.target.value)}
                style={{ width: '100%', marginBottom: '10px' }}
            />
            <PasteButton setPasteText={setUrl} />

            {transcript?.length === 0 && (
                <>
                    <input
                        value={manuallyEnteredTranscript}
                        placeholder="Manually Enter Transcript"
                        onChange={e => setManuallyEnteredTranscript(e.target.value)}
                        style={{ width: '100%' }}
                    />
                    <button onClick={() => {
                        setSplitLength(1);
                        setWordCount(countWords(manuallyEnteredTranscript));
                        setTranscript(manuallyEnteredTranscript);
                    }}>Add Transcript</button>
                </>
            )}

            {transcript?.length > 0 && (
                <>
                    <input
                        value={splitLength}
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Split"
                        onChange={e => setSplitLength(Number(e.target.value))}
                    />
                    <div>Word Count: {wordCount}</div>
                    <div>Split Word Count: {Math.round(wordCount / splitLength)}</div>

                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            marginBottom: '10px',
                            justifyContent: 'center',
                        }}
                    >
                        {promptSuggestions.map((suggestion, i) => (
                            <button
                                key={i}
                                onClick={() => setPrompt(suggestion)}
                                style={{
                                    padding: '6px 10px',
                                    fontSize: '12px',
                                    borderRadius: '5px',
                                    backgroundColor: '#e0e0e0',
                                    border: '1px solid #ccc',
                                    cursor: 'pointer',
                                    maxWidth: '180px',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>

                    <input
                        value={prompt}
                        placeholder="Prompt"
                        onChange={e => setPrompt(e.target.value)}
                        style={{ width: '100%' }}
                    />

                    <div style={{ marginTop: '10px' }}>
                        <button
                            disabled={prompt.length < 1 || loadingPrompt}
                            onClick={executePrompt}
                        >
                            Execute
                        </button>
                        <button onClick={clearAll} style={{ marginLeft: '10px' }}>Clear All</button>
                    </div>

                    {loadingPrompt && (
                        <div style={{ margin: "10px 0" }}>
                            <ClipLoader color="blue" loading={true} />
                            <p>Generating: {progress}/{splitTranscript.length}</p>
                        </div>
                    )}
                    {transcript?.length > 0 &&
                        <>
                            <ClipLoader color="blue" loading={loadingPDF} />
                            {!loadingPDF && transcript !== "" && (
                                <button onClick={generatePDF}>Generate PDF</button>
                            )}
                        </>
                    }

                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {promptResponses.length > 0 && <>
                            <h2>Prompt Response</h2>
                            <CopyButton buttonText='Copy all responses' text={promptResponsesText} />
                        </>}
                        {promptResponses.map((res, i) => (
                            <div key={i} style={{ border: "1px solid green", padding: "10px", marginBottom: "10px" }}>
                                <ReactMarkdown>{res}</ReactMarkdown>
                                <CopyButton text={res} />

                                <button
                                    style={{ marginTop: "5px" }}
                                    onClick={() => {
                                        setRetryIndex(i);
                                        setRetryPromptText(prompt); // default to current prompt
                                    }}
                                >
                                    Retry Prompt
                                </button>

                                {retryIndex === i && (
                                    <div style={{ marginTop: "10px" }}>
                                        <input
                                            value={retryPromptText}
                                            onChange={(e) => setRetryPromptText(e.target.value)}
                                            placeholder="Retry prompt"
                                            style={{ width: "100%", marginBottom: "5px" }}
                                        />
                                        <button
                                            onClick={async () => {
                                                setLoadingPrompt(true);
                                                setProgress(0);
                                                try {
                                                    let retryTranscript = [splitTranscript[i]];
                                                    const retryResponse = await promptTranscript(retryPromptText, retryTranscript , setProgress, showMessage);
                                                    console.log({retryTranscript, retryPromptText, retryResponse, i, splitTranscript});
                                                    const updatedResponses = [...promptResponses];
                                                    updatedResponses[i] = retryResponse[0];
                                                    setPromptResponses(updatedResponses);
                                                    showMessage({ type: "success", message: `✅ Retried prompt succeeded on part ${i + 1}` });
                                                } catch (err) {
                                                    showMessage({ type: "error", message: `❌ Retry failed: ${err.message}` });
                                                } finally {
                                                    setLoadingPrompt(false);
                                                    setRetryIndex(null);
                                                    setRetryPromptText("");
                                                }
                                            }}
                                        >
                                            Submit Retry
                                        </button>
                                        <button
                                            style={{ marginLeft: "5px" }}
                                            onClick={() => setRetryIndex(null)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}

                    </div>

                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <h2>Transcript</h2>
                        <CopyButton buttonText='Copy Complete Transcript' text={transcript} />
                        {splitTranscript.map((trans, i) => (
                            <div key={i} style={{ border: "1px solid black", padding: "10px", marginBottom: "10px" }}>
                                {trans}
                                <CopyButton text={trans} />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
