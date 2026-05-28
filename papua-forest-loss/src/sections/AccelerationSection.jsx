import { useEffect, useRef, useMemo } from 'react'
import * as d3 from 'd3'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import ScrollReveal from '../components/ScrollReveal.jsx'
import SectionLabel from '../components/SectionLabel.jsx'
import { useContainerWidth } from '../hooks/useContainerWidth.js'

gsap.registerPlugin(ScrollTrigger)

const YEARS = Array.from({ length: 25 }, (_, i) => String(2001 + i))

const PHASES = [
  { label: 'Early frontier', start: 2001, end: 2009, color: '#9ca3af', opacity: 0.07 },
  { label: 'Acceleration', start: 2010, end: 2016, color: '#e67e22', opacity: 0.11 },
  { label: 'Moderation', start: 2017, end: 2023, color: '#27ae60', opacity: 0.07 },
  { label: '2025 reversal', start: 2024, end: 2025, color: '#c0392b', opacity: 0.15 },
]

const ANNOTATIONS = [
  { year: 2010, label: ['MIFEE Programme', 'Announcement'], yOffset: -46 },
  { year: 2012, label: 'Palm Oil Peak', yOffset: -32 },
  { year: 2015, label: 'El Niño', yOffset: -32 },
]

function MainLineChart({ summary }) {
  const svgRef = useRef(null)
  const wrapRef = useRef(null)
  const animated = useRef(false)
  const containerWidth = useContainerWidth(wrapRef)

  const data = useMemo(() => {
    if (!summary) return []
    return YEARS.map(y => ({ year: +y, ha: summary.annual_loss[y] ?? 0 }))
  }, [summary])

  useEffect(() => {
    if (!svgRef.current || data.length === 0 || containerWidth === 0) return

    const width = containerWidth
    const isMobile = width < 480
    const height = isMobile ? 260 : 340
    const margin = { top: isMobile ? 20 : 32, right: 16, bottom: 40, left: isMobile ? 54 : 72 }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)
      .attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Line chart of annual forest loss in Papua 2001 to 2025. Peak: 146,573 ha in 2015. Lowest: 40,733 ha in 2024. 2025 preliminary: 72,889 ha.')

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const x = d3.scaleLinear().domain([2001, 2026]).range([0, innerW])
    const y = d3.scaleLinear().domain([0, 170000]).range([innerH, 0])

    // Phase bands
    PHASES.forEach(phase => {
      const x0 = x(phase.start)
      const x1 = Math.min(x(phase.end) + (innerW / 24), innerW)
      g.append('rect')
        .attr('x', x0).attr('y', 0)
        .attr('width', x1 - x0).attr('height', innerH)
        .attr('fill', phase.color)
        .attr('opacity', phase.opacity)
    })

    // Grid
    g.append('g')
      .call(d3.axisLeft(y).ticks(isMobile ? 4 : 5).tickFormat(d => isMobile ? `${(d/1000).toFixed(0)}k` : `${(d / 1000).toFixed(0)}k ha`))
      .call(ax => ax.select('.domain').remove())
      .call(ax => ax.selectAll('.tick line')
        .attr('x2', innerW).attr('stroke', '#374151').attr('stroke-opacity', 0.4)
        .attr('stroke-dasharray', '3,3'))
      .call(ax => ax.selectAll('.tick text')
        .attr('fill', '#6b7280').attr('font-family', "'Inter Tight', sans-serif").attr('font-size', 10))

    const xTickValues = isMobile
      ? [2001, 2005, 2009, 2013, 2017, 2021, 2025]
      : d3.range(2001, 2026, 2).concat([2025])

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x)
        .tickValues(xTickValues)
        .tickFormat(d => String(d)))
      .call(ax => ax.select('.domain').attr('stroke', '#374151').attr('stroke-opacity', 0.4))
      .call(ax => ax.selectAll('.tick line').remove())
      .call(ax => ax.selectAll('.tick text')
        .attr('fill', '#6b7280').attr('font-family', "'Inter Tight', sans-serif").attr('font-size', 10))

    // Phase labels above chart — only on wider screens
    if (!isMobile) {
      PHASES.forEach(phase => {
        const xMid = phase.start === phase.end
          ? x(phase.start)
          : (x(phase.start) + x(phase.end)) / 2
        g.append('text')
          .attr('x', xMid).attr('y', -12)
          .attr('text-anchor', 'middle')
          .attr('fill', phase.color).attr('opacity', 0.65)
          .attr('font-family', "'Inter Tight', sans-serif")
          .attr('font-size', 9).attr('font-weight', 600).attr('letter-spacing', '0.08em')
          .text(phase.label.toUpperCase())
      })
    }

    // Line
    const line = d3.line()
      .x(d => x(d.year)).y(d => y(d.ha))
      .curve(d3.curveMonotoneX)

    const linePath = g.append('path')
      .datum(data)
      .attr('fill', 'none').attr('stroke', '#f5f0e8').attr('stroke-width', 2)
      .attr('d', line)

    const totalLength = linePath.node().getTotalLength()
    linePath.attr('stroke-dasharray', `${totalLength} ${totalLength}`).attr('stroke-dashoffset', totalLength)

    const lastPoint = data[data.length - 1]
    const endDot = g.append('circle')
      .attr('cx', x(lastPoint.year)).attr('cy', y(lastPoint.ha))
      .attr('r', 6).attr('fill', '#c0392b').attr('stroke', '#f5f0e8').attr('stroke-width', 2)
      .attr('opacity', 0)

    // Annotations — only on wider screens
    if (!isMobile) {
      ANNOTATIONS.forEach(ann => {
        const d = data.find(d => d.year === ann.year)
        if (!d) return
        const ax = x(d.year), ay = y(d.ha)
        const lineTop = Math.max(ay + ann.yOffset, 22)
        const lines = Array.isArray(ann.label) ? ann.label : [ann.label]
        g.append('line')
          .attr('x1', ax).attr('y1', ay)
          .attr('x2', ax).attr('y2', lineTop)
          .attr('stroke', '#f5f0e8').attr('stroke-opacity', 0.22).attr('stroke-width', 1)
        lines.forEach((txt, li) => {
          g.append('text')
            .attr('x', ax).attr('y', lineTop - 5 - (lines.length - 1 - li) * 13)
            .attr('text-anchor', 'middle')
            .attr('fill', '#f5f0e8').attr('opacity', 0.5)
            .attr('font-family', "'Inter Tight', sans-serif").attr('font-size', 9.5)
            .text(txt)
        })
      })
    }

    // Hover crosshair + tooltip
    const crosshair = g.append('line')
      .attr('y1', 0).attr('y2', innerH)
      .attr('stroke', '#f5f0e8').attr('stroke-opacity', 0)
      .attr('stroke-width', 1).attr('stroke-dasharray', '4,4')

    const hoverDot = g.append('circle')
      .attr('r', 5).attr('fill', '#f5f0e8').attr('stroke', '#0f2318').attr('stroke-width', 2)
      .attr('opacity', 0)

    const tooltip = d3.select(wrapRef.current)
      .append('div')
      .style('position', 'absolute').style('background', '#0f2318')
      .style('border', '1px solid rgba(255,255,255,0.15)').style('border-radius', '6px')
      .style('padding', '8px 12px').style('font-family', "'Inter Tight', sans-serif")
      .style('font-size', '12px').style('color', '#f5f0e8')
      .style('pointer-events', 'none').style('opacity', 0).style('z-index', 10)
      .style('white-space', 'nowrap')

    g.append('rect')
      .attr('width', innerW).attr('height', innerH).attr('fill', 'transparent')
      .on('pointermove', function(event) {
        const [mx] = d3.pointer(event)
        const year = Math.round(x.invert(mx))
        if (year < 2001 || year > 2025) return
        const d = data.find(d => d.year === year)
        if (!d) return
        crosshair.attr('x1', x(year)).attr('x2', x(year)).attr('stroke-opacity', 0.35)
        hoverDot.attr('cx', x(year)).attr('cy', y(d.ha)).attr('opacity', 1)
        const ttLeft = event.offsetX + 14
        const ttRight = width - event.offsetX + 14
        const flipLeft = ttLeft + 120 > width
        tooltip
          .html(`<strong>${year}</strong>${year === 2025 ? ' <em style="opacity:0.5">(prelim.)</em>' : ''}<br/>${d.ha.toLocaleString('en-US', { maximumFractionDigits: 0 })} ha`)
          .style('opacity', 1)
          .style('left', flipLeft ? 'auto' : `${ttLeft}px`)
          .style('right', flipLeft ? `${ttRight}px` : 'auto')
          .style('top', `${event.offsetY - 50}px`)
      })
      .on('pointerleave', () => {
        crosshair.attr('stroke-opacity', 0)
        hoverDot.attr('opacity', 0)
        tooltip.style('opacity', 0)
      })

    if (animated.current) {
      linePath.attr('stroke-dashoffset', 0)
      endDot.attr('opacity', 1)
    } else {
      gsap.to(linePath.node(), {
        strokeDashoffset: 0,
        duration: 1.8,
        ease: 'power2.inOut',
        scrollTrigger: {
          trigger: wrapRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
          onEnter: () => { animated.current = true },
        },
      })
      gsap.to(endDot.node(), {
        attr: { opacity: 1 },
        duration: 0.3,
        delay: 1.6,
        scrollTrigger: {
          trigger: wrapRef.current,
          start: 'top 75%',
          toggleActions: 'play none none none',
        },
      })
    }

    return () => tooltip.remove()
  }, [data, containerWidth])

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg ref={svgRef} className="w-full" style={{ overflow: 'visible' }} />
    </div>
  )
}

