import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Self-hosted fonts (bundled, so the app works fully offline)
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/hanken-grotesk'
import '@fontsource-variable/jetbrains-mono'

import './styles/tokens.css'
import './styles/globals.css'

import App from './app/App'
import { applyPreferences } from './services/preferencesService'

// Apply persisted UI preferences (e.g. reduced motion) before first paint.
applyPreferences()

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
