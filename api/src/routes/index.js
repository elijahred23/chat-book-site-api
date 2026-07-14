import { Router } from 'express';
import geminiRoutes from './gemini.routes.js';
import healthRoutes from './health.routes.js';
import logsRoutes from './logs.routes.js';
import pdfRoutes from './pdf.routes.js';
import plantUmlRoutes from './plantuml.routes.js';
import simulatorRoutes from './simulator.routes.js';
import transcriptRoutes from './transcript.routes.js';
import ttsRoutes from './tts.routes.js';
import webRoutes from './web.routes.js';
import youtubeRoutes from './youtube.routes.js';
import vocabularyImageRoutes from './vocabularyImage.routes.js';

const router = Router();

router.use(healthRoutes);
router.use(logsRoutes);
router.use(geminiRoutes);
router.use(youtubeRoutes);
router.use(transcriptRoutes);
router.use(webRoutes);
router.use(pdfRoutes);
router.use(plantUmlRoutes);
router.use(ttsRoutes);
router.use(simulatorRoutes);
router.use(vocabularyImageRoutes);

export default router;
