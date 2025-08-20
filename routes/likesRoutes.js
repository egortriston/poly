const express = require('express');
const router = express.Router();
const likesController = require('../controllers/likesController');

// Маршруты для лайков материалов (должны идти первыми)
router.post('/materials/:materialId', likesController.toggleMaterialLike);
router.get('/materials/:materialId/status', likesController.checkMaterialLikeStatus);
router.get('/materials/:materialId/count', likesController.getMaterialLikesCount);

// Маршруты для лайков программ (должны идти первыми)
router.post('/programs/:programId', likesController.toggleProgramLike);
router.get('/programs/:programId/status', likesController.checkProgramLikeStatus);
router.get('/programs/:programId/count', likesController.getProgramLikesCount);

// Маршруты для лайков мероприятий (должны идти первыми)
router.post('/events/:eventId', likesController.toggleEventLike);
router.get('/events/:eventId/status', likesController.checkEventLikeStatus);
router.get('/events/:eventId/count', likesController.getEventLikesCount);

// Маршруты для лайков новостей (должны идти первыми)
router.post('/news/:newsId', likesController.toggleNewsLike);
router.get('/news/:newsId/status', likesController.checkNewsLikeStatus);
router.get('/news/:newsId/count', likesController.getNewsLikesCount);

// Общие маршруты (должны идти после специфичных)
router.get('/user/:userId', likesController.getUserLikes);
router.get('/:id', likesController.getLikeById);
router.get('/', likesController.getAllLikes);

module.exports = router; 