import { Color, SRGBColorSpace } from 'three'

/**
 * The palette lives in src/styles/tokens.css. 3D code reads the same CSS
 * variables at runtime so there is a single source of truth.
 */
export const TOKEN_NAMES = ['cream', 'cream-deep', 'olive-ink', 'olive', 'olive-light', 'jade', 'jade-light'] as const
export type TokenName = (typeof TOKEN_NAMES)[number]

/** A token name, a hex string, 'white', or a mix: [a, b, amountOfB]. */
export type ColorRef = TokenName | 'white' | `#${string}` | readonly [ColorRef, ColorRef, number]

const FALLBACK: Record<TokenName, string> = {
  cream: '#F3EEDF',
  'cream-deep': '#E6DFC8',
  'olive-ink': '#232B17',
  olive: '#6B7A3A',
  'olive-light': '#A3AE72',
  jade: '#2E9E7A',
  'jade-light': '#9FD8C2',
}

let cache: Record<TokenName, string> | null = null

export function tokens(): Record<TokenName, string> {
  if (cache) return cache
  const style = typeof document !== 'undefined' ? getComputedStyle(document.documentElement) : null
  const out = {} as Record<TokenName, string>
  for (const name of TOKEN_NAMES) {
    out[name] = style?.getPropertyValue(`--${name}`).trim() || FALLBACK[name]
  }
  cache = out
  return out
}

const tmp = new Color()

/** Resolves a ColorRef into a (linear, working-space) THREE.Color. */
export function resolveColor(ref: ColorRef, target = new Color()): Color {
  if (Array.isArray(ref)) {
    const [a, b, t] = ref as readonly [ColorRef, ColorRef, number]
    resolveColor(a, target)
    return target.lerp(resolveColor(b, tmp.clone()), t)
  }
  const value = ref as string
  if (value === 'white') return target.set('#ffffff')
  if (value.startsWith('#')) return target.set(value)
  return target.set(tokens()[value as TokenName])
}

/** Writes a Color's sRGB components into an array-like (for custom shader uniforms). */
export function toSRGB(color: Color, out: { x: number; y: number; z: number }) {
  const rgb = { r: 0, g: 0, b: 0 }
  color.getRGB(rgb, SRGBColorSpace)
  out.x = rgb.r
  out.y = rgb.g
  out.z = rgb.b
  return out
}
