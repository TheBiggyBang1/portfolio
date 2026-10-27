import { Environment, Lightformer, PerformanceMonitor, useProgress } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Suspense,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react'
import { DirectionalLight, Fog, Group, HemisphereLight, MathUtils, NeutralToneMapping, PerspectiveCamera } from 'three'
import { KEYFRAMES, MOTION } from '../journey/config'
import { createSampler, KEY_COUNT, keyIndex, progressToU, SEG, smoothstep, transitionFraction } from '../journey/curves'
import { journey, segmentOf, useJourney } from '../journey/store'
import { quality, useIsMobile, useReducedMotion } from '../lib/device'
import { resolveColor, toSRGB } from '../lib/palette'
import { CloudField } from './CloudField'
import { compileSafely } from './compile'
import { CraftScene } from './CraftScene'
import { HelloScene } from './HelloScene'
import { Logo, LogoLight } from './Logo'
import { MindsetScene } from './MindsetScene'
import { shared } from './shared'
import { Sky } from './Sky'
import { StudioScene } from './StudioScene'
import { ToolkitScene } from './ToolkitScene'
import { VisionScene } from './VisionScene'
import { VoiceScene } from './VoiceScene'

export interface SceneProps {
  mobile: boolean
  density: number
}

/** Chapter worlds, mounted only while the journey is near them. */
const WORLDS: { id: string; Scene: ComponentType<SceneProps> }[] = [
  { id: 'hello', Scene: HelloScene },
  { id: 'voice', Scene: VoiceScene },
  { id: 'studio', Scene: StudioScene },
  { id: 'vision', Scene: VisionScene },
  { id: 'toolkit', Scene: ToolkitScene },
  { id: 'mindset', Scene: MindsetScene },
  { id: 'craft', Scene: CraftScene },
]
const MOUNT_RANGE = 1.35
const UNMOUNT_RANGE = 1.7

function nearestKey(progress: number, anchors: [number, number][]) {
  const dist = ([start, end]: [number, number]) => (progress < start ? start - progress : progress > end ? progress - end : 0)
  let best = 0
  for (let i = 1; i < anchors.length; i++) {
    if (dist(anchors[i]) < dist(anchors[best])) best = i
  }
  return best
}

