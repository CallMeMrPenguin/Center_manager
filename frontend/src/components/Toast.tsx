import React from 'react';
import {
  showToast,
  AnimatedToastProvider,
  useAnimatedToast,
  usePromiseToast,
  UndoToast,
  StackedNotifications,
  ToastType,
  ToastItem,
  StackedToast,
  ShowToastOptions,
} from './ui/animated-toast';

export {
  showToast,
  AnimatedToastProvider,
  useAnimatedToast,
  usePromiseToast,
  UndoToast,
  StackedNotifications,
};

export type { ToastType, ToastItem, StackedToast, ShowToastOptions };

/**
 * ToastContainer is provided for backward compatibility.
 * When rendered, it can act as a fallback or mount point for global animated toasts.
 */
export function ToastContainer() {
  return null;
}

export default ToastContainer;
