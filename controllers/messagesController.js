const pool = require('../models/db');

// Получить все сообщения
exports.getAllMessages = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM messages_table ORDER BY message_time DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Получить сообщение по ID
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

// Создать новое сообщение
exports.createMessage = async (req, res) => {
  try {
    const {
      id_user,
      message_text,
      type_message = false,
      id_material = null,
      id_program = null,
      id_news = null,
      id_event = null
    } = req.body;

    const result = await pool.query(
      `INSERT INTO messages_table 
       (id_user, message_text, message_time, type_message, id_material, id_program, id_news, id_event)
       VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7)
       RETURNING *`,
      [id_user, message_text, type_message, id_material, id_program, id_news, id_event]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Получить сообщения для модерации
exports.getModerationMessages = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.*, u.user_name, u.user_mail,
              CASE 
                WHEN m.id_material IS NOT NULL THEN 'material'
                WHEN m.id_program IS NOT NULL THEN 'program'
                WHEN m.id_news IS NOT NULL THEN 'news'
                WHEN m.id_event IS NOT NULL THEN 'event'
                ELSE 'unknown'
              END as content_type,
              COALESCE(m.id_material, m.id_program, m.id_news, m.id_event) as content_id
       FROM messages_table m 
       LEFT JOIN user_table u ON m.id_user = u.id_user 
       WHERE m.type_message = true 
       ORDER BY m.message_time DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Получить статистику модерации
exports.getModerationStats = async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_pending,
        COUNT(CASE WHEN id_material IS NOT NULL THEN 1 END) as materials,
        COUNT(CASE WHEN id_program IS NOT NULL THEN 1 END) as programs,
        COUNT(CASE WHEN id_news IS NOT NULL THEN 1 END) as news,
        COUNT(CASE WHEN id_event IS NOT NULL THEN 1 END) as events
      FROM messages_table 
      WHERE type_message = true
    `);
    
    res.json(stats.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Определить тип контента по сообщению
function getContentType(message) {
  if (message.id_material !== null) return 'material';
  if (message.id_program !== null) return 'program';
  if (message.id_news !== null) return 'news';
  if (message.id_event !== null) return 'event';
  return null;
}

// Получить ID контента по сообщению
function getContentId(message) {
  return message.id_material || message.id_program || message.id_news || message.id_event;
}

    // Одобрить контент
    exports.approveContent = async (req, res) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const { message_id } = req.body;
            
            // Получаем информацию о сообщении
            const messageResult = await client.query(
                'SELECT * FROM messages_table WHERE id_message = $1 AND type_message = true',
                [message_id]
            );
            
            if (messageResult.rows.length === 0) {
                return res.status(404).json({ error: 'Message not found' });
            }
            
            const message = messageResult.rows[0];
            const contentType = getContentType(message);
            const contentId = getContentId(message);
            
            if (!contentType || !contentId) {
                return res.status(400).json({ error: 'Invalid content type or ID' });
            }
            
            // Обновляем статус контента в соответствующей таблице
            let updateQuery = '';
            let updateParams = [];
            
            switch (contentType) {
                case 'material':
                    updateQuery = 'UPDATE materials_table SET material_status = $1 WHERE id_material = $2';
                    updateParams = ['Одобрено', contentId];
                    break;
                case 'news':
                    updateQuery = 'UPDATE news_table SET news_status = $1 WHERE id_news = $2';
                    updateParams = ['Одобрено', contentId];
                    break;
                case 'event':
                    updateQuery = 'UPDATE events_table SET event_status = $1 WHERE id_event = $2';
                    updateParams = ['Одобрено', contentId];
                    break;
                case 'program':
                    updateQuery = 'UPDATE program_table SET program_status = $1 WHERE id_program = $2';
                    updateParams = ['Одобрено', contentId];
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid content type' });
            }
            
            await client.query(updateQuery, updateParams);
            
            // Удаляем сообщение из messages_table
            await client.query(
                'DELETE FROM messages_table WHERE id_message = $1',
                [message_id]
            );
            
            await client.query('COMMIT');
            res.json({ success: true, message: 'Content approved successfully' });
        } catch (err) {
            await client.query('ROLLBACK');
            res.status(500).json({ error: err.message });
        } finally {
            client.release();
        }
    };

    // Отклонить контент
    exports.rejectContent = async (req, res) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const { message_id } = req.body;
            
            // Получаем информацию о сообщении
            const messageResult = await client.query(
                'SELECT * FROM messages_table WHERE id_message = $1 AND type_message = true',
                [message_id]
            );
            
            if (messageResult.rows.length === 0) {
                return res.status(404).json({ error: 'Message not found' });
            }
            
            const message = messageResult.rows[0];
            const contentType = getContentType(message);
            const contentId = getContentId(message);
            
            if (!contentType || !contentId) {
                return res.status(400).json({ error: 'Invalid content type or ID' });
            }
            
            // Обновляем статус контента в соответствующей таблице
            let updateQuery = '';
            let updateParams = [];
            
            switch (contentType) {
                case 'material':
                    updateQuery = 'UPDATE materials_table SET material_status = $1 WHERE id_material = $2';
                    updateParams = ['отклонено', contentId];
                    break;
                case 'news':
                    updateQuery = 'UPDATE news_table SET news_status = $1 WHERE id_news = $2';
                    updateParams = ['отклонено', contentId];
                    break;
                case 'event':
                    updateQuery = 'UPDATE events_table SET event_status = $1 WHERE id_event = $2';
                    updateParams = ['отклонено', contentId];
                    break;
                case 'program':
                    updateQuery = 'UPDATE program_table SET program_status = $1 WHERE id_program = $2';
                    updateParams = ['отклонено', contentId];
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid content type' });
            }
            
            await client.query(updateQuery, updateParams);
            
            // Удаляем сообщение из messages_table
            await client.query(
                'DELETE FROM messages_table WHERE id_message = $1',
                [message_id]
            );
            
            await client.query('COMMIT');
            res.json({ success: true, message: 'Content rejected successfully' });
        } catch (err) {
            await client.query('ROLLBACK');
            res.status(500).json({ error: err.message });
        } finally {
            client.release();
        }
    };

// Отметить сообщение как прочитанное (заглушка, так как нет поля is_read)
exports.markAsRead = async (req, res) => {
  try {
    // В текущей структуре нет поля is_read, поэтому просто возвращаем успех
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 