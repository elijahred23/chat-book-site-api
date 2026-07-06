/* eslint-disable react/prop-types */
import { useCallback, useEffect, useRef, useState } from "react";
import { createLocalSimulation, LED_DISPLAY_COLUMNS, LED_DISPLAY_ROWS, LED_DISPLAY_START, REGISTER_NAMES, samplePrograms } from "../../../../shared/cpuSimulator.js";
import "./CpuSimulator.css";

const instructionRows = [
  ["000000", "NOP", "No operation"], ["000001", "LDI r,n", "Load 18-bit immediate"],
  ["000010", "LDR r,a", "r ← RAM[a]"], ["000011", "STR r,a", "RAM[a] ← r"],
  ["000100", "MOV r,s", "Copy register"], ["000101", "ADD r,s", "r ← r + s"],
  ["000110", "SUB r,s", "r ← r − s"], ["000111", "MUL r,s", "r ← r × s"],
  ["001000", "AND r,s", "Bitwise AND"], ["001001", "OR r,s", "Bitwise OR"],
  ["001010", "XOR r,s", "Bitwise XOR"], ["001011", "NOT r", "Invert 32 bits"],
  ["001100", "SHL r", "Shift left"], ["001101", "SHR r", "Shift right"],
  ["001110", "INC r", "Increment"], ["001111", "DEC r", "Decrement"],
  ["010000", "CMP r,s", "Compare and set flags"], ["010001", "JMP a", "Unconditional jump"],
  ["010010", "JZ a", "Jump if zero"], ["010011", "JNZ a", "Jump if not zero"],
  ["010100", "JC a", "Jump if carry"], ["010101", "JN a", "Jump if negative"],
  ["010110", "OUT r", "Output register"], ["010111", "PUSH r", "Push onto stack"],
  ["011000", "POP r", "Pop from stack"], ["011001", "CALL a", "Call subroutine"],
  ["011010", "RET", "Return from call"], ["011011", "HLT", "Stop clock"],
  ["011100", "MOD r,s", "Unsigned remainder"], ["011101", "LUI r,n", "Load upper 16 bits"],
  ["011110", "ADDI r,n", "Add immediate"], ["011111", "SUBI r,n", "Subtract immediate"],
  ["100000", "DIV r,s", "Unsigned division"], ["100001", "ROL r", "Rotate left"],
  ["100010", "ROR r", "Rotate right"], ["100011", "NEG r", "Two's-complement negate"],
  ["100100", "LDRI r,s", "r ← RAM[s & 0xFFF]"], ["100101", "STRI r,s", "RAM[s & 0xFFF] ← r"],
];

const languageHelp = {
  binary: "Enter one or more 32-bit instruction words per line.",
  assembly: "Use mnemonics, decimal or hex operands, and labels such as loop: or done:.",
  simple: "MiniScript is strongly typed and supports fixed arrays, u32/bool values, classes, methods, and control flow.",
};

