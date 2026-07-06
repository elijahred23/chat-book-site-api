import fs from 'fs';
import path from 'path';
import { logsDir } from '../config/paths.js';

fs.mkdirSync(logsDir, { recursive: true });

const logFile = path.join(logsDir, 'api.log');
const recentLogs = [];

export const pushLog = (entry) => {
  recentLogs.push(entry);
  if (recentLogs.length > 500) recentLogs.shift();
  fs.appendFile(logFile, `${entry}\n`, () => {});
};

export const getRecentLogs = () => [...recentLogs].reverse();

export const requestLogger = (req, res, next) => {
  const entry = `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${req.ip}`;
  pushLog(entry);
  next();
};
