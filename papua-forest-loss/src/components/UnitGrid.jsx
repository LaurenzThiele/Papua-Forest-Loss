import { useRef } from 'react'
import { motion, useInView } from 'motion/react'

export default function UnitGrid({
  total = 100,
  segments = [],
  cellSize = 12,
  gap = 2,
  className = '',
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-5% 0px' })

  // segments: [{ count, color, label }]
  const cells = []
  let idx = 0
  for (const seg of segments) {
    for (let i = 0; i < seg.count; i++) {
      cells.push({ color: seg.color, segIdx: segments.indexOf(seg) })
      idx++
    }
  }
  while (cells.length < total) {
    cells.push({ color: '#e5e5e5', segIdx: -1 })
  }

  const cols = Math.ceil(Math.sqrt(total * 1.6))

  return (
    <div ref={ref} className={className}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
          gap: `${gap}px`,
        }}
      >
        {cells.map((cell, i) => (
          <motion.div
            key={i}
            style={{
              width: cellSize,
              height: cellSize,
              borderRadius: 2,
              backgroundColor: cell.color,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
            transition={{
              duration: 0.3,
              delay: isInView ? i * 0.003 : 0,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>
      {segments.length > 0 && (
        <div className="flex flex-wrap gap-4 mt-4">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: seg.color }}
              />
              <span className="font-data text-xs text-ink-muted">{seg.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
