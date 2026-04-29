/**
 * Promptfoo Custom Provider — Chat Agent (WhatsApp/Instagram)
 *
 * Calls the /api/evals/test-agent endpoint with channel=whatsapp.
 * Same pipeline as voice but with chat-specific guardrails.
 */

import type { ApiProvider, ProviderResponse } from 'promptfoo'

export default class ChatAgentProvider implements ApiProvider {
  private apiUrl: string

  constructor(private options: { config?: { apiUrl?: string }; id?: string } = {}) {
    this.apiUrl = options.config?.apiUrl || 'http://localhost:3000'
  }

  id() {
    return this.options.id || 'clinic-chat'
  }

  async callApi(prompt: string, context?: any): Promise<ProviderResponse> {
    const vars = context?.vars || {}

    const isTemplateMode = !!vars.templateMode || !!vars.clinicType
    const payload: Record<string, any> = {
      message: prompt,
      channel: vars.channel || 'whatsapp',
      scenario: vars.scenario || 'inbound',
      conversationHistory: vars.history || [],
      model: vars.model || 'claude-sonnet-4-6',
    }

    if (isTemplateMode) {
      payload.templateMode = true
      payload.clinicType = vars.clinicType || 'other'
      payload.clinicName = vars.clinicName || 'Test Kliniği'
      payload.personaName = vars.personaName || 'Asistan'
    } else {
      payload.orgId = vars.orgId || 'a1b2c3d4-0000-0000-0000-000000000001'
    }

    try {
      const res = await fetch(`${this.apiUrl}/api/evals/test-agent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        return { error: `API returned ${res.status}: ${await res.text()}` }
      }

      const data = await res.json()
      return {
        output: data.reply,
        tokenUsage: {
          prompt: data.usage?.inputTokens || 0,
          completion: data.usage?.outputTokens || 0,
          total: (data.usage?.inputTokens || 0) + (data.usage?.outputTokens || 0),
        },
      }
    } catch (err: any) {
      return { error: `Provider error: ${err.message}` }
    }
  }
}
