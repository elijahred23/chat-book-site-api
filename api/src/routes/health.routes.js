import { Router } from 'express';
import { check } from '../controllers/health.controller.js';

const router = Router();

router.get('/check', check);

export default router;
