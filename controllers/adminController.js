const adminLogin = (req, res) => {
    const { password } = req.body;
    
    // Проверяем пароль
    if (password === 'adminegorik') {
        // Устанавливаем сессию админа
        req.session.isAdmin = true;
        res.json({ success: true, message: 'Успешный вход' });
    } else {
        res.status(401).json({ success: false, message: 'Неверный пароль' });
    }
};

const adminLogout = (req, res) => {
    // Удаляем сессию админа
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Ошибка при выходе' });
        }
        res.json({ success: true, message: 'Успешный выход' });
    });
};

const checkAdminAuth = (req, res) => {
    if (req.session && req.session.isAdmin) {
        res.json({ success: true, isAuthenticated: true });
    } else {
        res.json({ success: true, isAuthenticated: false });
    }
};

module.exports = {
    adminLogin,
    adminLogout,
    checkAdminAuth
};
