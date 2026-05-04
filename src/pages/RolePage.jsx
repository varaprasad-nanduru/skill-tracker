import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ROLES from '../data/roles'
import useProgress from '../store/useProgress'
import {
  getSkillDifficulty, getSkillTime, DIFFICULTY_CONFIG,
  CODE_SNIPPETS, QUIZ_QUESTIONS, LEVEL_DIAGRAMS,
  getResourceType, isFreeResource,
} from '../data/skillMeta'
import FlashCards from '../components/FlashCards'
import PomodoroTimer from '../components/PomodoroTimer'
import QuizModal from '../components/QuizModal'
import MermaidDiagram from '../components/MermaidDiagram'
import ShareCard from '../components/ShareCard'

const RESOURCE_TYPE_COLORS = {
  Video:       { bg: '#ef444418', text: '#ef4444' },
  Interactive: { bg: '#10b98118', text: '#10b981' },
  Course:      { bg: '#6366f118', text: '#818cf8' },
  Docs:        { bg: '#06b6d418', text: '#06b6d4' },
  Book:        { bg: '#f59e0b18', text: '#f59e0b' },
  Article:     { bg: '#47556918', text: '#64748b' },
}

export default function RolePage() {
  const { roleId } = useParams()
  const navigate = useNavigate()
  const role = ROLES.find(r => r.id === roleId)

  const [activeLevel, setActiveLevel] = useState(0)
  const [expandedQ, setExpandedQ] = useState(null)
  const [showProject, setShowProject] = useState(false)
  const [showResources, setShowResources] = useState(false)
  const [showDiagram, setShowDiagram] = useState(false)
  const [showFlashCards, setShowFlashCards] = useState(false)
  const [showShareCard, setShowShareCard] = useState(false)
  const [confirmReset, setConfirmReset] = useState(null)
  const [expandedCode, setExpandedCode] = useState(null)   // skillIndex | null
  const [expandedNote, setExpandedNote] = useState(null)   // skillIndex | null
  const [journalText, setJournalText] = useState('')
  const [showJournal, setShowJournal] = useState(false)
  // quiz state: { index, pendingToggle } | null
  const [quizState, setQuizState] = useState(null)

  const toggle         = useProgress(s => s.toggle)
  const isChecked      = useProgress(s => s.isChecked)
  const getLevelProgress = useProgress(s => s.getLevelProgress)
  const getRoleProgress  = useProgress(s => s.getRoleProgress)
  const resetRole      = useProgress(s => s.resetRole)
  const resetLevel     = useProgress(s => s.resetLevel)
  const setNote        = useProgress(s => s.setNote)
  const getNote        = useProgress(s => s.getNote)
  const toggleBookmark = useProgress(s => s.toggleBookmark)
  const isBookmarked   = useProgress(s => s.isBookmarked)
  const addJournalEntry   = useProgress(s => s.addJournalEntry)
  const getJournalEntries = useProgress(s => s.getJournalEntries)
  const deleteJournalEntry = useProgress(s => s.deleteJournalEntry)
  const logTime        = useProgress(s => s.logTime)
  const getTime        = useProgress(s => s.getTime)
  const getRoleTotalTime = useProgress(s => s.getRoleTotalTime)

  if (!role) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#080a0f' }}>
      <div className="text-center">
        <div className="text-4xl mb-4">🔍</div>
        <p className="text-[#475569]">Role not found.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-sm text-[#6366f1] hover:underline">← Back home</button>
      </div>
    </div>
  )

  const level = role.levels[activeLevel]
  const lp  = getLevelProgress(role.id, level.id, level.skills.length)
  const rp  = getRoleProgress(role.id, role.levels)
  const totalTime = getRoleTotalTime(role.id, role.levels)
  const diagramKey = `${role.id}__${level.id}`
  const diagram = LEVEL_DIAGRAMS[diagramKey]

  function switchLevel(i) {
    setActiveLevel(i)
    setExpandedQ(null); setShowProject(false); setShowResources(false)
    setShowDiagram(false); setExpandedCode(null); setExpandedNote(null)
    setShowJournal(false)
  }

  function handleConfirm() {
    if (confirmReset === 'role') resetRole(role.id, role.levels)
    if (confirmReset === 'level') resetLevel(role.id, level.id, level.skills.length)
    setConfirmReset(null)
  }

  function handleSkillClick(i) {
    const alreadyChecked = isChecked(role.id, level.id, i)
    if (alreadyChecked) { toggle(role.id, level.id, i); return }

    const quizKey = `${role.id}__${level.id}__${i}`
    const quiz = QUIZ_QUESTIONS[quizKey]
    if (quiz) {
      setQuizState({ index: i, quiz })
    } else {
      toggle(role.id, level.id, i)
    }
  }

  function handleQuizPass() {
    toggle(role.id, level.id, quizState.index)
    setQuizState(null)
  }

  function formatTime(mins) {
    if (mins < 60) return `${mins}m`
    const h = Math.floor(mins / 60), m = mins % 60
    return m ? `${h}h ${m}m` : `${h}h`
  }

  const levelProgresses = role.levels.map(lv => ({
    ...lv,
    pct: getLevelProgress(role.id, lv.id, lv.skills.length).pct,
  }))

  return (
    <div className="min-h-screen pb-32" style={{ background: '#080a0f' }}>

      {/* Sticky top nav */}
      <div className="sticky top-0 z-10 border-b border-[#1e2330] px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(8,10,15,0.95)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => navigate('/')}
          className="text-[#475569] hover:text-[#94a3b8] text-sm transition-colors">
          ← All Roles
        </button>
        <span className="text-[#1e2330]">/</span>
        <span className="text-[#e2e8f0] text-sm font-semibold">{role.icon} {role.title}</span>
        <div className="ml-auto flex items-center gap-3">
          {totalTime > 0 && (
            <span className="text-xs text-[#374151]">⏱ {formatTime(totalTime)}</span>
          )}
          <button onClick={() => setShowShareCard(true)}
            className="text-xs px-2.5 py-1 rounded-lg font-bold transition-all hover:scale-105"
            style={{ background: role.color + '18', border: `1px solid ${role.color}35`, color: role.color }}>
            Share
          </button>
          <div className="h-1.5 w-20 bg-[#1a1f2e] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${rp.pct}%`, background: role.color }} />
          </div>
          <span className="text-xs font-bold" style={{ color: role.color }}>{rp.pct}%</span>
        </div>
      </div>

      {/* Role header */}
      <div className="px-4 pt-8 pb-6 relative overflow-hidden"
        style={{ background: `radial-gradient(ellipse at 0% 0%, ${role.color}08 0%, transparent 60%)` }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ background: role.color + '15' }}>
                {role.icon}
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-[#e2e8f0]">{role.title}</h1>
                <p className="text-sm text-[#475569] mt-0.5">{role.tagline}</p>
              </div>
            </div>
            {rp.done > 0 && (
              <button onClick={() => setConfirmReset('role')}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105"
                style={{ color: '#ef4444', border: '1px solid #ef444430', background: '#ef444412' }}>
                ↺ Reset Role
              </button>
            )}
          </div>

          {/* Level tabs */}
          <div className="flex gap-2 flex-wrap mt-5">
            {role.levels.map((lv, i) => {
              const p = getLevelProgress(role.id, lv.id, lv.skills.length)
              const isActive = activeLevel === i
              return (
                <button key={lv.id} onClick={() => switchLevel(i)}
                  className="px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                  style={{
                    background: isActive ? role.color + '20' : '#0f1117',
                    border: `1px solid ${isActive ? role.color + '60' : '#1e2330'}`,
                    color: isActive ? role.color : '#475569',
                  }}>
                  {lv.label}
                  {p.pct === 100 && <span style={{ color: role.color }}>✓</span>}
                  {p.pct > 0 && p.pct < 100 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md"
                      style={{ background: role.color + '20', color: role.color }}>{p.pct}%</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 fade-in" key={level.id}>

        {/* Level progress card */}
        <div className="rounded-2xl border border-[#1e2330] bg-[#0f1117] p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: role.color }}>
                {level.label} Level
              </div>
              <div className="text-sm text-[#475569]">⏱ {level.timeEstimate}</div>
            </div>
            <div className="flex items-center gap-3">
              {lp.done > 0 && (
                <button onClick={() => setConfirmReset('level')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all hover:scale-105"
                  style={{ color: '#ef4444', border: '1px solid #ef444430', background: '#ef444412' }}>
                  ↺ Reset Level
                </button>
              )}
              <div className="text-right">
                <div className="text-2xl font-extrabold font-mono" style={{ color: role.color }}>{lp.pct}%</div>
                <div className="text-xs text-[#374151]">{lp.done}/{lp.total} done</div>
              </div>
            </div>
          </div>
          <div className="h-2 bg-[#1a1f2e] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${lp.pct}%`, background: role.color }} />
          </div>
        </div>

        {/* Concept Diagram */}
        {diagram && (
          <div className="rounded-2xl border border-[#1e2330] bg-[#0f1117] mb-4 overflow-hidden">
            <button onClick={() => setShowDiagram(d => !d)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#111820] transition-colors">
              <div className="flex items-center gap-2">
                <span>🗺️</span>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#06b6d4' }}>
                  Architecture Diagram
                </span>
              </div>
              <span className="text-[#374151] text-sm"
                style={{ transform: showDiagram ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>▾</span>
            </button>
            {showDiagram && (
              <div className="px-5 pb-5 border-t border-[#1e2330] fade-in pt-4">
                <MermaidDiagram chart={diagram} color={role.color} />
              </div>
            )}
          </div>
        )}

        {/* Skills checklist */}
        <div className="rounded-2xl border border-[#1e2330] bg-[#0f1117] mb-4 overflow-hidden">
          <div className="px-5 py-3 border-b border-[#1e2330] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: role.color }}>
              Skills Checklist
            </span>
            <span className="text-xs text-[#374151]">{level.skills.length} skills</span>
          </div>

          <div className="divide-y divide-[#0d1018]">
            {level.skills.map((skill, i) => {
              const checked    = isChecked(role.id, level.id, i)
              const bookmarked = isBookmarked(role.id, level.id, i)
              const note       = getNote(role.id, level.id, i)
              const loggedTime = getTime(role.id, level.id, i)
              const diff       = getSkillDifficulty(level.id, i, level.skills.length)
              const diffCfg    = DIFFICULTY_CONFIG[diff]
              const timeEst    = getSkillTime(level.id, i, level.skills.length)
              const codeKey    = `${role.id}__${level.id}__${i}`
              const code       = CODE_SNIPPETS[codeKey]
              const isNoteOpen = expandedNote === i
              const isCodeOpen = expandedCode === i

              return (
                <div key={i}>
                  {/* Main skill row */}
                  <div className="px-5 py-3.5 hover:bg-[#0d1018] transition-colors">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div onClick={() => handleSkillClick(i)}
                        className="w-5 h-5 rounded-md flex-shrink-0 mt-0.5 flex items-center justify-center transition-all cursor-pointer"
                        style={{
                          border: checked ? `2px solid ${role.color}` : '2px solid #2a3040',
                          background: checked ? role.color + '25' : 'transparent',
                        }}>
                        {checked && (
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                            <path d="M1.5 6L4 8.5L9.5 2.5" stroke={role.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>

                      {/* Skill text + badges */}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm leading-relaxed"
                          style={{ color: checked ? '#374151' : '#94a3b8', textDecoration: checked ? 'line-through' : 'none' }}>
                          {skill}
                        </span>
                        {/* Badges row */}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{ background: diffCfg.bg, border: `1px solid ${diffCfg.border}`, color: diffCfg.text }}>
                            {diffCfg.label}
                          </span>
                          <span className="text-[10px] text-[#374151]">⏱ {timeEst}</span>
                          {loggedTime > 0 && (
                            <span className="text-[10px] text-[#374151]">• logged {formatTime(loggedTime)}</span>
                          )}
                          {note && <span className="text-[10px]" style={{ color: role.color }}>📝</span>}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {code && (
                          <button onClick={() => setExpandedCode(isCodeOpen ? null : i)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all hover:scale-110"
                            title="View code snippet"
                            style={{ background: isCodeOpen ? role.color + '25' : '#111820', border: `1px solid ${isCodeOpen ? role.color + '50' : '#1e2330'}`, color: isCodeOpen ? role.color : '#374151' }}>
                            {'</>'}
                          </button>
                        )}
                        <button onClick={() => setExpandedNote(isNoteOpen ? null : i)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all hover:scale-110"
                          title="Add note"
                          style={{ background: isNoteOpen ? '#f59e0b25' : '#111820', border: `1px solid ${isNoteOpen ? '#f59e0b50' : '#1e2330'}`, color: isNoteOpen ? '#f59e0b' : '#374151' }}>
                          ✏️
                        </button>
                        <button onClick={() => toggleBookmark(role.id, level.id, i)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all hover:scale-110"
                          title={bookmarked ? 'Remove bookmark' : 'Bookmark this skill'}
                          style={{ background: bookmarked ? role.color + '25' : '#111820', border: `1px solid ${bookmarked ? role.color + '50' : '#1e2330'}`, color: bookmarked ? role.color : '#374151' }}>
                          {bookmarked ? '★' : '☆'}
                        </button>
                        {/* Log time */}
                        <div className="relative group">
                          <button className="w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all hover:scale-110"
                            style={{ background: '#111820', border: '1px solid #1e2330', color: '#374151' }}
                            title="Log time spent">
                            ⏱
                          </button>
                          <div className="absolute right-0 top-full mt-1 hidden group-hover:flex flex-col gap-1 z-20 rounded-xl border border-[#1e2330] p-2"
                            style={{ background: '#0f1117', minWidth: 80 }}>
                            {[30, 60, 120].map(m => (
                              <button key={m} onClick={() => logTime(role.id, level.id, i, m)}
                                className="text-xs px-2 py-1 rounded-lg hover:bg-[#1e2330] transition-colors text-left whitespace-nowrap"
                                style={{ color: '#64748b' }}>
                                +{m < 60 ? `${m}m` : `${m/60}h`}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Code snippet panel */}
                  {isCodeOpen && code && (
                    <div className="border-t border-[#0d1018] fade-in">
                      <div className="px-5 py-2 flex items-center justify-between"
                        style={{ background: '#080a0f' }}>
                        <span className="text-xs font-bold" style={{ color: role.color }}>Starter Code</span>
                        <button onClick={() => navigator.clipboard.writeText(code)}
                          className="text-[10px] px-2 py-0.5 rounded font-bold transition-colors hover:text-[#94a3b8]"
                          style={{ color: '#374151' }}>
                          Copy
                        </button>
                      </div>
                      <pre className="text-xs leading-relaxed px-5 pb-4 overflow-x-auto"
                        style={{ background: '#080a0f', color: '#94a3b8', fontFamily: 'monospace', margin: 0 }}>
                        {code}
                      </pre>
                    </div>
                  )}

                  {/* Note panel */}
                  {isNoteOpen && (
                    <div className="border-t border-[#0d1018] px-5 py-3 fade-in" style={{ background: '#0a0c12' }}>
                      <textarea
                        rows={3}
                        placeholder="Add your notes, questions, or links…"
                        defaultValue={note}
                        onBlur={e => setNote(role.id, level.id, i, e.target.value)}
                        className="w-full rounded-xl px-3 py-2 text-xs resize-none outline-none transition-colors"
                        style={{ background: '#0f1117', border: '1px solid #1e2330', color: '#94a3b8' }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Project */}
        <div className="rounded-2xl border border-[#1e2330] bg-[#0f1117] mb-4 overflow-hidden">
          <button onClick={() => setShowProject(!showProject)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#111820] transition-colors">
            <div className="flex items-center gap-2">
              <span>🚀</span>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: '#f59e0b' }}>
                  Project to Build
                </div>
                <div className="text-sm font-semibold text-[#e2e8f0]">{level.project.title}</div>
              </div>
            </div>
            <span className="text-[#374151] text-sm"
              style={{ transform: showProject ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>▾</span>
          </button>
          {showProject && (
            <div className="px-5 pb-5 border-t border-[#1e2330] fade-in pt-4">
              <p className="text-sm text-[#64748b] leading-relaxed">{level.project.description}</p>
            </div>
          )}
        </div>

        {/* Interview Questions + Flashcard mode */}
        <div className="rounded-2xl border border-[#1e2330] bg-[#0f1117] mb-4 overflow-hidden">
          <div className="px-5 py-3 border-b border-[#1e2330] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>🎯</span>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#10b981' }}>
                Interview Questions
              </span>
            </div>
            <button onClick={() => setShowFlashCards(true)}
              className="text-xs px-3 py-1 rounded-lg font-bold transition-all hover:scale-105"
              style={{ background: '#10b98118', border: '1px solid #10b98140', color: '#10b981' }}>
              🃏 Flashcard Mode
            </button>
          </div>
          <div className="divide-y divide-[#0d1018]">
            {level.interviewQs.map((q, i) => (
              <div key={i}>
                <button onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                  className="w-full px-5 py-3.5 flex items-start justify-between gap-3 hover:bg-[#111820] transition-colors text-left">
                  <span className="text-sm text-[#94a3b8] leading-relaxed">{q}</span>
                  <span className="text-[#374151] text-xs flex-shrink-0 mt-0.5">{expandedQ === i ? '▲' : '▼'}</span>
                </button>
                {expandedQ === i && (
                  <div className="px-5 pb-3 border-t border-[#0d1018] fade-in">
                    <p className="text-xs text-[#475569] mt-2 leading-relaxed italic">
                      Answer with a concrete example. Situation → approach → result. Aim for 60–90 seconds.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Resources with type tags */}
        <div className="rounded-2xl border border-[#1e2330] bg-[#0f1117] mb-4 overflow-hidden">
          <button onClick={() => setShowResources(!showResources)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#111820] transition-colors">
            <div className="flex items-center gap-2">
              <span>📚</span>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8b5cf6' }}>Resources</span>
            </div>
            <span className="text-[#374151] text-sm"
              style={{ transform: showResources ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>▾</span>
          </button>
          {showResources && (
            <div className="px-5 pb-5 border-t border-[#1e2330] fade-in pt-4">
              <div className="flex flex-col gap-3">
                {level.resources.map((r, i) => {
                  const type = getResourceType(r)
                  const free = isFreeResource(r)
                  const tc = RESOURCE_TYPE_COLORS[type] || RESOURCE_TYPE_COLORS.Article
                  return (
                    <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 group"
                      onClick={e => e.stopPropagation()}>
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0"
                        style={{ background: tc.bg, color: tc.text }}>
                        {type}
                      </span>
                      <span className="text-sm text-[#6366f1] group-hover:text-[#818cf8] transition-colors flex-1">
                        {r.label.replace('(Free)', '').trim()}
                      </span>
                      {free && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-bold flex-shrink-0"
                          style={{ background: '#10b98115', color: '#10b981' }}>FREE</span>
                      )}
                      <span className="text-[#374151] text-xs flex-shrink-0">↗</span>
                    </a>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Learning Journal */}
        <div className="rounded-2xl border border-[#1e2330] bg-[#0f1117] mb-4 overflow-hidden">
          <button onClick={() => setShowJournal(j => !j)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#111820] transition-colors">
            <div className="flex items-center gap-2">
              <span>📓</span>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#f97316' }}>
                Learning Journal
              </span>
              {getJournalEntries(role.id, level.id).length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: '#f9731618', color: '#f97316' }}>
                  {getJournalEntries(role.id, level.id).length}
                </span>
              )}
            </div>
            <span className="text-[#374151] text-sm"
              style={{ transform: showJournal ? 'rotate(180deg)' : 'none', display: 'inline-block', transition: 'transform 0.2s' }}>▾</span>
          </button>

          {showJournal && (
            <div className="border-t border-[#1e2330] fade-in">
              {/* New entry */}
              <div className="px-5 pt-4 pb-3">
                <textarea
                  rows={3}
                  value={journalText}
                  onChange={e => setJournalText(e.target.value)}
                  placeholder="What did you learn today? Any blockers? Notes for future you…"
                  className="w-full rounded-xl px-3 py-2 text-sm resize-none outline-none mb-2"
                  style={{ background: '#111820', border: '1px solid #1e2330', color: '#94a3b8' }}
                />
                <button
                  onClick={() => {
                    if (journalText.trim()) {
                      addJournalEntry(role.id, level.id, journalText.trim())
                      setJournalText('')
                    }
                  }}
                  className="text-xs px-4 py-1.5 rounded-lg font-bold transition-all hover:scale-105"
                  style={{ background: '#f9731620', border: '1px solid #f9731640', color: '#f97316' }}>
                  Save Entry
                </button>
              </div>

              {/* Past entries */}
              {getJournalEntries(role.id, level.id).map((entry, i) => (
                <div key={i} className="border-t border-[#0d1018] px-5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-[#64748b] leading-relaxed flex-1">{entry.text}</p>
                    <button onClick={() => deleteJournalEntry(role.id, level.id, i)}
                      className="text-[10px] text-[#2a3040] hover:text-[#ef4444] transition-colors flex-shrink-0 mt-0.5">
                      ✕
                    </button>
                  </div>
                  <div className="text-[10px] text-[#2a3040] mt-1">
                    {new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Floating Pomodoro Timer */}
      <PomodoroTimer color={role.color} />

      {/* Flashcard overlay */}
      {showFlashCards && (
        <FlashCards
          questions={level.interviewQs}
          color={role.color}
          onClose={() => setShowFlashCards(false)}
        />
      )}

      {/* Quiz modal */}
      {quizState && (
        <QuizModal
          quiz={quizState.quiz}
          skillText={level.skills[quizState.index]}
          color={role.color}
          onPass={handleQuizPass}
          onSkip={() => { toggle(role.id, level.id, quizState.index); setQuizState(null) }}
          onClose={() => setQuizState(null)}
        />
      )}

      {/* Share card */}
      {showShareCard && (
        <ShareCard
          role={role}
          roleProgress={rp}
          levelProgresses={levelProgresses}
          onClose={() => setShowShareCard(false)}
        />
      )}

      {/* Confirm reset modal */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="rounded-2xl border border-[#2a3040] bg-[#0f1117] p-6 w-full max-w-sm fade-in">
            <div className="text-3xl mb-3 text-center">
              {confirmReset === 'role' ? role.icon : '📋'}
            </div>
            <h2 className="text-[#e2e8f0] font-extrabold text-lg text-center mb-1">
              {confirmReset === 'role' ? `Reset ${role.title}?` : `Reset ${level.label} Level?`}
            </h2>
            <p className="text-[#475569] text-sm text-center mb-6 leading-relaxed">
              {confirmReset === 'role'
                ? `Clears all progress across all 3 levels for ${role.title}.`
                : `Clears all completed skills in the ${level.label} level only.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmReset(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-[#1e2330] text-[#64748b]">
                Cancel
              </button>
              <button onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#ef444420', border: '1px solid #ef444440', color: '#ef4444' }}>
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

}
