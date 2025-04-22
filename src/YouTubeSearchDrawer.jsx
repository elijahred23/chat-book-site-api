import { useEffect, useState } from 'react';
import { searchYouTubeVideos, searchYouTubePlaylists, getPlaylistVideos } from './utils/callYoutube';

export default function YouTubeSearchDrawer({ isOpen, onClose, onSelectVideo }) {
    const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('yt_search_query') || '');
    const [searchType, setSearchType] = useState(() => localStorage.getItem('yt_search_type') || 'video');
    const [playlistVideos, setPlaylistVideos] = useState(() => {
        try {
            const stored = localStorage.getItem('yt_playlist_cache');
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    });

    const [expandedPlaylists, setExpandedPlaylists] = useState(() => {
        try {
            const stored = localStorage.getItem('yt_expanded_playlists');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    const [results, setResults] = useState(() => {
        try {
            const stored = localStorage.getItem('yt_search_results');
            if (stored) {
                const parsed = JSON.parse(stored);
                const MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes
                if (Date.now() - parsed.timestamp < MAX_AGE_MS) {
                    return parsed.data;
                }
            }
        } catch { }
        return [];
    });

    const [loading, setLoading] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(null);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const results = searchType === 'video'
                ? await searchYouTubeVideos(searchQuery)
                : await searchYouTubePlaylists(searchQuery);

            setResults(results);
            localStorage.setItem(
                'yt_search_results',
                JSON.stringify({ timestamp: Date.now(), data: results })
            );

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

    useEffect(() => {
        localStorage.setItem('yt_search_type', searchType);
    }, [searchType]);

    useEffect(() => {
        localStorage.setItem('yt_expanded_playlists', JSON.stringify(expandedPlaylists));
    }, [expandedPlaylists]);

    useEffect(() => {
        localStorage.setItem('yt_playlist_cache', JSON.stringify(playlistVideos));
    }, [playlistVideos]);

    return (
        <div className={`chat-drawer full ${isOpen ? 'open' : ''}`}>

            <div className="drawer-body" style={{ padding: '1rem' }}>
                <div
                    className="sticky-search-bar"
                    style={{
                        position: 'sticky',
                        top: 0,
                        background: '#fff',
                        zIndex: 10,
                        paddingBottom: '1rem',
                        borderBottom: '1px solid #ddd',
                        marginBottom: '1rem',
                    }}
                >
                    <div className="chat-drawer-header">
                        <h3>YouTube Search</h3>
                        <button className="close-chat-btn" onClick={onClose}>×</button>
                    </div>
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
                        style={{ width: '100%', padding: '0.5rem', fontSize: '1rem', marginBottom: '0.75rem' }}
                    />

                    <div className="search-type-selector" style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                        <label>
                            <input
                                type="radio"
                                name="searchType"
                                value="video"
                                checked={searchType === 'video'}
                                onChange={(e) => setSearchType(e.target.value)}
                            />
                            Videos
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="searchType"
                                value="playlist"
                                checked={searchType === 'playlist'}
                                onChange={(e) => setSearchType(e.target.value)}
                            />
                            Playlists
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button className="btn primary-btn" onClick={handleSearch} disabled={!searchQuery}>
                            🔍 Search
                        </button>
                        <button
                            className="btn small-btn"
                            onClick={() => {
                                setSearchQuery('');
                            }}
                        >
                            ❌ Clear Query
                        </button>
                        <button
                            className="btn small-btn"
                            onClick={() => {
                                setSearchQuery('');
                                setResults([]);
                                setPlaylistVideos({});
                                setExpandedPlaylists([]);
                                localStorage.removeItem('yt_search_query');
                                localStorage.removeItem('yt_search_type');
                                localStorage.removeItem('yt_search_results');
                                localStorage.removeItem('yt_expanded_playlists');
                                localStorage.removeItem('yt_playlist_cache');
                            }}
                        >
                            🧹 Clear Search
                        </button>
                    </div>
                </div>



                {loading && <p style={{ marginTop: '1rem' }}>Loading...</p>}

                <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                    {results.map((item, i) => (
                        <li key={i} className="youtube-result" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '8px', background: '#fafafa' }}>
                            <img src={item.thumbnail} alt={item.title} width="120" style={{ borderRadius: '4px' }} />
                            <div style={{ flex: 1 }}>
                                <p><strong>{item.title}</strong></p>
                                <p style={{ fontSize: '0.8rem', color: '#777' }}>{item.channelTitle}</p>

                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                    <button
                                        className="btn small-btn"
                                        onClick={() => {
                                            onSelectVideo(item.url);
                                            onClose();
                                        }}
                                    >
                                        Use This Video
                                    </button>
                                    <button
                                        className="btn small-btn"
                                        onClick={() => handleCopy(item.url)}
                                    >
                                        📋 {copiedUrl === item.url ? 'Copied!' : 'Copy URL'}
                                    </button>

                                    {item.playlistId && (
                                        <button
                                            className="btn small-btn"
                                            onClick={async () => {
                                                const isExpanded = expandedPlaylists.includes(item.playlistId);

                                                if (!isExpanded) {
                                                    if (!playlistVideos[item.playlistId]) {
                                                        const videos = await getPlaylistVideos(item.playlistId);
                                                        setPlaylistVideos(prev => ({ ...prev, [item.playlistId]: videos }));
                                                    }
                                                    setExpandedPlaylists(prev => [...prev, item.playlistId]);
                                                } else {
                                                    setExpandedPlaylists(prev => prev.filter(id => id !== item.playlistId));
                                                }
                                            }}
                                        >
                                            {expandedPlaylists.includes(item.playlistId) ? 'Hide Videos' : 'Show Playlist Videos'}
                                        </button>
                                    )}
                                </div>

                                {expandedPlaylists.includes(item.playlistId) && playlistVideos[item.playlistId] && (
                                    <ul style={{ marginTop: '1rem', paddingLeft: '1rem' }}>
                                        {playlistVideos[item.playlistId].map((vid, j) => (
                                            <li key={j} style={{ display: 'flex', gap: '10px', marginBottom: '0.75rem', borderTop: '1px dashed #ccc', paddingTop: '0.5rem' }}>
                                                <img src={vid.thumbnail} alt={vid.title} width="80" style={{ borderRadius: '4px' }} />
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ margin: 0 }}><strong>{vid.title}</strong></p>
                                                    <p style={{ fontSize: '0.75rem', color: '#777', margin: '0.25rem 0' }}>{vid.channelTitle}</p>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            className="btn small-btn"
                                                            onClick={() => {
                                                                onSelectVideo(vid.url);
                                                                onClose();
                                                            }}
                                                        >
                                                            Use This Video
                                                        </button>
                                                        <button
                                                            className="btn small-btn"
                                                            onClick={() => handleCopy(vid.url)}
                                                        >
                                                            📋 {copiedUrl === vid.url ? 'Copied!' : 'Copy URL'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
