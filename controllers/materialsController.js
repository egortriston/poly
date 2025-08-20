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
    const { search, categories, faculties, startDate, endDate, author, sort, userId } = req.body;

    let query = `
      SELECT m.*, 
             COALESCE(l.likes_count, 0) as likes_count,
             CASE WHEN ul.id_like IS NOT NULL THEN true ELSE false END as is_liked
      FROM materials_table m
      LEFT JOIN (
        SELECT id_material, COUNT(*) as likes_count 
        FROM user_likes 
        GROUP BY id_material
      ) l ON m.id_material = l.id_material
      LEFT JOIN user_likes ul ON m.id_material = ul.id_material AND ul.id_user = $1
      WHERE m.material_status = 'Одобрено'
    `;
    const params = [userId || null];
    let paramCount = 2;

    if (search) {
      query += ` AND m.material_name ILIKE $${paramCount++}`;
      params.push(`%${search}%`);
    }

    if (categories && categories.length > 0) {
      query += ` AND m.material_type = ANY($${paramCount++})`;
      params.push(categories);
    }

    if (faculties && faculties.length > 0) {
      query += ` AND m.material_school = ANY($${paramCount++})`;
      params.push(faculties);
    }

    if (startDate) {
      query += ` AND m.date_create >= $${paramCount++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND m.date_create <= $${paramCount++}`;
      params.push(endDate);
    }

    if (author) {
      query += ` AND m.material_author ILIKE $${paramCount++}`;
      params.push(`%${author}%`);
    }

    // Добавляем сортировку
    const sortBy = sort || 'newest';
    switch (sortBy) {
      case 'newest':
        query += ' ORDER BY m.id_material DESC, m.date_create DESC';
        break;
      case 'oldest':
        query += ' ORDER BY m.id_material ASC, m.date_create ASC';
        break;
      case 'popular':
        query += ' ORDER BY l.likes_count DESC NULLS LAST, m.id_material DESC';
        break;
      case 'rating':
        query += ' ORDER BY m.rating DESC NULLS LAST, m.id_material DESC';
        break;
      default:
        query += ' ORDER BY m.id_material DESC, m.date_create DESC';
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
      
      console.log('Создание материала:', req.body);
      console.log('Файлы:', req.files);

      // 1. Сохраняем файл в файловой системе
      let filePath = null;
      if (req.files['file'] && req.files['file'][0]) {
        console.log('Обрабатываем файл материала:', req.files['file'][0].originalname);
        
        try {
          const originalName = req.files['file'][0].originalname;
          console.log('Оригинальное имя файла:', originalName);
          
          // Очищаем имя файла от специальных символов
          const cleanName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
          const fileName = `${Date.now()}_${cleanName}`;
          
          console.log('Очищенное имя файла:', fileName);
          filePath = await saveFileToDisk(req.files['file'][0].buffer, fileName);
          console.log('Файл сохранен по пути:', filePath);
        } catch (error) {
          console.error('Ошибка сохранения файла:', error);
          throw new Error('Не удалось сохранить файл');
        }
      }

      // 2. Сохраняем материал
      const {
        title, type, category, author, shortDescription, description, link, keywords
      } = req.body;
      
      // Получаем ID пользователя из localStorage или используем дефолтный
      const id_user = req.body.userId || 1;
      
      console.log('Данные материала:', {
        id_user, title, type, category, author, shortDescription, description, link, keywords
      });

      const result = await client.query(
        `INSERT INTO materials_table
        (id_user, material_name, material_type, material_school, material_author, material_image, material_description, material_full_description, material_link, material_tags, material_status, date_create)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'на модерации', NOW())
        RETURNING id_material`,
        [
          id_user,
          title,
          type,
          '', // material_school - оставляем пустым пока
          author || '',
          req.files['image'] && req.files['image'][0] ? req.files['image'][0].buffer : null,
          shortDescription || '',
          description || '',
          link || '',
          keywords || ''
        ]
      );
      const id_material = result.rows[0].id_material;
      console.log('Материал создан с ID:', id_material);

      // 3. Сохраняем путь к файлу в materials_files
      if (filePath) {
        await client.query(
          `INSERT INTO materials_files (id_material, file_path) VALUES ($1, $2)`,
          [id_material, filePath]
        );
        console.log('Файл привязан к материалу, путь:', filePath);
      } else {
        console.log('Файл не был загружен или сохранен');
      }

      await client.query('COMMIT');
      sendResponse(res, 201, { 
        success: true, 
        id_material,
        message: 'Материал успешно добавлен и отправлен на модерацию'
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Ошибка создания материала:', err);
      sendResponse(res, 500, {
        success: false,
        error: 'Internal server error',
        message: err.message
      });
    } finally {
      client.release();
    }
  }
];

