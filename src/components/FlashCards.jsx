import { useState } from 'react'

export default function FlashCards({ questions, onClose, color }) {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [seen, setSeen] = useState(new Set())

  const q = questions[index]
  const total = questions.length

  function next() {
    setSeen(s => new Set([...s, index]))
    setFlipped(false)
    setTimeout(() => setIndex(i => Math.min(i + 1, total - 1)), 150)
  }
  function prev() {
    setFlipped(false)
    setTimeout(() => setIndex(i => Math.max(i - 1, 0)), 150)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg fade-in">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-bold" style={{ color }}>
            Flashcard {index + 1} / {total}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: '#475569' }}>
              {seen.size}/{total} reviewed
            </span>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-sm transition-colors hover:bg-[#1e2330]"
              style={{ color: '#475569' }}>
              ✕
            </button>
          </div>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1.5 mb-5 flex-wrap">
          {questions.map((_, i) => (
            <div key={i} onClick={() => { setFlipped(false); setIndex(i) }}
              className="h-1.5 rounded-full cursor-pointer flex-1 min-w-[16px] transition-all duration-300"
              style={{
                background: i === index ? color : seen.has(i) ? color + '50' : '#1e2330',
              }} />
          ))}
        </div>

        {/* Card with 3-D flip */}
        <div className="relative cursor-pointer" style={{ perspective: '1000px', height: 260 }}
          onClick={() => setFlipped(f => !f)}>

          {/* Front — question */}
          <div className="absolute inset-0 rounded-2xl border p-7 flex flex-col items-center justify-center text-center transition-all duration-500"
            style={{
              background: '#0f1117',
              border: `1px solid ${color}40`,
              backfaceVisibility: 'hidden',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color }}>
              Interview Question
            </div>
            <p className="text-lg font-semibold leading-relaxed" style={{ color: '#e2e8f0' }}>{q}</p>
            <div className="mt-6 text-xs" style={{ color: '#374151' }}>tap to flip →</div>
          </div>

          {/* Back — answer guidance */}
          <div className="absolute inset-0 rounded-2xl border p-7 flex flex-col items-center justify-center text-center transition-all duration-500"
            style={{
              background: color + '10',
              border: `1px solid ${color}40`,
              backfaceVisibility: 'hidden',
              transform: flipped ? 'rotateY(0deg)' : 'rotateY(-180deg)',
            }}>
            <div className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color }}>
              How to Answer
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
              Structure your answer with a concrete example from your own projects.
              Aim for <span style={{ color }} className="font-bold">60–90 seconds</span>:
              situation → approach → result.
            </p>
            <div className="mt-5 px-4 py-2 rounded-xl text-xs font-bold"
              style={{ background: color + '20', color }}>
              Practice out loud — not in your head
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-5">
          <button onClick={prev} disabled={index === 0}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all border"
            style={{
              border: '1px solid #1e2330',
              color: index === 0 ? '#2a3040' : '#64748b',
            }}>
            ← Prev
          </button>
          {index < total - 1 ? (
            <button onClick={next}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
              style={{ background: color + '20', border: `1px solid ${color}50`, color }}>
              Next →
            </button>
          ) : (
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
              style={{ background: color, color: '#fff' }}>
              Done ✓
            </button>
          )}
        </div>

        <p className="text-center text-xs mt-3" style={{ color: '#2a3040' }}>
          Press ← → to navigate · tap card to flip
        </p>
      </div>
    </div>
  )
}
