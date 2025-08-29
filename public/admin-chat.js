class AdminChat {
    constructor() {
        this.messages = [];
        this.stats = {};
        this.currentMessage = null;
        this.currentFilter = null; // Текущий фильтр
        this.init();
    }

    async init() {
        await this.loadStats();
        await this.loadMessages();
        this.setupEventListeners();
        this.startAutoRefresh();
    }

    async loadStats() {
        try {
            const response = await fetch('/api/messages/moderation/stats');
            if (response.status === 401) {
                // Не авторизован, перенаправляем на страницу входа
                window.location.href = '/admin-login';
                return;
            }
            this.stats = await response.json();
            this.updateStatsDisplay();
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
        }
    }

    async loadMessages() {
        try {
            const response = await fetch('/api/messages/moderation/pending');
            if (response.status === 401) {
                // Не авторизован, перенаправляем на страницу входа
                window.location.href = '/admin-login';
                return;
            }
            this.messages = await response.json();
            this.renderMessages();
        } catch (error) {
            console.error('Ошибка загрузки сообщений:', error);
        }
    }

    updateStatsDisplay() {
        const statsContainer = document.getElementById('moderation-stats');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-item" data-filter="material" onclick="adminChat.filterByType('material')">
                    <span class="stat-number pending">${this.stats.materials || 0}</span>
                    <span class="stat-label">Материалы</span>
                </div>
                <div class="stat-item" data-filter="news" onclick="adminChat.filterByType('news')">
                    <span class="stat-number approved">${this.stats.news || 0}</span>
                    <span class="stat-label">Новости</span>
                </div>
                <div class="stat-item" data-filter="event" onclick="adminChat.filterByType('event')">
                    <span class="stat-number rejected">${this.stats.events || 0}</span>
                    <span class="stat-label">События</span>
                </div>
                <div class="stat-item" data-filter="program" onclick="adminChat.filterByType('program')">
                    <span class="stat-number">${this.stats.programs || 0}</span>
                    <span class="stat-label">Программы</span>
                </div>
            `;
        }
    }

    renderMessages() {
        const messagesContainer = document.getElementById('moderation-list');
        if (!messagesContainer) return;

        // Фильтруем сообщения если есть активный фильтр
        let filteredMessages = this.messages;
        if (this.currentFilter) {
            filteredMessages = this.messages.filter(message => message.content_type === this.currentFilter);
        }

        if (filteredMessages.length === 0) {
            const filterText = this.currentFilter ? ` для типа "${this.getContentTypeLabel(this.currentFilter)}"` : '';
            messagesContainer.innerHTML = `<div class="empty-state">Нет сообщений для модерации${filterText}</div>`;
            return;
        }

        messagesContainer.innerHTML = filteredMessages.map(message => `
            <div class="moderation-item" data-message-id="${message.id_message}">
                <div class="moderation-header">
                    <div class="moderation-info">
                        <div class="content-type">${this.getContentTypeLabel(message.content_type)}</div>
                        <div class="user-info">
                            <span class="user-name">${message.user_name || 'Неизвестный пользователь'}</span>
                            <span class="message-time">${this.formatTime(message.message_time)}</span>
                        </div>
                    </div>
                    <div class="content-id">ID: ${message.content_id}</div>
                </div>
                
                <div class="moderation-content">
                    <div class="message-text">${message.message_text}</div>
                </div>

                <div class="moderation-actions">
                    <button class="btn-approve" onclick="adminChat.approveContent(${message.id_message})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Одобрить
                    </button>
                    <button class="btn-reject" onclick="adminChat.rejectContent(${message.id_message})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        Отклонить
                    </button>
                    <button class="btn-view" onclick="adminChat.viewContent('${message.content_type}', ${message.content_id})">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" stroke-width="2"/>
                            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                        </svg>
                        Просмотр
                    </button>
                </div>
            </div>
        `).join('');
    }

    getContentTypeLabel(contentType) {
        const labels = {
            'material': '📚 Материал',
            'news': '📰 Новость',
            'event': '📅 Событие',
            'program': '🎓 Программа'
        };
        return labels[contentType] || contentType;
    }

    formatTime(timeString) {
        if (!timeString) return 'Не указано';
        const date = new Date(`2000-01-01T${timeString}`);
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    async approveContent(messageId) {
        if (!confirm('Вы уверены, что хотите одобрить этот контент?')) {
            return;
        }
        
        try {
            const response = await fetch('/api/messages/moderation/approve', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message_id: messageId
                })
            });

            if (response.status === 401) {
                // Не авторизован, перенаправляем на страницу входа
                window.location.href = '/admin-login';
                return;
            }

            if (response.ok) {
                alert('Контент одобрен!');
                await this.loadStats();
                await this.loadMessages();
            } else {
                alert('Ошибка при одобрении контента');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка при одобрении контента');
        }
    }

    async rejectContent(messageId) {
        if (!confirm('Вы уверены, что хотите отклонить этот контент?')) {
            return;
        }

        try {
            const response = await fetch('/api/messages/moderation/reject', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message_id: messageId
                })
            });

            if (response.status === 401) {
                // Не авторизован, перенаправляем на страницу входа
                window.location.href = '/admin-login';
                return;
            }

            if (response.ok) {
                alert('Контент отклонен!');
                await this.loadStats();
                await this.loadMessages();
            } else {
                alert('Ошибка при отклонении контента');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка при отклонении контента');
        }
    }

    async viewContent(contentType, contentId) {
        try {
            // Загружаем данные контента в зависимости от типа
            let contentData = null;
            let filesData = null;
            
            switch (contentType) {
                case 'material':
                    const materialResponse = await fetch(`/api/materials/${contentId}`);
                    if (materialResponse.status === 401) {
                        window.location.href = '/admin-login';
                        return;
                    }
                    if (materialResponse.ok) {
                        contentData = await materialResponse.json();
                    }
                    const materialFilesResponse = await fetch(`/api/materials/${contentId}/files`);
                    if (materialFilesResponse.status === 401) {
                        window.location.href = '/admin-login';
                        return;
                    }
                    if (materialFilesResponse.ok) {
                        filesData = await materialFilesResponse.json();
                    }
                    break;
                case 'news':
                    const newsResponse = await fetch(`/api/news/${contentId}`);
                    if (newsResponse.status === 401) {
                        window.location.href = '/admin-login';
                        return;
                    }
                    if (newsResponse.ok) {
                        contentData = await newsResponse.json();
                    }
                    const newsFilesResponse = await fetch(`/api/news/${contentId}/files`);
                    if (newsFilesResponse.status === 401) {
                        window.location.href = '/admin-login';
                        return;
                    }
                    if (newsFilesResponse.ok) {
                        filesData = await newsFilesResponse.json();
                    }
                    break;
                case 'event':
                    const eventResponse = await fetch(`/api/events/${contentId}`);
                    if (eventResponse.status === 401) {
                        window.location.href = '/admin-login';
                        return;
                    }
                    if (eventResponse.ok) {
                        contentData = await eventResponse.json();
                    }
                    const eventFilesResponse = await fetch(`/api/events/${contentId}/files`);
                    if (eventFilesResponse.status === 401) {
                        window.location.href = '/admin-login';
                        return;
                    }
                    if (eventFilesResponse.ok) {
                        filesData = await eventFilesResponse.json();
                    }
                    break;
                case 'program':
                    const programResponse = await fetch(`/api/programs/${contentId}`);
                    if (programResponse.status === 401) {
                        window.location.href = '/admin-login';
                        return;
                    }
                    if (programResponse.ok) {
                        contentData = await programResponse.json();
                    }
                    const programFilesResponse = await fetch(`/api/programs/${contentId}/files`);
                    if (programFilesResponse.status === 401) {
                        window.location.href = '/admin-login';
                        return;
                    }
                    if (programFilesResponse.ok) {
                        filesData = await programFilesResponse.json();
                    }
                    break;
            }
            
            this.showContentModal(contentType, contentData, filesData);
        } catch (error) {
            console.error('Ошибка загрузки данных контента:', error);
            alert('Ошибка при загрузке данных контента');
        }
    }

    showContentModal(contentType, contentData, filesData) {
        // Создаем модальное окно
        const modal = document.createElement('div');
        modal.className = 'content-modal-overlay';
        modal.innerHTML = `
            <div class="content-modal">
                <div class="modal-header">
                    <h2>${this.getContentTypeLabel(contentType)}</h2>
                    <button class="modal-close" onclick="this.closest('.content-modal-overlay').remove()">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-content">
                    ${this.renderContentDetails(contentType, contentData, filesData)}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Закрытие по клику вне модального окна
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    renderContentDetails(contentType, contentData, filesData) {
        if (!contentData) {
            return '<div class="error-message">Ошибка загрузки данных</div>';
        }

        let contentHtml = '';
        
        switch (contentType) {
            case 'material':
                contentHtml = this.renderMaterialDetails(contentData, filesData);
                break;
            case 'news':
                contentHtml = this.renderNewsDetails(contentData, filesData);
                break;
            case 'event':
                contentHtml = this.renderEventDetails(contentData, filesData);
                break;
            case 'program':
                contentHtml = this.renderProgramDetails(contentData, filesData);
                break;
        }
        
        return contentHtml;
    }

    renderMaterialDetails(material, filesData) {
        return `
            <div class="content-details">
                <div class="content-header">
                    <h3>${material.material_name || 'Без названия'}</h3>
                    <div class="content-meta">
                        <span class="meta-item">Автор: ${material.material_author || 'Не указан'}</span>
                        <span class="meta-item">Тип: ${material.material_type || 'Не указан'}</span>
                        <span class="meta-item">Институт: ${material.material_school || 'Не указан'}</span>
                        <span class="meta-item">Статус: <span class="status-badge ${material.material_status}">${material.material_status || 'Не указан'}</span></span>
                    </div>
                </div>
                
                <div class="content-body">
                    <div class="content-description">
                        <h4>Описание:</h4>
                        <p>${material.material_description || 'Описание отсутствует'}</p>
                    </div>
                    
                    ${material.material_full_description ? `
                        <div class="content-full-description">
                            <h4>Дополнительное описание:</h4>
                            <p>${material.material_full_description}</p>
                        </div>
                    ` : ''}
                    
                    ${material.material_tags ? `
                        <div class="content-tags">
                            <h4>Теги:</h4>
                            <div class="tags-list">
                                ${material.material_tags.split(',').map(tag => `<span class="tag">${tag.trim()}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${material.material_link ? `
                        <div class="content-link">
                            <h4>Ссылка:</h4>
                            <a href="${material.material_link}" target="_blank" class="external-link">${material.material_link}</a>
                        </div>
                    ` : ''}
                </div>
                
                ${material.material_image ? `
                    <div class="content-image">
                        <h4>Изображение:</h4>
                        <img src="/api/materials/${material.id_material}/image" alt="Изображение материала" class="content-img">
                        <button class="download-btn" onclick="adminChat.downloadImage('/api/materials/${material.id_material}/image', 'material_${material.id_material}.png')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Скачать изображение
                        </button>
                    </div>
                ` : ''}
                
                ${filesData && filesData.length > 0 ? `
                    <div class="content-files">
                        <h4>Прикрепленные файлы:</h4>
                        <div class="files-list">
                            ${filesData.map((file, index) => `
                                <div class="file-item">
                                    <span class="file-name">Файл ${index + 1}</span>
                                    <button class="download-btn" onclick="adminChat.downloadFile('/api/materials/${material.id_material}/files/${file.id_file_material}', 'material_file_${file.id_file_material}')">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        Скачать
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderNewsDetails(news, filesData) {
        return `
            <div class="content-details">
                <div class="content-header">
                    <h3>${news.name_news || 'Без названия'}</h3>
                    <div class="content-meta">
                        <span class="meta-item">Автор: ${news.news_author || 'Не указан'}</span>
                        <span class="meta-item">Категория: ${news.news_category || 'Не указана'}</span>
                        <span class="meta-item">Статус: <span class="status-badge ${news.news_status}">${news.news_status || 'Не указан'}</span></span>
                    </div>
                </div>
                
                <div class="content-body">
                    <div class="content-description">
                        <h4>Содержание:</h4>
                        <p>${news.news_text || 'Содержание отсутствует'}</p>
                    </div>
                    
                    ${news.news_link ? `
                        <div class="content-link">
                            <h4>Ссылка:</h4>
                            <a href="${news.news_link}" target="_blank" class="external-link">${news.news_link}</a>
                        </div>
                    ` : ''}
                </div>
                
                ${news.news_image ? `
                    <div class="content-image">
                        <h4>Изображение:</h4>
                        <img src="/api/news/${news.id_news}/image" alt="Изображение новости" class="content-img">
                        <button class="download-btn" onclick="adminChat.downloadImage('/api/news/${news.id_news}/image', 'news_${news.id_news}.png')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Скачать изображение
                        </button>
                    </div>
                ` : ''}
                
                ${filesData && filesData.length > 0 ? `
                    <div class="content-files">
                        <h4>Прикрепленные файлы:</h4>
                        <div class="files-list">
                            ${filesData.map((file, index) => `
                                <div class="file-item">
                                    <span class="file-name">Файл ${index + 1}</span>
                                    <button class="download-btn" onclick="adminChat.downloadFile('/api/news/${news.id_news}/files/${file.id_news_file}', 'news_file_${file.id_news_file}')">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        Скачать
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderEventDetails(event, filesData) {
        return `
            <div class="content-details">
                <div class="content-header">
                    <h3>${event.event_name || 'Без названия'}</h3>
                    <div class="content-meta">
                        <span class="meta-item">Тип: ${event.event_type || 'Не указан'}</span>
                        <span class="meta-item">Категория: ${event.event_category || 'Не указана'}</span>
                        <span class="meta-item">Статус: <span class="status-badge ${event.event_status}">${event.event_status || 'Не указан'}</span></span>
                    </div>
                </div>
                
                <div class="content-body">
                    <div class="content-description">
                        <h4>Описание:</h4>
                        <p>${event.event_description || 'Описание отсутствует'}</p>
                    </div>
                    
                    <div class="event-dates">
                        <h4>Даты проведения:</h4>
                        <p>С ${event.start || 'Не указано'} по ${event.end || 'Не указано'}</p>
                        ${event.time_start ? `<p>Время начала: ${event.time_start}</p>` : ''}
                    </div>
                    
                    ${event.event_audience ? `
                        <div class="event-audience">
                            <h4>Целевая аудитория:</h4>
                            <p>${event.event_audience}</p>
                        </div>
                    ` : ''}
                    
                    ${event.event_info ? `
                        <div class="event-info">
                            <h4>Дополнительная информация:</h4>
                            <p>${event.event_info}</p>
                        </div>
                    ` : ''}
                </div>
                
                ${filesData && filesData.length > 0 ? `
                    <div class="content-files">
                        <h4>Прикрепленные файлы:</h4>
                        <div class="files-list">
                            ${filesData.map((file, index) => `
                                <div class="file-item">
                                    <span class="file-name">Файл ${index + 1}</span>
                                    <button class="download-btn" onclick="adminChat.downloadFile('/api/events/${event.id_event}/files/${file.id_event_file}', 'event_file_${file.id_event_file}')">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        Скачать
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderProgramDetails(program, filesData) {
        return `
            <div class="content-details">
                <div class="content-header">
                    <h3>${program.program_name || 'Без названия'}</h3>
                    <div class="content-meta">
                        <span class="meta-item">Тип: ${program.program_type || 'Не указан'}</span>
                        <span class="meta-item">Статус: <span class="status-badge ${program.program_status}">${program.program_status || 'Не указан'}</span></span>
                    </div>
                </div>
                
                <div class="content-body">
                    <div class="content-description">
                        <h4>Описание:</h4>
                        <p>${program.program_description || 'Описание отсутствует'}</p>
                    </div>
                    
                    ${program.program_info ? `
                        <div class="program-info">
                            <h4>Дополнительная информация:</h4>
                            <p>${program.program_info}</p>
                        </div>
                    ` : ''}
                    
                    ${program.program_link ? `
                        <div class="content-link">
                            <h4>Ссылка:</h4>
                            <a href="${program.program_link}" target="_blank" class="external-link">${program.program_link}</a>
                        </div>
                    ` : ''}
                </div>
                
                ${program.program_image ? `
                    <div class="content-image">
                        <h4>Изображение:</h4>
                        <img src="/api/programs/${program.id_program}/image" alt="Изображение программы" class="content-img">
                        <button class="download-btn" onclick="adminChat.downloadImage('/api/programs/${program.id_program}/image', 'program_${program.id_program}.png')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Скачать изображение
                        </button>
                    </div>
                ` : ''}
                
                ${filesData && filesData.length > 0 ? `
                    <div class="content-files">
                        <h4>Прикрепленные файлы:</h4>
                        <div class="files-list">
                            ${filesData.map((file, index) => `
                                <div class="file-item">
                                    <span class="file-name">Файл ${index + 1}</span>
                                    <button class="download-btn" onclick="adminChat.downloadFile('/api/programs/${program.id_program}/files/${file.id_program_file}', 'program_file_${file.id_program_file}')">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <polyline points="7,10 12,15 17,10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                        Скачать
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    async downloadImage(imageUrl, filename) {
        try {
            const response = await fetch(imageUrl);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert('Ошибка при скачивании изображения');
            }
        } catch (error) {
            console.error('Ошибка скачивания:', error);
            alert('Ошибка при скачивании изображения');
        }
    }

    async downloadFile(fileUrl, filename) {
        try {
            const response = await fetch(fileUrl);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert('Ошибка при скачивании файла');
            }
        } catch (error) {
            console.error('Ошибка скачивания:', error);
            alert('Ошибка при скачивании файла');
        }
    }

    // Фильтрация по типу контента
    filterByType(contentType) {
        // Если кликаем на уже активный фильтр - сбрасываем его
        if (this.currentFilter === contentType) {
            this.clearFilter();
            return;
        }

        this.currentFilter = contentType;
        this.updateFilterDisplay();
        this.renderMessages();
    }

    // Сброс фильтра
    clearFilter() {
        this.currentFilter = null;
        this.updateFilterDisplay();
        this.renderMessages();
    }

    // Обновление отображения активного фильтра
    updateFilterDisplay() {
        const statsContainer = document.getElementById('moderation-stats');
        if (!statsContainer) return;

        // Убираем активный класс со всех элементов
        const statItems = statsContainer.querySelectorAll('.stat-item');
        statItems.forEach(item => {
            item.classList.remove('active-filter');
        });

        // Добавляем активный класс к выбранному элементу
        if (this.currentFilter) {
            const activeItem = statsContainer.querySelector(`[data-filter="${this.currentFilter}"]`);
            if (activeItem) {
                activeItem.classList.add('active-filter');
            }
        }
    }

    setupEventListeners() {
        // Добавляем обработчики событий если нужно
        const refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadStats();
                this.loadMessages();
            });
        }

        // Добавляем обработчик для кнопки "Показать все"
        const showAllBtn = document.getElementById('show-all-btn');
        if (showAllBtn) {
            showAllBtn.addEventListener('click', () => {
                this.clearFilter();
            });
        }
    }

    startAutoRefresh() {
        // Автообновление каждые 30 секунд
        setInterval(() => {
            this.loadStats();
            this.loadMessages();
        }, 30000);
    }
}

// Функция выхода из админ-панели
async function logout() {
    if (confirm('Вы уверены, что хотите выйти из админ-панели?')) {
        try {
            const response = await fetch('/admin/logout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                // Перенаправляем на страницу входа
                window.location.href = '/admin-login';
            } else {
                alert('Ошибка при выходе');
            }
        } catch (error) {
            console.error('Ошибка выхода:', error);
            alert('Ошибка при выходе');
        }
    }
}

// Инициализация админ-чата при загрузке страницы
document.addEventListener('DOMContentLoaded', async () => {
    // Проверяем аутентификацию перед инициализацией
    try {
        const response = await fetch('/admin/check-auth');
        const data = await response.json();
        
        if (data.success && data.isAuthenticated) {
            // Пользователь аутентифицирован, инициализируем админ-чат
            window.adminChat = new AdminChat();
        } else {
            // Пользователь не аутентифицирован, перенаправляем на страницу входа
            window.location.href = '/admin-login';
        }
    } catch (error) {
        console.error('Ошибка проверки аутентификации:', error);
        // В случае ошибки также перенаправляем на страницу входа
        window.location.href = '/admin-login';
    }
});
