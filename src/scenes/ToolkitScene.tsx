import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  Color,
  Euler,
  Group,
  InstancedMesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  Quaternion,
  TorusGeometry,
  Vector3,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { KEYFRAMES } from '../journey/config'
import { keyIndex, keyU, presence, SEG, smoothstep } from '../journey/curves'
import { journey } from '../journey/store'
import { resolveColor } from '../lib/palette'
import { mulberry32 } from '../lib/textures'
import type { SceneProps } from './World'
import { useDispose } from './useDispose'

const KEY = keyU('toolkit')
const DOCKS = [1.8, 2.3]
const dummy = new Object3D()
const orbit = new Vector3()
const slot = new Vector3()
const tumble = new Quaternion()
const euler = new Euler()

/** Overshooting ease: modules "click" into their sockets. */
const backOut = (t: number, s = 1.9) => 1 + (s + 1) * (t - 1) ** 3 + s * (t - 1) ** 2

/** Chapter 05: plugin modules orbit the logo, then snap into a dock around it. */
export function ToolkitScene({ mobile, density }: SceneProps) {
  const group = useRef<Group>(null)
  const mesh = useRef<InstancedMesh>(null)
  const count = Math.max(12, Math.round(24 * density))

  const modules = useMemo(() => {
    const rand = mulberry32(11)
    const inner = Math.round(count * 0.58)
    return Array.from({ length: count }, (_, i) => {
      const onInner = i < inner
      const n = onInner ? inner : count - inner
      const k = onInner ? i : i - inner
      const angle = (k / n) * Math.PI * 2 + (onInner ? 0 : Math.PI / n)
      const r = onInner ? DOCKS[0] : DOCKS[1]
      return {
        slot: new Vector3(Math.cos(angle) * r, Math.sin(angle) * r, 0),
        slotQuat: new Quaternion().setFromEuler(new Euler(0, 0, angle)),
        orbitR: 3.6 + rand() * 2.6,
        orbitSpeed: (0.25 + rand() * 0.35) * (rand() > 0.5 ? 1 : -1),
        tilt: new Quaternion().setFromEuler(new Euler(rand() * 1.2 - 0.6, 0, rand() * 1.2 - 0.6)),
        phase: rand() * Math.PI * 2,
        spin: 0.4 + rand() * 0.8,
        delay: (i / count) * 0.45,
        base: [resolveColor('cream-deep'), resolveColor('olive-light'), resolveColor('jade'), resolveColor('jade-light')][
          Math.floor(rand() * 4)
        ],
      }
    })
  }, [count])

  const geometry = useMemo(() => new RoundedBoxGeometry(0.34, 0.34, 0.34, 3, 0.07), [])
  const material = useMemo(() => new MeshStandardMaterial({ roughness: 0.35, metalness: 0 }), [])
  const dockGeometries = useMemo(() => DOCKS.map((r) => new TorusGeometry(r, 0.008, 6, 160)), [])
  const dockMaterial = useMemo(
    () => new MeshBasicMaterial({ color: resolveColor('jade'), transparent: true, opacity: 0 }),
    [],
  )
  useDispose(geometry, material, dockGeometries, dockMaterial)

  // The dock faces this chapter's camera.
  const facing = useMemo(() => {
    const k = KEYFRAMES[keyIndex('toolkit')]
    const cam = mobile ? k.cameraMobile.position : k.camera.position
    const o = new Object3D()
    o.position.set(...k.logo.position)
    o.lookAt(cam[0], cam[1], cam[2])
    return o.quaternion.clone()
  }, [mobile])

  useLayoutEffect(() => {
    group.current?.quaternion.copy(facing)
  }, [facing])

  // Create instanceColor before the shader is compiled (it changes the program).
  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    modules.forEach((mod, i) => m.setColorAt(i, mod.base))
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [modules])

  const lit = useMemo(() => resolveColor('jade-light'), [])
  const tmpColor = useMemo(() => new Color(), [])

  useFrame(() => {
    const g = group.current
    const m = mesh.current
    if (!g || !m) return
    const u = journey.u
    const pres = presence(u, KEY)
    g.visible = pres > 0.001
    if (!g.visible) return
    g.position.copy(journey.logoPosition)

    const act = smoothstep(KEY - 0.75 * SEG, KEY - 0.06 * SEG, u) * (1 - smoothstep(KEY + 0.4 * SEG, KEY + 0.9 * SEG, u))
    const t = journey.time
    let docked = 0

    modules.forEach((mod, i) => {
      const s = Math.min(Math.max((act - mod.delay) / 0.55, 0), 1)
      const e = backOut(s)
      const a = mod.phase + t * mod.orbitSpeed
      orbit.set(Math.cos(a) * mod.orbitR, Math.sin(a * 0.7) * 0.8, Math.sin(a) * mod.orbitR * 0.6).applyQuaternion(mod.tilt)
      slot.copy(mod.slot)
      dummy.position.copy(orbit).lerp(slot, e)
      euler.set(t * mod.spin + i, t * mod.spin * 0.7, 0)
      tumble.setFromEuler(euler)
      dummy.quaternion.copy(tumble).slerp(mod.slotQuat, Math.min(s * 1.2, 1))
      dummy.scale.setScalar(pres * (0.8 + 0.2 * Math.min(e, 1)))
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
      const connected = smoothstep(0.9, 1, s)
      docked += connected
      m.setColorAt(i, tmpColor.copy(mod.base).lerp(lit, connected * 0.45))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
    dockMaterial.opacity = (docked / modules.length) * 0.5 * pres
  })

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[geometry, material, modules.length]} frustumCulled={false} />
      {dockGeometries.map((dg, i) => (
        <mesh key={i} geometry={dg} material={dockMaterial} />
      ))}
    </group>
  )
}
