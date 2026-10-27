import { Vector3 } from 'three'

/**
 * Uniforms shared by every custom shader. Updated once per frame by the
 * JourneyDriver, so one assignment re-fogs and re-times the whole world.
 * uFogColor holds sRGB values: like three's own fog, it is mixed in after
 * the color-space conversion so custom shaders match standard materials.
 */
export const shared = {
  uTime: { value: 0 },
  uFogColor: { value: new Vector3(0.95, 0.93, 0.87) },
  uFogNear: { value: 8 },
  uFogFar: { value: 40 },
}

export const FOG_PARS = /* glsl */ `
uniform vec3 uFogColor;
uniform float uFogNear;
uniform float uFogFar;
varying float vFogDepth;
`

/** Call at the very end of a fragment shader, after gl_FragColor is set in linear space. */
export const FOG_APPLY = /* glsl */ `
  #include <colorspace_fragment>
  gl_FragColor.rgb = mix(gl_FragColor.rgb, uFogColor, smoothstep(uFogNear, uFogFar, vFogDepth));
`

/** The fog uniforms, shared by reference with every custom shader. */
export function fogUniforms() {
  return { uFogColor: shared.uFogColor, uFogNear: shared.uFogNear, uFogFar: shared.uFogFar }
}
