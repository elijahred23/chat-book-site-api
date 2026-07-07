import { getDiagramSource, renderDiagramSvg } from '../services/plantuml.service.js';

export async function getDiagramSvg(req, res) {
  const svg = await renderDiagramSvg(req.params.diagramId);
  res.type('image/svg+xml').send(svg);
}

export function getDiagramPlantUmlSource(req, res) {
  const source = getDiagramSource(req.params.diagramId);
  res.type('text/plain').send(source);
}
