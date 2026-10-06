import type { MouseEvent } from 'react'

export function SiteFooter({ onNavigate }: { onNavigate: (path: string) => void }) {
  function navigate(event: MouseEvent<HTMLAnchorElement>, path: string) {
    event.preventDefault()
    onNavigate(path)
  }

  return (
    <footer className="mt-20 bg-ink text-white">
      <div className="mx-auto grid w-[92%] max-w-none gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:py-16">
        <div>
          <a href="/" onClick={(event) => navigate(event, '/')} className="inline-flex items-center gap-3 text-2xl font-extrabold tracking-[-0.07em]" aria-label="Cerámax inicio">
            <img
              src="https://res.cloudinary.com/dfmveqhud/image/upload/v1790609343/images_ydj9yb.svg"
              alt=""
              loading="lazy"
              className="h-16 w-auto object-contain"
            />
            <span>cerámax</span>
          </a>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">Explora</h3>
          <div className="mt-4 grid gap-3 text-sm text-white/75">
            <a href="/productos" onClick={(event) => navigate(event, '/productos')} className="hover:text-white">Productos</a>
            <a href="/categorias" onClick={(event) => navigate(event, '/categorias')} className="hover:text-white">Categorías</a>
            <a href="/contacto" onClick={(event) => navigate(event, '/contacto')} className="hover:text-white">Contacto y nosotros</a>
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-white/45">Te ayudamos</h3>
          <div className="mt-4 grid gap-3 text-sm text-white/75">
            <a href="/compra" onClick={(event) => navigate(event, '/compra')} className="hover:text-white">Mi carrito / compra</a>
            <a href="/miperfil" onClick={(event) => navigate(event, '/miperfil')} className="hover:text-white">Mis pedidos</a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 px-5 py-4 text-center text-[11px] text-white/40">
        Cerámax
      </div>
    </footer>
  )
}
