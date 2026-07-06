import fs from 'fs';
import { errorLogPath } from '../config/paths.js';

export const logErrorToFile = (error) => {
  const err = error instanceof Error ? error : new Error(String(error));
  const errorLog = `${new Date().toISOString()} - ${err.message}\n${err.stack || ''}\n\n`;
  fs.appendFile(errorLogPath, errorLog, () => {});
};
