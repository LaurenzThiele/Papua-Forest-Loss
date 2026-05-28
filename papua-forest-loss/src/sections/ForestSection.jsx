import { useRef } from 'react'
import { motion, useInView } from 'motion/react'
import ScrollReveal from '../components/ScrollReveal.jsx'
import SectionLabel from '../components/SectionLabel.jsx'
import AnimatedCounter from '../components/AnimatedCounter.jsx'
import imgCendrawasih from '../assets/cendrawasih.png'
import imgCuscus from '../assets/cuscus.png'
import imgKasuari from '../assets/kasuari.png'
import imgOrchid from '../assets/orchid.png'
import imgFrog from '../assets/frog.png'

function PeatCrossSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' })

  const LAYERS = [
    { label: 'Living vegetation', color: '#2d6a3f', h: 26, opacity: 1, depth: null },
    { label: 'Forest floor', color: '#3d6b3a', h: 22, opacity: 0.9, depth: '0 m' },
    { label: 'Recent peat', color: '#7b5e2a', h: 28, opacity: 0.85, depth: '1 m' },
    { label: 'Peat accumulation', color: '#5c3d1e', h: 34, opacity: 0.9, depth: '2 m' },
    { label: 'Deep peat', color: '#3d2610', h: 38, opacity: 0.95, depth: '4 m' },
    { label: 'Ancient peat', color: '#1e1008', h: 38, opacity: 1, depth: '6 m+' },
  ]

  const totalH = LAYERS.reduce((s, l) => s + l.h, 0)
  const BAR_W = 130
  const TOTAL_W = 168
  let currentY = 0

  return (
    <div ref={ref} className="shrink-0">
      <svg width={TOTAL_W} height={totalH + 14} viewBox={`0 0 ${TOTAL_W} ${totalH + 14}`} style={{ display: 'block' }}>
        {LAYERS.map((layer, i) => {
          const y = currentY
          currentY += layer.h
          return (
            <g key={i}>
              <motion.rect
                x={0} y={y} width={BAR_W} height={layer.h}
                fill={layer.color}
                fillOpacity={layer.opacity}
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 0.5, delay: i * 0.12, ease: 'easeOut' }}
                style={{ transformOrigin: 'left center' }}
              />
              <motion.text
                x={BAR_W / 2} y={y + layer.h / 2}
                fontSize="7.5"
                fill="rgba(245,240,232,0.82)"
                fontFamily="'Inter Tight', sans-serif"
                textAnchor="middle"
                dominantBaseline="central"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.3, delay: i * 0.12 + 0.4 }}
              >
                {layer.label}
              </motion.text>
            </g>
          )
        })}
        {/* Depth markers on right */}
        {(() => {
          let dy = 0
          return LAYERS.map((layer, i) => {
            const topY = dy
            dy += layer.h
            if (!layer.depth) return null
            return (
              <g key={i}>
                <line x1={BAR_W} y1={topY} x2={BAR_W + 6} y2={topY} stroke="rgba(245,240,232,0.18)" strokeWidth="0.8" />
                <text x={BAR_W + 8} y={topY + 4} fontSize="7" fill="rgba(245,240,232,0.38)" fontFamily="'Inter Tight', sans-serif">{layer.depth}</text>
              </g>
            )
          })
        })()}
        <text x={BAR_W / 2} y={totalH + 11} fontSize="7.5" fill="rgba(61,139,82,0.45)" fontFamily="'Inter Tight', sans-serif" textAnchor="middle">CO₂ locked below</text>
      </svg>
    </div>
  )
}

const SPECIES = [
  {
    img: imgCendrawasih,
    name: 'Bird of Paradise',
    latin: 'Paradisaea spp.',
    note: 'Over 30 species endemic to New Guinea, found nowhere else on Earth.',
  },
  {
    img: imgCuscus,
    name: 'Tree Kangaroo',
    latin: 'Dendrolagus spp.',
    note: 'Arboreal marsupials found only in the montane forests of Papua.',
  },
  {
    img: imgKasuari,
    name: 'Cassowary',
    latin: 'Casuarius casuarius',
    note: "A keystone seed disperser of this forest, found across lowland and montane zones.",
  },
  {
    img: imgOrchid,
    name: 'Orchid',
    latin: 'Family Orchidaceae',
    note: 'Papua holds thousands of orchid species. Many remain undescribed by science.',
  },
  {
    img: imgFrog,
    name: 'Tree Frog',
    latin: 'Litoria spp.',
    note: 'Found across lowland rainforest and highland moss forests, Litoria species are sensitive indicators of forest health.',
  },
]

