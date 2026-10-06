import { useEffect, useState } from 'react'
import { ImageOff } from 'lucide-react'
import { storeApi } from '../../lib/api'

interface ProductImageProps {
  productId: string
  alt: string
  className: string
}

export function ProductImage({ productId, alt, className }: ProductImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    storeApi.getProductGallery(productId)
      .then((images) => {
        if (!active) return
        setImageUrl(images.find((image) => image.esPrincipal)?.url ?? images[0]?.url ?? null)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
  }, [productId])

  if (imageUrl) return <img src={imageUrl} alt={alt} className={className} loading="lazy" />

  return (
    <div
      className={`${className} grid place-items-center bg-stone-100 text-stone-400`}
      role="img"
      aria-label={failed ? `No se pudo cargar la imagen de ${alt}` : `Cargando imagen de ${alt}`}
    >
      <span className="flex flex-col items-center gap-2 text-xs">
        <ImageOff size={20} aria-hidden="true" />
        {failed ? 'Imagen no disponible' : 'Cargando imagen'}
      </span>
    </div>
  )
}