/** Scroll → journey time → splines → camera, sky and fog. Runs first every frame. */
function JourneyDriver({ mobile, reduced }: { mobile: boolean; reduced: boolean }) {
  const { camera, scene, invalidate, gl } = useThree()
  const sampler = useMemo(() => createSampler(mobile), [mobile])
  const shownKey = useRef(-1)
  const snappedU = useRef(0)

  useEffect(() => {
    journey.mobile = mobile
    journey.reduced = reduced
  }, [mobile, reduced])

  useEffect(() => {
    scene.fog = new Fog(0xf3eedf, 8, 40)
    return () => {
      scene.fog = null
    }
  }, [scene])

  // Cursor parallax (desktop, full-motion only).
  useEffect(() => {
    const p = journey.pointer
    if (mobile || reduced) {
      p.tx = p.ty = p.x = p.y = 0
      return
    }
    const onMove = (e: PointerEvent) => {
      p.tx = (e.clientX / window.innerWidth) * 2 - 1
      p.ty = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [mobile, reduced])

  // Reduced motion: render on demand and cut between static chapter frames with a fade.
  useEffect(() => {
    if (!reduced) return
    const canvas = gl.domElement
    canvas.style.transition = 'opacity 280ms ease'
    let raf = 0
    let timer = 0
    let last = ''
    const loop = () => {
      const target = nearestKey(journey.progress, journey.anchors)
      if (target !== shownKey.current && !timer) {
        if (shownKey.current < 0) {
          shownKey.current = target
          snappedU.current = target * SEG
          invalidate()
        } else {
          canvas.style.opacity = '0'
          timer = window.setTimeout(() => {
            shownKey.current = target
            snappedU.current = target * SEG
            canvas.style.opacity = '1'
            timer = 0
            invalidate()
          }, 300)
        }
      }
      const sig = `${journey.logoOpacity.toFixed(3)}|${journey.ready}`
      if (sig !== last || !journey.ready) {
        last = sig
        invalidate()
      }
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      canvas.style.transition = ''
      canvas.style.opacity = ''
      shownKey.current = -1
    }
  }, [reduced, gl, invalidate])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 20)
    if (!reduced) journey.time += dt
    shared.uTime.value = journey.time

    const p = journey.pointer
    p.x = MathUtils.damp(p.x, p.tx, 3.5, dt)
    p.y = MathUtils.damp(p.y, p.ty, 3.5, dt)

    const u = reduced ? snappedU.current : progressToU(journey.progress, journey.anchors)
    journey.u = u
    const s = sampler.sample(u, journey.sample)

    if (reduced) {
      const atEnd = shownKey.current === KEY_COUNT - 1
      journey.endBlend = journey.endFade = atEnd ? 1 : 0
    } else {
      // Progress through the final transition (gallery → rest), 0..1.
      const last = MathUtils.clamp((u - (1 - SEG)) / SEG, 0, 1)
      journey.endBlend = smoothstep(MOTION.landing.blendFrom, 1, last)
      journey.endFade = smoothstep(MOTION.landing.fadeFrom, 1, last)
    }

    // Keep the desktop composition (text left, logo right) at any window shape:
    // narrower windows dolly back so horizontal framing matches the design aspect.
    const cam = camera as PerspectiveCamera
    const dolly = mobile ? 1 : MathUtils.clamp(MOTION.designAspect / cam.aspect, 0.9, 1.7)
    // The lens breathes open mid-transition, then settles at each stop.
    const kick = reduced ? 0 : Math.sin(Math.PI * transitionFraction(u)) * MOTION.fovKick
    const fov = (mobile ? MOTION.fov.mobile : MOTION.fov.desktop) + kick
    if (Math.abs(cam.fov - fov) > 1e-3) {
      cam.fov = fov
      cam.updateProjectionMatrix()
    }
    camera.position.copy(s.camPos).sub(s.camTarget).multiplyScalar(dolly).add(s.camTarget)
    camera.lookAt(s.camTarget)
    if (!mobile && !reduced) {
      camera.translateX(p.x * MOTION.cameraParallax)
      camera.translateY(-p.y * MOTION.cameraParallax * 0.6)
      camera.lookAt(s.camTarget)
    }

    const fog = scene.fog as Fog | null
    if (fog) {
      fog.color.copy(s.skyBottom)
      fog.near = s.fogNear
      fog.far = s.fogFar
    }
    toSRGB(s.skyBottom, shared.uFogColor.value)
    shared.uFogNear.value = s.fogNear
    shared.uFogFar.value = s.fogFar
  }, -2)

  return null
}

/** Soft daylight that dims into dusk with the sky. */
function Lights() {
  const hemi = useRef<HemisphereLight>(null)
  const key = useRef<DirectionalLight>(null)
  const colors = useMemo(
    () => ({
      sky: resolveColor('cream'),
      ground: resolveColor('olive-light'),
      key: resolveColor(['cream', 'white', 0.5]),
    }),
    [],
  )
  useFrame(() => {
    const c = journey.sample.skyTop
    const lum = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b
    const k = 0.3 + 0.7 * smoothstep(0.02, 0.6, lum)
    if (hemi.current) hemi.current.intensity = 1.15 * k
    if (key.current) key.current.intensity = 2.1 * k
  })
  return (
    <>
      <hemisphereLight ref={hemi} args={[colors.sky, colors.ground, 1.15]} />
      <directionalLight ref={key} position={[4, 7, 5]} color={colors.key} intensity={2.1} />
    </>
  )
}

/** Reflections come from light cards rendered once into a cube map: no HDR download. */
function GradientEnvironment() {
  const c = useMemo(
    () => ({
      deep: resolveColor('cream-deep'),
      cream: resolveColor('cream'),
      jade: resolveColor('jade-light'),
      olive: resolveColor('olive-light'),
    }),
    [],
  )
  return (
    <Environment resolution={128} frames={1} environmentIntensity={0.95}>
      <color attach="background" args={[c.deep]} />
      <Lightformer form="rect" intensity={2.6} color={c.cream} position={[3, 6, 5]} scale={[10, 5, 1]} target={[0, 0, 0]} />
      <Lightformer form="ring" intensity={1.8} color={c.jade} position={[-6, 1.5, -4]} scale={5} target={[0, 0, 0]} />
      <Lightformer form="circle" intensity={1.3} color={c.cream} position={[6, 0, -6]} scale={4} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={0.8} color={c.olive} position={[0, -6, 0]} rotation-x={Math.PI / 2} scale={[14, 14, 1]} />
    </Environment>
  )
}

