"use client"

import React, { useState, useCallback } from "react"

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: "default" | "destructive" | "success"
}

export interface ToastActionElement {
  altText: string
  action: () => void
  label: string
}

export interface ToastProps {
  title: string
  description?: string
  variant?: "default" | "destructive" | "success"
  action?: ToastActionElement
}

// Global toast state
let toastCounter = 0
const globalToastState: {
  toasts: Toast[]
  addToast: (toast: ToastProps) => void
  removeToast: (id: string) => void
} = {
  toasts: [],
  addToast: () => {},
  removeToast: () => {}
}

const listeners = new Set<() => void>()

const notifyListeners = () => {
  listeners.forEach(listener => listener())
}

export const useToast = () => {
  const [, forceUpdate] = useState({})

  const removeToast = useCallback((id: string) => {
    const index = globalToastState.toasts.findIndex(toast => toast.id === id)
    if (index > -1) {
      globalToastState.toasts.splice(index, 1)
      notifyListeners()
    }
  }, [])

  const addToast = useCallback((toast: ToastProps) => {
    const id = `toast-${++toastCounter}`
    const newToast: Toast = {
      ...toast,
      id,
      variant: toast.variant || "default"
    }
    
    globalToastState.toasts.push(newToast)
    notifyListeners()

    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id)
    }, 5000)
  }, [removeToast])

  const refresh = useCallback(() => {
    forceUpdate({})
  }, [])

  // Subscribe to global state changes
  useState(() => {
    listeners.add(refresh)
    return () => {
      listeners.delete(refresh)
    }
  })

  return {
    toasts: globalToastState.toasts,
    toast: addToast,
    dismiss: removeToast
  }
}

// Initialize global functions
globalToastState.addToast = (toast: ToastProps) => {
  const id = `toast-${++toastCounter}`
  const newToast: Toast = {
    ...toast,
    id,
    variant: toast.variant || "default"
  }
  
  globalToastState.toasts.push(newToast)
  notifyListeners()

  setTimeout(() => {
    globalToastState.removeToast(id)
  }, 5000)
}

globalToastState.removeToast = (id: string) => {
  const index = globalToastState.toasts.findIndex(toast => toast.id === id)
  if (index > -1) {
    globalToastState.toasts.splice(index, 1)
    notifyListeners()
  }
}
