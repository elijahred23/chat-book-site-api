import path from 'path';
import { fileURLToPath } from 'url';

export const apiSrcDir = path.dirname(fileURLToPath(import.meta.url));
export const apiRoot = path.resolve(apiSrcDir, '../..');
export const projectRoot = path.resolve(apiRoot, '..');
export const frontendRoot = path.join(projectRoot, 'frontend');
export const distDir = path.join(frontendRoot, 'dist');
export const uploadsDir = path.join(projectRoot, 'var/uploads');
export const secretsDir = path.join(projectRoot, 'var/secrets');
export const logsDir = path.join(apiRoot, 'logs');
export const errorLogPath = path.join(apiRoot, 'error.log');
export const pythonYoutubeServicePath = path.join(apiRoot, 'youtube_service.py');
