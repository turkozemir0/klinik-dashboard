'use client'

import { useState } from 'react'
import { Plus, Building2, Users, Settings, BookOpen, AlertTriangle, UserPlus, Upload, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useT } from '@/lib/lang-context'
import NewOrgModal from './NewOrgModal'
import OrgSettingsModal from './OrgSettingsModal'
import InviteUserModal from './InviteUserModal'
import DeleteOrgModal from './DeleteOrgModal'
import N8nStatusWidget from './N8nStatusWidget'

interface Org {
  id: string
  name: string
  slug: string
  sector: string
  status: string
  updated_at: string
}

interface Props {
  orgs: Org[]
  countsByOrg: Record<string, number>
  kbCountsByOrg: Record<string, number>
}

const sectorColors: Record<string, string> = {
  education: 'bg-blue-100 text-blue-700',
  clinic: 'bg-green-100 text-green-700',
  real_estate: 'bg-amber-100 text-amber-700',
  tech_service: 'bg-purple-100 text-purple-700',
  other: 'bg-slate-100 text-slate-600',
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  onboarding: 'bg-amber-100 text-amber-700',
  inactive: 'bg-red-100 text-red-700',
}

export default function AdminClient({ orgs: initialOrgs, countsByOrg, kbCountsByOrg }: Props) {
  const t = useT()
  const [orgs, setOrgs] = useState(initialOrgs)
  const [showNewModal, setShowNewModal] = useState(false)
  const [settingsOrg, setSettingsOrg] = useState<{ id: string; name: string } | null>(null)
  const [inviteOrg, setInviteOrg] = useState<{ id: string; name: string } | null>(null)
  const [deleteOrg, setDeleteOrg] = useState<{ id: string; name: string } | null>(null)

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t.adminTitle}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t.allOrgs}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/admin/import"
            className="flex items-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Upload size={16} />
            Lead İçe Aktar
          </Link>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Yeni Müşteri Ekle
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Building2 size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Toplam Org</p>
            <p className="text-2xl font-bold text-slate-900">{orgs.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
            <Users size={18} />
          </div>
          <div>
            <p className="text-xs text-slate-500">Toplam Lead</p>
            <p className="text-2xl font-bold text-slate-900">{Object.values(countsByOrg).reduce((a, b) => a + b, 0)}</p>
          </div>
        </div>
      </div>

      {/* Sistem Durumu */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sistem Durumu</p>
        <N8nStatusWidget />
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Organizasyon</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.sector}</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.status}</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.leadsCount}</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bilgi Bankası</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.lastActivity}</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orgs.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">{t.noData}</td></tr>
            ) : orgs.map(org => (
              <tr key={org.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-800">{org.name}</p>
                  <p className="text-xs text-slate-400">{org.slug}</p>
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sectorColors[org.sector] || 'bg-slate-100 text-slate-600'}`}>
                    {org.sector}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[org.status] || 'bg-slate-100 text-slate-600'}`}>
                    {org.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-700 font-medium">{countsByOrg[org.id] ?? 0}</td>
                <td className="px-5 py-3">
                  {(() => {
                    const count = kbCountsByOrg[org.id] ?? 0
                    if (count === 0) return (
                      <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                        <AlertTriangle size={12} />
                        Boş
                      </span>
                    )
                    if (count < 5) return (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                        <AlertTriangle size={12} />
                        {count} öğe
                      </span>
                    )
                    return <span className="text-xs text-slate-600 font-medium">{count} öğe</span>
                  })()}
                </td>
                <td className="px-5 py-3 text-xs text-slate-400">
                  {new Date(org.updated_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/admin/knowledge/${org.id}`}
                      className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      title="Bilgi Bankası"
                    >
                      <BookOpen size={15} />
                    </Link>
                    <button
                      onClick={() => setSettingsOrg({ id: org.id, name: org.name })}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Entegrasyon Ayarları"
                    >
                      <Settings size={15} />
                    </button>
                    <button
                      onClick={() => setInviteOrg({ id: org.id, name: org.name })}
                      className="p-1.5 text-slate-400 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      title="Kullanıcı Davet Et"
                    >
                      <UserPlus size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteOrg({ id: org.id, name: org.name })}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Organizasyonu Sil"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNewModal && (
        <NewOrgModal
          onClose={() => setShowNewModal(false)}
        />
      )}

      {settingsOrg && (
        <OrgSettingsModal
          orgId={settingsOrg.id}
          orgName={settingsOrg.name}
          onClose={() => setSettingsOrg(null)}
          onSaved={() => setSettingsOrg(null)}
        />
      )}

      {inviteOrg && (
        <InviteUserModal
          orgId={inviteOrg.id}
          orgName={inviteOrg.name}
          onClose={() => setInviteOrg(null)}
        />
      )}

      {deleteOrg && (
        <DeleteOrgModal
          orgId={deleteOrg.id}
          orgName={deleteOrg.name}
          onClose={() => setDeleteOrg(null)}
          onDeleted={(orgId) => setOrgs(prev => prev.filter(o => o.id !== orgId))}
        />
      )}
    </div>
  )
}