// Функция для скачивания файла материала
exports.downloadMaterialFile = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    
    // Получаем информацию о файле
    const result = await client.query(
      `SELECT mf.file_path, mt.material_name, mt.material_status
       FROM materials_files mf 
       JOIN materials_table mt ON mf.id_material = mt.id_material 
       WHERE mf.id_material = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      console.log('Файл не найден для материала ID:', id);
      return sendResponse(res, 404, {
        success: false,
        error: 'File not found'
      });
    }

    const { file_path, material_name, material_status } = result.rows[0];
    console.log('Найден файл:', { id, file_path, material_name, material_status });

    // Проверяем, что путь к файлу существует
    if (!file_path) {
      console.log('Путь к файлу не найден');
      return sendResponse(res, 404, {
        success: false,
        error: 'File path not found'
      });
    }

    console.log('Пытаемся скачать файл по пути:', file_path);

    // Читаем файл из файловой системы
    try {
      const fileBuffer = await readFileFromDisk(file_path);
      console.log('Файл прочитан, размер:', fileBuffer.length, 'байт');

      // Определяем MIME тип по расширению
      const path = require('path');
      const ext = path.extname(file_path).toLowerCase();
      console.log('Определенное расширение файла:', ext);
      
      let contentType = 'application/octet-stream';
      
      if (ext === '.pdf') contentType = 'application/pdf';
      else if (ext === '.doc' || ext === '.docx') contentType = 'application/msword';
      else if (ext === '.ppt' || ext === '.pptx') contentType = 'application/vnd.ms-powerpoint';
      else if (ext === '.mp3') contentType = 'audio/mpeg';
      else if (ext === '.mp4') contentType = 'video/mp4';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.png') contentType = 'image/png';
      
      console.log('Определенный MIME тип:', contentType);
      console.log('Имя файла для скачивания:', `${material_name}${ext}`);

      // Очищаем имя файла для HTTP заголовка (убираем кириллицу и специальные символы)
      const safeFileName = `${material_name}${ext}`.replace(/[^a-zA-Z0-9.-]/g, '_');
      console.log('Безопасное имя файла для заголовка:', safeFileName);

      // Кодируем имя файла для UTF-8
      const encodedFileName = encodeURIComponent(safeFileName);
      console.log('Закодированное имя файла:', encodedFileName);

      // Устанавливаем заголовки для скачивания
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"; filename*=UTF-8''${encodedFileName}`);
      res.setHeader('Content-Length', fileBuffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Pragma', 'no-cache');

      // Отправляем файл
      res.send(fileBuffer);
      
    } catch (error) {
      console.error('Ошибка чтения файла:', error);
      sendResponse(res, 500, {
        success: false,
        error: 'File read error',
        message: error.message
      });
    }
  } catch (err) {
    console.error('Ошибка скачивания файла:', err);
    sendResponse(res, 500, {
      success: false,
      error: 'Internal server error',
      message: err.message
    });
  } finally {
    client.release();
  }
};

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

// Функция для очистки поврежденных файлов (для админов)
exports.cleanupCorruptedFiles = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Находим все записи в materials_files
    const allFiles = await client.query(`
      SELECT mf.id_file_material, mf.id_material, mf.file, mt.material_name
      FROM materials_files mf
      JOIN materials_table mt ON mf.id_material = mt.id_material
      WHERE mf.file IS NOT NULL
    `);
    
    const corruptedFiles = { rows: [] }; // Пока не проверяем повреждения
    
    console.log('Найдено поврежденных файлов:', corruptedFiles.rows.length);
    
    if (corruptedFiles.rows.length > 0) {
      // Удаляем записи с поврежденными файлами
      await client.query(`
        DELETE FROM materials_files 
        WHERE id_file_material IN (
          SELECT mf.id_file_material
          FROM materials_files mf
          WHERE mf.file IS NOT NULL 
          AND (pg_largeobject_size(mf.file) <= 0 OR pg_largeobject_size(mf.file) IS NULL)
        )
      `);
      
      console.log('Удалено записей с поврежденными файлами:', corruptedFiles.rows.length);
    }
    
    await client.query('COMMIT');
    
    sendResponse(res, 200, {
      success: true,
      message: `Очищено ${corruptedFiles.rows.length} поврежденных файлов`,
      corruptedFiles: corruptedFiles.rows
    });
    
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Ошибка очистки файлов:', err);
    sendResponse(res, 500, {
      success: false,
      error: 'Internal server error',
      message: err.message
    });
  } finally {
    client.release();
  }
};

// Альтернативная функция для сохранения файлов в файловой системе
const fs = require('fs').promises;
const path = require('path');

async function saveFileToDisk(fileBuffer, fileName) {
  const uploadDir = path.join(__dirname, '..', 'uploads');
  
  // Создаем папку uploads если её нет
  try {
    await fs.access(uploadDir);
  } catch {
    await fs.mkdir(uploadDir, { recursive: true });
  }
  
  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, fileBuffer);
  return filePath;
}

async function readFileFromDisk(filePath) {
  return await fs.readFile(filePath);
}