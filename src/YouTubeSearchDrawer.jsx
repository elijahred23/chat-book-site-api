import { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getNewsVideos, getTrendingVideos, searchYouTubeVideos, searchYouTubePlaylists, getPlaylistVideos } from './utils/callYoutube';

export default function YouTubeSearchDrawer({ isOpen, onClose, onSelectVideo, externalQuery, onFetchPlaylist }) {
    const [searchQuery, setSearchQuery] = useState(() => localStorage.getItem('yt_search_query') || '');
    const [searchType, setSearchType] = useState(() => localStorage.getItem('yt_search_type') || 'video');
    const [filterType, setFilterType] = useState(() => localStorage.getItem('yt_filter_type') || 'relevance');
    const [activeTab, setActiveTab] = useState(() => localStorage.getItem('yt_active_tab') || 'search'); // search | results
    const cacheKeyForType = (type) => type === 'playlist' ? 'yt_playlist_results' : 'yt_video_results';
    const getCachedResults = (type) => {
        try {
            const stored = localStorage.getItem(cacheKeyForType(type));
            if (stored) {
                const parsed = JSON.parse(stored);
                const MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes
                if (Date.now() - parsed.timestamp < MAX_AGE_MS) {
                    return parsed.data || [];
                }
            }
        } catch { }
        return [];
    };
    const [playlistVideos, setPlaylistVideos] = useState(() => {
        try {
            const stored = localStorage.getItem('yt_playlist_cache');
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    });
    const [nextPageToken, setNextPageToken] = useState(null);
    const [prevPageToken, setPrevPageToken] = useState(null);
    const [lastQuery, setLastQuery] = useState('');
    const PAGE_SIZE = 50;

    const [isSearchVisible, setIsSearchVisible] = useState(true);
    const [expandedPlaylists, setExpandedPlaylists] = useState(() => {
        try {
            const stored = localStorage.getItem('yt_expanded_playlists');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });
    const [playlistModal, setPlaylistModal] = useState({ open: false, items: [], title: '', count: 0 });
    const [lastPlaylistSnapshot, setLastPlaylistSnapshot] = useState(null);
    const [showPlaylistOnOpen, setShowPlaylistOnOpen] = useState(false);

    const [results, setResults] = useState(() => getCachedResults(searchType));

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
            _thumb: item.thumbnails?.high?.url || item.thumbnails?.medium?.url || item.thumbnails?.standard?.url || item.thumbnails?.default?.url || item.thumbnail,
            _durationSeconds: durationSeconds,
            _prettyDuration: item.duration && /^PT/.test(item.duration)
              ? prettifyDuration(durationSeconds)
              : (item.duration || prettifyDuration(durationSeconds)),
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

    const setAndCacheResults = (list = [], typeOverride) => {
        const key = cacheKeyForType(typeOverride || searchType);
        const decorated = decorateResults(list);
        const sorted = sortResults(decorated);
        setResults(sorted);
        localStorage.setItem(
            key,
            JSON.stringify({ timestamp: Date.now(), data: sorted })
        );
    };

    const getYoutubeTrending = async () => {
        setLoading(true);
        setNextPageToken(null);
        setPrevPageToken(null);
        try {
            const res = await getTrendingVideos();
            setAndCacheResults(res);
            setActiveTab('results');
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const getYoutubeNews = async () => {
        setLoading(true);
        setNextPageToken(null);
        setPrevPageToken(null);
        try {
            const res = await getNewsVideos();
            setAndCacheResults(res);
            setActiveTab('results');
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (pageTokenOverride = '', queryOverride) => {
        setLoading(true);
        try {
            const queryToUse = (queryOverride ?? searchQuery).trim();
            if (!queryToUse) {
                setLoading(false);
                return;
            }
            if (searchType === 'video') {
                const res = await searchYouTubeVideos(queryToUse, pageTokenOverride, PAGE_SIZE);
                setAndCacheResults(res.items, 'video');
                setNextPageToken(res.nextPageToken || null);
                setPrevPageToken(res.prevPageToken || null);
                setLastQuery(queryToUse);
                setActiveTab('results');
            } else {
                const res = await searchYouTubePlaylists(queryToUse);
                setAndCacheResults(res, 'playlist');
                setNextPageToken(null);
                setPrevPageToken(null);
                setLastQuery(queryToUse);
                setActiveTab('results');
            }
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

        const showModal = (items) => {
            const withUrls = (items || []).map((v) => ({
                ...v,
                _url: videoUrlFromItem(v),
            }));
            setPlaylistModal({
                open: true,
                items: withUrls,
                title: item.title || 'Playlist',
                count: withUrls.length,
            });
            setLastPlaylistSnapshot({ items: withUrls, title: item.title || 'Playlist', count: withUrls.length });
            setShowPlaylistOnOpen(true);
        };

        if (playlistVideos[playlistId]) {
            showModal(playlistVideos[playlistId]);
            return;
        }

        try {
            const vidsRaw = await getPlaylistVideos(playlistId);
            const vids = (vidsRaw || []).map((v) => ({ ...v, _url: videoUrlFromItem(v) }));
            setPlaylistVideos((prev) => ({ ...prev, [playlistId]: vids }));
            showModal(vids);
            setLastPlaylistSnapshot({ items: vids, title: item.title || 'Playlist', count: vids.length });
            setShowPlaylistOnOpen(true);
        } catch (err) {
            console.error('Failed to load playlist items', err);
        }
    };

    useEffect(() => {
        localStorage.setItem('yt_search_query', searchQuery);
        if (searchQuery === '') focusInput();
    }, [searchQuery]);

    useEffect(() => {
        localStorage.setItem('yt_search_type', searchType);
        setNextPageToken(null);
        setPrevPageToken(null);
        setLastQuery('');
        // load cached results for this mode
        const cached = getCachedResults(searchType);
        if (cached.length) {
            setResults(sortResults(cached));
        } else {
            setResults([]);
        }
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
        if (playlistModal.open) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return () => { document.body.style.overflow = prev; };
        }
    }, [playlistModal.open]);

    useEffect(() => {
        if (isOpen) {
            focusInput();
            // restore cached results for current mode on open
            const cached = getCachedResults(searchType);
            if (cached.length) {
                setResults(sortResults(cached));
            }
        }
        if (isOpen && showPlaylistOnOpen && lastPlaylistSnapshot && !playlistModal.open) {
            setPlaylistModal({
                open: true,
                items: lastPlaylistSnapshot.items || [],
                title: lastPlaylistSnapshot.title || 'Playlist',
                count: lastPlaylistSnapshot.count || 0,
            });
            setShowPlaylistOnOpen(false);
        }
    }, [isOpen, searchType]);

    useEffect(() => {
        if (externalQuery) {
            setSearchQuery(externalQuery);
            setIsSearchVisible(true);
            handleSearch('', externalQuery);
            localStorage.setItem('yt_search_type', searchType);
        }
    }, [externalQuery]);

    useEffect(() => {
        localStorage.setItem('yt_active_tab', activeTab);
    }, [activeTab]);

    useEffect(() => {
        if (isOpen) {
            setActiveTab((prev) => prev || 'search');
        }
    }, [isOpen]);

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

    // Re-run search on filter change so results respect the filter selection
    useEffect(() => {
        if (!lastQuery) return;
        handleSearch('', lastQuery);
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
        <div
            className={`chat-drawer full ${isOpen ? 'open' : ''}`}
            style={{
                maxWidth: '100%',
                margin: 0,
                background: 'rgba(5,10,20,0.94)',
                padding: 0,
                left: 0,
            }}
        >
            {playlistModal.open && createPortal(
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.65)',
                        zIndex: 20000,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        padding: '1rem',
                        overflowY: 'auto',
                    }}
                    onClick={() => setPlaylistModal({ open: false, items: [], title: '', count: 0 })}
                >
                    <div
                        style={{
                            width: 'min(900px, 100%)',
                            maxHeight: '90vh',
                            background: '#0b1220',
                            border: '1px solid rgba(148,163,184,0.35)',
                            borderRadius: '16px',
                            padding: '1rem',
                            boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
                            overflow: 'hidden',
                            marginTop: '2rem',
                            marginBottom: '2rem',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', gap: '0.5rem' }}>
                            <div>
                                <p className="eyebrow" style={{ marginBottom: 4 }}>Playlist</p>
                                <h3 style={{ margin: 0, color: '#e2e8f0' }}>{playlistModal.title}</h3>
                                <small style={{ color: '#94a3b8' }}>{playlistModal.count} videos</small>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                {onFetchPlaylist && (
                                    <button
                                        className="btn primary-btn"
                                        onClick={() => {
                                            onFetchPlaylist(playlistModal.items || []);
                                            setShowPlaylistOnOpen(true);
                                        }}
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        Fetch transcripts
                                    </button>
                                )}
                                <button className="close-chat-btn" onClick={() => setPlaylistModal({ open: false, items: [], title: '', count: 0 })}>×</button>
                            </div>
                        </div>
                        <div className="playlist-items" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            {playlistModal.items.length === 0 && (
                                <div style={{ color: '#94a3b8', fontSize: '0.95rem', textAlign: 'center', padding: '1rem' }}>
                                    No videos found.
                                </div>
                            )}
                            {playlistModal.items.map((vid, idx) => {
                                const vUrl = videoUrlFromItem(vid);
                                const vidThumb = vid?.thumbnails?.high?.url || vid?.thumbnails?.standard?.url || vid?.thumbnails?.medium?.url || vid?.thumbnails?.default?.url;
                                return (
                                    <div key={idx} className="playlist-item-row">
                                        <img
                                            className="playlist-item-thumb"
                                            src={vidThumb || ''}
                                            alt={vid.title}
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                        <div className="playlist-item-meta">
                                            <div style={{ fontWeight: 700, lineHeight: 1.2 }}>{vid.title}</div>
                                            <small>{vid.channelTitle}</small>
                                            <div className="video-actions" style={{ marginTop: '0.15rem' }}>
                                                <button
                                                  className='btn primary-btn'
                                                  onClick={() => {
                                                    handleUseVideo(vUrl);
                                                    setLastPlaylistSnapshot({ items: playlistModal.items, title: playlistModal.title, count: playlistModal.count });
                                                    setShowPlaylistOnOpen(true);
                                                    setPlaylistModal({ open: false, items: [], title: '', count: 0 });
                                                  }}
                                                  style={{ whiteSpace: 'nowrap' }}
                                                >
                                                  Use
                                                </button>
                                                <button className='btn secondary-btn' onClick={() => handleCopy(vUrl)}>{copiedUrl === vUrl ? 'Copied!' : 'Copy'}</button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>,
                document.body
            )}
            <div className="drawer-body" style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '100vh' }}>
                <style>{`
                  .yt-shell {
                    background: radial-gradient(circle at 10% 10%, rgba(79,70,229,0.12), transparent 30%), radial-gradient(circle at 90% 20%, rgba(14,165,233,0.18), transparent 32%), #060b16;
                    color: #e2e8f0;
                    border-radius: 18px;
                    padding: 1rem;
                    box-shadow: 0 28px 80px rgba(0,0,0,0.55);
                    min-height: calc(100vh - 1.5rem);
                  }
                  .yt-search-card {
                    background: #0b1220;
                    border: 1px solid rgba(148, 163, 184, 0.35);
                    border-radius: 16px;
                    padding: 1rem;
                    box-shadow: 0 16px 48px rgba(0,0,0,0.35);
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
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 1rem;
                  }
                  .result-card {
                    background: linear-gradient(145deg, rgba(15,23,42,0.9), rgba(10,14,26,0.9));
                    border: 1px solid rgba(148,163,184,0.35);
                    border-radius: 14px;
                    padding: 0.9rem;
                    display: grid;
                    grid-template-columns: 120px 1fr;
                    gap: 0.75rem;
                    align-items: stretch;
                    box-shadow: 0 14px 32px rgba(0,0,0,0.25);
                  }
                  .thumb {
                    width: 100%;
                    height: auto;
                    aspect-ratio: 16 / 9;
                    border-radius: 12px;
                    object-fit: cover;
                    background: #1f2937;
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
                    background: rgba(15,23,42,0.9);
                    border: 1px dashed rgba(148,163,184,0.4);
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 0.65rem;
                  }
                  .playlist-item-row {
                    display: grid;
                    grid-template-columns: 100px 1fr;
                    gap: 0.55rem;
                    padding: 0.55rem;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(148,163,184,0.25);
                    border-radius: 12px;
                    box-shadow: 0 6px 20px rgba(0,0,0,0.18);
                  }
                  .playlist-item-thumb {
                    width: 100%;
                    height: 90px;
                    aspect-ratio: 16 / 9;
                    border-radius: 10px;
                    object-fit: cover;
                    background: #0f172a;
                  }
                  .playlist-item-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                    color: #e2e8f0;
                  }
                  .playlist-item-meta small {
                    color: #94a3b8;
                  }
                  .playlist-toggle {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 0.35rem 0.55rem;
                    background: rgba(34,211,238,0.12);
                    border: 1px solid rgba(34,211,238,0.3);
                    border-radius: 10px;
                    color: #cbd5e1;
                    cursor: pointer;
                  }
                  @media (max-width: 640px) {
                    .result-card { grid-template-columns: 1fr; }
                    .thumb { width: 100%; height: auto; aspect-ratio: 16/9; }
                    .yt-shell { padding: 0.75rem; min-height: 100vh; }
                    .yt-search-card { position: static; }
                    .yt-header h3 { font-size: 1rem; }
                    .segmented { grid-template-columns: repeat(auto-fit,minmax(120px,1fr)); }
                    .result-card { gap: 0.6rem; }
                    .drawer-body { padding-bottom: 1.5rem; }
                  }
                `}</style>

                <div className="yt-shell">
                    <div className="yt-search-card" style={{ position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(6px)' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                            <button
                                className={`btn ${activeTab === 'search' ? 'primary-btn' : 'secondary-btn'}`}
                                onClick={() => setActiveTab('search')}
                                style={{ flex: '1 1 110px', minWidth: '0', padding: '0.45rem 0.6rem' }}
                            >
                                Search
                            </button>
                            <button
                                className={`btn ${activeTab === 'results' ? 'primary-btn' : 'secondary-btn'}`}
                                onClick={() => setActiveTab('results')}
                                style={{ flex: '1 1 110px', minWidth: '0', padding: '0.45rem 0.6rem' }}
                            >
                                Results
                            </button>
                        </div>
                        <div className="yt-header">
                            <div>
                                <p className="eyebrow">Smart search</p>
                                <h3 style={{ margin: 0 }}>Find the perfect video or playlist</h3>
                            </div>
                            <button className="close-chat-btn" onClick={onClose}>×</button>
                        </div>

                        <div style={{ marginTop: "10px", display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <button className="btn secondary-btn" onClick={getYoutubeTrending}>🔥 Trending</button>
                                <button className="btn secondary-btn" onClick={getYoutubeNews}>📰 News</button>
                            </div>
                            <small style={{ color: '#94a3b8' }}>{results.length} result{results.length === 1 ? '' : 's'}</small>
                        </div>

                        {isSearchVisible && activeTab === 'search' && (
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

                                <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                    <button className='btn primary-btn' disabled={!searchQuery.trim() || loading} onClick={() => handleSearch('', searchQuery)}>
                                        {loading ? 'Searching...' : 'Search'}
                                    </button>
                                    {searchType === 'video' && (
                                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                            <button
                                                className='btn secondary-btn'
                                                disabled={!prevPageToken || loading || !lastQuery}
                                                onClick={() => handleSearch(prevPageToken, lastQuery)}
                                            >
                                                ◀ Prev
                                            </button>
                                            <button
                                                className='btn secondary-btn'
                                                disabled={!nextPageToken || loading || !lastQuery}
                                                onClick={() => handleSearch(nextPageToken, lastQuery)}
                                            >
                                                Next ▶
                                            </button>
                                            <small style={{ color: '#94a3b8' }}>50 per page</small>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Results */}
                    {activeTab === 'results' && (
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
                                          <div style={{ width: '100%', height: '100%' }}>
                                              {thumb && (
                                                  <img
                                                      src={thumb}
                                                      alt={item.title}
                                                      className="thumb"
                                                  />
                                              )}
                                          </div>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
                                              <h5 style={{ margin: 0, fontSize: '1rem', color: '#e2e8f0', lineHeight: 1.3 }}>{item.title}</h5>
                                              <p style={{ margin: 0, fontSize: '0.9rem', color: '#cbd5e1' }}>{item.channelTitle}</p>
                                              <div className="video-actions">
                                                  {item._prettyDuration && <span className="pill">⏱ {item._prettyDuration}</span>}
                                                  {item._publishedAt && <span className="pill">📅 {new Date(item._publishedAt).toLocaleDateString()}</span>}
                                                  {item.viewCount && <span className="pill">👁️ {Number(item.viewCount).toLocaleString()}</span>}
                                                  {item.likeCount && <span className="pill">👍 {Number(item.likeCount).toLocaleString()}</span>}
                                              </div>

                                              {isPlaylist ? (
                                                  <button
                                                      className='btn secondary-btn'
                                                      style={{ marginTop: '0.4rem' }}
                                                      onClick={() => togglePlaylist(item)}
                                                  >
                                                      <span className="playlist-toggle">View playlist videos</span>
                                                      <span className="pill">{(playlistItems?.length || 0)} videos</span>
                                                  </button>
                                              ) : (
                                                  <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                      <button className='btn primary-btn' onClick={() => handleUseVideo(videoUrl)}>Use this video</button>
                                                      <button className='btn secondary-btn' onClick={() => handleCopy(videoUrl)}>
                                                          {copiedUrl === videoUrl ? 'Copied!' : 'Copy URL'}
                                                      </button>
                                                  </div>
                                              )}
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                    )}
                </div>
            </div>
        </div>
    );
}
