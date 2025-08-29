const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminAuth = require('../middleware/adminAuth');

// Маршрут для входа в админ-панель
router.post('/login', adminController.adminLogin);

// Маршрут для выхода из админ-панели
router.post('/logout', adminController.adminLogout);

// Маршрут для проверки аутентификации
router.get('/check-auth', adminController.checkAdminAuth);

// Защищенный маршрут для админ-панели (требует аутентификации)
router.get('/chat', adminAuth, (req, res) => {
    res.sendFile('admin-chat.html', { root: './public' });
});

module.exports = router;
