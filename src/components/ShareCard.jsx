import { useState } from 'react'

export default function ShareCard({ role, roleProgress, levelProgresses, onClose }) {
  const [copied, setCopied] = useState(false)

  const completedLevels = levelProgresses.filter(lp => lp.pct === 100).map(lp => lp.label)

  const shareText = `🚀 My ${role.title} Progress on SkillPath
${role.icon} ${roleProgress.pct}% complete (${roleProgress.done}/${roleProgress.total} skills)
${completedLevels.length > 0 ? `✅ Completed: ${completedLevels.join(', ')}` : '📈 In Progress'}
${levelProgresses.map(lp => `  ${lp.label}: ${lp.pct}%`).join('\n')}

Track your own skills → skillpath.app`

  function copyText() {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm fade-in">

        {/* Shareable card */}
        <div className="rounded-2xl overflow-hidden mb-4 border"
          style={{ border: `1px solid ${role.color}40` }}>

          {/* Card top band */}
          <div className="px-6 pt-6 pb-4"
            style={{ background: `linear-gradient(135deg, ${role.color}20 0%, #0f1117 100%)` }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: role.color + '20' }}>
                {role.icon}
              </div>
              <div>
                <div className="font-extrabold text-[#e2e8f0]">{role.title}</div>
                <div className="text-xs text-[#475569]">SkillPath Progress Card</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-3xl font-extrabold font-mono" style={{ color: role.color }}>
                  {roleProgress.pct}%
                </div>
                <div className="text-xs text-[#374151]">{roleProgress.done}/{roleProgress.total} skills</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1a1f2e' }}>
              <div className="h-full rounded-full transition-all"
                style={{ width: `${roleProgress.pct}%`, background: role.color }} />
            </div>
          </div>

          {/* Level breakdown */}
          <div className="px-6 pb-5 pt-4" style={{ background: '#0f1117' }}>
            <div className="flex flex-col gap-2">
              {levelProgresses.map(lp => (
                <div key={lp.id} className="flex items-center gap-3">
                  <span className="text-xs font-bold w-24 text-[#475569]">{lp.label}</span>
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#1a1f2e' }}>
                    <div className="h-full rounded-full"
                      style={{ width: `${lp.pct}%`, background: lp.pct === 100 ? role.color : role.color + '70' }} />
                  </div>
                  <span className="text-xs font-bold w-8 text-right"
                    style={{ color: lp.pct === 100 ? role.color : '#475569' }}>
                    {lp.pct === 100 ? '✓' : `${lp.pct}%`}
                  </span>
                </div>
              ))}
            </div>

            {completedLevels.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {completedLevels.map(l => (
                  <span key={l} className="text-[10px] px-2 py-1 rounded-full font-bold"
                    style={{ background: role.color + '20', color: role.color, border: `1px solid ${role.color}40` }}>
                    {l} ✓
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 text-[10px] text-[#2a3040] text-center">
              skillpath.app — 13 career tracks · Build real skills
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={copyText}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
            style={{ background: copied ? '#10b98120' : role.color + '20',
                     border: `1px solid ${copied ? '#10b98150' : role.color + '50'}`,
                     color: copied ? '#10b981' : role.color }}>
            {copied ? 'Copied! ✓' : 'Copy Text'}
          </button>
          <button onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-bold border border-[#1e2330] transition-colors"
            style={{ color: '#475569' }}>
            Close
          </button>
        </div>
        <p className="text-center text-xs mt-2 text-[#2a3040]">Screenshot the card above to share as image</p>
      </div>
    </div>
  )
}
