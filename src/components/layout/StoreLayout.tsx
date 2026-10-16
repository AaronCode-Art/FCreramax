import './Layout.css'
import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { StoreProvider } from '../../context/StoreContext'
import { AuthModal } from '../common/AuthModal'
import { StoreNotice } from '../common/StoreNotice'

export function StoreLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  return (
    <StoreProvider>
      <div className="storefront">
        <SiteHeader />
        <main><Outlet /></main>
        <SiteFooter />
        <AuthModal />
        <StoreNotice />
      </div>
    </StoreProvider>
  )
}
