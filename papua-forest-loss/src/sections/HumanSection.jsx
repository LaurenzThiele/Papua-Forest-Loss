import { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { motion, AnimatePresence } from 'motion/react'
import ScrollReveal from '../components/ScrollReveal.jsx'
import SectionLabel from '../components/SectionLabel.jsx'
import Sparkline from '../components/Sparkline.jsx'
import imgTribesmen from '../assets/tribesmen.png'
import imgHut from '../assets/hut.png'
import regencyJson from '../data/annual_loss_regency.json'

const LAYER_COLORS = {
  palm: '#3b82f6',
  wood: '#884ea0',
  mining: '#22d3ee',
  protected: '#f472b6',
}

const STUDY_BOUNDS = [[129, -10], [142, 1]]
const SMALL_SCREEN_INTERACTIVE = 480

const BASEMAP_STYLE = {
  version: 8,
  sources: {
    world: { type: 'vector', url: 'https://demotiles.maplibre.org/tiles/tiles.json' }
  },
  layers: [
    { id: 'bg', type: 'background', paint: { 'background-color': '#090e0b' } },
    { id: 'land', type: 'fill', source: 'world', 'source-layer': 'countries', paint: { 'fill-color': '#131d15' } },
    { id: 'borders', type: 'line', source: 'world', 'source-layer': 'countries', paint: { 'line-color': 'rgba(61,139,82,0.2)', 'line-width': 0.7 } },
  ]
}

const PROVINCE_LOSS = {
  91: { name: 'Papua', total: 212833, pct: 15.5, annual: [4080,5812,3131,5188,5150,6122,6611,6026,8404,12244,11906,18063,9688,10471,8676,10333,8455,8395,10155,11114,9364,11385,7854,7076,7132] },
  92: { name: 'Papua Barat', total: 258724, pct: 18.8, annual: [4943,9066,5955,11423,5389,7585,4247,4502,7647,8855,6489,9941,5676,11672,23250,20267,11630,16858,15543,14670,12454,11827,11741,8850,8245] },
  93: { name: 'Papua Selatan', total: 386027, pct: 28.0, annual: [5194,10695,4593,8260,6770,8884,8641,4432,7799,5486,9805,22533,21272,31388,58871,66891,27726,14376,10187,6236,5860,3594,3129,7115,26291] },
  94: { name: 'Papua Tengah', total: 179150, pct: 13.0, annual: [2216,3610,2998,5030,2600,4716,3984,3580,5603,4369,3283,8428,8342,17618,16944,10788,10521,9545,8663,7268,5928,7924,7774,5144,12275] },
  95: { name: 'Papua Pegunungan', total: 170404, pct: 12.4, annual: [3164,3737,2843,3964,2731,5124,5316,4083,5063,7768,2121,5694,5377,9512,11926,9814,11548,8464,10647,9747,8495,9246,7879,7123,9019] },
  96: { name: 'Papua Barat Daya', total: 169489, pct: 12.3, annual: [2248,8471,2701,2998,2925,5562,3788,4848,9380,4971,7127,6031,3632,9448,26909,11373,7172,7535,5121,5224,3128,5671,7866,5426,9934] },
}

const PANEL_BG = 'rgba(11,30,18,0.97)'
const PANEL_BORDER_SIDE = '1px solid rgba(61,139,82,0.18)'
const LABEL_STYLE = { fontFamily: "'Inter Tight', sans-serif", fontSize: '0.58rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(61,139,82,0.6)', marginBottom: '0.3rem' }
const STAT_LABEL = { fontSize: '0.58rem', color: 'rgba(245,240,232,0.35)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: '0.3rem' }

function StatGrid({ items }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1.4rem' }}>
      {items.map(s => (
        <div key={s.label} style={{ padding: '0.7rem', background: 'rgba(255,255,255,0.04)', borderRadius: 6 }}>
          <div style={STAT_LABEL}>{s.label}</div>
          <div style={{ fontFamily: "'Inter Tight', sans-serif", fontWeight: 700, fontSize: '1rem', color: s.color }}>{s.value}</div>
        </div>
      ))}
    </div>
  )
}

const CLOSE_BTN = {
  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 4, cursor: 'pointer', color: 'rgba(245,240,232,0.55)',
  fontSize: '1rem', lineHeight: 1, width: 28, height: 28,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

function SidePanel({ children, onClose, isMobile }) {
  const [expanded, setExpanded] = useState(false)

  const mobileStyle = {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: expanded ? 'calc(100% - 60px)' : 200,
    background: PANEL_BG,
    borderTop: PANEL_BORDER_SIDE,
    borderRadius: '1rem 1rem 0 0',
    zIndex: 50,
    display: 'flex', flexDirection: 'column',
    transition: 'height 0.3s cubic-bezier(0.4,0,0.2,1)',
  }
  const desktopStyle = {
    position: 'absolute', top: 0, right: 0, bottom: 0,
    width: 280,
    background: PANEL_BG,
    borderLeft: PANEL_BORDER_SIDE,
    zIndex: 50,
    overflowY: 'auto',
    padding: '1.5rem',
  }

  return (
    <motion.div
      initial={isMobile ? { opacity: 0, y: 40 } : { opacity: 0, x: 40 }}
      animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, x: 0 }}
      exit={isMobile ? { opacity: 0, y: 40 } : { opacity: 0, x: 40 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={isMobile ? mobileStyle : desktopStyle}
    >
      {isMobile ? (
        <>
          {/* Drag handle (tap to expand/collapse) + close button */}
          <div style={{ padding: '0.6rem 1.25rem 0.4rem', flexShrink: 0 }}>
            <div
              onClick={() => setExpanded(e => !e)}
              style={{ width: 36, height: 4, background: 'rgba(255,255,255,0.14)', borderRadius: 2, margin: '0 auto 0.6rem', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={CLOSE_BTN}>×</button>
            </div>
          </div>
          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.25rem 1.25rem 2rem' }}>
            {children}
          </div>
        </>
      ) : (
        <>
          <button onClick={onClose} style={{ ...CLOSE_BTN, position: 'absolute', top: '0.9rem', right: '1rem' }}>×</button>
          {children}
        </>
      )}
    </motion.div>
  )
}

function ProvincePanel({ provinceId, onClose, isMobile }) {
  const data = PROVINCE_LOSS[provinceId]
  if (!data) return null
  const peakIdx = data.annual.indexOf(Math.max(...data.annual))
  const peakYear = 2001 + peakIdx
  const peakVal = data.annual[peakIdx]
  const loss2025 = data.annual[24]
  const avgAnnual = Math.round(data.total / 25)
  const sparklineWidth = isMobile ? Math.min(window.innerWidth - 80, 260) : 222
  return (
    <SidePanel onClose={onClose} isMobile={isMobile}>
      <div style={LABEL_STYLE}>Province</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1.3rem', color: '#f5f0e8', marginBottom: '1.2rem' }}>{data.name}</div>
      <StatGrid items={[
        { label: 'Total loss', value: `${Math.round(data.total / 1000)}k ha`, color: '#c0392b' },
        { label: 'Share of total', value: `${data.pct}%`, color: '#3d8b52' },
        { label: `Peak (${peakYear})`, value: `${Math.round(peakVal / 1000)}k ha`, color: '#e67e22' },
        { label: '2025 loss', value: `${(loss2025 / 1000).toFixed(1)}k ha`, color: '#c0392b' },
      ]} />
      <div style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.28)', marginBottom: '1rem', lineHeight: 1.5 }}>
        Avg. {avgAnnual.toLocaleString()} ha/yr over 25 years
      </div>
      <div style={{ fontSize: '0.58rem', color: 'rgba(245,240,232,0.35)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: '0.7rem' }}>Annual loss 2001 to 2025</div>
      <Sparkline data={data.annual} width={sparklineWidth} height={62} color="#c0392b" />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.57rem', color: 'rgba(245,240,232,0.22)' }}>
        <span>2001</span><span>2025</span>
      </div>
    </SidePanel>
  )
}

function RegencyPanel({ regency, onClose, isMobile }) {
  if (!regency) return null
  let peakYear = null, peakVal = null, loss2025 = null
  if (regency.annual && regency.annual.length) {
    const peakIdx = regency.annual.indexOf(Math.max(...regency.annual))
    peakYear = 2001 + peakIdx
    peakVal = regency.annual[peakIdx]
    loss2025 = regency.annual[24]
  }
  const sparklineWidth = isMobile ? Math.min(window.innerWidth - 80, 260) : 222
  return (
    <SidePanel onClose={onClose} isMobile={isMobile}>
      <div style={LABEL_STYLE}>Regency</div>
      <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '1.25rem', color: '#f5f0e8', marginBottom: '0.2rem' }}>{regency.name}</div>
      {regency.province_name && (
        <div style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.38)', marginBottom: '1.2rem' }}>{regency.province_name}</div>
      )}
      <StatGrid items={[
        { label: 'Total loss', value: regency.total ? `${Math.round(regency.total / 1000)}k ha` : 'N/A', color: '#c0392b' },
        { label: 'Share of total', value: regency.pct ? `${regency.pct.toFixed(2)}%` : 'N/A', color: '#3d8b52' },
        ...(peakYear ? [{ label: `Peak (${peakYear})`, value: `${Math.round(peakVal / 1000)}k ha`, color: '#e67e22' }] : []),
        ...(loss2025 != null ? [{ label: '2025 loss', value: `${(loss2025 / 1000).toFixed(1)}k ha`, color: '#c0392b' }] : []),
      ]} />
      {regency.annual && (
        <>
          <div style={{ fontSize: '0.58rem', color: 'rgba(245,240,232,0.35)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: '0.7rem' }}>Annual loss 2001 to 2025</div>
          <Sparkline data={regency.annual} width={sparklineWidth} height={64} color="#c0392b" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.57rem', color: 'rgba(245,240,232,0.22)' }}>
            <span>2001</span><span>2025</span>
          </div>
        </>
      )}
    </SidePanel>
  )
}

export default function HumanSection() {
  const sectionRef = useRef(null)
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [shouldInitMap, setShouldInitMap] = useState(false)
  const [activeLayers, setActiveLayers] = useState({ palm: false, wood: false, mining: false, protected: false })
  const [viewMode, setViewMode] = useState('province')
  const [activeProvince, setActiveProvince] = useState(null)
  const [selectedRegency, setSelectedRegency] = useState(null)
  const [regencyData, setRegencyData] = useState(null)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640)
  const viewModeRef = useRef('province')
  useEffect(() => { viewModeRef.current = viewMode }, [viewMode])

  // Track mobile breakpoint
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640)
    window.addEventListener('resize', handler, { passive: true })
    return () => window.removeEventListener('resize', handler)
  }, [])

  // On resize: toggle map interactivity and refit study area in province view
  useEffect(() => {
    const handler = () => {
      const map = mapInstance.current
      if (!map || !mapLoaded) return
      if (window.innerWidth < SMALL_SCREEN_INTERACTIVE) {
        map.dragPan.enable()
        map.touchZoomRotate.enable()
      } else {
        map.dragPan.disable()
        map.touchZoomRotate.disable()
        if (viewModeRef.current === 'province') {
          map.fitBounds(STUDY_BOUNDS, { padding: 24, duration: 400 })
        }
      }
    }
    window.addEventListener('resize', handler, { passive: true })
    return () => window.removeEventListener('resize', handler)
  }, [mapLoaded])

  // Lazy-init map: only when section is 200px from viewport
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          setShouldInitMap(true)
          obs.disconnect()
        }
      },
      { rootMargin: '200px' }
    )
    if (sectionRef.current) obs.observe(sectionRef.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!shouldInitMap) return
    const lookup = {}
    regencyJson.forEach(r => { lookup[r.id] = r })
    setRegencyData(lookup)
  }, [shouldInitMap])

  useEffect(() => {
    if (!shouldInitMap || mapInstance.current) return

    const interactable = window.innerWidth < SMALL_SCREEN_INTERACTIVE
    const map = new maplibregl.Map({
      container: mapRef.current,
      style: BASEMAP_STYLE,
      bounds: STUDY_BOUNDS,
      fitBoundsOptions: { padding: 24, maxZoom: 7 },
      minZoom: 4,
      maxZoom: 12,
      maxBounds: [[118, -15], [148, 6]],
      attributionControl: false,
      scrollZoom: false,
      dragPan: interactable,
      dragRotate: false,
      touchZoomRotate: interactable,
      touchPitch: false,
      doubleClickZoom: false,
      keyboard: false,
    })
    mapInstance.current = map
    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
    setTimeout(() => {
      const el = map.getContainer().querySelector('.maplibregl-ctrl-attrib')
      if (el) el.classList.remove('maplibregl-compact-show')
    }, 300)

    map.on('load', async () => {
      map.addSource('provinces', { type: 'geojson', data: './data/papua_provinces.geojson' })
      map.addLayer({
        id: 'provinces-fill', type: 'fill', source: 'provinces',
        paint: {
          'fill-color': [
            'interpolate', ['linear'],
            ['match', ['get', 'id'], 91, 212833, 92, 258724, 93, 386027, 94, 179150, 95, 170404, 96, 169489, 0],
            0, '#1e4023', 170000, '#7a5219', 260000, '#c0392b', 386000, '#8b1509',
          ],
          'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.9, 0.68],
        },
      })
      map.addLayer({
        id: 'provinces-stroke', type: 'line', source: 'provinces',
        paint: {
          'line-color': ['case', ['boolean', ['feature-state', 'hover'], false], '#3d8b52', 'rgba(61,139,82,0.3)'],
          'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2.5, 1],
        },
      })

      map.addSource('regencies', { type: 'geojson', data: './data/papua_regencies.geojson', promoteId: 'id' })
      map.addLayer({
        id: 'regencies-fill', type: 'fill', source: 'regencies',
        paint: {
          'fill-color': [
            'interpolate', ['linear'],
            ['coalesce', ['feature-state', 'loss'], 0],
            0, '#2b3a2e', 20000, '#7a5219', 60000, '#c0392b', 100000, '#8b1509',
          ],
          'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.85, 0.6],
        },
        layout: { visibility: 'none' },
      })
      map.addLayer({
        id: 'regencies-stroke', type: 'line', source: 'regencies',
        paint: {
          'line-color': ['case', ['boolean', ['feature-state', 'hover'], false], 'rgba(61,139,82,0.9)', 'rgba(61,139,82,0.22)'],
          'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 1.8, 0.6],
          'line-dasharray': [4, 3],
        },
        layout: { visibility: 'none' },
      })
      map.addLayer({
        id: 'regencies-selected', type: 'line', source: 'regencies',
        paint: { 'line-color': '#3d8b52', 'line-width': 2.5, 'line-opacity': 1 },
        filter: ['==', ['get', 'id'], ''],
        layout: { visibility: 'none' },
      })

      for (const [key, file, color] of [
        ['palm', 'papua_palm_oil', '#3b82f6'],
        ['wood', 'papua_wood_fiber', '#884ea0'],
        ['mining', 'papua_mining', '#22d3ee'],
      ]) {
        const res = await fetch(`./data/${file}.geojson`)
        const data = await res.json()
        map.addSource(key, { type: 'geojson', data })
        map.addLayer({ id: `${key}-fill`, type: 'fill', source: key, layout: { visibility: 'none' }, paint: { 'fill-color': color, 'fill-opacity': 0.35 } })
        map.addLayer({ id: `${key}-outline`, type: 'line', source: key, layout: { visibility: 'none' }, paint: { 'line-color': color, 'line-opacity': 0.8, 'line-width': 1 } })
      }

      const paData = await fetch('./data/papua_protected_areas.geojson').then(r => r.json())
      map.addSource('protected', { type: 'geojson', data: paData })
      map.addLayer({ id: 'protected-fill', type: 'fill', source: 'protected', layout: { visibility: 'none' }, paint: { 'fill-color': '#f472b6', 'fill-opacity': 0.12 } })
      map.addLayer({ id: 'protected-outline', type: 'line', source: 'protected', layout: { visibility: 'none' }, paint: { 'line-color': '#f472b6', 'line-opacity': 0.75, 'line-width': 1 } })

      setMapLoaded(true)
    })

    return () => { map.remove(); mapInstance.current = null }
  }, [shouldInitMap])

  useEffect(() => {
    const map = mapInstance.current
    if (!map || !mapLoaded || !regencyData) return
    const apply = () => {
      Object.entries(regencyData).forEach(([id, rd]) => {
        try { map.setFeatureState({ source: 'regencies', id }, { loss: rd.total_loss_ha || 0 }) } catch {}
      })
    }
    if (map.isSourceLoaded('regencies')) {
      apply()
    } else {
      const onSourceData = () => {
        if (map.isSourceLoaded('regencies')) {
          map.off('sourcedata', onSourceData)
          apply()
        }
      }
      map.on('sourcedata', onSourceData)
    }
  }, [mapLoaded, regencyData])

  useEffect(() => {
    const map = mapInstance.current
    if (!map || !mapLoaded || viewMode !== 'province') return
    let hovered = null
    const onMove = (e) => {
      if (!e.features.length) return
      const id = e.features[0].id
      if (hovered !== null) map.setFeatureState({ source: 'provinces', id: hovered }, { hover: false })
      hovered = id
      map.setFeatureState({ source: 'provinces', id: hovered }, { hover: true })
      map.getCanvas().style.cursor = 'pointer'
    }
    const onLeave = () => {
      if (hovered !== null) { map.setFeatureState({ source: 'provinces', id: hovered }, { hover: false }); hovered = null }
      map.getCanvas().style.cursor = ''
    }
    map.on('mousemove', 'provinces-fill', onMove)
    map.on('mouseleave', 'provinces-fill', onLeave)
    return () => { map.off('mousemove', 'provinces-fill', onMove); map.off('mouseleave', 'provinces-fill', onLeave) }
  }, [mapLoaded, viewMode])

  useEffect(() => {
    const map = mapInstance.current
    if (!map || !mapLoaded || viewMode !== 'province') return
    const onClick = (e) => {
      if (!e.features.length) return
      const feat = e.features[0]
      const provId = feat.properties.id
      setActiveProvince(provId)
      setViewMode('regency')

      const coords = []
      const geom = feat.geometry
      const extract = (rings) => rings.forEach(ring => ring.forEach(([lng, lat]) => coords.push([lng, lat])))
      if (geom.type === 'Polygon') extract(geom.coordinates)
      else if (geom.type === 'MultiPolygon') geom.coordinates.forEach(p => extract(p))
      if (coords.length) {
        const allLngs = coords.map(c => c[0]), allLats = coords.map(c => c[1])
        const avgLng = allLngs.reduce((a, b) => a + b, 0) / allLngs.length
        const avgLat = allLats.reduce((a, b) => a + b, 0) / allLats.length
        const filtered = coords.filter(([lng, lat]) => Math.abs(lng - avgLng) < 8 && Math.abs(lat - avgLat) < 6)
        const base = filtered.length > 0 ? filtered : coords
        const lngs = base.map(c => c[0]), lats = base.map(c => c[1])
        const mobile = window.innerWidth < 640
        map.fitBounds(
          [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
          {
            padding: mobile
              ? { top: 30, bottom: 215, left: 20, right: 20 }
              : { top: 60, bottom: 60, left: 60, right: 300 },
            maxZoom: 8,
            duration: 900,
            linear: true,
          }
        )
      }
      map.setLayoutProperty('provinces-fill', 'visibility', 'none')
      map.setLayoutProperty('provinces-stroke', 'visibility', 'none')
      map.setLayoutProperty('regencies-fill', 'visibility', 'visible')
      map.setLayoutProperty('regencies-stroke', 'visibility', 'visible')
      map.setLayoutProperty('regencies-selected', 'visibility', 'visible')
      map.setFilter('regencies-fill', ['==', ['get', 'province_id'], provId])
      map.setFilter('regencies-stroke', ['==', ['get', 'province_id'], provId])
    }
    map.on('click', 'provinces-fill', onClick)
    return () => map.off('click', 'provinces-fill', onClick)
  }, [mapLoaded, viewMode])

  useEffect(() => {
    const map = mapInstance.current
    if (!map || !mapLoaded || viewMode !== 'regency') return
    let hovered = null
    const onMove = (e) => {
      if (!e.features.length) return
      const id = e.features[0].id
      if (hovered !== null) map.setFeatureState({ source: 'regencies', id: hovered }, { hover: false })
      hovered = id
      map.setFeatureState({ source: 'regencies', id: hovered }, { hover: true })
      map.getCanvas().style.cursor = 'pointer'
    }
    const onLeave = () => {
      if (hovered !== null) { map.setFeatureState({ source: 'regencies', id: hovered }, { hover: false }); hovered = null }
      map.getCanvas().style.cursor = ''
    }
    const onClick = (e) => {
      if (!e.features.length) return
      const feat = e.features[0]
      const rd = regencyData?.[feat.properties.id]
      setSelectedRegency({
        id: feat.properties.id,
        name: feat.properties.name,
        province_name: PROVINCE_LOSS[feat.properties.province_id]?.name,
        total: rd?.total_loss_ha,
        pct: rd ? (rd.total_loss_ha / 1376575 * 100) : null,
        annual: rd ? Object.values(rd.annual_loss) : null,
      })
      map.setFilter('regencies-selected', ['==', ['get', 'id'], feat.properties.id])
    }
    map.on('mousemove', 'regencies-fill', onMove)
    map.on('mouseleave', 'regencies-fill', onLeave)
    map.on('click', 'regencies-fill', onClick)
    return () => {
      map.off('mousemove', 'regencies-fill', onMove)
      map.off('mouseleave', 'regencies-fill', onLeave)
      map.off('click', 'regencies-fill', onClick)
    }
  }, [mapLoaded, viewMode, regencyData])

  const closeRegency = useCallback(() => {
    const map = mapInstance.current
    if (map) map.setFilter('regencies-selected', ['==', ['get', 'id'], ''])
    setSelectedRegency(null)
  }, [])

  const resetToProvinceView = useCallback(() => {
    const map = mapInstance.current
    if (!map) return
    setViewMode('province')
    setActiveProvince(null)
    setSelectedRegency(null)
    map.setFilter('regencies-selected', ['==', ['get', 'id'], ''])
    map.setLayoutProperty('provinces-fill', 'visibility', 'visible')
    map.setLayoutProperty('provinces-stroke', 'visibility', 'visible')
    map.setLayoutProperty('regencies-fill', 'visibility', 'none')
    map.setLayoutProperty('regencies-stroke', 'visibility', 'none')
    map.setLayoutProperty('regencies-selected', 'visibility', 'none')
    map.fitBounds(STUDY_BOUNDS, { padding: 24, maxZoom: 7, duration: 900 })
  }, [])

  const toggleLayer = useCallback((key) => {
    if (!mapInstance.current || !mapLoaded) return
    const map = mapInstance.current
    const newVisible = !activeLayers[key]
    const vis = newVisible ? 'visible' : 'none'
    if (key === 'protected') {
      map.setLayoutProperty('protected-fill', 'visibility', vis)
      map.setLayoutProperty('protected-outline', 'visibility', vis)
    } else {
      map.setLayoutProperty(`${key}-fill`, 'visibility', vis)
      map.setLayoutProperty(`${key}-outline`, 'visibility', vis)
    }
    setActiveLayers(prev => ({ ...prev, [key]: newVisible }))
  }, [activeLayers, mapLoaded])

  const LAYER_BUTTONS = [
    { key: 'palm', label: 'Palm oil concessions' },
    { key: 'wood', label: 'Wood fiber' },
    { key: 'mining', label: 'Mining' },
    { key: 'protected', label: 'Protected areas' },
  ]

  const panelOpen = viewMode === 'regency'
  // On desktop, hint moves left of the open panel; on mobile hint stays top-right
  const hintRight = (!isMobile && panelOpen) ? 296 : '1rem'

  return (
    <section ref={sectionRef} className="bg-cream section-pad">
      <div className="section-container">
        <ScrollReveal>
          <SectionLabel number="06" title="The Human Dimension" />
          <h2
            className="font-display text-ink mb-6 text-balance"
            style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)' }}
          >
            Forest loss data records physical change. It does not record what
            is lost when a community loses its forest.
          </h2>
          <p className="text-ink-muted text-base leading-relaxed max-w-2xl mb-10">
            Papua's more than 300 indigenous communities are not peripheral to
            this story. The spatial distribution of loss, concentrated in areas
            of active industrial concession, corresponds to areas where
            traditional land tenure has been overlapped by formal concession
            licensing.
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <div
            className="relative mb-4"
            style={{ height: isMobile ? '55vh' : '68vh', minHeight: isMobile ? 360 : 480, borderRadius: '1rem', overflow: 'hidden', border: '1px solid rgba(61,139,82,0.18)' }}
          >
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

            {/* Back to provinces */}
            <AnimatePresence>
              {viewMode === 'regency' && (
                <motion.button
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  onClick={resetToProvinceView}
                  style={{
                    position: 'absolute', top: '1rem', left: '1rem', zIndex: 60,
                    background: 'rgba(11,30,18,0.92)',
                    border: '1px solid rgba(61,139,82,0.3)',
                    borderRadius: 6, padding: isMobile ? '0.3rem 0.7rem' : '0.45rem 1rem',
                    cursor: 'pointer',
                    fontFamily: "'Inter Tight', sans-serif",
                    fontSize: isMobile ? '0.62rem' : '0.78rem', fontWeight: 600,
                    color: '#3d8b52', letterSpacing: '0.05em',
                    backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                  }}
                >
                  <svg width="9" height="8" viewBox="0 0 12 10" fill="none">
                    <path d="M5 1L1 5L5 9M1 5H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  All provinces
                </motion.button>
              )}
            </AnimatePresence>

            {/* Hint — hidden on mobile in regency view to avoid overlap with back button */}
            {!(isMobile && viewMode === 'regency') && <div
              style={{
                position: 'absolute',
                top: '1rem',
                zIndex: 20,
                right: hintRight,
                transition: 'right 0.3s ease',
                background: 'rgba(11,30,18,0.82)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 6, padding: isMobile ? '0.4rem 0.85rem' : '0.55rem 1.1rem',
                backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center',
              }}
            >
              <span style={{ fontFamily: "'Inter Tight', sans-serif", fontSize: isMobile ? '0.62rem' : '0.8rem', color: 'rgba(245,240,232,0.42)', letterSpacing: '0.04em', lineHeight: 1 }}>
                {viewMode === 'province'
                  ? (isMobile ? 'Tap a province' : 'Click a province to explore regencies')
                  : `${PROVINCE_LOSS[activeProvince]?.name}: ${isMobile ? 'tap' : 'click'} a regency`}
              </span>
            </div>}

            {/* Legend — zIndex 1 keeps it below MapLibre controls (z-index 2) so attribution expands above it */}
            <div
              style={{
                position: 'absolute', bottom: '1rem', left: '1rem', zIndex: 1,
                background: 'rgba(11,30,18,0.88)',
                border: '1px solid rgba(61,139,82,0.15)',
                borderRadius: 6, padding: isMobile ? '0.75rem 1rem' : '0.9rem 1.2rem',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div style={{ fontSize: isMobile ? '0.57rem' : '0.72rem', color: 'rgba(245,240,232,0.38)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: isMobile ? '0.45rem' : '0.55rem' }}>
                Forest loss
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.45rem' : '0.65rem' }}>
                {[['#1e4023', 'Low'], ['#7a5219', 'Moderate'], ['#c0392b', 'High'], ['#8b1509', 'Severe']].map(([c, l]) => (
                  <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <div style={{ width: isMobile ? 18 : 24, height: isMobile ? 9 : 12, background: c, borderRadius: 2 }} />
                    <div style={{ fontSize: isMobile ? '0.5rem' : '0.65rem', color: 'rgba(245,240,232,0.32)' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Side / bottom panels */}
            <AnimatePresence>
              {viewMode === 'regency' && !selectedRegency && (
                <ProvincePanel key={`prov-${activeProvince}`} provinceId={activeProvince} onClose={resetToProvinceView} isMobile={isMobile} />
              )}
              {selectedRegency && (
                <RegencyPanel key={selectedRegency.id} regency={selectedRegency} onClose={closeRegency} isMobile={isMobile} />
              )}
            </AnimatePresence>
          </div>

          {/* Layer toggles */}
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="font-data text-xs text-ink-muted self-center">Show layers:</span>
            {LAYER_BUTTONS.map(btn => (
              <button
                key={btn.key}
                onClick={() => toggleLayer(btn.key)}
                disabled={!mapLoaded}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border font-data text-xs transition-all duration-200"
                style={{
                  borderColor: activeLayers[btn.key] ? LAYER_COLORS[btn.key] : '#d1d5db',
                  backgroundColor: activeLayers[btn.key] ? `${LAYER_COLORS[btn.key]}18` : 'transparent',
                  color: activeLayers[btn.key] ? LAYER_COLORS[btn.key] : '#6b7280',
                }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeLayers[btn.key] ? LAYER_COLORS[btn.key] : '#d1d5db' }} />
                {btn.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Indigenous context */}
       <div className="grid lg:grid-cols-2 gap-8">
        <ScrollReveal delay={0.1}>
          <div className="flex gap-4 items-stretch">
            <img
              src={imgTribesmen}
              alt="Indigenous communities of Papua"
              className="w-[30%] max-w-[192px] h-auto object-cover opacity-70 shrink-0"
              loading="lazy"
            />
            <div>
              <div className="eyebrow text-forest-light mb-2">Indigenous land tenure</div>
              <p className="text-ink-muted text-sm leading-relaxed">
                Communities including Marind, Yei Nan, Muyu, and Awyu have
                maintained oral and practical ecological knowledge of these
                forest systems over generations: plant phenology, seasonal
                water patterns, land-use practices adapted to peatland systems.
                This knowledge is not captured in remote sensing datasets.
              </p>
              <p className="font-data text-[0.65rem] text-ink/30 mt-2">
                Garnett et al. (2018). Nature Sustainability.
              </p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <div className="flex gap-4 items-stretch">
            <img
              src={imgHut}
              alt="Traditional settlement"
              className="w-[30%] max-w-[192px] h-auto object-cover opacity-70 shrink-0"
              loading="lazy"
            />
            <div>
              <div className="eyebrow text-forest-light mb-2">Spatial distribution</div>
              <p className="text-ink-muted text-sm leading-relaxed">
                The 83.4% of loss recorded outside mapped concessions does not
                mean outside all human influence. It reflects migrants following
                road corridors, communities displaced from primary territories,
                and informal agricultural expansion. These are patterns that
                research on highway-induced deforestation in Papua has documented.
              </p>
              <p className="font-data text-[0.65rem] text-ink/30 mt-2">
                ANU Crawford School (2023); Gaveau et al. (2021).
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
      </div>
    </section>
  )
}
