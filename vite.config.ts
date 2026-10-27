import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Fills %SITE_URL% in index.html (link-preview tags need absolute URLs).
 * Uses SITE_URL when set, otherwise the onrender.com URL Render provides at build time.
 */
function siteUrl(mode: string): Plugin {
  const env = loadEnv(mode, '.', ['SITE_URL', 'RENDER_EXTERNAL_URL'])
  const url = (env.SITE_URL || env.RENDER_EXTERNAL_URL || '').replace(/\/+$/, '')
  return {
    name: 'site-url',
    transformIndexHtml: { order: 'pre', handler: (html) => html.replaceAll('%SITE_URL%', url) },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), siteUrl(mode)],
  build: {
    chunkSizeWarningLimit: 1200,
  },
}))
