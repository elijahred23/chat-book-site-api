import { generatePlantUmlDiagram } from '../services/gemini.service.js';
import { getDiagramSource, renderDiagramSvg, renderPlantUmlSource } from '../services/plantuml.service.js';

export async function getDiagramSvg(req, res) {
  const svg = await renderDiagramSvg(req.params.diagramId);
  res.type('image/svg+xml').send(svg);
}

export function getDiagramPlantUmlSource(req, res) {
  const source = getDiagramSource(req.params.diagramId);
  res.type('text/plain').send(source);
}

export async function renderPlantUml(req, res) {
  const { source, format = 'svg' } = req.body || {};
  const rendered = await renderPlantUmlSource(source, format);
  res.type(rendered.contentType).send(rendered.body);
}

export async function generatePlantUml(req, res) {
  const { prompt } = req.body || {};
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).send({ error: 'Bad Request', message: 'Describe the diagram you want to generate.' });
  }

  const diagram = await generatePlantUmlDiagram(prompt.trim());
  return res.send({ diagram, message: 'success' });
}
