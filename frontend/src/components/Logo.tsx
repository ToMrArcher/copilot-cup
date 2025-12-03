/**
 * Logo Component
 * Theme-aware logo that switches between dark and light versions
 */

import { useTheme } from '../contexts/ThemeContext'
import logoDark from '../assets/logo.svg'
import logoLight from '../assets/logo-light.svg'

interface LogoProps {
  className?: string
  alt?: string
}

export function Logo({ className = 'h-8 w-auto', alt = 'Checkin' }: LogoProps) {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <img
      src={isDark ? logoLight : logoDark}
      alt={alt}
      className={`${className} transition-opacity duration-200`}
    />
  )
}
