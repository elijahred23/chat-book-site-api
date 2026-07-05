import { randomUUID } from 'crypto';

const MEMORY_SIZE = 16;

export class ProgramParseError extends Error {}

const instructionInfo = [
  ['NOP', 'Do nothing for one instruction.', false],
  ['LDI A', 'Load the 4-bit operand directly into register A.', true],
  ['LDI B', 'Load the 4-bit operand directly into register B.', true],
  ['LDA', 'Load register A from the addressed memory byte.', true],
  ['STA', 'Store register A into the addressed memory byte.', true],
  ['ADD', 'Add register B to register A.', false],
  ['SUB', 'Subtract register B from register A.', false],
  ['AND', 'Bitwise AND register A with B.', false],
  ['OR', 'Bitwise OR register A with B.', false],
  ['XOR', 'Bitwise XOR register A with B.', false],
  ['JMP', 'Jump to the addressed program byte.', true],
  ['JZ', 'Jump when the zero flag is set.', true],
  ['JC', 'Jump when the carry flag is set.', true],
  ['OUT', 'Copy register A into the output register.', false],
  ['SWP', 'Exchange registers A and B.', false],
  ['HLT', 'Stop the CPU clock.', false],
];

export function decodeInstruction(value) {
  const opcode = value >> 4;
  const operand = value & 0x0f;
  const [name, description, usesOperand] = instructionInfo[opcode];
  return { mnemonic: usesOperand ? `${name} ${operand.toString(16).toUpperCase()}` : name, description, opcode, operand };
}

