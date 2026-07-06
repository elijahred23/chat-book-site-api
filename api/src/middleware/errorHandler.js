import { logErrorToFile } from '../utils/errorLog.js';

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err);
    return;
  }

  const status = err.statusCode || err.status || 500;
  if (status >= 500) {
    console.error(err);
    logErrorToFile(err);
  }

  res.status(status).json({
    error: err.message || 'Internal server error',
  });
}
