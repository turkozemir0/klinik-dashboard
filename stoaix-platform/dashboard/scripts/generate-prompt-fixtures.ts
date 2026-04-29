/**
 * TS → JSON prompt fixture generator.
 *
 * Reads agent-templates.ts (single source of truth) and generates
 * prompt-fixtures.json for the Python eval test suite.
 *
 * Usage:
 *   cd dashboard && npx tsx scripts/generate-prompt-fixtures.ts
 */

import { createHash } from 'crypto'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

import { buildClinicPlaybookDefaults } from '../lib/agent-templates'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const CLINIC_TYPES = [
  'hair_transplant',
  'dental',
  'medical_aesthetics',
  'surgical_aesthetics',
  'physiotherapy',
  'ophthalmology',
  'general_practice',
  'other',
]

// Source file hash for sync guard
const sourceFile = resolve(__dirname, '../lib/agent-templates.ts')
const sourceContent = readFileSync(sourceFile, 'utf-8')
const sourceHash = createHash('sha256').update(sourceContent).digest('hex')

interface FixtureBlock {
  keywords: string[]
  response: string
}

interface FixtureEntry {
  system_prompt_template: string
  opening_message: string
  hard_blocks: FixtureBlock[]
  few_shot_examples: { user: string; assistant: string }[]
  no_kb_match: string
  features: { calendar_booking: boolean; model: string }
}

interface PromptFixtures {
  _meta: {
    generated_at: string
    source_file: string
    source_hash: string
  }
  clinic_types: string[]
  voice: Record<string, FixtureEntry>
  chat: Record<string, FixtureEntry>
}

const fixtures: PromptFixtures = {
  _meta: {
    generated_at: new Date().toISOString(),
    source_file: 'dashboard/lib/agent-templates.ts',
    source_hash: sourceHash,
  },
  clinic_types: CLINIC_TYPES,
  voice: {},
  chat: {},
}

function splitKeywords(kwString: string): string[] {
  return kwString.split(/\s*,\s*/).filter(Boolean)
}

for (const ct of CLINIC_TYPES) {
  // Voice channel (calendar=true, default production scenario)
  const voice = buildClinicPlaybookDefaults(
    '{KLINIK_ADI}', '{PERSONA_ADI}', 'voice', ct, true
  )
  fixtures.voice[ct] = {
    system_prompt_template: voice.systemPrompt,
    opening_message: voice.openingMessage,
    hard_blocks: voice.blocks.map(b => ({
      keywords: splitKeywords(b.keywords),
      response: b.response,
    })),
    few_shot_examples: voice.fewShots,
    no_kb_match: voice.noKbMatch,
    features: voice.features,
  }

  // Chat/WhatsApp channel
  const chat = buildClinicPlaybookDefaults(
    '{KLINIK_ADI}', '{PERSONA_ADI}', 'whatsapp', ct
  )
  fixtures.chat[ct] = {
    system_prompt_template: chat.systemPrompt,
    opening_message: chat.openingMessage,
    hard_blocks: chat.blocks.map(b => ({
      keywords: splitKeywords(b.keywords),
      response: b.response,
    })),
    few_shot_examples: chat.fewShots,
    no_kb_match: chat.noKbMatch,
    features: chat.features,
  }
}

// Write output
const outPath = resolve(__dirname, '../../voice-agent/tests/eval/prompt-fixtures.json')
writeFileSync(outPath, JSON.stringify(fixtures, null, 2) + '\n', 'utf-8')

console.log(`Generated: voice-agent/tests/eval/prompt-fixtures.json`)
console.log(`Source hash: ${sourceHash.slice(0, 16)}...`)
console.log(`Clinic types: ${CLINIC_TYPES.length}`)
console.log(`Voice entries: ${Object.keys(fixtures.voice).length}`)
console.log(`Chat entries: ${Object.keys(fixtures.chat).length}`)
