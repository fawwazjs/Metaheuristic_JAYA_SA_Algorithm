/** Ikon penutup kecil. */
export function WaxSealish({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      aria-hidden="true"
      style={{
        background: 'radial-gradient(circle at 34% 28%, #a83a32, #7a1e1e 42%, #521010 78%, #3a0909)',
        boxShadow:
          'inset 0 2px 3px rgba(255,180,150,.28), inset 0 -4px 8px rgba(0,0,0,.55), 0 6px 14px -6px rgba(0,0,0,.8)',
      }}
    >
      <svg viewBox="0 0 40 40" className="h-2/3 w-2/3" fill="none">
        <path
          d="M20 6 L32 11 V21 C32 28.5 27 33.5 20 36 C13 33.5 8 28.5 8 21 V11Z"
          stroke="#f0d79a"
          strokeWidth="1.4"
          opacity=".9"
        />
        <path d="M14 25V15l6 7 6-7v10" stroke="#f7e5b8" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}