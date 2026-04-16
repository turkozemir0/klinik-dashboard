const fs = require('fs')
const path = require('path')
const { createClient } = require('../dashboard/node_modules/@supabase/supabase-js')

const ORG_ID = '2ab7fa57-8c37-4524-aa25-eba571ba7fbe'
const ORG_NAME = 'Kaya Dent Clinic'
const WEBSITE = 'https://kayadentclinic.com/'

function loadEnv() {
  const raw = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i !== -1) process.env[t.slice(0, i)] = t.slice(i + 1)
  }
}

async function embed(text) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text, dimensions: 1536 }),
  })
  if (!res.ok) throw new Error(`Embedding failed: ${res.status} ${await res.text()}`)
  return (await res.json()).data[0].embedding
}

function kb(item_type, title, description_for_ai, data = {}, tags = []) {
  return { item_type, title, description_for_ai, data, tags, is_active: true }
}

const kbItems = [
  kb('general', 'Clinic profile', 'Kaya Dent Clinic is a dental polyclinic in Salihli, Manisa, Turkey. The clinic presents itself as a family dental clinic that provides reliable dental care with a patient-focused approach. The website says Kaya Dent was founded in 2021 by Dentist Nurten Kaya. The assistant should position the clinic as a local dental clinic in Salihli and avoid making unsupported price or guarantee claims.', { founded: 2021, founder: 'Dentist Nurten Kaya', website: WEBSITE }, ['clinic', 'about', 'salihli']),
  kb('office_location', 'Address and contact details', 'Kaya Dent Clinic address: Yilmaz Mahallesi, Avar Caddesi No:84/B, Salihli, Manisa, Turkey. Phone: 0236 715 22 77. Mobile/WhatsApp-style contact number on the website: +90 541 715 22 77. Email: info@kayadent.com. Website: https://kayadentclinic.com/. Current onboarding working hours: Monday to Friday 09:00-18:00, Saturday 10:00-15:00.', { city: 'Manisa', district: 'Salihli', address: 'Yilmaz Mahallesi, Avar Caddesi No:84/B, Salihli, Manisa, Turkey', phones: ['0236 715 22 77', '+90 541 715 22 77'], email: 'info@kayadent.com', working_hours: { weekdays: '09:00-18:00', saturday: '10:00-15:00' }, website: WEBSITE }, ['address', 'contact', 'phone', 'salihli']),
  kb('team_member', 'Dentist Nurten Kaya', 'Dentist Nurten Kaya is listed on the website as the founder of Kaya Dent Clinic. She graduated from Ege University Faculty of Dentistry in 2008 and founded Kaya Dent in 2021. The assistant may mention her as the founder, but must not promise a specific appointment with her.', { name: 'Dt. Nurten Kaya', role: 'Founder dentist', graduation: 'Ege University Faculty of Dentistry, 2008' }, ['team', 'dentist', 'founder']),
  kb('team_member', 'Dentist Muhammed Enes Kersin', 'Dentist Muhammed Enes Kersin is listed on the website as a dentist at Kaya Dent Clinic. The website says he graduated from Necmettin Erbakan University Faculty of Dentistry in 2023. The assistant may mention him as part of the clinic team, but must not assign a case to him or guarantee availability.', { name: 'Dt. Muhammed Enes Kersin', graduation: 'Necmettin Erbakan University Faculty of Dentistry, 2023' }, ['team', 'dentist']),
  kb('service', 'Dental implant treatment', 'Kaya Dent Clinic lists implant treatment as a service. Dental implants are artificial tooth roots placed into the jawbone to support replacement teeth for missing teeth. Suitability depends on examination, x-ray, bone condition, general health, and dentist evaluation. The assistant must not diagnose remotely or guarantee candidacy, healing time, or final price.', { service: 'Implant treatment' }, ['implant', 'missing teeth']),
  kb('service', 'Zirconium crowns', 'Kaya Dent Clinic lists zirconium crown treatment as a service. Zirconium crowns are commonly used for aesthetic and durable dental restorations. The assistant can explain that they may be considered for smile aesthetics, tooth shape, and restoration needs, but final suitability depends on dentist evaluation.', { service: 'Zirconium crown' }, ['zirconium', 'crowns', 'aesthetic']),
  kb('service', 'Porcelain laminate veneers', 'Kaya Dent Clinic lists porcelain laminate veneers as a service. Porcelain laminates are thin aesthetic restorations placed on the front surface of teeth in suitable cases. They may be used for smile aesthetics, color, shape, or minor spacing concerns. The assistant must not promise that every patient is suitable or that no tooth preparation will be needed.', { service: 'Porcelain laminate veneers' }, ['laminate', 'veneers', 'aesthetic']),
  kb('service', 'Aesthetic fillings', 'Kaya Dent Clinic lists aesthetic filling treatment as a service. Aesthetic fillings can be used to restore decayed, broken, or worn teeth while matching the natural tooth color. Suitability and material choice depend on dentist examination.', { service: 'Aesthetic fillings' }, ['filling', 'aesthetic']),
  kb('service', 'Smile design', 'Kaya Dent Clinic lists smile design as a service. Smile design is an aesthetic planning process that considers the teeth, gums, lips, and facial harmony. The assistant can ask what the patient wants to improve in their smile and offer to arrange a consultation.', { service: 'Smile design' }, ['smile design', 'aesthetic']),
  kb('service', 'Teeth whitening', 'Kaya Dent Clinic lists teeth whitening as a service. Teeth whitening is used to improve tooth color in suitable cases. The assistant should mention that sensitivity risk and suitability need dentist evaluation, especially if the patient has restorations, gum issues, or sensitivity.', { service: 'Teeth whitening' }, ['whitening', 'aesthetic']),
  kb('service', 'Orthodontics', 'Kaya Dent Clinic lists orthodontics as a service. Orthodontics treats tooth alignment and bite concerns. The assistant can ask whether the patient is interested in braces or alignment treatment and collect age, main concern, and preferred appointment time, but must not estimate treatment duration without examination.', { service: 'Orthodontics' }, ['orthodontics', 'braces']),
  kb('service', 'Root canal and filling treatment', 'Kaya Dent Clinic lists filling and root canal treatment as a service. Root canal treatment may be needed when the inner part of a tooth is affected by decay, infection, or trauma. The assistant should avoid diagnosing and should recommend examination for pain, swelling, or sensitivity.', { service: 'Filling and root canal treatment' }, ['root canal', 'filling', 'pain']),
  kb('service', 'Gum treatments', 'Kaya Dent Clinic lists gum treatments as a service. Gum treatments can be relevant for bleeding gums, gum recession, swelling, and periodontal problems. The assistant should advise examination, especially if the patient reports bleeding, swelling, bad breath, or loose teeth.', { service: 'Gum treatments' }, ['gum', 'periodontal']),
  kb('service', 'Surgical tooth extractions', 'Kaya Dent Clinic lists surgical tooth extractions as a service. Surgical extraction may be relevant for impacted, broken, or complicated teeth, including wisdom teeth in some cases. The assistant must not assess extraction need remotely and should recommend examination and x-ray.', { service: 'Surgical tooth extractions' }, ['surgery', 'extraction', 'wisdom tooth']),
  kb('service', 'Pediatric dentistry', 'Kaya Dent Clinic lists pediatric dentistry as a service. Pediatric dentistry focuses on children dental care, preventive checkups, tooth decay, and child-friendly dental treatment. The assistant should collect the child age and main concern if a parent contacts the clinic.', { service: 'Pediatric dentistry' }, ['children', 'pediatric']),
  kb('service', 'Digital dentistry', 'Kaya Dent Clinic lists digital dentistry as a service. Digital dentistry may include digital planning and modern dental technologies. The assistant can mention digital workflow generally but should not invent specific devices unless confirmed by the clinic.', { service: 'Digital dentistry' }, ['digital dentistry', 'technology']),
  kb('service', 'Treatment under general anesthesia', 'Kaya Dent Clinic lists treatments under general anesthesia as a service. The assistant should explain that this may be considered in selected cases and requires dentist/medical evaluation. Do not recommend anesthesia type, guarantee suitability, or give medical clearance remotely.', { service: 'Treatment under general anesthesia' }, ['general anesthesia', 'sedation']),
  kb('pricing', 'Pricing policy', 'The public website content reviewed does not show a detailed price list. The assistant must not invent treatment prices. For any price question, explain that the clinic can provide accurate pricing after examination and case evaluation. If the user wants, collect name, phone, treatment interest, and preferred appointment time for follow-up.', { public_price_list_found: false }, ['pricing', 'quote', 'cost']),
  kb('policy', 'Appointment and lead collection flow', 'For appointment requests, collect full name, phone number, treatment interest, main complaint, preferred day/time, and whether the patient has pain or urgency. Current onboarding information says appointments are usually arranged within 24 hours, but do not guarantee a specific slot unless confirmed by the clinic team.', { fields: ['full_name', 'phone', 'treatment_interest', 'complaint', 'preferred_date', 'urgency'] }, ['appointment', 'intake']),
  kb('policy', 'Medical safety boundaries', 'The assistant must not diagnose, prescribe medication, interpret x-rays, or guarantee results. For severe pain, swelling, trauma, bleeding, fever, or suspected infection, advise the patient to contact the clinic directly or seek urgent dental/medical care. For treatment suitability and prices, route to dentist evaluation.', {}, ['safety', 'medical', 'guardrails']),
]

