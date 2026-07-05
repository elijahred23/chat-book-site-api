/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from "react";
import { createLocalSimulation, samplePrograms } from "../shared/cpuSimulator.js";
import "./CpuSimulator.css";

const instructionRows = [
  ["00000", "NOP", "No operation"], ["00001", "LDI r,n", "Load 9-bit immediate"],
  ["00010", "LDR r,a", "r ← RAM[a]"], ["00011", "STR r,a", "RAM[a] ← r"],
  ["00100", "MOV r,s", "Copy register"], ["00101", "ADD r,s", "r ← r + s"],
  ["00110", "SUB r,s", "r ← r − s"], ["00111", "MUL r,s", "r ← r × s"],
  ["01000", "AND r,s", "Bitwise AND"], ["01001", "OR r,s", "Bitwise OR"],
  ["01010", "XOR r,s", "Bitwise XOR"], ["01011", "NOT r", "Invert 16 bits"],
  ["01100", "SHL r", "Shift left"], ["01101", "SHR r", "Shift right"],
  ["01110", "INC r", "Increment"], ["01111", "DEC r", "Decrement"],
  ["10000", "CMP r,s", "Compare and set flags"], ["10001", "JMP a", "Unconditional jump"],
  ["10010", "JZ a", "Jump if zero"], ["10011", "JNZ a", "Jump if not zero"],
  ["10100", "JC a", "Jump if carry"], ["10101", "JN a", "Jump if negative"],
  ["10110", "OUT r", "Output register"], ["10111", "PUSH r", "Push onto stack"],
  ["11000", "POP r", "Pop from stack"], ["11001", "CALL a", "Call subroutine"],
  ["11010", "RET", "Return from call"], ["11011", "HLT", "Stop clock"],
  ["11100", "MOD r,s", "Unsigned remainder"], ["11101", "LUI r,n", "Load upper byte"],
  ["11110", "ADDI r,n", "Add immediate"], ["11111", "SUBI r,n", "Subtract immediate"],
];

const languageHelp = {
  binary: "Enter one or more 16-bit instruction words per line.",
  assembly: "Use mnemonics, decimal or hex operands, and labels such as loop: or done:.",
  simple: "MiniScript is strongly typed and supports fixed arrays, u16/bool values, classes, methods, and control flow.",
};

const bits = (value, width = 16) => value.toString(2).padStart(width, "0");
const hex = (value) => `0x${value.toString(16).toUpperCase().padStart(4, "0")}`;

async function request(path, options) {
  const response = await fetch(`/api${path}`, options);
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error ?? `Request failed (${response.status})`);
  return body;
}

const api = {
  generate: (prompt) => request("/simulator/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) }),
};

function programSource(program, language) {
  if (language === "assembly") return program.assemblySource;
  if (language === "simple") return program.simpleSource;
  return program.source;
}

function Register({ label, value, active, hint }) {
  return (
    <div className={`cpu-register ${active ? "active" : ""}`}>
      <div className="cpu-register__heading"><span>{label}</span><small>{hint}</small></div>
      <strong>{bits(value)}</strong>
      <div className="cpu-register__values"><span>{hex(value)}</span><span>{value}</span></div>
    </div>
  );
}

function MemoryGrid({ state }) {
  return (
    <div className="cpu-memory-grid">
      {state.memory.map((value, address) => {
        const isPc = address === state.programCounter && !state.halted;
        const isMar = address === state.memoryAddressRegister && state.cycle > 0;
        const isInstruction = address === state.currentInstructionAddress && state.cycle > 0;
        return (
          <div className={`cpu-memory-cell ${isInstruction ? "instruction" : ""} ${isMar ? "addressed" : ""}`} key={address}>
            <div className="cpu-memory-address"><span>{address.toString(16).toUpperCase()}</span><span>{isPc && <em>PC</em>}{isMar && <em>MAR</em>}</span></div>
            <b>{bits(value)}</b><small>{hex(value)}</small>
          </div>
        );
      })}
    </div>
  );
}

function EventCard({ event }) {
  return (
    <article className="cpu-event-card" aria-live="polite">
      <div className="cpu-event-topline"><span className={`cpu-phase cpu-phase--${event.phase.toLowerCase()}`}>{event.phase}</span><span>Clock {event.cycle}</span></div>
      <h3>{event.title}</h3><p>{event.detail}</p>
      {event.signals.length > 0 && <div className="cpu-signals" aria-label="Active control signals">{event.signals.map((signal) => <span key={signal}>{signal}</span>)}</div>}
    </article>
  );
}

function Timeline({ events }) {
  if (!events.length) return <p className="cpu-history-empty">Clock activity will appear here.</p>;
  return (
    <div className="cpu-timeline">
      {[...events].reverse().map((event) => (
        <div className="cpu-timeline__row" key={event.cycle}>
          <span className={`cpu-timeline__dot cpu-timeline__dot--${event.phase.toLowerCase()}`} />
          <div><b>{event.phase}</b><span>{event.title}</span></div><time>#{event.cycle}</time>
        </div>
      ))}
    </div>
  );
}

function ElapsedTime({ running }) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const accumulated = useRef(0);

  useEffect(() => {
    if (!running) { setElapsedMs(accumulated.current); return undefined; }
    const startedAt = performance.now();
    const update = () => setElapsedMs(accumulated.current + performance.now() - startedAt);
    const timer = window.setInterval(update, 250);
    return () => {
      accumulated.current += performance.now() - startedAt;
      window.clearInterval(timer);
    };
  }, [running]);

  return <b>{(elapsedMs / 1000).toFixed(2)}s</b>;
}

