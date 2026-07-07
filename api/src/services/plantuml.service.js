import { deflateRawSync } from 'zlib';
import { fetch } from 'undici';
import { env } from '../config/env.js';
import { getCorrespondentBankingDiagram } from '../data/correspondentBankingDiagrams.js';

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

function buildPlantUmlUrl(source, format = 'svg') {
  const serverUrl = env.plantUmlServerUrl.replace(/\/+$/, '');
  return `${serverUrl}/${format}/${encodePlantUml(source)}`;
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
  const response = await fetch(buildPlantUmlUrl(source, 'svg'), {
    headers: { Accept: 'image/svg+xml' },
  });

  if (!response.ok) {
    const error = new Error(`PlantUML renderer returned ${response.status}.`);
    error.status = 502;
    throw error;
  }

  return response.text();
}
