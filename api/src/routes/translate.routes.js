import { Router } from 'express';
import { createTranslation } from '../controllers/translate.controller.js';

const router = Router();

router.post('/translate', createTranslation);

export default router;