/**
 * Compiles a freshly mounted world's shaders in parallel (KHR_parallel_shader_compile)
 * while it is still hidden, so it never stalls a frame mid-scroll.
 */
function WorldSlot({ children }: { children: ReactNode }) {
  const ref = useRef<Group>(null)
  const { gl, camera, scene } = useThree()
  const [ready, setReady] = useState(false)
  useLayoutEffect(() => {
    let alive = true
    if (ref.current) compileSafely(gl, ref.current, camera, scene).then(() => alive && setReady(true))
    return () => {
      alive = false
    }
  }, [gl, camera, scene])
  return (
    <group ref={ref} visible={ready}>
      {children}
    </group>
  )
}

function ChapterWorlds(props: SceneProps) {
  const prev = useRef('')
  const mask = useJourney(() => {
    const s = segmentOf(journey.u)
    // Hysteresis: mount inside MOUNT_RANGE, unmount only past UNMOUNT_RANGE.
    const next = KEYFRAMES.map((_, i) => {
      const d = Math.abs(s - i)
      const was = prev.current[i] === '1'
      return d < MOUNT_RANGE || (was && d < UNMOUNT_RANGE) ? '1' : '0'
    }).join('')
    prev.current = next
    return next
  })
  return (
    <>
      {WORLDS.map(({ id, Scene }) =>
        mask[keyIndex(id)] === '1' ? (
          <WorldSlot key={id}>
            <Scene {...props} />
          </WorldSlot>
        ) : null,
      )}
    </>
  )
}

/** Mirrors three's loading manager into the journey store for the preloader counter. */
function LoadProgress() {
  const progress = useProgress((s) => s.progress)
  useEffect(() => {
    journey.loadProgress = progress
  }, [progress])
  return null
}

/** Once the logo has loaded, compile everything before the first visible frame. */
function Warmup({ onDone }: { onDone: () => void }) {
  const { gl, camera, scene } = useThree()
  useEffect(() => {
    let alive = true
    compileSafely(gl, scene, camera, scene).then(() => {
      if (!alive) return
      onDone()
      // Two frames later the logo has rendered: the preloader may hand off.
      requestAnimationFrame(() => requestAnimationFrame(() => (journey.ready = true)))
    })
    return () => {
      alive = false
    }
  }, [gl, camera, scene, onDone])
  return null
}

export default function Experience() {
  const mobile = useIsMobile()
  const reduced = useReducedMotion()
  const q = quality(mobile)
  const maxDpr = Math.min(window.devicePixelRatio || 1, q.maxDpr)
  const [dpr, setDpr] = useState(maxDpr)
  useEffect(() => setDpr(maxDpr), [maxDpr])
  const [warm, setWarm] = useState(false)
  const onWarm = useCallback(() => setWarm(true), [])

  return (
    <Canvas
      dpr={dpr}
      gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: NeutralToneMapping, stencil: false }}
      camera={{ fov: mobile ? MOTION.fov.mobile : MOTION.fov.desktop, near: 0.1, far: 600, position: [0, 0.35, 6.2] }}
      frameloop={reduced ? 'demand' : 'always'}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(maxDpr)} flipflops={3} />
      <JourneyDriver mobile={mobile} reduced={reduced} />
      <LoadProgress />
      <Lights />
      <LogoLight />
      <GradientEnvironment />
      {/* Hidden until every shader has compiled, so nothing stalls on screen. */}
      <group visible={warm}>
        <Sky />
        <Suspense fallback={null}>
          <Logo />
          <Warmup onDone={onWarm} />
        </Suspense>
        <CloudField density={q.count} />
        <ChapterWorlds mobile={mobile} density={q.count} />
      </group>
    </Canvas>
  )
}
