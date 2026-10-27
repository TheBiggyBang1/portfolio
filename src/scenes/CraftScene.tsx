import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  BufferGeometry,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
} from 'three'
import { WORLD } from '../journey/config'
import { keyU, presence } from '../journey/curves'
import { journey } from '../journey/store'
import { resolveColor, type ColorRef } from '../lib/palette'
import { shadowTexture } from '../lib/textures'
import type { SceneProps } from './World'
import { useDispose } from './useDispose'

const KEY = keyU('craft')

interface Piece {
  geometry: BufferGeometry
  color: ColorRef
  position: [number, number, number]
  rotation: [number, number, number]
  satin?: boolean
  flat?: boolean
}

/**
 * Chapter 07: a quiet studio of things made by hand. Faceted 3D-modeling
 * primitives in front, flat paper-cut shapes (graphic design) floating behind.
 */
export function CraftScene({ mobile }: SceneProps) {
  const root = useRef<Group>(null)
  const items = useRef<(Mesh | null)[]>([])
  const shadow = useRef<Mesh>(null)

  const pieces = useMemo<Piece[]>(() => {
    const side = mobile ? 0.7 : 1
    return [
      { geometry: new IcosahedronGeometry(0.55, 0), color: 'cream-deep', position: [2.9 * side, 1.3, -2.4], rotation: [0.3, 0.2, 0], flat: true },
      { geometry: new TorusGeometry(0.42, 0.15, 16, 48), color: 'olive-light', position: [0.9 * side, 2.3, -4.2], rotation: [0.9, 0.2, 0] },
      { geometry: new SphereGeometry(0.34, 32, 16), color: 'jade', position: [3.5 * side, -0.5, -1.2], rotation: [0, 0, 0], satin: true },
      { geometry: new ConeGeometry(0.34, 0.7, 5), color: 'olive', position: [1.2 * side, -1.35, -1.6], rotation: [0.2, 0, 0.3], flat: true },
      { geometry: new IcosahedronGeometry(0.28, 1), color: 'jade-light', position: [3.8 * side, 2.4, -5], rotation: [0, 0, 0], flat: true },
      // Paper cut-outs: graphic design as flat layers.
      { geometry: new CylinderGeometry(0.75, 0.75, 0.02, 48), color: ['jade-light', 'cream', 0.3], position: [4.4 * side, 1.4, -6.5], rotation: [Math.PI / 2, 0, 0] },
      { geometry: new CylinderGeometry(0.7, 0.7, 0.02, 3), color: 'olive-light', position: [-1.2 * side, 1.2, -9], rotation: [Math.PI / 2, 0, 0.4] },
      { geometry: new PlaneGeometry(1.1, 1.1), color: 'cream-deep', position: [2.2 * side, -0.4, -7.5], rotation: [0, 0, 0.25] },
    ]
  }, [mobile])

  const materials = useMemo<Material[]>(
    () =>
      pieces.map((p) =>
        p.satin
          ? new MeshPhysicalMaterial({ color: resolveColor(p.color), roughness: 0.35, sheen: 0.6, sheenColor: resolveColor('cream'), clearcoat: 0.4 })
          : new MeshStandardMaterial({ color: resolveColor(p.color), roughness: 0.6, flatShading: !!p.flat, side: DoubleSide }),
      ),
    [pieces],
  )

  const shadowGeometry = useMemo(() => new PlaneGeometry(1, 1), [])

  useDispose(
    pieces.map((p) => p.geometry),
    materials,
    shadowGeometry,
  )

  useFrame(() => {
    const pres = presence(journey.u, KEY)
    if (root.current) root.current.visible = pres > 0.001
    if (pres <= 0.001) return
    const t = journey.time
    pieces.forEach((p, i) => {
      const m = items.current[i]
      if (!m) return
      m.position.set(
        WORLD.craft[0] + p.position[0],
        WORLD.craft[1] + p.position[1] + Math.sin(t * 0.6 + i * 1.7) * 0.12,
        WORLD.craft[2] + p.position[2],
      )
      m.rotation.set(p.rotation[0] + t * 0.08 * (i % 2 ? 1 : -1), p.rotation[1] + t * 0.12, p.rotation[2])
      m.scale.setScalar(pres)
    })
    // Soft contact shadow under the resting logo.
    const s = shadow.current
    if (s) {
      const lp = journey.logoPosition
      s.position.set(lp.x, WORLD.craft[1] - 1.3, lp.z)
      const mat = s.material as MeshStandardMaterial
      mat.opacity = pres * (1 - journey.endBlend) * 0.9
      s.scale.set(2.6, 1.1, 1)
    }
  })

  return (
    <group ref={root}>
      {pieces.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => {
            items.current[i] = el
          }}
          geometry={p.geometry}
          material={materials[i]}
        />
      ))}
      <mesh ref={shadow} geometry={shadowGeometry} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <meshBasicMaterial map={shadowTexture()} transparent depthWrite={false} opacity={0} />
      </mesh>
    </group>
  )
}