const basePrompt = `You are the English-language digital receptionist for Kaya Dent Clinic, a dental polyclinic in Salihli, Manisa, Turkey.

Use only verified clinic knowledge. Help patients with service information, appointment requests, and basic consultation routing. Collect lead details one by one: full name, phone number, treatment interest, main dental concern, urgency or pain status, and preferred appointment day/time.

Tone: warm, professional, calm, concise. Speak in English unless the user asks for another language. Do not sound generic. Do not ask multiple questions at once.

Pricing: the reviewed public website does not publish a detailed price list. Never invent prices. Say accurate pricing requires dentist examination and case evaluation.

Medical safety: do not diagnose, prescribe medication, interpret x-rays, or guarantee outcomes. For severe pain, swelling, trauma, bleeding, fever, or suspected infection, advise direct clinic contact or urgent dental/medical care.

If you do not know a verified answer, say so clearly and offer to pass the question to the clinic team.`

const whatsappPlaybook = {
  name: 'Kaya Dent Clinic - WhatsApp/Chat Assistant',
  channel: 'whatsapp',
  system_prompt_template: `${basePrompt}\n\nFor chat, keep replies to 2 to 5 sentences. If the patient wants an appointment, collect details and say the Kaya Dent Clinic team can follow up to confirm availability. Do not claim an appointment is confirmed unless an actual scheduling tool confirms it.`,
  fallback_responses: {
    no_kb_match: 'I do not have verified information for that. I can note your question and have the Kaya Dent Clinic team follow up.',
    off_topic: 'I can help with Kaya Dent Clinic dental services, appointment requests, and consultation details.',
    error: 'There is a short technical issue. You can contact Kaya Dent Clinic directly by phone: 0236 715 22 77.',
    kb_empty_3x: 'I do not want to guess on this. I can pass your question to the clinic team for a verified answer.',
  },
  handoff_triggers: { keywords: ['human', 'agent', 'doctor', 'dentist', 'call me', 'consultant', 'team'], frustration_keywords: ['not helpful', 'wrong', 'nonsense'], missing_required_after_turns: 10, kb_empty_consecutive: 3, qualified_fields: ['full_name', 'phone', 'treatment_interest'] },
  hard_blocks: [
    { trigger_id: 'medical_advice', keywords: ['diagnose', 'prescribe', 'antibiotic', 'painkiller', 'read my xray'], response: 'I cannot diagnose, read x-rays, or prescribe medication remotely. For clinical symptoms, please contact the clinic or seek urgent dental care if severe.' },
    { trigger_id: 'exact_price', keywords: ['exact price', 'final price', 'guaranteed price'], response: 'The public site does not list exact prices. Accurate pricing depends on dentist examination and your treatment plan.' },
  ],
  features: { calendar_booking: false },
  few_shot_examples: [
    { user: 'How much is an implant?', assistant: 'The public website does not list implant prices, so I do not want to guess. Implant pricing depends on examination, x-ray, bone condition, and the treatment plan. Would you like me to note your details for a consultation?' },
  ],
  opening_message: null,
}

