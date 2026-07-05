const MEMORY_SIZE = 64;
const WORD_MASK = 0xffff;

export class ProgramParseError extends Error {}

const registers = ['A', 'B', 'C', 'D'];
const instructionInfo = [
  ['NOP', 'none', 'Do nothing for one instruction.'],
  ['LDI', 'regImm', 'Load a 9-bit immediate into a register.'],
  ['LDR', 'regAddr', 'Load a register from memory.'],
  ['STR', 'regAddr', 'Store a register into memory.'],
  ['MOV', 'twoReg', 'Copy one register into another.'],
  ['ADD', 'twoReg', 'Add the source register to the destination.'],
  ['SUB', 'twoReg', 'Subtract the source register from the destination.'],
  ['MUL', 'twoReg', 'Multiply the destination by the source.'],
  ['AND', 'twoReg', 'Bitwise AND two registers.'],
  ['OR', 'twoReg', 'Bitwise OR two registers.'],
  ['XOR', 'twoReg', 'Bitwise XOR two registers.'],
  ['NOT', 'oneReg', 'Invert every bit in a register.'],
  ['SHL', 'oneReg', 'Shift left and move the outgoing bit into carry.'],
  ['SHR', 'oneReg', 'Shift right and move the outgoing bit into carry.'],
  ['INC', 'oneReg', 'Increment a register.'],
  ['DEC', 'oneReg', 'Decrement a register.'],
  ['CMP', 'twoReg', 'Compare two registers and update flags.'],
  ['JMP', 'address', 'Jump to an address.'],
  ['JZ', 'address', 'Jump when the zero flag is set.'],
  ['JNZ', 'address', 'Jump when the zero flag is clear.'],
  ['JC', 'address', 'Jump when the carry flag is set.'],
  ['JN', 'address', 'Jump when the negative flag is set.'],
  ['OUT', 'oneReg', 'Copy a register into the output register.'],
  ['PUSH', 'oneReg', 'Push a register onto the stack.'],
  ['POP', 'oneReg', 'Pop the stack into a register.'],
  ['CALL', 'address', 'Push the return address and call a subroutine.'],
  ['RET', 'none', 'Return from a subroutine.'],
  ['HLT', 'none', 'Stop the CPU clock.'],
  ['MOD', 'twoReg', 'Store the remainder of an unsigned division.'],
  ['LUI', 'regByte', 'Load the upper byte of a register.'],
  ['ADDI', 'regImm', 'Add a 9-bit immediate to a register.'],
  ['SUBI', 'regImm', 'Subtract a 9-bit immediate from a register.'],
];

export function decodeInstruction(value) {
  const opcode = (value >>> 11) & 0x1f;
  const destination = (value >>> 9) & 0x03;
  const source = (value >>> 7) & 0x03;
  const immediate = value & 0x01ff;
  const address = value & 0x003f;
  const [name, format, description] = instructionInfo[opcode];
  const operands = {
    none: '', oneReg: registers[destination], twoReg: `${registers[destination]}, ${registers[source]}`,
    regImm: `${registers[destination]}, ${immediate}`, regByte: `${registers[destination]}, ${value & 0xff}`,
    regAddr: `${registers[destination]}, ${address}`, address: `${address}`,
  }[format];
  return { mnemonic: `${name}${operands ? ` ${operands}` : ''}`, description, opcode, destination, source, immediate, address };
}

const bits = (value, width = 16) => value.toString(2).padStart(width, '0');
const hex = (value) => `0x${value.toString(16).toUpperCase()}`;
const stripComment = (line) => line.replace(/(\/\/|#|;).*$/, '');
const parseError = (line, message) => new ProgramParseError(`Line ${line}: ${message}`);

function ensureSize(count, line) {
  if (count > MEMORY_SIZE) throw parseError(line, `programs can contain at most ${MEMORY_SIZE} words.`);
}

function parseBinary(source) {
  if (!source?.trim()) throw new ProgramParseError('Enter at least one 16-bit binary instruction.');
  const words = [];
  source.replace(/\r/g, '').split('\n').forEach((raw, index) => {
    const line = stripComment(raw).trim();
    if (!line) return;
    line.split(/[\s,]+/).forEach((token) => {
      if (!/^[01]{16}$/.test(token)) throw parseError(index + 1, `'${token}' must be exactly 16 binary digits.`);
      words.push(Number.parseInt(token, 2));
      ensureSize(words.length, index + 1);
    });
  });
  if (!words.length) throw new ProgramParseError('Enter at least one 16-bit binary instruction.');
  return words;
}

const opcodes = new Map(instructionInfo.map(([name], opcode) => [name, opcode]));

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
    if (mnemonic === '.WORD' || mnemonic === 'DW') return parseNumber(operandText, labels, line, WORD_MASK);
    if (!opcodes.has(mnemonic)) throw parseError(line, `unknown instruction '${match[1]}'.`);
    const opcode = opcodes.get(mnemonic);
    const format = instructionInfo[opcode][1];
    const operands = operandText.split(',').map((part) => part.trim()).filter(Boolean);
    const register = (text) => {
      const index = registers.indexOf(String(text).toUpperCase());
      if (index < 0) throw parseError(line, `'${text || ''}' must be a register from A to D.`);
      return index;
    };
    if (format === 'none') {
      if (operandText) throw parseError(line, `${mnemonic} does not take an operand.`);
      return opcode << 11;
    }
    if (format === 'oneReg') {
      if (operands.length !== 1) throw parseError(line, `${mnemonic} expects one register.`);
      return (opcode << 11) | (register(operands[0]) << 9);
    }
    if (format === 'twoReg') {
      if (operands.length !== 2) throw parseError(line, `${mnemonic} expects two registers.`);
      return (opcode << 11) | (register(operands[0]) << 9) | (register(operands[1]) << 7);
    }
    if (format === 'address') {
      if (operands.length !== 1) throw parseError(line, `${mnemonic} expects one address.`);
      return (opcode << 11) | parseNumber(operands[0], labels, line, MEMORY_SIZE - 1);
    }
    if (format === 'regAddr' || format === 'regImm' || format === 'regByte') {
      if (operands.length !== 2) throw parseError(line, `${mnemonic} expects a register and a value.`);
      const maximum = format === 'regAddr' ? MEMORY_SIZE - 1 : format === 'regByte' ? 255 : 511;
      return (opcode << 11) | (register(operands[0]) << 9) | parseNumber(operands[1], labels, line, maximum);
    }
    throw parseError(line, `cannot encode '${mnemonic}'.`);
  });
}

const tokenError = (token, message) => parseError(token.line, `column ${token.column}: ${message}`);

