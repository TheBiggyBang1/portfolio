import { useId } from 'react'
import { LOGO_CIRCLE, LOGO_PATH, LOGO_VIEWBOX } from '../lib/logoPath'

interface Props {
  className?: string
  /** 'gradient' (olive→jade), 'solid' (currentColor) or 'outline' (stroke only, for the preloader). */
  variant?: 'gradient' | 'solid' | 'outline'
  title?: string
}

export function LogoMark({ className, variant = 'gradient', title }: Props) {
  const id = useId()
  const fill = variant === 'gradient' ? `url(#${id})` : variant === 'solid' ? 'currentColor' : 'none'
  return (
    <svg
      className={className}
      viewBox={`0 0 ${LOGO_VIEWBOX.width} ${LOGO_VIEWBOX.height}`}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {variant === 'gradient' && (
        <defs>
          <linearGradient id={id} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="var(--olive)" />
            <stop offset="0.55" stopColor="var(--jade)" />
            <stop offset="1" stopColor="var(--jade-light)" />
          </linearGradient>
        </defs>
      )}
      <path d={LOGO_PATH} fill={fill} />
      <circle cx={LOGO_CIRCLE.cx} cy={LOGO_CIRCLE.cy} r={LOGO_CIRCLE.r} fill={fill} />
    </svg>
  )
}
