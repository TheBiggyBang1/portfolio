export type Lang = 'en' | 'fr'

/**
 * The French site lives under /fr/ (a second index.html written at build time, see
 * vite.config.ts). Switching language is a page load, so it's decided once here.
 */
export const LANG: Lang = window.location.pathname.startsWith('/fr') ? 'fr' : 'en'

/** Where each language's site starts. */
export const HOME: Record<Lang, string> = { en: '/', fr: '/fr/' }

/** French typography: non-breaking spaces before ? ! : ; », after «, and in 33 000. */
const frenchSpacing = (s: string) =>
  s
    .replace(/ ([?!:;»])/g, ' $1')
    .replace(/« /g, '« ')
    .replace(/(\d) (\d{3})/g, '$1 $2')

type Copy = string | readonly string[]

/** Picks the copy for the current language: `t('Chapters', 'Chapitres')`. */
export function t<T extends Copy>(en: T, fr: T): T {
  if (LANG === 'en') return en
  return (typeof fr === 'string' ? frenchSpacing(fr) : fr.map(frenchSpacing)) as T
}
