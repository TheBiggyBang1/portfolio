import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'lenis/dist/lenis.css'
import './styles/tokens.css'
import './styles/global.css'
import App from './App'
import { LANG } from './content/lang'

// The built /fr/ page already says this; the dev server serves one index.html for both.
document.documentElement.lang = LANG
if (LANG === 'fr') document.title = 'Mehdi Handous — ingénieur IA & web designer'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
