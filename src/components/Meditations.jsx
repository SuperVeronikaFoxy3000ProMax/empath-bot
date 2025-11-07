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
  IconButton,
  Spinner
} from '@maxhub/max-ui'

const Meditations = () => {
  const [selectedMeditation, setSelectedMeditation] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const meditations = [
    {
      id: 1,
      title: "Утренняя осознанность",
      duration: "10 мин",
      type: "focus",
      description: "Начни день с ясностью ума",
      icon: "🌅"
    },
    {
      id: 2, 
      title: "Снятие тревоги",
      duration: "8 мин",
      type: "anxiety",
      description: "Успокой ум и нервную систему",
      icon: "🌊"
    },
    {
      id: 3,
      title: "Глубокий сон",
      duration: "15 мин", 
      type: "sleep",
      description: "Подготовься к restorative сну",
      icon: "🌙"
    },
    {
      id: 4,
      title: "Эмоциональный баланс",
      duration: "12 мин",
      type: "balance", 
      description: "Обрети гармонию чувств",
      icon: "⚖️"
    }
  ]

  const startMeditation = (meditation) => {
    if (window.WebApp) {
      window.WebApp.HapticFeedback.impactOccurred('medium')
    }
    
    setSelectedMeditation(meditation)
    setIsPlaying(true)

    // Имитация воспроизведения медитации
    setTimeout(() => {
      if (window.WebApp) {
        window.WebApp.HapticFeedback.notificationOccurred('success')
      }
      setIsPlaying(false)
    }, 5000)
  }

  return (
    <Panel mode="secondary">
      <Flex direction="column" gap={24}>
        <Container>
          <Typography.Headline variant="medium-strong">
            🧘 Практики осознанности
          </Typography.Headline>
          <Typography.Body variant="medium">
            Выбери медитацию для гармонии и покоя
          </Typography.Body>
        </Container>

        {/* Текущая медитация */}
        {isPlaying && selectedMeditation && (
          <Container>
            <Panel mode="primary" centeredX centeredY>
              <Flex direction="column" align="center" gap={16}>
                <Spinner appearance="themed" size={32} />
                <Typography.Headline variant="small">
                  Идет медитация...
                </Typography.Headline>
                <Typography.Body variant="medium" style={{ textAlign: 'center' }}>
                  {selectedMeditation.title}
                </Typography.Body>
                <Button
                  mode="secondary"
                  appearance="themed"
                  onClick={() => setIsPlaying(false)}
                >
                  Завершить
                </Button>
              </Flex>
            </Panel>
          </Container>
        )}

        {/* Библиотека медитаций */}
        <CellList mode="island" header={<CellHeader>Библиотека медитаций</CellHeader>}>
          {meditations.map(meditation => (
            <CellSimple
              key={meditation.id}
              before={meditation.icon}
              title={meditation.title}
              subtitle={meditation.description}
              after={
                <Flex gap={8} align="center">
                  <Typography.Label variant="small">
                    {meditation.duration}
                  </Typography.Label>
                  <IconButton
                    mode="tertiary"
                    appearance="themed"
                    onClick={() => startMeditation(meditation)}
                  >
                    ▶️
                  </IconButton>
                </Flex>
              }
            />
          ))}
        </CellList>

        {/* Статистика */}
        <CellList mode="island" header={<CellHeader>Моя практика</CellHeader>}>
          <CellSimple
            title="Всего сессий"
            subtitle="За все время"
            after="24"
          />
          <CellSimple
            title="Общее время"
            subtitle="Минут медитации"
            after="180"
          />
          <CellSimple
            title="Текущая серия"
            subtitle="Дней подряд"
            after="7"
          />
        </CellList>

        {/* Быстрый доступ */}
        <Container>
          <Typography.Label variant="medium" style={{ marginBottom: 12, display: 'block' }}>
            Быстрый старт:
          </Typography.Label>
          <Grid cols={2} gap={8}>
            <Button
              mode="secondary"
              appearance="themed"
              size="medium"
              onClick={() => startMeditation(meditations[1])}
            >
              🌊 5 мин покоя
            </Button>
            <Button
              mode="secondary" 
              appearance="themed"
              size="medium"
              onClick={() => startMeditation(meditations[2])}
            >
              🌙 Перед сном
            </Button>
          </Grid>
        </Container>
      </Flex>
    </Panel>
  )
}

export default Meditations