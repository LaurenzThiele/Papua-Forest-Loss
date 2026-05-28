export default function SectionLabel({ number, title, light = false }) {
  return (
    <div className={`eyebrow mb-6 ${light ? 'text-forest-accent' : 'text-forest-light'}`}>
      {number && <span className="mr-2 opacity-50">{number}</span>}
      {title}
    </div>
  )
}
