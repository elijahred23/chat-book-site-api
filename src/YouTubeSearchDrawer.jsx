import { useRef, useEffect, useState } from 'react';
import { getNewsVideos, getTrendingVideos, searchYouTubeVideos, searchYouTubePlaylists, getPlaylistVideos } from './utils/callYoutube';

export default function YouTubeSearchDrawer({ isOpen, onClose, onSelectVideo }) {
    const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('yt_search_query') || '');
    const [searchType, setSearchType] = useState(() => localStorage.getItem('yt_search_type') || 'video');
    const [filterType, setFilterType] = useState(() => localStorage.getItem('yt_filter_type') || 'relevance');
    const [playlistVideos, setPlaylistVideos] = useState(() => {
        try {
            const stored = localStorage.getItem('yt_playlist_cache');
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    });

    const [isSearchVisible, setIsSearchVisible] = useState(true);
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
    const inputRef = useRef(null);

    const radioStyle = {
                        display: 'flex',
                        gap: '1rem',
                        marginBottom: '0.75rem',
                        alignItems: 'center',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        background: '#f9f9f9'
                    }
    const filterRadioStyle = {
        margin: '1rem 0',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', // Responsive grid
        gridGap: '0.5rem', // Smaller gap between grid items
        marginBottom: '0.75rem',
        alignItems: 'center',
        padding: '0.5rem',
        border: '1px solid #ddd',
        borderRadius: '4px',
        background: '#f9f9f9'
    }
    const focusInput = () => {
        const handler = () => {
            inputRef.current?.focus();
            window.removeEventListener('touchstart', handler);
            window.removeEventListener('click', handler);
        };

        window.addEventListener('touchstart', handler, { once: true });
        window.addEventListener('click', handler, { once: true });
    }

    const parseISODurationToSeconds = (duration) => {
        if (!duration || typeof duration !== 'string') {
            return 0; // Or handle as an error, or return a very large/small number depending on desired sort for missing durations
        }
        // Regex to capture H, M, S components from ISO 8601 duration (e.g., PT#H#M#S)
        const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!matches) return 0; // Or handle error

        const hours = parseInt(matches[1]) || 0;
        const minutes = parseInt(matches[2]) || 0;
        const seconds = parseInt(matches[3]) || 0;

        return (hours * 3600) + (minutes * 60) + seconds;
    };
    const getYoutubeTrending = async () => {
        setLoading(true);
        try {
            const results = await getTrendingVideos();
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

    const getYoutubeNews = async () => {
        setLoading(true);
        try {
            const results = await getNewsVideos();
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
    }

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
        if (searchQuery === '') {
            focusInput();
        }
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

    useEffect(() => {
        if (isOpen) {
            focusInput();
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            focusInput();
        }
    }, [searchType]);

    const filterOptions = [
        { value: 'relevance', label: 'Relevance' }, // Default or initial state
        { value: 'longest', label: 'Longest' },
        { value: 'shortest', label: 'Shortest' },
        { value: 'popular', label: 'Popular' },
        { value: 'most-likes', label: 'Most Likes' },
        { value: 'newest', label: 'Newest' },
        { value: 'oldest', label: 'Oldest' },
    ];
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
                    <div style={{marginTop:"5px"}}>
                        <button onClick={() => setIsSearchVisible(!isSearchVisible)}>
                            {isSearchVisible ? 'Hide Search' : 'Show Search'}
                        </button>
                    </div>

                    {isSearchVisible && (
                    <>

                    <input
                        ref={inputRef}
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

                    <div style={radioStyle}>
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
                        <button
                            className="btn small-btn"
                            onClick={() => {
                                getYoutubeNews();
                            }}
                        >
                            {/*Emoji for news */ "📰" }News
                        </button>
                        <button
                            className="btn small-btn"
                            onClick={() => {
                                getYoutubeTrending();
                            }}
                        >
                            {/*Emoji for trending */ "🔥"}Trending
                        </button>
                    </div>
                    <div style={{ marginTop: '0.75rem' }}>
                        <label htmlFor="filterModeSelect" style={{ marginRight: '0.5rem', fontWeight: 'bold' }}>Filter Mode:</label>
                        <select id="filterModeSelect" value={filterType} onChange={(e) => setFilterType(e.target.value)} style={{...filterRadioStyle, display: 'inline-block', width: 'auto', verticalAlign: 'middle' }}>
                            {filterOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    </>
                    )}
                </div>



                {loading && <p style={{ marginTop: '1rem' }}>Loading...</p>}

                <ul style={{ listStyle: 'none', padding: 0, marginTop: '1rem' }}>
                    {results?.sort((a, b) => {
                        const durationA = parseISODurationToSeconds(a.duration);
                        const durationB = parseISODurationToSeconds(b.duration);
                        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
                        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
                        // Handle 'relevance' or default case - no specific sort, or rely on API's default
                        if (filterType === 'relevance') return 0; 

                        if (filterType === 'longest') {
                            return durationB - durationA;
                        } else if (filterType === 'shortest') {
                            return durationA - durationB;
                        } else if (filterType === 'popular') {
                            return b.viewCount - a.viewCount;
                        } else if (filterType === 'most-likes') {
                            return b.likeCount - a.likeCount;
                        } else if (filterType === 'newest') {
                            return dateB - dateA;
                        } else if (filterType === 'oldest') {
                            return dateA - dateB;
                        } else {
                            return 0;
                        }
                    })?.map((item, i) => (
                        <li
                            key={i}
                            className="youtube-result"
                            style={{
                                marginBottom: '1rem',
                                padding: '1rem',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                background: '#fafafa'
                            }}
                        >
                            {/* Main Content Flex Container */}
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {/* Hide Thumbnail if Playlist is Expanded */}
                                {(!item.playlistId || !expandedPlaylists.includes(item.playlistId)) && (
                                    <img src={item.thumbnail} alt={item.title} width="120" style={{ borderRadius: '4px' }} />
                                )}

                                <div style={{ flex: 1 }}>
                                    <p><strong>{item.title}</strong></p>                                    
                                    {item.description && (
                                        <p style={{ fontSize: '0.9rem', color: '#555', marginTop: '0.25rem', position: 'relative' }}>
                                            <span title={item.description} style={{ display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', whiteSpace: 'nowrap' }}>
                                                {item.description}
                                            </span>                                            
                                        </p>
                                    )}                                    
                                    <p style={{ fontSize: '0.8rem', color: '#777' }}>
                                        {item.duration && <span>⏱️ {item.duration.replace('PT', '').replace('S', 's').replace('M', 'm')} </span>}
                                        {item.viewCount && <span>👁️ {parseInt(item.viewCount).toLocaleString()} </span>}
                                        {item.likeCount && <span>👍 {parseInt(item.likeCount).toLocaleString()} </span>}
                                        {item.publishedAt && (
                                            <span>
                                                📅 {new Date(item.publishedAt).toLocaleDateString()} (
                                                {(() => {
                                                    const diff = Math.floor((Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60 * 24));
                                                    if (diff < 30) return `${diff} days ago`;
                                                    if (diff < 7) return `${Math.floor(diff / 7)} weeks ago`;
                                                    if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
                                                    return `${Math.floor(diff / 365)} years ago`;
                                                })()}
                                                )
                                                
                                            </span>
                                        )}

                                    </p>
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
                                </div>
                            </div>

                            {/* Playlist Videos - Only Once, Below Main Flex */}
                            {expandedPlaylists.includes(item.playlistId) && playlistVideos[item.playlistId] && (
                                <ul style={{
                                    marginTop: '1rem',
                                    padding: '0.5rem',
                                    background: '#f0f0f0',
                                    borderRadius: '6px',
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    transition: 'all 0.3s ease'
                                }}>
                                    {playlistVideos[item.playlistId].map((vid, j) => (
                                        <li key={j} style={{ display: 'flex', gap: '10px', marginBottom: '0.75rem', borderBottom: '1px dashed #ccc', paddingBottom: '0.5rem' }}>
                                            <img src={vid.thumbnail} alt={vid.title} width="80" style={{ borderRadius: '4px' }} />
                                            <div style={{ flex: 1 }}>
                                                <p><strong>{vid.title}</strong></p>
                                                {vid.description && (
                                                    <p style={{ fontSize: '0.9rem', color: '#555', marginTop: '0.25rem', position: 'relative' }}>
                                                        <span title={vid.description} style={{ display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', whiteSpace: 'nowrap' }}>
                                                            {vid.description.length > 100 ? vid.description.substring(0, 100) + '...' : vid.description}
                                                        </span>

                                                    </p>
                                                )}
                                                <p style={{ fontSize: '0.8rem', color: '#777' }}>
                                                    {vid.duration && <span>⏱️ {vid.duration.replace('PT', '').replace('S', 's').replace('M', 'm')} </span>}
                                                    {vid.viewCount && <span>👁️ {parseInt(vid.viewCount).toLocaleString()} </span>}
                                                    {vid.likeCount && <span>👍 {parseInt(vid.likeCount).toLocaleString()} </span>}
                                                    {vid.publishedAt && (
                                                        <span>
                                                            📅 {new Date(vid.publishedAt).toLocaleDateString()} (
                                                            {(() => {
                                                                const diff = Math.floor((Date.now() - new Date(vid.publishedAt).getTime()) / (1000 * 60 * 60 * 24));
                                                                if (diff < 30) return `${diff} days ago`;
                                                                if (diff < 7) return `${Math.floor(diff / 7)} weeks ago`;
                                                                if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
                                                                return `${Math.floor(diff / 365)} years ago`;
                                                            })()}
                                                            )

                                                        </span>
                                                    )}

                                                </p>
                                                <p style={{ fontSize: '0.8rem', color: '#777' }}>{vid.channelTitle}</p>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="btn small-btn" onClick={() => { onSelectVideo(vid.url); onClose(); }}>Use This Video</button>
                                                    <button className="btn small-btn" onClick={() => handleCopy(vid.url)}>📋 {copiedUrl === vid.url ? 'Copied!' : 'Copy URL'}</button>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    ))}
                </ul>

            </div>
        </div>
    );
}
