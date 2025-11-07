import React, { useState, useEffect } from 'react'
import { 
  Panel, 
  Container, 
  Flex, 
  Grid, 
  Typography, 
  Button,
  CellList,
  CellSimple,
  CellHeader,
  Avatar,
  IconButton,
  ToolButton,
  Counter,
  Switch
} from '@maxhub/max-ui'

function App() {
  const [userData, setUserData] = useState(null)
  const [currentView, setCurrentView] = useState('dashboard')

  useEffect(() => {
    // Инициализация WebApp
    if (window.WebApp) {
      window.WebApp.ready()
      
      // Получение данных пользователя
      const initData = window.WebApp.initDataUnsafe
      setUserData({
        name: initData?.user?.first_name || 'Друг',
        photo: initData?.user?.photo_url
      })
    }
  }, [])

  const Dashboard = () => (
    <Panel mode="secondary">
      <Flex direction="column" gap={24}>
        {/* Заголовок */}
        <Container>
          <Flex direction="column" align="center" gap={16}>
            <Avatar.Container size={72} form="circle">
              {userData?.photo ? (
                <Avatar.Image src={userData.photo} alt={userData.name} />
              ) : (
                <Avatar.Text gradient="green">
                  {userData?.name?.charAt(0) || 'E'}
                </Avatar.Text>
              )}
            </Avatar.Container>
            <Typography.Headline variant="medium-strong">
              Привет, {userData?.name}!
            </Typography.Headline>
            <Typography.Body variant="medium">
              Как проходит твой день?
            </Typography.Body>
          </Flex>
        </Container>

        {/* Быстрые действия */}
        <CellList mode="island" header={<CellHeader>Быстрый старт</CellHeader>}>
          <CellSimple
            before="📝"
            title="Отметить настроение"
            showChevron
            onClick={() => setCurrentView('mood')}
          />
          <CellSimple
            before="🌿"
            title="Эко-челлендж"
            showChevron
            onClick={() => setCurrentView('challenge')}
          />
          <CellSimple
            before="🧘"
            title="Медитации"
            showChevron
            onClick={() => setCurrentView('meditations')}
          />
        </CellList>

        {/* Статистика */}
        <CellList mode="island" header={<CellHeader>Моя статистика</CellHeader>}>
          <CellSimple
            before="📊"
            title="Записей в дневнике"
            after={<Counter value={7} />}
          />
          <CellSimple
            before="📚"
            title="Прочитано карточек"
            after={<Counter value={3} />}
          />
          <CellSimple
            before="🌱"
            title="Завершено челленджей"
            after={<Counter value={2} />}
          />
        </CellList>

        {/* Уведомления */}
        <CellList mode="island" header={<CellHeader>Уведомления</CellHeader>}>
          <CellSimple
            as="label"
            title="Напоминания о настроении"
            after={<Switch defaultChecked />}
          />
          <CellSimple
            as="label"
            title="Эко-челленджи"
            after={<Switch defaultChecked />}
          />
          <CellSimple
            as="label"
            title="Советы по самооборте"
            after={<Switch defaultChecked />}
          />
        </CellList>
      </Flex>
    </Panel>
  )

  const MoodTracker = () => (
    <Panel mode="secondary">
      <Flex direction="column" gap={24}>
        <Container>
          <Typography.Headline variant="medium-strong">
            📝 Дневник настроения
          </Typography.Headline>
          <Typography.Body variant="medium">
            Как ты себя чувствуешь сегодня?
          </Typography.Body>
        </Container>

        <Grid cols={5} gap={8}>
          {['😢', '😔', '😐', '😊', '😄'].map((emoji, index) => (
            <Button
              key={index}
              mode="secondary"
              appearance="themed"
              size="large"
              onClick={() => {
                // Логика сохранения настроения
                if (window.WebApp) {
                  window.WebApp.HapticFeedback.impactOccurred('light')
                }
                setCurrentView('mood_reason')
              }}
            >
              {emoji}
            </Button>
          ))}
        </Grid>

        <CellList mode="island">
          <CellSimple
            title="Недельная статистика"
            subtitle="Просмотр тенденций настроения"
            showChevron
            onClick={() => setCurrentView('stats')}
          />
        </CellList>
      </Flex>
    </Panel>
  )

  const ChallengeView = () => (
    <Panel mode="secondary">
      <Flex direction="column" gap={24}>
        <Container>
          <Typography.Headline variant="medium-strong">
            🌿 Эко-эмпатия челлендж
          </Typography.Headline>
          <Typography.Body variant="medium">
            5 дней гармонии с собой и природой
          </Typography.Body>
        </Container>

        <CellList mode="island">
          {[
            { day: 1, title: 'Детокс от шума', completed: true },
            { day: 2, title: 'Меньше = легче', completed: true },
            { day: 3, title: 'Цифровой отдых', completed: false },
            { day: 4, title: 'Эко-день для души', completed: false },
            { day: 5, title: 'Поделись добром', completed: false }
          ].map((challenge, index) => (
            <CellSimple
              key={index}
              before={challenge.completed ? '✅' : '📅'}
              title={`День ${challenge.day}: ${challenge.title}`}
              subtitle={challenge.completed ? 'Завершено' : 'Ожидает'}
              showChevron={!challenge.completed}
            />
          ))}
        </CellList>
      </Flex>
    </Panel>
  )

  const MeditationsView = () => (
    <Panel mode="secondary">
      <Flex direction="column" gap={24}>
        <Container>
          <Typography.Headline variant="medium-strong">
            🧘 Медитации
          </Typography.Headline>
          <Typography.Body variant="medium">
            Выбери практику для гармонии
          </Typography.Body>
        </Container>

        <CellList mode="island">
          {[
            { name: '💤 Перед сном', duration: '10 мин' },
            { name: '🌪️ Против тревоги', duration: '5 мин' },
            { name: '🌊 Расслабляющая', duration: '7 мин' },
            { name: '🎯 На концентрацию', duration: '8 мин' }
          ].map((meditation, index) => (
            <CellSimple
              key={index}
              before="🎧"
              title={meditation.name}
              subtitle={meditation.duration}
              showChevron
              onClick={() => {
                // Запуск медитации
                if (window.WebApp) {
                  window.WebApp.HapticFeedback.impactOccurred('soft')
                }
              }}
            />
          ))}
        </CellList>
      </Flex>
    </Panel>
  )

  const renderView = () => {
    switch (currentView) {
      case 'mood': return <MoodTracker />
      case 'challenge': return <ChallengeView />
      case 'meditations': return <MeditationsView />
      default: return <Dashboard />
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background-page)' }}>
      {/* Навигация */}
      <Panel mode="primary">
        <Container>
          <Flex justify="between" align="center">
            <Typography.Title variant="small">
              {currentView === 'dashboard' ? 'Empath' : 
               currentView === 'mood' ? 'Настроение' :
               currentView === 'challenge' ? 'Челлендж' : 'Медитации'}
            </Typography.Title>
            
            {currentView !== 'dashboard' && (
              <Button
                mode="tertiary"
                appearance="themed"
                onClick={() => setCurrentView('dashboard')}
              >
                Назад
              </Button>
            )}
          </Flex>
        </Container>
      </Panel>

      {renderView()}

      {/* Нижняя навигация */}
      <Panel mode="primary">
        <Container>
          <Grid cols={4} gap={8}>
            <ToolButton
              icon="📊"
              appearance={currentView === 'dashboard' ? 'secondary' : 'default'}
              onClick={() => setCurrentView('dashboard')}
            >
              Главная
            </ToolButton>
            <ToolButton
              icon="📝"
              appearance={currentView === 'mood' ? 'secondary' : 'default'}
              onClick={() => setCurrentView('mood')}
            >
              Настроение
            </ToolButton>
            <ToolButton
              icon="🌿"
              appearance={currentView === 'challenge' ? 'secondary' : 'default'}
              onClick={() => setCurrentView('challenge')}
            >
              Челлендж
            </ToolButton>
            <ToolButton
              icon="🧘"
              appearance={currentView === 'meditations' ? 'secondary' : 'default'}
              onClick={() => setCurrentView('meditations')}
            >
              Медитации
            </ToolButton>
          </Grid>
        </Container>
      </Panel>
    </div>
  )
}

export default App