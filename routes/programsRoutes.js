const express = require('express');
const router = express.Router();
const programsController = require('../controllers/programsController');

router.get('/', programsController.getAllPrograms);
router.get('/:id', programsController.getProgramById);
// Получить изображение программы
router.get('/:id/image', programsController.getProgramImage);

// Получить файлы программы
router.get('/:id/files', programsController.getProgramFiles);

// Скачать файл программы
router.get('/:id/files/:fileId', programsController.downloadProgramFile);

router.post('/filter', programsController.filterPrograms);
router.post('/', programsController.createProgram);
router.get('/user/:id', programsController.getUserPrograms);
// router.put('/:id', programsController.updateProgram);
// router.delete('/:id', programsController.deleteProgram);

module.exports = router; 