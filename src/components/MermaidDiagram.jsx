import { useEffect, useRef, useState } from 'react'

let idCounter = 0

export default function MermaidDiagram({ chart, color }) {
  const ref = useRef(null)
  const [error, setError] = useState(null)
  const id = useRef(`mermaid-${++idCounter}`)

  useEffect(() => {
    if (!chart || !ref.current) return
    setError(null)

    import('mermaid').then(mod => {
      const mermaid = mod.default
      mermaid.initialize({
        startOnLoad: false,
        theme: 'dark',
        themeVariables: {
          background: '#0f1117',
          primaryColor: color + '30',
          primaryBorderColor: color,
          primaryTextColor: '#e2e8f0',
          lineColor: '#475569',
          secondaryColor: '#1a1f2e',
          tertiaryColor: '#111820',
          edgeLabelBackground: '#0f1117',
          fontFamily: 'Segoe UI, system-ui, sans-serif',
          fontSize: '13px',
        },
        flowchart: { curve: 'basis', padding: 20 },
      })

      mermaid.render(id.current, chart)
        .then(({ svg }) => {
          if (ref.current) ref.current.innerHTML = svg
        })
        .catch(e => setError(String(e)))
    })
  }, [chart, color])

  if (error) return (
    <div className="text-xs px-3 py-2 rounded-lg" style={{ color: '#475569', background: '#111820' }}>
      Diagram unavailable
    </div>
  )

  return (
    <div ref={ref} className="w-full overflow-x-auto"
      style={{ filter: 'drop-shadow(0 0 12px ' + color + '15)' }} />
  )
}
