import type { KeyboardEvent, ReactNode } from 'react'

export function Lever({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  dark = false,
  disabled = false,
  ariaLabel,
  hint,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  format?: (value: number) => string
  dark?: boolean
  disabled?: boolean
  ariaLabel?: string
  hint?: string
}) {
  return (
    <label className={`block ${disabled ? 'opacity-50' : ''}`}>
      <span className="flex items-baseline justify-between gap-2">
        <span className={`label-cinzel ${dark ? '!text-parchment-300' : ''}`}>{label}</span>
        <output className={`value-mono ${dark ? '!text-gold-light' : ''}`}>
          {format ? format(value) : value}
        </output>
      </span>
      <input
        type="range"
        className="lever"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        aria-label={ariaLabel ?? label}
        aria-valuetext={format ? format(value) : String(value)}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {hint && <span className={`block text-[12px] italic ${dark ? 'text-parchment-300/70' : 'text-leather-600'}`}>{hint}</span>}
    </label>
  )
}

export function ToggleWood({
  label,
  checked,
  onChange,
  dark = false,
  description,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  dark?: boolean
  description?: string
}) {
  return (
    <label className="toggle-wood w-full">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} aria-label={label} />
      <span className="track shrink-0" aria-hidden="true" />
      <span className="min-w-0">
        <span className={`block label-cinzel ${dark ? '!text-parchment-200' : ''}`}>{label}</span>
        {description && (
          <span className={`block text-[12px] leading-snug ${dark ? 'text-parchment-300/65' : 'text-leather-600/80'}`}>
            {description}
          </span>
        )}
      </span>
    </label>
  )
}

export function SelectPlaque({
  label,
  value,
  onChange,
  options,
  dark = false,
  ariaLabel,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  dark?: boolean
  ariaLabel?: string
}) {
  return (
    <label className="block">
      <span className={`label-cinzel mb-1 block ${dark ? '!text-parchment-300' : ''}`}>{label}</span>
      <span className="relative block">
        <select
          className={`select-plaque ${dark ? '!border-gold/30 !bg-leather-900/70 !text-parchment-100' : ''}`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={ariaLabel ?? label}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 12 8"
          className={`pointer-events-none absolute right-3 top-1/2 h-2 w-3 -translate-y-1/2 ${dark ? 'text-gold-light' : 'text-leather-700'}`}
          fill="none"
          aria-hidden="true"
        >
          <path d="M1 1l5 5 5-5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </span>
    </label>
  )
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  dark = false,
  suffix,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  dark?: boolean
  suffix?: string
}) {
  return (
    <label className="block">
      <span className={`label-cinzel mb-1 block ${dark ? '!text-parchment-300' : ''}`}>{label}</span>
      <span className="relative block">
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => {
            const next = Number(event.target.value)
            if (Number.isFinite(next)) onChange(Math.min(max, Math.max(min, Math.round(next))))
          }}
          className={`min-h-[44px] w-full border px-3 py-2 font-mono text-[13px] tabular-nums ${
            dark
              ? 'border-gold/30 bg-leather-900/70 text-parchment-100'
              : 'border-leather-700/40 bg-parchment-50/70 text-leather-800'
          }`}
          aria-label={label}
        />
        {suffix && (
          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wider ${dark ? 'text-parchment-300/60' : 'text-leather-600/60'}`}>
            {suffix}
          </span>
        )}
      </span>
    </label>
  )
}

export function Stat({
  label,
  value,
  tone = 'default',
  hint,
}: {
  label: string
  value: ReactNode
  tone?: 'default' | 'gold' | 'forest' | 'ember' | 'wax'
  hint?: string
}) {
  const tones: Record<string, string> = {
    default: 'text-parchment-100',
    gold: 'text-gold-light',
    forest: 'text-[#a9c79b]',
    ember: 'text-[#f0a06a]',
    wax: 'text-[#e79a8f]',
  }
  return (
    <div className="min-w-0 border border-gold/15 bg-black/15 px-2.5 py-2">
      <div className="truncate font-heading text-[8px] font-semibold uppercase tracking-[0.16em] text-parchment-300/70">
        {label}
      </div>
      <div className={`truncate font-mono text-[13px] tabular-nums ${tones[tone]}`}>{value}</div>
      {hint && <div className="truncate text-[9px] text-parchment-300/45">{hint}</div>}
    </div>
  )
}

export function Tabs({
  tabs,
  active,
  onChange,
  ariaLabel,
  className = '',
}: {
  tabs: Array<{ id: string; label: string; icon?: ReactNode }>
  active: string
  onChange: (id: string) => void
  ariaLabel: string
  className?: string
}) {
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const index = tabs.findIndex((tab) => tab.id === active)
    const delta = event.key === 'ArrowRight' ? 1 : -1
    const next = tabs[(index + delta + tabs.length) % tabs.length]
    onChange(next.id)
    const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    buttons[tabs.indexOf(next)]?.focus()
  }
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={onKeyDown}
      className={`flex flex-wrap gap-1.5 ${className}`}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          data-active={active === tab.id}
          className="tab-plaque inline-flex items-center gap-2"
          onClick={() => onChange(tab.id)}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  dark = false,
}: {
  options: Array<{ value: T; label: string }>
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  dark?: boolean
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`inline-flex flex-wrap border ${dark ? 'border-gold/25 bg-black/20' : 'border-leather-700/30 bg-parchment-200/50'} p-0.5`}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`min-h-[38px] px-2.5 font-heading text-[9px] font-semibold uppercase tracking-[0.12em] transition-colors ${
            value === option.value
              ? dark
                ? 'bg-gold/25 text-gold-light'
                : 'bg-leather-700 text-parchment-50'
              : dark
                ? 'text-parchment-300/70 hover:text-parchment-100'
                : 'text-leather-600 hover:text-leather-800'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}