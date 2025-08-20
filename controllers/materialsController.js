const pool = require('../models/db');
const multer = require('multer');
const upload = multer();
const LargeObjectManager = require('pg-large-object').LargeObjectManager;

// Универсальная функция для отправки ответов
const sendResponse = (res, status, data) => {
  res.status(status).json(data);
};

exports.getAllMaterials = async (req, res) => {
  try {
    const sortBy = req.query.sort || 'newest';

    let query = `
      SELECT * FROM materials_table 
      WHERE material_status = 'Одобрено'
    `;

    switch (sortBy) {
      case 'newest':
        query += ' ORDER BY id_material DESC, date_create DESC';
        break;
      case 'oldest':
        query += ' ORDER BY id_material ASC, date_create ASC';
        break;
      case 'popular':
        query += ' ORDER BY download_count DESC';
        break;
      case 'rating':
        query += ' ORDER BY rating DESC';
        break;
      default:
        query += ' ORDER BY id_material DESC, date_create DESC';
    }

    const result = await pool.query(query);
    sendResponse(res, 200, { success: true, data: result.rows });
  } catch (err) {
    console.error('Error in getAllMaterials:', err);
    sendResponse(res, 500, {
      success: false,
      error: 'Internal server error',
      message: err.message
    });
  }
};

exports.getMaterialById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT * FROM materials_table 
       WHERE id_material = $1 AND material_status = 'Одобрено'`,
      [id]
    );

    if (result.rows.length === 0) {
      return sendResponse(res, 404, {
        success: false,
        error: 'Material not found or not approved'
      });
    }

    sendResponse(res, 200, { success: true, data: result.rows[0] });
  } catch (err) {
    console.error('Error in getMaterialById:', err);
    sendResponse(res, 500, {
      success: false,
      error: 'Internal server error',
      message: err.message
    });
  }
};

exports.filterMaterials = async (req, res) => {
  try {
    const { search, categories, faculties, startDate, endDate, author, sort } = req.body;

    let query = `
      SELECT * FROM materials_table 
      WHERE material_status = 'Одобрено'
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      query += ` AND material_name ILIKE $${paramCount++}`;
      params.push(`%${search}%`);
    }

    if (categories && categories.length > 0) {
      query += ` AND material_type = ANY($${paramCount++})`;
      params.push(categories);
    }

    if (faculties && faculties.length > 0) {
      query += ` AND material_school = ANY($${paramCount++})`;
      params.push(faculties);
    }

    if (startDate) {
      query += ` AND date_create >= $${paramCount++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND date_create <= $${paramCount++}`;
      params.push(endDate);
    }

    if (author) {
      query += ` AND material_author ILIKE $${paramCount++}`;
      params.push(`%${author}%`);
    }

    // Добавляем сортировку
    const sortBy = sort || 'newest';
    switch (sortBy) {
      case 'newest':
        query += ' ORDER BY id_material DESC, date_create DESC';
        break;
      case 'oldest':
        query += ' ORDER BY id_material ASC, date_create ASC';
        break;
      case 'popular':
        query += ' ORDER BY download_count DESC';
        break;
      case 'rating':
        query += ' ORDER BY rating DESC';
        break;
      default:
        query += ' ORDER BY id_material DESC, date_create DESC';
    }

    const result = await pool.query(query, params);
    sendResponse(res, 200, { success: true, data: result.rows });
  } catch (err) {
    console.error('Error in filterMaterials:', err);
    sendResponse(res, 500, {
      success: false,
      error: 'Internal server error',
      message: err.message
    });
  }
};

exports.createMaterial = [
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 }
  ]),
  async (req, res) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // 1. Сохраняем файл в Large Object, получаем oid
      let fileOid = null;
      if (req.files['file'] && req.files['file'][0]) {
        const lom = new LargeObjectManager({ pg: client });
        const [oid, stream] = await lom.createAndWritableStreamAsync();
        stream.write(req.files['file'][0].buffer);
        stream.end();
        await new Promise(resolve => stream.on('finish', resolve));
        fileOid = oid;
      }

      // 2. Сохраняем материал
      const {
        title, type, category, author, shortDescription, description, link, keywords
      } = req.body;
      const id_user = req.user?.id_user || 1;
      const result = await client.query(
        `INSERT INTO materials_table
        (id_user, material_name, material_type, material_school, material_author, material_image, material_description, material_full_description, material_link, material_tags, material_status, date_create)
        VALUES ($1,$2,$3,'',$4,$5,$6,$7,$8,$9,'на модерации',NOW())
        RETURNING id_material`,
        [
          id_user,
          title,
          type,
          author,
          req.files['image'] && req.files['image'][0] ? req.files['image'][0].buffer : null,
          shortDescription,
          description,
          link,
          keywords
        ]
      );
      const id_material = result.rows[0].id_material;

      // 3. Сохраняем oid в materials_files
      if (fileOid) {
        await client.query(
          `INSERT INTO materials_files (id_material, file) VALUES ($1, $2)`,
          [id_material, fileOid]
        );
      }

      await client.query('COMMIT');
      res.status(201).json({ success: true, id_material });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  }
];

exports.getMaterialImage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT material_image FROM materials_table WHERE id_material = $1', [id]);
    if (result.rows.length === 0 || !result.rows[0].material_image) {
      return res.status(404).send('Not found');
    }
    res.set('Content-Type', 'image/png');
    res.send(result.rows[0].material_image);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

exports.getUserMaterials = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM materials_table WHERE id_user = $1 ORDER BY date_create DESC',
      [id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};