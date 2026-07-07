import { generateGeminiResponse, GeminiModel, listGeminiModels, normalizeGeminiModel } from '../services/gemini.service.js';
import { logErrorToFile } from '../utils/errorLog.js';

export const listModels = async (req, res) => {
  try {
    const models = await listGeminiModels({ forceRefresh: req.query.refresh === '1' });
    return res.send({ models });
  } catch (error) {
    console.error('Gemini model discovery error:', error?.message || String(error));
    logErrorToFile(error);
    return res.status(502).send({ error: 'Model discovery failed', message: error.message });
  }
};

export const getModel = (req, res) => {
  const currentModel = GeminiModel.currentModel;
  if (!currentModel) return res.status(400).send({ error: 'Bad Request', message: 'Model parameter is missing' });
  return res.send({ model: currentModel });
};

export const setModel = async (req, res) => {
  const model = normalizeGeminiModel(req.body?.model);
  if (!model) return res.status(400).send({ error: 'Bad Request', message: 'Model parameter is missing' });
  if (model.length > 200 || !/^[a-zA-Z0-9._:/-]+$/.test(model)) {
    return res.status(400).send({ error: 'Bad Request', message: 'Model identifier is invalid' });
  }

  try {
    const models = await listGeminiModels();
    if (!models.some((availableModel) => availableModel.id === model)) {
      return res.status(400).send({ error: 'Bad Request', message: 'Choose an available Gemini text-generation model' });
    }
    GeminiModel.currentModel = model;
    return res.send({ model, message: `Model set to ${model}` });
  } catch (error) {
    console.error('Gemini model update error:', error?.message || String(error));
    logErrorToFile(error);
    return res.status(502).send({ error: 'Model update failed', message: error.message });
  }
};

export const promptGemini = async (req, res) => {
  const prompt = req.query.prompt;
  if (!prompt) return res.status(400).send({ error: 'Bad Request', message: 'Prompt parameter is missing' });

  try {
    const geminiResponse = await generateGeminiResponse(prompt);
    if (!geminiResponse.success) throw new Error(geminiResponse.error || geminiResponse.text);
    return res.send({ geminiResponse, message: 'success' });
  } catch (error) {
    console.error(error);
    logErrorToFile(error);
    return res.status(500).send({ error: 'Server Error', message: error?.message ?? 'Failed to generate chatGPT response.' });
  }
};

export const promptGpt = async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).send({ error: 'Bad Request', message: 'Prompt parameter is missing' });

  try {
    const gptResponse = await generateGeminiResponse(prompt);
    if (!gptResponse.success) throw new Error(gptResponse.error || gptResponse.text);
    return res.send({ gptResponse: gptResponse.text, message: 'success', success: 1 });
  } catch (error) {
    console.error(error);
    logErrorToFile(error);
    return res.status(500).send({ error: 'Server Error', message: error.message });
  }
};
