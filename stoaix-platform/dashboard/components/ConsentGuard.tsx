'use client'

import { useState, useEffect } from 'react'
import ConsentModal from './ConsentModal'

interface Props {
  children: React.ReactNode
}

export default function ConsentGuard({ children }: Props) {
  const [loading, setLoading] = useState(true)
  const [needsConsent, setNeedsConsent] = useState(false)

  useEffect(() => {
    fetch('/api/consent')
      .then(r => r.json())
      .then(d => {
        setNeedsConsent(!d.consented)
        setLoading(false)
      })
      .catch(() => {
        // Hata durumunda erişimi bloklamıyoruz
        setLoading(false)
      })
  }, [])

  if (loading) return <>{children}</>

  return (
    <>
      {children}
      {needsConsent && <ConsentModal onAccepted={() => setNeedsConsent(false)} />}
    </>
  )
}
