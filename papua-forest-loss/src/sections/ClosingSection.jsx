import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { useInView } from 'motion/react'
import ScrollReveal from '../components/ScrollReveal.jsx'
import SectionLabel from '../components/SectionLabel.jsx'

const FULL_CITATIONS = [
  'Auriga Nusantara (2026). STADI 2025: Indonesia Deforestation Status Report.',
  'ANU Crawford School (2023). Road revival and unavoidable deforestation in Papua.',
  'Austin, K.G. et al. (2019). Palm oil not the only driver of forest loss. Duke / ScienceDaily.',
  'Conservation International. Papua biodiversity profile.',
  'Cultural Survival. Indigenous peoples of Papua overview.',
  'Garnett, S.T. et al. (2018). A spatial overview of the global importance of Indigenous lands for conservation. Nature Sustainability.',
  'Gaveau, D. et al. (2021). Road expansion and deforestation in Papua province. Biological Conservation.',
  'Global Forest Watch. Concession layer and annual loss data. globalforestwatch.org.',
  'Hansen, M.C. et al. Global Forest Watch annual forest loss product (2001–2025).',
  'Margono, B.A. et al. (2014). Primary forest cover loss in Indonesia over 2000–2012. Nature Climate Change.',
  'Mighty Earth (2025). Food and energy estates in Indonesian Papua.',
  'Mongabay (2018). In early push into Papua, palm oil firms set stage for forest loss.',
  'Mongabay (2024). Merauke food estate clearing underway in Papua.',
  'Mongabay (April 2026). Indonesia\'s deforestation surges 66% in 2025.',
  'Nusantara Atlas (2026). Palm-oil-driven deforestation doubles in Papua in 2025.',
  'Parish, F. et al. (2008). Assessment on peatlands, biodiversity and climate change. Peatlands International / GEC / UNEP.',
  'PLOS ONE (2022). Slowing deforestation in Indonesia follows declining oil palm expansion and lower oil prices.',
  'Rights and Resources Initiative (2018). At a crossroads: consequential trends in recognition of community-based forest tenure.',
  'Tacconi, L. et al. (2017). The cost of fire in Indonesia. ScienceDirect.',
  'Trase / SEI (2024). Indonesian palm oil and deforestation.',
  'World Rainforest Movement (2013). MIFEE: land grabbing and deforestation in Papua.',
  'WWF (2020). New Guinea tropical rainforest.',
  'Yulianti, N. & Hayasaka, H. (2023). Active fires in southern Papua linked to El Niño conditions. Remote Sensing, MDPI.',
]

