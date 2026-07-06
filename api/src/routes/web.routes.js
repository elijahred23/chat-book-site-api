import { Router } from 'express';
import { pageUrls, webSearch } from '../controllers/web.controller.js';

const router = Router();

router.get('/websearch', webSearch);
router.get('/page-urls', pageUrls);

export default router;
