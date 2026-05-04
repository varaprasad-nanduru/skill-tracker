import { useState, useEffect, useRef } from 'react'

const WORK_MINS = 25
const BREAK_MINS = 5

export default function PomodoroTimer({ color }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('work')   // 'work' | 'break'
  const [seconds, setSeconds] = useState(WORK_MINS * 60)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef(null)

  const totalSecs = (mode === 'work' ? WORK_MINS : BREAK_MINS) * 60
  const pct = ((totalSecs - seconds) / totalSecs) * 100
  const mins = String(Math.floor(seconds / 60)).padStart(2, '0')
  const secs = String(seconds % 60).padStart(2, '0')

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            if (mode === 'work') {
              setSessions(n => n + 1)
              setMode('break')
              setSeconds(BREAK_MINS * 60)
            } else {
              setMode('work')
              setSeconds(WORK_MINS * 60)
            }
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, mode])

  function reset() {
    setRunning(false)
    setMode('work')
    setSeconds(WORK_MINS * 60)
  }

  const circumference = 2 * Math.PI * 38

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 z-40"
        style={{ background: running ? color : '#0f1117', border: `2px solid ${running ? color : '#1e2330'}` }}
        title="Pomodoro Study Timer"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="8" stroke={running ? '#fff' : '#475569'} strokeWidth="1.5"/>
          <path d="M11 7v4l2.5 2.5" stroke={running ? '#fff' : '#475569'} strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="11" cy="11" r="10" stroke={color} strokeWidth="2" strokeDasharray={circumference}
            strokeDashoffset={circumference - (circumference * pct / 100)}
            strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: '11px 11px', transition: 'stroke-dashoffset 1s linear' }}/>
        </svg>
      </button>

      {/* Timer panel */}
      {open && (
        <div className="fixed bottom-24 right-6 w-64 rounded-2xl border shadow-2xl z-40 fade-in overflow-hidden"
          style={{ background: '#0f1117', border: '1px solid #1e2330' }}>

          <div className="px-4 py-3 border-b border-[#1e2330] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
              Pomodoro Timer
            </span>
            <span className="text-xs px-2 py-0.5 rounded-md"
              style={{ background: color + '20', color, fontWeight: 700 }}>
              {sessions} sessions
            </span>
          </div>

          <div className="p-5 flex flex-col items-center">
            {/* Mode toggle */}
            <div className="flex gap-1 w-full mb-5 p-0.5 rounded-lg" style={{ background: '#1a1f2e' }}>
              {['work', 'break'].map(m => (
                <button key={m} onClick={() => { if (!running) { setMode(m); setSeconds((m === 'work' ? WORK_MINS : BREAK_MINS) * 60) } }}
                  className="flex-1 py-1.5 rounded-md text-xs font-bold transition-all"
                  style={{
                    background: mode === m ? color + '30' : 'transparent',
                    color: mode === m ? color : '#374151',
                    border: mode === m ? `1px solid ${color}50` : '1px solid transparent',
                  }}>
                  {m === 'work' ? '🎯 Focus' : '☕ Break'}
                </button>
              ))}
            </div>

            {/* Circular timer */}
            <div className="relative mb-5">
              <svg width="110" height="110" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r="48" stroke="#1e2330" strokeWidth="6" fill="none"/>
                <circle cx="55" cy="55" r="48"
                  stroke={color} strokeWidth="6" fill="none"
                  strokeDasharray={2 * Math.PI * 48}
                  strokeDashoffset={(2 * Math.PI * 48) * (1 - pct / 100)}
                  strokeLinecap="round"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: '55px 55px', transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-mono font-extrabold" style={{ color: '#e2e8f0' }}>
                  {mins}:{secs}
                </span>
                <span className="text-[10px] uppercase tracking-widest mt-0.5" style={{ color: '#374151' }}>
                  {mode === 'work' ? 'focus' : 'break'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2 w-full">
              <button onClick={() => setRunning(r => !r)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={{ background: color, color: '#fff' }}>
                {running ? 'Pause' : 'Start'}
              </button>
              <button onClick={reset}
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:bg-[#1e2330]"
                style={{ border: '1px solid #1e2330', color: '#475569' }}>
                ↺
              </button>
            </div>

            {sessions > 0 && (
              <p className="text-xs mt-3 text-center" style={{ color: '#374151' }}>
                {sessions * WORK_MINS} min focused today
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