export default function ForestSection() {
  return (
    <section className="bg-cream section-pad">
      <div className="section-container">
        <ScrollReveal>
          <SectionLabel number="01" title="What the Forest Holds" />
          <h2
            className="font-display text-ink mb-6 text-balance"
            style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)' }}
          >
            A single hectare holds more vascular plant species than the entire flora
            of the British Isles.
          </h2>
          <p className="text-ink-muted text-lg leading-relaxed max-w-2xl mb-16">
            Before the data on loss, the reader must first understand what kind
            of place is being described, and why its scale and biological
            integrity are globally significant.
          </p>
        </ScrollReveal>

        {/* Species grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-20">
          {SPECIES.map((s, i) => (
            <ScrollReveal key={s.name} delay={i * 0.08}>
              <div className="flex flex-col items-center text-center group">
                <div className="w-24 h-24 mb-4 relative">
                  <img
                    src={s.img}
                    alt={s.name}
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                <div className="font-display font-bold text-ink text-sm mb-1">{s.name}</div>
                <div className="font-data text-[0.65rem] text-ink/40 italic mb-2">{s.latin}</div>
                <p className="font-body text-xs text-ink-muted leading-relaxed">{s.note}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* 2×2 info grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Peatland Carbon */}
          <ScrollReveal>
            <div className="bg-forest-deep rounded-2xl p-7 h-full">
              <div className="eyebrow text-forest-accent mb-3">Peatland Carbon</div>
              <h3 className="font-display text-cream text-lg mb-4">
                Carbon locked below ground for millennia
              </h3>
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <PeatCrossSection />
                <div className="flex-1">
                  <p className="font-body text-cream/65 text-sm leading-relaxed mb-3">
                    Southern Papua's lowlands contain extensive peatlands up to
                    6 metres deep. A single hectare holds the carbon equivalent of{' '}
                    <strong className="text-cream">10 years of average household emissions</strong>,
                    accumulated over millennia. Draining or burning releases all of it.
                  </p>
                  <p className="font-data text-[0.65rem] text-cream/25">
                    Parish et al. (2008). Peatlands International / GEC / UNEP.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Indigenous Communities — original cream-dark design */}
          <ScrollReveal delay={0.08}>
            <div className="bg-cream-dark rounded-2xl p-7 h-full">
              <div className="eyebrow text-forest-light mb-3">Indigenous Communities</div>
              <div className="flex items-end gap-3 mb-3">
                <div className="stat-number text-forest-mid">
                  <AnimatedCounter value={300} prefix=">" />
                </div>
                <div className="font-data text-sm text-ink-muted pb-2">communities</div>
              </div>
              <p className="font-body text-ink-muted text-sm leading-relaxed mb-2">
                Including the Marind, Muyu, Awyu, Dani, and Komoro. Indigenous-managed
                territories consistently show lower deforestation rates than equivalent
                areas under other governance regimes.
              </p>
              <p className="font-data text-[0.65rem] text-ink/30">
                Garnett et al. (2018). Nature Sustainability.
              </p>
            </div>
          </ScrollReveal>

          {/* Biodiversity — full-row bordered card with big stat, distinct from both above */}
          <div className="md:col-span-2">
          <ScrollReveal delay={0.12}>
            <div className="rounded-2xl p-7 h-full border-2 border-forest-light/30 grid md:grid-cols-3 gap-6 items-center" style={{ background: 'rgba(45,106,63,0.06)' }}>
              <div className="md:col-span-1 text-center md:text-left">
                <div className="eyebrow text-forest-light mb-2">Biodiversity</div>
                <div className="font-display text-forest-mid font-black leading-none mb-1" style={{ fontSize: 'clamp(3rem, 5vw, 4rem)' }}>50%</div>
                <div className="font-data text-xs text-forest-light/60 uppercase tracking-widest leading-snug">of Indonesia's<br />biodiversity</div>
              </div>
              <div className="md:col-span-2 md:border-l-2 md:border-forest-light/20 md:pl-6">
                <p className="font-body text-ink-muted text-sm leading-relaxed mb-2">
                  Papua represents a small fraction of Indonesia's total land area yet holds half the country's
                  entire archipelago-wide biodiversity. More than{' '}
                  <strong className="text-ink">70% of fauna and flora are endemic</strong> —
                  found nowhere else on Earth.
                </p>
                <p className="font-data text-[0.65rem] text-ink/30">
                  Margono et al. (2014). Nature Climate Change.
                </p>
              </div>
            </div>
          </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  )
}
