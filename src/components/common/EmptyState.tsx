import type { ReactNode } from 'react'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <section className="store-empty-state" role="status">
      <span className="store-empty-state-mark" aria-hidden="true">C</span>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </section>
  )
}
