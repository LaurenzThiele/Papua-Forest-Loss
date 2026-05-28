import { useEffect, useRef, useMemo } from 'react'
import * as d3 from 'd3'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useInView } from 'motion/react'
import ScrollReveal from '../components/ScrollReveal.jsx'
import SectionLabel from '../components/SectionLabel.jsx'
import { useContainerWidth } from '../hooks/useContainerWidth.js'

gsap.registerPlugin(ScrollTrigger)

const EARLY_YEARS = ['2001','2002','2003','2004','2005','2006','2007','2008','2009']

function AreaChart({ summary }) {
  const svgRef = useRef(null)
  const wrapRef = useRef(null)
  const isInView = useInView(wrapRef, { once: true, margin: '-10% 0px' })
  const animated = useRef(false)
  const containerWidth = useContainerWidth(wrapRef)

  const data = useMemo(() => {
    if (!summary) return []
    return EARLY_YEARS.map(y => ({ year: +y, ha: summary.annual_loss[y] ?? 0 }))
  }, [summary])

  useEffect(() => {
    if (!svgRef.current || data.length === 0 || containerWidth === 0) return

    const width = containerWidth
    const isMobile = width < 480
    const height = isMobile ? 220 : 280
    const margin = {
      top: 24,
      right: 20,
      bottom: 40,
      left: isMobile ? 52 : 70,
    }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Area chart showing annual forest loss in Papua 2001 to 2009, ranging from 21,845 to 43,893 hectares per year')

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleLinear().domain([2001, 2009]).range([0, innerW])
    const y = d3.scaleLinear().domain([0, 60000]).range([innerH, 0])

    // Grid
    g.append('g')
      .call(d3.axisLeft(y).ticks(isMobile ? 3 : 4).tickFormat(d => `${(d/1000).toFixed(0)}k`))
      .call(ax => ax.select('.domain').remove())
      .call(ax => ax.selectAll('.tick line')
        .attr('x2', innerW).attr('stroke', '#2d6a3f').attr('stroke-opacity', 0.2)
        .attr('stroke-dasharray', '3,3'))
      .call(ax => ax.selectAll('.tick text')
        .attr('fill', '#9ca3af').attr('font-family', "'Inter Tight', sans-serif").attr('font-size', isMobile ? 10 : 11))

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(isMobile ? 5 : 9).tickFormat(d => String(d)))
      .call(ax => ax.select('.domain').attr('stroke', '#2d6a3f').attr('stroke-opacity', 0.3))
      .call(ax => ax.selectAll('.tick line').remove())
      .call(ax => ax.selectAll('.tick text')
        .attr('fill', '#9ca3af').attr('font-family', "'Inter Tight', sans-serif").attr('font-size', isMobile ? 10 : 11))

    // Gradient
    const defs = svg.append('defs')
    const grad = defs.append('linearGradient').attr('id', 'areaGrad')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0).attr('y1', margin.top).attr('x2', 0).attr('y2', margin.top + innerH)
    grad.append('stop').attr('offset', '0%').attr('stop-color', '#2d6a3f').attr('stop-opacity', 0.4)
    grad.append('stop').attr('offset', '100%').attr('stop-color', '#2d6a3f').attr('stop-opacity', 0.04)

    const areaPath = g.append('path')
      .datum(data)
      .attr('d', d3.area().x(d => x(d.year)).y0(innerH).y1(d => y(d.ha)).curve(d3.curveMonotoneX))
      .attr('fill', 'url(#areaGrad)').attr('opacity', 0)

    const linePath = g.append('path')
      .datum(data)
      .attr('fill', 'none').attr('stroke', '#2d6a3f').attr('stroke-width', 2.5)
      .attr('d', d3.line().x(d => x(d.year)).y(d => y(d.ha)).curve(d3.curveMonotoneX))

    const totalLength = linePath.node().getTotalLength()
    linePath.attr('stroke-dasharray', `${totalLength} ${totalLength}`).attr('stroke-dashoffset', totalLength)

    const dots = g.selectAll('.dot').data(data).enter().append('circle')
      .attr('cx', d => x(d.year)).attr('cy', d => y(d.ha))
      .attr('r', 4).attr('fill', '#0f2318').attr('stroke', '#2d6a3f').attr('stroke-width', 2)
      .attr('opacity', 0)

    const hitDots = g.selectAll('.hit').data(data).enter().append('circle')
      .attr('cx', d => x(d.year)).attr('cy', d => y(d.ha))
      .attr('r', 14).attr('fill', 'transparent').attr('stroke', 'none')

    const tooltip = d3.select(wrapRef.current).append('div')
      .style('position', 'absolute').style('background', '#0f2318')
      .style('border', '1px solid #2d6a3f').style('border-radius', '6px')
      .style('padding', '8px 12px').style('font-family', "'Inter Tight', sans-serif")
      .style('font-size', '12px').style('color', '#f5f0e8')
      .style('pointer-events', 'none').style('opacity', 0).style('z-index', 10)
      .style('white-space', 'nowrap')

    hitDots
      .on('mouseenter', (event, d) => {
        tooltip.html(`<strong>${d.year}</strong><br/>${d.ha.toLocaleString('en-US', { maximumFractionDigits: 0 })} ha`)
          .style('opacity', 1).style('left', `${event.offsetX + 14}px`).style('right', 'auto').style('top', `${event.offsetY - 40}px`)
      })
      .on('mouseleave', () => tooltip.style('opacity', 0))

    if (isInView) {
      if (!animated.current) {
        animated.current = true
        gsap.to(linePath.node(), { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut' })
        gsap.to(areaPath.node(), { opacity: 1, duration: 0.8, delay: 0.6 })
        gsap.to(dots.nodes(), { attr: { opacity: 1 }, duration: 0.3, stagger: 0.08, delay: 1 })
      } else {
        // Already animated — show final state immediately after resize
        linePath.attr('stroke-dashoffset', 0)
        areaPath.attr('opacity', 1)
        dots.attr('opacity', 1)
      }
    }

    return () => tooltip.remove()
  }, [data, isInView, containerWidth])

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg ref={svgRef} className="w-full" style={{ overflow: 'visible' }} />
    </div>
  )
}

