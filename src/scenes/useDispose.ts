import { useEffect } from 'react'

interface Disposable {
  dispose(): void
}
type Item = Disposable | readonly Disposable[] | null | undefined

const pending = new Map<Disposable, number>()

/**
 * Disposes GPU resources when the component unmounts.
 * Disposal is deferred one tick so React StrictMode's simulated unmount/remount
 * (dev only) cancels it instead of disposing objects that are about to be reused.
 */
export function useDispose(...items: Item[]) {
  useEffect(() => {
    const list = items.flat().filter(Boolean) as Disposable[]
    for (const d of list) {
      window.clearTimeout(pending.get(d))
      pending.delete(d)
    }
    return () => {
      for (const d of list) {
        pending.set(
          d,
          window.setTimeout(() => {
            pending.delete(d)
            d.dispose()
          }, 0),
        )
      }
    }
  }, items.flat())
}
