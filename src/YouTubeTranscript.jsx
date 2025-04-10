import { useState, useEffect, useMemo } from 'react';
import { ClipLoader } from "react-spinners";
import ReactMarkdown from 'react-markdown';
import { getGeminiResponse } from "./utils/callGemini";
import PasteButton from './ui/PasteButton';
import CopyButton from './ui/CopyButton';
import { hostname } from './utils/hostname';

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

async function promptTranscript(prompt, transcripts, setProgress) {
    const promises = transcripts.map((chunk) =>
        getGeminiResponse(`${prompt}: ${chunk}`).then(response => {
            setProgress(prev => prev + 1);
            return response;
        })
    );
    return await Promise.all(promises);
}

const countWords = (s) => (s.match(/\b\w+\b/g) || []).length;

export default function YouTubeTranscript() {
    const [url, setUrl] = useState("");
    const [prompt, setPrompt] = useState(() => localStorage.getItem("yt_prompt") || "");
    const [lastUrl, setLastUrl] = useState("");
    const [valid, setValid] = useState(false);
    const [transcript, setTranscript] = useState(() => localStorage.getItem("yt_transcript") || "");
    const [wordCount, setWordCount] = useState(() => countWords(localStorage.getItem("yt_transcript") || ""));
    const [splitLength, setSplitLength] = useState(1);
    const [splitTranscript, setSplitTranscript] = useState([]);
    const [promptResponses, setPromptResponses] = useState(() => {
        const saved = localStorage.getItem("yt_promptResponses");
        return saved ? JSON.parse(saved) : [];
    });
    const [loadingPrompt, setLoadingPrompt] = useState(false);
    const [manuallyEnteredTranscript, setManuallyEnteredTranscript] = useState("");
    const [progress, setProgress] = useState(0);
    const [loadingPDF, setLoadingPDF] = useState(false);

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
        } catch (error) {
            console.error('Error generating PDF:', error);
        } finally {
            setLoadingPDF(false);
        }
    };

    const getTranscript = async () => {
        setLastUrl(url);
        let data = await fetchYouTubeTranscript(url);
        let newTranscript = data?.transcript;
        setTranscript(newTranscript);
        let newWordCount = countWords(newTranscript);
        let newSplitLength = Math.ceil(newWordCount / 1000); 
        setWordCount(newWordCount);
        setSplitLength(newSplitLength);
    };

    useEffect(() => {
        if (valid && url !== lastUrl) {
            getTranscript();
        }
    }, [url, valid]);

    useEffect(() => {
        if (splitLength > 0 && transcript?.length > 0) {
            setSplitTranscript(splitStringByWords(transcript, splitLength));
        }
    }, [splitLength, transcript]);

    const executePrompt = async () => {
        setLoadingPrompt(true);
        setProgress(0);
        const responses = await promptTranscript(prompt, splitTranscript, setProgress);
        setPromptResponses(responses);
        setLoadingPrompt(false);
    };

    // Save data to localStorage
    useEffect(() => {
        localStorage.setItem("yt_transcript", transcript);
        localStorage.setItem("yt_prompt", prompt);
        localStorage.setItem("yt_promptResponses", JSON.stringify(promptResponses));
    }, [transcript, prompt, promptResponses]);

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
        localStorage.removeItem("yt_promptResponses");
    };

    const promptSuggestions = [
        "Summarize",
        "Explain in simple terms",
        "Extract key takeaways",
        "Identify the speaker's main arguments",
        "Create flashcards",
    ];

    const promptResponsesText = useMemo(()=>{
        if(!(promptResponses?.length > 0)){
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
