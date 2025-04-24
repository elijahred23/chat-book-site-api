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
        const pattern = /^(https?:\/\/)?([\w\d\-]+\.)+\w{2,}(\/.*)?$/;
        return pattern.test(url);
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
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }

        if (isValidUrl(url)) {
            setError('');
            setSelectedUrl(url);
            localStorage.setItem('lastVisitedUrl', url);
            setIsLoading(true);
        } else {
            setError('Invalid URL format. Example: https://example.com');
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
                <button onClick={handleSearch}>🔎 Search Google</button>
                <button onClick={handleLoadUrl}>📥 Load in iFrame</button>
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
                        onLoad={() => setIsLoading(false)}
                    />
                </div>
            )}

            <style>{`
        .web-browser-container {
          padding: 20px;
          max-width: 900px;
          margin: auto;
          text-align: center;
        }
        .input-group {
          margin-bottom: 15px;
        }
        input {
          width: 60%;
          padding: 8px;
          margin-right: 5px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        button {
          padding: 8px 12px;
          margin-right: 5px;
          border: none;
          background-color: #007bff;
          color: white;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
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
