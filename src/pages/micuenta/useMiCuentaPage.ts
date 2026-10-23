import { useState, type FormEvent } from 'react'
import { useStore, type StoreCustomer } from '../../context/StoreContext'

export function useMiCuentaPage() {
  const { customer, orders, openAuth, logout, updateCustomer } = useStore()
  const [editing, setEditing] = useState(false)
  const [profile, setProfile] = useState<StoreCustomer | null>(customer)
  const [error, setError] = useState('')

  const setField = <K extends keyof StoreCustomer>(key: K, value: StoreCustomer[K]) => {
    setProfile((current) => current ? {
      ...current,
      [key]: value,
      ...(key === 'district' || key === 'province' || key === 'department' ? { ubigeo: '' } : {}),
    } : current)
  }

  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile) return
    const name = `${profile.firstNames} ${profile.lastNames}`.trim()
    if (!name || !profile.email || !profile.phone || !profile.documentNumber) {
      setError('Completa nombres, correo, teléfono y documento.')
      return
    }
    updateCustomer({ ...profile, name })
    setError('')
    setEditing(false)
  }

  function cancelEditing() {
    setProfile(customer)
    setError('')
    setEditing(false)
  }

  function startEditing() {
    setProfile(customer)
    setEditing(true)
  }

  return {
    cancelEditing,
    customer,
    editing,
    error,
    logout,
    openAuth,
    orders,
    profile,
    saveProfile,
    setField,
    startEditing,
  }
}
