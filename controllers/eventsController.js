const pool = require('../models/db');
const multer = require('multer');
const upload = multer();
const LargeObjectManager = require('pg-large-object').LargeObjectManager;

// Универсальная функция для отправки ответов
const sendResponse = (res, status, data) => {
  res.status(status).json(data);
};

exports.getAllEvents = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM events_table');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM events_table WHERE id_event = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.filterEvents = async (req, res) => {
  try {
    const { search, categories, location, startDate, endDate, sort } = req.body;

    let query = `
      SELECT * FROM events_table 
      WHERE event_status = 'Одобрено'
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      // Поиск по названию мероприятия
      query += ` AND event_name ILIKE $${paramCount++}`;
      params.push(`%${search}%`);
    }

    if (categories && categories.length > 0) {
      // Фильтрация по типу или категории (у вас есть event_type и event_category)
      // Давайте пока фильтровать по event_type, можно будет доработать при необходимости
      query += ` AND event_category = ANY($${paramCount++})`;
      params.push(categories);
    }

    if (location) {
      // Фильтрация по месту проведения
      query += ` AND event_place ILIKE $${paramCount++}`;
      params.push(`%${location}%`);
    }


    if (startDate) {
      // Фильтрация по дате начала (start)
      query += ` AND start >= $${paramCount++}`;
      params.push(startDate);
    }

    if (endDate) {
      // Фильтрация по дате окончания (end)
      query += ` AND end <= $${paramCount++}`;
      params.push(endDate);
    }


    // Добавляем сортировку
    // Используем event_status и date_create для сортировки, как у материалов
    const sortBy = sort || 'newest';
    switch (sortBy) {
      case 'newest':
        query += ' ORDER BY id_event DESC, date_create DESC';
        break;
      case 'oldest':
        query += ' ORDER BY id_event ASC, date_create ASC';
        break;
      // Добавьте другие варианты сортировки, если они нужны для мероприятий
      // case 'popular':
      //   query += ' ORDER BY download_count DESC'; // Пример, если есть поле популярности
      //   break;
      default:
        query += ' ORDER BY id_event DESC, date_create DESC';
    }

    const result = await pool.query(query, params);
    sendResponse(res, 200, { success: true, data: result.rows });
  } catch (err) {
    console.error('Error in filterEvents:', err);
    sendResponse(res, 500, {
      success: false,
      error: 'Internal server error',
      message: err.message
    });
  }
};

exports.createEvent = [
  upload.fields([
    { name: 'eventImage', maxCount: 1 },
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
      // 2. Сохраняем мероприятие
      const {
        eventName, eventType, eventCategory, startDate, endDate, startTime, eventLocation,
        eventDescription, targetAudience, additionalInfo
      } = req.body;
      // id_user из авторизации или временно 1
      const id_user = req.user?.id_user || 1;
      const result = await client.query(
        `INSERT INTO events_table
        (id_user, event_name, event_type, event_category, start, "end", time_start, event_place, event_description, event_audience, event_info, event_image, event_status, date_create)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'на модерации',NOW())
        RETURNING id_event`,
        [
          id_user,
          eventName,
          eventType,
          eventCategory,
          startDate,
          endDate || null,
          startTime,
          eventLocation,
          eventDescription,
          targetAudience,
          additionalInfo,
          req.files['eventImage'] && req.files['eventImage'][0] ? req.files['eventImage'][0].buffer : null
        ]
      );
      const id_event = result.rows[0].id_event;
      // 3. Сохраняем oids в events_files
      for (const oid of fileOids) {
        await client.query(
          `INSERT INTO events_files (id_event, file) VALUES ($1, $2)`,
          [id_event, oid]
        );
      }
      await client.query('COMMIT');
      res.status(201).json({ success: true, id_event });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  }
];

exports.getUserEvents = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM events_table WHERE id_user = $1 ORDER BY date_create DESC',
      [id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getEventImage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT event_image FROM events_table WHERE id_event = $1', [id]);
    if (result.rows.length === 0 || !result.rows[0].event_image) {
      return res.status(404).send('Not found');
    }
    res.set('Content-Type', 'image/png');
    res.send(result.rows[0].event_image);
  } catch (err) {
    res.status(500).send('Server error');
  }
}; 