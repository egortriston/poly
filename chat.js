// Чат с возможностью перемещения
document.addEventListener('DOMContentLoaded', function () {
    const chatBtn = document.getElementById('chatBtn');
    const closeChat = document.getElementById('closeChat');
    const chatWindow = document.getElementById('chatWindow');
    const sendButton = document.getElementById('sendMessage');
    const messageInput = document.getElementById('messageInput');
    const chatMessages = document.getElementById('chatMessages');
    const chatHeader = document.querySelector('.chat-header');

    // Переменные для перемещения
    let isDragging = false;
    let offsetX, offsetY;

    // Открыть чат
    function openChat() {
        chatWindow.style.display = 'flex';
        setTimeout(() => {
            chatWindow.style.opacity = '1';
            chatWindow.style.transform = 'translateY(0)';
        }, 10);
    }

    // Закрыть чат
    function closeChatWindow() {
        chatWindow.style.opacity = '0';
        chatWindow.style.transform = 'translateY(20px)';
        setTimeout(() => {
            chatWindow.style.display = 'none';
        }, 300);
    }

    // Обработчики событий
    chatBtn.addEventListener('click', openChat);
    closeChat.addEventListener('click', closeChatWindow);

    // Отправка сообщения
    function sendMessage() {
        const messageText = messageInput.value.trim();
        if (messageText) {
            addMessage(messageText, 'user');
            messageInput.value = '';

            // Имитация набора сообщения
            showTypingIndicator();

            // Имитация ответа
            setTimeout(() => {
                hideTypingIndicator();
                addMessage(getRandomResponse(), 'other');
            }, 1000 + Math.random() * 2000);
        }
    }

    // Добавление сообщения в чат
    function addMessage(text, type) {
        const now = new Date();
        const timeString = now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();

        const messageElement = document.createElement('div');
        messageElement.classList.add('message', type);
        messageElement.innerHTML = `${text}<span class="message-time">${timeString}</span>`;

        chatMessages.appendChild(messageElement);
        scrollToBottom();
    }

    // Показать индикатор набора
    function showTypingIndicator() {
        const typingElement = document.createElement('div');
        typingElement.classList.add('typing-indicator');
        typingElement.id = 'typingIndicator';
        typingElement.innerHTML = 'Печатает <div class="typing-dots"><span></span><span></span><span></span></div>';
        chatMessages.appendChild(typingElement);
        scrollToBottom();
    }

    // Скрыть индикатор набора
    function hideTypingIndicator() {
        const typingElement = document.getElementById('typingIndicator');
        if (typingElement) {
            typingElement.remove();
        }
    }

    // Прокрутка вниз
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Случайные ответы для имитации
    function getRandomResponse() {
        const responses = [
            "Спасибо за ваше сообщение!",
            "Я передал ваш вопрос специалисту.",
            "Понял вас, уточните пожалуйста детали.",
            "Ожидайте ответа в течение 10 минут.",
            "Интересный вопрос, давайте обсудим.",
            "Мы работаем над решением вашего вопроса."
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // Обработчики отправки
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // ===== ПЕРЕМЕЩЕНИЕ ОКНА ЧАТА =====
    chatHeader.addEventListener('mousedown', startDrag);

    function startDrag(e) {
        isDragging = true;

        // Получаем позицию курсора относительно окна
        const rect = chatWindow.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        // Добавляем класс для отключения transitions
        chatWindow.classList.add('dragging');

        // Добавляем обработчики
        document.addEventListener('mousemove', dragWindow);
        document.addEventListener('mouseup', stopDrag);
    }

    function dragWindow(e) {
        if (!isDragging) return;

        // Вычисляем новую позицию
        const newX = e.clientX - offsetX;
        const newY = e.clientY - offsetY;

        // Устанавливаем новую позицию
        chatWindow.style.left = newX + 'px';
        chatWindow.style.top = newY + 'px';
        chatWindow.style.right = 'auto';
        chatWindow.style.bottom = 'auto';
    }

    function stopDrag() {
        isDragging = false;
        chatWindow.classList.remove('dragging');

        // Убираем обработчики
        document.removeEventListener('mousemove', dragWindow);
        document.removeEventListener('mouseup', stopDrag);
    }
});