import { compileSource, createSimulation, getSimulation, ProgramParseError, samplePrograms } from '../../../shared/cpuSimulator.js';
import { generateCpuProgram } from './gemini.service.js';

export { ProgramParseError, samplePrograms };

export const generateProgram = async (prompt) => {
  let generationPrompt = prompt.trim();
  let lastParseError = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const program = await generateCpuProgram(generationPrompt);
    try {
      compileSource(program.code, program.language);
      return program;
    } catch (error) {
      if (!(error instanceof ProgramParseError)) throw error;
      lastParseError = error;
      generationPrompt = `${prompt.trim()}\n\nYour previous program failed the Clockwork compiler with this error: ${error.message}\nReturn a corrected complete program.`;
    }
  }
  throw lastParseError;
};

export const loadSimulation = (source, language = 'binary') => createSimulation(source, language);

export const stepSimulation = (id) => {
  const simulator = getSimulation(id);
  if (!simulator) return null;
  return { sessionId: id, state: simulator.step(), assemblySource: null, machineCode: null };
};

export const resetSimulation = (id) => {
  const simulator = getSimulation(id);
  if (!simulator) return null;
  return { sessionId: id, state: simulator.reset(), assemblySource: null, machineCode: null };
};
