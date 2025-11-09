class EmpathApp {
    constructor() {
        this.currentView = 'dashboard';
        this.userData = null;
        this.eventListenersAttached = false;
        // ВАЖНО: Замените на реальный URL вашего бота API
        // Например: 'https://your-bot-api.com' или используйте переменную окружения
        this.apiBaseUrl = 'https://api.example.com';
        this.init();
    }

    // Методы работы с данными
    async loadData() {
        try {
            // Загружаем из localStorage
            const localMoods = this.getLocalMoods();
            const localChallenges = this.getLocalChallenges();
            const localMeditations = this.getLocalMeditations();

            // Синхронизируем с ботом
            if (this.userData?.userId) {
                await this.syncWithBot();
            }

            return {
                moods: this.getLocalMoods(),
                challenges: this.getLocalChallenges(),
                meditations: this.getLocalMeditations()
            };
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            return {
                moods: this.getLocalMoods(),
                challenges: this.getLocalChallenges(),
                meditations: this.getLocalMeditations()
            };
        }
    }

    getLocalMoods() {
        const stored = localStorage.getItem('empath_moods');
        return stored ? JSON.parse(stored) : [];
    }

    saveLocalMoods(moods) {
        localStorage.setItem('empath_moods', JSON.stringify(moods));
    }

    getLocalChallenges() {
        const stored = localStorage.getItem('empath_challenges');
        return stored ? JSON.parse(stored) : [];
    }

    saveLocalChallenges(challenges) {
        localStorage.setItem('empath_challenges', JSON.stringify(challenges));
    }

    getLocalMeditations() {
        const stored = localStorage.getItem('empath_meditations');
        return stored ? JSON.parse(stored) : [];
    }

    saveLocalMeditations(meditations) {
        localStorage.setItem('empath_meditations', JSON.stringify(meditations));
    }

    // API методы для синхронизации с ботом
    async syncWithBot() {
        if (!this.userData?.userId) return;

        try {
            // Отправляем данные на сервер
            const moods = this.getLocalMoods();
            const challenges = this.getLocalChallenges();
            const meditations = this.getLocalMeditations();

            const response = await fetch(`${this.apiBaseUrl}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.userData.userId,
                    moods: moods,
                    challenges: challenges,
                    meditations: meditations
                })
            });

            if (response.ok) {
                const data = await response.json();
                // Обновляем локальные данные данными с сервера
                if (data.moods) this.saveLocalMoods(data.moods);
                if (data.challenges) this.saveLocalChallenges(data.challenges);
                if (data.meditations) this.saveLocalMeditations(data.meditations);
            }
        } catch (error) {
            console.error('Ошибка синхронизации с ботом:', error);
            // Продолжаем работу с локальными данными
        }
    }

    async sendToBot(endpoint, data) {
        if (!this.userData?.userId) return;

        try {
            const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.userData.userId,
                    ...data
                })
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error(`Ошибка отправки данных на ${endpoint}:`, error);
        }
        return null;
    }

    async init() {
        // Привязываем обработчики событий сразу
        this.attachEventListeners();
        
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
        if (window.WebApp.BackButton) {
            window.WebApp.BackButton.hide();
            window.WebApp.BackButton.onClick(() => {
                this.handleBackButton();
            });
        }

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

        // Загружаем данные
        await this.loadData();

        this.renderApp();
    }

    handleBackButton() {
        if (this.currentView === 'moodStats' || this.currentView === 'moodHistory') {
            this.navigateTo('mood');
        } else if (this.currentView !== 'dashboard') {
            this.navigateTo('dashboard');
        }
    }

    handleViewportChange(params) {
        console.log('Viewport изменился:', params);
    }

    navigateTo(view) {
        const previousView = this.currentView;
        this.currentView = view;
        
        // Управляем кнопкой назад
        if (window.WebApp && window.WebApp.BackButton) {
            const mainViews = ['dashboard', 'mood', 'challenge', 'meditations', 'knowledge', 'settings'];
            if (mainViews.includes(view)) {
                window.WebApp.BackButton.hide();
            } else {
                window.WebApp.BackButton.show();
            }
        }

        this.renderApp();
        
        // Тактильная обратная связь
        if (window.WebApp && view !== previousView) {
            window.WebApp.HapticFeedback.impactOccurred('light');
        }
    }

    renderApp() {
        const appElement = document.getElementById('app');
        if (!appElement) {
            console.error('Элемент app не найден!');
            return;
        }
        
        switch (this.currentView) {
            case 'mood':
                appElement.innerHTML = this.renderMoodTracker();
                break;
            case 'moodStats':
                appElement.innerHTML = this.renderMoodStats();
                break;
            case 'moodHistory':
                appElement.innerHTML = this.renderMoodHistory();
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
        
        // Привязываем обработчики событий после рендера
        this.attachEventListeners();
    }
    
    attachEventListeners() {
        // Привязываем обработчик только один раз на document
        if (this.eventListenersAttached) {
            console.log('Event listeners already attached');
            return;
        }
        
        // Ждем загрузки DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.attachEventListeners();
            });
            return;
        }
        
        // Используем делегирование событий на document
        const clickHandler = (e) => {
            this.handleClick(e);
        };
        
        document.addEventListener('click', clickHandler, true); // Используем capture phase
        
        // Также пробуем на body, если он существует
        if (document.body) {
            document.body.addEventListener('click', clickHandler, true);
        }
        
        // И на window для надежности
        window.addEventListener('click', clickHandler, true);
        
        console.log('Event listeners attached to document, body and window');
        this.eventListenersAttached = true;
    }

    handleClick(e) {
        // Для отладки - выводим информацию о клике
        console.log('Click event fired!', e.target, e.target.tagName);
        
        // Ищем элемент с data-action используя closest
        let target = e.target.closest('[data-action]');
        
        // Если не нашли через closest, проверяем сам элемент и его родители вручную
        if (!target) {
            let el = e.target;
            while (el && el !== document.body) {
                if (el.hasAttribute && el.hasAttribute('data-action')) {
                    target = el;
                    break;
                }
                el = el.parentElement;
            }
        }
        
        if (!target) {
            console.log('No data-action found');
            return;
        }
        
        console.log('Found target with data-action:', target);
        return this.processClick(target, e);
    }

    processClick(target, e) {
        // Предотвращаем повторную обработку
        if (e.processed) {
            return;
        }
        e.processed = true;
        
        // Проверяем, что клик был внутри app
        const appElement = document.getElementById('app');
        if (!appElement || !appElement.contains(target)) {
            console.log('Click outside app element');
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const action = target.getAttribute('data-action');
        const params = target.getAttribute('data-params');
        
        console.log('Processing click - action:', action, 'params:', params, 'target:', target); // Для отладки
        
        try {
            if (action === 'navigate' && params) {
                console.log('Navigating to:', params);
                this.navigateTo(params);
            } else if (action === 'selectMood' && params) {
                console.log('Selecting mood:', params);
                this.selectMood(params);
            } else if (action === 'startChallenge' && params) {
                console.log('Starting challenge:', params);
                this.startChallenge(parseInt(params));
            } else if (action === 'startMeditation' && params) {
                console.log('Starting meditation:', params);
                this.startMeditation(parseInt(params));
            } else if (action === 'showMoodStats') {
                console.log('Showing mood stats');
                this.showMoodStats();
            } else if (action === 'showMoodHistory') {
                console.log('Showing mood history');
                this.showMoodHistory();
            } else {
                console.warn('Unknown action:', action, 'params:', params);
            }
        } catch (error) {
            console.error('Ошибка при обработке клика:', error);
            console.error(error.stack);
            alert('Ошибка: ' + error.message);
        }
    }

    renderDashboard() {
        const moods = this.getLocalMoods();
        const challenges = this.getLocalChallenges();
        const meditations = this.getLocalMeditations();
        
        const completedChallenges = challenges.filter(c => c.completed).length;
        const totalMeditationTime = meditations.reduce((sum, m) => sum + (m.duration || 0), 0);
        const meditationMinutes = Math.floor(totalMeditationTime / 60);
        const meditationHours = Math.floor(meditationMinutes / 60);
        const meditationTimeStr = meditationHours > 0 
            ? `${meditationHours}ч ${meditationMinutes % 60}м` 
            : `${meditationMinutes}м`;

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
                        <div class="cell-simple" data-action="navigate" data-params="mood">
                            <div class="before">📝</div>
                            <div class="content">
                                <div class="title">Отметить настроение</div>
                            </div>
                            <div class="chevron"></div>
                        </div>
                        <div class="cell-simple" data-action="navigate" data-params="challenge">
                            <div class="before">🌿</div>
                            <div class="content">
                                <div class="title">Эко-челлендж</div>
                            </div>
                            <div class="chevron"></div>
                        </div>
                        <div class="cell-simple" data-action="navigate" data-params="meditations">
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
                                <div class="counter">${moods.length}</div>
                            </div>
                        </div>
                        <div class="cell-simple">
                            <div class="before">🌱</div>
                            <div class="content">
                                <div class="title">Завершено челленджей</div>
                            </div>
                            <div class="after">
                                <div class="counter">${completedChallenges}</div>
                            </div>
                        </div>
                        <div class="cell-simple">
                            <div class="before">🧘</div>
                            <div class="content">
                                <div class="title">Время медитаций</div>
                            </div>
                            <div class="after">
                                <div class="counter">${meditationTimeStr}</div>
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
                            <button class="btn tertiary" data-action="navigate" data-params="dashboard">Назад</button>
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
                                <div class="mood-item" data-action="selectMood" data-params="${emoji}">
                                    ${emoji}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Статистика настроений -->
                <div class="panel secondary">
                    <div class="cell-list island">
                        <div class="cell-simple" data-action="showMoodStats">
                            <div class="before">📈</div>
                            <div class="content">
                                <div class="title">Недельная статистика</div>
                                <div class="subtitle">Просмотр тенденций настроения</div>
                            </div>
                            <div class="chevron"></div>
                        </div>
                        <div class="cell-simple" data-action="showMoodHistory">
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
        const defaultChallenges = [
            { day: 1, title: 'Детокс от шума', description: 'День без тревожных новостей' },
            { day: 2, title: 'Меньше = легче', description: '3 простых эко-действия' },
            { day: 3, title: 'Цифровой отдых', description: '2 часа без телефона' },
            { day: 4, title: 'Эко-день для души', description: 'Практики осознанности' },
            { day: 5, title: 'Поделись добром', description: 'Поддержка других' }
        ];

        const savedChallenges = this.getLocalChallenges();
        const challenges = defaultChallenges.map(ch => {
            const saved = savedChallenges.find(sc => sc.day === ch.day);
            return {
                ...ch,
                completed: saved?.completed || false,
                completedDate: saved?.completedDate,
                startDate: saved?.startDate
            };
        });

        const completedCount = challenges.filter(c => c.completed).length;
        const progressPercent = (completedCount / challenges.length) * 100;

        // Статистика
        const totalChallenges = savedChallenges.filter(c => c.completed).length;
        const streakDays = this.calculateChallengeStreak(savedChallenges);
        const thisWeekChallenges = this.getThisWeekChallenges(savedChallenges);

        return `
            <div class="app-container">
                <!-- Заголовок -->
                <div class="panel primary">
                    <div class="container">
                        <div class="flex between center">
                            <div class="title">🌿 Эко-эмпатия челлендж</div>
                            <button class="btn tertiary" data-action="navigate" data-params="dashboard">Назад</button>
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
                            <div class="caption">${completedCount}/${challenges.length} завершено</div>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercent}%"></div>
                        </div>
                    </div>
                </div>

                <!-- Статистика -->
                <div class="panel secondary">
                    <div class="container">
                        <div class="headline" style="margin-bottom: 12px;">📊 Статистика</div>
                        <div class="grid cols-3 gap-12">
                            <div class="flex column center">
                                <div class="title">${totalChallenges}</div>
                                <div class="caption" style="text-align: center;">Всего завершено</div>
                            </div>
                            <div class="flex column center">
                                <div class="title">${streakDays}</div>
                                <div class="caption" style="text-align: center;">Дней подряд</div>
                            </div>
                            <div class="flex column center">
                                <div class="title">${thisWeekChallenges}</div>
                                <div class="caption" style="text-align: center;">На этой неделе</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Список челленджей -->
                <div class="panel secondary">
                    <div class="cell-list island">
                        ${challenges.map(challenge => `
                            <div class="cell-simple" data-action="startChallenge" data-params="${challenge.day}">
                                <div class="before">${challenge.completed ? '✅' : '📅'}</div>
                                <div class="content">
                                    <div class="title">День ${challenge.day}: ${challenge.title}</div>
                                    <div class="subtitle">${challenge.description}</div>
                                    ${challenge.completedDate ? `
                                        <div class="caption" style="margin-top: 4px;">
                                            Завершено: ${new Date(challenge.completedDate).toLocaleDateString('ru-RU')}
                                        </div>
                                    ` : ''}
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
                                <div style="font-size: 24px; ${completedCount >= 1 ? '' : 'opacity: 0.3;'}">🌱</div>
                                <div class="caption" style="text-align: center; ${completedCount >= 1 ? '' : 'opacity: 0.3;'}">Семечко роста</div>
                            </div>
                            <div class="flex column center gap-4">
                                <div style="font-size: 24px; ${completedCount >= 3 ? '' : 'opacity: 0.3;'}">💪</div>
                                <div class="caption" style="text-align: center; ${completedCount >= 3 ? '' : 'opacity: 0.3;'}">Стойкий солдатик</div>
                            </div>
                            <div class="flex column center gap-4">
                                <div style="font-size: 24px; ${completedCount >= 5 ? '' : 'opacity: 0.3;'}">🎯</div>
                                <div class="caption" style="text-align: center; ${completedCount >= 5 ? '' : 'opacity: 0.3;'}">Неделя осознанности</div>
                            </div>
                        </div>
                    </div>
                </div>

                ${this.renderNavigation()}
            </div>
        `;
    }

    calculateChallengeStreak(challenges) {
        if (challenges.length === 0) return 0;
        const completed = challenges.filter(c => c.completed)
            .map(c => new Date(c.completedDate || c.startDate))
            .sort((a, b) => b - a);
        
        if (completed.length === 0) return 0;
        
        let streak = 1;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < completed.length - 1; i++) {
            const diff = Math.floor((completed[i] - completed[i + 1]) / (1000 * 60 * 60 * 24));
            if (diff === 1) streak++;
            else break;
        }
        
        return streak;
    }

    getThisWeekChallenges(challenges) {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
        startOfWeek.setHours(0, 0, 0, 0);
        
        return challenges.filter(c => {
            if (!c.completedDate) return false;
            const date = new Date(c.completedDate);
            return date >= startOfWeek;
        }).length;
    }

    renderMeditationsView() {
        const defaultMeditations = [
            { id: 1, name: '💤 Перед сном', duration: 10, type: 'sleep' },
            { id: 2, name: '🌪️ Против тревоги', duration: 5, type: 'anxiety' },
            { id: 3, name: '🌊 Расслабляющая', duration: 7, type: 'relax' },
            { id: 4, name: '🎯 На концентрацию', duration: 8, type: 'focus' }
        ];

        const savedMeditations = this.getLocalMeditations();
        const totalSessions = savedMeditations.length;
        const totalTime = savedMeditations.reduce((sum, m) => sum + (m.duration || 0), 0);
        const totalMinutes = Math.floor(totalTime / 60);
        const totalHours = Math.floor(totalMinutes / 60);
        const timeStr = totalHours > 0 
            ? `${totalHours}ч ${totalMinutes % 60}м` 
            : `${totalMinutes}м`;

        const thisWeekMeditations = this.getThisWeekMeditations(savedMeditations);
        const averageSessionTime = totalSessions > 0 
            ? Math.floor(totalTime / totalSessions / 60) 
            : 0;

        return `
            <div class="app-container">
                <!-- Заголовок -->
                <div class="panel primary">
                    <div class="container">
                        <div class="flex between center">
                            <div class="title">🧘 Медитации</div>
                            <button class="btn tertiary" data-action="navigate" data-params="dashboard">Назад</button>
                        </div>
                        <div class="body medium" style="margin-top: 8px;">
                            Выбери практику для гармонии
                        </div>
                    </div>
                </div>

                <!-- Статистика медитаций -->
                <div class="panel secondary">
                    <div class="container">
                        <div class="headline" style="margin-bottom: 12px;">📊 Статистика</div>
                        <div class="grid cols-2 gap-16">
                            <div class="flex column center">
                                <div class="title">${totalSessions}</div>
                                <div class="caption">Всего сессий</div>
                            </div>
                            <div class="flex column center">
                                <div class="title">${timeStr}</div>
                                <div class="caption">Общее время</div>
                            </div>
                        </div>
                        <div class="grid cols-2 gap-16" style="margin-top: 16px;">
                            <div class="flex column center">
                                <div class="title">${thisWeekMeditations}</div>
                                <div class="caption">На этой неделе</div>
                            </div>
                            <div class="flex column center">
                                <div class="title">${averageSessionTime}м</div>
                                <div class="caption">Средняя сессия</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Список медитаций -->
                <div class="panel secondary">
                    <div class="cell-list island">
                        ${defaultMeditations.map(meditation => {
                            const sessionCount = savedMeditations.filter(m => m.meditationId === meditation.id).length;
                            return `
                                <div class="cell-simple" data-action="startMeditation" data-params="${meditation.id}">
                                    <div class="before">🎧</div>
                                    <div class="content">
                                        <div class="title">${meditation.name}</div>
                                        <div class="subtitle">${meditation.duration} минут</div>
                                        ${sessionCount > 0 ? `
                                            <div class="caption" style="margin-top: 4px;">
                                                Завершено сессий: ${sessionCount}
                                            </div>
                                        ` : ''}
                                    </div>
                                    <div class="chevron"></div>
                                </div>
                            `;
                        }).join('')}
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

    getThisWeekMeditations(meditations) {
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
        startOfWeek.setHours(0, 0, 0, 0);
        
        return meditations.filter(m => {
            if (!m.date) return false;
            const date = new Date(m.date);
            return date >= startOfWeek;
        }).length;
    }

    renderKnowledgeBase() {
        return `
            <div class="app-container">
                <div class="panel primary">
                    <div class="container">
                        <div class="flex between center">
                            <div class="title">📚 База знаний</div>
                            <button class="btn tertiary" data-action="navigate" data-params="dashboard">Назад</button>
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
                            <button class="btn tertiary" data-action="navigate" data-params="dashboard">Назад</button>
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
                                data-action="navigate" data-params="${view.id}">
                            <div class="icon">${view.icon}</div>
                            <div class="text">${view.label}</div>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // Методы взаимодействия
    async selectMood(emoji) {
        if (window.WebApp) {
            window.WebApp.HapticFeedback.impactOccurred('medium');
        }
        
        const moodValue = this.getMoodValue(emoji);
        const moodEntry = {
            emoji: emoji,
            value: moodValue,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };

        // Сохраняем локально
        const moods = this.getLocalMoods();
        moods.push(moodEntry);
        this.saveLocalMoods(moods);

        // Отправляем на сервер
        await this.sendToBot('/mood', { mood: moodEntry });

        // Показываем уведомление
        if (window.WebApp) {
            window.WebApp.showAlert('Настроение сохранено!');
        } else {
            alert(`Настроение ${emoji} сохранено!`);
        }

        // Обновляем отображение
        this.renderApp();
    }

    getMoodValue(emoji) {
        const moodMap = {
            '😢': 1,
            '😔': 2,
            '😐': 3,
            '😊': 4,
            '😄': 5
        };
        return moodMap[emoji] || 3;
    }

    renderMoodStats() {
        const moods = this.getLocalMoods();
        const weekData = this.getWeekMoodData(moods);
        const averageMood = this.calculateAverageMood(weekData);

        return `
            <div class="app-container">
                <div class="panel primary">
                    <div class="container">
                        <div class="flex between center">
                            <div class="title">📈 Недельная статистика</div>
                            <button class="btn tertiary" data-action="navigate" data-params="mood">Назад</button>
                        </div>
                    </div>
                </div>

                <div class="panel secondary">
                    <div class="container">
                        <div class="flex column center gap-16" style="padding: 24px 0;">
                            <div class="headline">Среднее настроение</div>
                            <div style="font-size: 48px;">${this.getMoodEmojiByValue(Math.round(averageMood))}</div>
                            <div class="body medium">${averageMood.toFixed(1)} / 5.0</div>
                        </div>
                    </div>
                </div>

                <div class="panel secondary">
                    <div class="container">
                        <div class="headline" style="margin-bottom: 16px;">График недели</div>
                        <div class="mood-chart">
                            ${weekData.map((day, index) => {
                                const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
                                const height = day.count > 0 ? (day.avg / 5 * 100) : 0;
                                return `
                                    <div class="chart-day">
                                        <div class="chart-bar-container">
                                            <div class="chart-bar" style="height: ${height}%"></div>
                                        </div>
                                        <div class="chart-label">${dayNames[index]}</div>
                                        <div class="chart-emoji">${day.count > 0 ? this.getMoodEmojiByValue(Math.round(day.avg)) : '—'}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <div class="panel secondary">
                    <div class="container">
                        <div class="grid cols-2 gap-16">
                            <div class="flex column center">
                                <div class="title">${moods.length}</div>
                                <div class="caption">Всего записей</div>
                            </div>
                            <div class="flex column center">
                                <div class="title">${weekData.filter(d => d.count > 0).length}</div>
                                <div class="caption">Дней с записями</div>
                            </div>
                        </div>
                    </div>
                </div>

                ${this.renderNavigation()}
            </div>
        `;
    }

    renderMoodHistory() {
        const moods = this.getLocalMoods();
        const sortedMoods = [...moods].sort((a, b) => new Date(b.date) - new Date(a.date));

        return `
            <div class="app-container">
                <div class="panel primary">
                    <div class="container">
                        <div class="flex between center">
                            <div class="title">📔 История записей</div>
                            <button class="btn tertiary" data-action="navigate" data-params="mood">Назад</button>
                        </div>
                    </div>
                </div>

                <div class="panel secondary">
                    <div class="cell-list island">
                        ${sortedMoods.length === 0 ? `
                            <div class="cell-simple">
                                <div class="content">
                                    <div class="title">Пока нет записей</div>
                                    <div class="subtitle">Начни отслеживать своё настроение</div>
                                </div>
                            </div>
                        ` : sortedMoods.map(mood => {
                            const date = new Date(mood.date);
                            const dateStr = date.toLocaleDateString('ru-RU', { 
                                day: 'numeric', 
                                month: 'long', 
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            return `
                                <div class="cell-simple">
                                    <div class="before" style="font-size: 32px;">${mood.emoji}</div>
                                    <div class="content">
                                        <div class="title">${dateStr}</div>
                                        <div class="subtitle">Настроение: ${this.getMoodLabel(mood.value)}</div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                ${this.renderNavigation()}
            </div>
        `;
    }

    getWeekMoodData(moods) {
        const weekData = Array(7).fill(null).map(() => ({ count: 0, sum: 0, avg: 0 }));
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1));
        startOfWeek.setHours(0, 0, 0, 0);

        moods.forEach(mood => {
            const moodDate = new Date(mood.date);
            if (moodDate >= startOfWeek) {
                const dayIndex = (moodDate.getDay() + 6) % 7; // Понедельник = 0
                if (dayIndex < 7) {
                    weekData[dayIndex].count++;
                    weekData[dayIndex].sum += mood.value;
                    weekData[dayIndex].avg = weekData[dayIndex].sum / weekData[dayIndex].count;
                }
            }
        });

        return weekData;
    }

    calculateAverageMood(weekData) {
        const daysWithData = weekData.filter(d => d.count > 0);
        if (daysWithData.length === 0) return 0;
        const total = daysWithData.reduce((sum, d) => sum + d.avg, 0);
        return total / daysWithData.length;
    }

    getMoodEmojiByValue(value) {
        const emojiMap = {
            1: '😢',
            2: '😔',
            3: '😐',
            4: '😊',
            5: '😄'
        };
        return emojiMap[value] || '😐';
    }

    getMoodLabel(value) {
        const labels = {
            1: 'Очень плохо',
            2: 'Плохо',
            3: 'Нормально',
            4: 'Хорошо',
            5: 'Отлично'
        };
        return labels[value] || 'Неизвестно';
    }

    async startChallenge(day) {
        if (window.WebApp) {
            window.WebApp.HapticFeedback.impactOccurred('light');
        }

        const challenges = this.getLocalChallenges();
        let challenge = challenges.find(c => c.day === day);
        
        if (!challenge) {
            challenge = {
                day: day,
                startDate: new Date().toISOString(),
                completed: false
            };
            challenges.push(challenge);
        }

        // Отмечаем как завершенный
        if (!challenge.completed) {
            challenge.completed = true;
            challenge.completedDate = new Date().toISOString();
        }

        this.saveLocalChallenges(challenges);

        // Отправляем на сервер
        await this.sendToBot('/challenge', { challenge: challenge });

        if (window.WebApp) {
            window.WebApp.showAlert('Челлендж завершен!');
        } else {
            alert('Челлендж завершен!');
        }

        this.renderApp();
    }

    async startMeditation(id) {
        if (window.WebApp) {
            window.WebApp.HapticFeedback.impactOccurred('soft');
        }

        const meditations = [
            { id: 1, name: '💤 Перед сном', duration: 10, type: 'sleep' },
            { id: 2, name: '🌪️ Против тревоги', duration: 5, type: 'anxiety' },
            { id: 3, name: '🌊 Расслабляющая', duration: 7, type: 'relax' },
            { id: 4, name: '🎯 На концентрацию', duration: 8, type: 'focus' }
        ];

        const meditation = meditations.find(m => m.id === id);
        if (!meditation) return;

        // Запускаем медитацию (здесь можно добавить реальный плеер)
        if (window.WebApp) {
            window.WebApp.showAlert(`Медитация "${meditation.name}" запускается...`);
        } else {
            alert(`Медитация "${meditation.name}" запускается...`);
        }

        // Симулируем завершение медитации через заданное время
        setTimeout(async () => {
            const meditationEntry = {
                meditationId: id,
                name: meditation.name,
                duration: meditation.duration * 60, // в секундах
                type: meditation.type,
                date: new Date().toISOString(),
                timestamp: Date.now()
            };

            // Сохраняем локально
            const savedMeditations = this.getLocalMeditations();
            savedMeditations.push(meditationEntry);
            this.saveLocalMeditations(savedMeditations);

            // Отправляем на сервер
            await this.sendToBot('/meditation', { meditation: meditationEntry });

            if (window.WebApp) {
                window.WebApp.showAlert('Медитация завершена!');
            }

            // Обновляем отображение
            this.renderApp();
        }, meditation.duration * 1000); // Для демо используем реальное время, в продакшене это будет управляться плеером
    }

    showMoodStats() {
        if (window.WebApp) {
            window.WebApp.HapticFeedback.notificationOccurred('success');
        }
        this.navigateTo('moodStats');
    }

    showMoodHistory() {
        if (window.WebApp) {
            window.WebApp.HapticFeedback.notificationOccurred('success');
        }
        this.navigateTo('moodHistory');
    }
}

// Инициализация приложения
const app = new EmpathApp();

// Глобальные методы для onclick
window.app = app;