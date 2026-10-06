import { createContext } from 'react'
import { useStorefront } from '../hooks/useStorefront'

type StorefrontContextValue = ReturnType<typeof useStorefront>

export const StorefrontContext = createContext<StorefrontContextValue | null>(null)
