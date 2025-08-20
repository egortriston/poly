const express = require('express');
const router = express.Router();
const messagesController = require('../controllers/messagesController');

router.get('/', messagesController.getAllMessages);
router.get('/:id', messagesController.getMessageById);
// router.post('/', messagesController.createMessage);
// router.put('/:id', messagesController.updateMessage);
// router.delete('/:id', messagesController.deleteMessage);

module.exports = router; 