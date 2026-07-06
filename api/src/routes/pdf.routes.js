import { Router } from 'express';
import { pdfToText } from '../controllers/pdf.controller.js';
import { handlePdfUpload } from '../middleware/upload.js';

const router = Router();

router.post('/pdf-to-text', handlePdfUpload, pdfToText);

export default router;
