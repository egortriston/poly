const pool = require('../models/db');
const multer = require('multer');
const upload = multer();
const LargeObjectManager = require('pg-large-object').LargeObjectManager;

// Универсальная функция для отправки ответов
const sendResponse = (res, status, data) => {
  res.status(status).json(data);
};

exports.getAllPrograms = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM programs_table');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProgramById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM programs_table WHERE id_program = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Program not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.filterPrograms = async (req, res) => {
  try {
    const { search, type, faculty, duration, level, sort, userId } = req.body;

    let query = `
      SELECT p.*,
             COALESCE(l.likes_count, 0) as likes_count,
             CASE WHEN ul.id_like IS NOT NULL THEN true ELSE false END as is_liked
      FROM programs_table p
      LEFT JOIN (
        SELECT id_program, COUNT(*) as likes_count
        FROM user_likes
        GROUP BY id_program
      ) l ON p.id_program = l.id_program
      LEFT JOIN user_likes ul ON p.id_program = ul.id_program AND ul.id_user = $1
      WHERE p.program_status = 'Одобрено'
    `;
    const params = [userId || null];
    let paramCount = 2;

    if (search) {
      // Поиск по названию программы
      query += ` AND p.program_name ILIKE $${paramCount++}`;
      params.push(`%${search}%`);
    }

    if (type && type.length > 0) {
      // Фильтрация по типу программы
      query += ` AND p.program_type = ANY($${paramCount++})`;
      params.push(type);
    }

    // В вашей таблице нет поля для факультета, но есть facultyFilter в HTML.
    // Если фильтрация по факультету должна быть реализована по другому полю,
    // например, через связь с таблицей пользователей по id_user или другому полю,
    // потребуется уточнение структуры базы данных.
    // Пока проигнорируем фильтр по факультету в запросе к БД, но оставим его во фронтенде.
    // if (faculty && faculty.length > 0) {
    //   query += ` AND some_faculty_field = ANY($${paramCount++})`;
    //   params.push(faculty);
    // }

    // В вашей таблице нет полей для длительности и уровня, но есть фильтры в HTML.
    // Если эти данные хранятся в других таблицах или закодированы в описании,
    // потребуется другая логика фильтрации.
    // Пока проигнорируем эти фильтры в запросе к БД.
    // if (duration && duration.length > 0) {
    //   query += ` AND some_duration_field = ANY($${paramCount++})`;
    //   params.push(duration);
    // }
    // if (level && level.length > 0) {
    //   query += ` AND some_level_field = ANY($${paramCount++})`;
    //   params.push(level);
    // }

    // Добавляем сортировку
    const sortBy = sort || 'newest';
    switch (sortBy) {
      case 'newest':
        query += ' ORDER BY p.id_program DESC, p.date_create DESC';
        break;
      case 'popular':
        query += ' ORDER BY l.likes_count DESC NULLS LAST, p.id_program DESC';
        break;
      // В вашей таблице нет явного поля длительности для сортировки.
      // Если нужна сортировка по этому параметру, потребуется либо добавить поля,
      // либо реализовать другую логику.
      // case 'duration':
      //   query += ' ORDER BY some_duration_field ASC';
      //   break;
      default:
        query += ' ORDER BY p.id_program DESC, p.date_create DESC';
    }

    const result = await pool.query(query, params);
    sendResponse(res, 200, { success: true, data: result.rows });
  } catch (err) {
    console.error('Error in filterPrograms:', err);
    sendResponse(res, 500, {
      success: false,
      error: 'Internal server error',
      message: err.message
    });
  }
};

exports.createProgram = [
  upload.fields([
    { name: 'programImage', maxCount: 1 },
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
      // 2. Сохраняем программу
      const {
        programName, programType, resourceLink, programDescription, additionalInfo
      } = req.body;
      const id_user = req.user?.id_user || 1;
      const result = await client.query(
        `INSERT INTO programs_table
        (id_user, program_name, program_type, program_link, program_image, program_description, program_info, program_status, date_create)
        VALUES ($1,$2,$3,$4,$5,$6,$7,'на модерации',NOW())
        RETURNING id_program`,
        [
          id_user,
          programName,
          programType,
          resourceLink,
          req.files['programImage'] && req.files['programImage'][0] ? req.files['programImage'][0].buffer : null,
          programDescription,
          additionalInfo
        ]
      );
      const id_program = result.rows[0].id_program;
      // 3. Сохраняем oids в programs_files
      for (const oid of fileOids) {
        await client.query(
          `INSERT INTO programs_files (id_program, file) VALUES ($1, $2)`,
          [id_program, oid]
        );
      }
      await client.query('COMMIT');
      res.status(201).json({ success: true, id_program });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  }
];

exports.getUserPrograms = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM programs_table WHERE id_user = $1 ORDER BY date_create DESC',
      [id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProgramImage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT program_image FROM programs_table WHERE id_program = $1', [id]);
    if (result.rows.length === 0 || !result.rows[0].program_image) {
      return res.status(404).send('Not found');
    }
    res.set('Content-Type', 'image/png');
    res.send(result.rows[0].program_image);
  } catch (err) {
    res.status(500).send('Server error');
  }
}; 