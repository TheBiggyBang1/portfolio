import { useFrame, useThree } from '@react-three/fiber'
import { useMemo } from 'react'
import { BufferAttribute, BufferGeometry, NormalBlending, ShaderMaterial } from 'three'
import { WORLD } from '../journey/config'
import { keyU, presence } from '../journey/curves'
import { journey } from '../journey/store'
import { resolveColor } from '../lib/palette'
import { glowTexture, mulberry32 } from '../lib/textures'
import { FOG_APPLY, FOG_PARS, fogUniforms, shared } from './shared'
import type { SceneProps } from './World'
import { useDispose } from './useDispose'

const KEY = keyU('hello')

/** Chapter 01: a pale dawn sun behind the logo and pollen drifting up from the cloud sea. */
export function HelloScene({ density }: SceneProps) {
  const dpr = useThree((s) => s.viewport.dpr)
  const count = Math.round(170 * density)

  const { geometry, material } = useMemo(() => {
    const rand = mulberry32(3)
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = WORLD.hello[0] + (rand() * 2 - 1) * 7
      pos[i * 3 + 1] = rand() * 5
      pos[i * 3 + 2] = WORLD.hello[2] - 1 + (rand() * 2 - 1) * 5
      seed[i] = rand()
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(pos, 3))
    geometry.setAttribute('aSeed', new BufferAttribute(seed, 1))

    const material = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      blending: NormalBlending,
      uniforms: {
        uTime: shared.uTime,
        uPresence: { value: 1 },
        uPixelRatio: { value: dpr },
        uMap: { value: glowTexture() },
        uA: { value: resolveColor('jade-light') },
        uB: { value: resolveColor('olive-light') },
        ...fogUniforms(),
      },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uTime;
        uniform float uPresence;
        uniform float uPixelRatio;
        varying float vSeed;
        varying float vAlpha;
        varying float vFogDepth;
        void main() {
          vec3 p = position;
          float h = mod(position.y + uTime * (0.07 + aSeed * 0.1), 5.0);
          p.y = h - 1.7;
          p.x += sin(uTime * 0.3 + aSeed * 30.0) * 0.35;
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          gl_PointSize = (18.0 + aSeed * 26.0) * uPixelRatio / -mv.z;
          vFogDepth = -mv.z;
          vSeed = aSeed;
          vAlpha = uPresence * smoothstep(0.0, 0.8, h) * (1.0 - smoothstep(4.0, 5.0, h)) * (0.35 + 0.45 * aSeed);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        uniform vec3 uA;
        uniform vec3 uB;
        varying float vSeed;
        varying float vAlpha;
        ${FOG_PARS}
        void main() {
          float a = texture2D(uMap, gl_PointCoord).a * vAlpha;
          if (a < 0.004) discard;
          gl_FragColor = vec4(mix(uA, uB, step(0.55, vSeed)), a);
          ${FOG_APPLY}
        }
      `,
    })
    return { geometry, material }
  }, [count, dpr])

  useDispose(geometry, material)

  const sunColor = useMemo(() => resolveColor(['cream', 'white', 0.6]), [])

  useFrame(() => {
    material.uniforms.uPresence.value = presence(journey.u, KEY)
  })

  return (
    <>
      <sprite position={[WORLD.hello[0] + 1.2, WORLD.hello[1] + 0.6, WORLD.hello[2] - 14]} scale={[16, 16, 1]} renderOrder={-1}>
        <spriteMaterial map={glowTexture()} color={sunColor} transparent depthWrite={false} opacity={0.75} fog={false} />
      </sprite>
      <points geometry={geometry} material={material} frustumCulled={false} renderOrder={6} />
    </>
  )
}
