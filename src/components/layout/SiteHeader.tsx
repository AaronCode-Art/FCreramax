import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { HeartIcon } from '../ui/Icons'
import { NotificationBell } from '../notifications/NotificationBell'

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [accountOpen, setAccountOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { customer, cart, favorites, openAuth, logout, categories, products } = useStore()
  const searchSuggestions = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es')
    if (!term) return []
    return products.filter((product) => (
      `${product.name} ${product.category} ${product.collection} ${product.description}`.toLocaleLowerCase('es').includes(term)
    )).slice(0, 5)
  }, [products, search])
  const cartUnits = cart.reduce((sum, item) => sum + item.quantity, 0)
  const navClass = ({ isActive }: { isActive: boolean }) => `nav-link${isActive ? ' nav-link-active' : ''}`
  const closeMenu = () => setMenuOpen(false)
  const closeSearch = () => { setSearchOpen(false); setSearch('') }

  useEffect(() => {
    if (!searchOpen) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) closeSearch()
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [searchOpen])

  useEffect(() => {
    if (!accountOpen) return
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [accountOpen])

  useEffect(() => {
    if (!menuOpen && !accountOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); setAccountOpen(false) }
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen, accountOpen])

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const term = search.trim()
    closeSearch()
    closeMenu()
    navigate(term ? `/productos?search=${encodeURIComponent(term)}` : '/productos')
  }

  function navigateToProduct(slug: string) {
    closeSearch()
    closeMenu()
    navigate(`/producto/${slug}`)
  }

  return (
    <header ref={headerRef} className={`site-header site-header-clean${menuOpen ? ' site-header-menu-open' : ''}${searchOpen ? ' site-header-search-open' : ''}`}>
      <Link className="brand" to="/" aria-label="Cerámax, ir al inicio" onClick={() => { closeMenu(); closeSearch() }}>
        <img className="brand-logo" src="https://res.cloudinary.com/dfmveqhud/image/upload/v1790608920/favicon_xv5sdn.svg" alt="" aria-hidden="true" />
        <span className="brand-caption">CERÁMAX</span>
      </Link>
      <nav className={`main-nav${menuOpen ? ' main-nav-open' : ''}`} aria-label="Navegación principal">
        <NavLink className={navClass} to="/" end onClick={() => { closeMenu(); closeSearch() }}>Inicio</NavLink>
        <NavLink className={navClass} to="/productos" onClick={() => { closeMenu(); closeSearch() }}>Productos</NavLink>
        <div className="nav-dropdown">
          <NavLink className={({ isActive }) => `nav-link nav-category-trigger${isActive ? ' nav-link-active' : ''}`} to="/categorias" onClick={() => { closeMenu(); closeSearch() }}>
            Categorías <span className="chevron-icon" aria-hidden="true" />
          </NavLink>
          <div className="category-dropdown-menu">
            <span className="dropdown-title">Explora por tipo de pieza</span>
            {categories.map((category) => <Link key={category.slug} to={`/categoria/${category.slug}`} onClick={() => { closeMenu(); closeSearch() }}>{category.name}</Link>)}
            <Link className="dropdown-all" to="/categorias" onClick={() => { closeMenu(); closeSearch() }}>Ver todas las categorías</Link>
          </div>
        </div>
        <NavLink className={navClass} to="/cupones" onClick={() => { closeMenu(); closeSearch() }}>Cupones</NavLink>
        <NavLink className={navClass} to="/contacto" onClick={() => { closeMenu(); closeSearch() }}>Contacto</NavLink>
        {customer ? <>
          <NavLink className={`${navClass({ isActive: false })} nav-mobile-only`} to="/carrito" onClick={closeMenu}>Mi carrito{cartUnits > 0 ? ` (${cartUnits})` : ''}</NavLink>
          <NavLink className={`${navClass({ isActive: false })} nav-mobile-only`} to="/pedidos" onClick={closeMenu}>Mis pedidos</NavLink>
          <NavLink className={`${navClass({ isActive: false })} nav-mobile-only`} to="/favoritos" onClick={closeMenu}>Mis favoritos</NavLink>
        </> : <button className="nav-link nav-mobile-only nav-mobile-login" type="button" onClick={() => { closeMenu(); openAuth('login') }}>Iniciar sesión o crear cuenta</button>}
      </nav>
      <div className="header-actions">
        <button className="icon-button" type="button" aria-label={searchOpen ? 'Cerrar búsqueda' : 'Buscar productos'} aria-expanded={searchOpen} onClick={() => { setSearchOpen((open) => !open); setMenuOpen(false); setAccountOpen(false) }}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
        </button>
        {customer && <NotificationBell onOpen={() => { closeMenu(); closeSearch(); setAccountOpen(false) }} />}
        {customer ? (
          <NavLink className="icon-button header-icon-link header-favorites" to="/favoritos" aria-label="Lista de deseos" title="Lista de deseos" onClick={() => { closeMenu(); closeSearch() }}>
            <HeartIcon /><span className="icon-label" aria-hidden="true">Favoritos</span>{favorites.length > 0 && <span className="favorite-count">{favorites.length}</span>}
          </NavLink>
        ) : (
          <button className="icon-button header-icon-link header-favorites" type="button" aria-label="Inicia sesión para ver tus favoritos" title="Lista de deseos" onClick={() => { closeMenu(); closeSearch(); openAuth('login') }}>
            <HeartIcon /><span className="icon-label" aria-hidden="true">Favoritos</span>
          </button>
        )}
        {customer ? (
          <NavLink className="icon-button header-icon-link header-cart" to="/carrito" aria-label={cartUnits > 0 ? `Carrito, ${cartUnits} ${cartUnits === 1 ? 'pieza' : 'piezas'}` : 'Carrito vacío'} title="Mi carrito" onClick={() => { closeMenu(); closeSearch() }}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1 12H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
            <span className="icon-label" aria-hidden="true">Carrito</span>
            {cart.length > 0 && <span className="cart-count">{cartUnits}</span>}
          </NavLink>
        ) : (
          <button className="icon-button header-icon-link header-cart" type="button" aria-label="Inicia sesión para ver tu carrito" title="Mi carrito" onClick={() => { closeMenu(); closeSearch(); openAuth('login') }}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1 12H4L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>
            <span className="icon-label" aria-hidden="true">Carrito</span>
          </button>
        )}
        <div ref={accountMenuRef} className={`account-menu${accountOpen ? ' account-menu-open' : ''}`}>
          <button className="icon-button" type="button" aria-label={customer ? 'Abrir menú de mi cuenta' : 'Iniciar sesión o crear cuenta'} title={customer ? 'Mi cuenta' : 'Iniciar sesión'} aria-expanded={accountOpen} onClick={() => {
            if (!customer) openAuth('login')
            else setAccountOpen((open) => !open)
            setMenuOpen(false)
            setSearchOpen(false)
          }}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></svg>
            <span className="icon-label" aria-hidden="true">{customer ? 'Mi cuenta' : 'Ingresar'}</span>
          </button>
          {customer && accountOpen && <div className="account-dropdown">
            <span className="account-dropdown-name">{customer.firstNames || customer.name}</span>
            <Link to="/mi-cuenta" onClick={() => setAccountOpen(false)}>Mis datos</Link>
            <Link to="/pedidos" onClick={() => setAccountOpen(false)}>Mis pedidos</Link>
            <Link to="/favoritos" onClick={() => setAccountOpen(false)}>Lista de deseos</Link>
            <button className="account-dropdown-logout" type="button" onClick={() => { logout(); setAccountOpen(false) }}>Cerrar sesión</button>
          </div>}
        </div>
        <button className={`icon-button mobile-menu-toggle${menuOpen ? ' is-open' : ''}`} type="button" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen} onClick={() => { setMenuOpen((open) => !open); setSearchOpen(false); setAccountOpen(false) }}>
          <svg viewBox="0 0 24 24" aria-hidden="true">{menuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</svg>
        </button>
      </div>
      {searchOpen && <form className="header-search" role="search" onSubmit={submitSearch}>
        <label className="sr-only" htmlFor="site-search">Buscar productos</label>
        <svg className="header-search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></svg>
        <input id="site-search" type="search" autoFocus autoComplete="off" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="¿Qué pieza estás buscando?" aria-autocomplete="list" aria-controls="header-search-suggestions" aria-expanded={Boolean(search.trim())} />
        {search && <button className="header-search-clear" type="button" aria-label="Limpiar búsqueda" onClick={() => setSearch('')}>×</button>}
        <button type="submit">Buscar</button>
        {search.trim() && <div className="header-search-suggestions" id="header-search-suggestions" role="listbox" aria-label="Productos sugeridos">
          {searchSuggestions.length ? searchSuggestions.map((product) => <button className="header-search-suggestion" type="button" role="option" aria-selected="false" key={product.id} onClick={() => navigateToProduct(product.slug)}>
            <img src={product.image} alt="" /><span className="header-search-suggestion-copy"><strong>{product.name}</strong><small>{product.category} · {product.collection}</small></span><strong className="header-search-suggestion-price">S/ {product.price.toFixed(2)}</strong>
          </button>) : <p className="header-search-no-results">No encontramos productos con “{search.trim()}”.</p>}
          {searchSuggestions.length > 0 && <button className="header-search-all-results" type="submit">Ver todos los resultados para “{search.trim()}”</button>}
        </div>}
      </form>}
    </header>
  )
}
