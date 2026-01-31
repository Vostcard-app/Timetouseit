import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/global.css'
import App from './App.tsx'

// Service worker update policy (lower frequency for slow cellular)
const SW_CHECK_INTERVAL_MS = 15 * 60 * 1000   // 15 minutes
const SW_IDLE_REFRESH_MS = 30 * 60 * 1000     // 30 minutes hidden => refresh on visible

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // @ts-ignore - virtual:pwa-register is provided by vite-plugin-pwa
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      onNeedRefresh() {
        console.log('🔄 New content available, reloading...')
        window.location.reload()
      },
      onOfflineReady() {
        console.log('✅ App ready to work offline')
      },
      onRegistered(registration: ServiceWorkerRegistration | undefined) {
        console.log('📦 Service worker registered')
        if (!registration) return
        // No immediate update on every load (reduces slow-cellular chatter)
        // Periodic check only when tab is visible
        setInterval(() => {
          if (document.visibilityState === 'visible') {
            registration.update().catch((err: Error) => {
              console.warn('⚠️ Failed to check for updates:', err)
            })
          }
        }, SW_CHECK_INTERVAL_MS)
        // Check when returning after long idle
        let hiddenAt: number | null = null
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
            hiddenAt = Date.now()
            return
          }
          if (hiddenAt !== null && Date.now() - hiddenAt >= SW_IDLE_REFRESH_MS) {
            registration.update().catch((err: Error) => {
              console.warn('⚠️ Failed to check for updates:', err)
            })
          }
          hiddenAt = null
        })
      },
      immediate: true
    })
  }).catch(() => {
    console.log('Service worker not available')
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
