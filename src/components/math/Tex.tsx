import { useMemo } from 'react'
import katex from 'katex'

interface TexProps {
  children: string
  display?: boolean
  className?: string
  ariaLabel?: string
}

/**
 * Merender LaTeX dengan KaTeX. Konten berasal dari 01-CONTENT.md (tepercaya),
 * bukan input pengguna.
 */
export function Tex({ children, display = false, className = '', ariaLabel }: TexProps) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(children, {
        displayMode: display,
        throwOnError: false,
        strict: false,
        trust: false,
        output: 'htmlAndMathml',
      })
    } catch {
      return `<code>${children.replace(/</g, '&lt;')}</code>`
    }
  }, [children, display])

  if (display) {
    return (
      <div
        className={`tex-display ${className}`}
        aria-label={ariaLabel}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    )
  }

  return (
    <span
      className={`tex-inline ${className}`}
      aria-label={ariaLabel}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}