const bits = (value, width = 8) => value.toString(2).padStart(width, '0');
const hex = (value) => `0x${value.toString(16).toUpperCase()}`;
const stripComment = (line) => line.replace(/(\/\/|#|;).*$/, '');
const parseError = (line, message) => new ProgramParseError(`Line ${line}: ${message}`);

function ensureSize(count, line) {
  if (count > MEMORY_SIZE) throw parseError(line, `programs can contain at most ${MEMORY_SIZE} bytes.`);
}

function parseBinary(source) {
  if (!source?.trim()) throw new ProgramParseError('Enter at least one 8-bit binary instruction.');
  const bytes = [];
  source.replace(/\r/g, '').split('\n').forEach((raw, index) => {
    const line = stripComment(raw).trim();
    if (!line) return;
    line.split(/[\s,]+/).forEach((token) => {
      if (!/^[01]{8}$/.test(token)) throw parseError(index + 1, `'${token}' must be exactly 8 binary digits.`);
      bytes.push(Number.parseInt(token, 2));
      ensureSize(bytes.length, index + 1);
    });
  });
  if (!bytes.length) throw new ProgramParseError('Enter at least one 8-bit binary instruction.');
  return bytes;
}

const opcodes = new Map(Object.entries({
  NOP: 0x0, LDA: 0x3, STA: 0x4, ADD: 0x5, SUB: 0x6, AND: 0x7, OR: 0x8,
  XOR: 0x9, JMP: 0xa, JZ: 0xb, JC: 0xc, OUT: 0xd, SWP: 0xe, HLT: 0xf,
}));

function parseNumber(text, labels, line, maximum) {
  const token = text.trim();
  if (labels.has(token.toLowerCase())) return labels.get(token.toLowerCase());
  let value;
  if (/^0x/i.test(token)) value = Number.parseInt(token.slice(2), 16);
  else if (token.startsWith('$')) value = Number.parseInt(token.slice(1), 16);
  else if (/^-?\d+$/.test(token)) value = Number.parseInt(token, 10);
  if (!Number.isInteger(value)) throw parseError(line, `'${token}' is not a valid number or label.`);
  if (value < 0 || value > maximum) throw parseError(line, `value ${value} must be between 0 and ${maximum}.`);
  return value;
}

function assemble(source) {
  if (!source?.trim()) throw new ProgramParseError('Enter at least one assembly instruction.');
  const labels = new Map();
  const instructions = [];
  source.replace(/\r/g, '').split('\n').forEach((raw, index) => {
    let text = stripComment(raw).trim();
    if (!text) return;
    const match = text.match(/^([A-Za-z_][A-Za-z0-9_]*):/);
    if (match) {
      const key = match[1].toLowerCase();
      if (labels.has(key)) throw parseError(index + 1, `label '${match[1]}' is defined more than once.`);
      labels.set(key, instructions.length);
      text = text.slice(match[0].length).trim();
      if (!text) return;
    }
    instructions.push({ line: index + 1, text });
    ensureSize(instructions.length, index + 1);
  });
  if (!instructions.length) throw new ProgramParseError('Enter at least one assembly instruction.');
  return instructions.map(({ line, text }) => {
    const match = text.trim().match(/^(\S+)(?:\s+(.*))?$/);
    const mnemonic = match[1].toUpperCase();
    const operandText = (match[2] || '').trim();
    if (mnemonic === '.BYTE' || mnemonic === 'DB') return parseNumber(operandText, labels, line, 255);
    if (mnemonic === 'LDI') {
      const operands = operandText.split(',').map((part) => part.trim()).filter(Boolean);
      if (operands.length !== 2 || !/^[AB]$/i.test(operands[0])) {
        throw parseError(line, "LDI syntax is 'LDI A, value' or 'LDI B, value'.");
      }
      return ((operands[0].toUpperCase() === 'A' ? 0x1 : 0x2) << 4) | parseNumber(operands[1], labels, line, 15);
    }
    if (!opcodes.has(mnemonic)) throw parseError(line, `unknown instruction '${match[1]}'.`);
    const opcode = opcodes.get(mnemonic);
    const needsOperand = [0x3, 0x4, 0xa, 0xb, 0xc].includes(opcode);
    if (needsOperand && !operandText) throw parseError(line, `${mnemonic} requires an address.`);
    if (!needsOperand && operandText) throw parseError(line, `${mnemonic} does not take an operand.`);
    return (opcode << 4) | (needsOperand ? parseNumber(operandText, labels, line, 15) : 0);
  });
}

const tokenError = (token, message) => parseError(token.line, `column ${token.column}: ${message}`);

function scanMiniScript(source) {
  const tokens = [];
  const symbols = ['===', '!==', '==', '!=', '+=', '-=', '&=', '|=', '^=', '++', '--', '&&', '||'];
  let index = 0;
  let line = 1;
  let column = 1;
  const peek = (offset = 0) => source[index + offset] || '\0';
  while (index < source.length) {
    const ch = peek();
    if (ch === ' ' || ch === '\t' || ch === '\r') { index += 1; column += 1; continue; }
    if (ch === '\n') { index += 1; line += 1; column = 1; continue; }
    if (ch === '#' || (ch === '/' && peek(1) === '/')) {
      while (index < source.length && peek() !== '\n') { index += 1; column += 1; }
      continue;
    }
    if (ch === '/' && peek(1) === '*') {
      const startLine = line;
      index += 2; column += 2;
      while (index < source.length && !(peek() === '*' && peek(1) === '/')) {
        if (peek() === '\n') { index += 1; line += 1; column = 1; } else { index += 1; column += 1; }
      }
      if (index >= source.length) throw parseError(startLine, 'unterminated block comment.');
      index += 2; column += 2; continue;
    }
    const start = index;
    const tokenLine = line;
    const tokenColumn = column;
    if (/[A-Za-z_$]/.test(ch)) {
      while (/[A-Za-z0-9_$]/.test(peek())) { index += 1; column += 1; }
      tokens.push({ kind: 'identifier', text: source.slice(start, index), line: tokenLine, column: tokenColumn });
      continue;
    }
    if (/\d/.test(ch)) {
      if (ch === '0' && /[xX]/.test(peek(1))) {
        index += 2; column += 2;
        const digitsStart = index;
        while (/[0-9a-f]/i.test(peek())) { index += 1; column += 1; }
        if (index === digitsStart) throw parseError(tokenLine, `column ${tokenColumn}: invalid hexadecimal number.`);
      } else {
        while (/\d/.test(peek())) { index += 1; column += 1; }
      }
      tokens.push({ kind: 'number', text: source.slice(start, index), line: tokenLine, column: tokenColumn });
      continue;
    }
    const symbol = symbols.find((value) => source.startsWith(value, index));
    if (symbol) {
      tokens.push({ kind: 'symbol', text: symbol, line: tokenLine, column: tokenColumn });
      index += symbol.length; column += symbol.length; continue;
    }
    if ('{}()[];,=+-&|^!'.includes(ch)) {
      tokens.push({ kind: 'symbol', text: ch, line: tokenLine, column: tokenColumn });
      index += 1; column += 1; continue;
    }
    throw parseError(line, `unexpected character '${ch}' at column ${column}.`);
  }
  tokens.push({ kind: 'end', text: '<end>', line, column });
  return tokens;
}

class MiniParser {
  constructor(tokens) { this.tokens = tokens; this.position = 0; }
  get current() { return this.tokens[this.position]; }
  get previous() { return this.tokens[this.position - 1]; }
  check(text) { return this.current.text.toLowerCase() === text.toLowerCase(); }
  match(text) { if (!this.check(text)) return false; this.advance(); return true; }
  matchWord(text) { return this.current.kind === 'identifier' && this.match(text); }
  advance() { const token = this.current; if (this.position < this.tokens.length - 1) this.position += 1; return token; }
  consume(text, message) { if (this.match(text)) return this.previous; throw tokenError(this.current, message); }
  identifier(message) { if (this.current.kind === 'identifier') return this.advance(); throw tokenError(this.current, message); }
  endStatement() {
    if (this.match(';') || this.check('}') || this.current.kind === 'end') return;
    throw tokenError(this.current, "expected ';' after the statement.");
  }
  parseProgram() {
    const statements = [];
    while (this.current.kind !== 'end') statements.push(this.parseStatement());
    return { type: 'block', statements, line: 1 };
  }
  parseStatement() {
    if (this.match('{')) return this.parseBlock(this.previous.line);
    if (this.matchWord('let') || this.matchWord('const')) return this.parseDeclaration(this.previous);
    if (this.matchWord('if')) return this.parseIf(this.previous.line);
    if (this.matchWord('while')) return this.parseWhile(this.previous.line);
    if (this.matchWord('break') || this.matchWord('continue')) {
      const keyword = this.previous; this.endStatement();
      return { type: 'loopControl', isBreak: keyword.text.toLowerCase() === 'break', line: keyword.line };
    }
    const start = this.current;
    const target = this.parsePrimary();
    if (target.type === 'name' && (this.match('++') || this.match('--'))) {
      const operator = this.previous.text; this.endStatement();
      return { type: 'update', name: target.value, operator, line: start.line };
    }
    if (['=', '+=', '-=', '&=', '|=', '^='].some((operator) => this.match(operator))) {
      const operator = this.previous.text;
      const value = this.parseExpression(); this.endStatement();
      return { type: 'assignment', target, operator, value, line: start.line };
    }
    if (target.type === 'name' && this.match('(')) {
      const args = [];
      if (!this.check(')')) do { args.push(this.parseExpression()); } while (this.match(','));
      this.consume(')', "expected ')' after function arguments."); this.endStatement();
      return { type: 'call', name: target.value, arguments: args, line: start.line };
    }
    throw tokenError(start, 'expected an assignment, update, or function call.');
  }
  parseBlock(line) {
    const statements = [];
    while (!this.check('}') && this.current.kind !== 'end') statements.push(this.parseStatement());
    this.consume('}', "expected '}' to close the block.");
    return { type: 'block', statements, line };
  }
  parseDeclaration(keyword) {
    const name = this.identifier('expected a name after the declaration keyword.');
    this.consume('=', 'declarations require an initializer.');
    const value = this.parseExpression(); this.endStatement();
    return { type: 'declaration', kind: keyword.text.toLowerCase(), name: name.text, value, line: keyword.line };
  }
  parseIf(line) {
    this.consume('(', "expected '(' after if.");
    const condition = this.parseExpression(); this.consume(')', "expected ')' after the condition.");
    const then = this.parseStatement();
    const otherwise = this.matchWord('else') ? this.parseStatement() : null;
    return { type: 'if', condition, then, else: otherwise, line };
  }
  parseWhile(line) {
    this.consume('(', "expected '(' after while.");
    const condition = this.parseExpression(); this.consume(')', "expected ')' after the condition.");
    return { type: 'while', condition, body: this.parseStatement(), line };
  }
  parseExpression() { return this.parseBinary(0); }
  parseBinary(minimum) {
    let left = this.parseUnary();
    while (this.precedence(this.current.text) >= minimum) {
      const operator = this.advance();
      const right = this.parseBinary(this.precedence(operator.text) + 1);
      left = { type: 'binary', left, operator: operator.text, right, line: operator.line };
    }
    return left;
  }
  parseUnary() {
    if (this.match('!')) return { type: 'unary', operator: '!', value: this.parseUnary(), line: this.previous.line };
    return this.parsePrimary();
  }
  parsePrimary() {
    const token = this.advance();
    if (token.kind === 'number') return { type: 'number', value: Number.parseInt(token.text, token.text.toLowerCase().startsWith('0x') ? 16 : 10), line: token.line };
    if (token.kind === 'identifier') {
      if (token.text.toLowerCase() === 'memory' && this.match('[')) {
        const address = this.parseExpression(); this.consume(']', "expected ']' after the memory address.");
        return { type: 'memory', address, line: token.line };
      }
      return { type: 'name', value: token.text, line: token.line };
    }
    if (token.text === '(') {
      const expression = this.parseExpression(); this.consume(')', "expected ')' after the expression."); return expression;
    }
    throw tokenError(token, 'expected a value or variable name.');
  }
  precedence(operator) { return ({ '||': 1, '&&': 2, '==': 3, '===': 3, '!=': 3, '!==': 3, '|': 4, '^': 5, '&': 6, '+': 7, '-': 7 })[operator] ?? -1; }
}

class MiniCompiler {
  constructor() {
    this.code = []; this.variables = new Map(); this.declaredRegisters = new Set(); this.constants = new Map();
    this.loops = []; this.nextRegister = 0; this.nextLabel = 0;
  }
  compile(program) {
    this.compileStatement(program);
    const lastInstruction = [...this.code].reverse().find((line) => !line.endsWith(':'));
    if (lastInstruction?.toUpperCase() !== 'HLT') this.emit('HLT');
    return this.code.join('\n');
  }
  compileStatement(statement) {
    if (statement.type === 'block') statement.statements.forEach((child) => this.compileStatement(child));
    else if (statement.type === 'declaration') this.compileDeclaration(statement);
    else if (statement.type === 'assignment') this.compileAssignment(statement.target, statement.operator, statement.value, statement.line);
    else if (statement.type === 'update') this.compileUpdate(statement);
    else if (statement.type === 'call') this.compileCall(statement);
    else if (statement.type === 'if') this.compileIf(statement);
    else if (statement.type === 'while') this.compileWhile(statement);
    else if (statement.type === 'loopControl') {
      if (!this.loops.length) throw parseError(statement.line, `'${statement.isBreak ? 'break' : 'continue'}' can only be used inside a loop.`);
      const loop = this.loops.at(-1); this.emit(`JMP ${statement.isBreak ? loop.breakLabel : loop.continueLabel}`);
    }
  }
  compileDeclaration(declaration) {
    const key = declaration.name.toLowerCase();
    if (this.variables.has(key) || this.constants.has(key)) throw parseError(declaration.line, `'${declaration.name}' has already been declared.`);
    if (declaration.kind === 'const') { this.constants.set(key, this.constant(declaration.value)); return; }
    if (this.nextRegister >= 2) throw parseError(declaration.line, 'this CPU has only two runtime variables. Use const for compile-time values.');
    const register = this.nextRegister++ === 0 ? 'A' : 'B';
    this.variables.set(key, register); this.declaredRegisters.add(register);
    this.compileAssignment({ type: 'name', value: declaration.name, line: declaration.line }, '=', declaration.value, declaration.line);
  }
  compileAssignment(target, operator, value, line) {
    if (target.type === 'memory') {
      if (operator !== '=') throw parseError(line, "memory supports direct '=' assignment only.");
      const address = this.address(target.address); const source = this.register(value);
      if (source === 'A') this.emit(`STA ${address}`); else { this.emit('SWP'); this.emit(`STA ${address}`); this.emit('SWP'); }
      return;
    }
    if (target.type !== 'name') throw parseError(line, 'the assignment target must be a variable or memory address.');
    const destination = this.register(target); const immediate = this.tryConstant(value);
    if (operator === '=' && immediate.known) { this.requireNibble(immediate.value, value.line, 'immediate value'); this.emit(`LDI ${destination}, ${immediate.value}`); return; }
    if (operator === '=' && value.type === 'memory') {
      if (destination !== 'A') throw parseError(line, 'loading memory into the second variable would overwrite the first variable on this CPU.');
      this.emit(`LDA ${this.address(value.address)}`); return;
    }
    let operation; let right;
    if (operator === '=') {
      if (value.type !== 'binary' || !['+', '-', '&', '|', '^'].includes(value.operator)) {
        throw parseError(line, 'runtime assignments must be a supported binary expression such as total = total + step.');
      }
      if (this.register(value.left) !== destination) throw parseError(line, 'the left side of the expression must match the assigned variable.');
      operation = value.operator; right = value.right;
    } else { operation = operator[0]; right = value; }
    this.emitOperation(destination, operation, right, line);
  }
  compileUpdate(update) {
    const destination = this.register({ type: 'name', value: update.name, line: update.line });
    const scratch = destination === 'A' ? 'B' : 'A'; this.ensureScratch(scratch, update.line);
    this.emit(`LDI ${scratch}, 1`); const instruction = update.operator === '++' ? 'ADD' : 'SUB';
    if (destination === 'A') this.emit(instruction); else { this.emit('SWP'); this.emit(instruction); this.emit('SWP'); }
  }
  emitOperation(destination, operator, right, line) {
    const other = destination === 'A' ? 'B' : 'A'; const immediate = this.tryConstant(right);
    if (immediate.known) { this.requireNibble(immediate.value, right.line, 'immediate operand'); this.ensureScratch(other, line); this.emit(`LDI ${other}, ${immediate.value}`); }
    else if (this.register(right) !== other) throw parseError(line, 'a runtime operation must use the other CPU variable as its right operand.');
    const instruction = ({ '+': 'ADD', '-': 'SUB', '&': 'AND', '|': 'OR', '^': 'XOR' })[operator];
    if (!instruction) throw parseError(line, `operator '${operator}' is not supported.`);
    if (destination === 'A') this.emit(instruction); else { this.emit('SWP'); this.emit(instruction); this.emit('SWP'); }
  }
  compileCall(call) {
    const name = call.name.toLowerCase();
    if (name === 'output' || name === 'print') {
      this.requireArguments(call, 1); if (this.register(call.arguments[0]) === 'A') this.emit('OUT'); else { this.emit('SWP'); this.emit('OUT'); this.emit('SWP'); }
    } else if (name === 'halt' || name === 'stop') { this.requireArguments(call, 0); this.emit('HLT'); }
    else if (name === 'swap') { this.requireArguments(call, 2); if (this.register(call.arguments[0]) === this.register(call.arguments[1])) throw parseError(call.line, 'swap expects two different runtime variables.'); this.emit('SWP'); }
    else if (name === 'nop') { this.requireArguments(call, 0); this.emit('NOP'); }
    else throw parseError(call.line, `unknown function '${call.name}'. Available functions: output, halt, swap, and nop.`);
  }
  compileIf(statement) {
    const thenLabel = this.label('if'); const elseLabel = this.label('else'); const endLabel = this.label('endif');
    this.compileBranch(statement.condition, thenLabel, statement.else ? elseLabel : endLabel);
    this.mark(thenLabel); this.compileStatement(statement.then); this.emit(`JMP ${endLabel}`);
    if (statement.else) { this.mark(elseLabel); this.compileStatement(statement.else); }
    this.mark(endLabel);
  }
  compileWhile(statement) {
    const condition = this.label('while'); const body = this.label('body'); const end = this.label('endwhile');
    this.mark(condition); this.compileBranch(statement.condition, body, end); this.mark(body);
    this.loops.push({ breakLabel: end, continueLabel: condition }); this.compileStatement(statement.body); this.loops.pop();
    this.emit(`JMP ${condition}`); this.mark(end);
  }
  compileBranch(condition, whenTrue, whenFalse) {
    const constant = this.tryConstant(condition);
    if (constant.known) { this.emit(`JMP ${constant.value !== 0 ? whenTrue : whenFalse}`); return; }
    if (condition.type === 'unary' && condition.operator === '!') { this.compileBranch(condition.value, whenFalse, whenTrue); return; }
    if (condition.type === 'binary' && condition.operator === '&&') {
      const next = this.label('and'); this.compileBranch(condition.left, next, whenFalse); this.mark(next); this.compileBranch(condition.right, whenTrue, whenFalse); return;
    }
    if (condition.type === 'binary' && condition.operator === '||') {
      const next = this.label('or'); this.compileBranch(condition.left, whenTrue, next); this.mark(next); this.compileBranch(condition.right, whenTrue, whenFalse); return;
    }
    let truth = true; let test = condition;
    if (condition.type === 'binary' && ['==', '===', '!=', '!=='].includes(condition.operator)) {
      if (this.constant(condition.right) !== 0) throw parseError(condition.line, 'conditions can compare a variable only with zero on this CPU.');
      test = condition.left; truth = condition.operator === '==' || condition.operator === '===';
    }
    if (test.type === 'name' && ['carry', 'zero'].includes(test.value.toLowerCase())) {
      const jump = test.value.toLowerCase() === 'carry' ? 'JC' : 'JZ';
      this.emit(`${jump} ${truth ? whenTrue : whenFalse}`); this.emit(`JMP ${truth ? whenFalse : whenTrue}`); return;
    }
    const register = this.register(test);
    if (condition.type !== 'binary') truth = false;
    if (register === 'A') {
      this.emit('SWP'); this.emit('SWP'); this.emit(`JZ ${truth ? whenTrue : whenFalse}`); this.emit(`JMP ${truth ? whenFalse : whenTrue}`); return;
    }
    const zeroPath = this.label('zero'); const nonzeroPath = this.label('nonzero');
    this.emit('SWP'); this.emit(`JZ ${zeroPath}`); this.emit(`JMP ${nonzeroPath}`);
    this.mark(zeroPath); this.emit('SWP'); this.emit(`JMP ${truth ? whenTrue : whenFalse}`);
    this.mark(nonzeroPath); this.emit('SWP'); this.emit(`JMP ${truth ? whenFalse : whenTrue}`);
  }
  register(expression) {
    if (expression.type !== 'name' || !this.variables.has(expression.value.toLowerCase())) throw parseError(expression.line, 'expected a declared runtime variable.');
    return this.variables.get(expression.value.toLowerCase());
  }
  address(expression) { const value = this.constant(expression); this.requireNibble(value, expression.line, 'memory address'); return value; }
  constant(expression) { const result = this.tryConstant(expression); if (result.known) return result.value; throw parseError(expression.line, 'expected a compile-time constant.'); }
  tryConstant(expression) {
    if (expression.type === 'number') return { known: true, value: expression.value };
    if (expression.type === 'name') {
      const key = expression.value.toLowerCase();
      if (key === 'true') return { known: true, value: 1 }; if (key === 'false') return { known: true, value: 0 };
      if (this.constants.has(key)) return { known: true, value: this.constants.get(key) };
    }
    if (expression.type === 'unary' && expression.operator === '!') {
      const value = this.tryConstant(expression.value); if (value.known) return { known: true, value: value.value === 0 ? 1 : 0 };
    }
    if (expression.type === 'binary') {
      const left = this.tryConstant(expression.left); const right = this.tryConstant(expression.right);
      if (left.known && right.known) {
        const operations = {
          '+': () => left.value + right.value, '-': () => left.value - right.value, '&': () => left.value & right.value,
          '|': () => left.value | right.value, '^': () => left.value ^ right.value,
          '==': () => Number(left.value === right.value), '===': () => Number(left.value === right.value),
          '!=': () => Number(left.value !== right.value), '!==': () => Number(left.value !== right.value),
          '&&': () => Number(left.value !== 0 && right.value !== 0), '||': () => Number(left.value !== 0 || right.value !== 0),
        };
        if (operations[expression.operator]) return { known: true, value: operations[expression.operator]() };
      }
    }
    return { known: false, value: 0 };
  }
  ensureScratch(register, line) { if (this.declaredRegisters.has(register)) throw parseError(line, 'this operation needs the other register as scratch space, but that register holds another variable.'); }
  requireNibble(value, line, role) { if (value < 0 || value > 15) throw parseError(line, `${role} ${value} must be between 0 and 15.`); }
  requireArguments(call, count) { if (call.arguments.length !== count) throw parseError(call.line, `${call.name} expects ${count} argument${count === 1 ? '' : 's'}.`); }
  emit(instruction) { this.code.push(instruction); }
  mark(label) { this.code.push(`${label}:`); }
  label(prefix) { const label = `__${prefix}_${this.nextLabel}`; this.nextLabel += 1; return label; }
}

function compileMiniScript(source) {
  if (!source?.trim()) throw new ProgramParseError('Enter at least one MiniScript statement.');
  return new MiniCompiler().compile(new MiniParser(scanMiniScript(source)).parseProgram());
}

export function compileSource(source, language = 'binary') {
  const normalized = String(language || 'binary').trim().toLowerCase();
  if (!['binary', 'assembly', 'simple'].includes(normalized)) throw new ProgramParseError('Language must be binary, assembly, or simple.');
  const assemblySource = normalized === 'simple' ? compileMiniScript(source) : normalized === 'assembly' ? source : null;
  const bytes = normalized === 'binary' ? parseBinary(source) : assemble(assemblySource);
  const machineCode = bytes.map((value, address) => `${bits(value)}  # ${address.toString(16).toUpperCase()}: ${decodeInstruction(value).mnemonic}`).join('\n');
  const disassembly = bytes.map((value, address) => `${address.toString(16).toUpperCase()}: ${decodeInstruction(value).mnemonic}`).join('\n');
  return { bytes, assemblySource: assemblySource ?? disassembly, machineCode };
}

class CpuSimulator {
  constructor(compilation) { this.initialMemory = [...compilation.bytes, ...Array(MEMORY_SIZE - compilation.bytes.length).fill(0)]; this.reset(false); }
  reset(isReset = true) {
    this.memory = [...this.initialMemory]; this.registerA = 0; this.registerB = 0; this.programCounter = 0;
    this.instructionRegister = 0; this.memoryAddressRegister = 0; this.outputRegister = 0;
    this.zeroFlag = false; this.carryFlag = false; this.cycle = 0; this.phase = 'Fetch'; this.halted = false;
    this.currentInstructionAddress = 0; this.instruction = null;
    this.lastEvent = { cycle: 0, phase: 'Ready', title: isReset ? 'CPU reset' : 'Program loaded', detail: isReset ? 'Registers and memory were restored to their loaded values.' : 'Press Clock to begin the fetch cycle.', signals: isReset ? ['RESET'] : [] };
    return this.snapshot();
  }
  snapshot() {
    return { registerA: this.registerA, registerB: this.registerB, programCounter: this.programCounter, instructionRegister: this.instructionRegister,
      memoryAddressRegister: this.memoryAddressRegister, outputRegister: this.outputRegister, zeroFlag: this.zeroFlag, carryFlag: this.carryFlag,
      cycle: this.cycle, phase: this.phase, halted: this.halted, currentInstructionAddress: this.currentInstructionAddress,
      instruction: this.instruction ? { ...this.instruction } : null, memory: [...this.memory], lastEvent: { ...this.lastEvent, signals: [...this.lastEvent.signals] } };
  }
  step() {
    if (this.halted) return this.snapshot();
    this.cycle += 1;
    if (this.phase === 'Fetch') this.fetch(); else if (this.phase === 'Decode') this.decode(); else this.execute();
    return this.snapshot();
  }
  fetch() {
    this.currentInstructionAddress = this.programCounter; this.memoryAddressRegister = this.programCounter;
    this.instructionRegister = this.memory[this.memoryAddressRegister]; this.programCounter = (this.programCounter + 1) & 0x0f;
    this.instruction = null; this.phase = 'Decode';
    this.lastEvent = { cycle: this.cycle, phase: 'FETCH', title: 'Instruction fetched', detail: `MAR ← ${hex(this.memoryAddressRegister)}, IR ← RAM[${hex(this.memoryAddressRegister)}] (${bits(this.instructionRegister)}), PC ← ${hex(this.programCounter)}`, signals: ['PC OUT', 'MAR IN', 'RAM OUT', 'IR IN', 'PC INC'] };
  }
  decode() {
    this.instruction = decodeInstruction(this.instructionRegister); this.phase = 'Execute';
    this.lastEvent = { cycle: this.cycle, phase: 'DECODE', title: `Decoded ${this.instruction.mnemonic}`, detail: `Control unit reads opcode ${bits(this.instruction.opcode, 4)} and operand ${bits(this.instruction.operand, 4)}. ${this.instruction.description}`, signals: ['IR OUT', 'CONTROL DECODE'] };
  }
  execute() {
    const instruction = this.instruction ?? decodeInstruction(this.instructionRegister); const operand = instruction.operand;
    let detail = ''; let signals = [];
    const setZero = () => { this.zeroFlag = this.registerA === 0; };
    switch (instruction.opcode) {
      case 0x0: detail = 'No state changed.'; signals = ['NOP']; break;
      case 0x1: this.registerA = operand; setZero(); detail = `A ← immediate value ${operand}.`; signals = ['OPERAND OUT', 'A IN', 'FLAGS IN']; break;
      case 0x2: this.registerB = operand; this.zeroFlag = this.registerB === 0; detail = `B ← immediate value ${operand}.`; signals = ['OPERAND OUT', 'B IN', 'FLAGS IN']; break;
      case 0x3: this.memoryAddressRegister = operand; this.registerA = this.memory[operand]; setZero(); detail = `MAR ← ${hex(operand)}, A ← RAM[${hex(operand)}] (${this.registerA}).`; signals = ['OPERAND OUT', 'MAR IN', 'RAM OUT', 'A IN', 'FLAGS IN']; break;
      case 0x4: this.memoryAddressRegister = operand; this.memory[operand] = this.registerA; detail = `MAR ← ${hex(operand)}, RAM[${hex(operand)}] ← A (${this.registerA}).`; signals = ['OPERAND OUT', 'MAR IN', 'A OUT', 'RAM IN']; break;
      case 0x5: { const result = this.registerA + this.registerB; this.carryFlag = result > 255; this.registerA = result & 0xff; setZero(); detail = `ALU added B to A. A ← ${this.registerA}; carry ← ${Number(this.carryFlag)}.`; signals = ['A OUT', 'B OUT', 'ALU ADD', 'A IN', 'FLAGS IN']; break; }
      case 0x6: { const before = this.registerA; this.registerA = (before - this.registerB) & 0xff; this.carryFlag = before >= this.registerB; setZero(); detail = `ALU subtracted B from A. A ← ${this.registerA}; no-borrow/carry ← ${Number(this.carryFlag)}.`; signals = ['A OUT', 'B OUT', 'ALU SUB', 'A IN', 'FLAGS IN']; break; }
      case 0x7: this.registerA &= this.registerB; this.carryFlag = false; setZero(); detail = `A ← A AND B = ${this.registerA}.`; signals = ['A OUT', 'B OUT', 'ALU AND', 'A IN', 'FLAGS IN']; break;
      case 0x8: this.registerA |= this.registerB; this.carryFlag = false; setZero(); detail = `A ← A OR B = ${this.registerA}.`; signals = ['A OUT', 'B OUT', 'ALU OR', 'A IN', 'FLAGS IN']; break;
      case 0x9: this.registerA ^= this.registerB; this.carryFlag = false; setZero(); detail = `A ← A XOR B = ${this.registerA}.`; signals = ['A OUT', 'B OUT', 'ALU XOR', 'A IN', 'FLAGS IN']; break;
      case 0xa: this.programCounter = operand; detail = `PC ← ${hex(operand)}. The next fetch comes from this address.`; signals = ['OPERAND OUT', 'PC IN']; break;
      case 0xb: if (this.zeroFlag) this.programCounter = operand; detail = this.zeroFlag ? `Zero flag is set, so PC ← ${hex(this.programCounter)}.` : 'Zero flag is clear, so execution continues.'; signals = ['ZERO TEST', this.zeroFlag ? 'PC IN' : 'NO BRANCH']; break;
      case 0xc: if (this.carryFlag) this.programCounter = operand; detail = this.carryFlag ? `Carry flag is set, so PC ← ${hex(this.programCounter)}.` : 'Carry flag is clear, so execution continues.'; signals = ['CARRY TEST', this.carryFlag ? 'PC IN' : 'NO BRANCH']; break;
      case 0xd: this.outputRegister = this.registerA; detail = `OUT ← A (${this.registerA}).`; signals = ['A OUT', 'OUTPUT IN']; break;
      case 0xe: [this.registerA, this.registerB] = [this.registerB, this.registerA]; setZero(); detail = `A and B exchanged values. A = ${this.registerA}, B = ${this.registerB}.`; signals = ['A OUT', 'B OUT', 'A IN', 'B IN']; break;
      case 0xf: this.halted = true; this.phase = 'Halted'; detail = 'The clock is disabled. Reset or load a program to run again.'; signals = ['HALT']; break;
      default: break;
    }
    if (!this.halted) this.phase = 'Fetch';
    this.lastEvent = { cycle: this.cycle, phase: 'EXECUTE', title: `Executed ${instruction.mnemonic}`, detail, signals };
  }
}

export const samplePrograms = [
  { id: 'add', name: 'Add 5 + 3', description: 'Loads two values, adds them, and sends 8 to the output register.', source: '00010101  # LDI A, 5\n00100011  # LDI B, 3\n01010000  # ADD\n11010000  # OUT\n11110000  # HLT', assemblySource: 'LDI A, 5\nLDI B, 3\nADD\nOUT\nHLT', simpleSource: 'let left = 5;\nlet right = 3;\nleft += right;\noutput(left);\nhalt();' },
  { id: 'countdown', name: 'Countdown loop', description: 'Outputs 3, 2, 1, then halts when A reaches zero.', source: '00010011  # LDI A, 3\n11010000  # OUT\n00100001  # LDI B, 1\n01100000  # SUB\n10110110  # JZ 6\n10100001  # JMP 1\n11110000  # HLT', assemblySource: 'LDI A, 3\nloop:\nOUT\nLDI B, 1\nSUB\nJZ done\nJMP loop\ndone:\nHLT', simpleSource: 'let counter = 3;\n\nwhile (counter !== 0) {\n  output(counter);\n  counter--;\n}\n\nhalt();' },
  { id: 'memory', name: 'Memory round trip', description: 'Stores 9 in RAM address F, clears A, then loads the value back.', source: '00011001  # LDI A, 9\n01001111  # STA F\n00010000  # LDI A, 0\n00111111  # LDA F\n11010000  # OUT\n11110000  # HLT', assemblySource: 'LDI A, 9\nSTA 15\nLDI A, 0\nLDA 15\nOUT\nHLT', simpleSource: 'const slot = 15;\nlet value = 9;\n\nmemory[slot] = value;\nvalue = 0;\nvalue = memory[slot];\noutput(value);\nhalt();' },
  { id: 'logic', name: 'Bitwise XOR', description: 'Computes 12 XOR 10 and outputs 6.', source: '00011100  # LDI A, 12\n00101010  # LDI B, 10\n10010000  # XOR\n11010000  # OUT\n11110000  # HLT', assemblySource: 'LDI A, 12\nLDI B, 10\nXOR\nOUT\nHLT', simpleSource: 'let value = 12;\nlet mask = 10;\nvalue ^= mask;\noutput(value);\nhalt();' },
];

const sessions = new Map();
export function createSimulation(source, language) {
  const compilation = compileSource(source, language); const simulator = new CpuSimulator(compilation); const sessionId = randomUUID();
  sessions.set(sessionId, simulator);
  return { sessionId, state: simulator.snapshot(), assemblySource: compilation.assemblySource, machineCode: compilation.machineCode };
}
export const getSimulation = (sessionId) => sessions.get(sessionId);
