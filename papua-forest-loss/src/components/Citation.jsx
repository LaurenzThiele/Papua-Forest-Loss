export default function Citation({ children, light = false }) {
  return (
    <p className={`font-data text-[0.68rem] leading-relaxed mt-2 ${light ? 'text-white/40' : 'text-ink/40'}`}>
      Source: {children}
    </p>
  )
}