function RadialArc({ retained = 0.97, size = 280 }) {
  const svgRef = useRef(null)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' })
  const animated = useRef(false)

  useEffect(() => {
    if (!svgRef.current || !isInView || animated.current) return
    animated.current = true

    const r = size / 2
    const thick = 26
    const innerR = r - thick

    const svg = d3.select(svgRef.current)
      .attr('width', size).attr('height', size)

    svg.selectAll('*').remove()

    const g = svg.append('g').attr('transform', `translate(${r},${r})`)

    // Background ring
    g.append('path')
      .attr('d', d3.arc()({ outerRadius: r, innerRadius: innerR, startAngle: 0, endAngle: Math.PI * 2 }))
      .attr('fill', '#c0392b')
      .attr('opacity', 0.5)

    // Retained arc (green)
    const arcGen = d3.arc().outerRadius(r).innerRadius(innerR)
    const endAngle = retained * Math.PI * 2

    const retainedPath = g.append('path')
      .attr('d', arcGen({ startAngle: 0, endAngle: 0 }))
      .attr('fill', '#27ae60')
      .attr('opacity', 0.9)

    // Animate arc
    const duration = 1600
    let start = null
    function step(ts) {
      if (!start) start = ts
      const t = Math.min((ts - start) / duration, 1)
      const ease = t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
      retainedPath.attr('d', arcGen({ startAngle: 0, endAngle: ease * endAngle }))
      if (t < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)

    // Centre text
    g.append('text')
      .attr('text-anchor', 'middle').attr('dy', '-0.5em')
      .attr('fill', '#f5f0e8')
      .attr('font-family', "'Playfair Display', serif")
      .attr('font-weight', 900)
      .attr('font-size', size * 0.13)
      .text('97%')

    g.append('text')
      .attr('text-anchor', 'middle').attr('dy', '1.2em')
      .attr('fill', '#9ca3af')
      .attr('font-family', "'Inter Tight', sans-serif")
      .attr('font-size', size * 0.07)
      .text('still standing')

    g.append('text')
      .attr('text-anchor', 'middle').attr('dy', '2.5em')
      .attr('fill', '#c0392b')
      .attr('font-family', "'Inter Tight', sans-serif")
      .attr('font-size', size * 0.06)
      .text('3% lost')

  }, [isInView, retained, size])

  return (
    <div ref={ref} className="flex justify-center">
      <svg ref={svgRef} />
    </div>
  )
}

function ScaleBar({ label, value, maxValue, color, sublabel }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' })

  return (
    <div ref={ref} className="mb-5">
      <div className="flex justify-between mb-1.5">
        <span className="font-data text-xs text-cream/60">{label}</span>
        <span className="font-data text-xs font-semibold" style={{ color }}>{value}</span>
      </div>
      <div className="h-3 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: isInView ? `${(parseFloat(value) / maxValue) * 100}%` : '0%',
            backgroundColor: color,
            transitionDuration: '1.2s',
            transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
          }}
        />
      </div>
      {sublabel && (
        <p className="font-data text-[0.65rem] text-cream/30 mt-1">{sublabel}</p>
      )}
    </div>
  )
}

