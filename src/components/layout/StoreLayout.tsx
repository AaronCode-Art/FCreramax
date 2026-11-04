import './Layout.css'
import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { StoreProvider } from '../../context/StoreContext'
import { NotificationsProvider } from '../../context/NotificationsContext'
import { AuthModal } from '../common/AuthModal'
import { StoreDialogs } from '../common/StoreDialogs'
import { StoreNotice } from '../common/StoreNotice'
import { CouponAnnouncer } from '../common/CouponAnnouncer'
import { SplashLoader } from '../motion/SplashLoader'

export function StoreLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [pathname])

  return (
    <StoreProvider>
      <NotificationsProvider>
      <div className="storefront">
        <SplashLoader />
        <SiteHeader />
        <main><Outlet /></main>
        <SiteFooter />
        <AuthModal />
        <StoreDialogs />
        <StoreNotice />
        <CouponAnnouncer />
      </div>
      </NotificationsProvider>
    </StoreProvider>
  )
}
