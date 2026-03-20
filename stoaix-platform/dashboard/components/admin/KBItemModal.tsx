'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Loader2 } from 'lucide-react'
import type { KnowledgeItem } from '@/lib/types'
import { t } from '@/lib/i18n'
import { getSchemasForSector, getSchema, type FieldDef } from '@/lib/kb-schemas'

interface Props {
  orgId: string
  sector: string
  item?: KnowledgeItem
  onClose: () => void
  onSaved: (item: KnowledgeItem) => void
}

export default function KBItemModal({ orgId, sector, item, onClose, onSaved }: Props) {
  const isEdit = !!item
  const availableSchemas = getSchemasForSector(sector)

  const [itemType, setItemType] = useState(item?.item_type || availableSchemas[0]?.type || 'faq')
  const [title, setTitle] = useState(item?.title || '')
  const [tags, setTags] = useState(item?.tags.join(', ') || '')
  const [isActive, setIsActive] = useState(item?.is_active !== false)
  const [formData, setFormData] = useState<Record<string, any>>(item?.data || {})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const schema = getSchema(itemType)

  // Reset form data when item type changes (unless editing)
  useEffect(() => {
    if (!isEdit) {
      setFormData({})
      // Auto-fill title based on type
      setTitle('')
    }
  }, [itemType, isEdit])

  function setField(name: string, value: any) {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  function getFieldValue(name: string): any {
    return formData[name] ?? ''
  }

  // Table row management
  function addTableRow(fieldName: string, columns: FieldDef['columns']) {
    const emptyRow: Record<string, any> = {}
    columns?.forEach(col => { emptyRow[col.name] = '' })
    const rows = (formData[fieldName] as any[] || [])
    setField(fieldName, [...rows, emptyRow])
  }

  function updateTableRow(fieldName: string, rowIndex: number, colName: string, value: any) {
    const rows = [...(formData[fieldName] as any[] || [])]
    rows[rowIndex] = { ...rows[rowIndex], [colName]: value }
    setField(fieldName, rows)
  }

  function removeTableRow(fieldName: string, rowIndex: number) {
    const rows = (formData[fieldName] as any[] || []).filter((_: any, i: number) => i !== rowIndex)
    setField(fieldName, rows)
  }

  function renderField(field: FieldDef) {
    const val = getFieldValue(field.name)

    if (field.type === 'text' || field.type === 'number') {
      return (
        <input
          type={field.type === 'number' ? 'number' : 'text'}
          value={val}
          onChange={e => setField(field.name, field.type === 'number' ? e.target.valueAsNumber || '' : e.target.value)}
          placeholder={field.placeholder}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      )
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          value={val}
          onChange={e => setField(field.name, e.target.value)}
          placeholder={field.placeholder}
          rows={3}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      )
    }

    if (field.type === 'select') {
      return (
        <select
          value={val}
          onChange={e => setField(field.name, e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="">Seçin...</option>
          {field.options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )
    }

    if (field.type === 'tags') {
      return (
        <input
          type="text"
          value={Array.isArray(val) ? val.join(', ') : val}
          onChange={e => {
            const arr = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
            setField(field.name, arr.length > 0 || e.target.value.endsWith(',') ? arr : e.target.value)
          }}
          placeholder={field.placeholder || 'Virgülle ayır...'}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      )
    }

    if (field.type === 'array') {
      const arr: string[] = Array.isArray(val) ? val : []
      return (
        <input
          type="text"
          value={arr.join(', ')}
          onChange={e => setField(field.name, e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
          placeholder={field.placeholder || 'Virgülle ayır...'}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      )
    }

    if (field.type === 'table' && field.columns) {
      const rows: any[] = Array.isArray(val) ? val : []
      return (
        <div className="space-y-2">
          {rows.length > 0 && (
            <div className="overflow-x-auto rounded border border-slate-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {field.columns.map(col => (
                      <th key={col.name} className="px-2 py-2 text-left font-medium text-slate-600">{col.label}</th>
                    ))}
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="border-b border-slate-100 last:border-0">
                      {field.columns!.map(col => (
                        <td key={col.name} className="px-1 py-1">
                          {col.type === 'select' ? (
                            <select
                              value={row[col.name] || ''}
                              onChange={e => updateTableRow(field.name, rowIdx, col.name, e.target.value)}
                              className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                            >
                              <option value="">—</option>
                              {col.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={col.type === 'number' ? 'number' : 'text'}
                              value={row[col.name] || ''}
                              onChange={e => updateTableRow(field.name, rowIdx, col.name, col.type === 'number' ? e.target.valueAsNumber || '' : e.target.value)}
                              className="w-full border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                            />
                          )}
                        </td>
                      ))}
                      <td className="px-1 py-1">
                        <button
                          type="button"
                          onClick={() => removeTableRow(field.name, rowIdx)}
                          className="text-slate-300 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <button
            type="button"
            onClick={() => addTableRow(field.name, field.columns!)}
            className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
          >
            <Plus size={12} />
            Satır Ekle
          </button>
        </div>
      )
    }

    return null
  }

  // Normalize tags/array fields before submit
  function normalizeFormData(data: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {}
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === 'string' && v.includes(',')) {
        result[k] = v.split(',').map(s => s.trim()).filter(Boolean)
      } else {
        result[k] = v
      }
    }
    return result
  }

  async function handleSave() {
    if (!title.trim()) { setError('Başlık zorunlu'); return }
    setSaving(true)
    setError('')

    const normalizedData = normalizeFormData(formData)
    const payload = {
      title: title.trim(),
      item_type: itemType,
      data: normalizedData,
      tags: tags.split(',').map(s => s.trim()).filter(Boolean),
      is_active: isActive,
      organization_id: orgId,
    }

    try {
      const url = isEdit ? `/api/knowledge/${item!.id}` : '/api/knowledge'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Kayıt başarısız')
      }
      const saved = await res.json()
      onSaved(saved)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {isEdit ? 'KB Kaydını Düzenle' : 'Yeni KB Kaydı'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Item Type */}
          {!isEdit && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tür</label>
              <select
                value={itemType}
                onChange={e => setItemType(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {availableSchemas.map(({ type, schema }) => (
                  <option key={type} value={type}>{schema.label}</option>
                ))}
              </select>
            </div>
          )}

          {isEdit && (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tür</label>
              <span className="inline-block px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm">{schema?.label || itemType}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Başlık *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="KB kaydının başlığı..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Schema Fields */}
          {schema?.fields.map(field => (
            <div key={field.name}>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                {field.label}
                {field.required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              {renderField(field)}
            </div>
          ))}

          {/* Tags */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Etiketler (virgülle ayır)</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="polonya, tıp, yüksek lisans..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Is Active */}
          <div className="flex items-center gap-3">
            <label className="text-xs font-medium text-slate-600">Aktif</label>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isActive ? 'bg-brand-500' : 'bg-slate-200'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {saving && (
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              AI ile açıklama üretiliyor ve embedding oluşturuluyor...
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 font-medium"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Kaydediliyor...' : t.save}
          </button>
        </div>
      </div>
    </div>
  )
}
