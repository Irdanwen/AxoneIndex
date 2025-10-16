import * as React from "react"

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  duration?: number
}


interface ToastState {
  toasts: Toast[]
}

export const TOAST_LIMIT = 1
export const TOAST_REMOVE_DELAY = 1000000




let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

export function useToast() {
  const [state, setState] = React.useState<ToastState>({ toasts: [] })

  const toast = React.useCallback(
    ({ ...props }: Omit<Toast, "id">) => {
      const id = genId()
      const newToast = {
        ...props,
        id,
      }
      setState((state) => ({
        ...state,
        toasts: [newToast, ...state.toasts].slice(0, TOAST_LIMIT),
      }))

      // Auto dismiss after duration
      setTimeout(() => {
        setState((state) => ({
          ...state,
          toasts: state.toasts.filter((t) => t.id !== id),
        }))
      }, props.duration || 5000)
    },
    []
  )

  const dismiss = React.useCallback((toastId?: string) => {
    setState((state) => ({
      ...state,
      toasts: toastId
        ? state.toasts.filter((t) => t.id !== toastId)
        : [],
    }))
  }, [])

  return {
    ...state,
    toast,
    dismiss,
  }
}