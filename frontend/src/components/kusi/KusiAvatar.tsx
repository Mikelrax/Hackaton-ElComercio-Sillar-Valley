const RAYS = [0, 45, 90, 135, 180, 225, 270, 315]

export function KusiAvatar({ size = 40, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className={`shrink-0 ${className}`}>
      <circle cx="24" cy="24" r="24" fill="#FEF3C7" />
      {RAYS.map(angle => (
        <line
          key={angle}
          x1="24"
          y1="3.5"
          x2="24"
          y2="7.5"
          stroke="#F59E0B"
          strokeWidth="2.6"
          strokeLinecap="round"
          transform={`rotate(${angle} 24 24)`}
        />
      ))}
      <circle cx="24" cy="24" r="14.5" fill="#F59E0B" />
      <circle cx="19.3" cy="21.5" r="2.1" fill="#073B36" />
      <circle cx="28.7" cy="21.5" r="2.1" fill="#073B36" />
      <path d="M18.2 27.2c1.5 2.6 3.5 3.9 5.8 3.9s4.3-1.3 5.8-3.9" stroke="#073B36" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </svg>
  )
}
