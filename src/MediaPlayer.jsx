import React, { useState, useRef, useEffect } from 'react';

const MediaPlayer = () => {
  const [fileUrl, setFileUrl] = useState(null);
  const [fileName, setFileName] = useState('');
  const [speed, setSpeed] = useState(1);
  const [loop, setLoop] = useState(true);
  const [duration, setDuration] = useState(0);
  const mediaRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      setFileName(file.name);
    }
  };

  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.playbackRate = speed;
    }
  }, [speed, fileUrl]);

  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.loop = loop;
    }
  }, [loop]);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}:${s.toString().padStart(2, '0')}`;
  };

  const styles = {
    container: {
      maxWidth: '900px',
      margin: '0 auto',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
    },
    card: {
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: '0 10px 24px rgba(15,23,42,0.08)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1rem',
    },
    uploadBtn: {
      padding: '0.75rem 1.25rem',
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #2563eb, #60a5fa)',
      color: '#fff',
      fontWeight: '800',
      cursor: 'pointer',
      textAlign: 'center',
      border: 'none',
      boxShadow: '0 8px 20px rgba(37,99,235,0.2)',
    },
    controlRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '2rem',
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      background: '#f8fafc',
      padding: '1rem',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
    },
    sliderWrap: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem',
      flex: '1 1 200px',
    },
    checkboxWrap: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontWeight: '700',
      color: '#0f172a',
      cursor: 'pointer',
      userSelect: 'none',
    },
    inputRange: {
      width: '100%',
      cursor: 'pointer',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{ margin: 0, color: '#0f172a' }}>🎬 Media Player</h2>
        <p style={{ color: '#475569', textAlign: 'center', margin: 0 }}>
          Upload an audio or video file to play it with custom speed and looping.
        </p>

        <label style={styles.uploadBtn}>
          Upload File
          <input
            type="file"
            accept="audio/*,video/*"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </label>
        {fileName && <span style={{ color: '#0f172a', fontWeight: '700' }}>Playing: {fileName}</span>}

        {fileUrl && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <video
              ref={mediaRef}
              src={fileUrl}
              controls
              onLoadedMetadata={(e) => {
                if (mediaRef.current) {
                  mediaRef.current.playbackRate = speed;
                  setDuration(e.target.duration);
                }
              }}
              style={{ width: '100%', borderRadius: '12px', background: '#0f172a', maxHeight: '500px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <div style={styles.controlRow}>
              <div style={styles.sliderWrap}>
                <label style={{ fontWeight: '800', color: '#0f172a' }}>Speed: {speed}x</label>
                <input
                  type="range"
                  min="0.25"
                  max="3"
                  step="0.05"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  style={styles.inputRange}
                />
              </div>
              <div style={{ color: '#0f172a', fontWeight: '700', fontSize: '0.9rem', textAlign: 'center', minWidth: '160px' }}>
                Estimated Length: <span style={{ color: '#2563eb' }}>{formatTime(duration / speed)}</span>
              </div>
              <label style={styles.checkboxWrap}>
                <input
                  type="checkbox"
                  checked={loop}
                  onChange={(e) => setLoop(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                Loop Playback
              </label>
            </div>
          </div>
        )}
        {!fileUrl && (
          <div style={{ padding: '3rem', color: '#94a3b8', textAlign: 'center', border: '2px dashed #e2e8f0', borderRadius: '12px', width: '100%' }}>
            No file loaded. Click "Upload File" to start.
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaPlayer;