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
  Textarea,
  Spinner
} from '@maxhub/max-ui'

const MoodTracker = () => {
  const [selectedMood, setSelectedMood] = useState(null)
  const [moodReason, setMoodReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const moods = [
    { emoji: '😢', value: 1, name: 'Плохо', color: '#FF6B6B' },
    { emoji: '😔', value: 2, name: 'Не очень', color: '#FFA726' },
    { emoji: '😐', value: 3, name: 'Нормально', color: '#FFD54F' },
    { emoji: '😊', value: 4, name: 'Хорошо', color: '#4FC3F7' },
    { emoji: '😄', value: 5, name: 'Отлично', color: '#66BB6A' }
  ]

  const handleMoodSelect = (mood) => {
    if (window.WebApp) {
      window.WebApp.HapticFeedback.impactOccurred('light')
    }
    setSelectedMood(mood)
  }

  const submitMood = async () => {
    if (!selectedMood || !moodReason.trim()) return

    setIsSubmitting(true)
    
    if (window.WebApp) {
      window.WebApp.HapticFeedback.notificationOccurred('success')
    }

    // Имитация отправки данных
    setTimeout(() => {
      setIsSubmitting(false)
      if (window.WebApp) {
        window.WebApp.HapticFeedback.notificationOccurred('success')
        
        // Показываем подтверждение
        window.WebApp.showAlert({
          title: 'Настроение сохранено!',
          message: 'Спасибо, что делишься своими эмоциями 🌱'
        })
      }
    }, 1000)
  }

  return (
    <Panel mode="secondary">
      <Flex direction="column" gap={24}>
        <Container>
          <Typography.Headline variant="medium-strong">
            📝 Дневник настроения
          </Typography.Headline>
          <Typography.Body variant="medium">
            Как ты себя чувствуешь прямо сейчас?
          </Typography.Body>
        </Container>

        {/* Выбор настроения */}
        <Container>
          <Typography.Label variant="medium" style={{ marginBottom: 16, display: 'block' }}>
            Выбери настроение:
          </Typography.Label>
          <Grid cols={5} gap={8}>
            {moods.map((mood) => (
              <Button
                key={mood.value}
                mode={selectedMood?.value === mood.value ? "primary" : "secondary"}
                appearance="themed"
                size="large"
                stretched
                onClick={() => handleMoodSelect(mood)}
                style={{
                  backgroundColor: selectedMood?.value === mood.value ? mood.color : undefined,
                  borderColor: selectedMood?.value === mood.value ? mood.color : undefined
                }}
              >
                {mood.emoji}
              </Button>
            ))}
          </Grid>
        </Container>

        {selectedMood && (
          <>
            {/* Причина настроения */}
            <Container>
              <Typography.Label variant="medium" style={{ marginBottom: 8, display: 'block' }}>
                Что повлияло на твое настроение?
              </Typography.Label>
              <Textarea
                placeholder="Расскажи о своем дне, мыслях или событиях..."
                value={moodReason}
                onChange={(e) => setMoodReason(e.target.value)}
                rows={4}
              />
            </Container>

            {/* Советы */}
            <CellList mode="island" header={<CellHeader>Совет на сегодня</CellHeader>}>
              <CellSimple
                title={getMoodAdvice(selectedMood.value).title}
                subtitle={getMoodAdvice(selectedMood.value).description}
              />
            </CellList>

            {/* Кнопка сохранения */}
            <Container>
              <Button
                mode="primary"
                appearance="themed"
                size="large"
                stretched
                loading={isSubmitting}
                disabled={!moodReason.trim()}
                onClick={submitMood}
              >
                {isSubmitting ? 'Сохраняем...' : 'Сохранить настроение'}
              </Button>
            </Container>
          </>
        )}

        {/* История настроений */}
        <CellList mode="island" header={<CellHeader>Недельная статистика</CellHeader>}>
          <CellSimple
            title="Среднее настроение"
            subtitle="За последние 7 дней"
            after="4.2"
            showChevron
          />
          <CellSimple
            title="Тенденции"
            subtitle="Стабильное улучшение"
            after="📈"
            showChevron
          />
        </CellList>
      </Flex>
    </Panel>
  )
}

function getMoodAdvice(moodValue) {
  const adviceMap = {
    1: {
      title: "Помни: это пройдет",
      description: "Сложные эмоции - временные гости. Попробуй технику заземления."
    },
    2: {
      title: "Маленькие шаги",
      description: "Сфокусируйся на одном приятном действии сегодня."
    },
    3: {
      title: "Баланс - это хорошо",
      description: "Стабильность - отличная основа для роста."
    },
    4: {
      title: "Цени момент",
      description: "Запомни это чувство и поделись им с другими."
    },
    5: {
      title: "Энергия радости",
      description: "Направь свою позитивную энергию на творчество!"
    }
  }
  
  return adviceMap[moodValue] || adviceMap[3]
}

export default MoodTracker