function MobileDatapath({ event }) {
  return (
    <div className="cpu-mobile-datapath" aria-label="Active CPU datapath">
      <div className="cpu-mobile-phase"><span>{event.phase}</span><b>{event.title}</b></div>
      {event.transfers.length ? event.transfers.map((transfer, index) => (
        <div className={`cpu-mobile-transfer cpu-mobile-transfer--${transfer.bus}`} key={`${transfer.from}-${transfer.to}-${index}`}>
          <span>{transfer.from}</span><i><small>{transfer.bus}</small>↓</i><span>{transfer.to}</span>
        </div>
      )) : <div className="cpu-mobile-components">{event.activeComponents.map((component) => <span key={component}>{component}</span>)}</div>}
    </div>
  );
}

function CircuitNode({ x, y, width = 150, height = 90, label, value, detail, active, accent = "cyan" }) {
  return (
    <g className={`cpu-circuit-node cpu-circuit-node--${accent} ${active ? "active" : ""}`} transform={`translate(${x} ${y})`}>
      <rect width={width} height={height} rx="5" />
      <text className="cpu-node-label" x="14" y="22">{label}</text>
      <text className="cpu-node-value" x="14" y="49">{value}</text>
      <text className="cpu-node-detail" x="14" y={height - 12}>{detail}</text>
      {active && <circle className="cpu-node-led" cx={width - 13} cy="13" r="4" />}
    </g>
  );
}

