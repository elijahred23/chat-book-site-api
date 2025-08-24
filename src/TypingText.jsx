import { useEffect, useMemo, useRef, useState } from 'react'
import './TypingText.css'
import PasteButton from './ui/PasteButton'

/**
 * WPM formula:
 *   wpm = (correctChars / 5) / minutesElapsed
 * Accuracy:
 *   accuracy = correctChars / typedChars
 * Progress:
 *   progress = caretIndex / source.length
 */

export default function TypingTest() {
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

  const hiddenInputRef = useRef(null)

  // Replace tabs according to UI setting for a consistent target text
  const normalized = useMemo(() => {
    const tab = ' '.repeat(tabSize)
    return loaded.replaceAll('\t', tab)
  }, [loaded, tabSize])

  // Focus the hidden input when started so we capture keystrokes anywhere
  useEffect(() => {
    if (started && !finished) hiddenInputRef.current?.focus()
  }, [started, finished])

  // Timer tick
  useEffect(() => {
    if (!started || finished) return
    const id = setInterval(() => setNowTs(Date.now()), 100)
    return () => clearInterval(id)
  }, [started, finished])

  const elapsedMs = useMemo(() => {
    if (!startTs) return 0
    return (nowTs ?? Date.now()) - startTs
  }, [startTs, nowTs])

  const correctChars = useMemo(() => {
    // count from 0..caret how many are correct vs normalized
    let ok = 0
    for (let i = 0; i < Math.min(caret, normalized.length); i++) {
      if (typed[i] === normalized[i]) ok++
    }
    return ok
  }, [typed, caret, normalized])

  const typedChars = typed.length
  const minutes = Math.max(elapsedMs / 60000, 1e-6)
  const wpm = Math.max(Math.round((correctChars / 5) / minutes), 0)
  const accuracy = typedChars ? Math.max(0, Math.min(1, correctChars / typedChars)) : 1
  const progress = normalized.length ? Math.min(1, caret / normalized.length) : 0

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

    const handleKey = (e) => {
    if (!started || finished) return
    const key = e.key

    // allow copy/select shortcuts to pass through
    if ((e.ctrlKey || e.metaKey) && ['c','x','a'].includes(key.toLowerCase())) return

    e.preventDefault()

    if (key === 'Escape') { stop(); return }
    if (key === 'Backspace') {
      if (caret > 0) {
        // remove 1 char (we do not collapse on backspace; keeps behavior simple/predictable)
        setCaret(caret - 1)
        setTyped(typed.slice(0, -1))
      }
      return
    }

    // normalize key to a single character (or newline)
    const ch = key === 'Enter' ? '\n' : key.length === 1 ? key : ''
    if (!ch) return

    const nextIndex = caret
    const expected = normalized[nextIndex] ?? ''

    // --- NEW BEHAVIOR: whitespace collapsing ---
    // If user types a space and we're sitting at a run of spaces in the target,
    // advance across the entire run with a single keypress.
    if (ch === ' ' && expected === ' ') {
      let j = nextIndex
      while (j < normalized.length && normalized[j] === ' ') j++
      const runLen = j - nextIndex
      setTyped(typed + ' '.repeat(runLen))
      setCaret(nextIndex + runLen)
      if (nextIndex + runLen >= normalized.length) { setFinished(true); setStarted(false) }
      return
    }

    // If user presses Enter and we're at a run of newlines, advance across the whole run.
    if (ch === '\n' && expected === '\n') {
      let j = nextIndex
      while (j < normalized.length && normalized[j] === '\n') j++
      const runLen = j - nextIndex
      setTyped(typed + '\n'.repeat(runLen))
      setCaret(nextIndex + runLen)
      if (nextIndex + runLen >= normalized.length) { setFinished(true); setStarted(false) }
      return
    }
    // --- END new behavior ---

    // regular single-character path
    const isCorrect = ch === expected
    setTyped(typed + ch)
    setCaret(nextIndex + 1)
    if (!isCorrect) setErrors((e) => e + 1)

    if (nextIndex + 1 >= normalized.length) {
      setFinished(true)
      setStarted(false)
    }
  }


  // Render code with three buckets: correct, incorrect, current, and upcoming
  const renderHighlighted = () => {
    const parts = []
    const N = normalized.length
    for (let i = 0; i < N; i++) {
      const exp = normalized[i]
      const got = typed[i]
      let cls = ''
      if (i < typed.length) cls = (got === exp) ? 'ok' : 'bad'
      else if (i === typed.length && started && !finished) cls = 'current'
      const charToShow = showWhitespace ? visualize(exp) : exp
      parts.push(<span key={i} className={cls}>{charToShow}</span>)
    }
    return parts
  }

  function visualize(ch) {
    if (ch === ' ') return '·'
    if (ch === '\t') return '→\t'
    if (ch === '\n') return '⏎\n'
    return ch
  }

  return (
    <div className="container">
      <h1>Programming Typing Test</h1>

      <div className="controls">
        <textarea
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Paste your code snippet here…"
          spellCheck={false}
        />
        <div className="row">
          <button onClick={handleLoad}>Load</button>
          <button className="secondary" onClick={() => { setSource(''); }}>Clear</button>
          <button onClick={start} disabled={!normalized.length || (started && !finished)}>Start</button>
          <button className="secondary" onClick={stop} disabled={!started}>Stop</button>
          <PasteButton onPaste={(text) => setSource(text)} />
        </div>

        <div className="row">
          <label className="small">
            Tab width:
            <button
              className="secondary"
              style={{ marginLeft: 8 }}
              onClick={() => setTabSize((t) => t === 2 ? 4 : 2)}
            >
              {tabSize} spaces
            </button>
          </label>
          <label className="small" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={showWhitespace} onChange={(e) => setShowWhitespace(e.target.checked)} />
            Show whitespace
          </label>
          <span className="small">Shortcuts: <kbd>Esc</kbd> to stop, <kbd>Backspace</kbd> to correct</span>
        </div>
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
          <div className="label">Errors</div>
          <div className="value">{errors}</div>
        </div>
        <div className="metric">
          <div className="label">Progress</div>
          <div className="value">{Math.round(progress * 100)}%</div>
        </div>
      </div>

      <div className="progress" aria-label="progress">
        <div style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>

      <div className="reader" style={{ tabSize }}>
        {loaded ? renderHighlighted() : <span className="small">Load code to begin…</span>}
      </div>

      {/* Hidden input to capture keystrokes globally when started */}
      <input
        ref={hiddenInputRef}
        style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
        onKeyDown={handleKey}
      />

      <div className="footer">
        <div>Loaded characters: {normalized.length} • Typed: {typed.length} • Correct: {correctChars}</div>
        <div>Elapsed: {(elapsedMs/1000).toFixed(1)}s</div>
      </div>
    </div>
  )
}
