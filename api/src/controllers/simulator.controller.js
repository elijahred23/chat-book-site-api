import { generateProgram, loadSimulation, ProgramParseError, resetSimulation, samplePrograms, stepSimulation } from '../services/simulator.service.js';

export const programs = (req, res) => {
  res.json(samplePrograms);
};

export const generate = async (req, res) => {
  const { prompt } = req.body || {};
  if (typeof prompt !== 'string' || !prompt.trim()) return res.status(400).json({ error: 'Describe the program you want Gemini to create.' });
  if (prompt.length > 2000) return res.status(400).json({ error: 'The program description must be 2,000 characters or fewer.' });

  try {
    const program = await generateProgram(prompt);
    return res.json(program);
  } catch (error) {
    if (error instanceof ProgramParseError) {
      console.error('Gemini generated invalid CPU code:', error.message);
      return res.status(502).json({ error: `Gemini generated code that did not compile: ${error.message}` });
    }
    console.error('CPU program generation error:', error?.message || String(error));
    return res.status(502).json({ error: 'Gemini could not generate a CPU program. Try a more specific description.' });
  }
};

export const create = (req, res) => {
  const { source, language = 'binary' } = req.body || {};
  if (typeof source !== 'string') return res.status(400).json({ error: 'Source must be a string.' });

  try {
    return res.json(loadSimulation(source, language));
  } catch (error) {
    if (error instanceof ProgramParseError) return res.status(400).json({ error: error.message });
    console.error('CPU simulator load error:', error);
    return res.status(500).json({ error: 'Could not load the CPU program.' });
  }
};

export const step = (req, res) => {
  const result = stepSimulation(req.params.id);
  if (!result) return res.status(404).json({ error: 'Simulation not found. Load the program again.' });
  return res.json(result);
};

export const reset = (req, res) => {
  const result = resetSimulation(req.params.id);
  if (!result) return res.status(404).json({ error: 'Simulation not found. Load the program again.' });
  return res.json(result);
};
