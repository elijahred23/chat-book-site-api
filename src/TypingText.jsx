import { useEffect, useMemo, useRef, useState } from 'react'
import './TypingText.css'
import PasteButton from './ui/PasteButton'
import ActionButtons from './ui/ActionButtons'
import { useAppState } from './context/AppContext'

/**
 * WPM formula:
 *   wpm = (correctChars / 5) / minutesElapsed
 * Accuracy:
 *   accuracy = correctChars / typedChars
 * Progress:
 *   progress = caretIndex / source.length
 */

export default function TypingTest() {
  const { typingSource } = useAppState();
  const [source, setSource] = useState(`// Paste code on the left, press "Load", then Start.
// Type exactly. Backspace to fix mistakes.
// Tip: Toggle "Tab ↹ as 2/4 spaces" if your snippet uses tabs.

function greet(name) {
  console.log("Hello, " + name + "!");
}

greet("world");`)
  const [loaded, setLoaded] = useState('')   // immutable copy used for the test
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)

  const [caret, setCaret] = useState(0)
  const [typed, setTyped] = useState('')     // what user actually typed (for metrics)
  const [errors, setErrors] = useState(0)

  const [startTs, setStartTs] = useState(null)
  const [nowTs, setNowTs] = useState(null)

  const [tabSize, setTabSize] = useState(2)
  const [showWhitespace, setShowWhitespace] = useState(false)
  const [autoStart, setAutoStart] = useState(false)
  const [ignoreCaseSensitivity, setIgnoreCaseSensitivity] = useState(true)
  const [skipSpaces, setSkipSpaces] = useState(true)
  const [skipNonAlphanumeric, setSkipNonAlphanumeric] = useState(true)
  const [autoTypeMode, setAutoTypeMode] = useState(false)
  const [autoTypeWpm, setAutoTypeWpm] = useState(80)

  const hiddenInputRef = useRef(null)
  const currentCharRef = useRef(null)
  const CHECKBOX_PREFS_KEY = 'typing-test-checkbox-prefs-v1'

  // Replace tabs according to UI setting for a consistent target text
  const normalized = useMemo(() => {
    const tab = ' '.repeat(tabSize)
    return loaded.replaceAll('\t', tab)
  }, [loaded, tabSize])

  const SHIFT_TO_UNSHIFTED = useMemo(() => ({
    '~': '`',
    '!': '1',
    '@': '2',
    '#': '3',
    '$': '4',
    '%': '5',
    '^': '6',
    '&': '7',
    '*': '8',
    '(': '9',
    ')': '0',
    '_': '-',
    '+': '=',
    '{': '[',
    '}': ']',
    '|': '\\',
    ':': ';',
    '"': '\'',
    '<': ',',
    '>': '.',
    '?': '/',
  }), [])

  const normalizeForComparison = (c) => {
    if (!ignoreCaseSensitivity) return c
    const lower = c.toLowerCase()
    return SHIFT_TO_UNSHIFTED[lower] ?? lower
  }

  const isAlphaNumeric = (c) => /[a-z0-9]/i.test(c)

  const applyAutoSkips = (startIndex, startTyped, { skipLineBreaks = false } = {}) => {
    let idx = startIndex
    let txt = startTyped

    while (idx < normalized.length) {
      if (skipLineBreaks && normalized[idx] === '\n') {
        let j = idx
        while (j < normalized.length && normalized[j] === '\n') j++
        txt += '\n'.repeat(j - idx)
        idx = j
        continue
      }

      const atLineStart = idx === 0 || normalized[idx - 1] === '\n'
      if (atLineStart && normalized[idx] === ' ') {
        let j = idx
        while (j < normalized.length && normalized[j] === ' ') j++
        txt += ' '.repeat(j - idx)
        idx = j
        continue
      }

      if (skipSpaces && normalized[idx] === ' ') {
        let j = idx
        while (j < normalized.length && normalized[j] === ' ') j++
        txt += ' '.repeat(j - idx)
        idx = j
        continue
      }

      if (skipNonAlphanumeric && !isAlphaNumeric(normalized[idx])) {
        let j = idx
        while (j < normalized.length && !isAlphaNumeric(normalized[j])) j++
        txt += normalized.slice(idx, j)
        idx = j
        continue
      }

      break
    }

    return { nextIndex: idx, nextTyped: txt }
  }

  // Focus the hidden input when started so we capture keystrokes anywhere
  useEffect(() => {
    if (started && !finished) hiddenInputRef.current?.focus()
  }, [started, finished])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CHECKBOX_PREFS_KEY)
      if (!raw) return
      const prefs = JSON.parse(raw)
      if (typeof prefs.showWhitespace === 'boolean') setShowWhitespace(prefs.showWhitespace)
      if (typeof prefs.ignoreCaseSensitivity === 'boolean') setIgnoreCaseSensitivity(prefs.ignoreCaseSensitivity)
      if (typeof prefs.skipSpaces === 'boolean') setSkipSpaces(prefs.skipSpaces)
      if (typeof prefs.skipNonAlphanumeric === 'boolean') setSkipNonAlphanumeric(prefs.skipNonAlphanumeric)
      if (typeof prefs.autoTypeMode === 'boolean') setAutoTypeMode(prefs.autoTypeMode)
      if (typeof prefs.autoTypeWpm === 'number' && Number.isFinite(prefs.autoTypeWpm)) {
        setAutoTypeWpm(Math.max(1, Math.round(prefs.autoTypeWpm)))
      }
    } catch {
      // Ignore invalid localStorage payload
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      CHECKBOX_PREFS_KEY,
      JSON.stringify({
        showWhitespace,
        ignoreCaseSensitivity,
        skipSpaces,
        skipNonAlphanumeric,
        autoTypeMode,
        autoTypeWpm,
      })
    )
  }, [showWhitespace, ignoreCaseSensitivity, skipSpaces, skipNonAlphanumeric, autoTypeMode, autoTypeWpm])

  useEffect(() => {
    if (!started || finished) return
    currentCharRef.current?.scrollIntoView({ block: 'center', inline: 'nearest' })
  }, [typed, started, finished, caret])

  const focus = () => {
    hiddenInputRef.current?.focus()
  }

  // Timer tick
  useEffect(() => {
    if (!started || finished) return
    const id = setInterval(() => setNowTs(Date.now()), 100)
    return () => clearInterval(id)
  }, [started, finished])

  useEffect(() => {
    if (!started || finished || !autoTypeMode) return
    const initial = applyAutoSkips(caret, typed)
    if (initial.nextIndex >= normalized.length) {
      setFinished(true)
      setStarted(false)
      return
    }

    const safeWpm = Math.max(1, Number(autoTypeWpm) || 80)
    const msPerChar = 60000 / (safeWpm * 5)

    const id = setTimeout(() => {
      const idx = initial.nextIndex
      const nextChar = normalized[idx] ?? ''
      let nextTyped = initial.nextTyped + nextChar
      let nextCaret = idx + 1

      const afterCorrect = applyAutoSkips(nextCaret, nextTyped, { skipLineBreaks: true })
      nextTyped = afterCorrect.nextTyped
      nextCaret = afterCorrect.nextIndex

      setTyped(nextTyped)
      setCaret(nextCaret)
      if (nextCaret >= normalized.length) {
        setFinished(true)
        setStarted(false)
      }
    }, msPerChar)

    return () => clearTimeout(id)
  }, [started, finished, autoTypeMode, autoTypeWpm, caret, typed, normalized, skipSpaces, skipNonAlphanumeric])

  const elapsedMs = useMemo(() => {
    if (!startTs) return 0
    return (nowTs ?? Date.now()) - startTs
  }, [startTs, nowTs])

  const correctChars = useMemo(() => {
    // count from 0..caret how many are correct vs normalized
    let ok = 0
    for (let i = 0; i < Math.min(caret, normalized.length); i++) {
      if (normalizeForComparison(typed[i]) === normalizeForComparison(normalized[i])) ok++
    }
    return ok
  }, [typed, caret, normalized, ignoreCaseSensitivity, SHIFT_TO_UNSHIFTED])

  const typedChars = typed.length
  const minutes = Math.max(elapsedMs / 60000, 1e-6)
  const wpm = Math.max(Math.round((correctChars / 5) / minutes), 0)
  const accuracy = typedChars ? Math.max(0, Math.min(1, correctChars / typedChars)) : 1
  const progress = normalized.length ? Math.min(1, caret / normalized.length) : 0

  const determineWordCount = (text) => {
    // Split the text by whitespace and filter out empty strings
    const words = text.trim().split(/\s+/).filter(Boolean);
    return words.length;
  };

  const predictedMinutesToComplete = useMemo(() => {
    let avgWpm = 60;
    let wordCount = determineWordCount(removeMarkdown(source));  
    let minutesToComplete = (wordCount / avgWpm).toFixed(2);
    return minutesToComplete;
  }, [source]);

  const start = () => {
    if (!normalized.length) return
    setStarted(true)
    setFinished(false)
    setCaret(0)
    setTyped('')
    setErrors(0)
    setStartTs(Date.now())
    setNowTs(Date.now())
    //setTimeout(() => hiddenInputRef.current?.focus(), 0)
  }

  const stop = () => {
    setStarted(false)
    setFinished(true)
  }
  function removeMarkdown(text) {
    // Preserve content of code blocks (```...```)
    text = text.replace(/```[\s\S]*?```/g, match =>
      match.replace(/```[a-zA-Z]*\n?/, '').replace(/```$/, '')
    );

    // Preserve content of inline code
    text = text.replace(/`([^`]*)`/g, '$1');

    // Remove images ![alt](url)
    text = text.replace(/!\[.*?\]\(.*?\)/g, '');

    // Convert links [text](url) → text
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1');

    // Remove bold, italics, strikethrough, underline
    text = text.replace(/(\*\*|__)(.*?)\1/g, '$2'); // Bold
    text = text.replace(/(\*|_)(.*?)\1/g, '$2');    // Italics
    text = text.replace(/~~(.*?)~~/g, '$1');        // Strikethrough

    // Remove headers
    text = text.replace(/^\s{0,3}#{1,6}\s*/gm, '');

    // Remove blockquotes
    text = text.replace(/^>\s?/gm, '');

    // Remove list markers
    text = text.replace(/^\s*[\*\-\+]\s+/gm, '');
    text = text.replace(/^\s*\d+\.\s+/gm, '');

    // Remove horizontal rules (***, ---)
    text = text.replace(/^([-*_] *){3,}$/gm, '');

    // Collapse multiple newlines
    text = text.replace(/\n{3,}/g, '\n\n');

    text = text.replace(/\n (?! )/g, '\n');

    return text.trim();
  }


  const handleLoad = () => {
    setLoaded(removeMarkdown(source))
    setStarted(false)
    setFinished(false)
    setCaret(0)
    setTyped('')
    setErrors(0)
    setStartTs(null)
    setNowTs(null)
  }

  useEffect(() => {
    if (typingSource) {
      setSource(typingSource);
      // auto load new snippet
      setLoaded(removeMarkdown(typingSource));
      setStarted(false);
      setFinished(false);
      setCaret(0);
      setTyped('');
      setErrors(0);
      setStartTs(null);
      setNowTs(null);
      setAutoStart(true);
    }
  }, [typingSource]);

  useEffect(() => {
    if (!autoStart) return;
    // Wait for normalized to update from loaded before starting
    start();
    setAutoStart(false);
  }, [autoStart, normalized]);

const handleKey = (e) => {
  if (!started || finished) return

  const key = e.key

  if (autoTypeMode) {
    if (key === ' ') {
      e.preventDefault()
      setAutoTypeMode(false)
    }
    return
  }

  // allow copy/select shortcuts
  if ((e.ctrlKey || e.metaKey) && ['c','x','a'].includes(key.toLowerCase())) return

  e.preventDefault()

  if (key === 'Escape') {
    stop()
    return
  }

  if (key === 'Backspace') {
    if (caret > 0) {
      let removeCount = 1

      if (typed[caret - 1] === ' ') {
        let j = caret - 1
        while (j >= 0 && typed[j] === ' ') j--
        removeCount = caret - (j + 1)
      }

      const newCaret = caret - removeCount
      setCaret(newCaret)
      setTyped(typed.slice(0, newCaret))
    }
    return
  }

  const ch = key === 'Enter' ? '\n' : (key.length === 1 ? key : '')
  if (!ch) return

  let { nextIndex, nextTyped } = applyAutoSkips(caret, typed)

  const text = normalized
  const len = text.length

  const finishIfDone = (idx) => {
    if (idx >= len) {
      setFinished(true)
      setStarted(false)
      return true
    }
    return false
  }

  // 🚀 skip word
  if (skipSpaces && ch === ' ') {
    let j = nextIndex

    while (j < len && text[j] !== ' ' && text[j] !== '\n') j++
    while (j < len && text[j] === ' ') j++

    if (j !== nextIndex) {
      setTyped(nextTyped + text.slice(nextIndex, j))
      setCaret(j)
      finishIfDone(j)
      return
    }
  }

  // 🚀 skip line
  if (skipSpaces && ch === '\n') {
    let j = nextIndex

    while (j < len && text[j] !== '\n') j++
    if (j < len) j++ // include newline
    while (j < len && text[j] === ' ') j++

    if (j !== nextIndex) {
      setTyped(nextTyped + text.slice(nextIndex, j))
      setCaret(j)
      finishIfDone(j)
      return
    }
  }

  // 👇 normal typing
  const expected = text[nextIndex] ?? ''

  const isExpectedKeyboardChar =
    (expected >= ' ' && expected <= '~') ||
    expected === '\n' ||
    expected === '\t'

  const isCorrect =
    (!isExpectedKeyboardChar) ||
    (normalizeForComparison(ch) === normalizeForComparison(expected))

  let finalCaret = nextIndex + 1
  let finalTyped = nextTyped + ch

  if (isCorrect) {
    const after = applyAutoSkips(finalCaret, finalTyped, { skipLineBreaks: true })
    finalCaret = after.nextIndex
    finalTyped = after.nextTyped
  }

  setTyped(finalTyped)
  setCaret(finalCaret)

  if (!isCorrect) setErrors(e => e + 1)

  finishIfDone(finalCaret)
}

  // Render code with three buckets: correct, incorrect, current, and upcoming
  const renderHighlighted = () => {
    const parts = []
    const N = normalized.length
    for (let i = 0; i < N; i++) {
      const exp = normalized[i]
      const got = typed[i]
      let cls = ''

      if (i < typed.length) {
        cls = normalizeForComparison(got) === normalizeForComparison(exp) ? 'ok' : 'bad';
      }
      else if (i === typed.length && started && !finished) cls = 'current'
      const charToShow = showWhitespace ? visualize(exp) : exp
      parts.push(
        <span
          key={i}
          className={cls}
          ref={i === typed.length && started && !finished ? currentCharRef : null}
        >
          {charToShow}
        </span>
      )
    }
    return parts
  }

  function visualize(ch) {
    if (ch === ' ') return '·'
    if (ch === '\t') return '→\t'
    if (ch === '\n') return '⏎\n'
    return ch
  }
  const focusing = hiddenInputRef.current === document.activeElement;

  return (
    <div className="typing-shell">
      <div className="typing-hero">
        <div>
          <p className="eyebrow">Speed builder</p>
          <h2>Programming Typing Test</h2>
          <p className="muted">Paste code, load it, and race through the snippet with precision. Tabs, whitespace, and pacing all count.</p>
          <div className="chip-row">
            <div className="chip"><span>⚡</span> {Number.isFinite(wpm) ? wpm : 0} WPM</div>
            <div className="chip"><span>🎯</span> {Math.round(accuracy * 100)}% accuracy</div>
            <div className="chip"><span>📈</span> {Math.round(progress * 100)}% complete</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h4 style={{color:"white"}}>Source Snippet</h4>
          <div className="pill">Est. {predictedMinutesToComplete} mins</div>
        </div>
        <div className="controls">
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Paste your code snippet here…"
            spellCheck={false}
          />
          <div className="row">
            <button onClick={handleLoad}>Load</button>
            <button className="btn primary" onClick={start} disabled={!normalized.length || (started && !finished)}>Start</button>
            <button className="btn ghost" onClick={stop} disabled={!started}>Stop</button>
            <button className="secondary" onClick={() => { setSource(''); }}>Clear</button>
            <button className="secondary" onClick={focus}>Focus</button>
            <label style={{color:"white"}} className="small">
              Tab width:
              <button
                className="secondary"
                style={{ marginLeft: 8 }}
                onClick={() => setTabSize((t) => t === 2 ? 4 : 2)}
              >
                {tabSize} spaces
              </button>
            </label>
            <label className="small" style={{ display: 'flex', alignItems: 'center', gap: 8, color:"white" }}>
              <input type="checkbox" checked={showWhitespace} onChange={(e) => setShowWhitespace(e.target.checked)} />
              Show whitespace
            </label>
            <label className="small" style={{ display: 'flex', alignItems: 'center', gap: 8, color:"white" }}>
              <input type="checkbox" checked={ignoreCaseSensitivity} onChange={(e) => setIgnoreCaseSensitivity(e.target.checked)} />
              Ignore case sensitivity
            </label>
            <label className="small" style={{ display: 'flex', alignItems: 'center', gap: 8, color:"white" }}>
              <input type="checkbox" checked={skipSpaces} onChange={(e) => setSkipSpaces(e.target.checked)} />
              Auto-skip spaces
            </label>
            <label className="small" style={{ display: 'flex', alignItems: 'center', gap: 8, color:"white" }}>
              <input type="checkbox" checked={skipNonAlphanumeric} onChange={(e) => setSkipNonAlphanumeric(e.target.checked)} />
              Skip non-letters/numbers
            </label>
            <label className="small" style={{ display: 'flex', alignItems: 'center', gap: 8, color:"white" }}>
              <input type="checkbox" checked={autoTypeMode} onChange={(e) => setAutoTypeMode(e.target.checked)} />
              Auto-type mode
            </label>
            <label className="small" style={{ display: 'flex', alignItems: 'center', gap: 8, color:"white" }}>
              Auto WPM:
              <input
                type="number"
                min={1}
                step={1}
                value={autoTypeWpm}
                onChange={(e) => {
                  const parsed = Number.parseInt(e.target.value, 10)
                  if (Number.isNaN(parsed)) {
                    setAutoTypeWpm(80)
                    return
                  }
                  setAutoTypeWpm(Math.max(1, parsed))
                }}
                style={{ width: 72 }}
              />
            </label>
            <span style={{color:"white"}}className="small">Shortcuts: <kbd>Esc</kbd> to stop, <kbd>Backspace</kbd> to correct</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h4>Live Reader</h4>
          <div className="pill">Errors: {errors}</div>
        </div>
        <div className="metrics">
          <div className="metric">
            <div className="label">WPM</div>
            <div className="value">{Number.isFinite(wpm) ? wpm : 0}</div>
          </div>
          <div className="metric">
            <div className="label">Accuracy</div>
            <div className="value">{Math.round(accuracy * 100)}%</div>
          </div>
          <div className="metric">
            <div className="label">Progress</div>
            <div className="value">{Math.round(progress * 100)}%</div>
          </div>
          <div className="metric">
            <div className="label">Elapsed</div>
            <div className="value">{(elapsedMs/1000).toFixed(1)}s</div>
          </div>
        </div>

        <div className="progress" aria-label="progress">
          <div style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>

        <div className="reader" style={{ tabSize }}>
          {loaded ? renderHighlighted() : <span style={{color:"white"}} className="small">Load code to begin…</span>}
        </div>

        {/* Hidden input to capture keystrokes globally when started */}
        <input
          ref={hiddenInputRef}
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
          onKeyDown={handleKey}
        />

        <div className="footer" style={{color:"white"}}>
          <div>Loaded: {normalized.length} • Typed: {typed.length} • Correct: {correctChars}</div>
          <div>Elapsed: {(elapsedMs/1000).toFixed(1)}s</div>
          <div>Elapsed: {(elapsedMs / 60000).toFixed(2)} min</div>
        </div>
      </div>

      <div style={{ marginTop: '12px' }}>
        <ActionButtons promptText={source} />
      </div>

      {finished && (
        <div className="footer done">
          Done! Press Start to retry.
        </div>
      )}
    </div>
  )
}
