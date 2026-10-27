import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  DoubleSide,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  Vector3,
} from 'three'
import { KEYFRAMES } from '../journey/config'
import { keyIndex, keyU, logoCurve, presence } from '../journey/curves'
import { journey } from '../journey/store'
import { resolveColor } from '../lib/palette'
import { FOG_APPLY, FOG_PARS, fogUniforms, shared } from './shared'
import type { SceneProps } from './World'
import { useDispose } from './useDispose'

const KEY = keyU('vision')
const SPACING = 0.36

/**
 * Chapter 04: a stack of translucent CT-like slices on the logo's path,
 * drawn as calm contour maps with a jade scan line sweeping through them.
 */
export function VisionScene({ mobile }: SceneProps) {
  const mesh = useRef<InstancedMesh>(null)
  const count = mobile ? 9 : 12

  const slices = useMemo(() => {
    const e = 0.002
    const speed = logoCurve.getPoint(KEY + e).distanceTo(logoCurve.getPoint(KEY - e)) / (2 * e)
    const du = SPACING / speed
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), logoCurve.getTangent(KEY))
    const k = KEYFRAMES[keyIndex('vision')]
    const cam = new Vector3(...(mobile ? k.cameraMobile.position : k.camera.position))
    const list = Array.from({ length: count }, (_, i) => {
      const u = KEY + (i - (count - 1) / 2) * du
      return { u, index: i, pos: logoCurve.getPoint(u) }
    })
    // Far slices first: instances draw in order, so this keeps the transparency clean.
    list.sort((a, b) => b.pos.distanceTo(cam) - a.pos.distanceTo(cam))
    return { list, q, du }
  }, [count, mobile])

  const { geometry, material } = useMemo(() => {
    const geometry = new PlaneGeometry(2.9, 2.9)
    geometry.setAttribute(
      'aIndex',
      new InstancedBufferAttribute(new Float32Array(slices.list.map((s) => s.index)), 1),
    )
    geometry.setAttribute('aU', new InstancedBufferAttribute(new Float32Array(slices.list.map((s) => s.u)), 1))
    const material = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
      toneMapped: false,
      uniforms: {
        uTime: shared.uTime,
        uU: { value: 0 },
        uDu: { value: slices.du * 1.2 },
        uPresence: { value: 1 },
        uFill: { value: resolveColor('cream') },
        uInk: { value: resolveColor('olive') },
        uLine: { value: resolveColor('jade') },
        uScan: { value: resolveColor('jade-light') },
        ...fogUniforms(),
      },
      vertexShader: /* glsl */ `
        attribute float aIndex;
        attribute float aU;
        uniform float uU;
        uniform float uDu;
        varying vec2 vUv;
        varying float vIndex;
        varying float vHit;
        varying float vFogDepth;
        void main() {
          vUv = uv;
          vIndex = aIndex;
          vHit = exp(-pow((uU - aU) / uDu, 2.0));
          vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          vFogDepth = -mv.z;
          gl_Position = projectionMatrix * mv;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uPresence;
        uniform vec3 uFill;
        uniform vec3 uInk;
        uniform vec3 uLine;
        uniform vec3 uScan;
        varying vec2 vUv;
        varying float vIndex;
        varying float vHit;
        ${FOG_PARS}
        float sdRoundBox(vec2 p, vec2 b, float r) {
          vec2 q = abs(p) - b + r;
          return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
        }
        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          float d = sdRoundBox(p, vec2(0.96), 0.16);
          float inside = 1.0 - smoothstep(-0.006, 0.006, d);
          float edge = 1.0 - smoothstep(0.0, 0.012, abs(d));

          // Two soft lobes drawn as iso-lines; their size drifts from slice to slice.
          float k = 0.8 + 0.2 * sin(vIndex * 0.55);
          float l1 = length((p - vec2(-0.34, 0.04)) / (vec2(0.27, 0.45) * k));
          float l2 = length((p - vec2(0.34, 0.04)) / (vec2(0.27, 0.45) * k));
          float f = min(l1, l2);
          float iso = abs(fract(f * 3.5 - uTime * 0.04) - 0.5);
          float contour = (1.0 - smoothstep(0.03, 0.08, iso)) * (1.0 - smoothstep(0.85, 1.15, f));

          vec2 g = abs(fract(p * 5.0) - 0.5);
          float grid = 1.0 - smoothstep(0.0, 0.02, min(g.x, g.y));

          float scanY = mix(-1.15, 1.15, fract(uTime * 0.14 + vIndex * 0.035));
          float scan = exp(-pow((p.y - scanY) * 34.0, 2.0));
          float band = exp(-pow((p.y - scanY) * 5.0, 2.0));

          vec3 col = uFill;
          float a = inside * (0.1 + 0.16 * vHit);
          col = mix(col, uInk, inside * grid * 0.6);
          a += inside * grid * 0.05;
          col = mix(col, uLine, contour * inside);
          a += contour * inside * (0.2 + 0.45 * band + 0.3 * vHit);
          col = mix(col, uScan, scan * inside);
          a += scan * inside * 0.75;
          col = mix(col, uLine, edge);
          a += edge * (0.32 + 0.45 * vHit);

          gl_FragColor = vec4(col, clamp(a, 0.0, 1.0) * uPresence);
          ${FOG_APPLY}
        }
      `,
    })
    return { geometry, material }
  }, [slices])

  useDispose(geometry, material)

  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    const mat = new Matrix4()
    const one = new Vector3(1, 1, 1)
    slices.list.forEach((s, i) => m.setMatrixAt(i, mat.compose(s.pos, slices.q, one)))
    m.instanceMatrix.needsUpdate = true
  }, [slices])

  useFrame(() => {
    const pres = presence(journey.u, KEY)
    material.uniforms.uU.value = journey.u
    material.uniforms.uPresence.value = pres
    if (mesh.current) mesh.current.visible = pres > 0.001
  })

  return (
    <instancedMesh
      ref={mesh}
      args={[geometry, material, slices.list.length]}
      frustumCulled={false}
      renderOrder={4}
    />
  )
}
