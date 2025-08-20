const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const pool = require('./models/db');
const userRoutes = require('./routes/userRoutes');
const newsRoutes = require('./routes/newsRoutes');
const materialsRoutes = require('./routes/materialsRoutes');
const programsRoutes = require('./routes/programsRoutes');
const eventsRoutes = require('./routes/eventsRoutes');
const messagesRoutes = require('./routes/messagesRoutes');
const likesRoutes = require('./routes/likesRoutes');
const filesRoutes = require('./routes/filesRoutes');
const mainRoutes = require('./routes/mainRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Раздача статики из папки public
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/users', userRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/programs', programsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/main', mainRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 