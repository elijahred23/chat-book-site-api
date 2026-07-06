import { Router } from 'express';
import { supadataTranscript, youtubeTranscript } from '../controllers/transcript.controller.js';

const router = Router();

router.get('/youtube/transcript', youtubeTranscript);
router.get('/supadata/transcript', supadataTranscript);

export default router;
