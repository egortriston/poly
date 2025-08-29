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
    const { search, categories, location, startDate, endDate, sort, userId } = req.body;

    let query = `
      SELECT e.*,
             COALESCE(l.likes_count, 0) as likes_count,
             CASE WHEN ul.id_like IS NOT NULL THEN true ELSE false END as is_liked
      FROM events_table e
      LEFT JOIN (
        SELECT id_event, COUNT(*) as likes_count
        FROM user_likes
        GROUP BY id_event
      ) l ON e.id_event = l.id_event
      LEFT JOIN user_likes ul ON e.id_event = ul.id_event AND ul.id_user = $1
      WHERE e.event_status = 'Одобрено'
    `;
    const params = [userId || null];
    let paramCount = 2;

    if (search) {
      // Поиск по названию мероприятия
      query += ` AND e.event_name ILIKE $${paramCount++}`;
      params.push(`%${search}%`);
    }

    if (categories && categories.length > 0) {
      // Фильтрация по типу или категории (у вас есть event_type и event_category)
      // Давайте пока фильтровать по event_category, можно будет доработать при необходимости
      query += ` AND e.event_category = ANY($${paramCount++})`;
      params.push(categories);
    }

    if (location) {
      // Фильтрация по месту проведения
      query += ` AND e.event_place ILIKE $${paramCount++}`;
      params.push(`%${location}%`);
    }

    if (startDate) {
      // Фильтрация по дате начала (start)
      query += ` AND e.start >= $${paramCount++}`;
      params.push(startDate);
    }

    if (endDate) {
      // Фильтрация по дате окончания (end)
      query += ` AND e.end <= $${paramCount++}`;
      params.push(endDate);
    }

    // Добавляем сортировку
    const sortBy = sort || 'newest';
    switch (sortBy) {
      case 'newest':
        query += ' ORDER BY e.id_event DESC, e.date_create DESC';
        break;
      case 'oldest':
        query += ' ORDER BY e.id_event ASC, e.date_create ASC';
        break;
      case 'popular':
        query += ' ORDER BY l.likes_count DESC NULLS LAST, e.id_event DESC';
        break;
      default:
        query += ' ORDER BY e.id_event DESC, e.date_create DESC';
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
      const id_user = req.user?.id_user || req.body.userId || 1;
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
      
      // 4. Отправляем сообщение в админ-чат для модерации
      await client.query(
        `INSERT INTO messages_table 
         (id_user, message_text, message_time, type_message, id_event)
         VALUES ($1, $2, NOW(), true, $3)`,
        [
          id_user,
          `Новое событие "${eventName}" отправлено на модерацию. Тип: ${eventType || 'Не указан'}. Дата: ${startDate || 'Не указана'}. Место: ${eventLocation || 'Не указано'}`,
          id_event
        ]
      );
      console.log('Сообщение отправлено в админ-чат для модерации');
      
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

// Получить файлы события
exports.getEventFiles = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM events_file WHERE id_event = $1', [id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Скачать файл события
exports.downloadEventFile = async (req, res) => {
  try {
    const { id, fileId } = req.params;
    const result = await pool.query('SELECT file FROM events_file WHERE id_event_file = $1 AND id_event = $2', [fileId, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).send('File not found');
    }
    
    const client = await pool.connect();
    try {
      const lom = new LargeObjectManager({ pg: client });
      const stream = await lom.openAndReadableStreamAsync(result.rows[0].file);
      
      res.set('Content-Type', 'application/octet-stream');
      res.set('Content-Disposition', `attachment; filename="event_file_${fileId}"`);
      
      stream.pipe(res);
    } finally {
      client.release();
    }
  } catch (err) {
    res.status(500).send('Server error');
  }
}; 