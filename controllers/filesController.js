const pool = require('../models/db');

exports.getAllNewsFiles = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM news_files');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNewsFileById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM news_files WHERE id_news_file = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'File not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 