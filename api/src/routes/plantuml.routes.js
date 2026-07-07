import { Router } from 'express';
import { getDiagramPlantUmlSource, getDiagramSvg } from '../controllers/plantuml.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/plantuml/diagrams/:diagramId.svg', asyncHandler(getDiagramSvg));
router.get('/plantuml/diagrams/:diagramId/source', getDiagramPlantUmlSource);

export default router;
