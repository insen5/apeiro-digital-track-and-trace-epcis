/**
 * Toast notification utility
 * Uses react-hot-toast for toast notifications
 */
import toast, { ToastOptions } from 'react-hot-toast';

class Toast {
  success(message: string, options?: ToastOptions) {
    toast.success(message, options);
  }

  error(message: string, options?: ToastOptions) {
    // Errors auto-dismiss after 8 seconds but can be manually dismissed earlier
    toast.error(message, {
      duration: 8000, // Auto-dismiss after 8 seconds
      ...options,
    });
  }

  info(message: string, options?: ToastOptions) {
    toast(message, {
      icon: 'ℹ️',
      ...options,
    });
  }

  warning(message: string, options?: ToastOptions) {
    toast(message, {
      icon: '⚠️',
      ...options,
    });
  }
}

export const showToast = new Toast();

