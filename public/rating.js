document.addEventListener('DOMContentLoaded', function () {
    // Обработка кликов по звездам рейтинга
    const starsContainers = document.querySelectorAll('.stars-container');

    starsContainers.forEach(container => {
        const stars = container.querySelectorAll('.star');
        const initialRating = parseInt(container.getAttribute('data-rating'));

        // Устанавливаем начальный рейтинг
        highlightStars(stars, initialRating);

        // Обработка кликов
        stars.forEach(star => {
            star.addEventListener('click', function () {
                const value = parseInt(this.getAttribute('data-value'));
                container.setAttribute('data-rating', value);
                highlightStars(stars, value);

                // Здесь можно отправить оценку на сервер
                // sendRatingToServer(value, materialId);

                // Обновляем счетчик
                const countElement = container.nextElementSibling;
                if (countElement && countElement.classList.contains('rating-count')) {
                    const currentCount = parseInt(countElement.textContent.match(/\d+/)[0]);
                    countElement.textContent = `(${currentCount + 1})`;
                }
            });
        });
    });

    // Функция для подсветки звезд
    function highlightStars(stars, rating) {
        stars.forEach(star => {
            const value = parseInt(star.getAttribute('data-value'));
            if (value <= rating) {
                star.classList.add('selected');
            } else {
                star.classList.remove('selected');
            }
        });
    }
});