export default function ClosingSection({ summary }) {
  return (
    <section className="bg-forest-deep section-pad">
      <div className="section-container">
        <ScrollReveal>
          <SectionLabel number="08" title="What Remains" light />
          <h2
            className="font-display text-cream mb-6 text-balance"
            style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}
          >
            As of the most recent measurement, 97% of Papua's year-2000 forest
            baseline remains standing.
          </h2>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-14 items-start mb-16">
          {/* Radial arc */}
          <ScrollReveal delay={0.1}>
            <RadialArc retained={0.97} size={280} />
          </ScrollReveal>

          {/* Scale comparisons */}
          <ScrollReveal delay={0.15}>
            <div>
              <div className="eyebrow text-forest-accent mb-6">Scale in perspective</div>
              <ScaleBar
                label="Remaining forest (44.6M ha)"
                value="44.6"
                maxValue={50}
                color="#27ae60"
                sublabel="Comparable to the land area of Sweden"
              />
              <ScaleBar
                label="Net loss over 25 years (1.24M ha)"
                value="1.24"
                maxValue={50}
                color="#c0392b"
                sublabel="Equivalent to the land area of Belgium"
              />
              <ScaleBar
                label="Forest gain recovered (132k ha)"
                value="0.13"
                maxValue={50}
                color="#d4ac0d"
                sublabel="Less than 10% of area lost recovered through gain"
              />
              <p className="text-cream/40 text-xs leading-relaxed mt-4">
                Forest baseline year 2000: 45,888,708 ha. Hansen et al.
                Global Forest Watch annual forest loss product (2001–2025),
                treecover2000 ≥ 30% threshold.
              </p>
            </div>
          </ScrollReveal>
        </div>

        {/* Closing text */}
        <ScrollReveal delay={0.1}>
          <div className="max-w-2xl mx-auto text-center mb-20">
            <p className="pull-quote text-cream/80">
              "The <strong className="text-loss-peak font-semibold">1.24 million hectares</strong> of net loss over 25 years is the record
              of choices made within a specific set of conditions. The{' '}
              <strong className="text-forest-accent font-semibold">44.6 million hectares</strong> still standing is the record of what those choices have not
              yet reached."
            </p>
          </div>
        </ScrollReveal>

        {/* Warning + trend note — merged */}
        <ScrollReveal delay={0.1}>
          <div className="bg-forest-mid/30 border border-loss-peak/30 rounded-2xl p-8 mb-16 max-w-3xl mx-auto">
            <div className="eyebrow text-loss-peak mb-4">A warning the data carries</div>
            <p className="font-display text-cream text-xl mb-5 leading-snug">
              97% intact is extraordinary. It is also where the Amazon and Kalimantan
              once stood.
            </p>
            <p className="text-cream/60 text-sm leading-relaxed mb-4">
              Kalimantan (Indonesian Borneo) has lost more than 30% of its forest cover
              since 1973. Sumatra has lost over 40%. The Amazon has lost more than 20%
              of its original extent, with scientists warning that large portions are
              approaching a tipping point beyond which the ecosystem cannot sustain itself.
              Each of those forests looked, from a distance, like Papua does today: vast,
              largely intact, with loss concentrated at its margins.
            </p>
            <p className="text-cream/60 text-sm leading-relaxed mb-4">
              The warning signs that preceded collapse elsewhere are now visible in Papua's
              data. Road infrastructure expanding into previously inaccessible interior
              forest. Industrial concessions granted across millions of hectares. A 2025
              spike in loss driven not by illegal activity but by government-authorised
              land clearing: the Merauke Food and Energy Estate (MIFEE), a state programme
              covering 3 million hectares of southern Papua, more than twice the cumulative
              loss of the entire 25-year dataset.
            </p>
            <p className="text-cream/60 text-sm leading-relaxed mb-4">
              The 97% figure is not a reason for complacency. It is a description of
              what remains to be lost. The rate of loss is also not fixed: it peaked in
              2015 to 2016, moderated through 2024, and rose sharply again in 2025. The
              conditions that drove the moderation phase are documented. Whether that
              moderation returns, or whether Papua follows the trajectory of Kalimantan
              and Sumatra, depends on factors outside the dataset: land use decisions,
              concession management, climate variability, and the degree to which
              indigenous land rights and ecological knowledge are integrated into
              governance of the remaining forest.
            </p>
            <p className="font-data text-[0.65rem] text-cream/30 mt-5">
              Margono et al. (2014) Nature Climate Change; Gaveau et al. (2021) Biological Conservation;
              Mongabay (2024); Auriga Nusantara STADI 2025.
            </p>
          </div>
        </ScrollReveal>

        {/* Methodology + citations */}
        <ScrollReveal delay={0.1}>
          <div className="border-t border-white/10 pt-10">
            <div className="grid md:grid-cols-2 gap-10 mb-10">
              <div>
                <div className="eyebrow text-forest-accent mb-4">Methodology</div>
                <ul className="space-y-1.5 text-cream/40 text-[0.65rem] font-data leading-relaxed">
                  <li>Data source: Hansen, M.C. et al. Global Forest Watch annual forest loss product (2001–2025)</li>
                  <li>Imagery: Landsat 7 ETM+ / Landsat 8 OLI / Landsat 9, 30m resolution</li>
                  <li>Forest definition: treecover2000 &ge; 30% canopy cover threshold</li>
                  <li>Pixel area: 0.09 ha per pixel (30m x 30m at equator)</li>
                  <li>Driver attribution: intersection with Global Forest Watch palm oil, wood fiber, mining concession layers</li>
                  <li>Protected areas: WDPA terrestrial polygons, IUCN categories I to VI</li>
                  <li>2025 data flagged throughout as preliminary, subject to revision as full-year imagery becomes available</li>
                  <li>Administrative boundaries: Papua underwent multiple provincial splits and regency changes over the study period; for simplicity, analysis uses the latest available boundaries throughout</li>
                </ul>
              </div>
              <div>
                <div className="eyebrow text-forest-accent mb-4">Full citation list</div>
                <ul className="space-y-1.5 text-cream/40 text-[0.65rem] font-data leading-relaxed">
                  {FULL_CITATIONS.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
