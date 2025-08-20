const pool = require('../models/db');

exports.getAllMessages = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM messages_table');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM messages_table WHERE id_message = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Message not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 