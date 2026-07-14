import fs from 'fs/promises';
import path from 'path';
import { projectRoot } from '../config/paths.js';

const OPENVERSE_IMAGES_URL = 'https://api.openverse.org/v1/images/';
const CACHE_PATH = path.join(projectRoot, 'var/cache/vocabulary-images.json');
const REQUEST_TIMEOUT_MS = 8000;
const MAX_RESPONSE_BYTES = 1024 * 1024;
const cache = new Map();
const pending = new Map();
let cacheLoaded = false;
let writeQueue = Promise.resolve();

const normalizeQuery = (query) => query.trim().toLocaleLowerCase('en-US').replace(/\s+/g, ' ');

const loadCache = async () => {
  if (cacheLoaded) return;
  cacheLoaded = true;
  try {
    const saved = JSON.parse(await fs.readFile(CACHE_PATH, 'utf8'));
    Object.entries(saved).forEach(([key, value]) => cache.set(key, value));
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn('Unable to read vocabulary image cache:', error.message);
  }
};

const persistCache = () => {
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
    const temporaryPath = `${CACHE_PATH}.tmp`;
    await fs.writeFile(temporaryPath, JSON.stringify(Object.fromEntries(cache), null, 2));
    await fs.rename(temporaryPath, CACHE_PATH);
  }).catch((error) => console.warn('Unable to write vocabulary image cache:', error.message));
};

const readLimitedJson = async (response) => {
  const text = await response.text();
  if (Buffer.byteLength(text) > MAX_RESPONSE_BYTES) throw new Error('Openverse response was too large');
  return JSON.parse(text);
};

const searchOpenverse = async (query) => {
  const url = new URL(OPENVERSE_IMAGES_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('page_size', '10');
  url.searchParams.set('mature', 'false');

  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'ChatBookVocabulary/1.0' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Openverse request failed (${response.status})`);

  const data = await readLimitedJson(response);
  const result = data.results?.find((candidate) => candidate.thumbnail || candidate.url);
  if (!result) return null;

  return {
    imageUrl: result.thumbnail || result.url,
    fullImageUrl: result.url || result.thumbnail,
    title: result.title || query,
    creator: result.creator || '',
    creatorUrl: result.creator_url || '',
    sourceUrl: result.foreign_landing_url || result.detail_url || '',
    license: result.license || '',
    licenseUrl: result.license_url || '',
    provider: result.provider || result.source || 'Openverse',
  };
};

export const getVocabularyImage = async (rawQuery) => {
  const query = normalizeQuery(rawQuery);
  await loadCache();
  if (cache.has(query)) return { query, image: cache.get(query), cached: true };
  if (pending.has(query)) return pending.get(query);

  const request = searchOpenverse(query).then((image) => {
    cache.set(query, image);
    persistCache();
    return { query, image, cached: false };
  }).finally(() => pending.delete(query));
  pending.set(query, request);
  return request;
};
