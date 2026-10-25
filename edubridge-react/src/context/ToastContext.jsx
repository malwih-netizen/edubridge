import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const toast = useCallback((message) => {
    const id = Math.random().toString(36).slice(2);
    setItems((list) => [...list.slice(-2), { id, message }]);
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 2800);
  }, []);
  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {items.map((t) => <div key={t.id} className="toast"><CheckCircle2 aria-hidden />{t.message}</div>)}
      </div>
    </ToastContext.Provider>
  );
}

/** const toast = useToast(); toast(t('toast.saved')); */
export const useToast = () => useContext(ToastContext);
