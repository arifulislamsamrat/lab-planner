import { useEffect, useState } from 'react';
import { extractErrorMessage } from '../../services/apiClient';

interface ToastState { message: string; key: number }
let setter: ((t: ToastState | null) => void) | null = null;

export function showToast(message: string) {
  setter?.({ message, key: Date.now() });
}

export function ToastHost() {
  const [toast, setToast] = useState<ToastState | null>(null);
  useEffect(() => { setter = setToast; return () => { setter = null; }; }, []);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(id);
  }, [toast]);
  if (!toast) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      {toast.message}
    </div>
  );
}

export function toastError(err: unknown) {
  showToast(extractErrorMessage(err));
}
