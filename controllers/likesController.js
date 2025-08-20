const pool = require('../models/db');

// Универсальная функция для отправки ответов
const sendResponse = (res, status, data) => {
  res.status(status).json(data);
};

exports.getAllLikes = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM user_likes');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLikeById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM user_likes WHERE id_like = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Like not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Функция для работы с лайками материалов
exports.toggleMaterialLike = async (req, res) => {
  try {
    const { materialId } = req.params;
    const { userId } = req.body;

    console.log('toggleMaterialLike called with:', { materialId, userId });

    if (!userId) {
      console.log('No userId provided');
      return sendResponse(res, 400, {
        success: false,
        error: 'User ID is required'
      });
    }

    if (!materialId) {
      console.log('No materialId provided');
      return sendResponse(res, 400, {
        success: false,
        error: 'Material ID is required'
      });
    }

    // Проверяем, существует ли уже лайк для этого материала от этого пользователя
    console.log('Checking existing like for user:', userId, 'material:', materialId);
    const existingLike = await pool.query(
      'SELECT * FROM user_likes WHERE id_user = $1 AND id_material = $2',
      [userId, materialId]
    );

    console.log('Existing like result:', existingLike.rows);

    if (existingLike.rows.length > 0) {
      // Если лайк существует, удаляем его
      console.log('Removing existing like');
      await pool.query(
        'DELETE FROM user_likes WHERE id_user = $1 AND id_material = $2',
        [userId, materialId]
      );

      console.log('Like removed successfully');
      sendResponse(res, 200, {
        success: true,
        isLiked: false,
        message: 'Like removed successfully'
      });
    } else {
      // Если лайка нет, создаем новый
      console.log('Creating new like');
      await pool.query(
        'INSERT INTO user_likes (id_user, id_material) VALUES ($1, $2)',
        [userId, materialId]
      );

      console.log('Like added successfully');
      sendResponse(res, 201, {
        success: true,
        isLiked: true,
        message: 'Like added successfully'
      });
    }
  } catch (err) {
    console.error('Error in toggleMaterialLike:', err);
    sendResponse(res, 500, {
      success: false,
      error: 'Internal server error',
      message: err.message
    });
  }
};

// Функция для проверки статуса лайка материала
exports.checkMaterialLikeStatus = async (req, res) => {
  try {
    const { materialId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return sendResponse(res, 400, {
        success: false,
        error: 'User ID is required'
      });
    }

    const result = await pool.query(
      'SELECT * FROM user_likes WHERE id_user = $1 AND id_material = $2',
      [userId, materialId]
    );

    const isLiked = result.rows.length > 0;

    sendResponse(res, 200, {
      success: true,
      isLiked: isLiked
    });
  } catch (err) {
    console.error('Error in checkMaterialLikeStatus:', err);
    sendResponse(res, 500, {
      success: false,
      error: 'Internal server error',
      message: err.message
    });
  }
};

// Функция для получения количества лайков материала
exports.getMaterialLikesCount = async (req, res) => {
  try {
    const { materialId } = req.params;

    const result = await pool.query(
      'SELECT COUNT(*) as likes_count FROM user_likes WHERE id_material = $1',
      [materialId]
    );

    const likesCount = parseInt(result.rows[0].likes_count);

    sendResponse(res, 200, {
      success: true,
      likesCount: likesCount
    });
  } catch (err) {
    console.error('Error in getMaterialLikesCount:', err);
    sendResponse(res, 500, {
      success: false,
      error: 'Internal server error',
      message: err.message
    });
  }
};

// Функция для получения всех лайков пользователя
exports.getUserLikes = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      'SELECT * FROM user_likes WHERE id_user = $1',
      [userId]
    );

    sendResponse(res, 200, {
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error in getUserLikes:', err);
    sendResponse(res, 500, {
      success: false,
      error: 'Internal server error',
      message: err.message
    });
  }
};

