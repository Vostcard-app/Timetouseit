import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

let toastSubscribers: ((toast: ToastMessage) => void)[] = [];

export function showToast(message: string, type: ToastType = 'info', duration: number = 3000) {
  const toast: ToastMessage = {
    id: crypto.randomUUID(),
    message,
    type,
    duration
  };
  toastSubscribers.forEach(fn => fn(toast));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handler = (toast: ToastMessage) => {
      setToasts(prev => [...prev, toast]);
      
      if (toast.duration && toast.duration > 0) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== toast.id));
        }, toast.duration);
      }
    };
    
    toastSubscribers.push(handler);
    
    return () => {
      toastSubscribers = toastSubscribers.filter(fn => fn !== handler);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const getToastColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return { bg: '#10b981', icon: '✓' };
      case 'error':
        return { bg: '#ef4444', icon: '✕' };
      case 'warning':
        return { bg: '#f59e0b', icon: '⚠' };
      case 'info':
      default:
        return { bg: '#002B4D', icon: 'ℹ' };
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      maxWidth: 400,
      pointerEvents: 'none'
    }}>
      {toasts.map(toast => {
        const colors = getToastColors(toast.type);
        return (
          <div
            key={toast.id}
            style={{
              background: colors.bg,
              color: 'white',
              padding: '14px 18px',
              borderRadius: 12,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              pointerEvents: 'auto',
              animation: 'slideInRight 0.3s ease-out',
              minWidth: 250
            }}
          >
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 16
            }}>
              {colors.icon}
            </div>
            <div style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: 18,
                padding: 4,
                opacity: 0.8
              }}
            >
              ×
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

