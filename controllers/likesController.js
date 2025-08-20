const pool = require('../models/db');

exports.getAllLikes = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_likes');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLikeById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM user_likes WHERE id_like = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Like not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 