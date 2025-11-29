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
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '0.5rem',
        marginBottom: '0.75rem',
        alignItems: 'center',
        padding: '0.75rem',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        background: '#f8fafc',
    };
    const filterRadioStyle = {
        margin: '1rem 0',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gridGap: '0.5rem',
        marginBottom: '0.75rem',
        alignItems: 'center',
        padding: '0.75rem',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        background: '#f8fafc',
    };
    const focusInput = () => {
        const handler = () => {
            inputRef.current?.focus();
            window.removeEventListener('touchstart', handler);
            window.removeEventListener('click', handler);
        };

        window.addEventListener('touchstart', handler, { once: true });
        window.addEventListener('click', handler, { once: true });
    };

    const parseISODurationToSeconds = (duration) => {
        if (!duration || typeof duration !== 'string') {
            return 0;
        }
        const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!matches) return 0;
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
    };

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

    const handleUseVideo = (url) => {
        if (onSelectVideo) {
            onSelectVideo(url);
            onClose?.();
        }
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
        { value: 'relevance', label: 'Relevance' },
        { value: 'longest', label: 'Longest' },
        { value: 'shortest', label: 'Shortest' },
        { value: 'popular', label: 'Popular' },
        { value: 'most-likes', label: 'Most Likes' },
        { value: 'newest', label: 'Newest' },
        { value: 'oldest', label: 'Oldest' },
    ];
    return (
        <div className={`chat-drawer full ${isOpen ? 'open' : ''}`} style={{ maxWidth: '720px', margin: '0 auto' }}>

            <div className="drawer-body" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <style>{`
                  .yt-search-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 16px;
                    padding: 1rem;
                    box-shadow: 0 10px 28px rgba(15,23,42,0.08);
                  }
                  .result-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                    gap: 0.75rem;
                  }
                  .result-card {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 0.75rem;
                    display: flex;
                    gap: 0.75rem;
                    align-items: flex-start;
                  }
                  .thumb {
                    width: 120px;
                    height: 68px;
                    border-radius: 10px;
                    object-fit: cover;
                    background: #e2e8f0;
                  }
                  .video-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.4rem;
                    margin-top: 0.35rem;
                  }
                  .pill {
                    display: inline-flex;
                    padding: 0.25rem 0.6rem;
                    background: #e2e8f0;
                    border-radius: 999px;
                    font-size: 0.75rem;
                    color: #0f172a;
                  }
                  @media (max-width: 520px) {
                    .result-card {
                      flex-direction: column;
                    }
                    .thumb {
                      width: 100%;
                      height: auto;
                      aspect-ratio: 16/9;
                    }
                  }
                `}</style>
                <div
                    className="sticky-search-bar yt-search-card"
                    style={{
                        position: 'sticky',
                        top: 0,
                        background: '#fff',
                        zIndex: 10,
                        border: '1px solid #e2e8f0',
                    }}
                >
                    <div className="chat-drawer-header">
                        <h3 style={{ margin: 0 }}>YouTube Search</h3>
                        <button className="close-chat-btn" onClick={onClose}>×</button>
                    </div>
                    <div style={{marginTop:"5px"}}>
                        <button className="btn secondary-btn" onClick={() => setIsSearchVisible(!isSearchVisible)}>
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
                        style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', marginBottom: '0.75rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}
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
                            Video
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="searchType"
                                value="playlist"
                                checked={searchType === 'playlist'}
                                onChange={(e) => setSearchType(e.target.value)}
                            />
                            Playlist
                        </label>
                    </div>

                    <div style={filterRadioStyle}>
                        {filterOptions.map((option) => (
                            <label key={option.value}>
                                <input
                                    type="radio"
                                    name="filterType"
                                    value={option.value}
                                    checked={filterType === option.value}
                                    onChange={(e) => setFilterType(e.target.value)}
                                />
                                {option.label}
                            </label>
                        ))}
                    </div>

                    <div style={{marginTop:"5px", display:'flex', gap:'0.5rem', flexWrap:'wrap'}}>
                        <button className='btn primary-btn' onClick={getYoutubeTrending}>Trending</button>
                        <button className='btn primary-btn' onClick={getYoutubeNews}>News</button>
                        <button className='btn primary-btn' disabled={!searchQuery.trim()} onClick={handleSearch}>Search</button>
                    </div>


                    </>
                    )}
                </div>

                {/* Results */}
                <div className="yt-search-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h4 style={{ margin: 0 }}>Results</h4>
                        {loading && <span>Loading...</span>}
                    </div>
                    <div className="result-grid">
                        {results.map((item, index) => {
                            const videoUrl = item.videoUrl || item.url;
                            const playlistUrl = item.playlistUrl || item.url;
                            const isPlaylist = item.type === 'playlist';
                            const thumb = item.thumbnails?.medium?.url || item.thumbnails?.default?.url;

                            return (
                                <div key={index} className="result-card">
                                    {thumb && (
                                        <img
                                            src={thumb}
                                            alt={item.title}
                                            className="thumb"
                                        />
                                    )}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h5 style={{ margin: '0 0 0.35rem 0', fontSize: '1rem', color: '#0f172a' }}>{item.title}</h5>
                                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>{item.channelTitle}</p>
                                        <div className="video-actions">
                                            {item.duration && <span className="pill">⏱ {item.duration}</span>}
                                            {item.publishedAt && <span className="pill">📅 {new Date(item.publishedAt).toLocaleDateString()}</span>}
                                        </div>
                                        {isPlaylist && (
                                            <button
                                                className='btn secondary-btn'
                                                style={{ marginTop: '0.5rem' }}
                                                onClick={async () => {
                                                    if (playlistVideos[playlistUrl]) {
                                                        setExpandedPlaylists((prev) =>
                                                            prev.includes(playlistUrl)
                                                                ? prev.filter((id) => id !== playlistUrl)
                                                                : [...prev, playlistUrl]
                                                        );
                                                        return;
                                                    }
                                                    const vids = await getPlaylistVideos(playlistUrl);
                                                    setPlaylistVideos((prev) => ({ ...prev, [playlistUrl]: vids }));
                                                    localStorage.setItem('yt_playlist_cache', JSON.stringify({ ...playlistVideos, [playlistUrl]: vids }));
                                                    setExpandedPlaylists((prev) => [...prev, playlistUrl]);
                                                }}
                                            >
                                                {expandedPlaylists.includes(playlistUrl) ? 'Hide Playlist' : 'Show Playlist Videos'}
                                            </button>
                                        )}

                                        {!isPlaylist && (
                                            <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                <button className='btn primary-btn' onClick={() => handleUseVideo(videoUrl)}>Use Video</button>
                                                <button className='btn secondary-btn' onClick={() => handleCopy(videoUrl)}>
                                                    {copiedUrl === videoUrl ? 'Copied!' : 'Copy URL'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {isPlaylist && expandedPlaylists.includes(playlistUrl) && (
                                        <div style={{ marginTop: '0.5rem', paddingLeft: '0.75rem', borderLeft: '2px solid #ddd', width: '100%' }}>
                                            {playlistVideos[playlistUrl]?.map((vid, idx) => (
                                                <div key={idx} style={{ marginBottom: '0.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        {vid?.thumbnails?.default?.url && (
                                                            <img
                                                                src={vid.thumbnails.default.url}
                                                                alt={vid.title}
                                                                style={{ width: '60px', borderRadius: '8px' }}
                                                            />
                                                        )}
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{vid.title}</div>
                                                            <div style={{ fontSize: '0.8rem', color: '#475569' }}>{vid.channelTitle}</div>
                                                            <button
                                                                className='btn primary-btn'
                                                                onClick={() => handleUseVideo(`https://www.youtube.com/watch?v=${vid.id}`)}
                                                                style={{ marginTop: '0.25rem' }}
                                                            >
                                                                Use Video
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
