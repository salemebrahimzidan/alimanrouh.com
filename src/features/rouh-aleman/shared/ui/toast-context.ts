import { createContext, useContext } from 'react'

export type ToastVariant = 'success' | 'error'

export type ToastItem = {
  id: number
  variant: ToastVariant
  message: string
}

export type ToastContextValue = {
  showToast: (variant: ToastVariant, message: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return ctx
}
