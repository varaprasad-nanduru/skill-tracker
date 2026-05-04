import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ROLES from '../data/roles'
import useProgress from '../store/useProgress'

export default function RolePage() {
  const { roleId } = useParams()
  const navigate = useNavigate()
  const role = ROLES.find(r => r.id === roleId)

  const [activeLevel, setActiveLevel] = useState(0)
  const [expandedQ, setExpandedQ] = useState(null)
  const [showProject, setShowProject] = useState(false)
  const [showResources, setShowResources] = useState(false)
  // null | 'role' | 'level'
  const [confirmReset, setConfirmReset] = useState(null)

  const toggle = useProgress(s => s.toggle)
  const isChecked = useProgress(s => s.isChecked)
  const getLevelProgress = useProgress(s => s.getLevelProgress)
  const getRoleProgress = useProgress(s => s.getRoleProgress)
  const resetRole = useProgress(s => s.resetRole)
  const resetLevel = useProgress(s => s.resetLevel)

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
  const lp = getLevelProgress(role.id, level.id, level.skills.length)
  const rp = getRoleProgress(role.id, role.levels)

  function handleConfirm() {
    if (confirmReset === 'role') resetRole(role.id, role.levels)
    if (confirmReset === 'level') resetLevel(role.id, level.id, level.skills.length)
    setConfirmReset(null)
  }

  return (
    <div className="min-h-screen pb-20" style={{ background: '#080a0f' }}>

      {/* Sticky top nav */}
      <div className="sticky top-0 z-10 border-b border-[#1e2330] px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(8,10,15,0.95)', backdropFilter: 'blur(12px)' }}>
        <button onClick={() => navigate('/')}
          className="text-[#475569] hover:text-[#94a3b8] text-sm transition-colors">
          ← All Roles
        </button>
        <span className="text-[#1e2330]">/</span>
        <span className="text-[#e2e8f0] text-sm font-semibold">{role.icon} {role.title}</span>
        <div className="ml-auto flex items-center gap-2">
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
            {/* Reset entire role button — inside the page, always visible */}
            {rp.done > 0 && (
              <button
                onClick={() => setConfirmReset('role')}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 hover:scale-105"
                style={{ color: '#ef4444', border: '1px solid #ef444430', background: '#ef444412' }}
                title="Reset all progress for this role"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M10 6A4 4 0 1 1 6 2v0M6 2l1.5 1.5M6 2L4.5 3.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Reset Role
              </button>
            )}
          </div>

          {/* Level tabs */}
          <div className="flex gap-2 flex-wrap mt-5">
            {role.levels.map((lv, i) => {
              const p = getLevelProgress(role.id, lv.id, lv.skills.length)
              const isActive = activeLevel === i
              return (
                <button key={lv.id}
                  onClick={() => { setActiveLevel(i); setExpandedQ(null); setShowProject(false); setShowResources(false) }}
                  className="px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2"
                  style={{
                    background: isActive ? role.color + '20' : '#0f1117',
                    border: `1px solid ${isActive ? role.color + '60' : '#1e2330'}`,
                    color: isActive ? role.color : '#475569',
                  }}>
                  {lv.label}
                  {p.pct === 100 && <span style={{ color: role.color }}>✓</span>}
                  {p.pct > 0 && p.pct < 100 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md"
                      style={{ background: role.color + '20', color: role.color }}>
                      {p.pct}%
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 fade-in" key={level.id}>

        {/* Level progress card — has its own reset */}
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
                <button
                  onClick={() => setConfirmReset('level')}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all duration-200 hover:scale-105"
                  style={{ color: '#ef4444', border: '1px solid #ef444430', background: '#ef444412' }}
                  title={`Reset ${level.label} level progress`}
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M10 6A4 4 0 1 1 6 2v0M6 2l1.5 1.5M6 2L4.5 3.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Reset Level
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

        {/* Skills checklist */}
        <div className="rounded-2xl border border-[#1e2330] bg-[#0f1117] mb-4 overflow-hidden">
          <div className="px-5 py-3 border-b border-[#1e2330]">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: role.color }}>
              Skills Checklist
            </span>
          </div>
          <div className="divide-y divide-[#111820]">
            {level.skills.map((skill, i) => {
              const checked = isChecked(role.id, level.id, i)
              return (
                <div key={i} onClick={() => toggle(role.id, level.id, i)}
                  className="flex items-start gap-3 px-5 py-3.5 cursor-pointer hover:bg-[#111820] transition-colors">
                  <div className="w-5 h-5 rounded-md flex-shrink-0 mt-0.5 flex items-center justify-center transition-all"
                    style={{
                      border: checked ? `2px solid ${role.color}` : '2px solid #2a3040',
                      background: checked ? role.color + '25' : 'transparent',
                    }}>
                    {checked && (
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M1.5 6L4 8.5L9.5 2.5" stroke={role.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm leading-relaxed"
                    style={{ color: checked ? '#374151' : '#94a3b8', textDecoration: checked ? 'line-through' : 'none' }}>
                    {skill}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Project */}
        <div className="rounded-2xl border border-[#1e2330] bg-[#0f1117] mb-4 overflow-hidden">
          <button onClick={() => setShowProject(!showProject)}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-[#111820] transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-base">🚀</span>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: '#f59e0b' }}>Project to Build</div>
                <div className="text-sm font-semibold text-[#e2e8f0]">{level.project.title}</div>
              </div>
            </div>
            <span className="text-[#374151] text-sm" style={{ transform: showProject ? 'rotate(180deg)' : 'none', display:'inline-block', transition:'transform 0.2s' }}>▾</span>
          </button>
          {showProject && (
            <div className="px-5 pb-4 border-t border-[#1e2330] fade-in">
              <p className="text-sm text-[#64748b] leading-relaxed mt-3">{level.project.description}</p>
            </div>
          )}
        </div>

        {/* Interview Questions */}
        <div className="rounded-2xl border border-[#1e2330] bg-[#0f1117] mb-4 overflow-hidden">
          <div className="px-5 py-3 border-b border-[#1e2330] flex items-center gap-2">
            <span className="text-base">🎯</span>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#10b981' }}>Interview Questions</span>
          </div>
          <div className="divide-y divide-[#111820]">
            {level.interviewQs.map((q, i) => (
              <div key={i}>
                <button onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                  className="w-full px-5 py-3.5 flex items-start justify-between gap-3 text-left hover:bg-[#111820] transition-colors">
                  <span className="text-sm text-[#94a3b8] leading-relaxed">{q}</span>
                  <span className="text-[#374151] text-xs flex-shrink-0 mt-0.5">{expandedQ === i ? '▲' : '▼'}</span>
                </button>
                {expandedQ === i && (
                  <div className="px-5 pb-3 border-t border-[#111820] fade-in">
                    <p className="text-xs text-[#475569] mt-2 leading-relaxed italic">
                      Answer using concrete examples from your own projects. Aim for 60–90 seconds: situation → approach → result.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div className="rounded-2xl border border-[#1e2330] bg-[#0f1117] overflow-hidden">
          <button onClick={() => setShowResources(!showResources)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#111820] transition-colors">
            <div className="flex items-center gap-2">
              <span className="text-base">📚</span>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#8b5cf6' }}>Resources</span>
            </div>
            <span className="text-[#374151] text-sm" style={{ transform: showResources ? 'rotate(180deg)' : 'none', display:'inline-block', transition:'transform 0.2s' }}>▾</span>
          </button>
          {showResources && (
            <div className="px-5 pb-4 border-t border-[#1e2330] fade-in">
              <div className="flex flex-col gap-2 mt-3">
                {level.resources.map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[#6366f1] hover:text-[#818cf8] transition-colors"
                    onClick={e => e.stopPropagation()}>
                    <span className="text-xs">↗</span>
                    {r.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Confirmation modal */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="rounded-2xl border border-[#2a3040] bg-[#0f1117] p-6 w-full max-w-sm fade-in">
            <div className="text-3xl mb-3 text-center">
              {confirmReset === 'role' ? role.icon : '📋'}
            </div>
            <h2 className="text-[#e2e8f0] font-extrabold text-lg text-center mb-1">
              {confirmReset === 'role'
                ? `Reset ${role.title}?`
                : `Reset ${level.label} Level?`}
            </h2>
            <p className="text-[#475569] text-sm text-center mb-6 leading-relaxed">
              {confirmReset === 'role'
                ? `This clears all progress across all 3 levels for ${role.title}. This cannot be undone.`
                : `This clears all completed skills in the ${level.label} level only. Other levels are not affected.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmReset(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-[#1e2330] text-[#64748b] hover:text-[#94a3b8] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors"
                style={{ background: '#ef444420', border: '1px solid #ef444440', color: '#ef4444' }}
              >
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
