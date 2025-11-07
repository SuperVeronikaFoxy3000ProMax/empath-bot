class EmpathApp {
    constructor() {
        this.currentView = 'dashboard';
        this.userData = null;
        this.init();
    }

    async init() {
        try {
            // Инициализация MAX Bridge
            if (window.WebApp) {
                await this.initWebApp();
            } else {
                console.warn('MAX Bridge не обнаружен, работаем в standalone режиме');
                this.renderApp();
            }
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            this.renderApp();
        }
    }

    async initWebApp() {
        // Сообщаем MAX что приложение готово
        window.WebApp.ready();

        // Настраиваем кнопку назад
        window.WebApp.BackButton.isVisible = false;
        window.WebApp.BackButton.onClick(() => {
            this.handleBackButton();
        });

        // Подписываемся на события
        window.WebApp.onEvent('viewportChanged', (params) => {
            this.handleViewportChange(params);
        });

        // Получаем данные пользователя
        const initData = window.WebApp.initDataUnsafe;
        this.userData = {
            name: initData?.user?.first_name || 'Друг',
            photo: initData?.user?.photo_url,
            userId: initData?.user?.id,
            language: initData?.user?.language_code || 'ru'
        };

        // Включаем подтверждение закрытия
        window.WebApp.enableClosingConfirmation();

        this.renderApp();
    }

    handleBackButton() {
        if (this.currentView !== 'dashboard') {
            this.navigateTo('dashboard');
        }
    }

    handleViewportChange(params) {
        console.log('Viewport изменился:', params);
    }

    navigateTo(view) {
        this.currentView = view;
        
        // Управляем кнопкой назад
        if (window.WebApp) {
            window.WebApp.BackButton.isVisible = view !== 'dashboard';
        }

        this.renderApp();
        
        // Тактильная обратная связь
        if (window.WebApp && view !== this.currentView) {
            window.WebApp.HapticFeedback.impactOccurred('light');
        }
    }

    renderApp() {
        const appElement = document.getElementById('app');
        
        switch (this.currentView) {
            case 'mood':
                appElement.innerHTML = this.renderMoodTracker();
                break;
            case 'challenge':
                appElement.innerHTML = this.renderChallengeView();
                break;
            case 'meditations':
                appElement.innerHTML = this.renderMeditationsView();
                break;
            case 'knowledge':
                appElement.innerHTML = this.renderKnowledgeBase();
                break;
            case 'settings':
                appElement.innerHTML = this.renderSettings();
                break;
            default:
                appElement.innerHTML = this.renderDashboard();
        }

        // Добавляем анимацию
        appElement.classList.add('fade-in');
        setTimeout(() => appElement.classList.remove('fade-in'), 300);
    }

    renderDashboard() {
        return `
            <div class="app-container">
                <!-- Заголовок -->
                <div class="panel primary">
                    <div class="container">
                        <div class="flex column center gap-16">
                            <div class="avatar">
                                ${this.userData?.photo ? 
                                    `<img src="${this.userData.photo}" alt="${this.userData.name}" class="avatar">` :
                                    this.userData?.name?.charAt(0) || 'E'
                                }
                            </div>
                            <div class="flex column center">
                                <div class="headline medium-strong">Привет, ${this.userData?.name}!</div>
                                <div class="body medium">Как проходит твой день?</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Быстрые действия -->
                <div class="panel secondary">
                    <div class="cell-list island">
                        <div class="cell-header">Быстрый старт</div>
                        <div class="cell-simple" onclick="app.navigateTo('mood')">
                            <div class="before">📝</div>
                            <div class="content">
                                <div class="title">Отметить настроение</div>
                            </div>
                            <div class="chevron"></div>
                        </div>
                        <div class="cell-simple" onclick="app.navigateTo('challenge')">
                            <div class="before">🌿</div>
                            <div class="content">
                                <div class="title">Эко-челлендж</div>
                            </div>
                            <div class="chevron"></div>
                        </div>
                        <div class="cell-simple" onclick="app.navigateTo('meditations')">
                            <div class="before">🧘</div>
                            <div class="content">
                                <div class="title">Медитации</div>
                            </div>
                            <div class="chevron"></div>
                        </div>
                    </div>
                </div>

                <!-- Статистика -->
                <div class="panel secondary">
                    <div class="cell-list island">
                        <div class="cell-header">Моя статистика</div>
                        <div class="cell-simple">
                            <div class="before">📊</div>
                            <div class="content">
                                <div class="title">Записей в дневнике</div>
                            </div>
                            <div class="after">
                                <div class="counter">7</div>
                            </div>
                        </div>
                        <div class="cell-simple">
                            <div class="before">📚</div>
                            <div class="content">
                                <div class="title">Прочитано карточек</div>
                            </div>
                            <div class="after">
                                <div class="counter">3</div>
                            </div>
                        </div>
                        <div class="cell-simple">
                            <div class="before">🌱</div>
                            <div class="content">
                                <div class="title">Завершено челленджей</div>
                            </div>
                            <div class="after">
                                <div class="counter">2</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Советы дня -->
                <div class="panel secondary">
                    <div class="container">
                        <div class="headline" style="margin-bottom: 12px;">💡 Совет дня</div>
                        <div class="body medium">
                            Сделай паузу на 2 минуты. Закрой глаза и сосредоточься на дыхании. 
                            Это поможет снизить стресс и вернуть фокус.
                        </div>
                    </div>
                </div>

                ${this.renderNavigation()}
            </div>
        `;
    }

    renderMoodTracker() {
        return `
            <div class="app-container">
                <!-- Заголовок -->
                <div class="panel primary">
                    <div class="container">
                        <div class="flex between center">
                            <div class="title">📝 Дневник настроения</div>
                            <button class="btn tertiary" onclick="app.navigateTo('dashboard')">Назад</button>
                        </div>
                        <div class="body medium" style="margin-top: 8px;">
                            Как ты себя чувствуешь сегодня?
                        </div>
                    </div>
                </div>

                <!-- Выбор настроения -->
                <div class="panel secondary">
                    <div class="container">
                        <div class="mood-grid">
                            ${['😢', '😔', '😐', '😊', '😄'].map(emoji => `
                                <div class="mood-item" onclick="app.selectMood('${emoji}')">
                                    ${emoji}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Статистика настроений -->
                <div class="panel secondary">
                    <div class="cell-list island">
                        <div class="cell-simple" onclick="app.showMoodStats()">
                            <div class="before">📈</div>
                            <div class="content">
                                <div class="title">Недельная статистика</div>
                                <div class="subtitle">Просмотр тенденций настроения</div>
                            </div>
                            <div class="chevron"></div>
                        </div>
                        <div class="cell-simple" onclick="app.showMoodHistory()">
                            <div class="before">📔</div>
                            <div class="content">
                                <div class="title">История записей</div>
                                <div class="subtitle">Все предыдущие записи</div>
                            </div>
                            <div class="chevron"></div>
                        </div>
                    </div>
                </div>

                <!-- Советы по настроению -->
                <div class="panel secondary">
                    <div class="container">
                        <div class="headline" style="margin-bottom: 12px;">🌱 Советы</div>
                        <div class="body medium">
                            Регулярное отслеживание настроения помогает лучше понимать 
                            свои эмоции и находить закономерности.
                        </div>
                    </div>
                </div>

                ${this.renderNavigation()}
            </div>
        `;
    }

    renderChallengeView() {
        const challenges = [
            { day: 1, title: 'Детокс от шума', description: 'День без тревожных новостей', completed: true },
            { day: 2, title: 'Меньше = легче', description: '3 простых эко-действия', completed: true },
            { day: 3, title: 'Цифровой отдых', description: '2 часа без телефона', completed: false },
            { day: 4, title: 'Эко-день для души', description: 'Практики осознанности', completed: false },
            { day: 5, title: 'Поделись добром', description: 'Поддержка других', completed: false }
        ];

        return `
            <div class="app-container">
                <!-- Заголовок -->
                <div class="panel primary">
                    <div class="container">
                        <div class="flex between center">
                            <div class="title">🌿 Эко-эмпатия челлендж</div>
                            <button class="btn tertiary" onclick="app.navigateTo('dashboard')">Назад</button>
                        </div>
                        <div class="body medium" style="margin-top: 8px;">
                            5 дней гармонии с собой и природой
                        </div>
                    </div>
                </div>

                <!-- Прогресс -->
                <div class="panel secondary">
                    <div class="container">
                        <div class="flex between" style="margin-bottom: 8px;">
                            <div class="body medium">Прогресс недели</div>
                            <div class="caption">2/5 завершено</div>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: 40%"></div>
                        </div>
                    </div>
                </div>

                <!-- Список челленджей -->
                <div class="panel secondary">
                    <div class="cell-list island">
                        ${challenges.map(challenge => `
                            <div class="cell-simple" onclick="app.startChallenge(${challenge.day})">
                                <div class="before">${challenge.completed ? '✅' : '📅'}</div>
                                <div class="content">
                                    <div class="title">День ${challenge.day}: ${challenge.title}</div>
                                    <div class="subtitle">${challenge.description}</div>
                                </div>
                                ${!challenge.completed ? '<div class="chevron"></div>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Награды -->
                <div class="panel secondary">
                    <div class="container">
                        <div class="headline" style="margin-bottom: 12px;">🏆 Награды</div>
                        <div class="grid cols-3 gap-12">
                            <div class="flex column center gap-4">
                                <div style="font-size: 24px;">🌱</div>
                                <div class="caption" style="text-align: center;">Семечко роста</div>
                            </div>
                            <div class="flex column center gap-4">
                                <div style="font-size: 24px; opacity: 0.3;">💪</div>
                                <div class="caption" style="text-align: center; opacity: 0.3;">Стойкий солдатик</div>
                            </div>
                            <div class="flex column center gap-4">
                                <div style="font-size: 24px; opacity: 0.3;">🎯</div>
                                <div class="caption" style="text-align: center; opacity: 0.3;">Неделя осознанности</div>
                            </div>
                        </div>
                    </div>
                </div>

                ${this.renderNavigation()}
            </div>
        `;
    }

    renderMeditationsView() {
        const meditations = [
            { id: 1, name: '💤 Перед сном', duration: '10 мин', type: 'sleep' },
            { id: 2, name: '🌪️ Против тревоги', duration: '5 мин', type: 'anxiety' },
            { id: 3, name: '🌊 Расслабляющая', duration: '7 мин', type: 'relax' },
            { id: 4, name: '🎯 На концентрацию', duration: '8 мин', type: 'focus' }
        ];

        return `
            <div class="app-container">
                <!-- Заголовок -->
                <div class="panel primary">
                    <div class="container">
                        <div class="flex between center">
                            <div class="title">🧘 Медитации</div>
                            <button class="btn tertiary" onclick="app.navigateTo('dashboard')">Назад</button>
                        </div>
                        <div class="body medium" style="margin-top: 8px;">
                            Выбери практику для гармонии
                        </div>
                    </div>
                </div>

                <!-- Список медитаций -->
                <div class="panel secondary">
                    <div class="cell-list island">
                        ${meditations.map(meditation => `
                            <div class="cell-simple" onclick="app.startMeditation(${meditation.id})">
                                <div class="before">🎧</div>
                                <div class="content">
                                    <div class="title">${meditation.name}</div>
                                    <div class="subtitle">${meditation.duration}</div>
                                </div>
                                <div class="chevron"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Статистика медитаций -->
                <div class="panel secondary">
                    <div class="container">
                        <div class="grid cols-2 gap-16">
                            <div class="flex column center">
                                <div class="title">12</div>
                                <div class="caption">Всего сессий</div>
                            </div>
                            <div class="flex column center">
                                <div class="title">1ч 24м</div>
                                <div class="caption">Общее время</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Советы -->
                <div class="panel secondary">
                    <div class="container">
                        <div class="headline" style="margin-bottom: 12px;">💡 Рекомендации</div>
                        <div class="body medium">
                            Регулярная практика медитации помогает снизить стресс, 
                            улучшить сон и повысить осознанность.
                        </div>
                    </div>
                </div>

                ${this.renderNavigation()}
            </div>
        `;
    }

    renderKnowledgeBase() {
        return `
            <div class="app-container">
                <div class="panel primary">
                    <div class="container">
                        <div class="flex between center">
                            <div class="title">📚 База знаний</div>
                            <button class="btn tertiary" onclick="app.navigateTo('dashboard')">Назад</button>
                        </div>
                    </div>
                </div>
                <div class="panel secondary">
                    <div class="container">
                        <div class="body medium">
                            Раздел в разработке...
                        </div>
                    </div>
                </div>
                ${this.renderNavigation()}
            </div>
        `;
    }

    renderSettings() {
        return `
            <div class="app-container">
                <div class="panel primary">
                    <div class="container">
                        <div class="flex between center">
                            <div class="title">⚙️ Настройки</div>
                            <button class="btn tertiary" onclick="app.navigateTo('dashboard')">Назад</button>
                        </div>
                    </div>
                </div>
                <div class="panel secondary">
                    <div class="container">
                        <div class="body medium">
                            Раздел в разработке...
                        </div>
                    </div>
                </div>
                ${this.renderNavigation()}
            </div>
        `;
    }

    renderNavigation() {
        const views = [
            { id: 'dashboard', icon: '📊', label: 'Главная' },
            { id: 'mood', icon: '📝', label: 'Настроение' },
            { id: 'challenge', icon: '🌿', label: 'Челлендж' },
            { id: 'meditations', icon: '🧘', label: 'Медитации' },
            { id: 'knowledge', icon: '📚', label: 'Знания' }
        ];

        return `
            <div class="navigation">
                <div class="grid cols-5 gap-8">
                    ${views.map(view => `
                        <button class="tool-btn ${this.currentView === view.id ? 'active' : ''}" 
                                onclick="app.navigateTo('${view.id}')">
                            <div class="icon">${view.icon}</div>
                            <div class="text">${view.label}</div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Методы взаимодействия
    selectMood(emoji) {
        if (window.WebApp) {
            window.WebApp.HapticFeedback.impactOccurred('medium');
        }
        
        // Здесь будет логика сохранения настроения
        console.log('Выбрано настроение:', emoji);
        
        // Временное уведомление
        alert(`Настроение ${emoji} сохранено!`);
    }

    startChallenge(day) {
        if (window.WebApp) {
            window.WebApp.HapticFeedback.impactOccurred('light');
        }
        console.log('Начало челленджа дня:', day);
    }

    startMeditation(id) {
        if (window.WebApp) {
            window.WebApp.HapticFeedback.impactOccurred('soft');
        }
        console.log('Запуск медитации:', id);
        
        // Здесь будет запуск медитации с аудио
        alert('Медитация запускается...');
    }

    showMoodStats() {
        if (window.WebApp) {
            window.WebApp.HapticFeedback.notificationOccurred('success');
        }
        alert('Открывается статистика настроений');
    }

    showMoodHistory() {
        if (window.WebApp) {
            window.WebApp.HapticFeedback.notificationOccurred('success');
        }
        alert('Открывается история настроений');
    }
}

// Инициализация приложения
const app = new EmpathApp();

// Глобальные методы для onclick
window.app = app;