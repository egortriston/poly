const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

router.get('/', newsController.getAllNews);
router.get('/:id', newsController.getNewsById);
router.post('/', newsController.createNews);
// router.put('/:id', newsController.updateNews);
// router.delete('/:id', newsController.deleteNews);
router.get('/user/:id', newsController.getUserNews);
router.get('/:id/image', newsController.getNewsImage);

module.exports = router; 