function CpuExecutionModal({ state, running, busy, canStepBack, onClose, onStep, onStepBack, onToggleRunning }) {
  const dialogRef = useRef(null);
  const touchStart = useRef(null);
  const [showFullCircuit, setShowFullCircuit] = useState(false);
  const signals = state.lastEvent.signals;
  const transfers = state.lastEvent.transfers;
  const activeComponents = state.lastEvent.activeComponents;
  const transferActive = (from, to) => transfers.some((transfer) => {
    const matches = (actual, expected) => Array.isArray(expected) ? expected.includes(actual) : actual === expected;
    return matches(transfer.from, from) && matches(transfer.to, to);
  });
  const componentActive = (name) => activeComponents.includes(name);
  const aluActive = componentActive("ALU");
  const memoryActive = componentActive("RAM");
  const controlActive = componentActive("CONTROL");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const handleTouchEnd = (event) => {
    if (showFullCircuit) { touchStart.current = null; return; }
    if (touchStart.current === null || event.changedTouches.length !== 1) return;
    const distance = event.changedTouches[0].clientX - touchStart.current;
    touchStart.current = null;
    if (Math.abs(distance) < 60) return;
    if (distance < 0 && !state.halted && !busy) onStep();
    if (distance > 0 && canStepBack && !busy) onStepBack();
  };

  return (
    <dialog ref={dialogRef} className="cpu-circuit-modal" onClose={onClose} onCancel={onClose} aria-labelledby="cpu-modal-title">
      <div className="cpu-modal-shell">
        <header className="cpu-modal-header">
          <div><span className="cpu-eyebrow">Live signal view</span><h2 id="cpu-modal-title">CPU execution circuit</h2><p>Highlighted paths show the transfers used by the last clock pulse.</p></div>
          <div className="cpu-modal-status"><span className={`cpu-status-light ${running ? "live" : ""}`} /><b>{state.halted ? "HALTED" : running ? "RUNNING" : "PAUSED"}</b><span>Clock {state.cycle}</span></div>
          <button className="cpu-circuit-view-toggle" type="button" onClick={() => setShowFullCircuit((value) => !value)}>{showFullCircuit ? "Active path" : "Full schematic"}</button>
          <button className="cpu-modal-close" type="button" onClick={() => dialogRef.current?.close()} aria-label="Close CPU visualization">×</button>
        </header>
        <div className={`cpu-circuit-scroll ${showFullCircuit ? "show-full" : ""}`} aria-label={`CPU circuit after ${state.lastEvent.phase.toLowerCase()} phase`} onTouchStart={(event) => { if (event.touches.length === 1) touchStart.current = event.touches[0].clientX; }} onTouchEnd={handleTouchEnd}>
          <MobileDatapath event={state.lastEvent} />
          <svg className="cpu-circuit-board" viewBox="0 0 1000 610" role="img" aria-labelledby="cpu-circuit-title cpu-circuit-description">
            <title id="cpu-circuit-title">Live CPU component and wire diagram</title>
            <desc id="cpu-circuit-description">Active control signals: {signals.join(", ") || "none"}.</desc>
            <defs>
              <pattern id="cpu-board-grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M 25 0 L 0 0 0 25" className="cpu-board-grid-line" /></pattern>
              <filter id="cpu-wire-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <rect className="cpu-board-background" width="1000" height="610" rx="8" /><rect width="1000" height="610" rx="8" fill="url(#cpu-board-grid)" />
            <g className="cpu-circuit-wires">
              <path className={transferActive("PC", "MAR") ? "active" : ""} d="M190 105 H250" />
              <path className={memoryActive && componentActive("MAR") ? "active" : ""} d="M400 105 H455" />
              <path className={transferActive("RAM", "IR") ? "active" : ""} d="M545 190 V215 H325 V240" />
              <path className={transferActive("IR", "CONTROL") ? "active control" : "control"} d="M400 285 H455" />
              <path className={transferActive(["CONTROL", "ADDRESS", "RAM"], "PC") ? "active control" : "control"} d="M455 270 H215 V85 H190" />
              <path className={transferActive(["ADDRESS", "OPERAND", "SP"], "MAR") ? "active control" : "control"} d="M545 330 V355 H325 V150" />
              <path className={transferActive("A", "ALU") || transferActive("ALU", "A") ? "active alu" : "alu"} d="M190 435 H455" />
              <path className={transferActive(["B", "C", "D"], "ALU") || transferActive("ALU", ["B", "C", "D"]) ? "active alu" : "alu"} d="M400 485 H430 V460 H455" />
              <path className={transferActive("ALU", "FLAGS") ? "active alu" : "alu"} d="M640 435 H700" />
              <path className={transferActive("RAM", "A") || transferActive("A", "RAM") ? "active" : ""} d="M115 390 V350 H545 V190" />
              <path className={transferActive("RAM", ["B", "C", "D"]) || transferActive(["B", "C", "D"], "RAM") ? "active" : ""} d="M545 190 V365 H325 V440" />
              <path className={transferActive("A", "OUT") ? "active" : ""} d="M115 480 V550 H875 V160" />
              <path className={transferActive(["B", "C", "D"], "OUT") ? "active" : ""} d="M400 485 V550 H875 V160" />
              <path className={transferActive("FLAGS", "CONTROL") ? "active control" : "control"} d="M780 435 H820 V315 H640" />
              <path className={transferActive("A", ["B", "C", "D"]) || transferActive(["B", "C", "D"], "A") ? "active" : ""} d="M190 460 H225 V510 H250" />
            </g>
            <CircuitNode x={40} y={60} label="PC" value={hex(state.programCounter)} detail="PROGRAM COUNTER" active={componentActive("PC")} accent="lime" />
            <CircuitNode x={250} y={60} label="MAR" value={hex(state.memoryAddressRegister)} detail="MEMORY ADDRESS" active={componentActive("MAR")} />
            <CircuitNode x={455} y={35} width={180} height={155} label="RAM · 64 WORDS" value={`[${state.memoryAddressRegister.toString(16).toUpperCase()}] ${hex(state.memory[state.memoryAddressRegister])}`} detail="16-BIT PROGRAM / DATA" active={memoryActive} accent="lime" />
            <CircuitNode x={800} y={60} label="OUT" value={`${state.outputRegister} · ${hex(state.outputRegister)}`} detail="VISIBLE OUTPUT" active={componentActive("OUT")} accent="lime" />
            <CircuitNode x={250} y={240} label="IR" value={bits(state.instructionRegister)} detail={state.instruction?.mnemonic ?? "INSTRUCTION REGISTER"} active={componentActive("IR")} />
            <CircuitNode x={455} y={240} width={185} label="CONTROL UNIT" value={state.lastEvent.phase} detail={state.instruction?.mnemonic ?? "AWAITING FETCH"} active={controlActive} accent="lime" />
            <CircuitNode x={40} y={390} label="REGISTER A" value={`${bits(state.registerA)} · ${state.registerA}`} detail="ACCUMULATOR" active={componentActive("A")} />
            <CircuitNode x={250} y={440} label="REGISTERS B–D" value={`${hex(state.registerB)} · ${hex(state.registerC)} · ${hex(state.registerD)}`} detail="GENERAL REGISTERS" active={["B", "C", "D"].some(componentActive)} />
            <CircuitNode x={455} y={390} width={185} label="ALU" value={aluActive ? state.lastEvent.title.replace("Executed ", "") : "IDLE"} detail="ARITHMETIC / LOGIC" active={aluActive} accent="orange" />
            <CircuitNode x={700} y={390} width={160} label="FLAGS" value={`Z${Number(state.zeroFlag)} C${Number(state.carryFlag)} N${Number(state.negativeFlag)} V${Number(state.overflowFlag)}`} detail="ZERO / CARRY / NEG / OVERFLOW" active={componentActive("FLAGS")} accent="orange" />
            <text className="cpu-wire-label" x="205" y="96">ADDRESS</text><text className="cpu-wire-label" x="342" y="342">16-BIT DATA BUS</text><text className="cpu-wire-label" x="662" y="542">OUTPUT BUS</text>
          </svg>
        </div>
        <footer className="cpu-modal-footer">
          <div className="cpu-modal-event"><span className={`cpu-phase cpu-phase--${state.lastEvent.phase.toLowerCase()}`}>{state.lastEvent.phase}</span><div><b>{state.lastEvent.title}</b><p>{state.lastEvent.detail}</p></div></div>
          <div className="cpu-modal-signals" aria-label="Active control signals">{signals.length ? signals.map((signal) => <span key={signal}>{signal}</span>) : <span>No active signals</span>}</div>
          <div className="cpu-modal-controls"><button type="button" onClick={onStepBack} disabled={!canStepBack || busy} aria-label="Previous clock step">← Previous</button><button type="button" className="clock" onClick={onStep} disabled={state.halted || busy}>▸ Clock</button><button type="button" className={running ? "running" : ""} onClick={onToggleRunning} disabled={state.halted || busy}>{running ? "■ Pause" : "▶ Auto"}</button></div>
        </footer>
      </div>
    </dialog>
  );
}

export default function CpuSimulator() {
  const [programs] = useState(samplePrograms);
  const [source, setSource] = useState(samplePrograms[0]?.source ?? "");
  const [language, setLanguage] = useState("binary");
  const [compiled, setCompiled] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(samplePrograms[0]?.id ?? "");
  const [state, setState] = useState(null);
  const [history, setHistory] = useState([]);
  const [undoCount, setUndoCount] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [timerVersion, setTimerVersion] = useState(0);
  const [showCpuModal, setShowCpuModal] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const simulatorRef = useRef(null);
  const undoRef = useRef([]);

  const loadProgram = useCallback((programSource, programLanguage) => {
    setBusy(true); setRunning(false); setError("");
    try {
      const result = createLocalSimulation(programSource, programLanguage);
      simulatorRef.current = result.simulator; undoRef.current = [];
      setState(result.simulator.snapshot()); setHistory([]); setUndoCount(0); setTimerVersion((value) => value + 1);
      setCompiled(result.machineCode ? { assembly: result.assemblySource ?? "", machine: result.machineCode } : null);
      return true;
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Could not load the program."); }
    finally { setBusy(false); }
    return false;
  }, []);

  const load = useCallback(() => loadProgram(source, language), [source, language, loadProgram]);

  const generate = async () => {
    if (!generationPrompt.trim()) { setError("Describe the program you want Gemini to create."); return; }
    setGenerating(true); setRunning(false); setError("");
    try {
      const program = await api.generate(generationPrompt.trim());
      setSource(program.code); setLanguage(program.language); setSelectedProgram(""); setCompiled(null);
      await loadProgram(program.code, program.language);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Could not generate the program."); }
    finally { setGenerating(false); }
  };

  const step = useCallback(() => {
    const simulator = simulatorRef.current;
    if (!simulator) return;
    try {
      undoRef.current.push(simulator.snapshot());
      if (undoRef.current.length > 100) undoRef.current.shift();
      const nextState = simulator.step();
      setUndoCount(undoRef.current.length); setState(nextState);
      setHistory((previous) => nextState.lastEvent.cycle > 0 && previous.at(-1)?.cycle !== nextState.lastEvent.cycle ? [...previous.slice(-39), nextState.lastEvent] : previous);
      if (nextState.halted) setRunning(false);
    } catch (requestError) { setRunning(false); setError(requestError instanceof Error ? requestError.message : "The clock step failed."); }
  }, []);

  const stepBack = useCallback(() => {
    const previous = undoRef.current.pop();
    if (!previous || !simulatorRef.current) return;
    setRunning(false);
    const restored = simulatorRef.current.restore(previous);
    setState(restored); setUndoCount(undoRef.current.length);
    setHistory((events) => events.filter((event) => event.cycle <= restored.cycle));
  }, []);

  const reset = () => {
    if (!simulatorRef.current) return;
    setRunning(false); setBusy(true); setError("");
    try {
      undoRef.current = [];
      setState(simulatorRef.current.reset()); setHistory([]); setUndoCount(0); setTimerVersion((value) => value + 1);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Reset failed."); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    if (!running) return undefined;
    const timer = window.setInterval(step, 1000 / speed);
    return () => window.clearInterval(timer);
  }, [running, speed, step]);

  useEffect(() => {
    const pauseWhenHidden = () => { if (document.hidden) setRunning(false); };
    document.addEventListener("visibilitychange", pauseWhenHidden);
    window.addEventListener("pagehide", pauseWhenHidden);
    return () => { document.removeEventListener("visibilitychange", pauseWhenHidden); window.removeEventListener("pagehide", pauseWhenHidden); };
  }, []);

  const selectExample = (id) => {
    setSelectedProgram(id);
    const program = programs.find((item) => item.id === id);
    if (program) setSource(programSource(program, language));
    setCompiled(null);
  };

  const selectLanguage = (next) => {
    setLanguage(next);
    const program = programs.find((item) => item.id === selectedProgram);
    if (program) setSource(programSource(program, next));
    setCompiled(null);
  };

  const activeSignals = state?.lastEvent.signals ?? [];
  const currentExample = programs.find((item) => item.id === selectedProgram);

  return (
    <div className={`cpu-sim ${showCpuModal ? "circuit-open" : ""}`}>
      <header className="cpu-topbar">
        <div className="cpu-brand"><span className="cpu-brand__mark">16</span><div><b>Clockwork</b><small>16-bit CPU laboratory</small></div></div>
        <div className="cpu-status-strip"><span className={`cpu-status-light ${running ? "live" : ""}`} /><span>{state?.halted ? "Halted" : running ? "Clock running" : state ? "Clock paused" : "Program not loaded"}</span><b>{state?.cycle ?? 0} cycles</b><ElapsedTime key={timerVersion} running={running} /></div>
      </header>
      <main className="cpu-main">
        <section className="cpu-intro"><div><span className="cpu-eyebrow">Interactive computer architecture</span><h1>See what happens<br /><em>inside every clock.</em></h1></div><p>Write binary, assembly, or JavaScript-like MiniScript. Inspect every generated instruction and CPU state one pulse at a time.</p></section>
        {error && <div className="cpu-error" role="alert"><b>Could not continue</b><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Dismiss error">×</button></div>}
        {!showCpuModal && <><div className="cpu-workbench">
          <aside className="cpu-program-panel cpu-panel">
            <div className="cpu-panel-title"><span>01</span><div><h2>Program</h2><p>64 words maximum</p></div></div>
            <label className="cpu-field-label" htmlFor="cpu-generation-prompt">Build with Gemini</label>
            <textarea className="cpu-prompt-input" id="cpu-generation-prompt" maxLength="2000" placeholder="Example: Count down from 10 and output each value" value={generationPrompt} onChange={(event) => setGenerationPrompt(event.target.value)} />
            <button className="cpu-generate-button" type="button" onClick={generate} disabled={generating || busy}>{generating ? "Generating & loading…" : "Generate & load"}</button>
            <p className="cpu-generate-hint">Gemini chooses binary, assembly, or MiniScript and the simulator validates it before loading.</p>
            <label className="cpu-field-label" htmlFor="cpu-example">Example programs</label>
            <select id="cpu-example" value={selectedProgram} onChange={(event) => selectExample(event.target.value)}><option value="" disabled>Custom program</option>{programs.map((program) => <option value={program.id} key={program.id}>{program.name}</option>)}</select>
            {currentExample && <p className="cpu-example-note">{currentExample.description}</p>}
            <span className="cpu-field-label">Source language</span>
            <div className="cpu-language-tabs" role="tablist">{["binary", "assembly", "simple"].map((item) => <button type="button" role="tab" aria-selected={language === item} className={language === item ? "active" : ""} onClick={() => selectLanguage(item)} key={item}>{item === "simple" ? "MiniScript" : item}</button>)}</div>
            <label className="cpu-field-label" htmlFor="cpu-source">{language === "binary" ? "Binary memory image" : language === "assembly" ? "Assembly source" : "MiniScript source"}</label>
            <div className="cpu-editor-wrap"><div className="cpu-line-numbers" aria-hidden="true">{source.split("\n").map((_, index) => <span key={index}>{index + 1}</span>)}</div><textarea id="cpu-source" spellCheck="false" value={source} onChange={(event) => { setSource(event.target.value); setSelectedProgram(""); setCompiled(null); }} /></div>
            <p className="cpu-format-hint">{languageHelp[language]} Comments use <code>{language === "simple" ? "//, /* */, or #" : "#, ;, or //"}</code>.</p>
            {language === "simple" && <details className="cpu-language-guide"><summary>MiniScript syntax</summary><code>let count: u16 = 300;</code><code>let values: u16[3] = [10, 20, 30];</code><code>values[1]++; // constant index</code><code>class Counter {"{ value: u16; … }"}</code><code>let counter: Counter = new Counter(0);</code><code>counter.increment(1);</code></details>}
            <button className="cpu-load-button" type="button" onClick={load} disabled={busy}>{busy ? "Compiling…" : state ? "Compile & load again" : "Compile & load"}</button>
            {compiled && <details className="cpu-compiled"><summary>View compiled output</summary>{language === "simple" && <><label>Assembly</label><pre>{compiled.assembly}</pre></>}<label>Machine code</label><pre>{compiled.machine}</pre></details>}
          </aside>

          <section className="cpu-area">
            <div className="cpu-control-deck cpu-panel">
              <div className="cpu-clock-readout"><small>Next micro-step</small><b>{state?.halted ? "HALTED" : state?.phase?.toUpperCase() ?? "FETCH"}</b><span>Cycle {(state?.cycle ?? 0) + (state?.halted ? 0 : 1)}</span></div>
              <div className="cpu-transport"><button className="cpu-reset-button" type="button" onClick={reset} disabled={!state || busy} aria-label="Reset CPU">↺</button><button className="cpu-back-button" type="button" onClick={stepBack} disabled={!undoCount || busy} aria-label="Previous clock step">←</button><button className="cpu-clock-button" type="button" onClick={step} disabled={!state || state.halted || busy}>▸ Clock</button><button className={`cpu-auto-button ${running ? "running" : ""}`} type="button" onClick={() => setRunning((value) => !value)} disabled={!state || state.halted || busy}>{running ? "■ Pause" : "▶ Auto run"}</button><button className="cpu-visualize-button" type="button" onClick={() => setShowCpuModal(true)} disabled={!state}>⌁ Visualize</button></div>
              <div className="cpu-speed"><label htmlFor="cpu-speed">Clock speed <b>{speed} Hz</b></label><input id="cpu-speed" type="range" min="1" max="10" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} /></div>
            </div>
            {state ? <>
              <div className="cpu-board cpu-panel">
                <div className="cpu-board-head"><div><span className="cpu-chip-icon">CPU</span><div><h2>16-bit processing unit</h2><p>Four registers · 16-bit data bus · hardware stack</p></div></div><div className="cpu-flags"><span className={state.zeroFlag ? "set" : ""}>Z <b>{Number(state.zeroFlag)}</b></span><span className={state.carryFlag ? "set" : ""}>C <b>{Number(state.carryFlag)}</b></span><span className={state.negativeFlag ? "set" : ""}>N <b>{Number(state.negativeFlag)}</b></span><span className={state.overflowFlag ? "set" : ""}>V <b>{Number(state.overflowFlag)}</b></span></div></div>
                <div className="cpu-grid"><div className="cpu-register-bank">{state.registers.map((value, index) => <Register label={["A", "B", "C", "D"][index]} hint="GENERAL" value={value} active={activeSignals.some((signal) => signal.startsWith(`${["A", "B", "C", "D"][index]} `))} key={index} />)}<Register label="PC" hint="PROGRAM COUNTER" value={state.programCounter} active={activeSignals.some((signal) => signal.startsWith("PC "))} /><Register label="SP" hint="STACK POINTER" value={state.stackPointer} active={activeSignals.some((signal) => signal.startsWith("SP "))} /><Register label="IR" hint="INSTRUCTION" value={state.instructionRegister} active={activeSignals.some((signal) => signal.startsWith("IR "))} /><Register label="MAR" hint="MEMORY ADDRESS" value={state.memoryAddressRegister} active={activeSignals.some((signal) => signal.startsWith("MAR "))} /><Register label="OUT" hint="VISIBLE OUTPUT" value={state.outputRegister} active={activeSignals.includes("OUTPUT IN")} /></div><div className={`cpu-alu ${activeSignals.some((signal) => signal.startsWith("ALU")) ? "active" : ""}`}><small>Arithmetic logic unit</small><b>{state.instruction?.mnemonic ?? "ALU"}</b><div><span>A {hex(state.registerA)}</span><i>⇄</i><span>B {hex(state.registerB)}</span></div></div></div>
                <div className="cpu-data-bus"><span>16-bit data bus</span><div className={activeSignals.length ? "flowing" : ""} /><b>{bits(state.instructionRegister)}</b></div>
              </div><EventCard event={state.lastEvent} />
            </> : <div className="cpu-empty cpu-panel"><span>0101</span><h2>Load a program to power the CPU</h2><p>Choose an example or write your own program, then compile it into memory.</p><button type="button" onClick={load}>Compile example</button></div>}
          </section>

          <aside className="cpu-memory-panel cpu-panel">
            <div className="cpu-panel-title"><span>02</span><div><h2>Memory</h2><p>64 × 16-bit words</p></div></div>
            {state ? <MemoryGrid state={state} /> : <div className="cpu-memory-grid disabled">{Array.from({ length: 64 }, (_, address) => <div className="cpu-memory-cell" key={address}><div className="cpu-memory-address"><span>{address.toString(16).toUpperCase().padStart(2, "0")}</span></div><b>0000000000000000</b><small>0x0000</small></div>)}</div>}
            <div className="cpu-memory-legend"><span><i className="pc" />Next PC</span><span><i className="mar" />MAR selected</span></div>
            <div className="cpu-history"><h3>Clock history</h3><Timeline events={history} /></div>
          </aside>
        </div>

        <section className="cpu-reference cpu-panel">
          <div className="cpu-reference-copy"><span className="cpu-eyebrow">The clock cycle</span><h2>Three pulses make<br />one instruction.</h2><p>The CPU repeats the same rhythm until it encounters <b>HLT</b>. Clock manually to isolate each transition.</p><div className="cpu-cycle-steps"><span><b>1</b>FETCH<small>RAM → IR</small></span><i>→</i><span><b>2</b>DECODE<small>IR → Control</small></span><i>→</i><span><b>3</b>EXECUTE<small>Control → CPU</small></span></div></div>
          <div className="cpu-instructions"><h3>Instruction set</h3><p>5-bit opcode · register and immediate/address fields</p><div className="cpu-instruction-grid">{instructionRows.map(([opcode, name, description]) => <div key={opcode}><code>{opcode}</code><b>{name}</b><span>{description}</span></div>)}</div></div>
        </section></>}
      </main>
      {showCpuModal && state && <CpuExecutionModal state={state} running={running} busy={busy} canStepBack={undoCount > 0} onClose={() => setShowCpuModal(false)} onStep={step} onStepBack={stepBack} onToggleRunning={() => setRunning((value) => !value)} />}
      <footer className="cpu-footer"><span>Clockwork CPU Lab</span><p>A 16-bit architecture with 64 words of memory. Values wrap at 65,535.</p></footer>
    </div>
  );
}
