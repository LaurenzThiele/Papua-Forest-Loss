import { useEffect, useRef, useMemo } from 'react'
import * as d3 from 'd3'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useInView } from 'motion/react'
import ScrollReveal from '../components/ScrollReveal.jsx'
import SectionLabel from '../components/SectionLabel.jsx'
import AnimatedCounter from '../components/AnimatedCounter.jsx'
import { useContainerWidth } from '../hooks/useContainerWidth.js'

gsap.registerPlugin(ScrollTrigger)

const RECENT_YEARS = ['2019','2020','2021','2022','2023','2024','2025']

function SpikeHistogram({ summary }) {
  const svgRef = useRef(null)
  const wrapRef = useRef(null)
  const animated = useRef(false)
  const containerWidth = useContainerWidth(wrapRef)

  const data = useMemo(() => {
    if (!summary) return []
    return RECENT_YEARS.map(y => ({
      year: +y,
      ha: summary.annual_loss[y] ?? 0,
      isPrelim: y === '2025',
    }))
  }, [summary])

  useEffect(() => {
    if (!svgRef.current || data.length === 0 || containerWidth === 0) return

    const width = containerWidth
    const isMobile = width < 480
    const height = isMobile ? 220 : 260
    const margin = { top: 28, right: isMobile ? 12 : 24, bottom: 48, left: isMobile ? 52 : 72 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Bar chart showing annual forest loss in Papua 2019 to 2025. 2024: 40,733 ha (lowest since 2003). 2025 preliminary: 72,889 ha, highest since 2016.')

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleBand()
      .domain(data.map(d => d.year))
      .range([0, innerW])
      .padding(0.25)

    const y = d3.scaleLinear()
      .domain([0, 90000])
      .range([innerH, 0])

    g.append('g')
      .call(d3.axisLeft(y).ticks(isMobile ? 3 : 4).tickFormat(d => `${(d/1000).toFixed(0)}k${isMobile ? '' : ' ha'}`))
      .call(ax => ax.select('.domain').remove())
      .call(ax => ax.selectAll('.tick line')
        .attr('x2', innerW).attr('stroke', '#374151').attr('stroke-opacity', 0.3)
        .attr('stroke-dasharray', '3,3'))
      .call(ax => ax.selectAll('.tick text')
        .attr('fill', '#9ca3af').attr('font-size', 10)
        .attr('font-family', "'Inter Tight', sans-serif"))

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x))
      .call(ax => ax.select('.domain').attr('stroke', '#374151').attr('stroke-opacity', 0.3))
      .call(ax => ax.selectAll('.tick line').remove())
      .call(ax => ax.selectAll('.tick text')
        .attr('fill', '#9ca3af').attr('font-size', isMobile ? 10 : 11)
        .attr('font-family', "'Inter Tight', sans-serif"))

    const bars = g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', d => x(d.year))
      .attr('width', x.bandwidth())
      .attr('y', innerH)
      .attr('height', 0)
      .attr('fill', d => d.year === 2025 ? '#c0392b' : '#374151')
      .attr('rx', 3)

    bars
      .on('pointerover', function() {
        gsap.to(this, { scaleY: 1.04, transformOrigin: 'bottom', duration: 0.15 })
      })
      .on('pointerout', function() {
        gsap.to(this, { scaleY: 1, duration: 0.2 })
      })

    if (animated.current) {
      bars.attr('y', d => y(d.ha)).attr('height', d => innerH - y(d.ha))
    } else {
      bars.nodes().forEach((node, i) => {
        gsap.to(node, {
          attr: { y: y(data[i].ha), height: innerH - y(data[i].ha) },
          duration: 0.7,
          delay: i * 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: wrapRef.current,
            start: 'top 80%',
            onEnter: () => { animated.current = true },
          },
        })
      })
    }

    const labels = g.selectAll('.bar-label')
      .data(data)
      .enter()
      .append('text')
      .attr('x', d => x(d.year) + x.bandwidth() / 2)
      .attr('y', d => y(d.ha) - 7)
      .attr('text-anchor', 'middle')
      .attr('fill', d => d.year === 2025 ? '#f87171' : '#6b7280')
      .attr('font-family', "'Inter Tight', sans-serif")
      .attr('font-size', d => d.year === 2025 ? (isMobile ? 11 : 12) : (isMobile ? 9 : 10))
      .attr('font-weight', d => d.year === 2025 ? 600 : 400)
      .attr('opacity', animated.current ? 1 : 0)
      .text(d => `${(d.ha / 1000).toFixed(0)}k`)

    if (!animated.current) {
      labels.nodes().forEach((node, i) => {
        gsap.to(node, {
          attr: { opacity: 1 },
          duration: 0.4,
          delay: i * 0.08 + 0.5,
          scrollTrigger: {
            trigger: wrapRef.current,
            start: 'top 80%',
          },
        })
      })
    }

    g.append('text')
      .attr('x', x(2025) + x.bandwidth() / 2)
      .attr('y', innerH + 34)
      .attr('text-anchor', 'middle')
      .attr('fill', '#6b7280')
      .attr('font-size', 9)
      .attr('font-family', "'Inter Tight', sans-serif")
      .text('preliminary')

  }, [data, containerWidth])

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg ref={svgRef} className="w-full" />
    </div>
  )
}

