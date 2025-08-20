const pool = require('../models/db');
const bcrypt = require('bcrypt');
const multer = require('multer');
const upload = multer();

exports.getAllUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_table');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM user_table WHERE id_user = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { user_name, user_mail, user_school, user_phone, user_post, user_description, password } = req.body;
    // Проверка, существует ли пользователь с таким email
    const userExists = await pool.query('SELECT * FROM user_table WHERE user_mail = $1', [user_mail]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }
    // Хешируем пароль
    const hash = await bcrypt.hash(password, 10);
    // Вставляем пользователя (user_password вместо user_post, без user_out)
    const result = await pool.query(
      'INSERT INTO user_table (user_name, user_mail, user_school, user_phone, user_password, user_description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [user_name, user_mail, user_school, user_phone, hash, user_description || '']
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { user_mail, password } = req.body;
    const user = await pool.query('SELECT * FROM user_table WHERE user_mail = $1', [user_mail]);
    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'Пользователь не найден' });
    }
    // Сравниваем с user_password
    const valid = await bcrypt.compare(password, user.rows[0].user_password);
    if (!valid) {
      return res.status(400).json({ error: 'Неверный пароль' });
    }
    // Можно добавить генерацию токена, но пока просто возвращаем пользователя
    res.json({ user: user.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_name, user_mail, user_school, user_post, user_phone, user_description } = req.body;
    const result = await pool.query(
      `UPDATE user_table SET
        user_name = $1,
        user_mail = $2,
        user_school = $3,
        user_post = $4,
        user_phone = $5,
        user_description = $6
      WHERE id_user = $7 RETURNING *`,
      [user_name, user_mail, user_school, user_post, user_phone, user_description, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.uploadPhoto = [
  upload.single('photo'),
  async (req, res) => {
    try {
      const { id } = req.params;
      if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен' });
      }
      const result = await pool.query(
        'UPDATE user_table SET user_photo = $1 WHERE id_user = $2 RETURNING *',
        [req.file.buffer, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Пользователь не найден' });
      }
      res.json({ user: result.rows[0] });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
];

exports.getPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT user_photo FROM user_table WHERE id_user = $1', [id]);
    if (result.rows.length === 0 || !result.rows[0].user_photo) {
      return res.status(404).send('Not found');
    }
    res.set('Content-Type', 'image/png');
    res.send(result.rows[0].user_photo);
  } catch (err) {
    res.status(500).send('Server error');
  }
}; 