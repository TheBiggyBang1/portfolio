import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Fills %SITE_URL% in index.html (link-preview tags need absolute URLs).
 * Uses SITE_URL when set, otherwise the onrender.com URL Render provides at build time.
 */
function siteUrl(url: string): Plugin {
  return {
    name: 'site-url',
    transformIndexHtml: { order: 'pre', handler: (html) => html.replaceAll('%SITE_URL%', url) },
  }
}

/** Tells search engines about the two languages. Needs absolute URLs, so only with a site URL. */
function languageLinks(url: string): Plugin {
  return {
    name: 'language-links',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: () =>
        url
          ? [
              { tag: 'link', attrs: { rel: 'alternate', hreflang: 'en', href: `${url}/` }, injectTo: 'head' },
              { tag: 'link', attrs: { rel: 'alternate', hreflang: 'fr', href: `${url}/fr/` }, injectTo: 'head' },
            ]
          : [],
    },
  }
}

/** index.html text → French, for the /fr/ page. Every entry must match exactly. */
const FRENCH_HTML: [string, string][] = [
  ['<html lang="en">', '<html lang="fr">'],
  ['content="en_US"', 'content="fr_FR"'],
  ['Mehdi Handous — AI engineer & web designer', 'Mehdi Handous — ingénieur IA & web designer'],
  [
    'Mehdi Handous, 25, AI engineering student who loves web design. A scroll-driven story through speech, agents, vision and craft.',
    'Mehdi Handous, 25 ans, étudiant en ingénierie IA passionné de web design. Une histoire à faire défiler, entre voix, agents, vision et création.',
  ],
  [
    'A scroll-driven story through speech recognition, autonomous agents, medical vision and craft.',
    'Une histoire à faire défiler, entre reconnaissance vocale, agents autonomes, vision médicale et création.',
  ],
  [
    'A scroll-driven story through speech, agents, vision and craft.',
    'Une histoire à faire défiler : voix, agents, vision et création.',
  ],
  [
    'Mehdi Handous: his jade 3D logo above his name on a soft cream sky.',
    'Mehdi Handous : son logo 3D en jade au-dessus de son nom, sur un ciel crème.',
  ],
  [
    'Mehdi Handous — AI engineering student who loves web design. This site needs JavaScript for its 3D story.',
    'Mehdi Handous — étudiant en ingénierie IA passionné de web design. Ce site a besoin de JavaScript pour son histoire en 3D.',
  ],
]

/** Writes dist/fr/index.html: the same app with French page text (src/content/lang.ts reads the path). */
function frenchPage(url: string): Plugin {
  return {
    name: 'french-page',
    apply: 'build',
    enforce: 'post',
    generateBundle: {
      order: 'post',
      handler(_, bundle) {
        const page = bundle['index.html']
        if (!page || page.type !== 'asset') this.error('index.html is missing from the build')
        let html = String(page.source)
        for (const [en, fr] of FRENCH_HTML) {
          if (!html.includes(en)) this.error(`French page: "${en}" not found in index.html`)
          html = html.replaceAll(en, fr)
        }
        html = html.replace(`property="og:url" content="${url}/"`, `property="og:url" content="${url}/fr/"`)
        this.emitFile({ type: 'asset', fileName: 'fr/index.html', source: html })
      },
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', ['SITE_URL', 'RENDER_EXTERNAL_URL'])
  const url = (env.SITE_URL || env.RENDER_EXTERNAL_URL || '').replace(/\/+$/, '')
  return {
    plugins: [react(), siteUrl(url), languageLinks(url), frenchPage(url)],
    build: { chunkSizeWarningLimit: 1200 },
  }
})
