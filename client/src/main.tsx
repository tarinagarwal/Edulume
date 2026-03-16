import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initCSRF } from './utils/api'

// Initialize CSRF token before rendering
// Use .finally() so app renders even if CSRF fetch fails
initCSRF().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
