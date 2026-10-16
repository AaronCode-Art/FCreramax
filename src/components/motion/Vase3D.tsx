import type { CSSProperties } from 'react'
import './Vase3D.css'

const LAYERS = 34
const HEIGHT = 150

function radiusAt(t: number) {
  return 24 + 46 * Math.sin(Math.PI * Math.pow(t, 0.7)) + 15 * Math.pow(t, 10)
}

function bandAt(index: number) {
  if (index < 3) return 'foot'
  if (index > LAYERS - 4) return 'lip'
  if (index % 11 >= 8) return 'glaze'
  return 'body'
}

type RingStyle = CSSProperties & { '--r': number; '--y': number; '--i': number; '--d': string }

/** Vasija de cerámica hecha de anillos apilados, girando en el torno (CSS 3D puro, sin librerías). */
export function Vase3D({ size = 200 }: { size?: number }) {
  const rings = Array.from({ length: LAYERS }, (_, index) => {
    const t = index / (LAYERS - 1)
    const style: RingStyle = {
      '--r': Math.round(radiusAt(t) * 10) / 10,
      '--y': Math.round(t * HEIGHT),
      '--i': index,
      '--d': `${5.5 + (index % 5) * 0.7}s`,
    }
    return <span className="vase-ring" data-band={bandAt(index)} style={style} key={index}><i /></span>
  })
  return (
    <span className="vase3d" style={{ width: size, height: size * 1.1 }} aria-hidden="true">
      <span className="vase3d-scale" style={{ transform: `scale(${size / 200})` }}>
        <span className="vase3d-shadow" />
        <span className="vase3d-stage">{rings}</span>
      </span>
    </span>
  )
}
