import { hostname } from "./utils/hostname";
import { useState, useEffect } from 'react';
import { ClipLoader } from "react-spinners";
import ReactMarkdown from 'react-markdown';
import { getGeminiResponse } from "./utils/callGemini";

const isValidYouTubeUrl = (url) => {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return regex.test(url);
}

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
    let newResponses = [];
    for (let i = 0; i < transcripts.length; i++) {
        const response = await getGeminiResponse(`${prompt}: ${transcripts[i]}`);
        newResponses[i] = response;
        setProgress(i + 1);
    }
    return newResponses;
}

const countWords = (s) => (s.match(/\b\w+\b/g) || []).length;

export default function YouTubeTranscript() {
    const [url, setUrl] = useState("");
    const [prompt, setPrompt] = useState("");
    const [lastUrl, setLastUrl] = useState("");
    const [valid, setValid] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [wordCount, setWordCount] = useState(0);
    const [splitLength, setSplitLength] = useState(1);
    const [splitTranscript, setSplitTranscript] = useState([]);
    const [promptResponses, setPromptResponses] = useState([]);
    const [loadingPrompt, setLoadingPrompt] = useState(false);
    const [manuallyEnteredTranscript, setManuallyEnteredTranscript] = useState("");
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setValid(isValidYouTubeUrl(url));
    }, [url]);

    const getTranscript = async () => {
        setLastUrl(url);
        let data = await fetchYouTubeTranscript(url);
        let newTranscript = data?.transcript;
        setTranscript(newTranscript);
        setWordCount(countWords(newTranscript));
        setSplitLength(1);
    }

    useEffect(() => {
        if (valid && url !== lastUrl) {
            getTranscript();
        }
    }, [valid]);

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
    }

    const promptSuggestions = [
        "Summarize this video",
        "Explain in simple terms",
        "Generate quiz questions",
        "Extract key takeaways",
        "List important timestamps",
        "Translate to Spanish",
        "Create a LinkedIn post",
        "Turn into a blog post",
        "Generate a tweet thread",
        "Highlight controversial points",
        "Identify the speaker's main arguments",
        "Write a YouTube video description",
        "Create flashcards",
        "Generate a study guide",
        "Explain with an analogy",
        "Turn into a podcast script",
    ];

    return (
        <div style={{ maxWidth: "800px", margin: "0 auto", padding: "1rem" }}>
            <div style={{ height: "10px", width: "10px", backgroundColor: valid ? 'green' : 'red' }}></div>
            <input value={url} placeholder="YouTube URL" onChange={e => setUrl(e.target.value)} style={{ width: '100%', marginBottom: '10px' }} />
            {transcript?.length === 0 && (
                <>
                    <input value={manuallyEnteredTranscript} placeholder="Manually Enter Transcript" onChange={e => setManuallyEnteredTranscript(e.target.value)} style={{ width: '100%' }} />
                    <button onClick={() => {
                        setSplitLength(1);
                        setWordCount(countWords(manuallyEnteredTranscript));
                        setTranscript(manuallyEnteredTranscript);
                    }}>Add Transcript</button>
                </>
            )}
            {transcript?.length > 0 && (
                <>
                    <input value={splitLength} type="number" min="1" step="1" placeholder="Split" onChange={e => setSplitLength(Number(e.target.value))} />
                    <div>Word Count: {wordCount}</div>
                    <div>Split Word Count: {Math.round(wordCount / splitLength)}</div>
                    <div style={{ marginBottom: "10px" }}>
                        {promptSuggestions.map(suggestion => (
                            <button key={suggestion} onClick={() => setPrompt(suggestion)}>{suggestion}</button>
                        ))}
                    </div>
                    <input value={prompt} placeholder="Prompt" onChange={e => setPrompt(e.target.value)} style={{ width: '100%' }} />
                    <button disabled={prompt.length < 1 || loadingPrompt} onClick={executePrompt}>Execute</button>
                    {loadingPrompt && (
                        <div style={{ margin: "10px 0" }}>
                            <ClipLoader color="blue" loading={true} />
                            <p>Generating: {progress}/{splitTranscript.length}</p>
                        </div>
                    )}
                    {promptResponses.length > 0 && <h2>Prompt Response</h2>}
                    {promptResponses.map((res, i) => (
                        <div key={i} style={{ border: "1px solid green", padding: "10px", marginBottom: "10px" }}>
                            <ReactMarkdown>{res}</ReactMarkdown>
                        </div>
                    ))}
                    <h2>Transcript</h2>
                    {splitTranscript.map((trans, i) => (
                        <div key={i} style={{ border: "1px solid black", padding: "10px", marginBottom: "10px" }}>{trans}</div>
                    ))}
                </>
            )}
        </div>
    );
}