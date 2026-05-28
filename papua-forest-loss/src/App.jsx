import { useScroll, useTransform, motion } from 'motion/react'

import Hero from './sections/Hero.jsx'
import ForestSection from './sections/ForestSection.jsx'
import BaselineSection from './sections/BaselineSection.jsx'
import AccelerationSection from './sections/AccelerationSection.jsx'
import ModerationSection from './sections/ModerationSection.jsx'
import ReversalSection from './sections/ReversalSection.jsx'
import HumanSection from './sections/HumanSection.jsx'
import SynthesisSection from './sections/SynthesisSection.jsx'
import ClosingSection from './sections/ClosingSection.jsx'
import summary from './data/total_summary.json'
import drivers from './data/loss_by_driver.json'
import provinces from './data/annual_loss_province.json'
import protectedData from './data/loss_protected_areas.json'

function ProgressBar() {
  const { scrollYProgress } = useScroll()
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-0.5 bg-forest-accent origin-left z-50"
      style={{ scaleX }}
    />
  )
}

export default function App() {
  return (
    <>
      <ProgressBar />
      <main>
        <Hero data={summary} />
        <ForestSection />
        <BaselineSection summary={summary} />
        <AccelerationSection summary={summary} drivers={drivers} />
        <ModerationSection summary={summary} protectedData={protectedData} />
        <ReversalSection summary={summary} />
        <HumanSection provinces={provinces} />
        <SynthesisSection summary={summary} />
        <ClosingSection summary={summary} />
      </main>
    </>
  )
}
