import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import { BackSide, Color, Mesh, ShaderMaterial, Vector3 } from 'three'
import { journey } from '../journey/store'
import { resolveColor } from '../lib/palette'
import { useDispose } from './useDispose'

/** A camera-following gradient dome. Its bottom color is also the fog color. */
export function Sky() {
  const mesh = useRef<Mesh>(null)
  const material = useMemo(
    () =>
      new ShaderMaterial({
        side: BackSide,
        depthWrite: false,
        toneMapped: false,
        uniforms: {
          uTop: { value: new Color() },
          uBottom: { value: new Color() },
          uGlow: { value: resolveColor('cream') },
          uGlowDir: { value: new Vector3(0.45, 0.35, -0.8).normalize() },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vDir = wp.xyz - cameraPosition;
            gl_Position = projectionMatrix * viewMatrix * wp;
            gl_Position.z = gl_Position.w;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uTop;
          uniform vec3 uBottom;
          uniform vec3 uGlow;
          uniform vec3 uGlowDir;
          varying vec3 vDir;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
          void main() {
            vec3 d = normalize(vDir);
            float t = smoothstep(0.0, 0.6, d.y);
            vec3 col = mix(uBottom, uTop, t);
            col += uGlow * pow(max(dot(d, uGlowDir), 0.0), 8.0) * 0.08;
            gl_FragColor = vec4(col, 1.0);
            #include <colorspace_fragment>
            gl_FragColor.rgb += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
          }
        `,
      }),
    [],
  )
  useDispose(material)

  useFrame(({ camera }) => {
    mesh.current?.position.copy(camera.position)
    material.uniforms.uTop.value.copy(journey.sample.skyTop)
    material.uniforms.uBottom.value.copy(journey.sample.skyBottom)
  })

  return (
    <mesh ref={mesh} material={material} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[400, 32, 16]} />
    </mesh>
  )
}
