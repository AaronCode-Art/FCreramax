import { useContext } from 'react'
import { StorefrontContext } from '../context/StorefrontContext'

export function useStorefrontContext() {
  const context = useContext(StorefrontContext)
  if (!context) {
    throw new Error('useStorefrontContext debe usarse dentro de StorefrontProvider')
  }
  return context
}
