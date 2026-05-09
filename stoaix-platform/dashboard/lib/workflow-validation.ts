import { getTemplate } from './workflow-templates'
import type { ConfigField } from './workflow-types'

export interface ValidationIssue {
  field: string
  severity: 'error' | 'warning'
  message_tr: string
  message_en: string
}

export interface ValidationResult {
  valid: boolean
  issues: ValidationIssue[]
}

/**
 * Validates workflow config against template rules.
 * Used both server-side (API guard) and client-side (live feedback).
 */
export function validateWorkflowConfig(
  templateId: string,
  config: Record<string, any>
): ValidationResult {
  const template = getTemplate(templateId)
  if (!template) {
    return { valid: false, issues: [{ field: '_template', severity: 'error', message_tr: 'Şablon bulunamadı', message_en: 'Template not found' }] }
  }

  const issues: ValidationIssue[] = []

  for (const field of template.config_fields) {
    const value = config[field.key] ?? field.default
    validateField(field, value, config, issues)
  }

  // Cross-field: working_hours_start must be before working_hours_end
  const hasWorkingHours = template.config_fields.some(f => f.key === 'working_hours_start')
  if (hasWorkingHours) {
    const start = config.working_hours_start ?? '09:00'
    const end = config.working_hours_end ?? '19:00'
    if (start && end && start >= end) {
      issues.push({
        field: 'working_hours_end',
        severity: 'error',
        message_tr: 'Bitiş saati başlangıçtan sonra olmalı',
        message_en: 'End time must be after start time',
      })
    }
  }

  // C2: no_reply_hours preset validation
  if (templateId === 'chatbot_followup') {
    const noReply = Number(config.no_reply_hours ?? 4)
    if (![2, 4, 6, 12, 24].includes(noReply)) {
      issues.push({ field: 'no_reply_hours', severity: 'error', message_tr: 'Geçersiz saat değeri', message_en: 'Invalid hour value' })
    }
  }

  // C7: specific range validations
  if (templateId === 'reactivation_chat') {
    const inactive = Number(config.inactive_days ?? 30)
    if (inactive < 30) {
      issues.push({ field: 'inactive_days', severity: 'error', message_tr: 'Minimum 30 gün olmalı', message_en: 'Minimum 30 days' })
    }
    const daily = Number(config.daily_limit ?? 50)
    if (daily < 1 || daily > 200) {
      issues.push({ field: 'daily_limit', severity: 'error', message_tr: 'Günlük limit 1-200 arası olmalı', message_en: 'Daily limit must be 1-200' })
    }
    const cooldown = Number(config.cooldown_days ?? 30)
    if (cooldown < 7) {
      issues.push({ field: 'cooldown_days', severity: 'error', message_tr: 'Minimum 7 gün olmalı', message_en: 'Minimum 7 days' })
    }
  }

  // Cross-field danger combos
  for (const field of template.config_fields) {
    if (!field.danger_combo) continue
    for (const combo of field.danger_combo) {
      const matches = Object.entries(combo.when).every(([k, v]) => {
        const actual = config[k] ?? getDefault(template.config_fields, k)
        return String(actual) === String(v)
      })
      if (matches) {
        issues.push({
          field: field.key,
          severity: 'warning',
          message_tr: combo.message_tr,
          message_en: combo.message_en,
        })
      }
    }
  }

  const hasError = issues.some(i => i.severity === 'error')
  return { valid: !hasError, issues }
}

function validateField(
  field: ConfigField,
  value: any,
  config: Record<string, any>,
  issues: ValidationIssue[]
) {
  // Number range validation
  if (field.type === 'number') {
    const num = Number(value)
    if (isNaN(num)) {
      issues.push({ field: field.key, severity: 'error', message_tr: 'Geçerli bir sayı girin', message_en: 'Enter a valid number' })
      return
    }
    if (field.min !== undefined && num < field.min) {
      issues.push({ field: field.key, severity: 'error', message_tr: `Minimum ${field.min}`, message_en: `Minimum ${field.min}` })
    }
    if (field.max !== undefined && num > field.max) {
      issues.push({ field: field.key, severity: 'error', message_tr: `Maksimum ${field.max}`, message_en: `Maximum ${field.max}` })
    }
    // Warning threshold
    if (field.warning_threshold) {
      if (field.warning_threshold.above !== undefined && num >= field.warning_threshold.above) {
        issues.push({ field: field.key, severity: 'warning', message_tr: field.warning_threshold.message_tr, message_en: field.warning_threshold.message_en })
      }
      if (field.warning_threshold.below !== undefined && num <= field.warning_threshold.below) {
        issues.push({ field: field.key, severity: 'warning', message_tr: field.warning_threshold.message_tr, message_en: field.warning_threshold.message_en })
      }
    }
  }

  // Preset values validation (for select fields with preset_values)
  if (field.preset_values && value !== undefined && value !== '') {
    const strValue = String(value)
    const allowed = field.preset_values.map(String)
    if (!allowed.includes(strValue)) {
      issues.push({ field: field.key, severity: 'error', message_tr: 'Geçersiz değer', message_en: 'Invalid value' })
    }
  }
}

function getDefault(fields: ConfigField[], key: string): any {
  const f = fields.find(f => f.key === key)
  return f?.default
}
