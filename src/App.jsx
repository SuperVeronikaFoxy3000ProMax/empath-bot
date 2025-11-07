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
  CellAction,
  Avatar,
  IconButton,
  ToolButton,
  Counter,
  Switch,
  Spinner,
  Dot,
  SearchInput,
  Input,
  Textarea
} from '@maxhub/max-ui'

import MoodTracker from './components/MoodTracker'
import EcoChallenge from './components/EcoChallenge'
import Meditations from './components/Meditations'
import PsychologyCards from './components/PsychologyCards'

function App() {
  const [currentView, setCurrentView] = useState('dashboard')
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeApp = async () => {
      if (window.WebApp) {
        try {
          // Получаем данные пользователя из Bridge
          const initData = window.WebApp.initDataUnsafe
          const user = initData?.user || {}
          
          setUserData({
            name: user.first_name || 'Друг',
            userId: user.id,
            photo: user.photo_url,
            language: user.language_code || 'ru'
          })

          // Включаем подтверждение закрытия
          window.WebApp.enableClosingConfirmation()

          // Настраиваем кнопку назад
          window.WebApp.BackButton.onClick(() => {
            if (currentView !== 'dashboard') {
              setCurrentView('dashboard')
            }
          })

        } catch (error) {
          console.error('Error initializing app:', error)
        } finally {
          setIsLoading(false)
        }
      } else {
        // Если WebApp недоступен (например, при тестировании в браузере)
        setUserData({
          name: 'Друг',
          userId: null,
          photo: null,
          language: 'ru'
        })
        setIsLoading(false)
      }
    }

    initializeApp()
  }, [currentView])

  // Обновляем видимость кнопки назад
  useEffect(() => {
    if (window.WebApp && window.WebApp.BackButton) {
      if (currentView !== 'dashboard') {
        window.WebApp.BackButton.show()
      } else {
        window.WebApp.BackButton.hide()
      }
    }
  }, [currentView])

  const handleShare = async () => {
    if (window.WebApp) {
      try {
        window.WebApp.HapticFeedback.impactOccurred('medium')
        
        const result = await new Promise((resolve) => {
          const requestId = Date.now().toString()
          
          const handleResponse = (event) => {
            if (event.detail.requestId === requestId) {
              window.removeEventListener('WebAppShareResponse', handleResponse)
              resolve(event.detail)
            }
          }
          
          window.addEventListener('WebAppShareResponse', handleResponse)
          
          window.WebApp.shareContent({
            requestId,
            text: 'Присоединяйся к Empath - приложению для заботы о ментальном здоровье! 🌱',
            link: 'https://max.ru/empath_bot?startapp'
          })
        })
        
        if (result.status === 'shared') {
          window.WebApp.HapticFeedback.notificationOccurred('success')
        }
      } catch (error) {
        console.error('Share error:', error)
      }
    }
  }

  if (isLoading) {
    return (
      <Panel mode="secondary" centeredX centeredY>
        <Flex direction="column" align="center" gap={16}>
          <Spinner appearance="themed" size={32} />
          <Typography.Body variant="medium">Загружаем Empath...</Typography.Body>
        </Flex>
      </Panel>
    )
  }

  const Dashboard = () => (
    <Panel mode="secondary">
      <Flex direction="column" gap={24}>
        {/* Приветствие */}
        <Container>
          <Flex direction="column" align="center" gap={16}>
            <Avatar.Container size={80} form="squircle">
              {userData?.photo ? (
                <Avatar.Image 
                  src={userData.photo} 
                  alt={userData.name}
                  fallback={userData.name.charAt(0)}
                />
              ) : (
                <Avatar.Text gradient="green">
                  {userData?.name?.charAt(0) || 'E'}
                </Avatar.Text>
              )}
            </Avatar.Container>
            <Flex direction="column" align="center">
              <Typography.Headline variant="medium-strong">
                Привет, {userData?.name}!
              </Typography.Headline>
              <Typography.Body variant="medium" style={{ textAlign: 'center' }}>
                Сегодня отличный день для заботы о себе 🌱
              </Typography.Body>
            </Flex>
          </Flex>
        </Container>

        {/* Быстрые действия */}
        <CellList mode="island" header={<CellHeader titleStyle="caps">Быстрый старт</CellHeader>}>
          <CellSimple
            before="📝"
            title="Дневник настроения"
            subtitle="Отметить текущее состояние"
            showChevron
            onClick={() => {
              if (window.WebApp?.HapticFeedback) {
                window.WebApp.HapticFeedback.impactOccurred('light')
              }
              setCurrentView('mood')
            }}
          />
          <CellSimple
            before="🌿"
            title="Эко-челлендж"
            subtitle="День 3 из 5"
            after={<Dot appearance="themed" />}
            showChevron
            onClick={() => {
              if (window.WebApp?.HapticFeedback) {
                window.WebApp.HapticFeedback.impactOccurred('light')
              }
              setCurrentView('challenge')
            }}
          />
          <CellSimple
            before="🧘"
            title="Медитации"
            subtitle="Найди свой покой"
            showChevron
            onClick={() => {
              if (window.WebApp?.HapticFeedback) {
                window.WebApp.HapticFeedback.impactOccurred('light')
              }
              setCurrentView('meditations')
            }}
          />
        </CellList>

        {/* Сегодняшние активности */}
        <CellList mode="island" header={<CellHeader titleStyle="caps">Сегодня</CellHeader>}>
          <CellSimple
            before="💧"
            title="Выпить воды"
            subtitle="2 из 8 стаканов"
            after={<Counter value={2} appearance="themed" />}
          />
          <CellSimple
            before="🚶"
            title="Прогулка"
            subtitle="15 минут на свежем воздухе"
            after={<Counter value={15} appearance="themed" />}
          />
          <CellSimple
            before="📚"
            title="Психология"
            subtitle="Изучи новую карточку"
            showChevron
            onClick={() => {
              if (window.WebApp?.HapticFeedback) {
                window.WebApp.HapticFeedback.impactOccurred('light')
              }
              setCurrentView('psychology')
            }}
          />
        </CellList>

        {/* Статистика */}
        <CellList mode="island" header={<CellHeader titleStyle="caps">Мой прогресс</CellHeader>}>
          <CellSimple
            title="Подряд дней с настроением"
            after={<Counter value={7} appearance="themed" mode="filled" />}
          />
          <CellSimple
            title="Прочитано карточек"
            after={<Counter value={12} appearance="themed" mode="filled" />}
          />
          <CellSimple
            title="Завершено медитаций"
            after={<Counter value={5} appearance="themed" mode="filled" />}
          />
        </CellList>
      </Flex>
    </Panel>
  )

  const renderView = () => {
    switch (currentView) {
      case 'mood': return <MoodTracker />
      case 'challenge': return <EcoChallenge />
      case 'meditations': return <Meditations />
      case 'psychology': return <PsychologyCards />
      default: return <Dashboard />
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--background-page)',
      paddingBottom: '80px' 
    }}>
      {/* Основной контент */}
      {renderView()}

      {/* Нижняя навигация */}
      <Panel 
        mode="primary" 
        style={{ 
          position: 'fixed', 
          bottom: 0, 
          left: 0, 
          right: 0,
          borderTop: '1px solid var(--border-primary)'
        }}
      >
        <Container>
          <Grid cols={4} gap={8}>
            <ToolButton
              icon="📊"
              appearance={currentView === 'dashboard' ? 'secondary' : 'default'}
              onClick={() => {
                if (window.WebApp?.HapticFeedback) {
                  window.WebApp.HapticFeedback.selectionChanged()
                }
                setCurrentView('dashboard')
              }}
            >
              Главная
            </ToolButton>
            <ToolButton
              icon="📝"
              appearance={currentView === 'mood' ? 'secondary' : 'default'}
              onClick={() => {
                if (window.WebApp?.HapticFeedback) {
                  window.WebApp.HapticFeedback.selectionChanged()
                }
                setCurrentView('mood')
              }}
            >
              Настроение
            </ToolButton>
            <ToolButton
              icon="🌿"
              appearance={currentView === 'challenge' ? 'secondary' : 'default'}
              onClick={() => {
                if (window.WebApp?.HapticFeedback) {
                  window.WebApp.HapticFeedback.selectionChanged()
                }
                setCurrentView('challenge')
              }}
            >
              Челлендж
            </ToolButton>
            <ToolButton
              icon="🧘"
              appearance={currentView === 'meditations' ? 'secondary' : 'default'}
              onClick={() => {
                if (window.WebApp?.HapticFeedback) {
                  window.WebApp.HapticFeedback.selectionChanged()
                }
                setCurrentView('meditations')
              }}
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