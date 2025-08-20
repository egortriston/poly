const express = require('express');
const router = express.Router();
const filesController = require('../controllers/filesController');

router.get('/news', filesController.getAllNewsFiles);
router.get('/news/:id', filesController.getNewsFileById);
// router.get('/materials', filesController.getAllMaterialsFiles);
// router.get('/programs', filesController.getAllProgramsFiles);
// router.get('/events', filesController.getAllEventsFiles);

module.exports = router; 