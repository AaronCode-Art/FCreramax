export function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M3.5 10h12m-5-5 5 5-5 5" />
    </svg>
  )
}

export function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={filled ? 'heart-filled' : ''}>
      <path d="M20.3 8.7c0 5-8.3 10.2-8.3 10.2S3.7 13.7 3.7 8.7a4.2 4.2 0 0 1 7.6-2.5 4.2 4.2 0 0 1 9 2.5Z" />
    </svg>
  )
}
