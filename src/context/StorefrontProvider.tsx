import type { ReactNode } from 'react'
import { useStorefront } from '../hooks/useStorefront'
import { StorefrontContext } from './StorefrontContext'

export function StorefrontProvider({ children }: { children: ReactNode }) {
  const storefront = useStorefront()
  return (
    <StorefrontContext.Provider value={storefront}>
      {children}
    </StorefrontContext.Provider>
  )
}
