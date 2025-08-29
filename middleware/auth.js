// Middleware для аутентификации пользователей
const pool = require('../models/db');

// Middleware для извлечения ID пользователя из заголовков или тела запроса
const extractUserId = (req, res, next) => {
    try {
        // Пытаемся получить ID пользователя из разных источников
        let userId = null;
        
        // 1. Из заголовка Authorization (если есть)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            // Здесь можно добавить проверку JWT токена
            // Пока просто извлекаем ID из токена (если он там есть)
            try {
                const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
                userId = decoded.userId || decoded.id_user;
            } catch (e) {
                // Игнорируем ошибки парсинга токена
            }
        }
        
        // 2. Из тела запроса (для POST/PUT запросов)
        if (!userId && req.body) {
            userId = req.body.userId || req.body.id_user;
        }
        
        // 3. Из query параметров
        if (!userId && req.query) {
            userId = req.query.userId || req.query.id_user;
        }
        
        // 4. Из заголовка X-User-ID (для фронтенда)
        if (!userId && req.headers['x-user-id']) {
            userId = req.headers['x-user-id'];
        }
        
        // Устанавливаем ID пользователя в req.user
        if (userId) {
            req.user = { id_user: parseInt(userId) };
        } else {
            // Если ID не найден, устанавливаем null
            req.user = null;
        }
        
        next();
    } catch (error) {
        console.error('Ошибка в middleware extractUserId:', error);
        req.user = null;
        next();
    }
};

// Middleware для проверки аутентификации (опционально)
const requireAuth = (req, res, next) => {
    if (!req.user || !req.user.id_user) {
        return res.status(401).json({
            success: false,
            error: 'Требуется аутентификация',
            message: 'ID пользователя не найден'
        });
    }
    next();
};

// Middleware для получения информации о пользователе из базы данных
const getUserInfo = async (req, res, next) => {
    try {
        if (req.user && req.user.id_user) {
            const result = await pool.query(
                'SELECT id_user, user_name, user_mail, user_school, user_post FROM user_table WHERE id_user = $1',
                [req.user.id_user]
            );
            
            if (result.rows.length > 0) {
                req.user = { ...req.user, ...result.rows[0] };
            }
        }
        next();
    } catch (error) {
        console.error('Ошибка в middleware getUserInfo:', error);
        next();
    }
};

module.exports = {
    extractUserId,
    requireAuth,
    getUserInfo
};