const voicePlaybook = {
  ...whatsappPlaybook,
  name: 'Kaya Dent Clinic - Voice Receptionist',
  channel: 'voice',
  system_prompt_template: `${basePrompt}\n\nYou are on a live voice call. Keep answers very short and natural. Ask only one question at a time. Do not say bullet points or markdown. Opening: "Good day, Kaya Dent Clinic. How can I help you today?"`,
  fallback_responses: { ...whatsappPlaybook.fallback_responses, error: 'There is a short technical issue. Please contact the clinic directly by phone: zero two three six, seven one five, twenty two, seventy seven.' },
  features: { calendar_booking: false, voice_language: 'en', tts_voice_id: '' },
  opening_message: 'Good day, Kaya Dent Clinic. How can I help you today?',
}

const intakeFields = [
  { key: 'full_name', label: 'Full name', type: 'text', priority: 'must', voice_prompt: 'May I have your full name, please?' },
  { key: 'phone', label: 'Phone number', type: 'phone', priority: 'must', voice_prompt: 'What is the best phone number for follow-up?' },
  { key: 'treatment_interest', label: 'Treatment interest', type: 'text', priority: 'must', voice_prompt: 'Which dental treatment are you interested in?' },
  { key: 'main_concern', label: 'Main dental concern', type: 'text', priority: 'should', voice_prompt: 'What is the main dental concern you would like help with?' },
  { key: 'urgency_or_pain', label: 'Urgency or pain status', type: 'text', priority: 'should', voice_prompt: 'Do you have pain or is this urgent?' },
  { key: 'preferred_date', label: 'Preferred appointment day/time', type: 'text', priority: 'should', voice_prompt: 'Which day or time would you prefer for an appointment?' },
]