// Функция для работы с лайками программ
exports.toggleProgramLike = async (req, res) => {
  try {
    const { programId } = req.params;
    const { userId } = req.body;

    console.log('toggleProgramLike called with:', { programId, userId });

    if (!userId) {
      console.log('No userId provided');
      return sendResponse(res, 400, {
        success: false,
        error: 'User ID is required'
      });
    }

    if (!programId) {
      console.log('No programId provided');
      return sendResponse(res, 400, {
        success: false,
        error: 'Program ID is required'
      });
    }

    // Проверяем, существует ли уже лайк для этой программы от этого пользователя
    console.log('Checking existing like for user:', userId, 'program:', programId);
    const existingLike = await pool.query(
      'SELECT * FROM user_likes WHERE id_user = $1 AND id_program = $2',
      [userId, programId]
    );

    console.log('Existing like result:', existingLike.rows);

    if (existingLike.rows.length > 0) {
      // Если лайк существует, удаляем его
      console.log('Removing existing like');
      await pool.query(
        'DELETE FROM user_likes WHERE id_user = $1 AND id_program = $2',
        [userId, programId]
      );

      console.log('Like removed successfully');
      sendResponse(res, 200, {
        success: true,
        isLiked: false,
        message: 'Like removed successfully'
      });
    } else {
      // Если лайка нет, создаем новый
      console.log('Creating new like');
      await pool.query(
        'INSERT INTO user_likes (id_user, id_program) VALUES ($1, $2)',
        [userId, programId]
      );

      console.log('Like added successfully');
      sendResponse(res, 201, {
        success: true,
        isLiked: true,
        message: 'Like added successfully'
      });
    }
  } catch (err) {
    console.error('Error in toggleProgramLike:', err);
    sendResponse(res, 500, {
      success: false,
      error: 'Internal server error',
      message: err.message
    });
  }
};

// Функция для проверки статуса лайка программы
exports.checkProgramLikeStatus = async (req, res) => {
  try {
    const { programId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return sendResponse(res, 400, {
        success: false,
        error: 'User ID is required'
      });
    }

    const result = await pool.query(
      'SELECT * FROM user_likes WHERE id_user = $1 AND id_program = $2',
      [userId, programId]
    );

    const isLiked = result.rows.length > 0;

    sendResponse(res, 200, {
      success: true,
      isLiked: isLiked
    });
  } catch (err) {
    console.error('Error in checkProgramLikeStatus:', err);
    sendResponse(res, 500, {
      success: false,
      error: 'Internal server error',
      message: err.message
    });
  }
};

// Функция для получения количества лайков программы
exports.getProgramLikesCount = async (req, res) => {
  try {
    const { programId } = req.params;

    const result = await pool.query(
      'SELECT COUNT(*) as likes_count FROM user_likes WHERE id_program = $1',
      [programId]
    );

    const likesCount = parseInt(result.rows[0].likes_count);

    sendResponse(res, 200, {
      success: true,
      likesCount: likesCount
    });
  } catch (err) {
    console.error('Error in getProgramLikesCount:', err);
    sendResponse(res, 500, {
      success: false,
      error: 'Internal server error',
      message: err.message
    });
  }
};

// Функция для работы с лайками мероприятий
exports.toggleEventLike = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    console.log('toggleEventLike called with:', { eventId, userId });

    if (!userId) {
      console.log('No userId provided');
      return sendResponse(res, 400, {
        success: false,
        error: 'User ID is required'
      });
    }

    if (!eventId) {
      console.log('No eventId provided');
      return sendResponse(res, 400, {
        success: false,
        error: 'Event ID is required'
      });
    }

    // Проверяем, существует ли уже лайк для этого мероприятия от этого пользователя
    console.log('Checking existing like for user:', userId, 'event:', eventId);
    const existingLike = await pool.query(
      'SELECT * FROM user_likes WHERE id_user = $1 AND id_event = $2',
      [userId, eventId]
    );

    console.log('Existing like result:', existingLike.rows);

    if (existingLike.rows.length > 0) {
      // Если лайк существует, удаляем его
      console.log('Removing existing like');
      await pool.query(
        'DELETE FROM user_likes WHERE id_user = $1 AND id_event = $2',
        [userId, eventId]
      );

      console.log('Like removed successfully');
      sendResponse(res, 200, {
        success: true,
        isLiked: false,
        message: 'Like removed successfully'
      });
    } else {
      // Если лайка нет, создаем новый
      console.log('Creating new like');
      await pool.query(
        'INSERT INTO user_likes (id_user, id_event) VALUES ($1, $2)',
        [userId, eventId]
      );

      console.log('Like added successfully');
      sendResponse(res, 201, {
        success: true,
        isLiked: true,
        message: 'Like added successfully'
      });
    }
  } catch (err) {
    console.error('Error in toggleEventLike:', err);
    sendResponse(res, 500, {
      success: false,
      error: 'Internal server error',
      message: err.message
    });
  }
};

