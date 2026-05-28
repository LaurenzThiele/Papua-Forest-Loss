import { useEffect, useRef, useMemo } from 'react'
import * as d3 from 'd3'
import { useInView } from 'motion/react'
import ScrollReveal from '../components/ScrollReveal.jsx'
import SectionLabel from '../components/SectionLabel.jsx'
import AnimatedCounter from '../components/AnimatedCounter.jsx'
import { useContainerWidth } from '../hooks/useContainerWidth.js'

const PROVINCE_DATA = [
  { name: 'Papua Selatan', ha: 386027, pct: 28.0, color: '#7b1818' },
  { name: 'Papua Barat', ha: 258724, pct: 18.8, color: '#c0392b' },
  { name: 'Papua', ha: 212833, pct: 15.5, color: '#e67e22' },
  { name: 'Papua Tengah', ha: 179150, pct: 13.0, color: '#d4a017' },
  { name: 'Papua Pegunungan', ha: 170404, pct: 12.4, color: '#2d6a3f' },
  { name: 'Papua Barat Daya', ha: 169489, pct: 12.3, color: '#3d8b52' },
]

const DRIVER_DATA = [
  { key: 'outside', label: 'Outside concessions', pct: 83.4, ha: 1148009, color: '#6b7280', squares: 83 },
  { key: 'palm', label: 'Palm oil', pct: 8.9, ha: 122586, color: '#d4ac0d', squares: 9 },
  { key: 'wood', label: 'Wood fiber', pct: 6.1, ha: 84405, color: '#884ea0', squares: 6 },
  { key: 'mining', label: 'Mining', pct: 1.6, ha: 21576, color: '#a04000', squares: 2 },
]

function Treemap({ data }) {
  const svgRef = useRef(null)
  const wrapRef = useRef(null)
  const isInView = useInView(wrapRef, { once: true, margin: '-10% 0px' })
  const animated = useRef(false)
  const containerWidth = useContainerWidth(wrapRef)

  useEffect(() => {
    if (!svgRef.current || containerWidth === 0) return
    if (!isInView && !animated.current) return

    animated.current = true

    const width = containerWidth
    const containerH = wrapRef.current?.clientHeight ?? 0
    const height = containerH > 60 ? containerH : Math.max(220, Math.min(340, width * 0.7))

    d3.select(svgRef.current).selectAll('*').remove()

    const root = d3.hierarchy({ children: data })
      .sum(d => d.ha)
      .sort((a, b) => b.value - a.value)

    d3.treemap()
      .size([width, height])
      .paddingOuter(6)
      .paddingInner(4)
      .round(true)(root)

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Treemap of cumulative forest loss by province in Papua 2001–2025. Papua Selatan is largest at 386,027 ha (28%).')

    const cell = svg.selectAll('g')
      .data(root.leaves())
      .enter()
      .append('g')
      .attr('transform', d => `translate(${d.x0},${d.y0})`)

    cell.append('rect')
      .attr('width', d => d.x1 - d.x0)
      .attr('height', d => d.y1 - d.y0)
      .attr('fill', d => d.data.color)
      .attr('rx', 6)
      .attr('opacity', 0)
      .transition().duration(600).delay((_, i) => i * 60)
      .attr('opacity', 0.85)

    cell.each(function(d) {
      const w = d.x1 - d.x0
      const h = d.y1 - d.y0
      if (w < 50 || h < 32) return

      const g = d3.select(this)
      const nameFontSize = Math.min(w / 10, 14)
      const dataFontSize = Math.min(w / 14, 11)

      g.append('text')
        .attr('x', 8).attr('y', 18)
        .attr('fill', '#f5f0e8')
        .attr('font-family', "'Playfair Display', serif")
        .attr('font-weight', 700)
        .attr('font-size', nameFontSize)
        .text(w < 90 ? d.data.name.split(' ')[0] : d.data.name)
        .attr('opacity', 0)
        .transition().duration(500).delay(300 + PROVINCE_DATA.indexOf(d.data) * 60)
        .attr('opacity', 1)

      if (h >= 46) {
        g.append('text')
          .attr('x', 8).attr('y', 34)
          .attr('fill', '#f5f0e8')
          .attr('opacity', 0)
          .attr('font-family', "'Inter Tight', sans-serif")
          .attr('font-size', dataFontSize)
          .text(`${d.data.pct}%`)
          .transition().duration(500).delay(380 + PROVINCE_DATA.indexOf(d.data) * 60)
          .attr('opacity', 0.6)
      }
    })

  }, [isInView, data, containerWidth])

  return (
    <div ref={wrapRef} className="relative w-full h-full" style={{ minHeight: 220 }}>
      <svg ref={svgRef} className="w-full" />
    </div>
  )
}

