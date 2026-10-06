import { useCallback, useEffect, useState } from 'react'
import { storeApi } from '../../../lib/api'
import type { CustomerProfile } from '../../../types/profile'
import type { CustomerSession } from '../../../types/store'

export function useCustomerProfile(customer: CustomerSession) {
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProfile = useCallback(async () => {
    try {
      setProfile(await storeApi.getMyProfile(customer.token))
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar tu perfil.')
    } finally {
      setLoading(false)
    }
  }, [customer.token])

  useEffect(() => {
    let active = true
    storeApi.getMyProfile(customer.token)
      .then((result) => {
        if (active) setProfile(result)
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'No se pudo cargar tu perfil.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [customer.token])

  const refresh = useCallback(() => {
    setLoading(true)
    setError('')
    void loadProfile()
  }, [loadProfile])

  return { profile, loading, error, refresh }
}
