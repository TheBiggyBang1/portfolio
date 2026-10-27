import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  BoxGeometry,
  Color,
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  TorusGeometry,
} from 'three'
import { KEYFRAMES, WORLD } from '../journey/config'
import { keyIndex, keyU, presence, SEG, smoothstep } from '../journey/curves'
import { journey } from '../journey/store'
import { resolveColor } from '../lib/palette'
import type { SceneProps } from './World'
import { useDispose } from './useDispose'

const KEY = keyU('voice')
const dummy = new Object3D()

/** Chapter 02: concentric rings of instanced bars pulsing like a speech spectrum. */
export function VoiceScene({ mobile, density }: SceneProps) {
  const group = useRef<Group>(null)
  const mesh = useRef<InstancedMesh>(null)

  const rings = useMemo(() => {
    const radii = mobile ? [1.55, 2.05, 2.55] : [1.55, 2.0, 2.45, 2.9]
    return radii.map((r) => ({ r, n: Math.max(24, Math.round(r * 34 * Math.max(density, 0.7))) }))
  }, [mobile, density])

  const bars = useMemo(() => {
    const list: { a: number; r: number; ring: number }[] = []
    rings.forEach(({ r, n }, ring) => {
      for (let i = 0; i < n; i++) list.push({ a: (i / n) * Math.PI * 2, r, ring })
    })
    return list
  }, [rings])

  const geometry = useMemo(() => new BoxGeometry(0.045, 1, 0.045).translate(0, 0.5, 0), [])
  const material = useMemo(() => new MeshStandardMaterial({ roughness: 0.45, metalness: 0 }), [])
  const ringGeometries = useMemo(() => rings.map(({ r }) => new TorusGeometry(r, 0.006, 6, 160)), [rings])
  const ringMaterial = useMemo(
    () => new MeshBasicMaterial({ color: resolveColor('olive'), transparent: true, opacity: 0.35 }),
    [],
  )
  useDispose(geometry, material, ringMaterial, ringGeometries)

  // Face the chapter's camera, tilted back like a turntable.
  useLayoutEffect(() => {
    const g = group.current
    if (!g) return
    const k = KEYFRAMES[keyIndex('voice')]
    const cam = mobile ? k.cameraMobile.position : k.camera.position
    g.position.set(...WORLD.voice)
    g.lookAt(cam[0], cam[1], cam[2])
    g.rotateX(-1.08)
  }, [mobile])

  // Ring gradient: olive-light → jade → jade-light.
  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    const stops = [resolveColor('olive-light'), resolveColor('jade'), resolveColor('jade-light')]
    const c = new Color()
    bars.forEach((b, i) => {
      const t = rings.length > 1 ? b.ring / (rings.length - 1) : 0
      if (t < 0.5) c.copy(stops[0]).lerp(stops[1], t * 2)
      else c.copy(stops[1]).lerp(stops[2], (t - 0.5) * 2)
      m.setColorAt(i, c)
    })
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [bars, rings])

  useFrame(() => {
    const m = mesh.current
    const g = group.current
    if (!m || !g) return
    const u = journey.u
    const pres = presence(u, KEY)
    g.visible = pres > 0.001
    if (!g.visible) return
    const act = 1 - smoothstep(0, 1.1 * SEG, Math.abs(u - KEY))
    const t = journey.time
    // A syllable-like envelope modulating a two-band "spectrum".
    const env = 0.55 + 0.45 * Math.sin(t * 2.7) * Math.sin(t * 1.1 + 0.6)
    for (let i = 0; i < bars.length; i++) {
      const { a, r, ring } = bars[i]
      const broad = 0.5 + 0.5 * Math.sin(a * 3 + t * 1.9 + ring * 1.3)
      const fine = 0.5 + 0.5 * Math.sin(a * 11 - t * 3.1 + ring * 2.3)
      const len = (0.06 + (0.08 + 0.5 * broad * fine * env) * (0.3 + 0.7 * act)) * pres
      dummy.position.set(Math.cos(a) * r, Math.sin(a) * r, 0)
      dummy.rotation.set(0, 0, a - Math.PI / 2)
      dummy.scale.set(pres, Math.max(len, 1e-4), pres)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
    ringMaterial.opacity = 0.35 * pres
  })

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[geometry, material, bars.length]} frustumCulled={false} />
      {ringGeometries.map((g, i) => (
        <mesh key={i} geometry={g} material={ringMaterial} />
      ))}
    </group>
  )
}
