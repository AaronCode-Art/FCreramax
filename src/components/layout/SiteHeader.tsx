import { useState, type MouseEvent } from 'react'
import { ChevronDown, ClipboardList, Heart, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react'
import type { CustomerSession } from '../../types/store'

interface SiteHeaderProps {
  cartCount: number
  wishlistCount: number
  customer: CustomerSession | null
  categories: string[]
  search: string
  onSearchChange: (value: string) => void
  onOpenCart: () => void
  onOpenWishlist: () => void
  onOpenOrders: () => void
  onOpenAccount: () => void
  onNavigate: (path: string) => void
  onSelectCategory: (category: string) => void
}

export function SiteHeader({
  cartCount,
  wishlistCount,
  customer,
  categories,
  search,
  onSearchChange,
  onOpenCart,
  onOpenWishlist,
  onOpenOrders,
  onOpenAccount,
  onNavigate,
  onSelectCategory,
}: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [categoriesOpen, setCategoriesOpen] = useState(false)

  function navigate(event: MouseEvent<HTMLAnchorElement>, path: string) {
    event.preventDefault()
    setMenuOpen(false)
    setCategoriesOpen(false)
    onNavigate(path)
  }

  const navigation = (
    <>
      <a className="whitespace-nowrap transition hover:text-terracotta" href="/" onClick={(event) => navigate(event, '/')}>Inicio</a>
      <a className="whitespace-nowrap transition hover:text-terracotta" href="/productos" onClick={(event) => navigate(event, '/productos')}>Productos</a>
      <div
        className="group relative"
        onMouseEnter={() => setCategoriesOpen(true)}
        onMouseLeave={() => setCategoriesOpen(false)}
      >
        <button
          type="button"
          className="inline-flex items-center gap-1 whitespace-nowrap transition hover:text-terracotta"
          aria-expanded={categoriesOpen}
          onClick={() => setCategoriesOpen((open) => !open)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setCategoriesOpen(false)
          }}
        >
          Categorías <ChevronDown size={14} />
        </button>
        {categoriesOpen && (
          <div className="absolute left-0 top-full z-40 min-w-52 rounded-b-lg border border-stone-100 bg-white py-2 shadow-xl">
            {categories.slice(1).map((category) => (
              <button
                key={category}
                type="button"
                className="block w-full px-4 py-2 text-left text-sm text-stone-600 hover:bg-stone-50 hover:text-terracotta"
                onClick={() => {
                  setCategoriesOpen(false)
                  setMenuOpen(false)
                  onSelectCategory(category)
                }}
              >
                {category}
              </button>
            ))}
            <a className="mt-1 block border-t border-stone-100 px-4 py-2 text-sm font-semibold text-ink hover:text-terracotta" href="/categorias" onClick={(event) => navigate(event, '/categorias')}>
              Ver todas las categorías
            </a>
          </div>
        )}
      </div>
      <a className="whitespace-nowrap transition hover:text-terracotta" href="/contacto" onClick={(event) => navigate(event, '/contacto')}>Contacto</a>
    </>
  )

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-[92%] max-w-none items-center justify-between gap-3 py-3">
          <a href="/" onClick={(event) => navigate(event, '/')} className="flex shrink-0 items-center gap-2.5" aria-label="Cerámax inicio">
            <span className="grid size-11 place-items-center rounded-lg bg-ink">
              <img
                src="https://res.cloudinary.com/dfmveqhud/image/upload/v1790609343/images_ydj9yb.svg"
                alt=""
                className="h-9 w-auto object-contain"
              />
            </span>
            <span className="leading-none">
              <span className="block text-[19px] font-extrabold tracking-[-0.06em] text-ink">cerámax</span>
              <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.25em] text-stone-500">espacios que inspiran</span>
            </span>
          </a>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-8 px-6 text-sm font-medium text-stone-600 xl:flex">
            {navigation}
          </nav>

          <div className="flex items-center gap-1 sm:gap-3">
            <label className="hidden h-10 w-56 items-center gap-2 rounded-full bg-stone-100 px-4 lg:flex xl:w-72 2xl:w-80">
              <Search size={16} className="text-stone-500" />
              <input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                onFocus={() => onNavigate('/productos')}
                className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-stone-400"
                placeholder="Buscar productos"
                aria-label="Buscar productos"
              />
              {search && <button type="button" onClick={() => onSearchChange('')} aria-label="Limpiar búsqueda"><X size={14} className="text-stone-500" /></button>}
            </label>
            <button type="button" onClick={onOpenWishlist} className="relative inline-flex size-10 items-center justify-center rounded-full transition hover:bg-stone-100" aria-label={`Abrir favoritos, ${wishlistCount} productos`}>
              <Heart size={19} strokeWidth={1.7} />
              {wishlistCount > 0 && <span className="absolute -right-1 -top-1 grid size-[19px] place-items-center rounded-full border-2 border-white bg-terracotta text-[9px] font-bold text-white">{wishlistCount}</span>}
            </button>
            {customer && (
              <button type="button" onClick={onOpenOrders} className="inline-flex h-10 items-center justify-center gap-2 rounded-full px-2 text-xs font-semibold transition hover:bg-stone-100" aria-label="Ver mis pedidos" title="Mis pedidos">
                <ClipboardList size={19} strokeWidth={1.7} /><span className="hidden sm:inline">Mis pedidos</span>
              </button>
            )}
            <button type="button" onClick={onOpenAccount} className="inline-flex size-10 items-center justify-center rounded-full transition hover:bg-stone-100" aria-label={customer ? `Ver perfil de ${customer.nombres}` : 'Iniciar sesión'} title={customer ? 'Mi perfil' : 'Iniciar sesión'}>
              <UserRound size={19} strokeWidth={1.7} />
            </button>
            <button type="button" onClick={onOpenCart} className="relative inline-flex size-10 items-center justify-center rounded-full bg-ink text-white transition hover:bg-terracotta" aria-label={`Abrir carrito, ${cartCount} productos`}>
              <ShoppingBag size={18} strokeWidth={1.8} /><span className="absolute -right-1 -top-1 grid size-[19px] place-items-center rounded-full border-2 border-white bg-terracotta text-[9px] font-bold text-white">{cartCount}</span>
            </button>
            <button type="button" onClick={() => setMenuOpen((current) => !current)} className="inline-flex size-10 items-center justify-center rounded-full xl:hidden" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen}>
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="grid gap-3 border-t border-stone-100 px-[4%] py-3 text-sm font-medium text-stone-600 xl:hidden">
            {navigation}
          </nav>
        )}
        <div className="border-t border-stone-100 px-4 py-2 lg:hidden">
          <label className="mx-auto flex h-9 w-[92%] items-center gap-2 rounded-full bg-stone-100 px-3">
            <Search size={15} className="text-stone-500" />
            <input value={search} onChange={(event) => onSearchChange(event.target.value)} onFocus={() => onNavigate('/productos')} className="w-full bg-transparent text-xs outline-none" placeholder="Buscar productos" aria-label="Buscar productos" />
          </label>
        </div>
      </header>
    </>
  )
}
