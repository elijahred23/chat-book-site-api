import { Router } from 'express';
import { logViewer, logs } from '../controllers/logs.controller.js';

const router = Router();

router.get('/logs', logs);

export const logsPageRouter = Router();
logsPageRouter.get('/logs', logViewer);

export default router;
