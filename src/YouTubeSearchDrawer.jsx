import { useEffect, useState } from 'react';
import { searchYouTubeVideos } from './utils/callYoutube';

export default function YouTubeSearchDrawer({ isOpen, onClose, onSelectVideo }) {
    const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('yt_search_query') || '');
    const [results, setResults] = useState(() => {
        try {
            const stored = localStorage.getItem('yt_search_results');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });
    const [loading, setLoading] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(null);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const videos = await searchYouTubeVideos(searchQuery);
            setResults(videos);
            localStorage.setItem('yt_search_results', JSON.stringify(videos));
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (url) => {
        navigator.clipboard.writeText(url);
        setCopiedUrl(url);
        setTimeout(() => setCopiedUrl(null), 1500);
    };

    useEffect(() => {
        localStorage.setItem('yt_search_query', searchQuery);
    }, [searchQuery]);

    return (
        <div className={`chat-drawer full ${isOpen ? 'open' : ''}`}>
            <div className="chat-drawer-header">
                <h3>YouTube Search</h3>
                <button className="close-chat-btn" onClick={onClose}>×</button>
            </div>

            <div className="drawer-body" style={{ padding: '1rem' }}>
                <input
                    type="text"
                    value={searchQuery}
                    placeholder="Search YouTube..."
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchQuery.trim()) {
                            handleSearch();
                        }
                    }}
                />

                <button className="btn primary-btn" onClick={handleSearch} disabled={!searchQuery}>
                    🔍 Search
                </button>

                {loading && <p style={{ marginTop: '1rem' }}>Loading...</p>}

                <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                    {results.map((video, i) => (
                        <li key={i} style={{ display: 'flex', gap: '10px', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.75rem' }}>
                            <img src={video.thumbnail} alt={video.title} width="120" style={{ borderRadius: '4px' }} />
                            <div style={{ flex: 1 }}>
                                <p><strong>{video.title}</strong></p>
                                <p style={{ fontSize: '0.8rem', color: '#777' }}>{video.channelTitle}</p>
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
                                    <button
                                        className="btn small-btn"
                                        onClick={() => {
                                            onSelectVideo(video.url);
                                            onClose();
                                        }}
                                    >
                                        Use This Video
                                    </button>
                                    <button
                                        className="btn small-btn"
                                        onClick={() => handleCopy(video.url)}
                                    >
                                        📋 {copiedUrl === video.url ? 'Copied!' : 'Copy URL'}
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
