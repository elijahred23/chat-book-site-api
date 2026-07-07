import { deflateRawSync } from 'zlib';
import { createHash } from 'crypto';
import { fetch } from 'undici';
import { env } from '../config/env.js';
import { getCorrespondentBankingDiagram } from '../data/correspondentBankingDiagrams.js';

const renderCache = new Map();
const renderCacheTtlMs = 10 * 60 * 1000;
const renderCacheMaxEntries = 100;
const allowedFormats = new Set(['svg', 'png']);

const encode6bit = (value) => {
  if (value < 10) return String.fromCharCode(48 + value);
  value -= 10;
  if (value < 26) return String.fromCharCode(65 + value);
  value -= 26;
  if (value < 26) return String.fromCharCode(97 + value);
  value -= 26;
  if (value === 0) return '-';
  if (value === 1) return '_';
  return '?';
};

const append3bytes = (b1, b2, b3) => {
  const c1 = b1 >> 2;
  const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
  const c3 = ((b2 & 0xf) << 2) | (b3 >> 6);
  const c4 = b3 & 0x3f;
  return encode6bit(c1 & 0x3f) + encode6bit(c2 & 0x3f) + encode6bit(c3 & 0x3f) + encode6bit(c4 & 0x3f);
};

function encodePlantUml(source) {
  const deflated = deflateRawSync(Buffer.from(source, 'utf8'));
  let encoded = '';

  for (let index = 0; index < deflated.length; index += 3) {
    const b1 = deflated[index];
    const b2 = index + 1 < deflated.length ? deflated[index + 1] : 0;
    const b3 = index + 2 < deflated.length ? deflated[index + 2] : 0;
    encoded += append3bytes(b1, b2, b3);
  }

  return encoded;
}

export function buildPlantUmlUrl(source, format = 'svg') {
  const serverUrl = env.plantUmlServerUrl.replace(/\/+$/, '');
  return `${serverUrl}/${format}/${encodePlantUml(source)}`;
}

function normalizeRenderFormat(format = 'svg') {
  const normalized = String(format || 'svg').trim().toLowerCase();
  if (!allowedFormats.has(normalized)) {
    const error = new Error('PlantUML render format must be svg or png.');
    error.status = 400;
    throw error;
  }
  return normalized;
}

function getCacheKey(source, format) {
  return `${format}:${createHash('sha256').update(source).digest('hex')}`;
}

function rememberRender(cacheKey, value) {
  if (renderCache.size >= renderCacheMaxEntries) {
    const oldestKey = renderCache.keys().next().value;
    if (oldestKey) renderCache.delete(oldestKey);
  }
  renderCache.set(cacheKey, { ...value, expiresAt: Date.now() + renderCacheTtlMs });
}

export function getDiagramSource(diagramId) {
  const diagram = getCorrespondentBankingDiagram(diagramId);
  if (!diagram) {
    const error = new Error('Unknown PlantUML diagram.');
    error.status = 404;
    throw error;
  }

  return diagram.source;
}

export async function renderDiagramSvg(diagramId) {
  const source = getDiagramSource(diagramId);
  const rendered = await renderPlantUmlSource(source, 'svg');
  return rendered.body;
}

export async function renderPlantUmlSource(source, format = 'svg') {
  if (typeof source !== 'string' || !source.trim()) {
    const error = new Error('PlantUML source is required.');
    error.status = 400;
    throw error;
  }
  if (source.length > 100000) {
    const error = new Error('PlantUML source is too large.');
    error.status = 413;
    throw error;
  }

  const normalizedFormat = normalizeRenderFormat(format);
  const cacheKey = getCacheKey(source, normalizedFormat);
  const cached = renderCache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return { body: cached.body, contentType: cached.contentType };
  }
  if (cached) renderCache.delete(cacheKey);

  const accept = normalizedFormat === 'svg' ? 'image/svg+xml' : 'image/png';
  const response = await fetch(buildPlantUmlUrl(source, normalizedFormat), {
    headers: { Accept: accept },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const error = new Error(`PlantUML renderer returned ${response.status}.`);
    error.status = 502;
    throw error;
  }

  const body = normalizedFormat === 'svg' ? await response.text() : Buffer.from(await response.arrayBuffer());
  const contentType = response.headers.get('content-type') || accept;
  const rendered = { body, contentType };
  rememberRender(cacheKey, rendered);
  return rendered;
}
