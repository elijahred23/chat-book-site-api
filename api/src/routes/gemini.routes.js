import { Router } from 'express';
import { getModel, listModels, promptGemini, promptGpt, setModel } from '../controllers/gemini.controller.js';

const router = Router();

router.get('/geminiModelList', listModels);
router.get('/geminiModel', getModel);
router.post('/geminiModel', setModel);
router.get('/gemini/prompt', promptGemini);
router.post('/gpt/prompt', promptGpt);

export default router;
