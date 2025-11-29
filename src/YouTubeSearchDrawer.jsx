import { useRef, useEffect, useState } from 'react';
import { getNewsVideos, getTrendingVideos, searchYouTubeVideos, searchYouTubePlaylists, getPlaylistVideos } from './utils/callYoutube';

export default function YouTubeSearchDrawer({ isOpen, onClose, onSelectVideo, externalQuery }) {
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
    const isPlaylistMode = searchType === 'playlist';

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
        if (!duration || typeof duration !== 'string') return 0;
        const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!matches) return 0;
        const hours = parseInt(matches[1]) || 0;
        const minutes = parseInt(matches[2]) || 0;
        const seconds = parseInt(matches[3]) || 0;
        return (hours * 3600) + (minutes * 60) + seconds;
    };

    const prettifyDuration = (seconds) => {
        if (!seconds) return '';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const parts = [];
        if (h) parts.push(`${h}h`);
        if (m) parts.push(`${m}m`);
        if (s || (!h && !m)) parts.push(`${s}s`);
        return parts.join(' ');
    };

    const videoUrlFromItem = (item) => {
        if (item?.url?.startsWith('http')) return item.url;
        if (item?.videoUrl?.startsWith('http')) return item.videoUrl;
        const videoId = item?.videoId || item?.id || item?.resourceId?.videoId;
        if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
        return '';
    };

    const decorateResults = (list) => list.map((item) => {
        const durationSeconds = item.durationSeconds ?? parseISODurationToSeconds(item.duration);
        return {
            ...item,
            _thumb: item.thumbnails?.medium?.url || item.thumbnails?.high?.url || item.thumbnails?.default?.url,
            _durationSeconds: durationSeconds,
            _prettyDuration: item.duration || prettifyDuration(durationSeconds),
            _playlistId: item.playlistId || item.id || item.url,
            _videoId: item.videoId || item.id || item.resourceId?.videoId,
            _publishedAt: item.publishedAt || item.publishTime,
            _url: videoUrlFromItem(item),
            _isPlaylist: item.type === 'playlist' || isPlaylistMode,
        };
    });

    const sortResults = (list) => {
        if (filterType === 'relevance') return list;
        const sorted = [...list];
        switch (filterType) {
            case 'longest':
                sorted.sort((a, b) => (b._durationSeconds || 0) - (a._durationSeconds || 0));
                break;
            case 'shortest':
                sorted.sort((a, b) => (a._durationSeconds || 0) - (b._durationSeconds || 0));
                break;
            case 'newest':
                sorted.sort((a, b) => new Date(b._publishedAt || 0) - new Date(a._publishedAt || 0));
                break;
            case 'oldest':
                sorted.sort((a, b) => new Date(a._publishedAt || 0) - new Date(b._publishedAt || 0));
                break;
            default:
                break;
        }
        return sorted;
    };

    const setAndCacheResults = (list) => {
        const decorated = decorateResults(list);
        const sorted = sortResults(decorated);
        setResults(sorted);
        localStorage.setItem(
            'yt_search_results',
            JSON.stringify({ timestamp: Date.now(), data: sorted })
        );
    };

    const getYoutubeTrending = async () => {
        setLoading(true);
        try {
            const res = await getTrendingVideos();
            setAndCacheResults(res);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const getYoutubeNews = async () => {
        setLoading(true);
        try {
            const res = await getNewsVideos();
            setAndCacheResults(res);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const res = searchType === 'video'
                ? await searchYouTubeVideos(searchQuery)
                : await searchYouTubePlaylists(searchQuery);
            setAndCacheResults(res);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async (url) => {
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
            } else {
                const ta = document.createElement('textarea');
                ta.value = url;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
            }
            setCopiedUrl(url);
        } catch (err) {
            console.error('Copy failed', err);
        } finally {
            setTimeout(() => setCopiedUrl(null), 1500);
        }
    };

    const handleUseVideo = (url) => {
        if (!url) return;
        onSelectVideo?.(url);
        onClose?.();
    };

    const togglePlaylist = async (item) => {
        const playlistId = item._playlistId;
        if (!playlistId) return;

        const isExpanded = expandedPlaylists.includes(playlistId);
        if (isExpanded) {
            setExpandedPlaylists((prev) => prev.filter((id) => id !== playlistId));
            return;
        }

        if (!playlistVideos[playlistId]) {
            try {
                const vids = await getPlaylistVideos(playlistId);
                setPlaylistVideos((prev) => ({ ...prev, [playlistId]: vids }));
            } catch (err) {
                console.error('Failed to load playlist items', err);
            }
        }
        setExpandedPlaylists((prev) => [...prev, playlistId]);
    };

    useEffect(() => {
        localStorage.setItem('yt_search_query', searchQuery);
        if (searchQuery === '') focusInput();
    }, [searchQuery]);

    useEffect(() => {
        localStorage.setItem('yt_search_type', searchType);
    }, [searchType]);

    useEffect(() => {
        localStorage.setItem('yt_filter_type', filterType);
    }, [filterType]);

    useEffect(() => {
        localStorage.setItem('yt_expanded_playlists', JSON.stringify(expandedPlaylists));
    }, [expandedPlaylists]);

    useEffect(() => {
        localStorage.setItem('yt_playlist_cache', JSON.stringify(playlistVideos));
    }, [playlistVideos]);

    useEffect(() => {
        if (isOpen) focusInput();
    }, [isOpen, searchType]);

    useEffect(() => {
        if (externalQuery) {
            setSearchQuery(externalQuery);
            setIsSearchVisible(true);
        }
    }, [externalQuery]);

    useEffect(() => {
        if (results.length && !results[0]?._url) {
            const decorated = decorateResults(results);
            setResults(sortResults(decorated));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!results.length) return;
        setResults((prev) => sortResults(prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterType]);

    const filterOptions = [
        { value: 'relevance', label: 'Relevance' },
        { value: 'longest', label: 'Longest' },
        { value: 'shortest', label: 'Shortest' },
        { value: 'newest', label: 'Newest' },
        { value: 'oldest', label: 'Oldest' },
    ];

    return (
        <div className={`chat-drawer full ${isOpen ? 'open' : ''}`} style={{ maxWidth: '780px', margin: '0 auto' }}>
            <div className="drawer-body" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <style>{`
                  .yt-shell {
                    background: radial-gradient(circle at 10% 10%, rgba(79,70,229,0.12), transparent 30%), radial-gradient(circle at 90% 20%, rgba(14,165,233,0.18), transparent 32%), #0b1220;
                    color: #e2e8f0;
                    border-radius: 18px;
                    padding: 1rem;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.35);
                  }
                  .yt-search-card {
                    background: #0f172a;
                    border: 1px solid rgba(148, 163, 184, 0.35);
                    border-radius: 16px;
                    padding: 1rem;
                  }
                  .yt-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1rem;
                  }
                  .eyebrow {
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    font-size: 0.75rem;
                    color: #94a3b8;
                    margin: 0;
                  }
                  .segmented {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
                    gap: 0.5rem;
                  }
                  .segmented button {
                    border: 1px solid rgba(148,163,184,0.35);
                    background: #0b1220;
                    color: #e2e8f0;
                    padding: 0.65rem 0.75rem;
                    border-radius: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s ease;
                  }
                  .segmented button.active {
                    background: linear-gradient(135deg, #2563eb, #22d3ee);
                    color: #0b1220;
                    border-color: transparent;
                    box-shadow: 0 10px 25px rgba(34,211,238,0.2);
                  }
                  .filter-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 0.4rem;
                  }
                  .filter-pill {
                    border: 1px solid rgba(148,163,184,0.45);
                    background: rgba(15, 23, 42, 0.8);
                    color: #cbd5e1;
                    padding: 0.45rem 0.6rem;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 0.9rem;
                    transition: all 0.2s ease;
                  }
                  .filter-pill.active {
                    background: #22d3ee;
                    color: #0f172a;
                    border-color: transparent;
                    font-weight: 700;
                  }
                  .result-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
                    gap: 0.9rem;
                  }
                  .result-card {
                    background: linear-gradient(135deg, rgba(226,232,240,0.08), rgba(30,41,59,0.8));
                    border: 1px solid rgba(148,163,184,0.3);
                    border-radius: 14px;
                    padding: 0.85rem;
                    display: flex;
                    gap: 0.75rem;
                    align-items: flex-start;
                  }
                  .thumb {
                    width: 120px;
                    height: 72px;
                    border-radius: 12px;
                    object-fit: cover;
                    background: #1f2937;
                    flex-shrink: 0;
                  }
                  .video-actions {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.35rem;
                    margin-top: 0.35rem;
                  }
                  .pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 0.3rem 0.6rem;
                    background: rgba(34,211,238,0.12);
                    border-radius: 999px;
                    font-size: 0.78rem;
                    color: #cbd5e1;
                    border: 1px solid rgba(34,211,238,0.3);
                  }
                  .playlist-items {
                    margin-top: 0.5rem;
                    padding: 0.65rem;
                    border-radius: 12px;
                    background: rgba(15,23,42,0.7);
                    border: 1px dashed rgba(148,163,184,0.4);
                  }
                  .playlist-item-row {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    padding: 0.4rem 0;
                    border-bottom: 1px solid rgba(148,163,184,0.2);
                  }
                  .playlist-item-row:last-child {
                    border-bottom: none;
                  }
                  @media (max-width: 640px) {
                    .result-card { flex-direction: column; }
                    .thumb { width: 100%; height: auto; aspect-ratio: 16/9; }
                    .yt-shell { padding: 0.75rem; }
                  }
                `}</style>

                <div className="yt-shell">
                    <div className="yt-search-card" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                        <div className="yt-header">
                            <div>
                                <p className="eyebrow">Smart search</p>
                                <h3 style={{ margin: 0 }}>Find the perfect video or playlist</h3>
                            </div>
                            <button className="close-chat-btn" onClick={onClose}>×</button>
                        </div>

                        <div style={{ marginTop: "10px", display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button className="btn secondary-btn" onClick={() => setIsSearchVisible((v) => !v)}>
                                    {isSearchVisible ? 'Hide search' : 'Show search'}
                                </button>
                                <button className="btn secondary-btn" onClick={getYoutubeTrending}>🔥 Trending</button>
                                <button className="btn secondary-btn" onClick={getYoutubeNews}>📰 News</button>
                            </div>
                            <small style={{ color: '#94a3b8' }}>{results.length} result{results.length === 1 ? '' : 's'}</small>
                        </div>

                        {isSearchVisible && (
                            <>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={searchQuery}
                                    placeholder="Search YouTube for tutorials, podcasts, or playlists..."
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && searchQuery.trim()) handleSearch();
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '0.85rem 1rem',
                                        fontSize: '1rem',
                                        margin: '0.75rem 0',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(148,163,184,0.4)',
                                        background: '#0b1220',
                                        color: '#e2e8f0'
                                    }}
                                />

                                <div className="segmented">
                                    <button className={searchType === 'video' ? 'active' : ''} onClick={() => setSearchType('video')}>🎬 Videos</button>
                                    <button className={searchType === 'playlist' ? 'active' : ''} onClick={() => setSearchType('playlist')}>📜 Playlists</button>
                                </div>

                                <div className="filter-grid" style={{ marginTop: '0.75rem' }}>
                                    {filterOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            className={`filter-pill ${filterType === option.value ? 'active' : ''}`}
                                            onClick={() => setFilterType(option.value)}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button className='btn primary-btn' disabled={!searchQuery.trim() || loading} onClick={handleSearch}>
                                        {loading ? 'Searching...' : 'Search'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Results */}
                    <div className="yt-search-card" style={{ marginTop: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h4 style={{ margin: 0 }}>Results</h4>
                            {loading && <span style={{ color: '#94a3b8' }}>Loading…</span>}
                        </div>
                        {results.length === 0 && !loading && (
                            <div style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Try searching for a topic or open Trending/News.</div>
                        )}
                        <div className="result-grid">
                            {results.map((item, index) => {
                                const isPlaylist = item._isPlaylist;
                                const playlistId = item._playlistId;
                                const thumb = item._thumb;
                                const videoUrl = item._url;
                                const playlistItems = playlistVideos[playlistId] || [];

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
                                            <h5 style={{ margin: '0 0 0.35rem 0', fontSize: '1rem', color: '#e2e8f0' }}>{item.title}</h5>
                                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1' }}>{item.channelTitle}</p>
                                            <div className="video-actions">
                                                {item._prettyDuration && <span className="pill">⏱ {item._prettyDuration}</span>}
                                                {item._publishedAt && <span className="pill">📅 {new Date(item._publishedAt).toLocaleDateString()}</span>}
                                            </div>

                                            {isPlaylist ? (
                                                <button
                                                    className='btn secondary-btn'
                                                    style={{ marginTop: '0.6rem' }}
                                                    onClick={() => togglePlaylist(item)}
                                                >
                                                    {expandedPlaylists.includes(playlistId) ? 'Hide playlist videos' : 'Show playlist videos'}
                                                </button>
                                            ) : (
                                                <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                    <button className='btn primary-btn' onClick={() => handleUseVideo(videoUrl)}>Use this video</button>
                                                    <button className='btn secondary-btn' onClick={() => handleCopy(videoUrl)}>
                                                        {copiedUrl === videoUrl ? 'Copied!' : 'Copy URL'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {isPlaylist && expandedPlaylists.includes(playlistId) && (
                                            <div className="playlist-items">
                                                {playlistItems.length === 0 && (
                                                    <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading playlist videos…</div>
                                                )}
                                                {playlistItems.map((vid, idx) => {
                                                    const vidThumb = vid?.thumbnails?.default?.url || vid?.thumbnails?.medium?.url;
                                                    const vidUrl = videoUrlFromItem(vid);
                                                    return (
                                                        <div key={idx} className="playlist-item-row">
                                                            {vidThumb && (
                                                                <img
                                                                    src={vidThumb}
                                                                    alt={vid.title}
                                                                    style={{ width: '64px', height: '40px', objectFit: 'cover', borderRadius: '8px' }}
                                                                />
                                                            )}
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.95rem' }}>{vid.title}</div>
                                                                <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>{vid.channelTitle}</div>
                                                            </div>
                                                            <button
                                                                className='btn primary-btn'
                                                                onClick={() => handleUseVideo(vidUrl)}
                                                                style={{ whiteSpace: 'nowrap' }}
                                                            >
                                                                Use this video
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
