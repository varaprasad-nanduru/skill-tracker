import { useState } from 'react'

export default function QuizModal({ quiz, onPass, onSkip, onClose, color, skillText }) {
  const [qi, setQi] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [passed, setPassed] = useState(false)

  const q = quiz[qi]
  const correct = selected === q.answer

  function handleAnswer(i) {
    if (answered) return
    setSelected(i)
    setAnswered(true)
    if (i === q.answer) {
      setTimeout(() => {
        if (qi + 1 < quiz.length) {
          setQi(qi + 1)
          setSelected(null)
          setAnswered(false)
        } else {
          setPassed(true)
        }
      }, 900)
    }
  }

  function retry() {
    setQi(0)
    setSelected(null)
    setAnswered(false)
    setPassed(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl border fade-in overflow-hidden"
        style={{ background: '#0f1117', border: `1px solid ${color}30` }}>

        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1e2330]">
          <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color }}>
            Quick Check — before marking complete
          </div>
          <p className="text-xs text-[#475569] leading-relaxed line-clamp-2">{skillText}</p>
        </div>

        {passed ? (
          /* ── Pass screen ── */
          <div className="p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-[#e2e8f0] font-extrabold text-lg mb-2">Nailed it!</h3>
            <p className="text-sm text-[#475569] mb-6">Skill marked as complete.</p>
            <button onClick={onPass}
              className="w-full py-3 rounded-xl text-sm font-bold"
              style={{ background: color, color: '#fff' }}>
              Continue
            </button>
          </div>
        ) : (
          /* ── Question screen ── */
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold" style={{ color }}>
                Q{qi + 1} of {quiz.length}
              </span>
              {quiz.length > 1 && (
                <div className="flex gap-1">
                  {quiz.map((_, i) => (
                    <div key={i} className="w-5 h-1 rounded-full"
                      style={{ background: i < qi ? color : i === qi ? color + '80' : '#1e2330' }} />
                  ))}
                </div>
              )}
            </div>

            <p className="text-sm font-semibold text-[#e2e8f0] leading-relaxed mb-5">{q.q}</p>

            <div className="flex flex-col gap-2 mb-5">
              {q.options.map((opt, i) => {
                let bg = '#111820', border = '#1e2330', textColor = '#94a3b8'
                if (answered) {
                  if (i === q.answer) { bg = '#10b98115'; border = '#10b981'; textColor = '#10b981' }
                  else if (i === selected) { bg = '#ef444415'; border = '#ef4444'; textColor = '#ef4444' }
                }
                return (
                  <button key={i} onClick={() => handleAnswer(i)}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200"
                    style={{ background: bg, border: `1px solid ${border}`, color: textColor }}>
                    <span className="font-bold mr-2" style={{ color: answered && i === q.answer ? '#10b981' : 'inherit' }}>
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {opt}
                  </button>
                )
              })}
            </div>

            {answered && !correct && (
              <div className="rounded-xl px-4 py-3 mb-4" style={{ background: '#ef444410', border: '1px solid #ef444430' }}>
                <p className="text-xs text-[#ef4444] font-bold mb-1">Not quite — try again</p>
                <p className="text-xs text-[#475569]">The correct answer is highlighted. Review the skill and retry.</p>
              </div>
            )}

            <div className="flex gap-2">
              {answered && !correct && (
                <button onClick={retry}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: color + '20', border: `1px solid ${color}40`, color }}>
                  Retry Quiz
                </button>
              )}
              <button onClick={onSkip}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-[#1e2330] transition-colors"
                style={{ color: '#475569' }}>
                Skip & Mark Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
