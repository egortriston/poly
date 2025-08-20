const pool = require('../models/db');
const multer = require('multer');
const upload = multer();
const LargeObjectManager = require('pg-large-object').LargeObjectManager;

exports.getAllNews = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM news_table');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM news_table WHERE id_news = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'News not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createNews = [
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'files[]', maxCount: 10 }
  ]),
  async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // 1. Сохраняем файлы в Large Object, получаем oids
      let fileOids = [];
      if (req.files['files[]']) {
        for (const file of req.files['files[]']) {
          const lom = new LargeObjectManager({ pg: client });
          const [oid, stream] = await lom.createAndWritableStreamAsync();
          stream.write(file.buffer);
          stream.end();
          await new Promise(resolve => stream.on('finish', resolve));
          fileOids.push(oid);
        }
      }
      // 2. Сохраняем новость
      const {
        title, category, publicationDate, content, author, source
      } = req.body;
      const id_user = req.user?.id_user || 1;
      const result = await client.query(
        `INSERT INTO news_table
        (id_user, name_news, news_category, news_date, news_text, news_author, news_link, news_image, news_status, date_create)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'на модерации',NOW())
        RETURNING id_news`,
        [
          id_user,
          title,
          category,
          publicationDate,
          content,
          author,
          source,
          req.files['image'] && req.files['image'][0] ? req.files['image'][0].buffer : null
        ]
      );
      const id_news = result.rows[0].id_news;
      // 3. Сохраняем oids в news_files
      for (const oid of fileOids) {
        await client.query(
          `INSERT INTO news_files (id_news, file) VALUES ($1, $2)`,
          [id_news, oid]
        );
      }
      await client.query('COMMIT');
      res.status(201).json({ success: true, id_news });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  }
];

exports.getUserNews = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM news_table WHERE id_user = $1 ORDER BY date_create DESC',
      [id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getNewsImage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT news_image FROM news_table WHERE id_news = $1', [id]);
    if (result.rows.length === 0 || !result.rows[0].news_image) {
      return res.status(404).send('Not found');
    }
    res.set('Content-Type', 'image/png');
    res.send(result.rows[0].news_image);
  } catch (err) {
    res.status(500).send('Server error');
  }
}; 