import { useState, useEffect } from 'react'

export default function QuizGame({ gameState, playerId, onMove, disabled }) {
  const [selected, setSelected] = useState(null)

  // Reset selection when question changes
  useEffect(() => { setSelected(null) }, [gameState?.currentQuestion])

  if (!gameState) return null
  const { questions, currentQuestion, scores, answers, status, playerCount } = gameState
  const q           = questions?.[currentQuestion]
  const hasAnswered  = answers && playerId in answers
  const myScore      = scores?.[playerId] || 0
  const totalQ       = questions?.length || 5

  const handleAnswer = (idx) => {
    if (hasAnswered || disabled || status !== 'active') return
    setSelected(idx)
    onMove({ answerIndex: idx })
  }

  if (status === 'finished') {
    const sorted = Object.entries(scores || {}).sort((a, b) => b[1] - a[1])
    const won    = sorted[0]?.[0] === playerId
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ fontSize: '60px', marginBottom: '12px' }}>{won ? '🏆' : '😞'}</div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: won ? 'var(--green)' : 'var(--red)', marginBottom: '20px' }}>
          {won ? 'You Won!' : 'You Lost!'}
        </h2>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {sorted.map(([pid, score], i) => (
            <div key={pid} className="card" style={{ minWidth: '110px', textAlign: 'center', padding: '14px' }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{['🥇','🥈','🥉'][i] || '🎖️'}</div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--yellow)' }}>{score}</div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '2px' }}>
                {pid === playerId ? 'You' : `P${i + 1}`}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!q) return <div style={{ textAlign: 'center', color: 'var(--text2)' }}>Loading question...</div>

  const answeredCount = Object.keys(answers || {}).length

  return (
    <div>
      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px', color: 'var(--text2)' }}>
        <span>Question {currentQuestion + 1} / {totalQ}</span>
        <span>Score: <strong style={{ color: 'var(--yellow)' }}>{myScore}</strong></span>
      </div>

      {/* Progress bar */}
      <div style={{ height: '4px', background: 'var(--bg3)', borderRadius: '4px', marginBottom: '20px' }}>
        <div style={{
          height: '100%', borderRadius: '4px', background: 'var(--accent)',
          width: `${(currentQuestion / totalQ) * 100}%`, transition: 'width 0.4s',
        }} />
      </div>

      {/* Question */}
      <p style={{ fontSize: '16px', fontWeight: 600, marginBottom: '18px', lineHeight: 1.5 }}>{q.q}</p>

      {/* Answered count for 3p */}
      {playerCount > 2 && (
        <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '10px' }}>
          {answeredCount}/{playerCount} answered
        </p>
      )}

      {/* Options */}
      <div style={{ display: 'grid', gap: '8px' }}>
        {q.options.map((opt, idx) => {
          const isSelected = selected === idx
          const isCorrect  = hasAnswered && idx === q.answer
          const isWrong    = hasAnswered && isSelected && idx !== q.answer
          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={hasAnswered}
              style={{
                padding: '12px 16px', textAlign: 'left', borderRadius: '8px',
                border: `1px solid ${isCorrect ? 'var(--green)' : isWrong ? 'var(--red)' : isSelected ? 'var(--accent)' : 'var(--border)'}`,
                background: isCorrect ? 'rgba(0,230,118,0.1)' : isWrong ? 'rgba(255,82,82,0.1)' : isSelected ? 'rgba(124,77,255,0.1)' : 'var(--bg3)',
                color: 'var(--text)', cursor: hasAnswered ? 'default' : 'pointer',
                fontSize: '14px', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '10px',
              }}>
              <span style={{
                width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                background: 'var(--bg2)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '12px', color: 'var(--text3)', fontWeight: 600,
              }}>
                {String.fromCharCode(65 + idx)}
              </span>
              {opt}
            </button>
          )
        })}
      </div>

      {hasAnswered && (
        <p style={{ textAlign: 'center', marginTop: '14px', fontSize: '13px', color: 'var(--text2)' }}>
          ⏳ Waiting for {playerCount - answeredCount - 1 > 0 ? `${playerCount - answeredCount - 1} more player(s)` : 'next question'}...
        </p>
      )}
    </div>
  )
}
