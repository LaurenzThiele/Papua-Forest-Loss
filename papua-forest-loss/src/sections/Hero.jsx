import { useEffect, useRef, useState } from 'react'
import { useScroll, useTransform, motion } from 'motion/react'
import { gsap } from 'gsap'
import * as d3 from 'd3'

function ProvinceMap() {
  const svgRef = useRef(null)

  useEffect(() => {
    fetch('./data/papua_provinces.geojson')
      .then(r => r.json())
      .then(geojson => {
        if (!svgRef.current) return
        const el = svgRef.current
        const width = el.parentElement.clientWidth || 600
        const height = el.parentElement.clientHeight || 500

        const projection = d3.geoMercator().fitSize([width, height], geojson)
        const pathGen = d3.geoPath().projection(projection)

        const lossValues = [212833, 258724, 386027, 179150, 170404, 169489]
        const maxLoss = Math.max(...lossValues)
        const colorScale = d3.scaleSequential()
          .domain([0, maxLoss])
          .interpolator(d3.interpolate('#1e4d2b', '#c0392b'))

        const lossMap = {
          'Papua': 212833,
          'Papua Barat': 258724,
          'Papua Selatan': 386027,
          'Papua Tengah': 179150,
          'Papua Pegunungan': 170404,
          'Papua Barat Daya': 169489,
        }

        const svg = d3.select(el)
          .attr('width', width)
          .attr('height', height)

        svg.selectAll('*').remove()

        const g = svg.append('g')

        g.selectAll('path')
          .data(geojson.features)
          .enter()
          .append('path')
          .attr('d', pathGen)
          .attr('fill', d => {
            const name = d.properties.provinsi || d.properties.PROVINSI || d.properties.name || ''
            const loss = lossMap[name] ?? 150000
            return colorScale(loss)
          })
          .attr('fill-opacity', 0.75)
          .attr('stroke', '#0f2318')
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.6)
      })
      .catch(() => {})
  }, [])

  return (
    <svg
      ref={svgRef}
      className="w-full h-full"
      style={{ display: 'block' }}
    />
  )
}

export default function Hero() {
  const containerRef = useRef(null)
  const contentRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })
  const mapY = useTransform(scrollYProgress, [0, 1], [0, -80])
  const fadeOut = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ delay: 0.3 })
      tl.from('.hero-source', { opacity: 0, y: 10, duration: 0.6 })
      tl.from('.hero-title-line', {
        y: 80, opacity: 0, duration: 1.0, stagger: 0.12, ease: 'power3.out',
      }, '-=0.3')
      tl.from('.hero-deck', { opacity: 0, y: 24, duration: 0.8 }, '-=0.4')
      tl.from('.hero-scroll', { opacity: 0, duration: 0.6 }, '-=0.2')
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={containerRef}
      className="relative min-h-svh bg-forest-deep overflow-hidden flex flex-col"
    >
      {/* Subtle gradient depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-forest-deep via-forest-mid/60 to-forest-deep pointer-events-none" />

      {/* Province map - right side, 3D tilted */}
      <motion.div
        className="absolute right-0 top-0 bottom-0 w-1/2 md:w-5/12 pointer-events-none select-none"
        style={{ y: mapY }}
      >
        <div
          className="absolute inset-0"
          style={{
            perspective: '1200px',
            transform: 'rotateX(22deg) rotateZ(-4deg)',
            transformOrigin: 'center center',
            opacity: 0.55,
          }}
        >
          <ProvinceMap />
        </div>
        {/* Fade blend on left edge */}
        <div className="absolute inset-0 bg-gradient-to-r from-forest-deep via-transparent to-transparent" />
        {/* Fade at top and bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-forest-deep/60 via-transparent to-forest-deep/40" />
      </motion.div>

      {/* Main content */}
      <motion.div
        ref={contentRef}
        className="relative z-10 section-container flex flex-col justify-center flex-1 py-20 md:py-32"
        style={{ opacity: fadeOut }}
      >
        {/* Source attribution */}
        <div className="hero-source font-data text-[0.68rem] text-cream/55 uppercase tracking-widest mb-10">
          Analysis and report by Laurenz Thiele
        </div>

        {/* Title */}
        <div className="overflow-hidden mb-2">
          <div
            className="hero-title-line font-display text-cream font-black leading-none"
            style={{ fontSize: 'clamp(3.5rem, 9vw, 8rem)' }}
          >
            Papua's
          </div>
        </div>
        <div className="overflow-hidden mb-8">
          <div
            className="hero-title-line font-display text-forest-accent font-black leading-none"
            style={{ fontSize: 'clamp(3.5rem, 9vw, 8rem)' }}
          >
            Lost Forest
          </div>
        </div>

        {/* Deck */}
        <p
          className="hero-deck text-cream/80 leading-relaxed max-w-md"
          style={{ fontSize: 'clamp(1rem, 1.8vw, 1.2rem)' }}
        >
          A 25-year satellite record of forest cover change across six
          Indonesian provinces of Papua. What the data shows, what drives
          it, and what remains.
        </p>

      </motion.div>

      {/* Scroll indicator */}
      <div className="hero-scroll absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-cream/30">
        <span className="font-data text-[0.6rem] uppercase tracking-widest">Scroll</span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </motion.div>
      </div>
    </section>
  )
}