const syntaxGuideSections = [
  {
    title: "Binary",
    summary: "Raw 32-bit machine words for direct loading.",
    highlights: [
      "Every token must be exactly 32 binary digits.",
      "You can put multiple words on one line separated by spaces or commas.",
      "Comments use #, ;, or //.",
      "The simulator accepts up to 4,096 words.",
      "Binary mode has no labels, mnemonics, or hex literals.",
    ],
    examples: [
      "00000100000000000000000000000011",
      "01011000000000000000000000000000",
      "01101100000000000000000000000000",
    ],
  },
  {
    title: "Assembly",
    summary: "Mnemonic source that assembles into the same 32-bit words.",
    highlights: [
      "Registers are A through P.",
      "Supported number formats: decimal, 0x hex, or $ hex.",
      "Labels use a trailing colon, like loop: or done:.",
      ".word and DW emit raw 32-bit values.",
      "Instruction shapes are none, one register, two registers, register + address, register + immediate, or register + upper half.",
    ],
    examples: [
      "start:\nLDI A, 10\nOUT A\nHLT",
      "loop:\nADDI A, 1\nJNZ loop",
      ".word 0x1234",
    ],
  },
  {
    title: "MiniScript",
    summary: "A strongly typed, JavaScript-like layer that compiles to assembly.",
    highlights: [
      "Declarations must be typed: let count: u32 = 3; or const limit: u32 = 10;",
      "Methods are typed and currently return void only.",
      "Class fields, constructors, methods, and this are supported.",
      "Array types are fixed-size: u32[N] and bool[N].",
      "Built-ins include output, halt, push/pop, nop, rol/ror, and neg.",
    ],
    examples: [
      "let count: u32 = 5;\nwhile (count !== 0) {\n  output(count);\n  count--;\n}",
      "class Counter {\n  value: u32;\n  constructor(start: u32) { this.value = start; }\n}",
      "let values: u32[3] = [10, 20, 30];\nvalues[1]++;",
    ],
  },
  {
    title: "Types and expressions",
    summary: "The value system and operators supported by the compiler.",
    highlights: [
      "Primitive types: u32, bool, and void for methods.",
      "Boolean literals: true and false.",
      "Numeric literals can be decimal or hex, and compile-time constants may be used where a constant is required.",
      "Arithmetic and bitwise operators: +, -, *, /, %, &, |, ^.",
      "Boolean operators: !, &&, ||.",
      "Comparison operators: ==, ===, !=, !==.",
      "Compound assignments are supported for variables, object fields, memory, and array elements where the type allows it.",
      "Update operators ++ and -- are supported on variables, fields, memory cells, and array elements.",
    ],
    examples: [
      "let mask: u32 = 0x00FF;\nlet flag: bool = true;\nif (!flag || mask === 0) { halt(); }",
      "count += 1;\nvalue ^= mask;\nvalue &= 0x0FFF;",
      "if (left === right) { output(1); } else { output(0); }",
    ],
  },
  {
    title: "Objects, arrays, memory",
    summary: "Stateful data features that sit on top of the register machine.",
    highlights: [
      "Classes can define typed fields, a single constructor, and methods.",
      "Methods are inlined during compilation and can access this.",
      "Arrays are fixed-size, live in high memory, and support .length.",
      "Array indexing must use a named array and a compile-time constant index.",
      "memory[address] accepts a constant or a u32 variable; runtime addresses use their low 12 bits.",
      "The 32×32 LED display uses addresses 4064–4095 as rows; bit 31 is the left pixel and bit 0 is the right pixel.",
      "Storing a word in an LED address also writes normal RAM, while reset clears the display.",
      "Arrays and push/pop share high memory, so the compiler rejects programs that combine them.",
    ],
    examples: [
      "class Counter {\n  value: u32;\n  constructor(start: u32) { this.value = start; }\n  method add(amount: u32): void { this.value += amount; }\n}",
      "let values: u32[4] = [7, 11, 13, 17];\nvalues[2]++;\noutput(values.length);",
      "const slot: u32 = 128;\nmemory[slot] = 1234;\noutput(memory[slot]);",
      "let row: u32 = 4064;\nmemory[row] = 0xAAAAAAAA;\nrow++;\nmemory[row] = 0x55555555;",
      "memory[4064] = 0xFFFFFFFF; // light row 0\nmemory[4065] = 0x80000001; // light both edges of row 1",
    ],
  },
  {
    title: "Instruction set",
    summary: "Every opcode the binary and assembly front-ends can emit.",
    highlights: [
      "The 6-bit opcode field currently defines 38 instructions and leaves room for 26 more.",
      "Conditional branches depend on the CPU zero, carry, or negative flags.",
      "PUSH, POP, CALL, and RET use the hardware stack.",
      "LDRI and STRI use a register as a dynamic memory address.",
      "LUI and ADDI/SUBI support compact immediate forms.",
      "HLT stops the clock until reset or reload.",
    ],
    instructions: instructionRows,
  },
];

const syntaxGuideText = syntaxGuideSections.map((section) => {
  const blocks = [
    section.title,
    section.summary,
    "",
    ...(section.highlights || []).map((line) => `- ${line}`),
  ];
  if (section.instructions) {
    blocks.push("", "Opcode reference", ...section.instructions.map(([opcode, name, description]) => `${opcode} ${name} - ${description}`));
  }
  if (section.examples?.length) blocks.push("", "Examples", ...section.examples);
  return blocks.join("\n");
}).join("\n\n");

