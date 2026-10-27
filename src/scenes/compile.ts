import type { Camera, Object3D, Scene, WebGLRenderer } from 'three'

interface ProgramLike {
  program?: WebGLProgram
  isReady(): boolean
}

/**
 * Like renderer.compileAsync(), but treats programs that were destroyed meanwhile
 * (a world unmounting mid-compile, or React StrictMode's dev double-mount) as done
 * instead of polling a deleted GL program forever.
 */
export function compileSafely(gl: WebGLRenderer, object: Object3D, camera: Camera, scene: Scene) {
  const pending = gl.compile(object, camera, scene)
  return new Promise<void>((resolve) => {
    const check = () => {
      pending.forEach((material) => {
        const program = (gl.properties.get(material) as { currentProgram?: ProgramLike }).currentProgram
        if (!program || program.program === undefined || program.isReady()) pending.delete(material)
      })
      if (pending.size === 0) resolve()
      else setTimeout(check, 16)
    }
    check()
  })
}
