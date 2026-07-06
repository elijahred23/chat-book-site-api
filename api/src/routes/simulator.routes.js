import { Router } from 'express';
import { create, generate, programs, reset, step } from '../controllers/simulator.controller.js';

const router = Router();

router.get('/programs', programs);
router.post('/simulator/generate', generate);
router.post('/simulator', create);
router.post('/simulator/:id/step', step);
router.post('/simulator/:id/reset', reset);

export default router;
