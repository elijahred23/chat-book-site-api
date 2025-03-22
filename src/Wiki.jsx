// File: App.jsx
import React, { useState } from "react";
import { getGeminiResponse } from "./utils/callGemini";
import ReactMarkdown from 'react-markdown';

export default function Wiki() {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [pageDetail, setPageDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [prompt , setPrompt] = useState("");
    const [geminiResponse , setGeminiResponse] = useState("");

    const searchWikipedia = async () => {
        setLoading(true);
        setResults([]);
        setPageDetail(null);
        try {
            const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
                query
            )}&format=json&origin=*`;
            const res = await fetch(searchUrl);
            const data = await res.json();
            setResults(data.query.search);
        } catch (error) {
            console.error("Search failed", error);
        }
        setLoading(false);
    };

    const getPageDetails = async (title) => {
        setPageDetail({ loading: true });
        try {
            const detailUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info&inprop=url&exintro&explaintext&piprop=original&titles=${encodeURIComponent(
                title
            )}&format=json&origin=*`;
            const res = await fetch(detailUrl);
            const data = await res.json();
            const page = Object.values(data.query.pages)[0];
            setPageDetail({
                title: page.title,
                extract: page.extract,
                fullUrl: page.fullurl,
                image: page.original?.source || null,
            });
        } catch (error) {
            setPageDetail({ error: "Failed to fetch page details." });
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">📚 Wikipedia Search</h1>

            <div className="mb-4">
                <input
                    type="text"
                    className="border px-3 py-2 mr-2 w-2/3"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search Wikipedia..."
                />
                <button
                    onClick={searchWikipedia}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Search
                </button>
            </div>

            {loading && <p>🔄 Searching...</p>}

            <ul className="list-disc pl-5 mb-4">
                {results.map((result) => (
                    <li key={result.pageid} className="mb-2">
                        <button
                            className="text-blue-700 underline"
                            onClick={() => getPageDetails(result.title)}
                        >
                            {result.title}
                        </button>
                        <p className="text-sm text-gray-600">{result.snippet.replace(/<[^>]+>/g, '')}...</p>
                    </li>
                ))}
            </ul>

            {pageDetail?.loading && <p>🔄 Loading article...</p>}

            {pageDetail?.error && <p className="text-red-600">{pageDetail.error}</p>}

            {pageDetail?.extract &&
                <>
                    <input placeholder="prompt" value={prompt} onChange={event=>setPrompt(event.target.value)} />
                    <button disabled={(prompt?.length == 0) || loading} onClick={async ()=>{
                        setLoading(true);
                        let geminiPrompt = `${prompt}: ${pageDetail.extract}`;
                        let response = await getGeminiResponse(geminiPrompt);
                        setGeminiResponse(response);
                        setLoading(false);
                    }}>Send</button>
                </>
            }
            {geminiResponse && 
                <>
                <div style={{ border: "1px solid green", marginBottom: "10px" }}>
                    <ReactMarkdown>{geminiResponse}</ReactMarkdown>
                </div>
                </>
            }
            {pageDetail && !pageDetail.loading && !pageDetail.error && (
                <div className="bg-gray-100 p-4 rounded">
                    <h2 className="font-bold text-xl mb-2">{pageDetail.title}</h2>
                    <p className="mb-4 whitespace-pre-wrap">{pageDetail.extract}</p>
                    <a
                        href={pageDetail.fullUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                    >
                        🔗 Read more on Wikipedia
                    </a>
                    {pageDetail.image && (
                        <img
                            src={pageDetail.image}
                            alt={pageDetail.title}
                            className="mb-4 w-full max-h-96 object-contain rounded"
                        />
                    )}
                </div>
            )}
        </div>
    );
}
