import { Router } from 'express';
import { vocabularyImage } from '../controllers/vocabularyImage.controller.js';

const router = Router();

router.get('/vocabulary-image', vocabularyImage);

export default router;
