const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messagesController');
const adminAuth = require('../middleware/adminAuth');

// Обычные маршруты для сообщений (без защиты)
router.get('/', messagesController.getAllMessages);
router.get('/:id', messagesController.getMessageById);
router.post('/', messagesController.createMessage);

// Защищенные маршруты для модерации (требуют аутентификации админа)
router.get('/moderation/pending', adminAuth, messagesController.getModerationMessages);
router.get('/moderation/stats', adminAuth, messagesController.getModerationStats);
router.post('/moderation/approve', adminAuth, messagesController.approveContent);
router.post('/moderation/reject', adminAuth, messagesController.rejectContent);
router.post('/moderation/mark-read', adminAuth, messagesController.markAsRead);

module.exports = router; 