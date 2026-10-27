import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  CatmullRomCurve3,
  Group,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  TorusGeometry,
  TubeGeometry,
  Vector3,
} from 'three'
import { keyU, logoCurve, presence, SEG, smoothstep, STUDIO_NODE_U } from '../journey/curves'
import { journey } from '../journey/store'
import { resolveColor } from '../lib/palette'
import { glowTexture } from '../lib/textures'
import { FOG_APPLY, FOG_PARS, fogUniforms, shared } from './shared'
import type { SceneProps } from './World'
import { useDispose } from './useDispose'

const KEY = keyU('studio')
const SATS_PER_NODE = 4
const dummy = new Object3D()
const local = new Vector3()

/**
 * Chapter 03: one gate per agent (script → visuals → voice → edit → publish),
 * placed on the logo's own path. Each gate lights jade as the logo flies through,
 * and the pipeline between them fills up behind it.
 */
export function StudioScene(_: SceneProps) {
  const gates = useRef<(Mesh | null)[]>([])
  const glows = useRef<(Sprite | null)[]>([])
  const sats = useRef<InstancedMesh>(null)
  const root = useRef<Group>(null)

  const nodes = useMemo(
    () => STUDIO_NODE_U.map((u) => ({ u, pos: logoCurve.getPoint(u), tan: logoCurve.getTangent(u) })),
    [],
  )

  const colors = useMemo(
    () => ({ dim: resolveColor('olive-light'), lit: resolveColor('jade'), glow: resolveColor('jade-light') }),
    [],
  )

  const pipe = useMemo(() => {
    const u0 = STUDIO_NODE_U[0] - 0.14 * SEG
    const u1 = STUDIO_NODE_U[STUDIO_NODE_U.length - 1] + 0.14 * SEG
    const pts = Array.from({ length: 48 }, (_, i) => logoCurve.getPoint(u0 + ((u1 - u0) * i) / 47))
    const geometry = new TubeGeometry(new CatmullRomCurve3(pts), 220, 0.022, 6, false)
    const material = new ShaderMaterial({
      transparent: true,
      toneMapped: false,
      uniforms: {
        uProgress: { value: 0 },
        uPresence: { value: 1 },
        uDim: { value: colors.dim },
        uLit: { value: colors.lit },
        uTime: shared.uTime,
        ...fogUniforms(),
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying float vFogDepth;
        void main() {
          vUv = uv;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vFogDepth = -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uProgress;
        uniform float uPresence;
        uniform vec3 uDim;
        uniform vec3 uLit;
        uniform float uTime;
        varying vec2 vUv;
        ${FOG_PARS}
        void main() {
          float lit = 1.0 - smoothstep(uProgress - 0.004, uProgress + 0.004, vUv.x);
          float packets = smoothstep(0.75, 1.0, 0.5 + 0.5 * sin(vUv.x * 140.0 - uTime * 5.0));
          vec3 col = mix(uDim, uLit, lit) + vec3(0.25) * lit * packets;
          gl_FragColor = vec4(col, uPresence * mix(0.5, 1.0, lit));
          ${FOG_APPLY}
        }
      `,
    })
    return { geometry, material, u0, u1 }
  }, [colors])

  const torus = useMemo(() => new TorusGeometry(1.3, 0.035, 12, 96), [])
  const gateMaterials = useMemo(
    () =>
      nodes.map(
        () => new MeshStandardMaterial({ color: colors.dim, emissive: colors.lit, roughness: 0.35, metalness: 0.1 }),
      ),
    [nodes, colors],
  )
  const satGeometry = useMemo(() => new SphereGeometry(0.07, 12, 8), [])
  const satMaterial = useMemo(() => new MeshStandardMaterial({ color: resolveColor('cream'), roughness: 0.4 }), [])

  useDispose(pipe.geometry, pipe.material, torus, gateMaterials, satGeometry, satMaterial)

  // Gates stand perpendicular to the path so the logo flies through them.
  useLayoutEffect(() => {
    nodes.forEach((n, i) => {
      const g = gates.current[i]
      if (!g) return
      g.position.copy(n.pos)
      g.lookAt(n.pos.clone().add(n.tan))
      glows.current[i]?.position.copy(n.pos)
    })
  }, [nodes])

  useFrame(() => {
    const u = journey.u
    const pres = presence(u, KEY)
    if (root.current) root.current.visible = pres > 0.001
    if (pres <= 0.001) return
    const t = journey.time

    pipe.material.uniforms.uProgress.value = Math.min(Math.max((u - pipe.u0) / (pipe.u1 - pipe.u0), 0), 1)
    pipe.material.uniforms.uPresence.value = pres

    nodes.forEach((n, i) => {
      const lit = smoothstep(n.u - 0.03 * SEG, n.u + 0.01 * SEG, u)
      const pulse = Math.exp(-(((u - n.u) / (0.06 * SEG)) ** 2))
      const m = gateMaterials[i]
      m.color.copy(colors.dim).lerp(colors.lit, lit)
      m.emissiveIntensity = lit * 0.55 + pulse * 1.3
      const g = gates.current[i]
      g?.scale.setScalar(pres * (1 + pulse * 0.12))
      const glow = glows.current[i]
      if (glow) {
        glow.material.opacity = (lit * 0.22 + pulse * 0.6) * pres
        glow.scale.setScalar(3.2 + pulse * 1.5)
      }
      // Little satellites orbit each gate: the agent's sub-tasks.
      if (sats.current && g) {
        for (let s = 0; s < SATS_PER_NODE; s++) {
          const a = t * (0.6 + lit * 0.9) + (s / SATS_PER_NODE) * Math.PI * 2 + i
          local.set(Math.cos(a) * 1.62, Math.sin(a) * 1.62, 0).applyQuaternion(g.quaternion).add(n.pos)
          dummy.position.copy(local)
          dummy.scale.setScalar(pres * (0.7 + lit * 0.5))
          dummy.updateMatrix()
          sats.current.setMatrixAt(i * SATS_PER_NODE + s, dummy.matrix)
        }
      }
    })
    if (sats.current) sats.current.instanceMatrix.needsUpdate = true
  })

  return (
    <group ref={root}>
      <mesh geometry={pipe.geometry} material={pipe.material} renderOrder={2} />
      {nodes.map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            gates.current[i] = el
          }}
          geometry={torus}
          material={gateMaterials[i]}
        />
      ))}
      {nodes.map((_, i) => (
        <sprite
          key={`g${i}`}
          ref={(el) => {
            glows.current[i] = el
          }}
          renderOrder={3}
        >
          <spriteMaterial map={glowTexture()} color={colors.glow} transparent depthWrite={false} opacity={0} />
        </sprite>
      ))}
      <instancedMesh
        ref={sats}
        args={[satGeometry, satMaterial, nodes.length * SATS_PER_NODE]}
        frustumCulled={false}
      />
    </group>
  )
}