// Функция для проверки статуса лайка мероприятия
exports.checkEventLikeStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return sendResponse(res, 400, {
        success: false,
        error: 'User ID is required'
      });
    }

    const result = await pool.query(
      'SELECT * FROM user_likes WHERE id_user = $1 AND id_event = $2',
      [userId, eventId]
    );

    const isLiked = result.rows.length > 0;

    sendResponse(res, 200, {
      success: true,
      isLiked: isLiked
    });
  } catch (err) {
    console.error('Error in checkEventLikeStatus:', err);
    sendResponse(res, 500, {
      success: false,
      error: 'Internal server error',
      message: err.message
    });
  }
};

// Функция для получения количества лайков мероприятия
exports.getEventLikesCount = async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await pool.query(
      'SELECT COUNT(*) as likes_count FROM user_likes WHERE id_event = $1',
      [eventId]
    );

    const likesCount = parseInt(result.rows[0].likes_count);

    sendResponse(res, 200, {
      success: true,
      likesCount: likesCount
    });
  } catch (err) {
    console.error('Error in getEventLikesCount:', err);
    sendResponse(res, 500, {
      success: false,
      error: 'Internal server error',
      message: err.message
    });
  }
};

// Функция для работы с лайками новостей
exports.toggleNewsLike = async (req, res) => {
  try {
    const { newsId } = req.params;
    const { userId } = req.body;

    console.log('toggleNewsLike called with:', { newsId, userId });

    if (!userId) {
      console.log('No userId provided');
      return sendResponse(res, 400, {
        success: false,
        error: 'User ID is required'
      });
    }

    if (!newsId) {
      console.log('No newsId provided');
      return sendResponse(res, 400, {
        success: false,
        error: 'News ID is required'
      });
    }

    // Проверяем, существует ли уже лайк для этой новости от этого пользователя
    console.log('Checking existing like for user:', userId, 'news:', newsId);
    const existingLike = await pool.query(
      'SELECT * FROM user_likes WHERE id_user = $1 AND id_news = $2',
      [userId, newsId]
    );

    console.log('Existing like result:', existingLike.rows);

    if (existingLike.rows.length > 0) {
      // Если лайк существует, удаляем его
      console.log('Removing existing like');
      await pool.query(
        'DELETE FROM user_likes WHERE id_user = $1 AND id_news = $2',
        [userId, newsId]
      );

      console.log('Like removed successfully');
      sendResponse(res, 200, {
        success: true,
        isLiked: false,
        message: 'Like removed successfully'
      });
    } else {
      // Если лайка нет, создаем новый
      console.log('Creating new like');
      await pool.query(
        'INSERT INTO user_likes (id_user, id_news) VALUES ($1, $2)',
        [userId, newsId]
      );

      console.log('Like added successfully');
      sendResponse(res, 201, {
        success: true,
        isLiked: true,
        message: 'Like added successfully'
      });
    }
  } catch (err) {
    console.error('Error in toggleNewsLike:', err);
    sendResponse(res, 500, {
      success: false,
      error: 'Internal server error',
      message: err.message
    });
  }
};

// Функция для проверки статуса лайка новости
exports.checkNewsLikeStatus = async (req, res) => {
  try {
    const { newsId } = req.params;
    const { userId } = req.query;

    if (!userId) {
      return sendResponse(res, 400, {
        success: false,
        error: 'User ID is required'
      });
    }

    const result = await pool.query(
      'SELECT * FROM user_likes WHERE id_user = $1 AND id_news = $2',
      [userId, newsId]
    );

    const isLiked = result.rows.length > 0;

    sendResponse(res, 200, {
      success: true,
      isLiked: isLiked
    });
  } catch (err) {
    console.error('Error in checkNewsLikeStatus:', err);
    sendResponse(res, 500, {
      success: false,
      error: 'Internal server error',
      message: err.message
    });
  }
};

// Функция для получения количества лайков новости
exports.getNewsLikesCount = async (req, res) => {
  try {
    const { newsId } = req.params;

    const result = await pool.query(
      'SELECT COUNT(*) as likes_count FROM user_likes WHERE id_news = $1',
      [newsId]
    );

    const likesCount = parseInt(result.rows[0].likes_count);

    sendResponse(res, 200, {
      success: true,
      likesCount: likesCount
    });
  } catch (err) {
    console.error('Error in getNewsLikesCount:', err);
    sendResponse(res, 500, {
      success: false,
      error: 'Internal server error',
      message: err.message
    });
  }
}; 