import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useProgress = create(
  persist(
    (set, get) => ({
      completed: {},
      notes: {},       // skillKey → string
      bookmarks: {},   // skillKey → true
      journal: {},     // roleId__levelId → [{text, date}]
      timeLog: {},     // skillKey → minutes (manually logged)

      // ── Completion ──────────────────────────────────────────────────────────
      toggle: (roleId, levelId, taskIndex) => {
        const key = `${roleId}__${levelId}__${taskIndex}`
        set(state => ({
          completed: { ...state.completed, [key]: !state.completed[key] }
        }))
      },
      isChecked: (roleId, levelId, taskIndex) =>
        !!get().completed[`${roleId}__${levelId}__${taskIndex}`],

      getLevelProgress: (roleId, levelId, count) => {
        const { completed } = get()
        let done = 0
        for (let i = 0; i < count; i++) {
          if (completed[`${roleId}__${levelId}__${i}`]) done++
        }
        return { done, total: count, pct: count ? Math.round((done / count) * 100) : 0 }
      },

      getRoleProgress: (roleId, levels) => {
        const { completed } = get()
        let total = 0, done = 0
        levels.forEach(lv => {
          const count = lv.skills.length
          total += count
          for (let i = 0; i < count; i++) {
            if (completed[`${roleId}__${lv.id}__${i}`]) done++
          }
        })
        return { done, total, pct: total ? Math.round((done / total) * 100) : 0 }
      },

      getTotalProgress: (roles) => {
        const { completed } = get()
        let total = 0
        roles.forEach(r => r.levels.forEach(lv => { total += lv.skills.length }))
        const done = Math.min(Object.values(completed).filter(Boolean).length, total)
        return { done, total, pct: total ? Math.round((done / total) * 100) : 0 }
      },

      resetAll: () => set({ completed: {} }),

      resetLevel: (roleId, levelId, count) => {
        const next = { ...get().completed }
        for (let i = 0; i < count; i++) delete next[`${roleId}__${levelId}__${i}`]
        set({ completed: next })
      },

      resetRole: (roleId, levels) => {
        const next = { ...get().completed }
        levels.forEach(lv => lv.skills.forEach((_, i) => delete next[`${roleId}__${lv.id}__${i}`]))
        set({ completed: next })
      },

      // ── Notes ───────────────────────────────────────────────────────────────
      setNote: (roleId, levelId, i, text) => {
        const key = `${roleId}__${levelId}__${i}`
        set(state => ({ notes: { ...state.notes, [key]: text } }))
      },
      getNote: (roleId, levelId, i) => get().notes[`${roleId}__${levelId}__${i}`] || '',

      // ── Bookmarks ───────────────────────────────────────────────────────────
      toggleBookmark: (roleId, levelId, i) => {
        const key = `${roleId}__${levelId}__${i}`
        set(state => {
          const next = { ...state.bookmarks }
          if (next[key]) delete next[key]
          else next[key] = true
          return { bookmarks: next }
        })
      },
      isBookmarked: (roleId, levelId, i) => !!get().bookmarks[`${roleId}__${levelId}__${i}`],
      getAllBookmarks: () => Object.keys(get().bookmarks).filter(k => get().bookmarks[k]),

      // ── Journal ─────────────────────────────────────────────────────────────
      addJournalEntry: (roleId, levelId, text) => {
        const key = `${roleId}__${levelId}`
        const entry = { text, date: new Date().toISOString() }
        set(state => ({
          journal: { ...state.journal, [key]: [entry, ...(state.journal[key] || [])] }
        }))
      },
      getJournalEntries: (roleId, levelId) => get().journal[`${roleId}__${levelId}`] || [],
      deleteJournalEntry: (roleId, levelId, index) => {
        const key = `${roleId}__${levelId}`
        set(state => {
          const entries = [...(state.journal[key] || [])]
          entries.splice(index, 1)
          return { journal: { ...state.journal, [key]: entries } }
        })
      },

      // ── Time logging ────────────────────────────────────────────────────────
      logTime: (roleId, levelId, i, minutes) => {
        const key = `${roleId}__${levelId}__${i}`
        set(state => ({
          timeLog: { ...state.timeLog, [key]: (state.timeLog[key] || 0) + minutes }
        }))
      },
      getTime: (roleId, levelId, i) => get().timeLog[`${roleId}__${levelId}__${i}`] || 0,
      getRoleTotalTime: (roleId, levels) => {
        const { timeLog } = get()
        let total = 0
        levels.forEach(lv =>
          lv.skills.forEach((_, i) => { total += timeLog[`${roleId}__${lv.id}__${i}`] || 0 })
        )
        return total
      },
    }),
    { name: 'skillpath-v2' }
  )
)

export default useProgress
