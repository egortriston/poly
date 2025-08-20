// Тестовые данные для проверки API
const testData = {
    materials: [
        {
            id: 1,
            material_name: "Введение в искусственный интеллект",
            material_type: "Лекция",
            material_author: "Иванов И.И.",
            date_create: "2023-05-15",
            material_description: "Основные концепции и методы искусственного интеллекта",
            material_image: "image/knigi.jpg"
        },
        {
            id: 2,
            material_name: "Алгоритмы машинного обучения",
            material_type: "Презентация",
            material_author: "Петрова А.С.",
            date_create: "2023-05-10",
            material_description: "Обзор основных алгоритмов машинного обучения",
            material_image: "image/knigi.jpg"
        }
    ]
};

// Функция для проверки API
async function testAPI() {
    try {
        // Тест получения материалов
        console.log('Тестирование получения материалов...');
        const response = await fetch('/api/materials');
        if (!response.ok) {
            throw new Error(`Ошибка получения материалов: ${response.status}`);
        }
        const materials = await response.json();
        console.log('Материалы получены:', materials);

        // Тест фильтрации
        console.log('Тестирование фильтрации...');
        const filterResponse = await fetch('/api/materials/filter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                search: 'искусственный интеллект',
                categories: ['Лекция'],
                faculties: ['ИБиС']
            })
        });
        if (!filterResponse.ok) {
            throw new Error(`Ошибка фильтрации: ${filterResponse.status}`);
        }
        const filteredMaterials = await filterResponse.json();
        console.log('Отфильтрованные материалы:', filteredMaterials);

    } catch (error) {
        console.error('Ошибка при тестировании API:', error);
    }
}

// Запуск тестов при загрузке страницы
document.addEventListener('DOMContentLoaded', testAPI); 