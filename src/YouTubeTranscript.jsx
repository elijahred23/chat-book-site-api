import { hostname } from "./utils/hostname";
import { useState, useEffect } from 'react';
import { ClipLoader } from "react-spinners";
import ReactMarkdown from 'react-markdown';

const isValidYouTubeUrl = (url) => {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return regex.test(url);
}
const fetchYouTubeTranscript = async (video_url) => {
    const url = "https://api.kome.ai/api/tools/youtube-transcripts";
    
    const requestBody = {
        video_id: video_url,
        format: true
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching transcript:", error);
    }
};

const getTranscript = async (url) => {
    if (isValidYouTubeUrl(url)) {
        try {
            const response = await fetch(`${hostname}/youtube/transcript`).catch(err=>window.alert(err));
            if (!response.ok) {
                let message= `Error: ${response.statusText}`
                window.alert(message)
                throw new Error(message);
            }
            const data = await response.json();
            return data.transcript || '';
        } catch (error) {
            console.error('Failed to fetch transcript:', error);
            return '';
        }
    } else {
        return '';
    }
};

function splitStringByWords(str, splitCount) {
    if (!str || splitCount < 1) return [];

    const words = str.split(/\s+/); // Split by whitespace
    const wordsPerChunk = Math.ceil(words.length / splitCount); // Calculate words per chunk
    const result = [];

    for (let i = 0; i < words.length; i += wordsPerChunk) {
        result.push(words.slice(i, i + wordsPerChunk).join(" "));
    }

    return result;
}

async function promptTranscript(prompt, transcripts) {
    let newResponses = [];
    await Promise.all(transcripts.map(async (transcript, currentStepIndex) => {
        prompt = `${prompt}: ${transcript}`
        const response = await fetch(`${hostname}/gemini/prompt?prompt=${encodeURIComponent(prompt)}`);
        const data = await response.json();
        let gptResponse = data.geminiResponse;
        newResponses[currentStepIndex] = (gptResponse);
    }));
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
    const [splitLength, setSplitLength] = useState(0);
    const [splitTranscript, setSplitTranscript] = useState([]);
    const [promptResponses, setPromptResponses] = useState([]);
    const [loadingPrompt, setLoadingPrompt] = useState(false);
    const [manuallyEnteredTranscript, setManuallyEnteredTranscript] = useState("");

    useEffect(() => {
        if (isValidYouTubeUrl(url)) {
            setValid(true);
        } else {
            setValid(false);
        }
    }, [url]);

    const getTranscript = async () => {
        setLastUrl(url);
        let data = await fetchYouTubeTranscript(url);
        let newTranscript = data?.transcript;
        setTranscript(newTranscript);
        setWordCount(countWords(newTranscript));
        setSplitLength(1);
    }
    useEffect(
        () => {
            let newTrans = async () => {
                if (valid === true && url !== lastUrl) {
                    await getTranscript();
                }
            }
            newTrans();
        }
        , [valid])

    useEffect(() => {
        if (splitLength > 0 && transcript?.length > 0) {
            setSplitTranscript(splitStringByWords(transcript, splitLength));
        }
    }, [splitLength, transcript]);


    const executePrompt = async () => { 
        setLoadingPrompt(true);
        let responses = await promptTranscript(prompt, splitTranscript);
        setPromptResponses(responses);
        setLoadingPrompt(false);
    }

    return (<>
        <div style={{ height: "10px", width: "10px", backgroundColor: valid ? 'green' : 'red' }}></div>
        <input value={url} placeholder="YouTube URL" onChange={event => setUrl(event.target.value)} />
        {(transcript?.length ?? 0) == 0 && 
        <>
            <input value={manuallyEnteredTranscript} placeholder="Manually Enter Transcript" onChange={event => setManuallyEnteredTranscript(event.target.value)} />
            <button onClick={event=>{
                setSplitLength(1);
                setWordCount(manuallyEnteredTranscript?.length ?? 0);
                setTranscript(manuallyEnteredTranscript);
            }}>Add Transcript</button>
        </>
        }
        {transcript?.length > 0 &&
            <>
                <input value={splitLength} type="number" min="1" step="1" placeholder="Split" onChange={event => setSplitLength(event.target.value)} />
                <div>
                    Word Count: {wordCount ?? 0}
                </div>
                <div>
                    Split Word Count: {Math.round((wordCount ?? 0) / splitLength)}
                </div>
                <button onClick={()=>window.print()}>Print</button>
            <input value={prompt} placeholder="Prompt" onChange={event => setPrompt(event.target.value)} />
            <ClipLoader color="blue" loading={loadingPrompt} />
            <button disabled={prompt?.length < 1 || loadingPrompt} onClick={executePrompt} >Execute</button>
                {promptResponses?.length > 0 && <h2>Prompt Response</h2>}
                {
                    promptResponses?.map(promptResponse => {
                        return (
                            <>
                            <div style={{ border: "1px solid green", marginBottom: "10px" }}>
                                <ReactMarkdown>{promptResponse}</ReactMarkdown>
                            </div>
                            </>
                        )
                    })
                }
                <h2>Transcript</h2>
                {
                    splitTranscript?.map(trans => {
                        return (
                            <div style={{ border: "1px solid black", marginBottom: "10px" }}>
                                {trans}
                            </div>
                        )
                    })
                }
            </>
        }
    </>);
}