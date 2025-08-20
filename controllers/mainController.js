const pool = require('../models/db');

exports.getMainPageData = async (req, res) => {
  try {
    const [materials, programs, news, events] = await Promise.all([
      pool.query('SELECT * FROM materials_table WHERE material_status = $1 ORDER BY date_create DESC LIMIT 3', ['Одобрено']),
      pool.query('SELECT * FROM programs_table WHERE program_status = $1 ORDER BY date_create DESC LIMIT 3', ['Одобрено']),
      pool.query('SELECT * FROM news_table WHERE news_status = $1 ORDER BY date_create DESC LIMIT 3', ['Одобрено']),
      pool.query('SELECT * FROM events_table WHERE event_status = $1 ORDER BY date_create DESC LIMIT 3', ['Одобрено']),
    ]);

    res.json({
      materials: materials.rows,
      programs: programs.rows,
      news: news.rows,
      events: events.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};