function scanMiniScript(source) {
  const tokens = [];
  const symbols = ['===', '!==', '==', '!=', '+=', '-=', '*=', '%=', '&=', '|=', '^=', '++', '--', '&&', '||'];
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
    if ('{}()[];,:.=+-*%&|^!'.includes(ch)) {
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
    if (this.matchWord('class')) return this.parseClass(this.previous);
    if (this.matchWord('let') || this.matchWord('const')) return this.parseDeclaration(this.previous);
    if (this.matchWord('if')) return this.parseIf(this.previous.line);
    if (this.matchWord('while')) return this.parseWhile(this.previous.line);
    if (this.matchWord('break') || this.matchWord('continue')) {
      const keyword = this.previous; this.endStatement();
      return { type: 'loopControl', isBreak: keyword.text.toLowerCase() === 'break', line: keyword.line };
    }
    const start = this.current;
    const target = this.parsePostfix();
    if ((target.type === 'name' || target.type === 'member') && (this.match('++') || this.match('--'))) {
      const operator = this.previous.text; this.endStatement();
      return { type: 'update', target, operator, line: start.line };
    }
    if (['=', '+=', '-=', '*=', '%=', '&=', '|=', '^='].some((operator) => this.match(operator))) {
      const operator = this.previous.text;
      const value = this.parseExpression(); this.endStatement();
      return { type: 'assignment', target, operator, value, line: start.line };
    }
    if (target.type === 'call') {
      this.endStatement();
      return { type: 'callStatement', call: target, line: start.line };
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
    this.consume(':', "strongly typed declarations require ': Type'.");
    const valueType = this.identifier('expected a type after the colon.');
    this.consume('=', 'declarations require an initializer.');
    const value = this.parseExpression(); this.endStatement();
    return { type: 'declaration', kind: keyword.text.toLowerCase(), name: name.text, valueType: valueType.text, value, line: keyword.line };
  }
  parseClass(keyword) {
    const name = this.identifier('expected a class name.');
    this.consume('{', "expected '{' after the class name.");
    const members = [];
    while (!this.check('}') && this.current.kind !== 'end') {
      if (this.matchWord('constructor')) members.push(this.parseMethod(this.previous, true));
      else if (this.matchWord('method')) members.push(this.parseMethod(this.previous, false));
      else {
        const field = this.identifier('expected a typed field, constructor, or method.');
        this.consume(':', "expected ':' after the field name.");
        const fieldType = this.identifier('expected a field type.');
        const value = this.match('=') ? this.parseExpression() : null;
        this.endStatement();
        members.push({ type: 'field', name: field.text, valueType: fieldType.text, value, line: field.line });
      }
    }
    this.consume('}', "expected '}' to close the class.");
    return { type: 'class', name: name.text, members, line: keyword.line };
  }
  parseMethod(keyword, constructor) {
    const name = constructor ? { text: 'constructor', line: keyword.line } : this.identifier('expected a method name.');
    this.consume('(', "expected '(' after the method name.");
    const parameters = [];
    if (!this.check(')')) do {
      const parameter = this.identifier('expected a parameter name.');
      this.consume(':', "expected ':' after the parameter name.");
      const parameterType = this.identifier('expected a parameter type.');
      parameters.push({ name: parameter.text, valueType: parameterType.text, line: parameter.line });
    } while (this.match(','));
    this.consume(')', "expected ')' after the parameters.");
    let returnType = 'void';
    if (!constructor) {
      this.consume(':', "strongly typed methods require a return type.");
      returnType = this.identifier('expected a return type.').text;
    }
    this.consume('{', "expected '{' before the method body.");
    const body = this.parseBlock(this.previous.line);
    return { type: 'method', name: name.text, parameters, returnType, body, constructor, line: keyword.line };
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
    return this.parsePostfix();
  }
  parsePostfix() {
    let expression = this.parsePrimary();
    for (;;) {
      if (this.match('.')) {
        const property = this.identifier("expected a member name after '.'.");
        expression = { type: 'member', object: expression, property: property.text, line: property.line };
      } else if (this.match('(')) {
        const args = [];
        if (!this.check(')')) do { args.push(this.parseExpression()); } while (this.match(','));
        this.consume(')', "expected ')' after the arguments.");
        expression = { type: 'call', callee: expression, arguments: args, line: expression.line };
      } else break;
    }
    return expression;
  }
  parsePrimary() {
    const token = this.advance();
    if (token.kind === 'number') return { type: 'number', value: Number.parseInt(token.text, token.text.toLowerCase().startsWith('0x') ? 16 : 10), line: token.line };
    if (token.kind === 'identifier') {
      if (token.text.toLowerCase() === 'new') {
        const className = this.identifier('expected a class name after new.');
        this.consume('(', "expected '(' after the class name.");
        const args = [];
        if (!this.check(')')) do { args.push(this.parseExpression()); } while (this.match(','));
        this.consume(')', "expected ')' after constructor arguments.");
        return { type: 'new', className: className.text, arguments: args, line: token.line };
      }
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
  precedence(operator) { return ({ '||': 1, '&&': 2, '==': 3, '===': 3, '!=': 3, '!==': 3, '|': 4, '^': 5, '&': 6, '+': 7, '-': 7, '*': 8, '%': 8 })[operator] ?? -1; }
}

class MiniCompiler {
  constructor() {
    this.code = []; this.variables = new Map(); this.constants = new Map(); this.objects = new Map(); this.classes = new Map();
    this.loops = []; this.contexts = []; this.nextRegister = 0; this.nextLabel = 0; this.inlineDepth = 0;
  }
  compile(program) {
    program.statements.filter((statement) => statement.type === 'class').forEach((statement) => this.defineClass(statement));
    this.compileStatement(program);
    const lastInstruction = [...this.code].reverse().find((line) => !line.endsWith(':'));
    if (lastInstruction?.toUpperCase() !== 'HLT') this.emit('HLT');
    return this.code.join('\n');
  }
  compileStatement(statement) {
    if (statement.type === 'block') statement.statements.forEach((child) => this.compileStatement(child));
    else if (statement.type === 'class') return;
    else if (statement.type === 'declaration') this.compileDeclaration(statement);
    else if (statement.type === 'assignment') this.compileAssignment(statement.target, statement.operator, statement.value, statement.line);
    else if (statement.type === 'update') this.compileUpdate(statement);
    else if (statement.type === 'callStatement') this.compileCall(statement.call);
    else if (statement.type === 'if') this.compileIf(statement);
    else if (statement.type === 'while') this.compileWhile(statement);
    else if (statement.type === 'loopControl') {
      if (!this.loops.length) throw parseError(statement.line, `'${statement.isBreak ? 'break' : 'continue'}' can only be used inside a loop.`);
      const loop = this.loops.at(-1); this.emit(`JMP ${statement.isBreak ? loop.breakLabel : loop.continueLabel}`);
    }
  }
  defineClass(statement) {
    const key = statement.name.toLowerCase();
    if (this.classes.has(key)) throw parseError(statement.line, `class '${statement.name}' has already been declared.`);
    const fields = new Map(); const methods = new Map(); let constructor = null;
    statement.members.forEach((member) => {
      const memberKey = member.name.toLowerCase();
      if (member.type === 'field') {
        const valueType = this.normalizeType(member.valueType, member.line, false);
        if (fields.has(memberKey) || methods.has(memberKey)) throw parseError(member.line, `member '${member.name}' is declared more than once.`);
        fields.set(memberKey, { ...member, valueType });
      } else {
        member.parameters = member.parameters.map((parameter) => ({ ...parameter, valueType: this.normalizeType(parameter.valueType, parameter.line, false) }));
        const parameterNames = new Set();
        member.parameters.forEach((parameter) => {
          const parameterKey = parameter.name.toLowerCase();
          if (parameterNames.has(parameterKey)) throw parseError(parameter.line, `parameter '${parameter.name}' is declared more than once.`);
          parameterNames.add(parameterKey);
        });
        member.returnType = this.normalizeType(member.returnType, member.line, true);
        if (member.returnType !== 'void') throw parseError(member.line, 'MiniScript methods currently return void; mutate typed fields or call output instead.');
        if (member.constructor) {
          if (constructor) throw parseError(member.line, 'a class can only declare one constructor.');
          constructor = member;
        } else {
          if (fields.has(memberKey) || methods.has(memberKey)) throw parseError(member.line, `member '${member.name}' is declared more than once.`);
          methods.set(memberKey, member);
        }
      }
    });
    this.classes.set(key, { name: statement.name, fields, methods, constructor, line: statement.line });
  }
  compileDeclaration(declaration) {
    const key = declaration.name.toLowerCase();
    if (this.contexts.length) throw parseError(declaration.line, 'methods cannot declare local variables; use typed fields or parameters.');
    if (this.variables.has(key) || this.constants.has(key) || this.objects.has(key)) throw parseError(declaration.line, `'${declaration.name}' has already been declared.`);
    const valueType = this.normalizeType(declaration.valueType, declaration.line, false, true);
    const classDefinition = this.classes.get(valueType.toLowerCase());
    if (classDefinition) { this.compileObjectDeclaration(declaration, key, classDefinition); return; }
    this.requireType(declaration.value, valueType, declaration.line, `initializer for '${declaration.name}'`);
    if (declaration.kind === 'const') {
      const value = this.constant(declaration.value);
      if (!Number.isInteger(value) || value < 0 || value > WORD_MASK) throw parseError(declaration.line, `value ${value} must fit in an unsigned 16-bit word.`);
      this.constants.set(key, { value, valueType }); return;
    }
    const register = this.allocateRegister(declaration.line);
    this.variables.set(key, { register, valueType });
    this.compileAssignment({ type: 'name', value: declaration.name, line: declaration.line }, '=', declaration.value, declaration.line);
  }
  compileObjectDeclaration(declaration, key, classDefinition) {
    if (declaration.kind === 'const') throw parseError(declaration.line, 'objects must be declared with let.');
    if (declaration.value.type !== 'new' || declaration.value.className.toLowerCase() !== classDefinition.name.toLowerCase()) {
      throw parseError(declaration.line, `objects of type ${classDefinition.name} must be initialized with new ${classDefinition.name}(...).`);
    }
    const object = { name: declaration.name, classDefinition, fields: new Map() };
    this.objects.set(key, object);
    classDefinition.fields.forEach((field, fieldKey) => {
      const bindingKey = `${key}.${fieldKey}`;
      this.variables.set(bindingKey, { register: this.allocateRegister(field.line), valueType: field.valueType });
      object.fields.set(fieldKey, bindingKey);
      const initializer = field.value ?? (field.valueType === 'bool'
        ? { type: 'name', value: 'false', line: field.line }
        : { type: 'number', value: 0, line: field.line });
      this.requireType(initializer, field.valueType, field.line, `initializer for field '${field.name}'`);
      this.compileAssignment({ type: 'bound', key: bindingKey, line: field.line }, '=', initializer, field.line);
    });
    if (classDefinition.constructor) this.inlineMethod(object, classDefinition.constructor, declaration.value.arguments, declaration.line);
    else if (declaration.value.arguments.length) throw parseError(declaration.line, `${classDefinition.name} does not declare a constructor.`);
  }
  compileAssignment(target, operator, value, line) {
    target = this.resolve(target); value = this.resolve(value);
    if (target.type === 'memory') {
      if (operator !== '=') throw parseError(line, "memory supports direct '=' assignment only.");
      this.requireType(value, 'u16', line, 'memory assignment');
      const address = this.address(target.address); const source = this.register(value);
      this.emit(`STR ${source}, ${address}`);
      return;
    }
    if (target.type !== 'name' && target.type !== 'bound') throw parseError(line, 'the assignment target must be a variable, field, or memory address.');
    const targetType = this.typeOf(target);
    this.requireType(value, targetType, line, 'assignment');
    if (targetType !== 'u16' && operator !== '=') throw parseError(line, `operator '${operator}' requires u16 operands.`);
    const destination = this.register(target); const immediate = this.tryConstant(value);
    if (operator === '=' && immediate.known) { this.emitConstant(destination, immediate.value, value.line); return; }
    if (operator === '=' && value.type === 'memory') {
      this.emit(`LDR ${destination}, ${this.address(value.address)}`); return;
    }
    if (operator === '=' && value.type === 'name') {
      this.emit(`MOV ${destination}, ${this.register(value)}`); return;
    }
    let operation; let right;
    if (operator === '=') {
      if (value.type !== 'binary' || !['+', '-', '*', '%', '&', '|', '^'].includes(value.operator)) {
        throw parseError(line, 'runtime assignments must be a supported binary expression such as total = total + step.');
      }
      if (this.register(value.left) !== destination) throw parseError(line, 'the left side of the expression must match the assigned variable.');
      operation = value.operator; right = value.right;
    } else { operation = operator[0]; right = value; }
    this.emitOperation(destination, operation, right, line);
  }
  compileUpdate(update) {
    const target = this.resolve(update.target); this.requireType(target, 'u16', update.line, `operator '${update.operator}'`);
    const destination = this.register(target);
    this.emit(`${update.operator === '++' ? 'INC' : 'DEC'} ${destination}`);
  }
  emitOperation(destination, operator, right, line) {
    const immediate = this.tryConstant(right);
    if (immediate.known && ['+', '-'].includes(operator) && immediate.value <= 511) {
      this.emit(`${operator === '+' ? 'ADDI' : 'SUBI'} ${destination}, ${immediate.value}`); return;
    }
    let source;
    if (immediate.known) {
      source = this.scratch(destination, line); this.emitConstant(source, immediate.value, right.line);
    } else source = this.register(right);
    const instruction = ({ '+': 'ADD', '-': 'SUB', '*': 'MUL', '%': 'MOD', '&': 'AND', '|': 'OR', '^': 'XOR' })[operator];
    if (!instruction) throw parseError(line, `operator '${operator}' is not supported.`);
    this.emit(`${instruction} ${destination}, ${source}`);
  }
  compileCall(call) {
    if (call.callee.type === 'member') {
      const object = this.getObject(call.callee.object, call.line);
      const method = object.classDefinition.methods.get(call.callee.property.toLowerCase());
      if (!method) throw parseError(call.line, `class '${object.classDefinition.name}' has no method '${call.callee.property}'.`);
      this.inlineMethod(object, method, call.arguments, call.line); return;
    }
    if (call.callee.type !== 'name') throw parseError(call.line, 'expected a function or method call.');
    const name = call.callee.value.toLowerCase();
    if (name === 'output' || name === 'print') {
      this.requireArguments(call, 1); this.requireType(call.arguments[0], 'u16', call.line, name); this.emit(`OUT ${this.register(call.arguments[0])}`);
    } else if (name === 'halt' || name === 'stop') { this.requireArguments(call, 0); this.emit('HLT'); }
    else if (name === 'push') { this.requireArguments(call, 1); this.requireType(call.arguments[0], 'u16', call.line, name); this.emit(`PUSH ${this.register(call.arguments[0])}`); }
    else if (name === 'pop') { this.requireArguments(call, 1); this.requireType(call.arguments[0], 'u16', call.line, name); this.emit(`POP ${this.register(call.arguments[0])}`); }
    else if (name === 'nop') { this.requireArguments(call, 0); this.emit('NOP'); }
    else throw parseError(call.line, `unknown function '${call.callee.value}'. Available functions: output, halt, push, pop, and nop.`);
  }
  inlineMethod(object, method, args, line) {
    if (this.inlineDepth >= 8) throw parseError(line, 'method call nesting cannot exceed eight levels.');
    if (args.length !== method.parameters.length) throw parseError(line, `${method.name} expects ${method.parameters.length} argument${method.parameters.length === 1 ? '' : 's'}.`);
    const aliases = new Map();
    method.parameters.forEach((parameter, index) => {
      this.requireType(args[index], parameter.valueType, line, `argument '${parameter.name}'`);
      aliases.set(parameter.name.toLowerCase(), this.resolve(args[index]));
    });
    this.contexts.push({ object, aliases }); this.inlineDepth += 1;
    try { this.compileStatement(method.body); } finally { this.inlineDepth -= 1; this.contexts.pop(); }
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
    this.requireType(condition, 'bool', condition.line, 'condition');
    condition = this.resolve(condition);
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
      test = condition.left; truth = condition.operator === '==' || condition.operator === '===';
      const left = this.register(test); const rightConstant = this.tryConstant(condition.right);
      if (rightConstant.known && rightConstant.value === 0) this.emit(`ADDI ${left}, 0`);
      else {
        const right = rightConstant.known ? this.scratch(left, condition.line) : this.register(condition.right);
        if (rightConstant.known) this.emitConstant(right, rightConstant.value, condition.line);
        this.emit(`CMP ${left}, ${right}`);
      }
      this.emit(`${truth ? 'JZ' : 'JNZ'} ${whenTrue}`); this.emit(`JMP ${whenFalse}`); return;
    }
    if (test.type === 'name' && ['carry', 'zero', 'negative'].includes(test.value.toLowerCase())) {
      const jump = ({ carry: 'JC', zero: 'JZ', negative: 'JN' })[test.value.toLowerCase()];
      this.emit(`${jump} ${truth ? whenTrue : whenFalse}`); this.emit(`JMP ${truth ? whenFalse : whenTrue}`); return;
    }
    const register = this.register(test);
    this.emit(`ADDI ${register}, 0`); this.emit(`JNZ ${whenTrue}`); this.emit(`JMP ${whenFalse}`);
  }
  register(expression) {
    expression = this.resolve(expression);
    const key = expression.type === 'bound' ? expression.key : expression.type === 'name' ? expression.value.toLowerCase() : null;
    if (!key || !this.variables.has(key)) throw parseError(expression.line, 'expected a declared runtime u16 or bool value.');
    return this.variables.get(key).register;
  }
  address(expression) { const value = this.constant(expression); this.requireNibble(value, expression.line, 'memory address'); return value; }
  constant(expression) { const result = this.tryConstant(expression); if (result.known) return result.value; throw parseError(expression.line, 'expected a compile-time constant.'); }
  tryConstant(expression) {
    expression = this.resolve(expression);
    if (expression.type === 'number') return { known: true, value: expression.value };
    if (expression.type === 'name') {
      const key = expression.value.toLowerCase();
      if (key === 'true') return { known: true, value: 1 }; if (key === 'false') return { known: true, value: 0 };
      if (this.constants.has(key)) return { known: true, value: this.constants.get(key).value };
    }
    if (expression.type === 'unary' && expression.operator === '!') {
      const value = this.tryConstant(expression.value); if (value.known) return { known: true, value: value.value === 0 ? 1 : 0 };
    }
    if (expression.type === 'binary') {
      const left = this.tryConstant(expression.left); const right = this.tryConstant(expression.right);
      if (left.known && right.known) {
        const operations = {
          '+': () => left.value + right.value, '-': () => left.value - right.value, '&': () => left.value & right.value,
          '*': () => left.value * right.value, '%': () => left.value % right.value,
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
  scratch(excluded, line) {
    const used = new Set([...this.variables.values()].map((variable) => variable.register));
    const register = registers.find((candidate) => candidate !== excluded && !used.has(candidate));
    if (!register) throw parseError(line, 'this operation needs one free register for a constant. Declare fewer runtime variables or place a value in memory.');
    return register;
  }
  emitConstant(register, value, line) {
    if (!Number.isInteger(value) || value < 0 || value > WORD_MASK) throw parseError(line, `value ${value} must fit in an unsigned 16-bit word.`);
    this.emit(`LDI ${register}, ${value & 0x1ff}`);
    if (value > 0x1ff) this.emit(`LUI ${register}, ${(value >>> 8) & 0xff}`);
  }
  requireNibble(value, line, role) { if (value < 0 || value >= MEMORY_SIZE) throw parseError(line, `${role} ${value} must be between 0 and ${MEMORY_SIZE - 1}.`); }
  requireArguments(call, count) {
    const name = call.callee.type === 'name' ? call.callee.value : 'method';
    if (call.arguments.length !== count) throw parseError(call.line, `${name} expects ${count} argument${count === 1 ? '' : 's'}.`);
  }
  allocateRegister(line) {
    if (this.nextRegister >= registers.length) throw parseError(line, 'MiniScript can keep four runtime values or object fields in registers A through D. Use const or memory for additional values.');
    return registers[this.nextRegister++];
  }
  normalizeType(type, line, allowVoid = false, allowClass = false) {
    const key = String(type).toLowerCase();
    if (key === 'u16' || key === 'bool' || (allowVoid && key === 'void')) return key;
    if (allowClass && this.classes.has(key)) return this.classes.get(key).name;
    throw parseError(line, `unknown type '${type}'. Use u16, bool${allowVoid ? ', void' : ''}${allowClass ? ', or a declared class' : ''}.`);
  }
  typeOf(expression) {
    expression = this.resolve(expression);
    if (expression.type === 'number' || expression.type === 'memory') return 'u16';
    if (expression.type === 'new') {
      const definition = this.classes.get(expression.className.toLowerCase());
      if (!definition) throw parseError(expression.line, `unknown class '${expression.className}'.`);
      return definition.name;
    }
    if (expression.type === 'bound') return this.variables.get(expression.key)?.valueType ?? null;
    if (expression.type === 'name') {
      const key = expression.value.toLowerCase();
      if (key === 'true' || key === 'false' || ['carry', 'zero', 'negative'].includes(key)) return 'bool';
      if (this.variables.has(key)) return this.variables.get(key).valueType;
      if (this.constants.has(key)) return this.constants.get(key).valueType;
      if (this.objects.has(key)) return this.objects.get(key).classDefinition.name;
      throw parseError(expression.line, `unknown name '${expression.value}'.`);
    }
    if (expression.type === 'unary') {
      this.requireType(expression.value, 'bool', expression.line, "operator '!'"); return 'bool';
    }
    if (expression.type === 'binary') {
      if (['+', '-', '*', '%', '&', '|', '^'].includes(expression.operator)) {
        this.requireType(expression.left, 'u16', expression.line, `operator '${expression.operator}'`);
        this.requireType(expression.right, 'u16', expression.line, `operator '${expression.operator}'`); return 'u16';
      }
      if (['&&', '||'].includes(expression.operator)) {
        this.requireType(expression.left, 'bool', expression.line, `operator '${expression.operator}'`);
        this.requireType(expression.right, 'bool', expression.line, `operator '${expression.operator}'`); return 'bool';
      }
      if (['==', '===', '!=', '!=='].includes(expression.operator)) {
        const left = this.typeOf(expression.left); const right = this.typeOf(expression.right);
        if (left !== right) throw parseError(expression.line, `cannot compare ${left} with ${right}.`);
        if (left !== 'u16' && left !== 'bool') throw parseError(expression.line, `objects of type ${left} cannot be compared.`);
        return 'bool';
      }
    }
    throw parseError(expression.line, 'expression does not produce a typed value.');
  }
  requireType(expression, expected, line, role) {
    const actual = this.typeOf(expression);
    if (actual !== expected) throw parseError(line, `${role} requires ${expected}, but received ${actual}.`);
  }
  resolve(expression, depth = 0) {
    if (!expression || depth > 12) return expression;
    const context = this.contexts.at(-1);
    if (expression.type === 'name' && context?.aliases.has(expression.value.toLowerCase())) return this.resolve(context.aliases.get(expression.value.toLowerCase()), depth + 1);
    if (expression.type === 'member') {
      const object = this.getObject(expression.object, expression.line);
      const key = object.fields.get(expression.property.toLowerCase());
      if (!key) throw parseError(expression.line, `class '${object.classDefinition.name}' has no field '${expression.property}'.`);
      return { type: 'bound', key, line: expression.line };
    }
    if (expression.type === 'binary') return { ...expression, left: this.resolve(expression.left, depth + 1), right: this.resolve(expression.right, depth + 1) };
    if (expression.type === 'unary') return { ...expression, value: this.resolve(expression.value, depth + 1) };
    if (expression.type === 'memory') return { ...expression, address: this.resolve(expression.address, depth + 1) };
    return expression;
  }
  getObject(expression, line) {
    if (expression.type !== 'name') throw parseError(line, 'method and field access require a named object.');
    const key = expression.value.toLowerCase();
    if (key === 'this') {
      const object = this.contexts.at(-1)?.object;
      if (!object) throw parseError(line, "'this' can only be used inside a method or constructor.");
      return object;
    }
    const object = this.objects.get(key);
    if (!object) throw parseError(line, `unknown object '${expression.value}'.`);
    return object;
  }
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
  const words = normalized === 'binary' ? parseBinary(source) : assemble(assemblySource);
  const machineCode = words.map((value, address) => `${bits(value)}  # ${address.toString(16).toUpperCase().padStart(2, '0')}: ${decodeInstruction(value).mnemonic}`).join('\n');
  const disassembly = words.map((value, address) => `${address.toString(16).toUpperCase().padStart(2, '0')}: ${decodeInstruction(value).mnemonic}`).join('\n');
  return { words, assemblySource: assemblySource ?? disassembly, machineCode };
}

function datapathFor(phase, signals) {
  if (phase === 'FETCH') return {
    transfers: [
      { from: 'PC', to: 'MAR', bus: 'address' },
      { from: 'RAM', to: 'IR', bus: 'data' },
    ],
    activeComponents: ['PC', 'MAR', 'RAM', 'IR'],
  };
  if (phase === 'DECODE') return {
    transfers: [{ from: 'IR', to: 'CONTROL', bus: 'control' }],
    activeComponents: ['IR', 'CONTROL'],
  };

  const transfers = [];
  const add = (from, to, bus = 'data') => {
    if (from && to && !transfers.some((item) => item.from === from && item.to === to && item.bus === bus)) transfers.push({ from, to, bus });
  };
  const outputs = signals.filter((signal) => signal.endsWith(' OUT')).map((signal) => signal.slice(0, -4));
  const inputs = signals.filter((signal) => signal.endsWith(' IN')).map((signal) => signal.slice(0, -3));
  const aluSignal = signals.find((signal) => signal.startsWith('ALU'));
  const registerOutputs = outputs.filter((name) => registers.includes(name));
  const registerInputs = inputs.filter((name) => registers.includes(name));

  if (inputs.includes('MAR')) add(outputs.find((name) => ['PC', 'SP', 'ADDRESS', 'OPERAND'].includes(name)) ?? 'ADDRESS', 'MAR', 'address');
  if (signals.includes('RAM OUT')) {
    const targets = inputs.filter((name) => name !== 'MAR' && name !== 'FLAGS');
    targets.forEach((target) => add('RAM', target));
  }
  if (signals.includes('RAM IN')) add(registerOutputs[0] ?? (outputs.includes('PC') ? 'PC' : 'CONTROL'), 'RAM');
  if (inputs.includes('OUTPUT')) add(registerOutputs[0] ?? 'CONTROL', 'OUT');

  if (aluSignal) {
    const sources = [...registerOutputs, ...outputs.filter((name) => ['IMMEDIATE', 'OPERAND'].includes(name))];
    (sources.length ? sources : registerInputs).forEach((source) => add(source, 'ALU'));
    registerInputs.forEach((target) => add('ALU', target));
    if (inputs.includes('FLAGS')) add('ALU', 'FLAGS', 'control');
  } else {
    const source = signals.includes('RAM OUT') ? 'RAM' : registerOutputs[0] ?? outputs.find((name) => ['IMMEDIATE', 'ADDRESS'].includes(name));
    registerInputs.forEach((target) => add(source, target));
    if (inputs.includes('FLAGS') && source) add(source, 'FLAGS', 'control');
  }

  if (inputs.includes('PC')) add(outputs.includes('ADDRESS') ? 'ADDRESS' : signals.includes('RAM OUT') ? 'RAM' : 'CONTROL', 'PC', 'control');
  if (signals.some((signal) => signal.endsWith(' TEST'))) add('FLAGS', 'CONTROL', 'control');

  const activeComponents = new Set(['HALT', 'NOP', 'RESET'].some((signal) => signals.includes(signal)) ? ['CONTROL'] : []);
  transfers.forEach(({ from, to }) => { activeComponents.add(from); activeComponents.add(to); });
  signals.forEach((signal) => {
    const component = signal.split(' ')[0];
    if ([...registers, 'PC', 'SP', 'IR', 'MAR', 'RAM', 'ALU', 'FLAGS', 'OUTPUT', 'CONTROL'].includes(component)) activeComponents.add(component === 'OUTPUT' ? 'OUT' : component);
  });
  return { transfers, activeComponents: [...activeComponents] };
}

export class CpuSimulator {
  constructor(compilation) {
    this.programSize = compilation.words.length;
    this.initialMemory = [...compilation.words, ...Array(MEMORY_SIZE - compilation.words.length).fill(0)];
    this.reset(false);
  }
  reset(isReset = true) {
    this.memory = [...this.initialMemory]; this.registers = [0, 0, 0, 0]; this.programCounter = 0; this.stackPointer = MEMORY_SIZE - 1;
    this.instructionRegister = 0; this.memoryAddressRegister = 0; this.outputRegister = 0;
    this.zeroFlag = false; this.carryFlag = false; this.negativeFlag = false; this.overflowFlag = false;
    this.cycle = 0; this.phase = 'Fetch'; this.halted = false;
    this.currentInstructionAddress = 0; this.instruction = null;
    const signals = isReset ? ['RESET'] : [];
    this.lastEvent = { cycle: 0, phase: 'Ready', title: isReset ? 'CPU reset' : 'Program loaded', detail: isReset ? 'Registers and memory were restored to their loaded values.' : 'Press Clock to begin the fetch cycle.', signals, ...datapathFor('READY', signals) };
    return this.snapshot();
  }
  snapshot() {
    return { registers: [...this.registers], registerA: this.registers[0], registerB: this.registers[1], registerC: this.registers[2], registerD: this.registers[3],
      programCounter: this.programCounter, stackPointer: this.stackPointer, instructionRegister: this.instructionRegister,
      memoryAddressRegister: this.memoryAddressRegister, outputRegister: this.outputRegister, zeroFlag: this.zeroFlag, carryFlag: this.carryFlag, negativeFlag: this.negativeFlag, overflowFlag: this.overflowFlag,
      cycle: this.cycle, phase: this.phase, halted: this.halted, currentInstructionAddress: this.currentInstructionAddress,
      programSize: this.programSize, instruction: this.instruction ? { ...this.instruction } : null, memory: [...this.memory], lastEvent: { ...this.lastEvent, signals: [...this.lastEvent.signals], transfers: this.lastEvent.transfers.map((transfer) => ({ ...transfer })), activeComponents: [...this.lastEvent.activeComponents] } };
  }
  step() {
    if (this.halted) return this.snapshot();
    this.cycle += 1;
    if (this.phase === 'Fetch') this.fetch(); else if (this.phase === 'Decode') this.decode(); else this.execute();
    return this.snapshot();
  }
  fetch() {
    this.currentInstructionAddress = this.programCounter; this.memoryAddressRegister = this.programCounter;
    this.instructionRegister = this.memory[this.memoryAddressRegister]; this.programCounter = (this.programCounter + 1) % MEMORY_SIZE;
    this.instruction = null; this.phase = 'Decode';
    const signals = ['PC OUT', 'MAR IN', 'RAM OUT', 'IR IN', 'PC INC'];
    this.lastEvent = { cycle: this.cycle, phase: 'FETCH', title: 'Instruction fetched', detail: `MAR ← ${hex(this.memoryAddressRegister)}, IR ← RAM[${hex(this.memoryAddressRegister)}] (${bits(this.instructionRegister)}), PC ← ${hex(this.programCounter)}`, signals, ...datapathFor('FETCH', signals) };
  }
  decode() {
    this.instruction = decodeInstruction(this.instructionRegister); this.phase = 'Execute';
    const signals = ['IR OUT', 'CONTROL DECODE'];
    this.lastEvent = { cycle: this.cycle, phase: 'DECODE', title: `Decoded ${this.instruction.mnemonic}`, detail: `Control unit reads the 5-bit opcode and register/address fields. ${this.instruction.description}`, signals, ...datapathFor('DECODE', signals) };
  }
  execute() {
    const instruction = this.instruction ?? decodeInstruction(this.instructionRegister);
    const destination = instruction.destination; const source = instruction.source;
    let detail = ''; let signals = [];
    const name = (index) => registers[index];
    const setFlags = (value, carry = false, overflow = false) => {
      const word = value & WORD_MASK;
      this.zeroFlag = word === 0; this.negativeFlag = Boolean(word & 0x8000); this.carryFlag = carry; this.overflowFlag = overflow;
      return word;
    };
    const binary = (operation, calculate) => {
      const left = this.registers[destination]; const right = this.registers[source]; const result = calculate(left, right);
      this.registers[destination] = setFlags(result.value, result.carry, result.overflow);
      detail = `${name(destination)} ← ${left} ${operation} ${right} = ${this.registers[destination]}.`;
      signals = [`${name(destination)} OUT`, `${name(source)} OUT`, `ALU ${operation}`, `${name(destination)} IN`, 'FLAGS IN'];
    };
    const branch = (condition, flagName) => {
      if (condition) this.programCounter = instruction.address;
      detail = condition ? `${flagName} condition is true, so PC ← ${hex(this.programCounter)}.` : `${flagName} condition is false, so execution continues.`;
      signals = [`${flagName.toUpperCase()} TEST`, condition ? 'PC IN' : 'NO BRANCH'];
    };
    const push = (value) => {
      this.memoryAddressRegister = this.stackPointer; this.memory[this.stackPointer] = value & WORD_MASK;
      this.stackPointer = (this.stackPointer - 1 + MEMORY_SIZE) % MEMORY_SIZE;
    };
    const pop = () => {
      this.stackPointer = (this.stackPointer + 1) % MEMORY_SIZE; this.memoryAddressRegister = this.stackPointer;
      return this.memory[this.stackPointer];
    };
    switch (instruction.opcode) {
      case 0x0: detail = 'No state changed.'; signals = ['NOP']; break;
      case 0x1: this.registers[destination] = setFlags(instruction.immediate); detail = `${name(destination)} ← ${instruction.immediate}.`; signals = ['IMMEDIATE OUT', `${name(destination)} IN`, 'FLAGS IN']; break;
      case 0x2: this.memoryAddressRegister = instruction.address; this.registers[destination] = setFlags(this.memory[instruction.address]); detail = `${name(destination)} ← RAM[${hex(instruction.address)}] (${this.registers[destination]}).`; signals = ['ADDRESS OUT', 'MAR IN', 'RAM OUT', `${name(destination)} IN`, 'FLAGS IN']; break;
      case 0x3: this.memoryAddressRegister = instruction.address; this.memory[instruction.address] = this.registers[destination]; detail = `RAM[${hex(instruction.address)}] ← ${name(destination)} (${this.registers[destination]}).`; signals = ['ADDRESS OUT', 'MAR IN', `${name(destination)} OUT`, 'RAM IN']; break;
      case 0x4: this.registers[destination] = setFlags(this.registers[source]); detail = `${name(destination)} ← ${name(source)} (${this.registers[destination]}).`; signals = [`${name(source)} OUT`, `${name(destination)} IN`, 'FLAGS IN']; break;
      case 0x5: binary('+', (a, b) => { const value = a + b; return { value, carry: value > WORD_MASK, overflow: Boolean((~(a ^ b) & (a ^ value)) & 0x8000) }; }); break;
      case 0x6: binary('−', (a, b) => { const value = a - b; return { value, carry: a >= b, overflow: Boolean(((a ^ b) & (a ^ value)) & 0x8000) }; }); break;
      case 0x7: binary('×', (a, b) => { const value = a * b; return { value, carry: value > WORD_MASK }; }); break;
      case 0x8: binary('AND', (a, b) => ({ value: a & b })); break;
      case 0x9: binary('OR', (a, b) => ({ value: a | b })); break;
      case 0xa: binary('XOR', (a, b) => ({ value: a ^ b })); break;
      case 0xb: this.registers[destination] = setFlags(~this.registers[destination]); detail = `${name(destination)} ← NOT ${name(destination)} = ${this.registers[destination]}.`; signals = [`${name(destination)} OUT`, 'ALU NOT', `${name(destination)} IN`, 'FLAGS IN']; break;
      case 0xc: { const value = this.registers[destination]; this.registers[destination] = setFlags(value << 1, Boolean(value & 0x8000)); detail = `${name(destination)} shifted left to ${this.registers[destination]}.`; signals = [`${name(destination)} OUT`, 'ALU SHL', `${name(destination)} IN`, 'FLAGS IN']; break; }
      case 0xd: { const value = this.registers[destination]; this.registers[destination] = setFlags(value >>> 1, Boolean(value & 1)); detail = `${name(destination)} shifted right to ${this.registers[destination]}.`; signals = [`${name(destination)} OUT`, 'ALU SHR', `${name(destination)} IN`, 'FLAGS IN']; break; }
      case 0xe: { const value = this.registers[destination] + 1; this.registers[destination] = setFlags(value, value > WORD_MASK); detail = `${name(destination)} incremented to ${this.registers[destination]}.`; signals = ['ALU INC', `${name(destination)} IN`, 'FLAGS IN']; break; }
      case 0xf: { const before = this.registers[destination]; this.registers[destination] = setFlags(before - 1, before > 0); detail = `${name(destination)} decremented to ${this.registers[destination]}.`; signals = ['ALU DEC', `${name(destination)} IN`, 'FLAGS IN']; break; }
      case 0x10: { const a = this.registers[destination]; const b = this.registers[source]; setFlags(a - b, a >= b, Boolean(((a ^ b) & (a ^ (a - b))) & 0x8000)); detail = `Compared ${name(destination)} (${a}) with ${name(source)} (${b}).`; signals = [`${name(destination)} OUT`, `${name(source)} OUT`, 'ALU CMP', 'FLAGS IN']; break; }
      case 0x11: this.programCounter = instruction.address; detail = `PC ← ${hex(instruction.address)}.`; signals = ['ADDRESS OUT', 'PC IN']; break;
      case 0x12: branch(this.zeroFlag, 'zero'); break;
      case 0x13: branch(!this.zeroFlag, 'not zero'); break;
      case 0x14: branch(this.carryFlag, 'carry'); break;
      case 0x15: branch(this.negativeFlag, 'negative'); break;
      case 0x16: this.outputRegister = this.registers[destination]; detail = `OUT ← ${name(destination)} (${this.outputRegister}).`; signals = [`${name(destination)} OUT`, 'OUTPUT IN']; break;
      case 0x17: push(this.registers[destination]); detail = `Pushed ${name(destination)}; SP ← ${hex(this.stackPointer)}.`; signals = [`${name(destination)} OUT`, 'SP OUT', 'MAR IN', 'RAM IN', 'SP DEC']; break;
      case 0x18: this.registers[destination] = setFlags(pop()); detail = `Popped ${this.registers[destination]} into ${name(destination)}; SP ← ${hex(this.stackPointer)}.`; signals = ['SP INC', 'SP OUT', 'MAR IN', 'RAM OUT', `${name(destination)} IN`, 'FLAGS IN']; break;
      case 0x19: push(this.programCounter); this.programCounter = instruction.address; detail = `Pushed return address and called ${hex(instruction.address)}.`; signals = ['PC OUT', 'RAM IN', 'SP DEC', 'ADDRESS OUT', 'PC IN']; break;
      case 0x1a: this.programCounter = pop() % MEMORY_SIZE; detail = `Returned to ${hex(this.programCounter)}.`; signals = ['SP INC', 'RAM OUT', 'PC IN']; break;
      case 0x1b: this.halted = true; this.phase = 'Halted'; detail = 'The clock is disabled. Reset or load a program to run again.'; signals = ['HALT']; break;
      case 0x1c: binary('MOD', (a, b) => ({ value: b === 0 ? 0 : a % b, carry: b === 0 })); break;
      case 0x1d: this.registers[destination] = setFlags(((instruction.immediate & 0xff) << 8) | (this.registers[destination] & 0xff)); detail = `${name(destination)} upper byte ← ${instruction.immediate & 0xff}.`; signals = ['IMMEDIATE OUT', `${name(destination)} IN`, 'FLAGS IN']; break;
      case 0x1e: { const before = this.registers[destination]; const value = before + instruction.immediate; this.registers[destination] = setFlags(value, value > WORD_MASK, Boolean((~(before ^ instruction.immediate) & (before ^ value)) & 0x8000)); detail = `${name(destination)} += ${instruction.immediate}; result ${this.registers[destination]}.`; signals = ['IMMEDIATE OUT', 'ALU ADD', `${name(destination)} IN`, 'FLAGS IN']; break; }
      case 0x1f: { const before = this.registers[destination]; const value = before - instruction.immediate; this.registers[destination] = setFlags(value, before >= instruction.immediate, Boolean(((before ^ instruction.immediate) & (before ^ value)) & 0x8000)); detail = `${name(destination)} -= ${instruction.immediate}; result ${this.registers[destination]}.`; signals = ['IMMEDIATE OUT', 'ALU SUB', `${name(destination)} IN`, 'FLAGS IN']; break; }
      default: break;
    }
    if (!this.halted) this.phase = 'Fetch';
    this.lastEvent = { cycle: this.cycle, phase: 'EXECUTE', title: `Executed ${instruction.mnemonic}`, detail, signals, ...datapathFor('EXECUTE', signals) };
  }

  restore(snapshot) {
    this.memory = [...snapshot.memory]; this.registers = [...snapshot.registers];
    this.programCounter = snapshot.programCounter; this.stackPointer = snapshot.stackPointer;
    this.instructionRegister = snapshot.instructionRegister; this.memoryAddressRegister = snapshot.memoryAddressRegister; this.outputRegister = snapshot.outputRegister;
    this.zeroFlag = snapshot.zeroFlag; this.carryFlag = snapshot.carryFlag; this.negativeFlag = snapshot.negativeFlag; this.overflowFlag = snapshot.overflowFlag;
    this.cycle = snapshot.cycle; this.phase = snapshot.phase; this.halted = snapshot.halted; this.currentInstructionAddress = snapshot.currentInstructionAddress;
    this.instruction = snapshot.instruction ? { ...snapshot.instruction } : null;
    this.lastEvent = { ...snapshot.lastEvent, signals: [...snapshot.lastEvent.signals], transfers: snapshot.lastEvent.transfers.map((transfer) => ({ ...transfer })), activeComponents: [...snapshot.lastEvent.activeComponents] };
    return this.snapshot();
  }
}

const makeSample = (id, name, description, assemblySource, simpleSource) => ({
  id, name, description, assemblySource, simpleSource,
  source: assemble(assemblySource).map((value, address) => `${bits(value)}  # ${address.toString(16).toUpperCase().padStart(2, '0')}: ${decodeInstruction(value).mnemonic}`).join('\n'),
});

export const samplePrograms = [
  makeSample('fibonacci', 'Fibonacci sequence', 'Outputs the first eight Fibonacci numbers using four general-purpose registers and a loop.', 'LDI A, 0\nLDI B, 1\nLDI C, 8\nloop:\nOUT A\nMOV D, A\nADD D, B\nMOV A, B\nMOV B, D\nDEC C\nJNZ loop\nHLT', 'let current: u16 = 0;\nlet following: u16 = 1;\nlet count: u16 = 8;\nlet next: u16 = 0;\n\nwhile (count !== 0) {\n  output(current);\n  next = current;\n  next += following;\n  current = following;\n  following = next;\n  count--;\n}\n\nhalt();'),
  makeSample('factorial', '16-bit factorial', 'Calculates 8! = 40320 with MUL, demonstrating a result far beyond an 8-bit CPU.', 'LDI A, 1\nLDI B, 8\nloop:\nMUL A, B\nDEC B\nJNZ loop\nOUT A\nHLT', 'let result: u16 = 1;\nlet factor: u16 = 8;\n\nwhile (factor !== 0) {\n  result *= factor;\n  factor--;\n}\n\noutput(result);\nhalt();'),
  makeSample('subroutine', 'Stack and subroutine', 'Calls a reusable sum subroutine while preserving a register on the hardware stack.', 'LDI A, 120\nLDI B, 75\nLDI C, 7\nCALL sum\nOUT A\nHLT\nsum:\nPUSH C\nMOV C, B\nADD A, C\nPOP C\nRET', 'let total: u16 = 120;\nlet addend: u16 = 75;\ntotal += addend;\noutput(total);\nhalt();'),
  makeSample('bitfield', 'Bitfield transform', 'Builds 0xABCD with LUI, then uses masks, shifts, and XOR to transform it.', 'LDI A, 205\nLUI A, 171\nLDI B, 255\nAND A, B\nSHL A\nLDI C, 90\nXOR A, C\nOUT A\nHLT', 'let value: u16 = 205;\nlet mask: u16 = 255;\nlet key: u16 = 90;\nvalue &= mask;\nvalue += value;\nvalue ^= key;\noutput(value);\nhalt();'),
  makeSample('memory', 'Memory and modulo', 'Stores a 16-bit product in RAM, reloads it, and computes its remainder modulo 97.', 'LDI A, 300\nLDI B, 200\nMUL A, B\nSTR A, 48\nLDI A, 0\nLDR A, 48\nLDI C, 97\nMOD A, C\nOUT A\nHLT', 'const slot: u16 = 48;\nlet value: u16 = 300;\nlet multiplier: u16 = 200;\nlet divisor: u16 = 97;\nvalue *= multiplier;\nmemory[slot] = value;\nvalue = memory[slot];\nvalue %= divisor;\noutput(value);\nhalt();'),
  makeSample('counter-class', 'Typed counter class', 'Constructs a Counter object, then inlines a typed method while looping over an object field.', 'LDI A, 2\nLDI B, 4\nloop:\nADDI A, 3\nOUT A\nDEC B\nJNZ loop\nHLT', 'class Counter {\n  value: u16;\n\n  constructor(start: u16) {\n    this.value = start;\n  }\n\n  method add(amount: u16): void {\n    this.value += amount;\n  }\n\n  method emit(): void {\n    output(this.value);\n  }\n}\n\nlet counter: Counter = new Counter(2);\nlet steps: u16 = 4;\nwhile (steps !== 0) {\n  counter.add(3);\n  counter.emit();\n  steps--;\n}\nhalt();'),
  makeSample('cipher-class', 'Encapsulated bit mixer', 'Uses a two-field object and typed methods to apply repeated XOR/add rounds to a 16-bit word.', 'LDI A, 52\nLUI A, 18\nLDI B, 255\nXOR A, B\nADDI A, 17\nXOR A, B\nADDI A, 17\nOUT A\nHLT', 'class BitMixer {\n  value: u16;\n  key: u16;\n\n  constructor(seed: u16, secret: u16) {\n    this.value = seed;\n    this.key = secret;\n  }\n\n  method round(): void {\n    this.value ^= this.key;\n    this.value += 17;\n  }\n\n  method emit(): void {\n    output(this.value);\n  }\n}\n\nlet mixer: BitMixer = new BitMixer(0x1234, 0x00FF);\nmixer.round();\nmixer.round();\nmixer.emit();\nhalt();'),
];

const sessions = new Map();
export function createLocalSimulation(source, language) {
  const compilation = compileSource(source, language);
  return { simulator: new CpuSimulator(compilation), assemblySource: compilation.assemblySource, machineCode: compilation.machineCode };
}
export function createSimulation(source, language) {
  const compilation = compileSource(source, language); const simulator = new CpuSimulator(compilation); const sessionId = globalThis.crypto.randomUUID();
  sessions.set(sessionId, simulator);
  return { sessionId, state: simulator.snapshot(), assemblySource: compilation.assemblySource, machineCode: compilation.machineCode };
}
export const getSimulation = (sessionId) => sessions.get(sessionId);
