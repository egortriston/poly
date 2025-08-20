const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUserById);
router.post('/register', userController.register);
router.post('/login', userController.login);
router.put('/:id', userController.updateUser);
router.put('/:id/photo', userController.uploadPhoto);
router.get('/:id/photo', userController.getPhoto);
// router.post('/', userController.createUser);
// router.put('/:id', userController.updateUser);
// router.delete('/:id', userController.deleteUser);

module.exports = router; 