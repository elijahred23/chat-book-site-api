import React, { useState, useRef, useEffect } from "react";
import "./MediaPlayer.css";

export default function MediaPlayer() {
  const [fileUrl, setFileUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const [speed, setSpeed] = useState(1);
  const [loopFile, setLoopFile] = useState(true);
  const [intervalLoop, setIntervalLoop] = useState(false);
  const [intervalSec, setIntervalSec] = useState(10);

  // Total plays (play + repeats). e.g., 3 means 1 play + 2 repeats.
  const [targetRepeats, setTargetRepeats] = useState(3);
  const [currentPlayCount, setCurrentPlayCount] = useState(1);

  const mediaRef = useRef(null);
  const segmentStartRef = useRef(0);
  const playCountRef = useRef(1);

  // A lock to avoid handling the same boundary multiple times
  const boundaryLockRef = useRef(false);
  // Flag to detect programmatic seeks versus user seeks
  const isProgrammaticSeek = useRef(false);

  const timerRef = useRef(null);

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    setFileName(file.name);

    // Reset when loading a new file
    segmentStartRef.current = 0;
    playCountRef.current = 1;
    setCurrentPlayCount(1);
    if (mediaRef.current) {
      mediaRef.current.pause();
      mediaRef.current.currentTime = 0;
    }
  };

  // Seek helper
  const seek = (seconds) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime += seconds;
    }
  };

  // Update playback rate
  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.playbackRate = speed;
    }
  }, [speed]);

  // Manage interval looping logic
  useEffect(() => {
    const media = mediaRef.current;
    if (!media || !intervalLoop) return;

    // On enabling interval loop or changing interval, reset segment anchor
    const current = media.currentTime;
    segmentStartRef.current =
      Math.floor(current / intervalSec) * intervalSec;
    playCountRef.current = 1;
    setCurrentPlayCount(1);
    boundaryLockRef.current = false;

    // Clear any existing timer
    clearInterval(timerRef.current);

    // Check position every 50ms
    timerRef.current = setInterval(() => {
      if (!media) return;
      const start = segmentStartRef.current;
      const end = start + intervalSec;
      const now = media.currentTime;

      // Unlock if playhead is inside the interval
      if (now < end - 0.5) {
        boundaryLockRef.current = false;
      }
      if (boundaryLockRef.current) return;

      // When reaching (or passing) the end of interval
      if (now >= end - 0.05) {
        boundaryLockRef.current = true;

        // Infinite loop mode for the segment
        if (targetRepeats === 0) {
          isProgrammaticSeek.current = true;
          media.currentTime = start;
          return;
        }

        // Loop again if still under target plays
        if (playCountRef.current < targetRepeats) {
          playCountRef.current += 1;
          setCurrentPlayCount(playCountRef.current);
          isProgrammaticSeek.current = true;
          media.currentTime = start;
          return;
        }

        // Completed repeats for this segment
        const nextStart = start + intervalSec;
        segmentStartRef.current = nextStart;
        playCountRef.current = 1;
        setCurrentPlayCount(1);

        // If within media duration, allow continuing playback to next segment.
        // Otherwise, if looping entire file, jump to start.
        if (nextStart >= media.duration && loopFile) {
          segmentStartRef.current = 0;
          isProgrammaticSeek.current = true;
          media.currentTime = 0;
        }
      }
    }, 50);

    return () => clearInterval(timerRef.current);
  }, [intervalLoop, intervalSec, targetRepeats, loopFile]);

  // Handle user seek (dragging the playhead)
  const handleSeeked = () => {
    const media = mediaRef.current;
    if (!media) return;

    // Ignore programmatic seeks
    if (isProgrammaticSeek.current) {
      isProgrammaticSeek.current = false;
      return;
    }

    // Reset anchor and count based on where the user seeks
    const current = media.currentTime;
    segmentStartRef.current =
      Math.floor(current / intervalSec) * intervalSec;
    playCountRef.current = 1;
    setCurrentPlayCount(1);
    boundaryLockRef.current = false;
  };

  return (
    <div className="mp-shell">
      <div className="mp-card">
        <h2 className="mp-title">Media Player</h2>

        <div className="mp-section">
          <label className="mp-label">Select Media File</label>
          <input
            type="file"
            accept="audio/*,video/*"
            onChange={handleFileUpload}
            className="mp-meta"
          />
          {fileName && (
            <p className="mp-meta" style={{ marginTop: "0.5rem" }}>
              <strong>Now Playing:</strong> {fileName}
            </p>
          )}
        </div>

      {fileUrl && (
        <>
          <video
            ref={mediaRef}
            src={fileUrl}
            controls
            loop={!intervalLoop && loopFile}
            onSeeked={handleSeeked}
            className="mp-video"
          />

          <div className="mp-section">
            <label className="mp-label">Quick Seek</label>
            <div className="mp-seek-grid">
              <button className="mp-btn" onClick={() => seek(-60)}>-1m</button>
              <button className="mp-btn" onClick={() => seek(-30)}>-30s</button>
              <button className="mp-btn" onClick={() => seek(-10)}>-10s</button>
              <button className="mp-btn" onClick={() => seek(-5)}>-5s</button>
              <button className="mp-btn" onClick={() => seek(5)}>+5s</button>
              <button className="mp-btn" onClick={() => seek(10)}>+10s</button>
              <button className="mp-btn" onClick={() => seek(30)}>+30s</button>
              <button className="mp-btn" onClick={() => seek(60)}>+1m</button>
            </div>
          </div>

          <div className="mp-section">
            <label className="mp-label">Speed: {speed.toFixed(2)}x</label>
            <input
              type="range"
              min="0.25"
              max="3"
              step="0.05"
              value={speed}
              className="mp-range"
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
          </div>

          <div className="mp-section" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={loopFile}
                onChange={(e) => setLoopFile(e.target.checked)}
              />
              <span>Loop Entire File</span>
            </label>
          </div>

          <div className="mp-section">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, cursor: 'pointer', marginBottom: intervalLoop ? '1rem' : 0 }}>
              <input
                type="checkbox"
                checked={intervalLoop}
                onChange={(e) => setIntervalLoop(e.target.checked)}
              />
              <span>Enable Interval Loop</span>
            </label>

            {intervalLoop && (
              <div style={{ display: 'grid', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                <div>
                  <label className="mp-label">Interval: {intervalSec}s</label>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={intervalSec}
                    className="mp-range"
                    onChange={(e) => setIntervalSec(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="mp-label">
                    Total Plays:
                    <span style={{ fontSize: '1.1rem', marginLeft: '4px' }}>
                      {targetRepeats === 0 ? "∞" : targetRepeats}
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={targetRepeats}
                    className="mp-range"
                    onChange={(e) => setTargetRepeats(Number(e.target.value))}
                  />
                </div>
                <p>
                  Progress: {targetRepeats === 0 
                    ? `${currentPlayCount} / ∞` 
                    : `${currentPlayCount} / ${targetRepeats}`}
                </p>
              </div>
            )}
          </div>
        </>
      )}
      </div>
    </div>
  );
}
