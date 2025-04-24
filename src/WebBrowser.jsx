import React, { useState, useEffect } from 'react';

const WebBrowser = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUrl, setSelectedUrl] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const lastUrl = localStorage.getItem('lastVisitedUrl');
        if (lastUrl) setSelectedUrl(lastUrl);
    }, []);

    const isValidUrl = (url) => {
        try {
            new URL(url);
            return true;
        } catch (_) {
            return false;
        }
    };

    const handleSearch = () => {
        if (!searchQuery.trim()) {
            setError('Please enter a search term.');
            return;
        }
        setError('');
        const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
        window.open(googleSearchUrl, '_blank');
    };

    const handleLoadUrl = () => {
        if (!searchQuery.trim()) {
            setError('Please enter a URL.');
            return;
        }

        let url = searchQuery.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        if (isValidUrl(url)) {
            setError('');
            setSelectedUrl(url);
            setIsLoading(true);
        } else {
            setError('Invalid URL format. Example: https://example.com');
        }
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setSearchQuery(text);
        } catch (err) {
            setError('Failed to paste from clipboard.');
        }
    };

    const handleClear = () => {
        setSearchQuery('');
        setError('');
    };

    const handleReloadLastUrl = () => {
        const lastUrl = localStorage.getItem('lastVisitedUrl');
        if (lastUrl) {
            setSelectedUrl(lastUrl);
            setIsLoading(true);
        } else {
            setError('No previously loaded URL found.');
        }
    };

    return (
        <div className="web-browser-container">
            <div className="input-group">
                <input
                    type="text"
                    value={searchQuery}
                    placeholder="Type a Google search or enter a URL"
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={handleSearch} disabled={!searchQuery.trim()}>🔎 Search</button>
                <button onClick={handleLoadUrl} disabled={!searchQuery.trim()}>📥 Load</button>
                <button onClick={handlePaste}>📋 Paste</button>
                <button onClick={handleClear} disabled={!searchQuery}>❌ Clear</button>
                <button onClick={handleReloadLastUrl}>🔄 Reload Last URL</button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {selectedUrl && (
                <div className="iframe-container">
                    {isLoading && <p>Loading website...</p>}
                    <iframe
                        src={selectedUrl}
                        width="100%"
                        height="600px"
                        title="Web Viewer"
                        onLoad={() => {
                            setIsLoading(false);
                            localStorage.setItem('lastVisitedUrl', selectedUrl);
                        }}
                    />
                </div>
            )}

            <style>{`
                .web-browser-container {
                  padding: 20px;
                  max-width: 900px;
                  margin: auto;
                  text-align: center;
                  font-family: Arial, sans-serif;
                }
                .input-group {
                  margin-bottom: 15px;
                  display: flex;
                  flex-wrap: wrap;
                  justify-content: center;
                  gap: 8px;
                }
                input {
                  width: 60%;
                  min-width: 250px;
                  padding: 8px;
                  border: 1px solid #ccc;
                  border-radius: 4px;
                }
                button {
                  padding: 8px 12px;
                  border: none;
                  background-color: #007bff;
                  color: white;
                  border-radius: 4px;
                  cursor: pointer;
                }
                button:disabled {
                  background-color: #999;
                  cursor: not-allowed;
                }
                button:hover:not(:disabled) {
                  background-color: #0056b3;
                }
                .error-message {
                  color: red;
                  margin-bottom: 10px;
                }
                .iframe-container {
                  margin-top: 20px;
                  border: 1px solid #ddd;
                  border-radius: 8px;
                  overflow: hidden;
                }
            `}</style>
        </div>
    );
};

export default WebBrowser;