const hex = (value) => `0x${(value >>> 0).toString(16).toUpperCase().padStart(8, "0")}`;
const hexAddress = (value) => `0x${value.toString(16).toUpperCase().padStart(2, "0")}`;
const hexOpcode = (value) => `0x${Number.parseInt(value, 2).toString(16).toUpperCase().padStart(2, "0")}`;

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
      <strong>{hex(value)}</strong>
      <div className="cpu-register__values"><span>32-bit hex</span><span>{value} decimal</span></div>
    </div>
  );
}

function MemoryGrid({ state }) {
  const pageSize = 256;
  const pageCount = Math.ceil(state.memory.length / pageSize);
  const [page, setPage] = useState(0);
  const pageStart = page * pageSize;
  return (
    <div className="cpu-memory-view">
      <div className="cpu-memory-toolbar">
        <label htmlFor="cpu-memory-page">Memory page</label>
        <select id="cpu-memory-page" value={page} onChange={(event) => setPage(Number(event.target.value))}>
          {Array.from({ length: pageCount }, (_, index) => <option value={index} key={index}>{hexAddress(index * pageSize)}–{hexAddress(Math.min(state.memory.length - 1, ((index + 1) * pageSize) - 1))}</option>)}
        </select>
      </div>
      <div className="cpu-memory-grid">
      {state.memory.slice(pageStart, pageStart + pageSize).map((value, index) => {
        const address = pageStart + index;
        const isPc = address === state.programCounter && !state.halted;
        const isMar = address === state.memoryAddressRegister && state.cycle > 0;
        const isInstruction = address === state.currentInstructionAddress && state.cycle > 0;
        return (
          <div className={`cpu-memory-cell ${isInstruction ? "instruction" : ""} ${isMar ? "addressed" : ""}`} key={address}>
            <div className="cpu-memory-address"><span>{hexAddress(address)}</span><span>{isPc && <em>PC</em>}{isMar && <em>MAR</em>}</span></div>
            <b>{hex(value)}</b><small>{value} decimal</small>
          </div>
        );
      })}
      </div>
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

function LedDisplay({ state }) {
  const activeRow = state.lastEvent.signals.includes("LED IN") ? state.memoryAddressRegister - LED_DISPLAY_START : -1;
  const litCount = state.ledDisplay.reduce((total, word) => total + word.toString(2).replaceAll("0", "").length, 0);
  return (
    <section className="cpu-led-panel cpu-panel" aria-labelledby="cpu-led-title">
      <div className="cpu-led-heading">
        <div><span className="cpu-chip-icon">LED</span><div><h2 id="cpu-led-title">32×32 LED display</h2><p>Write rows to memory 0xFE0–0xFFF</p></div></div>
        <span className="cpu-led-count">{litCount} / {LED_DISPLAY_ROWS * LED_DISPLAY_COLUMNS} lit</span>
      </div>
      <div className="cpu-led-screen" role="img" aria-label={`32 by 32 LED display with ${litCount} pixels lit`}>
        {state.ledDisplay.map((word, row) => (
          <div className={`cpu-led-row ${row === activeRow ? "active" : ""}`} key={row}>
            <span>{hexAddress(LED_DISPLAY_START + row)}</span>
            {Array.from({ length: LED_DISPLAY_COLUMNS }, (_, column) => (
              <i className={word & (1 << (LED_DISPLAY_COLUMNS - column - 1)) ? "lit" : ""} key={column} />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function SyntaxCard({ section }) {
  const highlights = section.highlights ?? section.notes ?? [];
  const examples = section.examples ?? [];
  return (
    <article className="cpu-syntax-card">
      <span>{section.title}</span>
      <p>{section.summary}</p>
      <ul>
        {highlights.map((note) => <li key={note}>{note}</li>)}
      </ul>
      {section.instructions ? (
        <div className="cpu-syntax-instruction-grid">
          {section.instructions.map(([opcode, name, description]) => (
            <div key={opcode}>
              <code>{hexOpcode(opcode)}</code>
              <b>{name}</b>
              <span>{description}</span>
            </div>
          ))}
        </div>
      ) : null}
      <div className="cpu-syntax-examples">
        {examples.map((example) => <pre key={example}>{example}</pre>)}
      </div>
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
  const [viewportWidth, setViewportWidth] = useState(() => (typeof window === "undefined" ? 1180 : window.innerWidth));
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
  const ledActive = componentActive("LED");
  const generalRegistersActive = REGISTER_NAMES.slice(1).some(componentActive);
  const litPixels = state.ledDisplay.reduce((total, word) => total + word.toString(2).replaceAll("0", "").length, 0);
  const circuitDensity = viewportWidth < 920 ? "compact" : viewportWidth > 1440 ? "wide" : "regular";
  const modalWidth = circuitDensity === "compact" ? 980 : circuitDensity === "wide" ? 1360 : 1180;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth, { passive: true });
    return () => window.removeEventListener("resize", updateViewportWidth);
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={`cpu-circuit-modal cpu-circuit-modal--${circuitDensity}`}
      style={{ "--cpu-circuit-modal-width": `${modalWidth}px` }}
      onClose={onClose}
      onCancel={onClose}
      aria-labelledby="cpu-modal-title"
    >
      <div className="cpu-modal-shell">
        <header className="cpu-modal-header">
          <div><span className="cpu-eyebrow">Live signal view</span><h2 id="cpu-modal-title">CPU execution circuit</h2><p>Highlighted paths show the transfers used by the last clock pulse.</p></div>
          <div className="cpu-modal-status"><span className={`cpu-status-light ${running ? "live" : ""}`} /><b>{state.halted ? "HALTED" : running ? "RUNNING" : "PAUSED"}</b><span>Clock {state.cycle}</span></div>
          <button className="cpu-modal-close" type="button" onClick={() => dialogRef.current?.close()} aria-label="Close CPU visualization">×</button>
        </header>
        <div className="cpu-circuit-scroll" aria-label={`CPU circuit after ${state.lastEvent.phase.toLowerCase()} phase`}>
          <div className="cpu-schematic-legend"><span className="address">12-bit address</span><span className="data">32-bit data</span><span className="control">Control</span><span>Drag to inspect the full schematic</span></div>
          <svg className="cpu-circuit-board" viewBox="0 0 1120 700" role="img" aria-labelledby="cpu-circuit-title cpu-circuit-description">
            <title id="cpu-circuit-title">Live CPU component and wire diagram</title>
            <desc id="cpu-circuit-description">Active control signals: {signals.join(", ") || "none"}.</desc>
            <defs>
              <pattern id="cpu-board-grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M 25 0 L 0 0 0 25" className="cpu-board-grid-line" /></pattern>
              <filter id="cpu-wire-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            </defs>
            <rect className="cpu-board-background" width="1120" height="700" rx="8" /><rect width="1120" height="700" rx="8" fill="url(#cpu-board-grid)" />
            <g className="cpu-circuit-zones" aria-hidden="true">
              <rect className="cpu-circuit-zone cpu-circuit-zone--fetch" x="24" y="24" width="1072" height="166" rx="12" />
              <rect className="cpu-circuit-zone cpu-circuit-zone--control" x="24" y="208" width="1072" height="146" rx="12" />
              <rect className="cpu-circuit-zone cpu-circuit-zone--execute" x="24" y="372" width="1072" height="304" rx="12" />
            </g>
            <g className="cpu-circuit-zone-labels" aria-hidden="true">
              <text x="42" y="47">FETCH + ADDRESS</text>
              <text x="42" y="231">CONTROL + I/O</text>
              <text x="42" y="395">EXECUTE + STATE</text>
            </g>
            <g className="cpu-circuit-wires">
              <path className={transferActive("PC", "MAR") ? "active" : ""} d="M190 105 H230" />
              <path className={transferActive("SP", "MAR") ? "active" : ""} d="M190 285 H220 V136 H230" />
              <path className={memoryActive && componentActive("MAR") ? "active" : ""} d="M410 105 H430" />
              <path className={transferActive("RAM", "IR") ? "active" : ""} d="M710 105 H730" />
              <path className={transferActive("IR", "CONTROL") ? "active control" : "control"} d="M730 285 H550" />
              <path className={transferActive(["CONTROL", "ADDRESS", "RAM"], "PC") ? "active control" : "control"} d="M430 280 H240 V85 H190" />
              <path className={transferActive(["ADDRESS", "OPERAND", "SP"], "MAR") ? "active control" : "control"} d="M430 300 H220 V285 H190" />
              <path className={transferActive("FLAGS", "CONTROL") ? "active control" : "control"} d="M820 457 H880 V315 H550" />
              <path className={transferActive("A", "ALU") || transferActive("ALU", "A") ? "active alu" : "alu"} d="M190 475 H510" />
              <path className={transferActive(REGISTER_NAMES.slice(1), "ALU") || transferActive("ALU", REGISTER_NAMES.slice(1)) ? "active alu" : "alu"} d="M470 467 H510" />
              <path className={transferActive("ALU", "FLAGS") ? "active alu" : "alu"} d="M700 467 H740" />
              <path className={transferActive("RAM", "A") || transferActive("A", "RAM") ? "active" : ""} d="M560 174 V392 H190" />
              <path className={transferActive("RAM", REGISTER_NAMES.slice(1)) || transferActive(REGISTER_NAMES.slice(1), "RAM") ? "active" : ""} d="M560 174 V412 H355" />
              <path className={transferActive("A", "OUT") ? "active" : ""} d="M190 510 V592 H920 V105" />
              <path className={transferActive(REGISTER_NAMES.slice(1), "OUT") ? "active" : ""} d="M470 520 V592 H920 V105" />
              <path className={transferActive(REGISTER_NAMES, "LED") ? "active" : ""} d="M430 522 H770" />
              <path className={transferActive("A", REGISTER_NAMES.slice(1)) || transferActive(REGISTER_NAMES.slice(1), "A") ? "active" : ""} d="M190 458 H230 V520 H240" />
            </g>
            <CircuitNode x={40} y={60} label="PC" value={hex(state.programCounter)} detail="PROGRAM COUNTER" active={componentActive("PC")} accent="lime" />
            <CircuitNode x={230} y={60} label="MAR" value={hex(state.memoryAddressRegister)} detail="MEMORY ADDRESS" active={componentActive("MAR")} />
            <CircuitNode x={430} y={36} width={250} height={138} label="RAM · 4096 WORDS" value={`[${hexAddress(state.memoryAddressRegister)}] ${hex(state.memory[state.memoryAddressRegister])}`} detail="32-BIT PROGRAM / DATA" active={memoryActive} accent="lime" />
            <CircuitNode x={730} y={60} label="IR" value={hex(state.instructionRegister)} detail={state.instruction?.mnemonic ?? "INSTRUCTION REGISTER"} active={componentActive("IR")} />
            <CircuitNode x={920} y={60} label="OUT" value={hex(state.outputRegister)} detail="VISIBLE OUTPUT" active={componentActive("OUT")} accent="lime" />
            <CircuitNode x={40} y={240} label="SP" value={hex(state.stackPointer)} detail="STACK POINTER" active={componentActive("SP")} accent="lime" />
            <CircuitNode x={300} y={226} width={250} height={108} label="CONTROL UNIT" value={state.lastEvent.phase} detail={state.instruction?.mnemonic ?? "AWAITING FETCH"} active={controlActive} accent="lime" />
            <CircuitNode x={770} y={226} width={210} height={108} label="LED MATRIX" value={`${litPixels} / 1024`} detail="0xFE0–0xFFF FRAMEBUFFER" active={ledActive} accent="lime" />
            <CircuitNode x={40} y={410} label="REGISTER A" value={hex(state.registerA)} detail="ACCUMULATOR" active={componentActive("A")} />
            <CircuitNode x={240} y={410} label="REGISTERS B–P" value={`${hex(state.registerB)} · ${hex(state.registerC)} · …`} detail="15 GENERAL REGISTERS" active={generalRegistersActive} />
            <CircuitNode x={510} y={410} width={190} label="ALU" value={aluActive ? state.lastEvent.title.replace("Executed ", "") : "IDLE"} detail="ARITHMETIC / LOGIC" active={aluActive} accent="orange" />
            <CircuitNode x={740} y={410} width={170} label="FLAGS" value={`Z${Number(state.zeroFlag)} C${Number(state.carryFlag)} N${Number(state.negativeFlag)} V${Number(state.overflowFlag)}`} detail="ZERO / CARRY / NEG / OVERFLOW" active={componentActive("FLAGS")} accent="orange" />
            <text className="cpu-wire-label" x="206" y="97">12-BIT ADDRESS BUS</text>
            <text className="cpu-wire-label" x="496" y="356">32-BIT DATA BUS</text>
            <text className="cpu-wire-label" x="704" y="582">OUTPUT / FRAMEBUFFER BUS</text>
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

function CpuSyntaxModal({ onClose }) {
  const dialogRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(syntaxGuideText);
      setCopied(true);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = syntaxGuideText;
      textarea.setAttribute("readonly", "readonly");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
    }
  };

  return (
    <dialog ref={dialogRef} className="cpu-syntax-modal" onClose={onClose} onCancel={onClose} aria-labelledby="cpu-syntax-title">
      <div className="cpu-syntax-shell">
        <header className="cpu-syntax-header">
          <div>
            <span className="cpu-eyebrow">Language reference</span>
            <h2 id="cpu-syntax-title">Binary, assembly, and MiniScript syntax</h2>
            <p>Use this as the quick reference for what the simulator accepts.</p>
          </div>
          <button type="button" className="cpu-syntax-copy" onClick={copyAll}>{copied ? "Copied" : "Copy all"}</button>
          <button type="button" className="cpu-modal-close" onClick={() => dialogRef.current?.close()} aria-label="Close syntax reference">×</button>
        </header>
        <div className="cpu-syntax-grid">
          {syntaxGuideSections.map((section) => <SyntaxCard key={section.title} section={section} />)}
        </div>
        <footer className="cpu-syntax-footer">
          <span>Comments: binary uses #, ;, or //. MiniScript also accepts /* */.</span>
          <button type="button" onClick={() => dialogRef.current?.close()}>Close</button>
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
  const [turbo, setTurbo] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [timerVersion, setTimerVersion] = useState(0);
  const [showCpuModal, setShowCpuModal] = useState(false);
  const [showSyntaxModal, setShowSyntaxModal] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const simulatorRef = useRef(null);
  const undoRef = useRef([]);

  const loadProgram = useCallback((programSource, programLanguage) => {
    setBusy(true); setRunning(false); setTurbo(false); setError("");
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
    setGenerating(true); setRunning(false); setTurbo(false); setError("");
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
    setRunning(false); setTurbo(false);
    const restored = simulatorRef.current.restore(previous);
    setState(restored); setUndoCount(undoRef.current.length);
    setHistory((events) => events.filter((event) => event.cycle <= restored.cycle));
  }, []);

  const reset = () => {
    if (!simulatorRef.current) return;
    setRunning(false); setTurbo(false); setBusy(true); setError("");
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

  const turboStep = useCallback(() => {
    const simulator = simulatorRef.current;
    if (!simulator) return false;
    try {
      undoRef.current.push(simulator.snapshot());
      if (undoRef.current.length > 100) undoRef.current.shift();
      const nextState = simulator.runSteps(10000);
      setUndoCount(undoRef.current.length); setState(nextState);
      setHistory((previous) => nextState.lastEvent.cycle > 0 ? [...previous.slice(-39), nextState.lastEvent] : previous);
      if (nextState.halted) setTurbo(false);
      return !nextState.halted;
    } catch (requestError) {
      setTurbo(false); setError(requestError instanceof Error ? requestError.message : "Turbo execution failed."); return false;
    }
  }, []);

  useEffect(() => {
    if (!turbo) return undefined;
    let frame;
    const runFrame = () => { if (turboStep()) frame = window.requestAnimationFrame(runFrame); };
    frame = window.requestAnimationFrame(runFrame);
    return () => window.cancelAnimationFrame(frame);
  }, [turbo, turboStep]);

  useEffect(() => {
    const pauseWhenHidden = () => { if (document.hidden) { setRunning(false); setTurbo(false); } };
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
  const clockRunning = running || turbo;

  return (
    <div className={`cpu-sim ${showCpuModal || showSyntaxModal ? "circuit-open" : ""}`}>
      <header className="cpu-topbar">
        <div className="cpu-brand"><span className="cpu-brand__mark">32</span><div><b>Clockwork</b><small>32-bit CPU laboratory</small></div></div>
        <div className="cpu-status-strip"><span className={`cpu-status-light ${clockRunning ? "live" : ""}`} /><span>{state?.halted ? "Halted" : turbo ? "Turbo running" : running ? "Clock running" : state ? "Clock paused" : "Program not loaded"}</span><b>{state?.cycle ?? 0} cycles</b><ElapsedTime key={timerVersion} running={clockRunning} /></div>
      </header>
      <main className="cpu-main">
        <section className="cpu-intro"><div><span className="cpu-eyebrow">Interactive computer architecture</span><h1>See what happens<br /><em>inside every clock.</em></h1></div><p>Write binary, assembly, or JavaScript-like MiniScript. Inspect every generated instruction and CPU state one pulse at a time.</p></section>
        {error && <div className="cpu-error" role="alert"><b>Could not continue</b><span>{error}</span><button type="button" onClick={() => setError("")} aria-label="Dismiss error">×</button></div>}
        {!showCpuModal && <><div className="cpu-workbench">
          <aside className="cpu-program-panel cpu-panel">
            <div className="cpu-panel-title"><span>01</span><div><h2>Program</h2><p>4,096 words maximum</p></div></div>
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
            <div className="cpu-language-actions">
              <button type="button" className="cpu-syntax-button" onClick={() => setShowSyntaxModal(true)}>Open syntax guide</button>
            </div>
            {language === "simple" && <details className="cpu-language-guide"><summary>MiniScript syntax</summary><code>let count: u32 = 300;</code><code>let values: u32[3] = [10, 20, 30];</code><code>values[1]++; // constant index</code><code>class Counter {"{ value: u32; … }"}</code><code>let counter: Counter = new Counter(0);</code><code>counter.increment(1);</code></details>}
            <button className="cpu-load-button" type="button" onClick={load} disabled={busy}>{busy ? "Compiling…" : state ? "Compile & load again" : "Compile & load"}</button>
            {compiled && <details className="cpu-compiled"><summary>View compiled output</summary>{language === "simple" && <><label>Assembly</label><pre>{compiled.assembly}</pre></>}<label>Machine code</label><pre>{compiled.machine}</pre></details>}
          </aside>

          <section className="cpu-area">
            <div className="cpu-control-deck cpu-panel">
              <div className="cpu-clock-readout"><small>Next micro-step</small><b>{state?.halted ? "HALTED" : state?.phase?.toUpperCase() ?? "FETCH"}</b><span>Cycle {(state?.cycle ?? 0) + (state?.halted ? 0 : 1)}</span></div>
              <div className="cpu-transport"><button className="cpu-reset-button" type="button" onClick={reset} disabled={!state || busy} aria-label="Reset CPU">↺</button><button className="cpu-back-button" type="button" onClick={stepBack} disabled={!undoCount || busy || turbo} aria-label="Previous clock step">←</button><button className="cpu-clock-button" type="button" onClick={step} disabled={!state || state.halted || busy || turbo}>▸ Clock</button><button className={`cpu-auto-button ${running ? "running" : ""}`} type="button" onClick={() => { setTurbo(false); setRunning((value) => !value); }} disabled={!state || state.halted || busy || turbo}>{running ? "■ Pause" : "▶ Auto run"}</button><button className={`cpu-turbo-button ${turbo ? "running" : ""}`} type="button" onClick={() => { setRunning(false); setTurbo((value) => !value); }} disabled={!state || state.halted || busy}>{turbo ? "■ Stop turbo" : "⚡ Turbo"}</button><button className="cpu-visualize-button" type="button" onClick={() => setShowCpuModal(true)} disabled={!state}>⌁ Visualize</button></div>
              <div className="cpu-speed"><label htmlFor="cpu-speed">Clock speed <b>{speed} Hz</b></label><input id="cpu-speed" type="range" min="1" max="10" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} /></div>
            </div>
            {state ? <>
              <div className="cpu-board cpu-panel">
                <div className="cpu-board-head"><div><span className="cpu-chip-icon">CPU</span><div><h2>32-bit processing unit</h2><p>Sixteen registers · 32-bit data bus · hardware stack</p></div></div><div className="cpu-flags"><span className={state.zeroFlag ? "set" : ""}>Z <b>{Number(state.zeroFlag)}</b></span><span className={state.carryFlag ? "set" : ""}>C <b>{Number(state.carryFlag)}</b></span><span className={state.negativeFlag ? "set" : ""}>N <b>{Number(state.negativeFlag)}</b></span><span className={state.overflowFlag ? "set" : ""}>V <b>{Number(state.overflowFlag)}</b></span></div></div>
                <div className="cpu-grid"><div className="cpu-register-bank">{state.registers.map((value, index) => <Register label={REGISTER_NAMES[index]} hint="GENERAL" value={value} active={activeSignals.some((signal) => signal.startsWith(`${REGISTER_NAMES[index]} `))} key={index} />)}<Register label="PC" hint="PROGRAM COUNTER" value={state.programCounter} active={activeSignals.some((signal) => signal.startsWith("PC "))} /><Register label="SP" hint="STACK POINTER" value={state.stackPointer} active={activeSignals.some((signal) => signal.startsWith("SP "))} /><Register label="IR" hint="INSTRUCTION" value={state.instructionRegister} active={activeSignals.some((signal) => signal.startsWith("IR "))} /><Register label="MAR" hint="MEMORY ADDRESS" value={state.memoryAddressRegister} active={activeSignals.some((signal) => signal.startsWith("MAR "))} /><Register label="OUT" hint="VISIBLE OUTPUT" value={state.outputRegister} active={activeSignals.includes("OUTPUT IN")} /></div><div className={`cpu-alu ${activeSignals.some((signal) => signal.startsWith("ALU")) ? "active" : ""}`}><small>Arithmetic logic unit</small><b>{state.instruction?.mnemonic ?? "ALU"}</b><div><span>A {hex(state.registerA)}</span><i>⇄</i><span>B {hex(state.registerB)}</span></div></div></div>
                <div className="cpu-data-bus"><span>32-bit data bus</span><div className={activeSignals.length ? "flowing" : ""} /><b>{hex(state.instructionRegister)}</b></div>
              </div><LedDisplay state={state} /><EventCard event={state.lastEvent} />
            </> : <div className="cpu-empty cpu-panel"><span>0x16</span><h2>Load a program to power the CPU</h2><p>Choose an example or write your own program, then compile it into memory.</p><button type="button" onClick={load}>Compile example</button></div>}
          </section>

          <aside className="cpu-memory-panel cpu-panel">
            <div className="cpu-panel-title"><span>02</span><div><h2>Memory</h2><p>4,096 × 32-bit words</p></div></div>
            {state ? <MemoryGrid state={state} /> : <div className="cpu-memory-grid disabled">{Array.from({ length: 256 }, (_, address) => <div className="cpu-memory-cell" key={address}><div className="cpu-memory-address"><span>{hexAddress(address)}</span></div><b>0x00000000</b><small>0 decimal</small></div>)}</div>}
            <div className="cpu-memory-legend"><span><i className="pc" />Next PC</span><span><i className="mar" />MAR selected</span></div>
            <div className="cpu-history"><h3>Clock history</h3><Timeline events={history} /></div>
          </aside>
        </div>

        <section className="cpu-reference cpu-panel">
          <div className="cpu-reference-copy"><span className="cpu-eyebrow">The clock cycle</span><h2>Three pulses make<br />one instruction.</h2><p>The CPU repeats the same rhythm until it encounters <b>HLT</b>. Clock manually to isolate each transition.</p><div className="cpu-cycle-steps"><span><b>1</b>FETCH<small>RAM → IR</small></span><i>→</i><span><b>2</b>DECODE<small>IR → Control</small></span><i>→</i><span><b>3</b>EXECUTE<small>Control → CPU</small></span></div></div>
          <div className="cpu-instructions"><h3>Instruction set</h3><p>Hex opcode · register and immediate/address fields</p><div className="cpu-instruction-grid">{instructionRows.map(([opcode, name, description]) => <div key={opcode}><code>{hexOpcode(opcode)}</code><b>{name}</b><span>{description}</span></div>)}</div></div>
        </section></>}
      </main>
      {showCpuModal && state && <CpuExecutionModal state={state} running={clockRunning} busy={busy || turbo} canStepBack={undoCount > 0} onClose={() => setShowCpuModal(false)} onStep={step} onStepBack={stepBack} onToggleRunning={() => { setTurbo(false); setRunning((value) => !value); }} />}
      {showSyntaxModal && <CpuSyntaxModal onClose={() => setShowSyntaxModal(false)} />}
      <footer className="cpu-footer"><span>Clockwork CPU Lab</span><p>A 32-bit architecture with 16 registers and 4,096 words of memory. Values wrap at 4,294,967,295.</p></footer>
    </div>
  );
}
