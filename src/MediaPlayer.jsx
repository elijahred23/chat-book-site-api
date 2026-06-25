import { useState, useRef, useEffect } from "react";
import "./MediaPlayer.css";

const SETTINGS_KEY = "media-player-settings-v1";

const defaultSettings = {
  speed: 1,
  loopFile: true,
  intervalLoop: false,
  intervalSec: 10,
  targetRepeats: 3,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getSavedSettings() {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  try {
    const saved = JSON.parse(window.localStorage.getItem(SETTINGS_KEY));

    return {
      speed: Number.isFinite(saved?.speed) ? clamp(saved.speed, 0.25, 3) : defaultSettings.speed,
      loopFile: typeof saved?.loopFile === "boolean" ? saved.loopFile : defaultSettings.loopFile,
      intervalLoop: typeof saved?.intervalLoop === "boolean" ? saved.intervalLoop : defaultSettings.intervalLoop,
      intervalSec: Number.isFinite(saved?.intervalSec) ? clamp(saved.intervalSec, 1, 60) : defaultSettings.intervalSec,
      targetRepeats: Number.isFinite(saved?.targetRepeats) ? clamp(saved.targetRepeats, 0, 10) : defaultSettings.targetRepeats,
    };
  } catch {
    return defaultSettings;
  }
}

export default function MediaPlayer() {
  const [savedSettings] = useState(getSavedSettings);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileName, setFileName] = useState("");
  const [speed, setSpeed] = useState(savedSettings.speed);
  const [loopFile, setLoopFile] = useState(savedSettings.loopFile);
  const [intervalLoop, setIntervalLoop] = useState(savedSettings.intervalLoop);
  const [intervalSec, setIntervalSec] = useState(savedSettings.intervalSec);
  const [isPlaying, setIsPlaying] = useState(false);

  // Total plays (play + repeats). e.g., 3 means 1 play + 2 repeats.
  const [targetRepeats, setTargetRepeats] = useState(savedSettings.targetRepeats);
  const [currentPlayCount, setCurrentPlayCount] = useState(1);

  const mediaRef = useRef(null);
  const segmentStartRef = useRef(0);
  const playCountRef = useRef(1);

  // A lock to avoid handling the same boundary multiple times
  const boundaryLockRef = useRef(false);
  // Flag to detect programmatic seeks versus user seeks
  const isProgrammaticSeek = useRef(false);

  const timerRef = useRef(null);

  useEffect(() => {
    window.localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ speed, loopFile, intervalLoop, intervalSec, targetRepeats })
    );
  }, [speed, loopFile, intervalLoop, intervalSec, targetRepeats]);

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clean up the previous URL to prevent memory leaks
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }

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
    setIsPlaying(false);
  };

  // Seek helper
  const seek = (seconds) => {
    if (mediaRef.current) {
      mediaRef.current.currentTime += seconds;
    }
  };

  const playMedia = async () => {
    if (!mediaRef.current) return;

    try {
      await mediaRef.current.play();
    } catch {
      setIsPlaying(false);
    }
  };

  const pauseMedia = () => {
    if (!mediaRef.current) return;

    mediaRef.current.pause();
  };

  const restartMedia = async () => {
    if (!mediaRef.current) return;

    isProgrammaticSeek.current = true;
    mediaRef.current.currentTime = 0;
    segmentStartRef.current = 0;
    playCountRef.current = 1;
    setCurrentPlayCount(1);
    boundaryLockRef.current = false;

    try {
      await mediaRef.current.play();
    } catch {
      setIsPlaying(false);
    }
  };

  // Update playback rate
  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.playbackRate = speed;
    }
  }, [speed]);

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      mediaRef.current.playbackRate = speed;
    }
  };

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
          <label className="mp-label" htmlFor="media-upload">Select Media File</label>
          <input
            id="media-upload"
            type="file"
            accept="audio/*,video/*,.mp3,.m4a,.wav,.mp4,.mov"
            onChange={handleFileUpload}
            className="mp-file-input"
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
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            onSeeked={handleSeeked}
            onLoadedMetadata={handleLoadedMetadata}
            className="mp-video"
          />

          <div className="mp-section">
            <label className="mp-label">Quick Seek</label>
            <div className="mp-transport-grid">
              <button className="mp-btn mp-btn-primary" onClick={playMedia} disabled={isPlaying}>Play</button>
              <button className="mp-btn" onClick={pauseMedia} disabled={!isPlaying}>Pause</button>
              <button className="mp-btn" onClick={restartMedia}>Restart</button>
            </div>
            <div className="mp-seek-grid">
              <button className="mp-btn" onClick={() => seek(-30)}>-30s</button>
              <button className="mp-btn" onClick={() => seek(-10)}>-10s</button>
              <button className="mp-btn" onClick={() => seek(10)}>+10s</button>
              <button className="mp-btn" onClick={() => seek(30)}>+30s</button>
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

          <div className="mp-section">
            <label className="mp-label">Playback Options</label>
            <div className="mp-toggle-grid">
              <button
                type="button"
                className={loopFile ? "mp-toggle is-on" : "mp-toggle"}
                aria-pressed={loopFile}
                onClick={() => setLoopFile((value) => !value)}
              >
                <span>Loop File</span>
              </button>
              <button
                type="button"
                className={intervalLoop ? "mp-toggle is-on" : "mp-toggle"}
                aria-pressed={intervalLoop}
                onClick={() => setIntervalLoop((value) => !value)}
              >
                <span>Interval Loop</span>
              </button>
            </div>

            {intervalLoop && (
              <div className="mp-loop-panel">
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
                    <span className="mp-label-value">
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
                <p className="mp-progress">
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
