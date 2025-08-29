const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const pool = require('./models/db');
const { extractUserId } = require('./middleware/auth');
const userRoutes = require('./routes/userRoutes');
const newsRoutes = require('./routes/newsRoutes');
const materialsRoutes = require('./routes/materialsRoutes');
const programsRoutes = require('./routes/programsRoutes');
const eventsRoutes = require('./routes/eventsRoutes');
const messagesRoutes = require('./routes/messagesRoutes');
const likesRoutes = require('./routes/likesRoutes');
const filesRoutes = require('./routes/filesRoutes');
const mainRoutes = require('./routes/mainRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Настройка сессий
app.use(session({
    secret: 'spbstu-admin-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // установите true для HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 часа
    }
}));

// Middleware для извлечения ID пользователя
app.use(extractUserId);

// Раздача статики из папки public
app.use(express.static(path.join(__dirname, 'public')));

// Маршрут для страницы входа в админ-панель
app.get('/admin-login', (req, res) => {
    res.sendFile('admin-login.html', { root: './public' });
});

// Защищенный маршрут для админ-панели
app.get('/admin-chat.html', (req, res) => {
    if (req.session && req.session.isAdmin) {
        res.sendFile('admin-chat.html', { root: './public' });
    } else {
        res.redirect('/admin-login');
    }
});

app.use('/api/users', userRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/programs', programsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/main', mainRoutes);
app.use('/admin', adminRoutes);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0'; // Это критически важно для внешнего доступа

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});