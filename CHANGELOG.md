# Changelog

## [Unreleased] - 2024-01-XX

### Added
- **Material File Upload**: Добавлена возможность загрузки файлов к материалам
- **File System Storage**: Переход с PostgreSQL Large Objects на файловую систему
- **Favorites Page**: Новая страница для просмотра всех избранных материалов
- **User Authentication**: Проверка авторизации для всех операций с избранным
- **File Download**: Скачивание файлов с правильными MIME типами и расширениями
- **Database Schema Update**: Добавлена колонка `file_path` в таблицу `materials_files`

### Changed
- **File Storage**: Файлы теперь сохраняются в папке `uploads/` вместо Large Objects
- **Download Logic**: Исправлено скачивание файлов с правильными расширениями
- **User ID Handling**: Унифицирована обработка ID пользователя во всех компонентах
- **Error Handling**: Улучшена обработка ошибок при работе с файлами

### Fixed
- **File Extensions**: Исправлена проблема с неправильными расширениями при скачивании
- **Large Object Errors**: Устранены ошибки "неверный дескриптор большого объекта"
- **Character Encoding**: Исправлена проблема с кириллическими символами в именах файлов
- **Database Connection**: Исправлены настройки подключения к базе данных

### Technical Details
- **Backend**: Node.js/Express с PostgreSQL
- **File Upload**: Multer middleware для обработки файлов
- **File Storage**: Локальная файловая система с уникальными именами
- **MIME Types**: Автоматическое определение типа файла по расширению
- **Security**: Очистка имен файлов от специальных символов

### Files Modified
- `controllers/materialsController.js` - Основная логика работы с файлами
- `models/db.js` - Настройки подключения к базе данных
- `public/materials.html` - Интерфейс для скачивания файлов
- `public/new-materials.html` - Форма загрузки материалов
- `public/favorites.html` - Новая страница избранного
- `routes/materialsRoutes.js` - API маршруты для файлов
- И другие файлы для поддержки функциональности

### Database Changes
```sql
-- Добавлена колонка для хранения путей к файлам
ALTER TABLE materials_files ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);
CREATE INDEX IF NOT EXISTS idx_materials_files_file_path ON materials_files(file_path);
``` 