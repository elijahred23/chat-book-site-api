import fs from 'fs';
import multer from 'multer';
import { env } from '../config/env.js';
import { uploadsDir } from '../config/paths.js';

export const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      fs.mkdirSync(uploadsDir, { recursive: true });
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const safeName = file.originalname?.replace(/[^a-zA-Z0-9._-]/g, '_') || 'upload.pdf';
      cb(null, `${Date.now()}-${safeName}`);
    },
  }),
  limits: { fileSize: env.pdfUploadMaxMb * 1024 * 1024 },
});

export const handlePdfUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: `File too large. Max ${env.pdfUploadMaxMb}MB.` });
      }
      return res.status(400).json({ error: err.message || 'Upload failed.' });
    }
    if (err) return res.status(400).json({ error: err.message || 'Upload failed.' });
    return next();
  });
};
