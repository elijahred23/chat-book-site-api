import React, { useState, useRef, useEffect } from "react";

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
    <div style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "Arial, sans-serif" }}>
      <h2>Media Player</h2>

      <input
        type="file"
        accept="audio/*,video/*"
        onChange={handleFileUpload}
      />
      {fileName && <p><strong>Playing:</strong> {fileName}</p>}

      {fileUrl && (
        <>
          <video
            ref={mediaRef}
            src={fileUrl}
            controls
            loop={!intervalLoop && loopFile}
            onSeeked={handleSeeked}
            style={{ width: "100%", marginBottom: "1rem" }}
          />

          <div style={{ margin: "1rem 0" }}>
            <label>Speed: {speed.toFixed(2)}x</label>
            <br/>
            <input
              type="range"
              min="0.25"
              max="3"
              step="0.05"
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
          </div>

          <div>
            <label>
              <input
                type="checkbox"
                checked={loopFile}
                onChange={(e) => setLoopFile(e.target.checked)}
              />
              Loop Entire File
            </label>
          </div>

          <div style={{ padding: "1rem", border: "1px solid #ccc", marginTop: "1rem" }}>
            <label>
              <input
                type="checkbox"
                checked={intervalLoop}
                onChange={(e) => setIntervalLoop(e.target.checked)}
              />
              Enable Interval Loop
            </label>

            {intervalLoop && (
              <>
                <div style={{ marginTop: "0.5rem" }}>
                  <label>Interval: {intervalSec}s</label><br/>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={intervalSec}
                    onChange={(e) => setIntervalSec(Number(e.target.value))}
                  />
                </div>
                <div style={{ marginTop: "0.5rem" }}>
                  <label>Total Plays:
                    {targetRepeats === 0 ? " ∞" : ` ${targetRepeats}`}
                  </label><br/>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={targetRepeats}
                    onChange={(e) => setTargetRepeats(Number(e.target.value))}
                  />
                </div>
                <p>
                  Progress: {targetRepeats === 0 
                    ? `${currentPlayCount} / ∞` 
                    : `${currentPlayCount} / ${targetRepeats}`}
                </p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
