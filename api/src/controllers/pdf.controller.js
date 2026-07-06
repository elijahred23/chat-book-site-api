import fs from 'fs';
import { extractPdfText } from '../services/pdf.service.js';
import { logErrorToFile } from '../utils/errorLog.js';

export const pdfToText = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Missing file upload (field name: file).' });
    if (req.file.mimetype !== 'application/pdf') return res.status(400).json({ error: 'Only PDF files are supported.' });

    const text = await extractPdfText(req.file.path);
    fs.promises.unlink(req.file.path).catch(() => {});
    return res.json({ text });
  } catch (err) {
    if (req.file?.path) fs.promises.unlink(req.file.path).catch(() => {});
    console.error('PDF parse error', err);
    logErrorToFile(err);
    return res.status(500).json({ error: 'Failed to parse PDF.' });
  }
};
