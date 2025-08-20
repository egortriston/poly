const express = require('express');
const router = express.Router();
const likesController = require('../controllers/likesController');

router.get('/', likesController.getAllLikes);
router.get('/:id', likesController.getLikeById);
// router.post('/', likesController.createLike);
// router.put('/:id', likesController.updateLike);
// router.delete('/:id', likesController.deleteLike);

module.exports = router; 