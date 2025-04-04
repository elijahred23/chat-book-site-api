import React, { useState, useEffect, useRef } from "react";
import { getGeminiResponse } from "./utils/callGemini";
import ReactMarkdown from 'react-markdown';

const getValuesInLocalStorage = () => {
    const localQuery = localStorage.getItem('wiki_query');
    const localResults = localStorage.getItem('wiki_results');
    const localPageDetails = localStorage.getItem('wiki_page_detail');
    const localPrompt = localStorage.getItem('wiki_prompt');
    const localGeminiResponse = localStorage.getItem('wiki_response');

    return {
        query: localQuery ? JSON.parse(localQuery) : "",
        results: localResults ? JSON.parse(localResults) : [],
        pageDetail: localPageDetails ? JSON.parse(localPageDetails) : null,
        prompt: localPrompt ? JSON.parse(localPrompt) : "",
        geminiResponse: localGeminiResponse ? JSON.parse(localGeminiResponse) : "",
    }
}
export default function Wiki() {
    const localStorageValues = getValuesInLocalStorage();

    const [query, setQuery] = useState(localStorageValues.query);
    const [results, setResults] = useState(localStorageValues.results);
    const [pageDetail, setPageDetail] = useState(localStorageValues.pageDetail);
    const [loading, setLoading] = useState(false);
    const [prompt, setPrompt] = useState(localStorageValues.prompt);
    const [geminiResponse, setGeminiResponse] = useState(localStorageValues.geminiResponse);

    const containerRef = useRef(null);

    const clear = () => {
        setQuery("");
        setResults([]);
        setPageDetail(null);
        setPrompt("");
        setGeminiResponse("");
    }
    useEffect(()=>{
        localStorage.setItem("wiki_query", JSON.stringify(query));
        localStorage.setItem("wiki_results", JSON.stringify(results));
        localStorage.setItem("wiki_page_detail", JSON.stringify(pageDetail));
        localStorage.setItem("wiki_prompt", JSON.stringify(prompt));
        localStorage.setItem("wiki_response", JSON.stringify(geminiResponse));
    }, [query, results, pageDetail, prompt, geminiResponse])

    const promptSuggestions = [
        "Summarize this article",
        "Elaborate",
        "Explain Simply",
        "What are the key facts?",
        "Provide historical context",
        "What are potential controversies?",
    ];

    const scrollToBottom = () => {
        setTimeout(() => {
            containerRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    const searchWikipedia = async () => {
        setLoading(true);
        setResults([]);
        setPageDetail(null);
        setGeminiResponse("");
        try {
            const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
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
        setGeminiResponse("");
        try {
            const detailUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts|pageimages|info&inprop=url&exintro&explaintext&piprop=original&titles=${encodeURIComponent(title)}&format=json&origin=*`;
            const res = await fetch(detailUrl);
            const data = await res.json();
            const page = Object.values(data.query.pages)[0];
            const details = {
                title: page.title,
                extract: page.extract,
                fullUrl: page.fullurl,
                image: page.original?.source || null,
            };
            setPageDetail(details);

            const autoSummary = await getGeminiResponse(`Summarize this article: ${page.extract}`);
            setGeminiResponse(autoSummary);
        } catch (error) {
            setPageDetail({ error: "Failed to fetch page details." });
        }
        scrollToBottom();
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
                <button
                    onClick={clear}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Clear
                </button>
            </div>

            {loading && <p>🔄 Searching...</p>}

            <ul className="list-disc pl-5 mb-4">
                {results?.map((result) => (
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

            {pageDetail?.extract && (
                <>
                    <div className="mb-4">
                        <input
                            placeholder="Ask Gemini about this article..."
                            value={prompt}
                            onChange={(event) => {
                                setPrompt(event.target.value);
                            }}
                            className="border px-3 py-2 w-full mb-2"
                        />
                        <div className="mb-2 flex flex-wrap gap-2">
                            {promptSuggestions?.map((s, i) => (
                                <button
                                    key={i}
                                    className="bg-gray-200 px-2 py-1 rounded"
                                    onClick={() => {
                                        setPrompt(s);
                                    }}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                        <button
                            disabled={prompt.length === 0 || loading}
                            onClick={async () => {
                                try {
                                    setLoading(true);
                                    const geminiPrompt = `${prompt}: ${pageDetail.extract}`;
                                    const response = await getGeminiResponse(geminiPrompt);
                                    setGeminiResponse(response);
                                } catch (e) {
                                    setGeminiResponse("⚠️ Failed to get a response from Gemini.");
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded"
                        >
                            Send
                        </button>
                    </div>
                </>
            )}

            {geminiResponse && (
                <div style={{ border: "1px solid green", padding: "10px", marginBottom: "10px" }}>
                    <ReactMarkdown>{geminiResponse}</ReactMarkdown>
                </div>
            )}

            {pageDetail && !pageDetail.loading && !pageDetail.error && (
                <div ref={containerRef} className="bg-gray-100 p-4 rounded">
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
