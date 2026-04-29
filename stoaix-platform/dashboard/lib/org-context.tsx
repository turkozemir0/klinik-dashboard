'use client'

import { createContext, useContext } from 'react'

interface OrgContextValue {
  orgId: string | null
  orgName: string
  userRole: string | null
  userId: string
  isSuperAdmin: boolean
}

const OrgContext = createContext<OrgContextValue>({
  orgId: null,
  orgName: '',
  userRole: null,
  userId: '',
  isSuperAdmin: false,
})

export function OrgProvider({ children, value }: { children: React.ReactNode; value: OrgContextValue }) {
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}

export function useOrg() {
  return useContext(OrgContext)
}
