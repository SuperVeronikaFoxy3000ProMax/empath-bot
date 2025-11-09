class EmpathApp {
    constructor() {
        this.currentView = 'dashboard';
        this.userData = null;
        this.eventListenersAttached = false;
        // ВАЖНО: Замените на реальный URL вашего бота API
        // Например: 'https://your-bot-api.com' или используйте переменную окружения
        this.apiBaseUrl = 'https://api.example.com';
        this.audioPlayer = null;
        this.currentMeditation = null;
        this.currentKnowledgeItem = null;
        this.currentChallenge = null;
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

            // Подготавливаем данные челленджей для отправки (только важные поля)
            // Включаем все челленджи, включая отмененные (completed: false)
            const challengesToSync = challenges.map(c => {
                // Определяем, был ли челлендж отменен
                // Отмененный = был начат (есть startDate), но не завершен (completed: false) 
                // и нет даты завершения, но при этом он был в списке (значит мог быть завершен ранее)
                const isCancelled = c.startDate && !c.completed && !c.completedDate;
                
                return {
                    day: c.day,
                    title: c.title,
                    description: c.description,
                    completed: c.completed || false,
                    completedDate: c.completedDate || null, // Явно указываем null для отмененных
                    startDate: c.startDate || null,
                    cancelled: isCancelled || false // Флаг отмены
                };
            });

            const response = await fetch(`${this.apiBaseUrl}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.userData.userId,
                    moods: moods,
                    challenges: challengesToSync,
                    meditations: meditations
                })
            });

            if (response.ok) {
                const data = await response.json();
                
                // Обновляем локальные данные данными с сервера
                if (data.moods && Array.isArray(data.moods)) {
                    this.saveLocalMoods(data.moods);
                }
                
                if (data.challenges && Array.isArray(data.challenges)) {
                    // Объединяем данные с сервера с локальными шаблонами
                    const mergedChallenges = this.mergeChallengesWithTemplates(data.challenges);
                    this.saveLocalChallenges(mergedChallenges);
                }
                
                if (data.meditations && Array.isArray(data.meditations)) {
                    this.saveLocalMeditations(data.meditations);
                }
            }
        } catch (error) {
            console.error('Ошибка синхронизации с ботом:', error);
            // Продолжаем работу с локальными данными
        }
    }

    mergeChallengesWithTemplates(serverChallenges) {
        // Шаблоны челленджей с полной информацией
        const defaultChallenges = [
            { 
                day: 1, 
                title: 'Детокс от шума', 
                description: 'День без тревожных новостей',
                details: 'Сегодня откажись от просмотра новостей и социальных сетей. Вместо этого проведи время на природе, почитай книгу или займись творчеством. Это поможет снизить уровень стресса и тревоги.',
                tips: ['Отключи уведомления на телефоне', 'Проведи время на свежем воздухе', 'Займись медитацией или йогой', 'Почитай вдохновляющую книгу']
            },
            { 
                day: 2, 
                title: 'Меньше = легче', 
                description: '3 простых эко-действия',
                details: 'Сделай три простых шага для заботы о планете: используй многоразовую бутылку для воды, откажись от одноразовых пакетов и выключи свет, когда не используешь его. Маленькие действия имеют большое значение.',
                tips: ['Используй многоразовую бутылку', 'Откажись от одноразовых пакетов', 'Выключай свет при выходе', 'Сортируй мусор']
            },
            { 
                day: 3, 
                title: 'Цифровой отдых', 
                description: '2 часа без телефона',
                details: 'Выдели 2 часа в день без телефона и других устройств. Проведи это время в общении с близкими, на природе или за любимым хобби. Это поможет восстановить ментальное равновесие.',
                tips: ['Положи телефон в другую комнату', 'Проведи время с близкими', 'Займись физической активностью', 'Попробуй новое хобби']
            },
            { 
                day: 4, 
                title: 'Эко-день для души', 
                description: 'Практики осознанности',
                details: 'Практикуй осознанность через связь с природой. Посади растение, прогуляйся в парке или просто понаблюдай за природой. Это поможет почувствовать связь с окружающим миром.',
                tips: ['Посади комнатное растение', 'Погуляй в парке или лесу', 'Понаблюдай за птицами или животными', 'Практикуй медитацию на природе']
            },
            { 
                day: 5, 
                title: 'Поделись добром', 
                description: 'Поддержка других',
                details: 'Сделай что-то доброе для других: помоги соседу, сделай комплимент незнакомцу, пожертвуй на благотворительность или просто выслушай друга. Забота о других наполняет нас энергией.',
                tips: ['Помоги кому-то безвозмездно', 'Сделай комплимент незнакомцу', 'Пожертвуй на благотворительность', 'Выслушай друга или близкого']
            }
        ];

        // Объединяем данные с сервера с шаблонами
        return serverChallenges.map(serverChallenge => {
            const template = defaultChallenges.find(t => t.day === serverChallenge.day);
            if (template) {
                return {
                    ...template, // Полная информация из шаблона
                    ...serverChallenge, // Данные с сервера (перезаписывают шаблон)
                    completed: serverChallenge.completed || false,
                    completedDate: serverChallenge.completedDate || null, // Явно указываем null для отмененных
                    startDate: serverChallenge.startDate || new Date().toISOString(),
                    cancelled: serverChallenge.cancelled || false // Сохраняем флаг отмены
                };
            }
            return serverChallenge;
        });
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
            case 'meditationPlayer':
                appElement.innerHTML = this.renderMeditationPlayer();
                break;
            case 'knowledge':
                appElement.innerHTML = this.renderKnowledgeBase();
                break;
            case 'knowledgeDetail':
                appElement.innerHTML = this.renderKnowledgeDetail();
                break;
            case 'challengeDetail':
                appElement.innerHTML = this.renderChallengeDetail();
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
        
        // Инициализируем аудио плеер для медитации, если нужно
        if (this.currentView === 'meditationPlayer') {
            setTimeout(() => this.initMeditationPlayer(), 100);
        }
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
            } else if (action === 'showChallengeDetail' && params) {
                console.log('Showing challenge detail:', params);
                this.showChallengeDetail(parseInt(params));
            } else if (action === 'cancelChallenge' && params) {
                console.log('Canceling challenge:', params);
                this.cancelChallenge(parseInt(params));
            } else if (action === 'startMeditation' && params) {
                console.log('Starting meditation:', params);
                this.startMeditation(parseInt(params));
            } else if (action === 'playMeditation') {
                console.log('Playing meditation');
                this.playMeditation();
            } else if (action === 'stopMeditation') {
                console.log('Stopping meditation');
                this.stopMeditation();
            } else if (action === 'showMoodStats') {
                console.log('Showing mood stats');
                this.showMoodStats();
            } else if (action === 'showMoodHistory') {
                console.log('Showing mood history');
                this.showMoodHistory();
            } else if (action === 'showKnowledge' && params) {
                console.log('Showing knowledge:', params);
                this.showKnowledge(parseInt(params));
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
                        <div class="cell-simple" data-action="navigate" data-params="knowledge">
                            <div class="before">📚</div>
                            <div class="content">
                                <div class="title">База знаний</div>
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
                            <div class="cell-simple" data-action="showChallengeDetail" data-params="${challenge.day}">
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
                                <div class="chevron"></div>
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
        const knowledgeItems = [
            {
                title: '🌱 Эко-осознанность',
                content: 'Практика осознанности помогает снизить стресс и улучшить эмоциональное состояние. Начни с 5 минут медитации каждый день.',
                tips: ['Дыши глубоко и медленно', 'Сосредоточься на настоящем моменте', 'Принимай свои эмоции без осуждения']
            },
            {
                title: '💚 Забота о себе',
                content: 'Регулярный уход за собой - это не эгоизм, а необходимость. Ты не можешь помочь другим, если сам истощен.',
                tips: ['Выделяй время для отдыха', 'Слушай свое тело', 'Не бойся говорить "нет"']
            },
            {
                title: '🌿 Экологичные привычки',
                content: 'Маленькие шаги к экологичному образу жизни помогают не только планете, но и твоему внутреннему состоянию.',
                tips: ['Используй многоразовые вещи', 'Сократи потребление', 'Поддерживай локальные инициативы']
            },
            {
                title: '🧘 Управление стрессом',
                content: 'Стресс - это нормальная реакция, но важно уметь с ним справляться. Регулярные практики помогают снизить уровень тревоги.',
                tips: ['Практикуй дыхательные упражнения', 'Делай перерывы в работе', 'Общайся с близкими']
            },
            {
                title: '💭 Эмоциональный интеллект',
                content: 'Понимание своих эмоций - ключ к гармоничной жизни. Отслеживание настроения помогает находить закономерности.',
                tips: ['Веди дневник настроения', 'Анализируй триггеры', 'Практикуй благодарность']
            },
            {
                title: '🌍 Связь с природой',
                content: 'Проведение времени на природе снижает уровень кортизола и улучшает настроение. Даже 20 минут в парке имеют значение.',
                tips: ['Гуляй на свежем воздухе', 'Посади растение', 'Наблюдай за природой']
            }
        ];

        return `
            <div class="app-container">
                <div class="panel primary">
                    <div class="container">
                        <div class="flex between center">
                            <div class="title">📚 База знаний</div>
                            <button class="btn tertiary" data-action="navigate" data-params="dashboard">Назад</button>
                        </div>
                        <div class="body medium" style="margin-top: 8px;">
                            Полезные памятки для гармоничной жизни
                        </div>
                    </div>
                </div>
                <div class="panel secondary">
                    <div class="cell-list island">
                        ${knowledgeItems.map((item, index) => `
                            <div class="cell-simple" data-action="showKnowledge" data-params="${index}">
                                <div class="before">${item.title.split(' ')[0]}</div>
                                <div class="content">
                                    <div class="title">${item.title}</div>
                                    <div class="subtitle">${item.content.substring(0, 60)}...</div>
                                </div>
                                <div class="chevron"></div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ${this.renderNavigation()}
            </div>
        `;
    }

    showKnowledge(index) {
        const knowledgeItems = [
            {
                title: '🌱 Эко-осознанность',
                content: 'Практика осознанности помогает снизить стресс и улучшить эмоциональное состояние. Начни с 5 минут медитации каждый день.',
                tips: ['Дыши глубоко и медленно', 'Сосредоточься на настоящем моменте', 'Принимай свои эмоции без осуждения']
            },
            {
                title: '💚 Забота о себе',
                content: 'Регулярный уход за собой - это не эгоизм, а необходимость. Ты не можешь помочь другим, если сам истощен.',
                tips: ['Выделяй время для отдыха', 'Слушай свое тело', 'Не бойся говорить "нет"']
            },
            {
                title: '🌿 Экологичные привычки',
                content: 'Маленькие шаги к экологичному образу жизни помогают не только планете, но и твоему внутреннему состоянию.',
                tips: ['Используй многоразовые вещи', 'Сократи потребление', 'Поддерживай локальные инициативы']
            },
            {
                title: '🧘 Управление стрессом',
                content: 'Стресс - это нормальная реакция, но важно уметь с ним справляться. Регулярные практики помогают снизить уровень тревоги.',
                tips: ['Практикуй дыхательные упражнения', 'Делай перерывы в работе', 'Общайся с близкими']
            },
            {
                title: '💭 Эмоциональный интеллект',
                content: 'Понимание своих эмоций - ключ к гармоничной жизни. Отслеживание настроения помогает находить закономерности.',
                tips: ['Веди дневник настроения', 'Анализируй триггеры', 'Практикуй благодарность']
            },
            {
                title: '🌍 Связь с природой',
                content: 'Проведение времени на природе снижает уровень кортизола и улучшает настроение. Даже 20 минут в парке имеют значение.',
                tips: ['Гуляй на свежем воздухе', 'Посади растение', 'Наблюдай за природой']
            }
        ];

        const item = knowledgeItems[index];
        if (!item) return;

        // Показываем детальный экран знания
        this.currentKnowledgeItem = item;
        this.navigateTo('knowledgeDetail');
    }

    renderKnowledgeDetail() {
        if (!this.currentKnowledgeItem) {
            this.navigateTo('knowledge');
            return '';
        }

        const item = this.currentKnowledgeItem;

        return `
            <div class="app-container">
                <div class="panel primary">
                    <div class="container">
                        <div class="flex between center">
                            <div class="title">${item.title}</div>
                            <button class="btn tertiary" data-action="navigate" data-params="knowledge">Назад</button>
                        </div>
                    </div>
                </div>

                <div class="panel secondary">
                    <div class="container">
                        <div class="body medium" style="margin-bottom: 24px; line-height: 1.6;">
                            ${item.content}
                        </div>
                    </div>
                </div>

                <div class="panel secondary">
                    <div class="container">
                        <div class="headline" style="margin-bottom: 16px;">💡 Практические советы</div>
                        <div class="cell-list island">
                            ${item.tips.map((tip, idx) => `
                                <div class="cell-simple">
                                    <div class="before">${idx + 1}</div>
                                    <div class="content">
                                        <div class="title">${tip}</div>
                                    </div>
                                </div>
                            `).join('')}
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
        const message = 'Настроение сохранено!';
        if (window.WebApp && window.WebApp.showPopup) {
            window.WebApp.showPopup({ title: 'Успех', message: message, buttons: [{ type: 'ok' }] });
        } else if (window.WebApp && window.WebApp.showAlert) {
            window.WebApp.showAlert(message);
        } else {
            alert(message);
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
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)); // Понедельник
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        endOfWeek.setHours(23, 59, 59, 999);

        moods.forEach(mood => {
            const moodDate = new Date(mood.date);
            if (moodDate >= startOfWeek && moodDate < endOfWeek) {
                const dayIndex = (moodDate.getDay() + 6) % 7; // Понедельник = 0, Воскресенье = 6
                if (dayIndex >= 0 && dayIndex < 7) {
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

    showChallengeDetail(day) {
        if (window.WebApp) {
            window.WebApp.HapticFeedback.impactOccurred('light');
        }

        const defaultChallenges = [
            { 
                day: 1, 
                title: 'Детокс от шума', 
                description: 'День без тревожных новостей',
                details: 'Сегодня откажись от просмотра новостей и социальных сетей. Вместо этого проведи время на природе, почитай книгу или займись творчеством. Это поможет снизить уровень стресса и тревоги.',
                tips: ['Отключи уведомления на телефоне', 'Проведи время на свежем воздухе', 'Займись медитацией или йогой', 'Почитай вдохновляющую книгу']
            },
            { 
                day: 2, 
                title: 'Меньше = легче', 
                description: '3 простых эко-действия',
                details: 'Сделай три простых шага для заботы о планете: используй многоразовую бутылку для воды, откажись от одноразовых пакетов и выключи свет, когда не используешь его. Маленькие действия имеют большое значение.',
                tips: ['Используй многоразовую бутылку', 'Откажись от одноразовых пакетов', 'Выключай свет при выходе', 'Сортируй мусор']
            },
            { 
                day: 3, 
                title: 'Цифровой отдых', 
                description: '2 часа без телефона',
                details: 'Выдели 2 часа в день без телефона и других устройств. Проведи это время в общении с близкими, на природе или за любимым хобби. Это поможет восстановить ментальное равновесие.',
                tips: ['Положи телефон в другую комнату', 'Проведи время с близкими', 'Займись физической активностью', 'Попробуй новое хобби']
            },
            { 
                day: 4, 
                title: 'Эко-день для души', 
                description: 'Практики осознанности',
                details: 'Практикуй осознанность через связь с природой. Посади растение, прогуляйся в парке или просто понаблюдай за природой. Это поможет почувствовать связь с окружающим миром.',
                tips: ['Посади комнатное растение', 'Погуляй в парке или лесу', 'Понаблюдай за птицами или животными', 'Практикуй медитацию на природе']
            },
            { 
                day: 5, 
                title: 'Поделись добром', 
                description: 'Поддержка других',
                details: 'Сделай что-то доброе для других: помоги соседу, сделай комплимент незнакомцу, пожертвуй на благотворительность или просто выслушай друга. Забота о других наполняет нас энергией.',
                tips: ['Помоги кому-то безвозмездно', 'Сделай комплимент незнакомцу', 'Пожертвуй на благотворительность', 'Выслушай друга или близкого']
            }
        ];

        const challengeTemplate = defaultChallenges.find(c => c.day === day);
        if (!challengeTemplate) return;

        const savedChallenges = this.getLocalChallenges();
        const savedChallenge = savedChallenges.find(c => c.day === day);

        this.currentChallenge = {
            ...challengeTemplate,
            completed: savedChallenge?.completed || false,
            completedDate: savedChallenge?.completedDate,
            startDate: savedChallenge?.startDate
        };

        this.navigateTo('challengeDetail');
    }

    renderChallengeDetail() {
        if (!this.currentChallenge) {
            this.navigateTo('challenge');
            return '';
        }

        const challenge = this.currentChallenge;

        return `
            <div class="app-container">
                <div class="panel primary">
                    <div class="container">
                        <div class="flex between center">
                            <div class="title">День ${challenge.day}: ${challenge.title}</div>
                            <button class="btn tertiary" data-action="navigate" data-params="challenge">Назад</button>
                        </div>
                        <div class="body medium" style="margin-top: 8px;">
                            ${challenge.description}
                        </div>
                    </div>
                </div>

                <div class="panel secondary">
                    <div class="container">
                        <div class="headline" style="margin-bottom: 12px;">📋 Описание</div>
                        <div class="body medium" style="line-height: 1.6;">
                            ${challenge.details}
                        </div>
                    </div>
                </div>

                <div class="panel secondary">
                    <div class="container">
                        <div class="headline" style="margin-bottom: 16px;">💡 Практические шаги</div>
                        <div class="cell-list island">
                            ${challenge.tips.map((tip, idx) => `
                                <div class="cell-simple">
                                    <div class="before">${idx + 1}</div>
                                    <div class="content">
                                        <div class="title">${tip}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                ${challenge.completed ? `
                    <div class="panel secondary">
                        <div class="container">
                            <div class="body medium" style="text-align: center; padding: 16px; margin-bottom: 16px;">
                                ✅ Челлендж завершен ${challenge.completedDate ? new Date(challenge.completedDate).toLocaleDateString('ru-RU') : ''}
                            </div>
                            <button class="btn secondary" data-action="cancelChallenge" data-params="${challenge.day}" style="width: 100%;">
                                ❌ Отменить выполнение
                            </button>
                        </div>
                    </div>
                ` : `
                    <div class="panel secondary">
                        <div class="container">
                            <button class="btn primary" data-action="startChallenge" data-params="${challenge.day}" style="width: 100%;">
                                ✅ Завершить челлендж
                            </button>
                        </div>
                    </div>
                `}

                ${this.renderNavigation()}
            </div>
        `;
    }

    async startChallenge(day) {
        if (window.WebApp) {
            window.WebApp.HapticFeedback.impactOccurred('light');
        }

        // Получаем полную информацию о челлендже
        const defaultChallenges = [
            { 
                day: 1, 
                title: 'Детокс от шума', 
                description: 'День без тревожных новостей',
                details: 'Сегодня откажись от просмотра новостей и социальных сетей. Вместо этого проведи время на природе, почитай книгу или займись творчеством. Это поможет снизить уровень стресса и тревоги.',
                tips: ['Отключи уведомления на телефоне', 'Проведи время на свежем воздухе', 'Займись медитацией или йогой', 'Почитай вдохновляющую книгу']
            },
            { 
                day: 2, 
                title: 'Меньше = легче', 
                description: '3 простых эко-действия',
                details: 'Сделай три простых шага для заботы о планете: используй многоразовую бутылку для воды, откажись от одноразовых пакетов и выключи свет, когда не используешь его. Маленькие действия имеют большое значение.',
                tips: ['Используй многоразовую бутылку', 'Откажись от одноразовых пакетов', 'Выключай свет при выходе', 'Сортируй мусор']
            },
            { 
                day: 3, 
                title: 'Цифровой отдых', 
                description: '2 часа без телефона',
                details: 'Выдели 2 часа в день без телефона и других устройств. Проведи это время в общении с близкими, на природе или за любимым хобби. Это поможет восстановить ментальное равновесие.',
                tips: ['Положи телефон в другую комнату', 'Проведи время с близкими', 'Займись физической активностью', 'Попробуй новое хобби']
            },
            { 
                day: 4, 
                title: 'Эко-день для души', 
                description: 'Практики осознанности',
                details: 'Практикуй осознанность через связь с природой. Посади растение, прогуляйся в парке или просто понаблюдай за природой. Это поможет почувствовать связь с окружающим миром.',
                tips: ['Посади комнатное растение', 'Погуляй в парке или лесу', 'Понаблюдай за птицами или животными', 'Практикуй медитацию на природе']
            },
            { 
                day: 5, 
                title: 'Поделись добром', 
                description: 'Поддержка других',
                details: 'Сделай что-то доброе для других: помоги соседу, сделай комплимент незнакомцу, пожертвуй на благотворительность или просто выслушай друга. Забота о других наполняет нас энергией.',
                tips: ['Помоги кому-то безвозмездно', 'Сделай комплимент незнакомцу', 'Пожертвуй на благотворительность', 'Выслушай друга или близкого']
            }
        ];

        const challengeTemplate = defaultChallenges.find(c => c.day === day);
        if (!challengeTemplate) return;

        const challenges = this.getLocalChallenges();
        let challenge = challenges.find(c => c.day === day);
        
        if (!challenge) {
            challenge = {
                ...challengeTemplate,
                startDate: new Date().toISOString(),
                completed: false
            };
            challenges.push(challenge);
        } else {
            // Обновляем информацию о челлендже, если она отсутствует
            challenge = {
                ...challengeTemplate,
                ...challenge,
                startDate: challenge.startDate || new Date().toISOString()
            };
            // Обновляем в массиве
            const index = challenges.findIndex(c => c.day === day);
            challenges[index] = challenge;
        }

        // Если уже завершен, просто показываем информацию
        if (challenge.completed) {
            const message = `Челлендж дня ${day} уже завершен!`;
            if (window.WebApp && window.WebApp.showPopup) {
                window.WebApp.showPopup({ title: 'Информация', message: message, buttons: [{ type: 'ok' }] });
            } else {
                alert(message);
            }
            return;
        }

        // Отмечаем как завершенный
        challenge.completed = true;
        challenge.completedDate = new Date().toISOString();

        this.saveLocalChallenges(challenges);

        // Отправляем на сервер полную информацию о челлендже
        try {
            const response = await this.sendToBot('/challenge/complete', { 
                challenge: {
                    day: challenge.day,
                    title: challenge.title,
                    description: challenge.description,
                    completed: challenge.completed,
                    completedDate: challenge.completedDate,
                    startDate: challenge.startDate
                }
            });

            // Если сервер вернул обновленные данные, используем их
            if (response && response.challenge) {
                const index = challenges.findIndex(c => c.day === day);
                if (index !== -1) {
                    challenges[index] = { ...challenge, ...response.challenge };
                    this.saveLocalChallenges(challenges);
                }
            }
        } catch (error) {
            console.error('Ошибка синхронизации челленджа с ботом:', error);
            // Продолжаем работу даже при ошибке синхронизации
        }

        // Дополнительно синхронизируем все данные с ботом
        try {
            await this.syncWithBot();
        } catch (error) {
            console.error('Ошибка дополнительной синхронизации:', error);
        }

        const successMessage = 'Челлендж завершен!';
        if (window.WebApp && window.WebApp.showPopup) {
            window.WebApp.showPopup({ title: 'Успех', message: successMessage, buttons: [{ type: 'ok' }] });
        } else {
            alert(successMessage);
        }

        // Обновляем текущий челлендж и перерисовываем
        if (this.currentChallenge && this.currentChallenge.day === day) {
            this.currentChallenge.completed = true;
            this.currentChallenge.completedDate = challenge.completedDate;
        }

        this.renderApp();
    }

    async cancelChallenge(day) {
        if (window.WebApp) {
            window.WebApp.HapticFeedback.impactOccurred('light');
        }

        const challenges = this.getLocalChallenges();
        const challenge = challenges.find(c => c.day === day);
        
        if (!challenge || !challenge.completed) {
            const message = 'Челлендж не был завершен';
            if (window.WebApp && window.WebApp.showPopup) {
                window.WebApp.showPopup({ title: 'Информация', message: message, buttons: [{ type: 'ok' }] });
            } else {
                alert(message);
            }
            return;
        }

        // Отменяем выполнение
        challenge.completed = false;
        challenge.completedDate = null;

        this.saveLocalChallenges(challenges);

        // Отправляем на сервер информацию об отмене
        try {
            const response = await this.sendToBot('/challenge/cancel', { 
                challenge: {
                    day: challenge.day,
                    title: challenge.title,
                    description: challenge.description,
                    completed: false,
                    completedDate: null,
                    startDate: challenge.startDate,
                    cancelled: true // Явно указываем, что челлендж отменен
                }
            });

            // Если сервер вернул обновленные данные, используем их
            if (response && response.challenge) {
                const index = challenges.findIndex(c => c.day === day);
                if (index !== -1) {
                    challenges[index] = { ...challenge, ...response.challenge };
                    this.saveLocalChallenges(challenges);
                }
            }
        } catch (error) {
            console.error('Ошибка синхронизации отмены челленджа с ботом:', error);
            // Продолжаем работу даже при ошибке синхронизации
        }

        // Дополнительно синхронизируем все данные с ботом
        try {
            await this.syncWithBot();
        } catch (error) {
            console.error('Ошибка дополнительной синхронизации:', error);
        }

        const successMessage = 'Выполнение челленджа отменено';
        if (window.WebApp && window.WebApp.showPopup) {
            window.WebApp.showPopup({ title: 'Успех', message: successMessage, buttons: [{ type: 'ok' }] });
        } else {
            alert(successMessage);
        }

        // Обновляем текущий челлендж и перерисовываем
        if (this.currentChallenge && this.currentChallenge.day === day) {
            this.currentChallenge.completed = false;
            this.currentChallenge.completedDate = null;
        }

        this.renderApp();
    }

    async startMeditation(id) {
        if (window.WebApp) {
            window.WebApp.HapticFeedback.impactOccurred('soft');
        }

        const meditations = [
            { id: 1, name: '💤 Перед сном', duration: 10, type: 'sleep', file: 'meditations/sleep.mp3' },
            { id: 2, name: '🌪️ Против тревоги', duration: 5, type: 'anxiety', file: 'meditations/anxiety.mp3' },
            { id: 3, name: '🌊 Расслабляющая', duration: 7, type: 'relax', file: 'meditations/relax.mp3' },
            { id: 4, name: '🎯 На концентрацию', duration: 8, type: 'focus', file: 'meditations/relax.mp3' } // Используем relax для focus
        ];

        const meditation = meditations.find(m => m.id === id);
        if (!meditation) return;

        // Останавливаем предыдущую медитацию, если она играет
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer = null;
        }

        // Переходим на экран медитации
        this.currentMeditation = meditation;
        this.navigateTo('meditationPlayer');
    }

    renderMeditationPlayer() {
        if (!this.currentMeditation) {
            this.navigateTo('meditations');
            return '';
        }

        const meditation = this.currentMeditation;
        const isPlaying = this.audioPlayer && !this.audioPlayer.paused;

        return `
            <div class="app-container">
                <div class="panel primary">
                    <div class="container">
                        <div class="flex between center">
                            <div class="title">${meditation.name}</div>
                            <button class="btn tertiary" data-action="navigate" data-params="meditations">Назад</button>
                        </div>
                        <div class="body medium" style="margin-top: 8px;">
                            Длительность: ${meditation.duration} минут
                        </div>
                    </div>
                </div>

                <div class="panel secondary">
                    <div class="container">
                        <div class="flex column center gap-24" style="padding: 40px 0;">
                            <div style="font-size: 64px;">${meditation.id === 1 ? '💤' : meditation.id === 2 ? '🌪️' : meditation.id === 3 ? '🌊' : '🎯'}</div>
                            <div class="headline">${meditation.name}</div>
                            <audio id="meditationAudio" src="${meditation.file}" preload="auto"></audio>
                            <div class="flex gap-16">
                                <button class="btn primary" data-action="playMeditation" style="min-width: 120px;">
                                    ${isPlaying ? '⏸️ Пауза' : '▶️ Играть'}
                                </button>
                                <button class="btn secondary" data-action="stopMeditation" style="min-width: 120px;">
                                    ⏹️ Стоп
                                </button>
                            </div>
                            <div id="meditationProgress" class="body medium" style="margin-top: 16px;">
                                Готово к воспроизведению
                            </div>
                        </div>
                    </div>
                </div>

                ${this.renderNavigation()}
            </div>
        `;
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

    initMeditationPlayer() {
        const audioElement = document.getElementById('meditationAudio');
        if (audioElement && !this.audioPlayer) {
            this.audioPlayer = audioElement;
            this.audioPlayer.addEventListener('timeupdate', () => {
                this.updateMeditationProgress();
            });
            this.audioPlayer.addEventListener('ended', () => {
                this.onMeditationEnded();
            });
        }
    }

    playMeditation() {
        if (!this.audioPlayer) {
            this.initMeditationPlayer();
        }
        
        if (this.audioPlayer) {
            if (this.audioPlayer.paused) {
                this.audioPlayer.play().catch(err => {
                    console.error('Ошибка воспроизведения:', err);
                    alert('Не удалось воспроизвести медитацию. Проверьте файл.');
                });
            } else {
                this.audioPlayer.pause();
            }
            this.renderApp();
        }
    }

    stopMeditation() {
        if (this.audioPlayer) {
            this.audioPlayer.pause();
            this.audioPlayer.currentTime = 0;
            this.renderApp();
        }
    }

    updateMeditationProgress() {
        if (!this.audioPlayer) return;
        
        const progressElement = document.getElementById('meditationProgress');
        if (progressElement) {
            const current = Math.floor(this.audioPlayer.currentTime);
            const duration = Math.floor(this.audioPlayer.duration || 0);
            const minutes = Math.floor(current / 60);
            const seconds = current % 60;
            const totalMinutes = Math.floor(duration / 60);
            const totalSeconds = duration % 60;
            
            if (duration > 0) {
                progressElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')} / ${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
            }
        }
    }

    async onMeditationEnded() {
        if (!this.currentMeditation) return;

        const meditationEntry = {
            meditationId: this.currentMeditation.id,
            name: this.currentMeditation.name,
            duration: this.currentMeditation.duration * 60, // в секундах
            type: this.currentMeditation.type,
            date: new Date().toISOString(),
            timestamp: Date.now()
        };

        // Сохраняем локально
        const savedMeditations = this.getLocalMeditations();
        savedMeditations.push(meditationEntry);
        this.saveLocalMeditations(savedMeditations);

        // Отправляем на сервер
        await this.sendToBot('/meditation', { meditation: meditationEntry });

            const message = 'Медитация завершена!';
            if (window.WebApp && window.WebApp.showPopup) {
                window.WebApp.showPopup({ title: 'Успех', message: message, buttons: [{ type: 'ok' }] });
            } else if (window.WebApp && window.WebApp.showAlert) {
                window.WebApp.showAlert(message);
            } else {
                alert(message);
            }

        // Возвращаемся к списку медитаций
        this.currentMeditation = null;
        this.audioPlayer = null;
        this.navigateTo('meditations');
    }
}

// Инициализация приложения
const app = new EmpathApp();

// Глобальные методы для onclick
window.app = app;