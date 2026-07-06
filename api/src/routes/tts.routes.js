import { Router } from 'express';
import { createSpeech, createSpeechBatch } from '../controllers/tts.controller.js';

const router = Router();

router.post('/tts', createSpeech);
router.post('/tts/batch', createSpeechBatch);

export default router;
