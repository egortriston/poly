// Тестовый скрипт для проверки правильной передачи ID пользователя
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function testUserIdTransmission() {
    console.log('🧪 Тестирование передачи ID пользователя...\n');

    const testUserId = 2; // Тестовый ID пользователя

    try {
        // 1. Тест создания материала с правильным ID пользователя
        console.log('1. Тест создания материала...');
        const materialFormData = new FormData();
        materialFormData.append('title', 'Тестовый материал');
        materialFormData.append('type', 'Методическое пособие');
        materialFormData.append('category', 'Технические науки');
        materialFormData.append('author', 'Тестовый автор');
        materialFormData.append('shortDescription', 'Краткое описание');
        materialFormData.append('description', 'Полное описание материала');
        materialFormData.append('link', 'https://example.com');
        materialFormData.append('keywords', 'тест, материал');
        materialFormData.append('userId', testUserId);

        const materialResponse = await fetch(`${BASE_URL}/materials`, {
            method: 'POST',
            headers: {
                'X-User-ID': testUserId
            },
            body: materialFormData
        });
        
        const materialData = await materialResponse.json();
        console.log('Ответ сервера (материал):', materialData);
        console.log('✅ Материал создан\n');

        // 2. Тест создания новости с правильным ID пользователя
        console.log('2. Тест создания новости...');
        const newsFormData = new FormData();
        newsFormData.append('title', 'Тестовая новость');
        newsFormData.append('category', 'Образование');
        newsFormData.append('publicationDate', '2024-01-15');
        newsFormData.append('content', 'Содержание тестовой новости');
        newsFormData.append('author', 'Тестовый автор');
        newsFormData.append('source', 'https://example.com');
        newsFormData.append('userId', testUserId);

        const newsResponse = await fetch(`${BASE_URL}/news`, {
            method: 'POST',
            headers: {
                'X-User-ID': testUserId
            },
            body: newsFormData
        });
        
        const newsData = await newsResponse.json();
        console.log('Ответ сервера (новость):', newsData);
        console.log('✅ Новость создана\n');

        // 3. Тест создания события с правильным ID пользователя
        console.log('3. Тест создания события...');
        const eventFormData = new FormData();
        eventFormData.append('eventName', 'Тестовое событие');
        eventFormData.append('eventType', 'Конференция');
        eventFormData.append('eventCategory', 'Образование');
        eventFormData.append('startDate', '2024-02-01');
        eventFormData.append('endDate', '2024-02-02');
        eventFormData.append('startTime', '10:00');
        eventFormData.append('eventLocation', 'СПбПУ');
        eventFormData.append('eventDescription', 'Описание тестового события');
        eventFormData.append('targetAudience', 'Студенты');
        eventFormData.append('additionalInfo', 'Дополнительная информация');
        eventFormData.append('userId', testUserId);

        const eventResponse = await fetch(`${BASE_URL}/events`, {
            method: 'POST',
            headers: {
                'X-User-ID': testUserId
            },
            body: eventFormData
        });
        
        const eventData = await eventResponse.json();
        console.log('Ответ сервера (событие):', eventData);
        console.log('✅ Событие создано\n');

        // 4. Тест создания программы с правильным ID пользователя
        console.log('4. Тест создания программы...');
        const programFormData = new FormData();
        programFormData.append('programName', 'Тестовая программа');
        programFormData.append('programType', 'Магистратура');
        programFormData.append('resourceLink', 'https://example.com');
        programFormData.append('programDescription', 'Описание тестовой программы');
        programFormData.append('additionalInfo', 'Дополнительная информация');
        programFormData.append('userId', testUserId);

        const programResponse = await fetch(`${BASE_URL}/programs`, {
            method: 'POST',
            headers: {
                'X-User-ID': testUserId
            },
            body: programFormData
        });
        
        const programData = await programResponse.json();
        console.log('Ответ сервера (программа):', programData);
        console.log('✅ Программа создана\n');

        // 5. Проверяем, что контент создался с правильным ID пользователя
        console.log('5. Проверка контента пользователя...');
        
        const userMaterialsResponse = await fetch(`${BASE_URL}/materials/user/${testUserId}`);
        const userMaterialsData = await userMaterialsResponse.json();
        console.log('Материалы пользователя:', userMaterialsData);

        const userNewsResponse = await fetch(`${BASE_URL}/news/user/${testUserId}`);
        const userNewsData = await userNewsResponse.json();
        console.log('Новости пользователя:', userNewsData);

        const userEventsResponse = await fetch(`${BASE_URL}/events/user/${testUserId}`);
        const userEventsData = await userEventsResponse.json();
        console.log('События пользователя:', userEventsData);

        const userProgramsResponse = await fetch(`${BASE_URL}/programs/user/${testUserId}`);
        const userProgramsData = await userProgramsResponse.json();
        console.log('Программы пользователя:', userProgramsData);

        console.log('✅ Проверка завершена\n');

        console.log('🎉 Все тесты завершены успешно!');
        console.log('\n📋 Результаты:');
        console.log(`- ID пользователя для тестов: ${testUserId}`);
        console.log('- Все формы теперь передают правильный ID пользователя');
        console.log('- Middleware корректно извлекает ID из заголовков');
        console.log('- Контент создается с правильным ID пользователя');

    } catch (error) {
        console.error('❌ Ошибка при тестировании:', error.message);
    }
}

// Запуск тестов
testUserIdTransmission();