async function upsertKnowledgeItem(sb, item) {
  const embedding = await embed(`${item.title}\n\n${item.description_for_ai}`)
  const payload = { organization_id: ORG_ID, ...item, embedding }
  const { data: existing, error: findError } = await sb.from('knowledge_items').select('id').eq('organization_id', ORG_ID).eq('item_type', item.item_type).eq('title', item.title).maybeSingle()
  if (findError) throw findError
  if (existing?.id) {
    const { error } = await sb.from('knowledge_items').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', existing.id)
    if (error) throw error
    return { action: 'updated', title: item.title }
  }
  const { error } = await sb.from('knowledge_items').insert(payload)
  if (error) throw error
  return { action: 'inserted', title: item.title }
}

async function deactivateOldKnowledge(sb) {
  const keep = kbItems.map(item => item.title)
  const { data, error } = await sb.from('knowledge_items').select('id,title').eq('organization_id', ORG_ID)
  if (error) throw error
  const oldRows = (data || []).filter(row => !keep.includes(row.title))
  if (!oldRows.length) return []
  const { error: updateError } = await sb.from('knowledge_items').update({ is_active: false, updated_at: new Date().toISOString() }).in('id', oldRows.map(row => row.id))
  if (updateError) throw updateError
  return oldRows.map(row => row.title)
}