export default function BaselineSection({ summary }) {
  return (
    <section className="bg-forest-deep section-pad">
      <div className="section-container">
        <ScrollReveal>
          <SectionLabel number="02" title="A Baseline and a Beginning" light />
          <h2
            className="font-display text-cream mb-6 text-balance"
            style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}
          >
            The story of forest loss in Papua does not begin in catastrophe.
          </h2>
          <p className="text-cream/60 text-base leading-relaxed max-w-2xl mb-12">
            The data shows a gradual opening. A baseline of moderate, persistent
            loss that established the conditions for what followed. In the early
            period, Papua's lowlands were not yet the primary destination for
            large-scale concession development.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <AreaChart summary={summary} />
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <div className="mt-10 grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="eyebrow text-forest-accent mb-3">Scale in context</div>
              <p className="font-display text-cream text-xl mb-2">
                30,500 to 61,500 football fields per year
              </p>
              <p className="text-cream/50 text-sm leading-relaxed">
                Each year in this early period, an area equivalent to between
                30,500 and 61,500 standard football fields disappeared. Large
                in absolute terms but consistent with what researchers describe
                as Papua's "late frontier" character.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="eyebrow text-forest-accent mb-3">Primary driver</div>
              <p className="font-display text-cream text-xl mb-2">
                83.4% outside industrial concessions
              </p>
              <p className="text-cream/50 text-sm leading-relaxed">
                Artisanal gold mining, village expansion along Trans-Papua
                Highway corridors, and migration-driven agriculture were the
                dominant non-industrial loss pressures during this early period.
              </p>
              <p className="font-data text-[0.65rem] text-cream/20 mt-3">
                Gaveau et al. (2021). Biological Conservation.
              </p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.18}>
          <div className="border-l-2 border-forest-light pl-6 py-2 mb-8">
            <p className="pull-quote text-cream/65 text-base leading-relaxed">
              Communities have maintained long-term relationships with specific
              forest territories. These relationships have historically aligned
              with low rates of forest degradation.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="border-t border-white/8 pt-8 flex items-start gap-6">
            <div className="shrink-0 mt-1">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d6a3f" strokeWidth="1.2" strokeLinecap="round">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </div>
            <div>
              <div className="font-data text-[0.6rem] text-forest-accent uppercase tracking-widest mb-1">What came next</div>
              <p className="font-body text-cream/50 text-sm leading-relaxed">
                By 2009, the cumulative structural conditions for acceleration
                were in place: expanded road access, new concession awards, and
                rising global commodity prices.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
