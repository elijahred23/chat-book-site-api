import { useEffect, useMemo, useState } from "react";
import "./GuitarTabs.css";

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const NOTE_TO_INDEX = NOTES.reduce((acc, note, idx) => {
  acc[note] = idx;
  return acc;
}, {});

const STRINGS = [
  { label: "e", open: "E" },
  { label: "B", open: "B" },
  { label: "G", open: "G" },
  { label: "D", open: "D" },
  { label: "A", open: "A" },
  { label: "E", open: "E" },
];

const FRET_COUNT = 12;
const SCALE_DEFINITIONS = {
  major: { label: "Major (Ionian)", intervals: [0, 2, 4, 5, 7, 9, 11] },
  minor: { label: "Natural Minor (Aeolian)", intervals: [0, 2, 3, 5, 7, 8, 10] },
  harmonic_minor: { label: "Harmonic Minor", intervals: [0, 2, 3, 5, 7, 8, 11] },
  melodic_minor: { label: "Melodic Minor", intervals: [0, 2, 3, 5, 7, 9, 11] },
  major_pentatonic: { label: "Major Pentatonic", intervals: [0, 2, 4, 7, 9] },
  minor_pentatonic: { label: "Minor Pentatonic", intervals: [0, 3, 5, 7, 10] },
  blues: { label: "Blues", intervals: [0, 3, 5, 6, 7, 10] },
  dorian: { label: "Dorian", intervals: [0, 2, 3, 5, 7, 9, 10] },
  phrygian: { label: "Phrygian", intervals: [0, 1, 3, 5, 7, 8, 10] },
  lydian: { label: "Lydian", intervals: [0, 2, 4, 6, 7, 9, 11] },
  mixolydian: { label: "Mixolydian", intervals: [0, 2, 4, 5, 7, 9, 10] },
  locrian: { label: "Locrian", intervals: [0, 1, 3, 5, 6, 8, 10] },
};

const DEGREE_META = {
  major: [
    { degree: "I", quality: "maj" },
    { degree: "ii", quality: "min" },
    { degree: "iii", quality: "min" },
    { degree: "IV", quality: "maj" },
    { degree: "V", quality: "maj" },
    { degree: "vi", quality: "min" },
    { degree: "vii°", quality: "dim" },
  ],
  minor: [
    { degree: "i", quality: "min" },
    { degree: "ii°", quality: "dim" },
    { degree: "III", quality: "maj" },
    { degree: "iv", quality: "min" },
    { degree: "v", quality: "min" },
    { degree: "VI", quality: "maj" },
    { degree: "VII", quality: "maj" },
  ],
};

const CHORD_COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#9333ea",
  "#d97706",
  "#0891b2",
  "#be185d",
];

const QUALITY_SUFFIX = {
  maj: "",
  min: "m",
  dim: "dim",
  aug: "aug",
  sus2: "sus2",
  sus4: "sus4",
  triad: "triad",
};

function getNoteAt(openNote, fret) {
  const openIdx = NOTE_TO_INDEX[openNote];
  return NOTES[(openIdx + fret) % NOTES.length];
}

function buildScale(root, scaleType) {
  const rootIdx = NOTE_TO_INDEX[root];
  const scale = SCALE_DEFINITIONS[scaleType]?.intervals || SCALE_DEFINITIONS.major.intervals;
  return scale.map((interval) => NOTES[(rootIdx + interval) % NOTES.length]);
}

function inferTriadQuality(root, third, fifth) {
  const r = NOTE_TO_INDEX[root];
  const t = NOTE_TO_INDEX[third];
  const f = NOTE_TO_INDEX[fifth];
  const i3 = (t - r + 12) % 12;
  const i5 = (f - r + 12) % 12;

  if (i3 === 4 && i5 === 7) return "maj";
  if (i3 === 3 && i5 === 7) return "min";
  if (i3 === 3 && i5 === 6) return "dim";
  if (i3 === 4 && i5 === 8) return "aug";
  if (i3 === 2 && i5 === 7) return "sus2";
  if (i3 === 5 && i5 === 7) return "sus4";
  return "triad";
}

function buildDiatonicChords(scaleType, scaleNotes) {
  const fixedDegrees = DEGREE_META[scaleType] || null;
  return scaleNotes.map((_, idx) => {
    const triad = [
      scaleNotes[idx % scaleNotes.length],
      scaleNotes[(idx + 2) % scaleNotes.length],
      scaleNotes[(idx + 4) % scaleNotes.length],
    ];
    const root = triad[0];
    const quality = fixedDegrees?.[idx]?.quality || inferTriadQuality(triad[0], triad[1], triad[2]);
    const degree = fixedDegrees?.[idx]?.degree || String(idx + 1);
    return {
      id: `${degree}:${root}:${quality}`,
      degree,
      quality,
      root,
      notes: triad,
      label: `${degree} · ${root}${QUALITY_SUFFIX[quality] ? ` ${QUALITY_SUFFIX[quality]}` : ""}`.trim(),
    };
  });
}

