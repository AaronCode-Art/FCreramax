import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import type { StoreCategory } from '../../context/StoreContext'
import './CategoryCarousel3D.css'

type Props = { categories: StoreCategory[]; counts: Record<string, number> }
type CardStyle = CSSProperties & { '--d': number; '--ad': number }

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return reduced
}

/** Carrusel 3D tipo coverflow: muestra la categoría activa al centro y las vecinas en perspectiva. */
export function CategoryCarousel3D({ categories, counts }: Props) {
  const total = categories.length
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const reduced = usePrefersReducedMotion()
  const drag = useRef<{ x: number; moved: boolean } | null>(null)
  const suppressClick = useRef(false)

  const go = useCallback((step: number) => {
    setActive((current) => (current + step + total) % total)
  }, [total])

  useEffect(() => {
    if (paused || reduced || total < 2) return
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') go(1)
    }, 4800)
    return () => window.clearInterval(timer)
  }, [paused, reduced, total, go])

  if (!total) return null

  const half = Math.floor(total / 2)
  const offsetOf = (index: number) => ((index - active + total + half) % total) - half

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    drag.current = { x: event.clientX, moved: false }
    setPaused(true)
  }
  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!drag.current) return
    const delta = event.clientX - drag.current.x
    if (Math.abs(delta) > 8) drag.current.moved = true
  }
  function endDrag(event: PointerEvent<HTMLDivElement>) {
    const current = drag.current
    drag.current = null
    if (!current) return
    const delta = event.clientX - current.x
    if (current.moved && Math.abs(delta) > 46) {
      go(delta < 0 ? 1 : -1)
      suppressClick.current = true
      window.setTimeout(() => { suppressClick.current = false }, 60)
    }
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowRight') { event.preventDefault(); go(1) }
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(-1) }
  }
  function tilt(event: PointerEvent<HTMLAnchorElement>) {
    if (event.pointerType !== 'mouse') return
    const card = event.currentTarget
    const box = card.getBoundingClientRect()
    const x = (event.clientX - box.left) / box.width - 0.5
    const y = (event.clientY - box.top) / box.height - 0.5
    card.style.setProperty('--rx', `${(-y * 9).toFixed(2)}deg`)
    card.style.setProperty('--ry', `${(x * 11).toFixed(2)}deg`)
    card.style.setProperty('--mx', `${((x + 0.5) * 100).toFixed(1)}%`)
    card.style.setProperty('--my', `${((y + 0.5) * 100).toFixed(1)}%`)
  }
  function resetTilt(event: PointerEvent<HTMLAnchorElement>) {
    const card = event.currentTarget
    card.style.removeProperty('--rx')
    card.style.removeProperty('--ry')
  }

  return (
    <div
      className="cc3"
      role="group"
      aria-roledescription="carrusel"
      aria-label="Categorías de cerámica"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="cc3-stage"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        aria-live="off"
      >
        {categories.map((category, index) => {
          const d = offsetOf(index)
          const isActive = d === 0
          const style: CardStyle = { '--d': d, '--ad': Math.abs(d) }
          const count = counts[category.name] ?? 0
          return (
            <Link
              className={`cc3-card${isActive ? ' is-active' : ''}${Math.abs(d) > 2 ? ' is-far' : ''}`}
              style={style}
              to={`/categoria/${category.slug}`}
              key={category.slug}
              aria-label={`${category.name}, ${count} ${count === 1 ? 'pieza' : 'piezas'}`}
              aria-current={isActive ? 'true' : undefined}
              tabIndex={Math.abs(d) <= 1 ? 0 : -1}
              draggable={false}
              onFocus={() => setActive(index)}
              onPointerMove={isActive ? tilt : undefined}
              onPointerLeave={isActive ? resetTilt : undefined}
              onClick={(event) => {
                if (suppressClick.current) { event.preventDefault(); return }
                if (!isActive) { event.preventDefault(); setActive(index) }
              }}
            >
              <img src={category.image} alt="" loading="lazy" draggable={false} />
              <span className="cc3-shade" aria-hidden="true" />
              <span className="cc3-glare" aria-hidden="true" />
              <span className="cc3-copy">
                <span className="cc3-count">{count} {count === 1 ? 'pieza' : 'piezas'}</span>
                <strong>{category.name}</strong>
                <span className="cc3-note">{category.note}</span>
                <span className="cc3-go">Ver categoría <span aria-hidden="true">→</span></span>
              </span>
            </Link>
          )
        })}
      </div>
      {total > 1 && <div className="cc3-controls">
        <button type="button" className="cc3-arrow" aria-label="Categoría anterior" onClick={() => go(-1)}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16.5 10h-12m5-5-5 5 5 5" /></svg>
        </button>
        <div className="cc3-dots" role="tablist" aria-label="Elegir categoría">
          {categories.map((category, index) => <button type="button" role="tab" aria-selected={index === active} aria-label={category.name} className={index === active ? 'is-active' : ''} key={category.slug} onClick={() => setActive(index)} />)}
        </div>
        <button type="button" className="cc3-arrow" aria-label="Categoría siguiente" onClick={() => go(1)}>
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3.5 10h12m-5-5 5 5-5 5" /></svg>
        </button>
      </div>}
    </div>
  )
}
