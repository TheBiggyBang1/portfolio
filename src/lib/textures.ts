import { CanvasTexture, SRGBColorSpace, Texture } from 'three'

/**
 * All textures in the world are painted in code: no image downloads.
 * Each generator is memoized so scenes can share one GPU texture.
 */

const memo = new Map<string, Texture>()

function cached(key: string, make: () => Texture) {
  let tex = memo.get(key)
  if (!tex) {
    tex = make()
    memo.set(key, tex)
  }
  return tex
}

function canvas(size: number) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  return [c, c.getContext('2d')!] as const
}

/** Deterministic PRNG so clouds look identical on every load. */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A soft, lumpy cloud puff: many overlapping radial blobs. White, alpha-carrying. */
export function cloudTexture() {
  return cached('cloud', () => {
    const size = 256
    const [c, ctx] = canvas(size)
    const rand = mulberry32(7)
    ctx.clearRect(0, 0, size, size)
    for (let i = 0; i < 26; i++) {
      const a = rand() * Math.PI * 2
      const d = Math.sqrt(rand()) * size * 0.2
      const x = size / 2 + Math.cos(a) * d * 1.25
      const y = size / 2 + Math.sin(a) * d * 0.7 + size * 0.04
      const r = size * (0.12 + rand() * 0.16)
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, 'rgba(255,255,255,0.42)')
      g.addColorStop(0.55, 'rgba(255,255,255,0.18)')
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, size, size)
    }
    const tex = new CanvasTexture(c)
    tex.needsUpdate = true
    return tex
  })
}

/** Radial glow for halos and node flares. */
export function glowTexture() {
  return cached('glow', () => {
    const size = 128
    const [c, ctx] = canvas(size)
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.18, 'rgba(255,255,255,0.55)')
    g.addColorStop(0.5, 'rgba(255,255,255,0.12)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    const tex = new CanvasTexture(c)
    tex.colorSpace = SRGBColorSpace
    return tex
  })
}

/** Soft contact shadow blob. */
export function shadowTexture() {
  return cached('shadow', () => {
    const size = 128
    const [c, ctx] = canvas(size)
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    g.addColorStop(0, 'rgba(35,43,23,0.32)')
    g.addColorStop(0.45, 'rgba(35,43,23,0.12)')
    g.addColorStop(1, 'rgba(35,43,23,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, size, size)
    const tex = new CanvasTexture(c)
    tex.colorSpace = SRGBColorSpace
    return tex
  })
}