function WaffleChart({ data }) {
  const allSquares = []
  data.forEach(d => {
    for (let i = 0; i < d.squares; i++) {
      allSquares.push({ color: d.color, label: d.label })
    }
  })

  return (
    <div>
      <div
        className="grid gap-1 mb-5"
        style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}
      >
        {allSquares.map((sq, i) => (
          <div
            key={i}
            className="aspect-square rounded-sm"
            style={{ backgroundColor: sq.color, opacity: 0.85 }}
            title={sq.label}
          />
        ))}
      </div>
      <div className="space-y-2">
        {data.map(d => (
          <div key={d.key} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: d.color, opacity: 0.85 }}
              />
              <span className="font-data text-xs text-ink-muted truncate">{d.label}</span>
            </div>
            <div className="font-data text-xs text-ink shrink-0">
              <span className="font-semibold">{d.pct}%</span>
              <span className="text-ink-muted ml-1 hidden sm:inline">({(d.ha / 1000).toFixed(0)}k ha)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SynthesisSection({ summary }) {
  const totalLoss = summary?.total_loss_ha ?? 1376575
  const totalGain = summary?.total_gain_ha ?? 132895

  return (
    <section className="bg-cream section-pad">
      <div className="section-container">
        <ScrollReveal>
          <SectionLabel number="07" title="What 25 Years Shows" />
          <h2
            className="font-display text-ink mb-6 text-balance"
            style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}
          >
            The loss is real, uneven, and concentrated. 97% of the
            forest still stands.
          </h2>
          <p className="text-ink-muted text-base leading-relaxed max-w-2xl mb-12">
            Over 25 years, Papua lost 1,376,575 hectares of forest. Net loss,
            accounting for forest gain of 132,895 hectares, stands at 1,243,680
            hectares: 2.71% of the year-2000 baseline. The loss
            is unevenly distributed.
          </p>
        </ScrollReveal>

        {/* Three summary stats — single column on mobile, 3-col on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-14">
          <ScrollReveal delay={0}>
            <div>
              <div className="stat-number text-loss-peak flex items-baseline gap-1">
                <AnimatedCounter value={1376575} />
                <span className="font-data text-sm text-ink/50">ha</span>
              </div>
              <div className="font-data text-xs text-ink-muted uppercase tracking-widest mt-2">
                Total loss 2001–2025
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.08}>
            <div>
              <div className="stat-number text-loss-mid flex items-baseline gap-1">
                <AnimatedCounter value={1243680} />
                <span className="font-data text-sm text-ink/50">ha</span>
              </div>
              <div className="font-data text-xs text-ink-muted uppercase tracking-widest mt-2">
                Net loss (after gain)
              </div>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.16}>
            <div>
              <div className="stat-number text-forest-light">
                <AnimatedCounter value={97} suffix="%" />
              </div>
              <div className="font-data text-xs text-ink-muted uppercase tracking-widest mt-2">
                Forest retained
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Treemap + Waffle */}
        <div className="grid md:grid-cols-2 gap-10 mb-14">
          <ScrollReveal delay={0.1} className="h-full">
            <div className="flex flex-col h-full">
              <div className="eyebrow text-forest-light mb-4">Loss by province (cumulative)</div>
              <div className="bg-forest-deep rounded-xl overflow-hidden flex-1">
                <Treemap data={PROVINCE_DATA} />
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div className="flex flex-col h-full">
              <div className="eyebrow text-forest-light mb-4">Loss by driver (% of total)</div>
              <div className="bg-cream-dark rounded-xl p-6 flex-1">
                <WaffleChart data={DRIVER_DATA} />
                <p className="font-data text-[0.65rem] text-ink/30 mt-5 leading-relaxed">
                  Each square = 1% of total cumulative loss.
                  Industrial concession share (palm + wood + mining) was concentrated
                  in the 2011–2016 period.
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Gaveau projection */}
        <ScrollReveal delay={0.1}>
          <div className="bg-forest-deep rounded-2xl overflow-hidden grid md:grid-cols-2">
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <div className="eyebrow text-forest-accent mb-4">Forward projection</div>
              <p className="font-display text-cream text-xl mb-4 leading-relaxed">
                "Up to 4.5 million hectares could be lost by 2036, an area
                larger than the Netherlands."
              </p>
              <p className="text-cream/50 text-sm leading-relaxed mb-3">
                Scientific modelling projects that if the Trans-Papua Highway
                is fully completed and current concession trajectories continue,
                up to 4.5 million hectares of Papua's forest could be lost by
                2036. That projection was made before the 2025 acceleration
                documented in this dataset.
              </p>
              <p className="font-data text-[0.65rem] text-cream/20">
                Gaveau et al. (2021). Biological Conservation.
              </p>
            </div>
            <div className="flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.18)' }}>
              <svg width="100%" viewBox="0 0 280 160" fill="none" style={{ maxHeight: 260 }}>
                <line x1="0" y1="128" x2="278" y2="128" stroke="#f5f0e8" strokeWidth="0.8" strokeOpacity="0.18" />
                <line x1="162" y1="0" x2="162" y2="128" stroke="#f5f0e8" strokeWidth="0.8" strokeOpacity="0.18" strokeDasharray="4,5" />
                <polyline
                  points="16,108 45,98 80,88 115,78 140,68 161,60.5"
                  stroke="#c0392b" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"
                />
                <polyline
                  points="163,60 184,52 200,38 238,18 262,10"
                  stroke="#c0392b" strokeWidth="1" strokeDasharray="3,2" strokeLinecap="round" strokeLinejoin="round" opacity="0.8"
                />
                <text x="85" y="146" fontSize="9.5" fill="rgba(156,163,175,0.65)" fontFamily="'Inter Tight',sans-serif" textAnchor="middle">2001 – 2025</text>
                <text x="220" y="146" fontSize="9.5" fill="rgba(156,163,175,0.65)" fontFamily="'Inter Tight',sans-serif" textAnchor="middle">→ 2036</text>
                <text x="85" y="158" fontSize="8" fill="rgba(192,57,43,0.5)" fontFamily="'Inter Tight',sans-serif" textAnchor="middle">observed</text>
                <text x="220" y="158" fontSize="8" fill="rgba(192,57,43,0.5)" fontFamily="'Inter Tight',sans-serif" textAnchor="middle">projected</text>
              </svg>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
