import { useRef } from 'react'
import { motion, useInView } from 'motion/react'

export default function ScrollReveal({
  children,
  delay = 0,
  y = 32,
  className = '',
  as = 'div',
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-8% 0px' })

  const Tag = motion[as] || motion.div

  return (
    <Tag
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }}
    >
      {children}
    </Tag>
  )
}
