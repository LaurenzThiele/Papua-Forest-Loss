import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { useInView } from 'motion/react'
import ScrollReveal from '../components/ScrollReveal.jsx'
import SectionLabel from '../components/SectionLabel.jsx'
import UnitGrid from '../components/UnitGrid.jsx'
import AnimatedCounter from '../components/AnimatedCounter.jsx'

function DonutRing({ value, total, color, label, sublabel, size = 160 }) {
  const svgRef = useRef(null)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' })
  const animated = useRef(false)

  useEffect(() => {
    if (!svgRef.current) return
    const svg = d3.select(svgRef.current)
    const r = size / 2
    const thick = 18
    const innerR = r - thick

    svg.attr('width', size).attr('height', size)
    svg.selectAll('*').remove()

    const g = svg.append('g').attr('transform', `translate(${r},${r})`)

    g.append('path')
      .attr('d', d3.arc()({ outerRadius: r, innerRadius: innerR, startAngle: 0, endAngle: Math.PI * 2 }))
      .attr('fill', '#1e4d2b')

    const arc = d3.arc().outerRadius(r).innerRadius(innerR)
    const endAngle = (value / total) * Math.PI * 2

    const valuePath = g.append('path')
      .attr('d', arc({ startAngle: 0, endAngle: 0 }))
      .attr('fill', color)

    if (isInView && !animated.current) {
      animated.current = true
      const interp = d3.interpolate(0, endAngle)
      const duration = 1200
      let start = null
      function step(ts) {
        if (!start) start = ts
        const t = Math.min((ts - start) / duration, 1)
        const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
        valuePath.attr('d', arc({ startAngle: 0, endAngle: interp(ease) }))
        if (t < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }

    g.append('text')
      .attr('text-anchor', 'middle').attr('dy', '-0.15em')
      .attr('fill', '#f5f0e8').attr('font-family', "'Playfair Display', serif")
      .attr('font-weight', 700).attr('font-size', size * 0.11)
      .text(`${((value / total) * 100).toFixed(0)}%`)

    g.append('text')
      .attr('text-anchor', 'middle').attr('dy', '1.1em')
      .attr('fill', '#9ca3af').attr('font-family', "'Inter Tight', sans-serif")
      .attr('font-size', size * 0.07).text('of loss')

  }, [isInView, value, total, color, size])

  return (
    <div ref={ref} className="flex flex-col items-center gap-3 text-center">
      <svg ref={svgRef} />
      <div>
        <div className="font-data text-xs text-cream/60 uppercase tracking-widest">{label}</div>
        <div className="font-data text-[0.65rem] text-cream/30 mt-1 max-w-[140px] text-center mx-auto">{sublabel}</div>
      </div>
    </div>
  )
}

export default function ModerationSection({ summary, protectedData }) {
  const totalLoss = summary?.total_loss_ha ?? 1376575
  const totalGain = summary?.total_gain_ha ?? 132895
  const insidePA = protectedData?.inside_protected?.total_loss_ha ?? 119169
  const outsidePA = protectedData?.outside_protected?.total_loss_ha ?? 1257406

  const GRID_TOTAL = 200
  const lossSquares = Math.round((totalLoss / (totalLoss + totalGain)) * GRID_TOTAL * 0.12)
  const gainSquares = Math.round((totalGain / (totalLoss + totalGain)) * GRID_TOTAL * 0.12)

  return (
    <section className="bg-forest-deep section-pad">
      <div className="section-container">
        <ScrollReveal>
          <SectionLabel number="04" title="The Moderation and Its Limits" light />
          <h2
            className="font-display text-cream mb-6 text-balance"
            style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}
          >
            A real and sustained decline. The limits of that improvement are
            visible in the same data.
          </h2>
          <p className="text-cream/60 text-base leading-relaxed max-w-2xl mb-12">
            Following the 2015 to 2016 peak, annual forest loss in Papua declined
            consistently. By 2024 it had reached 40,733 hectares, the lowest
            figure recorded since 2003. The moderation is real. What the data
            also shows is what it does not mean.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-12 items-start mb-16">
          <ScrollReveal delay={0.1}>
            <div>
              <div className="eyebrow text-forest-accent mb-4">25-year forest balance</div>
              <UnitGrid
                total={GRID_TOTAL}
                segments={[
                  {
                    count: lossSquares,
                    color: '#c0392b',
                    label: `Lost: ${(totalLoss / 1000).toFixed(0)}k ha`,
                  },
                  {
                    count: gainSquares,
                    color: '#27ae60',
                    label: `Gained: ${(totalGain / 1000).toFixed(0)}k ha`,
                  },
                ]}
                cellSize={14}
                gap={3}
              />
              <p className="font-data text-xs text-cream/40 mt-5 leading-relaxed">
                Each cell represents a proportional share of the total forest
                area balance. Forest gain recovered less than 10% of the area
                lost over 25 years. Net loss: 1,243,680 ha.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div className="space-y-8">
              <div>
                <div className="eyebrow text-forest-accent mb-3">2024, lowest since 2003</div>
                <div className="flex items-end gap-3 mb-2">
                  <div className="stat-number text-gain">
                    <AnimatedCounter value={40733} />
                  </div>
                  <div className="font-data text-sm text-cream/40 pb-2">ha per year</div>
                </div>
                <p className="text-cream/50 text-sm leading-relaxed">
                  Still equivalent to losing an area the size of Yogyakarta
                  city every year, but substantially below peak levels.
                </p>
              </div>

              <div>
                <div className="eyebrow text-forest-accent mb-3">Contributing factors</div>
                <ul className="space-y-2 text-cream/60 text-sm leading-relaxed">
                  <li className="flex items-baseline gap-2">
                    <span className="text-forest-accent shrink-0">+</span>
                    <span>Sustained decline in global crude palm oil prices from 2011,
                    halving by 2019</span>
                  </li>
                  <li className="flex items-baseline gap-2">
                    <span className="text-forest-accent shrink-0">+</span>
                    <span>Indonesian primary forest moratorium</span>
                  </li>
                  <li className="flex items-baseline gap-2">
                    <span className="text-forest-accent shrink-0">+</span>
                    <span>Zero-deforestation supply chain commitments adopted by major
                    buyers from around 2013</span>
                  </li>
                </ul>
                <p className="font-data text-[0.65rem] text-cream/20 mt-3">
                  Trase / SEI (2024); PLOS ONE (2022).
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.1}>
          <div className="border-t border-white/10 pt-12">
            <div className="eyebrow text-forest-accent mb-6">
              Forest loss inside designated protected areas
            </div>
            <div className="grid md:grid-cols-3 gap-8 items-start">
              <div className="md:col-span-1 flex flex-wrap gap-6 justify-center items-start">
                <DonutRing
                  value={insidePA}
                  total={totalLoss}
                  color="#c0392b"
                  label="Inside protected areas"
                  sublabel="119,169 ha over 25 years"
                  size={130}
                />
                <DonutRing
                  value={outsidePA}
                  total={totalLoss}
                  color="#2d6a3f"
                  label="Outside protected areas"
                  sublabel="1,257,407 ha over 25 years"
                  size={130}
                />
              </div>
              <div className="md:col-span-2">
                <h3 className="font-display text-cream text-xl mb-4">
                  119,169 ha lost inside designated boundaries
                </h3>
                <p className="text-cream/60 text-sm leading-relaxed mb-4">
                  Cumulative protected area loss over 25 years reached 119,169
                  hectares, roughly the land area of Hong Kong, three times over.
                  Protection status did not prevent encroachment or land use
                  activity within designated boundaries.
                </p>
                <p className="text-cream/60 text-sm leading-relaxed mb-4">
                  The rate of loss inside protected areas was not significantly
                  reduced during the 2017 to 2024 moderation phase. It continued
                  at a broadly stable rate throughout the study period, ranging
                  from approximately 2,300 to 12,022 hectares per year.
                </p>
                <p className="font-data text-[0.65rem] text-cream/20">
                  Gaveau et al. (2021). Biological Conservation.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