function ProvinceBar({ name, ha, maxHa, isHighlight, color, delay = 0 }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-5% 0px' })
  const containerWidth = useContainerWidth(ref)
  const pct = (ha / maxHa) * 100
  const isMobile = containerWidth > 0 && containerWidth < 480

  return (
    <div ref={ref} className="flex items-center gap-3">
      <div
        className="font-data text-xs text-cream/60 shrink-0 text-right"
        style={{ width: isMobile ? '6rem' : '9rem' }}
      >
        {name}
      </div>
      <div className="flex-1 bg-white/5 rounded-full h-5 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: isInView ? `${pct}%` : '0%',
            backgroundColor: color,
            transition: `width 0.8s cubic-bezier(0.25,0.1,0.25,1) ${delay}s`,
          }}
        />
      </div>
      <div
        className="font-data text-xs shrink-0 text-right"
        style={{ color: isHighlight ? color : '#9ca3af', width: isMobile ? '4.5rem' : '5rem' }}
      >
        {isMobile
          ? `${(ha / 1000).toFixed(0)}k`
          : ha.toLocaleString('en-US', { maximumFractionDigits: 0 })} ha
      </div>
    </div>
  )
}

const PROVINCE_2025 = [
  { name: 'Papua Selatan', ha: 26290.89, highlight: true, color: '#c0392b' },
  { name: 'Papua Tengah', ha: 12274.83, highlight: true, color: '#e67e22' },
  { name: 'Papua Barat Daya', ha: 9934.02, highlight: false, color: '#4b5563' },
  { name: 'Papua Pegunungan', ha: 9019.08, highlight: false, color: '#4b5563' },
  { name: 'Papua Barat', ha: 8245.44, highlight: false, color: '#4b5563' },
  { name: 'Papua', ha: 7132.23, highlight: false, color: '#4b5563' },
]

