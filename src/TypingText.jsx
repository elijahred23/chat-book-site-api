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

  const hiddenInputRef = useRef(null)
  const currentCharRef = useRef(null)

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

  // Focus the hidden input when started so we capture keystrokes anywhere
  useEffect(() => {
    if (started && !finished) hiddenInputRef.current?.focus()
  }, [started, finished])

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

    // allow copy/select shortcuts to pass through
    if ((e.ctrlKey || e.metaKey) && ['c','x','a'].includes(key.toLowerCase())) return

    e.preventDefault()

    if (key === 'Escape') { stop(); return }
    if (key === 'Backspace') {
      if (caret > 0) {
        // If deleting spaces, remove the entire contiguous space run
        let removeCount = 1;
        if (typed[caret - 1] === ' ') {
          let j = caret - 1;
          while (j >= 0 && typed[j] === ' ') j--;
          removeCount = caret - (j + 1);
        }
        setCaret(caret - removeCount);
        setTyped(typed.slice(0, caret - removeCount));
      }
      return;
    }

    // normalize key to a single character (or newline)
    const ch = key === 'Enter' ? '\n' : key.length === 1 ? key : ''
    if (!ch) return

    let nextIndex = caret
    let nextTyped = typed

    // Auto-skip indentation at the start of any line (including file start).
    const atLineStart =
      nextIndex === 0 || normalized[nextIndex - 1] === '\n'
    if (atLineStart && normalized[nextIndex] === ' ') {
      let j = nextIndex
      while (j < normalized.length && normalized[j] === ' ') j++
      const indentLen = j - nextIndex
      nextTyped += ' '.repeat(indentLen)
      nextIndex = j
    }

    // Optional mode: auto-skip spaces anywhere.
    if (skipSpaces && normalized[nextIndex] === ' ') {
      let j = nextIndex
      while (j < normalized.length && normalized[j] === ' ') j++
      const runLen = j - nextIndex
      nextTyped += ' '.repeat(runLen)
      nextIndex = j
    }

    const expected = normalized[nextIndex] ?? ''

    // --- NEW BEHAVIOR: whitespace collapsing ---
    // If user types a space and we're sitting at a run of spaces in the target,
    // advance across the entire run with a single keypress.
    if (ch === ' ' && expected === ' ') {
      let j = nextIndex
      while (j < normalized.length && normalized[j] === ' ') j++
      const runLen = j - nextIndex
      setTyped(nextTyped + ' '.repeat(runLen))
      setCaret(nextIndex + runLen)
      if (nextIndex + runLen >= normalized.length) { setFinished(true); setStarted(false) }
      return
    }

    // If user presses Enter and we're at a run of newlines, advance across the whole run.
    // Also skip leading indentation on the next line so users can jump straight
    // to the first non-space character.
    if (ch === '\n' && expected === '\n') {
      let j = nextIndex
      while (j < normalized.length && normalized[j] === '\n') j++

      let indentLen = 0
      while (
        j + indentLen < normalized.length &&
        normalized[j + indentLen] === ' '
      ) {
        indentLen++
      }

      const runLen = j - nextIndex
      const totalAdvance = runLen + indentLen

      setTyped(nextTyped + '\n'.repeat(runLen) + ' '.repeat(indentLen))
      setCaret(nextIndex + totalAdvance)
      if (nextIndex + totalAdvance >= normalized.length) { setFinished(true); setStarted(false) }
      return
    }
    // --- END new behavior ---

    // regular single-character path
    // Allow any character when expected char is non-keyboard (e.g., unusual unicode)
    const keyboardChars = /^[\x20-\x7E]$/; // printable ASCII
    const isExpectedKeyboardChar = keyboardChars.test(expected) || expected === '\n' || expected === '\t' || expected === ' ';
    const isCorrect =
      (!isExpectedKeyboardChar) ||
      (normalizeForComparison(ch) === normalizeForComparison(expected));

    let finalTyped = nextTyped + ch
    let finalCaret = nextIndex + 1

    // If a correct character ends a line, auto-advance through newline(s)
    // and any leading spaces of the next line.
    if (isCorrect) {
      let j = finalCaret
      while (j < normalized.length && normalized[j] === '\n') j++
      const newlineRunLen = j - finalCaret
      if (newlineRunLen > 0) {
        finalTyped += '\n'.repeat(newlineRunLen)
        finalCaret = j

        let indentLen = 0
        while (finalCaret + indentLen < normalized.length && normalized[finalCaret + indentLen] === ' ') {
          indentLen++
        }
        if (indentLen > 0) {
          finalTyped += ' '.repeat(indentLen)
          finalCaret += indentLen
        }
      }

      if (skipSpaces) {
        let k = finalCaret
        while (k < normalized.length && normalized[k] === ' ') k++
        const spaceRunLen = k - finalCaret
        if (spaceRunLen > 0) {
          finalTyped += ' '.repeat(spaceRunLen)
          finalCaret = k
        }
      }
    }

    setTyped(finalTyped)
    setCaret(finalCaret)
    if (!isCorrect) setErrors((e) => e + 1)

    if (finalCaret >= normalized.length) {
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
          <div>Focus: {focusing ? 'capturing keys' : 'click Focus'}</div>
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