async function upsertPlaybook(sb, playbook) {
  const { data: existing, error: findError } = await sb.from('agent_playbooks').select('id').eq('organization_id', ORG_ID).eq('channel', playbook.channel).order('version', { ascending: false }).limit(1).maybeSingle()
  if (findError) throw findError
  const payload = { organization_id: ORG_ID, version: 1, is_active: true, ...playbook, updated_at: new Date().toISOString() }
  if (existing?.id) {
    const { error } = await sb.from('agent_playbooks').update(payload).eq('id', existing.id)
    if (error) throw error
    return { action: 'updated', channel: playbook.channel }
  }
  const { error } = await sb.from('agent_playbooks').insert(payload)
  if (error) throw error
  return { action: 'inserted', channel: playbook.channel }
}

async function upsertIntakeSchema(sb, channel, name) {
  const { data: existing, error: findError } = await sb.from('intake_schemas').select('id').eq('organization_id', ORG_ID).eq('channel', channel).maybeSingle()
  if (findError) throw findError
  const payload = { organization_id: ORG_ID, channel, name, fields: intakeFields, is_active: true }
  if (existing?.id) {
    const { error } = await sb.from('intake_schemas').update(payload).eq('id', existing.id)
    if (error) throw error
    return { action: 'updated', channel }
  }
  const { error } = await sb.from('intake_schemas').insert(payload)
  if (error) throw error
  return { action: 'inserted', channel }
}

async function main() {
  loadEnv()
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const { data: org, error: orgReadError } = await sb.from('organizations').select('channel_config,ai_persona').eq('id', ORG_ID).maybeSingle()
  if (orgReadError) throw orgReadError
  if (!org) throw new Error(`Organization not found: ${ORG_ID}`)

  const cc = org.channel_config || {}
  const channelConfig = {
    ...cc,
    voice_inbound: { ...(cc.voice_inbound || {}), active: true, voice_language: 'en', tts_voice_id: (cc.voice_inbound || {}).tts_voice_id || '' },
    voice_outbound: { ...(cc.voice_outbound || {}), active: false, voice_language: 'en', tts_voice_id: (cc.voice_outbound || {}).tts_voice_id || '' },
    whatsapp: { ...(cc.whatsapp || {}), active: true, language: 'en' },
    instagram: { ...(cc.instagram || {}), active: false },
  }

  const { error: orgError } = await sb.from('organizations').update({
    name: ORG_NAME,
    slug: 'kaya-dent-clinic',
    sector: 'clinic',
    status: 'active',
    onboarding_status: 'completed',
    phone: '02367152277',
    email: 'info@kayadent.com',
    city: 'Manisa',
    country: 'TR',
    website: WEBSITE,
    timezone: 'Europe/Istanbul',
    ai_persona: { ...(org.ai_persona || {}), persona_name: 'Kaya Dent Receptionist', language: 'en', tone: 'warm-professional', never_hallucinate: true, fallback_instruction: 'Use only verified clinic knowledge. Do not diagnose, prescribe, interpret x-rays, guarantee outcomes, or invent prices.' },
    channel_config: channelConfig,
    working_hours: { weekdays: '09:00-18:00', saturday: '10:00-15:00', sunday: 'Closed', timezone: 'Europe/Istanbul' },
    updated_at: new Date().toISOString(),
  }).eq('id', ORG_ID)
  if (orgError) throw orgError

  const deactivated = await deactivateOldKnowledge(sb)
  const knowledge = []
  for (const item of kbItems) knowledge.push(await upsertKnowledgeItem(sb, item))
  const playbooks = [await upsertPlaybook(sb, whatsappPlaybook), await upsertPlaybook(sb, voicePlaybook)]
  const intake = [await upsertIntakeSchema(sb, 'whatsapp', 'Kaya Dent Clinic WhatsApp Lead Form'), await upsertIntakeSchema(sb, 'voice', 'Kaya Dent Clinic Voice Lead Form')]

  console.log(JSON.stringify({ organization_id: ORG_ID, organization_updated: true, deactivated, knowledge, playbooks, intake }, null, 2))
}

main().catch(err => { console.error(err); process.exit(1) })
