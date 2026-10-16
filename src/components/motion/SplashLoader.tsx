import { useEffect, useState } from 'react'
import { Vase3D } from './Vase3D'
import './SplashLoader.css'

const SPLASH_KEY = 'ceramax:splash-seen'
const MIN_VISIBLE_MS = 1700

function alreadySeen() {
  try { return sessionStorage.getItem(SPLASH_KEY) === '1' } catch { return false }
}

/** Pantalla de carga inicial: se muestra una vez por sesión, nunca bloquea más de lo necesario. */
export function SplashLoader() {
  const [phase, setPhase] = useState<'show' | 'leave' | 'gone'>(() => (alreadySeen() ? 'gone' : 'show'))

  useEffect(() => {
    if (phase !== 'show') return
    const started = performance.now()
    let leaveTimer = 0
    const finish = () => {
      const wait = Math.max(0, MIN_VISIBLE_MS - (performance.now() - started))
      leaveTimer = window.setTimeout(() => {
        try { sessionStorage.setItem(SPLASH_KEY, '1') } catch { /* sin storage */ }
        setPhase('leave')
      }, wait)
    }
    if (document.readyState === 'complete') finish()
    else window.addEventListener('load', finish, { once: true })
    const failsafe = window.setTimeout(() => setPhase('leave'), 5000)
    return () => {
      window.removeEventListener('load', finish)
      window.clearTimeout(leaveTimer)
      window.clearTimeout(failsafe)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'leave') return
    const timer = window.setTimeout(() => setPhase('gone'), 900)
    return () => window.clearTimeout(timer)
  }, [phase])

  if (phase === 'gone') return null
  return (
    <div className={`splash${phase === 'leave' ? ' splash-leave' : ''}`} role="status" aria-live="polite" aria-label="Cargando Cerámax">
      <div className="splash-glow" aria-hidden="true" />
      <div className="splash-content">
        <Vase3D size={240} />
        <h2 className="splash-word" aria-hidden="true">
          {'CERÁMAX'.split('').map((letter, index) => <span style={{ animationDelay: `${index * 70}ms` }} key={index}>{letter}</span>)}
        </h2>
        <p className="splash-tag">Dando forma a tu tienda</p>
        <span className="splash-track" aria-hidden="true"><span /></span>
      </div>
    </div>
  )
}
