import { writable } from 'svelte/store';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  details?: string[];
  duration?: number;
}

export const toasts = writable<Toast[]>([]);

let toastId = 0;

export function addToast(toast: Omit<Toast, 'id'>): string {
  const id = `toast-${++toastId}`;
  const newToast: Toast = {
    id,
    duration: 5000, // Default 5 seconds
    ...toast
  };
  
  toasts.update(current => [...current, newToast]);
  
  return id;
}

export function removeToast(id: string) {
  toasts.update(current => current.filter(toast => toast.id !== id));
}

// Convenience functions
export function showSuccess(message: string, options?: Partial<Toast>) {
  return addToast({
    type: 'success',
    message,
    ...options
  });
}

export function showError(message: string, options?: Partial<Toast>) {
  return addToast({
    type: 'error',
    message,
    duration: 8000, // Longer duration for errors
    ...options
  });
}

export function showInfo(message: string, options?: Partial<Toast>) {
  return addToast({
    type: 'info',
    message,
    ...options
  });
}

export function showWarning(message: string, options?: Partial<Toast>) {
  return addToast({
    type: 'warning',
    message,
    ...options
  });
}