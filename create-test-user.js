const pool = require('./models/db');
const bcrypt = require('bcrypt');

async function createTestUser() {
  try {
    // Проверяем, существует ли уже тестовый пользователь
    const existingUser = await pool.query(
      'SELECT * FROM user_table WHERE user_mail = $1',
      ['test@test.com']
    );

    if (existingUser.rows.length > 0) {
      console.log('Тестовый пользователь уже существует');
      return;
    }

    // Хешируем пароль
    const hash = await bcrypt.hash('test123', 10);

    // Создаем тестового пользователя
    const result = await pool.query(
      `INSERT INTO user_table 
       (user_name, user_mail, user_school, user_phone, user_password, user_description) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id_user, user_name, user_mail`,
      ['Тестовый пользователь', 'test@test.com', 'ИБиС', '+7-999-123-45-67', hash, 'Тестовый пользователь для проверки лайков']
    );

    console.log('Тестовый пользователь создан:', result.rows[0]);
    console.log('Email: test@test.com');
    console.log('Пароль: test123');
    console.log('ID пользователя:', result.rows[0].id_user);

  } catch (err) {
    console.error('Ошибка создания тестового пользователя:', err);
  } finally {
    await pool.end();
  }
}

createTestUser(); 