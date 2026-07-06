import express from 'express';
import path from 'path';
import './config/env.js';
import { API_PREFIX } from './constants/routes.js';
import { distDir } from './config/paths.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import routes from './routes/index.js';
import { logsPageRouter } from './routes/logs.routes.js';

const app = express();

app.use(requestLogger);
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
app.use(express.static(distDir));
app.use(express.json());

app.use(API_PREFIX, routes);
app.use(logsPageRouter);

app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

app.use(errorHandler);

export default app;
