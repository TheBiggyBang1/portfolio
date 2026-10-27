import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  Box3,
  Euler,
  FrontSide,
  Group,
  MathUtils,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Quaternion,
  Sprite,
  Texture,
  Vector3,
} from 'three'
import { LOGO_WIDTH, MOTION } from '../journey/config'
import { journey } from '../journey/store'
import { resolveColor } from '../lib/palette'
import { glowTexture } from '../lib/textures'
import { useDispose } from './useDispose'

const MODEL_URL = '/logo.glb'
/** The GLB lies flat (Blender export): stand it up so it faces +Z. */
const MODEL_ROTATION: [number, number, number] = [Math.PI / 2, 0, 0]
/** Camera distance at which the logo lands on the footer logo. */
const REST_DISTANCE = 6

const idleEuler = new Euler()
const idleQuat = new Quaternion()
const restPos = new Vector3()
const ray = new Vector3()
const forward = new Vector3()
const corner = new Vector3()

/**
 * Satin / pearlescent jade: the GLB's jade texture under a physical material
 * with sheen (satin), iridescence (pearl), clearcoat and a cream fresnel rim.
 */
function createLogoMaterial(map: Texture | null, roughnessMap: Texture | null) {
  const material = new MeshPhysicalMaterial({
    map,
    roughnessMap,
    roughness: 0.85,
    metalness: 0,
    clearcoat: 0.4,
    clearcoatRoughness: 0.14,
    sheen: 0.7,
    sheenRoughness: 0.42,
    sheenColor: resolveColor('cream'),
    iridescence: 0.32,
    iridescenceIOR: 1.32,
    iridescenceThicknessRange: [140, 420],
    envMapIntensity: 1.05,
    side: FrontSide,
    // Always in the transparent pass: toggling this would recompile the shader mid-scroll.
    transparent: true,
  })
  const rim = {
    uRimColor: { value: resolveColor('cream') },
    uRimIntensity: { value: 0.5 },
    uRimPower: { value: 2.6 },
  }
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, rim)
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform vec3 uRimColor;\nuniform float uRimIntensity;\nuniform float uRimPower;',
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float rimF = pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), uRimPower);
        totalEmissiveRadiance += uRimColor * rimF * uRimIntensity;`,
      )
  }
  material.customProgramCacheKey = () => 'logo-satin-rim'
  return material
}

export function Logo() {
  const gltf = useGLTF(MODEL_URL)
  const { camera, size } = useThree()
  const group = useRef<Group>(null)
  const flatten = useRef<Group>(null)
  const meshRef = useRef<Mesh>(null)
  const halo = useRef<Sprite>(null)
  const restEl = useRef<HTMLElement | null>(null)

  const { geometry, map, roughnessMap, normScale, box } = useMemo(() => {
    let mesh: Mesh | undefined
    gltf.scene.traverse((o) => {
      if (!mesh && (o as Mesh).isMesh) mesh = o as Mesh
    })
    if (!mesh) throw new Error('logo.glb has no mesh')
    const geo = mesh.geometry
    geo.computeBoundingBox()
    const box = geo.boundingBox!.clone() as Box3
    const src = mesh.material as MeshStandardMaterial
    return {
      geometry: geo,
      map: src.map,
      roughnessMap: src.roughnessMap,
      normScale: LOGO_WIDTH / (box.max.x - box.min.x),
      box,
    }
  }, [gltf])

  const material = useMemo(() => createLogoMaterial(map, roughnessMap), [map, roughnessMap])
  useDispose(material)

  // Upload the textures now, not on the first visible frame (avoids a hitch at fade-in).
  const gl = useThree((s) => s.gl)
  useLayoutEffect(() => {
    if (map) gl.initTexture(map)
    if (roughnessMap) gl.initTexture(roughnessMap)
  }, [gl, map, roughnessMap])

  const haloColor = useMemo(() => resolveColor('jade-light'), [])

  useFrame(() => {
    const g = group.current
    const mesh = meshRef.current
    if (!g || !mesh || !flatten.current) return
    const s = journey.sample
    const t = journey.time
    const live = journey.reduced ? 0 : journey.intro

    // Keyframed pose + idle float + rise out of the clouds.
    g.position.copy(s.logoPos)
    g.position.y += Math.sin(t * MOTION.floatSpeed) * MOTION.floatAmplitude * live
    if (!journey.reduced) g.position.y -= (1 - journey.intro) * 0.6

    idleEuler.set(
      Math.sin(t * 0.5) * 0.04 * live + journey.pointer.y * MOTION.tilt.x,
      Math.sin(t * 0.33) * MOTION.idleSway * live + journey.pointer.x * MOTION.tilt.y,
      0,
    )
    idleQuat.setFromEuler(idleEuler)
    g.quaternion.copy(s.logoQuat).multiply(idleQuat)
    let scale = s.logoScale

    // Final frames: fly onto the 2D footer logo, flatten, then crossfade.
    const eb = journey.endBlend
    if (eb > 0.0001) {
      restEl.current ??= document.querySelector<HTMLElement>('[data-logo-rest]')
      const el = restEl.current
      if (el) {
        const r = el.getBoundingClientRect()
        const ndcX = ((r.left + r.width / 2) / size.width) * 2 - 1
        const ndcY = -(((r.top + r.height / 2) / size.height) * 2 - 1)
        ray.set(ndcX, ndcY, 0.5).unproject(camera).sub(camera.position).normalize()
        camera.getWorldDirection(forward)
        restPos.copy(camera.position).addScaledVector(ray, REST_DISTANCE / ray.dot(forward))
        const fov = MathUtils.degToRad((camera as PerspectiveCamera).fov)
        const worldPerPx = (2 * REST_DISTANCE * Math.tan(fov / 2)) / size.height
        const restScale = (r.width * worldPerPx) / LOGO_WIDTH
        g.position.lerp(restPos, eb)
        g.quaternion.slerp(camera.quaternion, eb)
        scale = MathUtils.lerp(scale, restScale, eb)
      }
    }
    g.scale.setScalar(scale)
    flatten.current.scale.z = 1 - 0.88 * eb

    // Look.
    const opacity = journey.logoOpacity * (1 - journey.endFade)
    material.opacity = opacity
    g.visible = opacity > 0.002
    material.color.copy(s.tint)
    material.emissive.copy(s.emissive)
    material.emissiveIntensity = s.emissiveIntensity

    if (halo.current) {
      halo.current.position.copy(g.position)
      halo.current.scale.setScalar(1.2 + s.glow * 4.2)
      halo.current.material.opacity = s.glow * 0.85 * opacity
      halo.current.visible = s.glow * opacity > 0.01
    }
    journey.logoPosition.copy(g.position)
    journey.logoGlow = s.glow * opacity

    // Screen-space rect of the logo for the preloader hand-off.
    mesh.updateWorldMatrix(true, false)
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (let i = 0; i < 8; i++) {
      corner
        .set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z)
        .applyMatrix4(mesh.matrixWorld)
        .project(camera)
      const x = ((corner.x + 1) / 2) * size.width
      const y = ((1 - corner.y) / 2) * size.height
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
    journey.logoScreen.x = (minX + maxX) / 2
    journey.logoScreen.y = (minY + maxY) / 2
    journey.logoScreen.w = maxX - minX
    journey.logoScreen.h = maxY - minY
  }, -1)

  return (
    <>
      <group ref={group}>
        <group ref={flatten}>
          <mesh
            ref={meshRef}
            geometry={geometry}
            material={material}
            rotation={MODEL_ROTATION}
            scale={normScale}
            renderOrder={1}
          />
        </group>
      </group>
      <sprite ref={halo} renderOrder={20}>
        <spriteMaterial
          map={glowTexture()}
          color={haloColor}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
          opacity={0}
        />
      </sprite>
    </>
  )
}

/**
 * The logo's glow light. Lives outside the hidden warm-up group: a light that
 * appears later would change the light count and recompile every lit shader.
 */
export function LogoLight() {
  const light = useRef<PointLight>(null)
  const color = useMemo(() => resolveColor('jade-light'), [])
  useFrame(() => {
    if (!light.current) return
    light.current.position.copy(journey.logoPosition)
    light.current.intensity = journey.logoGlow * 60
  })
  return <pointLight ref={light} color={color} intensity={0} distance={40} decay={2} />
}

useGLTF.preload(MODEL_URL)
