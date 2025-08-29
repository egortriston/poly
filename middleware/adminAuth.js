const adminAuth = (req, res, next) => {
    // Проверяем, есть ли сессия админа
    if (req.session && req.session.isAdmin) {
        return next();
    }
    
    // Проверяем, является ли это API запросом
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ 
            success: false, 
            message: 'Unauthorized - Admin authentication required' 
        });
    }
    
    // Если нет сессии, перенаправляем на страницу входа (для HTML запросов)
    res.redirect('/admin-login');
};

module.exports = adminAuth;
