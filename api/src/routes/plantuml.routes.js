import { Router } from 'express';
import {
  generatePlantUml,
  getDiagramPlantUmlSource,
  getDiagramSvg,
  renderPlantUml,
} from '../controllers/plantuml.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/plantuml/diagrams/:diagramId.svg', asyncHandler(getDiagramSvg));
router.get('/plantuml/diagrams/:diagramId/source', getDiagramPlantUmlSource);
router.post('/plantuml/render', asyncHandler(renderPlantUml));
router.post('/plantuml/generate', asyncHandler(generatePlantUml));

export default router;
