import { createContext, useCallback, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => {
        removeToast(id);
      }, 4200);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}
            role="status"
          >
            {toast.type === 'error' ? (
              <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: 1 }} />
            ) : (
              <CheckCircle2 size={18} color="#059669" style={{ flexShrink: 0, marginTop: 1 }} />
            )}
            <span className="toast-message">{toast.message}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: 2,
              }}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
