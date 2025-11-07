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
  Dot,
  Progress
} from '@maxhub/max-ui'

const EcoChallenge = () => {
  const [currentDay, setCurrentDay] = useState(3)
  const [completedDays, setCompletedDays] = useState([1, 2])

  const challenges = [
    {
      day: 1,
      title: "Детокс от шума",
      description: "День без тревожных новостей",
      task: "Не читай новости, сосредоточься на своем дыхании",
      completed: true,
      ecoImpact: "Снижение информационного стресса"
    },
    {
      day: 2,
      title: "Меньше = легче", 
      description: "Осознанное потребление",
      task: "Откажись от одного одноразового предмета",
      completed: true,
      ecoImpact: "Меньше мусора"
    },
    {
      day: 3,
      title: "Цифровой отдых",
      description: "Перезагрузка от гаджетов",
      task: "Проведи 2 часа без телефона",
      completed: false,
      ecoImpact: "Снижение энергопотребления"
    },
    {
      day: 4,
      title: "Эко-день для души",
      description: "Единение с природой", 
      task: "Слушай звуки природы 15 минут",
      completed: false,
      ecoImpact: "Глубокая связь с окружающим миром"
    },
    {
      day: 5,
      title: "Поделись добром",
      description: "Социальная эмпатия",
      task: "Сделай маленькое доброе дело",
      completed: false,
      ecoImpact: "Позитивное влияние на сообщество"
    }
  ]

  const completeChallenge = (day) => {
    if (window.WebApp) {
      window.WebApp.HapticFeedback.notificationOccurred('success')
    }
    
    if (!completedDays.includes(day)) {
      setCompletedDays([...completedDays, day])
    }
  }

  const progress = (completedDays.length / challenges.length) * 100

  return (
    <Panel mode="secondary">
      <Flex direction="column" gap={24}>
        <Container>
          <Flex direction="column" gap={12}>
            <Typography.Headline variant="medium-strong">
              🌿 Эко-эмпатия челлендж
            </Typography.Headline>
            <Typography.Body variant="medium">
              5 дней гармонии с собой и природой
            </Typography.Body>
            
            {/* Прогресс */}
            <Flex direction="column" gap={8}>
              <Flex justify="between">
                <Typography.Label variant="small">Общий прогресс</Typography.Label>
                <Typography.Label variant="small">{Math.round(progress)}%</Typography.Label>
              </Flex>
              <Progress value={progress} />
            </Flex>
          </Flex>
        </Container>

        {/* Текущий день */}
        <CellList mode="island" header={<CellHeader>Сегодняшний челлендж</CellHeader>}>
          {challenges.filter(challenge => challenge.day === currentDay).map(challenge => (
            <CellSimple
              key={challenge.day}
              before="🎯"
              title={challenge.title}
              subtitle={challenge.description}
              after={
                challenge.completed ? (
                  <Counter value="✅" appearance="themed" />
                ) : (
                  <Dot appearance="themed" />
                )
              }
            />
          ))}
        </CellList>

        {/* Задание дня */}
        <Container>
          <Typography.Label variant="medium" style={{ marginBottom: 8, display: 'block' }}>
            Задание на сегодня:
          </Typography.Label>
          <Panel mode="primary">
            <Typography.Body variant="medium">
              {challenges.find(c => c.day === currentDay)?.task}
            </Typography.Body>
          </Panel>
        </Container>

        {/* Кнопка выполнения */}
        <Container>
          <Button
            mode="primary"
            appearance="themed"
            size="large"
            stretched
            onClick={() => completeChallenge(currentDay)}
            disabled={completedDays.includes(currentDay)}
          >
            {completedDays.includes(currentDay) ? 'Задание выполнено!' : 'Отметить выполнение'}
          </Button>
        </Container>

        {/* Все дни челленджа */}
        <CellList mode="island" header={<CellHeader>Все дни челленджа</CellHeader>}>
          {challenges.map(challenge => (
            <CellSimple
              key={challenge.day}
              before={challenge.day}
              title={challenge.title}
              subtitle={challenge.description}
              after={
                completedDays.includes(challenge.day) ? (
                  <Counter value="✅" appearance="themed" />
                ) : (
                  <Typography.Label variant="small">{challenge.day === currentDay ? 'Сегодня' : 'Скоро'}</Typography.Label>
                )
              }
              onClick={() => !completedDays.includes(challenge.day) && setCurrentDay(challenge.day)}
            />
          ))}
        </CellList>

        {/* Экологическое влияние */}
        <CellList mode="island" header={<CellHeader>Твое влияние</CellHeader>}>
          <CellSimple
            title="Снижение стресса"
            subtitle="Через осознанность"
            after={<Counter value={completedDays.length * 2} />}
          />
          <CellSimple
            title="Эко-привычки"
            subtitle="Устойчивое поведение"
            after={<Counter value={completedDays.length} />}
          />
        </CellList>
      </Flex>
    </Panel>
  )
}

export default EcoChallenge