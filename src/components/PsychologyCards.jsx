import React, { useState } from 'react'
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
  Counter,
  Dot
} from '@maxhub/max-ui'

const PsychologyCards = () => {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [readCards, setReadCards] = useState([1, 3])

  const categories = [
    { id: 'anxiety', name: 'Тревога', icon: '🌪️', count: 5 },
    { id: 'sleep', name: 'Сон', icon: '😴', count: 3 },
    { id: 'self_esteem', name: 'Самооценка', icon: '💫', count: 4 },
    { id: 'burnout', name: 'Выгорание', icon: '🔥', count: 2 }
  ]

  const cards = [
    {
      id: 1,
      category: 'anxiety',
      title: 'Техника заземления 5-4-3-2-1',
      content: 'Назови 5 вещей, которые видишь, 4 которые слышишь, 3 которые чувствуешь, 2 которые нюхаешь, 1 которую можешь попробовать на вкус.',
      quickAction: 'Попробуй прямо сейчас',
      read: true
    },
    {
      id: 2,
      category: 'sleep', 
      title: 'Ритуал перед сном',
      content: 'Создай последовательность расслабляющих действий за час до сна: теплый напиток, чтение, легкая растяжка.',
      quickAction: 'Спланируй свой ритуал',
      read: false
    },
    {
      id: 3,
      category: 'self_esteem',
      title: 'Дневник достижений',
      content: 'Каждый вечер записывай 3 вещи, которые удались сегодня, даже маленькие. Это тренирует мозг замечать хорошее.',
      quickAction: 'Запиши сегодняшние успехи',
      read: true
    },
    {
      id: 4,
      category: 'burnout',
      title: 'Сигналы выгорания',
      content: 'Усталость, цинизм, снижение продуктивности - это сигналы. Важно вовремя заметить и дать себе отдых.',
      quickAction: 'Оцени свое состояние',
      read: false
    }
  ]

  const markAsRead = (cardId) => {
    if (window.WebApp) {
      window.WebApp.HapticFeedback.impactOccurred('light')
    }
    
    if (!readCards.includes(cardId)) {
      setReadCards([...readCards, cardId])
    }
  }

  const filteredCards = selectedCategory === 'all' 
    ? cards 
    : cards.filter(card => card.category === selectedCategory)

  return (
    <Panel mode="secondary">
      <Flex direction="column" gap={24}>
        <Container>
          <Typography.Headline variant="medium-strong">
            📚 Психология для жизни
          </Typography.Headline>
          <Typography.Body variant="medium">
            Простые карточки с практической психологией
          </Typography.Body>
        </Container>

        {/* Категории */}
        <Container>
          <Typography.Label variant="medium" style={{ marginBottom: 12, display: 'block' }}>
            Категории:
          </Typography.Label>
          <Grid cols={2} gap={8}>
            <Button
              mode={selectedCategory === 'all' ? 'primary' : 'secondary'}
              appearance="themed"
              size="medium"
              onClick={() => setSelectedCategory('all')}
            >
              Все темы
            </Button>
            {categories.map(category => (
              <Button
                key={category.id}
                mode={selectedCategory === category.id ? 'primary' : 'secondary'}
                appearance="themed"
                size="medium"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.icon} {category.name}
              </Button>
            ))}
          </Grid>
        </Container>

        {/* Карточки */}
        <CellList mode="island" header={<CellHeader>Карточки знаний</CellHeader>}>
          {filteredCards.map(card => (
            <CellSimple
              key={card.id}
              before={categories.find(c => c.id === card.category)?.icon}
              title={card.title}
              subtitle={card.content}
              after={
                readCards.includes(card.id) ? (
                  <Counter value="✅" appearance="themed" />
                ) : (
                  <Dot appearance="themed" />
                )
              }
              showChevron
              onClick={() => markAsRead(card.id)}
            />
          ))}
        </CellList>

        {/* Прогресс */}
        <CellList mode="island" header={<CellHeader>Мой прогресс</CellHeader>}>
          <CellSimple
            title="Прочитано карточек"
            subtitle="Из всех доступных"
            after={`${readCards.length}/${cards.length}`}
          />
          <CellSimple
            title="Изучено категорий"
            subtitle="Разные темы психологии"
            after={`${new Set(readCards.map(id => cards.find(c => c.id === id)?.category)).size}/${categories.length}`}
          />
        </CellList>

        {/* Рекомендации */}
        <Container>
          <Button
            mode="primary"
            appearance="themed"
            size="large"
            stretched
            onClick={() => {
              const unread = cards.find(card => !readCards.includes(card.id))
              if (unread) {
                markAsRead(unread.id)
              }
            }}
          >
            Изучить случайную карточку
          </Button>
        </Container>
      </Flex>
    </Panel>
  )
}

export default PsychologyCards