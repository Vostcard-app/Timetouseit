import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/global.css'
import App from './App.tsx'

// Register service worker for PWA with update notifications
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Dynamic import to avoid TypeScript errors
  // @ts-ignore - virtual:pwa-register is provided by vite-plugin-pwa
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({
      onNeedRefresh() {
        console.log('🔄 New content available, reloading...')
        // Automatically reload when new content is available
        window.location.reload()
      },
      onOfflineReady() {
        console.log('✅ App ready to work offline')
      },
      onRegistered(registration: ServiceWorkerRegistration | undefined) {
        console.log('📦 Service worker registered')
        // Check for updates periodically (every hour)
        if (registration) {
          setInterval(() => {
            registration.update().catch((err: Error) => {
              console.warn('⚠️ Failed to check for updates:', err)
            })
          }, 60 * 60 * 1000) // 1 hour
        }
      },
      immediate: true
    })
  }).catch(() => {
    // Service worker registration not available (dev mode or not supported)
    console.log('Service worker not available')
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
