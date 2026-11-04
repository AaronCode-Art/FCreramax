import { useEffect, useId, useRef, type ReactNode } from 'react'
import './ConfirmDialog.css'
import { CheckIcon } from '../ui/Icons'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  pending?: boolean
  variant?: 'warning' | 'success'
  error?: string
  children?: ReactNode
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  pending = false,
  variant = 'warning',
  error,
  children,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!open || !dialog) return
    dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [open])

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      className="store-confirm-dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault()
        if (!pending) onCancel()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          if (!pending) onCancel()
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) onCancel()
      }}
    >
      <div className="store-confirm-dialog-content">
        <span className={`store-confirm-dialog-icon store-confirm-dialog-icon-${variant}`} aria-hidden="true">{variant === 'success' ? <CheckIcon /> : '!'}</span>
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId} className="store-confirm-dialog-description">{description}</p>
        {children}
        {error && <p className="store-confirm-dialog-error" role="alert">{error}</p>}
        <div className="store-confirm-dialog-actions">
          <button className="button button-light" type="button" disabled={pending} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="button button-dark" type="button" disabled={pending} onClick={onConfirm}>
            {pending ? 'Procesando…' : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}
