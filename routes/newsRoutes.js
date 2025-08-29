const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

router.get('/', newsController.getAllNews);
router.get('/:id', newsController.getNewsById);
router.post('/', newsController.createNews);
// router.put('/:id', newsController.updateNews);
// router.delete('/:id', newsController.deleteNews);
router.get('/user/:id', newsController.getUserNews);
// Получить изображение новости
router.get('/:id/image', newsController.getNewsImage);

// Получить файлы новости
router.get('/:id/files', newsController.getNewsFiles);

// Скачать файл новости
router.get('/:id/files/:fileId', newsController.downloadNewsFile);

module.exports = router; 