import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { initI18n } from './i18n'
import './index.css'
import { applyDocumentPreferences } from './lib/document'
import { loadState } from './lib/storage'
import { settingsSchema } from './model/schemas'

// Apply saved preferences before the first render so there's no flash of the wrong language,
// text size, or theme.
const { value: settings } = loadState(settingsSchema)
initI18n(settings.language)
applyDocumentPreferences(settings)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
