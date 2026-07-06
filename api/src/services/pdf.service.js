import fs from 'fs';
import pdfParse from 'pdf-parse';

export const extractPdfText = async (filePath) => {
  const buffer = await fs.promises.readFile(filePath);
  const parsed = await pdfParse(buffer);
  return parsed?.text || '';
};