const DRIVER_COLORS = {
  outside: '#6b7280',
  palm: '#d4ac0d',
  wood: '#884ea0',
  mining: '#a04000',
}
const DRIVER_LABELS = {
  outside: 'Outside concessions',
  palm: 'Palm oil',
  wood: 'Wood fiber',
  mining: 'Mining',
}
const KEYS = ['outside', 'palm', 'wood', 'mining']

function StackedDriverChart({ drivers }) {
  const svgRef = useRef(null)
  const wrapRef = useRef(null)
  const animated = useRef(false)
  const containerWidth = useContainerWidth(wrapRef)

  const data = useMemo(() => {
    if (!drivers) return []
    return YEARS.map(y => ({
      year: +y,
      palm: drivers.palm_oil.annual_loss[y] ?? 0,
      wood: drivers.wood_fiber.annual_loss[y] ?? 0,
      mining: drivers.mining.annual_loss[y] ?? 0,
      outside: drivers.outside.annual_loss[y] ?? 0,
    }))
  }, [drivers])

  useEffect(() => {
    if (!svgRef.current || data.length === 0 || containerWidth === 0) return

    const width = containerWidth
    const isMobile = width < 480
    const height = isMobile ? 180 : 220
    const marginLeft = isMobile ? 46 : 72
    const margin = { top: 16, right: isMobile ? 12 : 70, bottom: 40, left: marginLeft }
    const innerW = width - margin.left - margin.right
    const innerH = height - margin.top - margin.bottom

    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current).attr('width', width).attr('height', height)
      .attr('role', 'img')
      .attr('aria-label', 'Stacked area chart of forest loss drivers in Papua 2001 to 2025: outside concessions (83%), palm oil (9%), wood fiber (6%), mining (2%).')

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const stack = d3.stack().keys(KEYS)
    const series = stack(data)

    const x = d3.scaleLinear().domain([2001, 2025]).range([0, innerW])
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.palm + d.wood + d.mining + d.outside) * 1.05])
      .range([innerH, 0])

    const areaGen = d3.area()
      .x(d => x(d.data.year))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveMonotoneX)

    const paths = series.map((s, si) => {
      const path = g.append('path')
        .datum(s)
        .attr('fill', DRIVER_COLORS[s.key])
        .attr('opacity', 0)
        .attr('d', areaGen)
      return { node: path.node(), si }
    })

    if (animated.current) {
      paths.forEach(({ node }) => d3.select(node).attr('opacity', 0.8))
    } else {
      paths.forEach(({ node, si }) => {
        gsap.to(node, {
          attr: { opacity: 0.8 },
          duration: 0.6,
          delay: si * 0.1,
          scrollTrigger: {
            trigger: svgRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
            onEnter: () => { animated.current = true },
          },
        })
      })
    }

    const xTickValues = isMobile ? [2001, 2005, 2009, 2013, 2017, 2021, 2025] : null

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).tickValues(xTickValues ?? undefined).ticks(xTickValues ? null : 13).tickFormat(d => String(d)))
      .call(ax => ax.select('.domain').attr('stroke', '#374151').attr('stroke-opacity', 0.4))
      .call(ax => ax.selectAll('.tick line').remove())
      .call(ax => ax.selectAll('.tick text')
        .attr('fill', '#6b7280').attr('font-size', 10)
        .attr('font-family', "'Inter Tight', sans-serif"))

    g.append('g')
      .call(d3.axisLeft(y).ticks(3).tickFormat(d => `${(d/1000).toFixed(0)}k`))
      .call(ax => ax.select('.domain').remove())
      .call(ax => ax.selectAll('.tick line')
        .attr('x2', innerW).attr('stroke', '#374151').attr('stroke-opacity', 0.3)
        .attr('stroke-dasharray', '3,3'))
      .call(ax => ax.selectAll('.tick text')
        .attr('fill', '#6b7280').attr('font-size', 10)
        .attr('font-family', "'Inter Tight', sans-serif"))

    // Interactive crosshair + tooltip
    const crosshair = g.append('line')
      .attr('y1', 0).attr('y2', innerH)
      .attr('stroke', '#f5f0e8').attr('stroke-opacity', 0).attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')

    const hoverDots = {}
    KEYS.forEach(k => {
      hoverDots[k] = g.append('circle')
        .attr('r', 3.5)
        .attr('fill', DRIVER_COLORS[k])
        .attr('stroke', '#1e4d2b').attr('stroke-width', 1.5)
        .attr('opacity', 0)
    })

    const tooltip = d3.select(wrapRef.current)
      .append('div')
      .style('position', 'absolute').style('background', '#0f2318')
      .style('border', '1px solid rgba(255,255,255,0.15)').style('border-radius', '6px')
      .style('padding', '10px 14px').style('font-family', "'Inter Tight', sans-serif")
      .style('font-size', '12px').style('color', '#f5f0e8')
      .style('pointer-events', 'none').style('opacity', 0).style('z-index', 10)
      .style('white-space', 'nowrap')

    g.append('rect')
      .attr('width', innerW).attr('height', innerH).attr('fill', 'transparent')
      .on('pointermove', function(event) {
        const [mx] = d3.pointer(event)
        const year = Math.round(x.invert(mx))
        if (year < 2001 || year > 2025) return
        const d = data.find(d => d.year === year)
        if (!d) return

        crosshair.attr('x1', x(year)).attr('x2', x(year)).attr('stroke-opacity', 0.35)

        let cum = 0
        KEYS.forEach(k => {
          cum += d[k]
          hoverDots[k].attr('cx', x(year)).attr('cy', y(cum)).attr('opacity', 1)
        })

        const total = d.palm + d.wood + d.mining + d.outside
        const ttLeft = event.offsetX + 14
        const flipLeft = ttLeft + 170 > width
        tooltip.html(`
          <div style="font-weight:600;margin-bottom:6px;white-space:nowrap">${year}${year === 2025 ? ' <span style="opacity:0.4;font-style:italic">(prelim.)</span>' : ''}</div>
          <table style="border-spacing:0">
            ${KEYS.map(k => `
              <tr>
                <td style="color:${DRIVER_COLORS[k]};padding-bottom:3px;padding-right:12px;white-space:nowrap">${DRIVER_LABELS[k]}</td>
                <td style="text-align:right;color:#f5f0e8;white-space:nowrap">${(d[k]/1000).toFixed(1)}k ha</td>
              </tr>`).join('')}
            <tr style="border-top:1px solid rgba(255,255,255,0.1)">
              <td style="padding-top:5px;color:#9ca3af;white-space:nowrap">Total</td>
              <td style="padding-top:5px;text-align:right;color:#f5f0e8;white-space:nowrap">${(total/1000).toFixed(1)}k ha</td>
            </tr>
          </table>`)
          .style('opacity', 1)
          .style('left', flipLeft ? 'auto' : `${ttLeft}px`)
          .style('right', flipLeft ? `${width - event.offsetX + 14}px` : 'auto')
          .style('top', `${event.offsetY - 80}px`)
      })
      .on('pointerleave', () => {
        crosshair.attr('stroke-opacity', 0)
        KEYS.forEach(k => hoverDots[k].attr('opacity', 0))
        tooltip.style('opacity', 0)
      })

    return () => tooltip.remove()
  }, [data, containerWidth])

  // Responsive legend margin — matches chart margin.left
  const legendMarginLeft = containerWidth < 480 ? 46 : 72

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg ref={svgRef} className="w-full" />
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3" style={{ marginLeft: legendMarginLeft }}>
        {KEYS.slice().reverse().map(k => (
          <div key={k} className="flex items-center gap-1.5">
            <div style={{ width: 10, height: 10, background: DRIVER_COLORS[k], borderRadius: 2, flexShrink: 0 }} />
            <span style={{ fontFamily: "'Inter Tight',sans-serif", fontSize: 9.5, color: '#6b7280' }}>{DRIVER_LABELS[k]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AccelerationSection({ summary, drivers }) {
  return (
    <section className="bg-cream section-pad">
      <div className="section-container">

        <ScrollReveal>
          <SectionLabel number="03" title="The Acceleration" />
          <h2
            className="font-display text-ink mb-6 text-balance"
            style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}
          >
            From 2010, annual forest loss began a sustained and measurable
            increase.
          </h2>
          <p className="text-ink-muted text-base leading-relaxed max-w-2xl mb-10">
            Three documented drivers converged: industrial plantation expansion,
            the Merauke Integrated Food and Energy Estate programme, and the
            2015 El Nino event. Their temporal overlap explains the magnitude
            of the peak.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div className="bg-forest-deep rounded-2xl p-4 md:p-8 mb-4">
            <div className="font-data text-xs text-cream/40 uppercase tracking-wider mb-3">Annual forest loss, 2001 to 2025</div>
            <MainLineChart summary={summary} />
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <div className="bg-forest-deep rounded-2xl p-4 md:p-8 mb-10">
            <div className="eyebrow text-forest-accent mb-1">Loss by driver, 2001 to 2025</div>
            <StackedDriverChart drivers={drivers} />
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-5 items-stretch">
          <ScrollReveal delay={0.1}>
            <div className="bg-loss-mid/10 border border-loss-mid/20 rounded-xl p-6 h-full">
              <div className="font-data text-xs text-loss-mid uppercase tracking-widest mb-3">
                MIFEE Programme
              </div>
              <p className="font-display text-ink text-lg mb-2">4.6M ha designated</p>
              <p className="text-ink-muted text-sm leading-relaxed">
                The Merauke Integrated Food and Energy Estate designated up to
                4.6 million hectares of southern Papua for industrial agricultural
                conversion. More than three times the land area of Bali, legally
                authorised by the Indonesian government.
              </p>
              <p className="font-data text-[0.65rem] text-ink/30 mt-3">
                World Rainforest Movement (2013).
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.15}>
            <div className="bg-loss-peak/8 border border-loss-peak/20 rounded-xl p-6 h-full">
              <div className="font-data text-xs text-loss-peak uppercase tracking-widest mb-3">
                El Niño 2015
              </div>
              <p className="font-display text-ink text-lg mb-2">14,500 fire hotspots</p>
              <p className="text-ink-muted text-sm leading-relaxed">
                Against an annual average of around 3,200 for the preceding decade.
                The 2015 Indonesian fire season carried an estimated national
                economic cost of USD 16.1 billion.
              </p>
              <p className="font-data text-[0.65rem] text-ink/30 mt-3">
                WRI / Global Forest Watch (2017); Tacconi et al. (2017).
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <div className="bg-palm/8 border border-palm/20 rounded-xl p-6 h-full">
              <div className="font-data text-xs text-palm uppercase tracking-widest mb-3">
                Palm Oil Peak
              </div>
              <p className="font-display text-ink text-lg mb-2">14,842 ha in 2012</p>
              <p className="text-ink-muted text-sm leading-relaxed">
                Oil palm expansion in Papua peaked approximately three years
                later than in other Indonesian regions, consistent with Papua
                being a later-arriving frontier.
              </p>
              <p className="font-data text-[0.65rem] text-ink/30 mt-3">
                PLOS ONE (2022).
              </p>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal delay={0.25}>
          <div className="mt-8 bg-forest-deep/10 border border-forest-light/20 rounded-xl p-5 text-ink/50 text-xs leading-relaxed">
            <strong className="text-ink/70">Technical note:</strong> Fire losses recorded in the
            Hansen et al. dataset in 2016 may partially reflect damage that
            physically occurred in late 2015, due to cloud-cover acquisition
            constraints in Landsat imagery.
            <span className="text-ink/25 ml-1">PLOS ONE (2022).</span>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
