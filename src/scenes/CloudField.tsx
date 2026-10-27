import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import {
  Color,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  PlaneGeometry,
  ShaderMaterial,
  Vector3,
} from 'three'
import { CLOUDS } from '../journey/config'
import { keyU, presence } from '../journey/curves'
import { journey } from '../journey/store'
import { resolveColor } from '../lib/palette'
import { cloudTexture, mulberry32 } from '../lib/textures'
import { FOG_APPLY, FOG_PARS, fogUniforms, shared } from './shared'
import { useDispose } from './useDispose'

interface Puff {
  pos: Vector3
  scale: number
  color: Color
  opacity: number
  rot: number
  seed: number
  cluster: number
}

/**
 * Every cloud in the world in one draw call: camera-facing billboards painted
 * with a code-generated puff texture, sorted back-to-front every few frames.
 */
export function CloudField({ density = 1 }: { density?: number }) {
  const puffs = useMemo(() => {
    const rand = mulberry32(42)
    const list: Puff[] = []
    CLOUDS.forEach((c, cluster) => {
      const color = resolveColor(c.color)
      const count = Math.max(4, Math.round(c.count * density))
      for (let i = 0; i < count; i++) {
        list.push({
          pos: new Vector3(
            c.center[0] + (rand() * 2 - 1) * c.size[0],
            c.center[1] + (rand() * 2 - 1) * c.size[1],
            c.center[2] + (rand() * 2 - 1) * c.size[2],
          ),
          scale: c.scale[0] + rand() * (c.scale[1] - c.scale[0]),
          color: color.clone().multiplyScalar(0.94 + rand() * 0.08),
          opacity: c.opacity * (0.6 + rand() * 0.4),
          rot: rand() * Math.PI * 2,
          seed: rand(),
          cluster,
        })
      }
    })
    return list
  }, [density])

  const { geometry, material, attrs } = useMemo(() => {
    const n = puffs.length
    const base = new PlaneGeometry(1, 1)
    const geometry = new InstancedBufferGeometry()
    geometry.index = base.index
    geometry.setAttribute('position', base.getAttribute('position'))
    geometry.setAttribute('uv', base.getAttribute('uv'))
    const attrs = {
      offset: new InstancedBufferAttribute(new Float32Array(n * 3), 3),
      scale: new InstancedBufferAttribute(new Float32Array(n), 1),
      color: new InstancedBufferAttribute(new Float32Array(n * 3), 3),
      opacity: new InstancedBufferAttribute(new Float32Array(n), 1),
      rot: new InstancedBufferAttribute(new Float32Array(n), 1),
      seed: new InstancedBufferAttribute(new Float32Array(n), 1),
      cluster: new InstancedBufferAttribute(new Float32Array(n), 1),
    }
    geometry.setAttribute('iOffset', attrs.offset)
    geometry.setAttribute('iScale', attrs.scale)
    geometry.setAttribute('iColor', attrs.color)
    geometry.setAttribute('iOpacity', attrs.opacity)
    geometry.setAttribute('iRot', attrs.rot)
    geometry.setAttribute('iSeed', attrs.seed)
    geometry.setAttribute('iCluster', attrs.cluster)
    geometry.instanceCount = n

    const material = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      defines: { CLUSTERS: CLOUDS.length },
      uniforms: {
        uMap: { value: cloudTexture() },
        uTime: shared.uTime,
        uFade: { value: CLOUDS.map(() => 1) },
        ...fogUniforms(),
      },
      vertexShader: /* glsl */ `
        attribute vec3 iOffset;
        attribute float iScale;
        attribute vec3 iColor;
        attribute float iOpacity;
        attribute float iRot;
        attribute float iSeed;
        attribute float iCluster;
        uniform float uTime;
        uniform float uFade[CLUSTERS];
        varying vec2 vUv;
        varying vec3 vColor;
        varying float vOpacity;
        varying float vFogDepth;
        void main() {
          vec3 world = iOffset + vec3(sin(uTime * 0.05 + iSeed * 6.28) * 0.7, sin(uTime * 0.09 + iSeed * 12.0) * 0.12, 0.0);
          vec4 mv = viewMatrix * vec4(world, 1.0);
          float c = cos(iRot);
          float s = sin(iRot);
          mv.xy += mat2(c, -s, s, c) * position.xy * iScale;
          gl_Position = projectionMatrix * mv;
          vUv = uv;
          vColor = iColor;
          vFogDepth = -mv.z;
          // Fade puffs that get too close so the camera glides through them softly.
          vOpacity = iOpacity * smoothstep(0.8, 4.0, -mv.z) * uFade[int(iCluster + 0.5)];
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D uMap;
        varying vec2 vUv;
        varying vec3 vColor;
        varying float vOpacity;
        ${FOG_PARS}
        void main() {
          float a = texture2D(uMap, vUv).a * vOpacity;
          if (a < 0.004) discard;
          // Sunlit tops, olive-tinted undersides: reads as volume against a cream sky.
          vec3 shade = vColor * vec3(0.8, 0.83, 0.74);
          float lum = dot(vColor, vec3(0.2126, 0.7152, 0.0722));
          vec3 light = mix(vColor, vec3(1.0, 0.995, 0.97), 0.6 * smoothstep(0.1, 0.7, lum));
          vec3 col = mix(shade, light, smoothstep(0.25, 0.75, vUv.y));
          gl_FragColor = vec4(col, a);
          ${FOG_APPLY}
        }
      `,
    })
    base.dispose()
    return { geometry, material, attrs }
  }, [puffs])

  useDispose(geometry, material)

  // Back-to-front sort so overlapping puffs blend cleanly.
  const order = useMemo(() => puffs.map((_, i) => i), [puffs])
  const depth = useMemo(() => new Float32Array(puffs.length), [puffs])
  const dir = useMemo(() => new Vector3(), [])
  const frame = useRef(0)

  useFrame(({ camera }) => {
    // Chapter-bound clusters only show while the journey is near their chapter.
    const fade = material.uniforms.uFade.value as number[]
    CLOUDS.forEach((c, i) => (fade[i] = c.near ? presence(journey.u, keyU(c.near), 0.6, 1.0) : 1))

    if (frame.current++ % 4 !== 0) return
    camera.getWorldDirection(dir)
    for (let i = 0; i < puffs.length; i++) {
      const p = puffs[i].pos
      depth[i] = (p.x - camera.position.x) * dir.x + (p.y - camera.position.y) * dir.y + (p.z - camera.position.z) * dir.z
    }
    order.sort((a, b) => depth[b] - depth[a])
    for (let k = 0; k < order.length; k++) {
      const p = puffs[order[k]]
      attrs.offset.setXYZ(k, p.pos.x, p.pos.y, p.pos.z)
      attrs.scale.setX(k, p.scale)
      attrs.color.setXYZ(k, p.color.r, p.color.g, p.color.b)
      attrs.opacity.setX(k, p.opacity)
      attrs.rot.setX(k, p.rot)
      attrs.seed.setX(k, p.seed)
      attrs.cluster.setX(k, p.cluster)
    }
    for (const a of Object.values(attrs)) a.needsUpdate = true
  })

  return <mesh geometry={geometry} material={material} frustumCulled={false} renderOrder={5} />
}
