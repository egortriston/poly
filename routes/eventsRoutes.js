const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');

router.get('/', eventsController.getAllEvents);
router.get('/:id', eventsController.getEventById);
router.get('/:id/image', eventsController.getEventImage);
router.post('/filter', eventsController.filterEvents);
router.post('/', eventsController.createEvent);
router.get('/user/:id', eventsController.getUserEvents);
// router.put('/:id', eventsController.updateEvent);
// router.delete('/:id', eventsController.deleteEvent);

// Получить файлы события
router.get('/:id/files', eventsController.getEventFiles);

// Скачать файл события
router.get('/:id/files/:fileId', eventsController.downloadEventFile);

module.exports = router; 