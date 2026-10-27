import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  LineBasicMaterial,
  Matrix4,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  Quaternion,
  Vector3,
} from 'three'
import { WORLD } from '../journey/config'
import { keyU, presence } from '../journey/curves'
import { journey } from '../journey/store'
import { resolveColor } from '../lib/palette'
import { mulberry32 } from '../lib/textures'
import { shared } from './shared'
import type { SceneProps } from './World'
import { useDispose } from './useDispose'

const KEY = keyU('mindset')
const C = new Vector3(...WORLD.mindset)

/**
 * Chapter 06: the camera pulls far back at dusk. The logo is one glowing point
 * in a vast constellation above a faceted landscape of instanced shapes.
 */
export function MindsetScene({ density }: SceneProps) {
  const stars = useRef<InstancedMesh>(null)
  const land = useRef<InstancedMesh>(null)
  const landGroup = useRef<Group>(null)
  const root = useRef<Group>(null)

  const starCount = Math.round(900 * density)
  const gx = Math.round(64 * Math.sqrt(density))
  const gz = Math.round(40 * Math.sqrt(density))

  const starData = useMemo(() => {
    const rand = mulberry32(21)
    const list: { p: Vector3; s: number }[] = []
    while (list.length < starCount) {
      // Kept well behind the camera's resting spot so no star sits against the lens.
      const p = new Vector3((rand() * 2 - 1) * 48, -2 + rand() * 26, -45 + rand() * 55).add(C)
      if (p.distanceTo(C) < 4) continue
      list.push({ p, s: 0.05 + Math.pow(rand(), 3) * 0.16 })
    }
    return list
  }, [starCount])

  const starGeometry = useMemo(() => {
    const g = new OctahedronGeometry(1, 0)
    const rand = mulberry32(5)
    const seeds = new Float32Array(starData.length)
    starData.forEach((_, i) => (seeds[i] = rand()))
    g.setAttribute('aSeed', new InstancedBufferAttribute(seeds, 1))
    return g
  }, [starData])

  const starMaterial = useMemo(() => {
    const m = new MeshBasicMaterial({ toneMapped: false })
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = shared.uTime
      shader.uniforms.uPresence = presenceUniform
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float aSeed;\nuniform float uTime;\nuniform float uPresence;')
        .replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\ntransformed *= uPresence * (0.7 + 0.3 * sin(uTime * 1.6 + aSeed * 40.0));',
        )
    }
    m.customProgramCacheKey = () => 'mindset-stars'
    return m
  }, [])

  // Constellation lines between near neighbours.
  const lines = useMemo(() => {
    const subset = starData.slice(0, Math.round(starData.length * 0.28))
    const pos: number[] = []
    subset.forEach((a, i) => {
      const near = subset
        .map((b, j) => ({ j, d: a.p.distanceTo(b.p) }))
        .filter((x) => x.j > i && x.d < 9)
        .sort((x, y) => x.d - y.d)
        .slice(0, 2)
      near.forEach(({ j }) => pos.push(a.p.x, a.p.y, a.p.z, subset[j].p.x, subset[j].p.y, subset[j].p.z))
    })
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(pos), 3))
    return geometry
  }, [starData])
  const lineMaterial = useMemo(
    () => new LineBasicMaterial({ color: resolveColor('jade-light'), transparent: true, opacity: 0.2, toneMapped: false }),
    [],
  )

  const coneGeometry = useMemo(() => new ConeGeometry(0.24, 1, 4).translate(0, 0.5, 0), [])
  const landMaterial = useMemo(() => new MeshStandardMaterial({ roughness: 0.9, flatShading: true }), [])

  useDispose(starGeometry, starMaterial, lines, lineMaterial, coneGeometry, landMaterial)

  useLayoutEffect(() => {
    const s = stars.current
    if (s) {
      const m = new Matrix4()
      const q = new Quaternion()
      const palette = [resolveColor('cream'), resolveColor('jade-light'), resolveColor('olive-light')]
      starData.forEach((d, i) => {
        s.setMatrixAt(i, m.compose(d.p, q, new Vector3(d.s, d.s, d.s)))
        s.setColorAt(i, palette[i % 3])
      })
      s.instanceMatrix.needsUpdate = true
      if (s.instanceColor) s.instanceColor.needsUpdate = true
    }
    const l = land.current
    if (l) {
      const m = new Matrix4()
      const q = new Quaternion()
      const low = resolveColor(['olive-ink', 'olive', 0.2])
      const high = resolveColor(['olive', 'olive-light', 0.35])
      const c = new Color()
      let i = 0
      for (let x = 0; x < gx; x++) {
        for (let z = 0; z < gz; z++) {
          const px = (x / (gx - 1) - 0.5) * 100
          const pz = (z / (gz - 1) - 0.5) * 44
          const h = 0.5 + 0.5 * (Math.sin(px * 0.11) * Math.cos(pz * 0.17) * 0.6 + Math.sin(px * 0.045 + pz * 0.08) * 0.4)
          const y = h * 2.4
          const height = 0.15 + h * 0.85
          l.setMatrixAt(i, m.compose(new Vector3(C.x + px, C.y - 12 + y, C.z - 6 + pz), q, new Vector3(1, height, 1)))
          l.setColorAt(i, c.copy(low).lerp(high, h))
          i++
        }
      }
      l.instanceMatrix.needsUpdate = true
      if (l.instanceColor) l.instanceColor.needsUpdate = true
    }
  }, [starData, gx, gz])

  useFrame(() => {
    const pres = presence(journey.u, KEY)
    presenceUniform.value = pres
    if (root.current) root.current.visible = pres > 0.001
    lineMaterial.opacity = 0.2 * pres
    // The landscape rises out of the dusk as the chapter approaches.
    if (landGroup.current) landGroup.current.position.y = -7 * (1 - pres)
  })

  return (
    <group ref={root}>
      <instancedMesh ref={stars} args={[starGeometry, starMaterial, starData.length]} frustumCulled={false} />
      <lineSegments geometry={lines} material={lineMaterial} frustumCulled={false} />
      <group ref={landGroup}>
        <instancedMesh ref={land} args={[coneGeometry, landMaterial, gx * gz]} frustumCulled={false} />
      </group>
    </group>
  )
}

const presenceUniform = { value: 1 }
