import { hostname } from "./utils/hostname";
import { useState, useEffect } from 'react';
import { ClipLoader } from "react-spinners";

const isValidYouTubeUrl = (url) => {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return regex.test(url);
}
const getTranscript = async (url) => {
    if (isValidYouTubeUrl(url)) {
        const response = await fetch(`${hostname}/youtube/transcript?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        return data.transcript;
    } else {
        return ''
    }
}

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

    useEffect(() => {
        if (isValidYouTubeUrl(url)) {
            setValid(true);
        } else {
            setValid(false);
        }
    }, [url]);

    useEffect(
        () => {
            let newTrans = async () => {
                if (valid === true && url !== lastUrl) {
                    setLastUrl(url);
                    let newTranscript = await getTranscript(url);
                    setTranscript(newTranscript);
                    setWordCount(newTranscript?.length ?? 0);
                    setSplitLength(1);
                }
            }
            newTrans();
        }
        , [valid])

    useEffect(() => {
        if (splitLength > 0 && transcript?.length > 0) {
            setSplitTranscript(splitStringByWords(transcript, splitLength));
        }
    }, [splitLength]);


    const executePrompt = async () => { 
        setLoadingPrompt(true);
        let responses = await promptTranscript(prompt, splitTranscript);
        setPromptResponses(responses);
        setLoadingPrompt(false);
    }

    return (<>
        <div style={{ height: "10px", width: "10px", backgroundColor: valid ? 'green' : 'red' }}></div>
        <input value={url} placeholder="YouTube URL" onChange={event => setUrl(event.target.value)} />
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
                {
                    promptResponses?.map(trans => {
                        return (
                            <>
                            <h2>Prompt Response</h2>
                            <div style={{ border: "1px solid green", marginBottom: "10px" }}>
                                {trans}
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