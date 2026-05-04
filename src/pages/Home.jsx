import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ROLES from '../data/roles'
import useProgress from '../store/useProgress'
import useTheme from '../hooks/useTheme'
import ProgressRing from '../components/ProgressRing'

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

// Parse a bookmark key and find the matching role/level/skill
function resolveBookmark(key, roles) {
  const parts = key.split('__')
  if (parts.length < 3) return null
  const skillIndex = parseInt(parts[parts.length - 1], 10)
  const levelId = parts[parts.length - 2]
  const roleId = parts.slice(0, parts.length - 2).join('__')
  const role = roles.find(r => r.id === roleId)
  if (!role) return null
  const level = role.levels.find(lv => lv.id === levelId)
  if (!level || skillIndex >= level.skills.length) return null
  return { role, level, skill: level.skills[skillIndex], skillIndex, key }
}

export default function Home() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')  // 'all' | 'bookmarks'
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmRoleReset, setConfirmRoleReset] = useState(null)
  const [dark, setDark] = useTheme()
  const navigate = useNavigate()

  const getTotalProgress  = useProgress(s => s.getTotalProgress)
  const getRoleProgress   = useProgress(s => s.getRoleProgress)
  const getLevelProgress  = useProgress(s => s.getLevelProgress)
  const resetAll          = useProgress(s => s.resetAll)
  const resetRole         = useProgress(s => s.resetRole)
  const getAllBookmarks    = useProgress(s => s.getAllBookmarks)
  const toggleBookmark    = useProgress(s => s.toggleBookmark)
  const getRoleTotalTime  = useProgress(s => s.getRoleTotalTime)

  const { done: totalDone, total: totalSkills, pct: overallPct } = getTotalProgress(ROLES)
  const rolesStarted = ROLES.filter(r => getRoleProgress(r.id, r.levels).done > 0).length
  const bookmarkKeys = getAllBookmarks()
  const bookmarks = bookmarkKeys.map(k => resolveBookmark(k, ROLES)).filter(Boolean)

  const filtered = ROLES.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.tagline.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-1)' }}>
      {/* Header */}
      <div className="pt-12 pb-6 px-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%)' }} />

        <button onClick={() => setDark(d => !d)}
          className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-xl transition-all hover:scale-110"
          style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--txt-3)' }}
          title={dark ? 'Light mode' : 'Dark mode'}>
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>

        <div className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4"
          style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.35)', color: '#818cf8' }}>
          SkillPath — Career Roadmaps
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 leading-tight" style={{ color: 'var(--txt-1)' }}>
          Master Skills That <span style={{ color: '#818cf8' }}>Never Go Outdated</span>
        </h1>
        <p className="text-sm max-w-lg mx-auto leading-relaxed" style={{ color: 'var(--txt-4)' }}>
          13 career tracks. Beginner → Intermediate → Expert. Real skills, real projects, real interview prep.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-20">

        {/* Stats */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Skills Done', value: totalDone, sub: `/ ${totalSkills}`, color: '#818cf8' },
            { label: 'Roles Started', value: rolesStarted, sub: `/ ${ROLES.length}`, color: '#06b6d4' },
            { label: 'Overall', value: `${overallPct}%`, sub: 'complete', color: '#10b981' },
            { label: 'Bookmarks', value: bookmarks.length, sub: 'saved', color: '#f59e0b' },
            { label: 'Tracks', value: ROLES.length, sub: 'available', color: '#8b5cf6' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center"
              style={{ border: '1px solid var(--border)', background: 'var(--bg-2)' }}>
              <div className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: 'var(--txt-4)' }}>{s.label}</div>
              <div className="text-xl font-extrabold font-mono" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px]" style={{ color: 'var(--txt-5)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Overall progress bar */}
        <div className="rounded-xl p-4 mb-6" style={{ border: '1px solid var(--border)', background: 'var(--bg-2)' }}>
          <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--txt-4)' }}>
            <span>Total Progress</span>
            <div className="flex items-center gap-3">
              <span className="font-bold" style={{ color: 'var(--txt-2)' }}>{totalDone} / {totalSkills} skills</span>
              {totalDone > 0 && (
                <button onClick={() => setConfirmReset(true)}
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                  style={{ color: '#ef4444', border: '1px solid #ef444430', background: '#ef444410' }}>
                  Reset All
                </button>
              )}
            </div>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-4)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${overallPct}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 p-1 rounded-xl w-fit" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
          {[
            { id: 'all', label: `All Roles (${ROLES.length})` },
            { id: 'bookmarks', label: `Bookmarks (${bookmarks.length})` },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
              style={{
                background: activeTab === tab.id ? '#6366f125' : 'transparent',
                border: activeTab === tab.id ? '1px solid #6366f140' : '1px solid transparent',
                color: activeTab === tab.id ? '#818cf8' : 'var(--txt-4)',
              }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── ALL ROLES TAB ── */}
        {activeTab === 'all' && (
          <>
            <div className="relative mb-6">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--txt-4)' }}>🔍</span>
              <input
                type="text"
                placeholder="Search roles or skills…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-xl py-3 pl-9 pr-4 text-sm outline-none"
                style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', color: 'var(--txt-1)' }}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(role => {
                const { done, total, pct } = getRoleProgress(role.id, role.levels)
                const levelDone = role.levels.map(lv =>
                  getLevelProgress(role.id, lv.id, lv.skills.length).pct === 100
                )
                const timeSpent = getRoleTotalTime(role.id, role.levels)

                return (
                  <div key={role.id} onClick={() => navigate(`/role/${role.id}`)}
                    className="cursor-pointer rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 hover:-translate-y-0.5 relative"
                    style={{ background: 'var(--bg-2)', border: `1px solid ${pct > 0 ? role.color + '35' : 'var(--border)'}` }}>

                    {done > 0 && (
                      <button onClick={e => { e.stopPropagation(); setConfirmRoleReset(role) }}
                        className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg transition-all hover:scale-110 z-10"
                        style={{ background: '#ef444415', border: '1px solid #ef444430', color: '#ef4444' }}
                        title={`Reset ${role.title}`}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M10 6A4 4 0 1 1 6 2v0M6 2l1.5 1.5M6 2L4.5 3.5" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    )}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                          style={{ background: role.color + '15' }}>
                          {role.icon}
                        </div>
                        <div>
                          <h3 className="text-[14px] font-bold leading-snug" style={{ color: 'var(--txt-1)' }}>{role.title}</h3>
                          <p className="text-[11px] mt-0.5 leading-snug line-clamp-2" style={{ color: 'var(--txt-4)' }}>{role.tagline}</p>
                          {timeSpent > 0 && (
                            <p className="text-[10px] mt-0.5" style={{ color: 'var(--txt-5)' }}>
                              ⏱ {timeSpent < 60 ? `${timeSpent}m` : `${Math.floor(timeSpent/60)}h`} logged
                            </p>
                          )}
                        </div>
                      </div>
                      <ProgressRing pct={pct} color={role.color} size={50} />
                    </div>

                    <div className="flex gap-2">
                      {role.levels.map((lv, i) => (
                        <div key={lv.id} className="flex-1 text-center py-1 rounded-lg text-[10px]"
                          style={{
                            background: levelDone[i] ? role.color + '20' : 'var(--bg-3)',
                            color: levelDone[i] ? role.color : 'var(--txt-5)',
                            border: `1px solid ${levelDone[i] ? role.color + '40' : 'var(--border)'}`,
                            fontWeight: 700,
                          }}>
                          {lv.label}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px]" style={{ color: 'var(--txt-5)' }}>{done}/{total} skills</span>
                      <span className="text-[11px] font-bold" style={{ color: role.color }}>
                        {pct === 0 ? 'Start →' : pct === 100 ? 'Complete ✓' : 'Continue →'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-20" style={{ color: 'var(--txt-5)' }}>No roles match "{search}"</div>
            )}
          </>
        )}

        {/* ── BOOKMARKS TAB ── */}
        {activeTab === 'bookmarks' && (
          <div>
            {bookmarks.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-4xl mb-3">☆</div>
                <p className="font-bold mb-1" style={{ color: 'var(--txt-3)' }}>No bookmarks yet</p>
                <p className="text-sm" style={{ color: 'var(--txt-5)' }}>
                  Open any role and click ☆ next to a skill to bookmark it for quick access.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {/* Group by role */}
                {ROLES.filter(r => bookmarks.some(b => b.role.id === r.id)).map(role => {
                  const roleBookmarks = bookmarks.filter(b => b.role.id === role.id)
                  return (
                    <div key={role.id} className="rounded-2xl border overflow-hidden"
                      style={{ border: `1px solid ${role.color}30`, background: 'var(--bg-2)' }}>
                      <div className="px-4 py-3 border-b flex items-center gap-2 cursor-pointer"
                        style={{ borderColor: role.color + '20', background: role.color + '08' }}
                        onClick={() => navigate(`/role/${role.id}`)}>
                        <span>{role.icon}</span>
                        <span className="text-sm font-bold" style={{ color: role.color }}>{role.title}</span>
                        <span className="text-xs text-[#475569] ml-auto">{roleBookmarks.length} saved</span>
                      </div>
                      {roleBookmarks.map(bm => (
                        <div key={bm.key} className="px-4 py-3 border-b flex items-start gap-3"
                          style={{ borderColor: 'var(--border)' }}>
                          <div className="text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 mt-0.5"
                            style={{ background: role.color + '18', color: role.color }}>
                            {bm.level.label}
                          </div>
                          <span className="text-sm flex-1 leading-relaxed" style={{ color: 'var(--txt-2)' }}>
                            {bm.skill}
                          </span>
                          <button
                            onClick={() => toggleBookmark(bm.role.id, bm.level.id, bm.skillIndex)}
                            className="text-xs flex-shrink-0 transition-colors hover:text-[#ef4444] mt-0.5"
                            style={{ color: role.color }}
                            title="Remove bookmark">
                            ★
                          </button>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Per-role reset modal */}
      {confirmRoleReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
          <div className="rounded-2xl p-6 w-full max-w-sm fade-in"
            style={{ border: '1px solid var(--border2)', background: 'var(--bg-2)' }}>
            <div className="text-3xl mb-3 text-center">{confirmRoleReset.icon}</div>
            <h2 className="font-extrabold text-lg text-center mb-1" style={{ color: 'var(--txt-1)' }}>
              Reset {confirmRoleReset.title}?
            </h2>
            <p className="text-sm text-center mb-6 leading-relaxed" style={{ color: 'var(--txt-3)' }}>
              Clears all completed skills for this role. Other roles are not affected.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmRoleReset(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ border: '1px solid var(--border)', color: 'var(--txt-3)' }}>
                Cancel
              </button>
              <button onClick={() => { resetRole(confirmRoleReset.id, confirmRoleReset.levels); setConfirmRoleReset(null) }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#ef444420', border: '1px solid #ef444440', color: '#ef4444' }}>
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset All modal */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl p-6 w-full max-w-sm fade-in"
            style={{ border: '1px solid var(--border2)', background: 'var(--bg-2)' }}>
            <div className="text-3xl mb-3 text-center">⚠️</div>
            <h2 className="font-extrabold text-lg text-center mb-1" style={{ color: 'var(--txt-1)' }}>Reset All Progress?</h2>
            <p className="text-sm text-center mb-6 leading-relaxed" style={{ color: 'var(--txt-3)' }}>
              Clears every completed skill across all 13 roles. Cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmReset(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ border: '1px solid var(--border)', color: 'var(--txt-3)' }}>
                Cancel
              </button>
              <button onClick={() => { resetAll(); setConfirmReset(false) }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: '#ef444420', border: '1px solid #ef444440', color: '#ef4444' }}>
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
