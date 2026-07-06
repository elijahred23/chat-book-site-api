import { Router } from 'express';
import { getComments, getVideo, news, playlistItems, searchPlaylists, searchVideos, trending } from '../controllers/youtube.controller.js';

const router = Router();

router.get('/youtube/comments', getComments);
router.get('/youtube/search', searchVideos);
router.get('/youtube/trending', trending);
router.get('/youtube/news', news);
router.get('/youtube/video/:id', getVideo);
router.get('/youtube/search/playlists', searchPlaylists);
router.get('/youtube/playlist/:playlistId', playlistItems);

export default router;