export default function ReversalSection({ summary }) {
  const maxHa = PROVINCE_2025[0].ha

  return (
    <section className="bg-forest-deep section-pad">
      <div className="section-container">

        <ScrollReveal>
          <SectionLabel number="05" title="2025: A Reversal" light />
          <div className="mb-6">
            <div className="stat-number text-loss-peak">
              <AnimatedCounter value={72889} />
            </div>
            <div className="font-data text-sm text-cream/50 uppercase tracking-widest mt-2">
              Hectares lost in 2025, highest annual figure since 2016
            </div>
          </div>
          <p className="text-cream/60 text-base leading-relaxed max-w-2xl mb-12">
            The 2017 to 2024 moderation trend reversed sharply in 2025. Independent
            monitoring organisations documented a 348% increase in Papua's
            deforestation rate. The primary driver is government-authorised
            land clearing, not illegal activity.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-10 mb-14">

          <ScrollReveal delay={0.1}>
            <div className="bg-white/3 border border-white/8 rounded-2xl p-6">
              <div className="eyebrow text-forest-accent mb-4">Annual loss 2019 to 2025</div>
              <SpikeHistogram summary={summary} />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.15}>
            <div className="space-y-5">

              <div className="bg-loss-peak/10 border border-loss-peak/20 rounded-2xl p-6">
                <div className="font-data text-xs text-loss-peak/70 uppercase tracking-widest mb-2">
                  Auriga Nusantara, STADI 2025 report
                </div>
                <div className="font-display text-cream text-5xl font-black mb-2">348%</div>
                <p className="text-cream/60 text-sm leading-relaxed">
                  Increase in Papua's deforestation rate. Identified as Indonesia's
                  third-largest deforestation hotspot after Kalimantan and Sumatra
                  for the first time.
                </p>
              </div>

              <div className="bg-palm/8 border border-palm/20 rounded-xl p-5">
                <div className="font-data text-xs text-palm uppercase tracking-widest mb-2">
                  Palm oil driver
                </div>
                <p className="font-display text-cream text-2xl mb-2">15,917 ha</p>
                <p className="text-cream/60 text-sm leading-relaxed">
                  Palm oil-attributed loss in 2025, highest since 2012.
                  65 active oil palm concessions identified as engaged in
                  forest conversion.
                </p>
                <p className="font-data text-[0.65rem] text-cream/20 mt-2">
                  Nusantara Atlas (2026).
                </p>
              </div>

              <div className="bg-white/3 rounded-xl p-4 text-sm text-cream/50 leading-relaxed">
                Nationally, Indonesia's total deforestation rose 66% in 2025
                to 433,751 hectares.
                <span className="text-cream/25 ml-1">Mongabay (April 2026).</span>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.1}>
          <div className="border-t border-white/10 pt-10">
            <div className="grid md:grid-cols-2 gap-10">

              <div>
                <div className="eyebrow text-forest-accent mb-5">
                  2025 loss by province
                </div>
                <div className="space-y-3">
                  {PROVINCE_2025.map((p, i) => (
                    <ProvinceBar
                      key={p.name}
                      name={p.name}
                      ha={p.ha}
                      maxHa={maxHa}
                      isHighlight={p.highlight}
                      color={p.color}
                      delay={i * 0.08}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="eyebrow text-loss-peak mb-2">
                  Who is clearing the forest
                </div>
                <p className="font-display text-cream text-lg leading-snug mb-3">
                  Not illegal loggers. The Indonesian government.
                </p>
                <p className="text-cream/60 text-sm leading-relaxed mb-3">
                  Papua Selatan accounts for 36% of all 2025 loss. The clearing
                  in Merauke and Tanah Miring districts is authorised under the
                  Merauke Food and Energy Estate, a National Strategic Project
                  of the Indonesian government.
                </p>
                <div className="bg-loss-peak/8 border border-loss-peak/20 rounded-xl p-5">
                  <div className="font-data text-xs text-loss-peak uppercase tracking-widest mb-2">
                    Scale of the designation
                  </div>
                  <p className="font-display text-cream text-2xl mb-1">3 million hectares</p>
                  <p className="text-cream/60 text-xs leading-relaxed">
                    Designated for agricultural conversion in Merauke alone.
                    That is more than twice the total forest loss recorded
                    across all six provinces over 25 years.
                  </p>
                </div>
                <p className="font-data text-[0.65rem] text-cream/20 leading-relaxed">
                  Mongabay (2024); Mighty Earth (2025).
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
