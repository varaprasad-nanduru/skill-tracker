import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useProgress = create(
  persist(
    (set, get) => ({
      completed: {},

      toggle: (roleId, levelId, taskIndex) => {
        const key = `${roleId}__${levelId}__${taskIndex}`
        set(state => ({
          completed: { ...state.completed, [key]: !state.completed[key] }
        }))
      },

      isChecked: (roleId, levelId, taskIndex) => {
        return !!get().completed[`${roleId}__${levelId}__${taskIndex}`]
      },

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

      resetAll: () => set({ completed: {} }),

      resetLevel: (roleId, levelId, count) => {
        const { completed } = get()
        const next = { ...completed }
        for (let i = 0; i < count; i++) {
          delete next[`${roleId}__${levelId}__${i}`]
        }
        set({ completed: next })
      },

      resetRole: (roleId, levels) => {
        const { completed } = get()
        const next = { ...completed }
        levels.forEach(lv => {
          lv.skills.forEach((_, i) => {
            delete next[`${roleId}__${lv.id}__${i}`]
          })
        })
        set({ completed: next })
      },

      getTotalProgress: (roles) => {
        const { completed } = get()
        let total = 0, done = 0
        roles.forEach(r => {
          r.levels.forEach(lv => {
            total += lv.skills.length
          })
        })
        done = Object.values(completed).filter(Boolean).length
        return { done: Math.min(done, total), total, pct: total ? Math.round((Math.min(done, total) / total) * 100) : 0 }
      }
    }),
    { name: 'skillpath-v1' }
  )
)

export default useProgress