export default function GuitarTabs() {
  const [root, setRoot] = useState("C");
  const [scaleType, setScaleType] = useState("major");
  const [selectedChordIds, setSelectedChordIds] = useState([]);

  const scaleNotes = useMemo(() => buildScale(root, scaleType), [root, scaleType]);
  const chords = useMemo(() => buildDiatonicChords(scaleType, scaleNotes), [scaleType, scaleNotes]);
  const selectedChords = useMemo(
    () => chords.filter((chord) => selectedChordIds.includes(chord.id)),
    [chords, selectedChordIds]
  );

  const chordColorById = useMemo(() => {
    const colorMap = {};
    selectedChordIds.forEach((id, idx) => {
      colorMap[id] = CHORD_COLORS[idx % CHORD_COLORS.length];
    });
    return colorMap;
  }, [selectedChordIds]);

  useEffect(() => {
    setSelectedChordIds([]);
  }, [root, scaleType]);

  const toggleChord = (id) => {
    setSelectedChordIds((prev) => {
      if (prev.includes(id)) return prev.filter((v) => v !== id);
      return [...prev, id];
    });
  };

  const colorForNote = (note) => {
    for (const chordId of selectedChordIds) {
      const chord = chords.find((c) => c.id === chordId);
      if (chord && chord.notes.includes(note)) {
        return chordColorById[chordId];
      }
    }
    return null;
  };

  return (
    <div className="gt-page">
      <div className="gt-shell">
        <div className="gt-card">
          <div className="gt-header">
            <div>
              <h2 style={{ margin: 0 }}>Guitar Tabs</h2>
              <div className="gt-muted">Pick a key + scale, then select diatonic chords to color the fretboard.</div>
            </div>
            <div className="gt-controls">
              <label className="gt-label">
                Root
                <select className="gt-select" value={root} onChange={(e) => setRoot(e.target.value)}>
                  {NOTES.map((note) => (
                    <option key={note} value={note}>
                      {note}
                    </option>
                  ))}
                </select>
              </label>
              <label className="gt-label">
                Scale
                <select className="gt-select" value={scaleType} onChange={(e) => setScaleType(e.target.value)}>
                  {Object.entries(SCALE_DEFINITIONS).map(([key, cfg]) => (
                    <option key={key} value={key}>
                      {cfg.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="gt-scale-notes">
            {scaleNotes.map((note) => (
              <span key={note} className="gt-note-pill">
                {note}
              </span>
            ))}
          </div>

          <div className="gt-chip-row">
            {chords.map((chord) => {
              const active = selectedChordIds.includes(chord.id);
              const color = active ? chordColorById[chord.id] : "#e2e8f0";
              return (
                <button
                  key={chord.id}
                  className={`gt-chip ${active ? "active" : ""}`}
                  onClick={() => toggleChord(chord.id)}
                  style={{ borderColor: color, background: active ? `${color}22` : "#ffffff" }}
                >
                  {chord.label}
                </button>
              );
            })}
          </div>

          <div className="gt-board-wrap">
            <div className="gt-board">
              <div className="gt-row gt-frets">
                <div className="gt-string-label" />
                {Array.from({ length: FRET_COUNT + 1 }, (_, fret) => (
                  <div key={`fret-${fret}`} className="gt-fret-label">
                    {fret}
                  </div>
                ))}
              </div>

              {STRINGS.map((stringInfo) => (
                <div key={stringInfo.label} className="gt-row">
                  <div className="gt-string-label">{stringInfo.label}</div>
                  {Array.from({ length: FRET_COUNT + 1 }, (_, fret) => {
                    const note = getNoteAt(stringInfo.open, fret);
                    const chordColor = colorForNote(note);
                    const inScale = scaleNotes.includes(note);
                    return (
                      <div
                        key={`${stringInfo.label}-${fret}`}
                        className={`gt-cell ${inScale ? "in-scale" : ""} ${chordColor ? "in-chord" : ""}`}
                        style={
                          chordColor
                            ? {
                                background: `${chordColor}22`,
                                borderColor: chordColor,
                                color: chordColor,
                              }
                            : undefined
                        }
                      >
                        <span>{note}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="gt-legend">
            {selectedChords.length === 0 ? (
              <span className="gt-muted">Select one or more chords to color matching notes.</span>
            ) : (
              selectedChords.map((chord) => (
                <span key={chord.id} className="gt-legend-item">
                  <span className="gt-dot" style={{ background: chordColorById[chord.id] }} />
                  {chord.label}: {chord.notes.join(" - ")}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
