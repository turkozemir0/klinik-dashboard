const fs = require('fs')
const path = require('path')
const { createClient } = require('../dashboard/node_modules/@supabase/supabase-js')

const ORG_ID = 'a12d666e-d83e-482c-8a39-f7bc98c62433'
const ORG_NAME = 'Dental Excellence Turkey'
const WEBSITE = 'https://dentalexcellenceturkey.com/'

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
  kb('general', 'Clinic profile', 'Dental Excellence Turkey is a dental implant and cosmetic dentistry centre in Antalya, Turkey. It positions itself as a premium clinic for international dental patients, with a multi-disciplinary specialist team, modern digital dentistry technology, and attention to both function and aesthetics. Do not promise medical outcomes.', { website: WEBSITE }, ['clinic', 'about', 'antalya']),
  kb('office_location', 'Address and contact details', 'Address: Caglayan District, Barinaklar Boulevard No.66/A, 07230 Muratpasa, Antalya, Turkey. Phone and WhatsApp: +90 542 122 7780. Email: contact@dentalexcellenceturkey.com. Website: https://dentalexcellenceturkey.com/.', { city: 'Antalya', district: 'Muratpasa', address: 'Caglayan District, Barinaklar Boulevard No.66/A, 07230 Muratpasa, Antalya, Turkey', phones: ['+90 542 122 7780'], whatsapp: ['+90 542 122 7780'], email: 'contact@dentalexcellenceturkey.com', website: WEBSITE }, ['address', 'contact', 'whatsapp']),
  kb('general', 'Technology and planning', 'The clinic website mentions digital dentistry technology including digital x-ray, CAD/CAM, dental photography studio, smile design, x-rays, and dental photos for treatment planning. Use this as general clinic information only. Do not interpret x-rays or diagnose remotely.', { technologies: ['digital x-ray', 'CAD/CAM', 'dental photography studio', 'digital smile design'] }, ['technology', 'cadcam', 'smiledesign']),
  kb('team_member', 'Specialist team', 'The public website lists Dr. Fatih Erkun, DDS PhD, prosthodontist; Dr. Ozenc Erdemoglu, DDS PhD, prosthodontist; Dr. Safak Erkun, DDS, orthodontist; Dr. Turgay Dogan, DDS, endodontist; and Dr. Baris Kirpitoglu, DDS PhD, oral surgeon. Do not assign a specific doctor or guarantee availability.', { specialties: ['prosthodontics', 'orthodontics', 'endodontics', 'oral surgery'] }, ['team', 'doctors']),
  kb('service', 'Dental implants', 'Dental implants are offered for missing teeth. Public guide price: from GBP 400. Public timescale shown for implant placement: 1 day. FAQ says full implant treatment usually needs two visits: first about 5 days, second about 8 days, with 3 to 6 months healing depending on bone condition. Final suitability, timing, and price require specialist evaluation.', { price_from_gbp: 400, timescale: '1 day placement; full treatment commonly two visits plus healing' }, ['implant', 'price']),
  kb('service', 'All on 4 implants', 'All on 4 implants are offered for full-arch cases. Public guide price: from GBP 1,800 per jaw. Public timescale: 7 days. Suitability depends on x-ray, bone condition, and specialist evaluation. Do not say every patient qualifies.', { price_from_gbp: 1800, unit: 'per jaw', timescale: '7 days' }, ['allon4', 'implant', 'price']),
  kb('service', 'All on 6 implants', 'All on 6 implants are offered for full-arch dental restoration. Public guide price: from GBP 2,900 per jaw. Public timescale: 7 days. The specialist team should advise whether All on 4, All on 6, or another plan is more suitable after reviewing the case.', { price_from_gbp: 2900, unit: 'per jaw', timescale: '7 days' }, ['allon6', 'implant', 'price']),
  kb('service', 'Smile makeover and dental crowns', 'Smile makeover public guide price: from GBP 190, timescale 7 days. Dental crowns public guide price: from GBP 190, timescale 7 days. The about page says the clinic uses CAD/CAM and offers a 5-year warranty on dental crowns, bridges, and veneers. Final plan depends on tooth condition, bite, photos, and dentist examination.', { smile_makeover_from_gbp: 190, crowns_from_gbp: 190, timescale: '7 days', warranty: '5-year warranty on crowns, bridges, and veneers according to website' }, ['smilemakeover', 'crowns', 'price']),
  kb('service', 'Laminate veneers', 'Laminate veneers are offered for aesthetic smile improvement. Public guide price: from GBP 250. Public timescale: 7 days. FAQ describes porcelain laminate veneers as fast, not painful, and minimally invasive in many cases because modern veneers are thinner. Do not promise no pain or no preparation for every case.', { price_from_gbp: 250, timescale: '7 days' }, ['veneers', 'cosmetic', 'price']),
  kb('service', 'Invisalign', 'Invisalign is offered. Public guide price: from GBP 2,700. Public timescale: 6 days. Invisalign may help with alignment concerns, but suitability depends on orthodontic assessment.', { price_from_gbp: 2700, timescale: '6 days' }, ['invisalign', 'orthodontics', 'price']),
  kb('service', 'Teeth whitening and gum contouring', 'Teeth whitening public guide price: from GBP 250, timescale 1 day. Gum contouring public guide price: from GBP 265, timescale 1 day. These are cosmetic dental treatments; suitability and sensitivity risks require dentist assessment.', { teeth_whitening_from_gbp: 250, gum_contouring_from_gbp: 265, timescale: '1 day' }, ['whitening', 'gumcontouring', 'price']),
  kb('pricing', 'Public guide prices', 'Public guide starting prices: dental implants from GBP 400; All on 4 from GBP 1,800 per jaw; All on 6 from GBP 2,900 per jaw; smile makeover from GBP 190; laminate veneer from GBP 250; dental crowns from GBP 190; Invisalign from GBP 2,700; teeth whitening from GBP 250; gum contouring from GBP 265. These are not final quotes. Final price requires specialist evaluation with x-ray/photos.', { currency: 'GBP' }, ['pricing', 'cost', 'quote']),
  kb('policy', 'Dental tourism process', 'The website describes a 4-step process: send a recent panoramic x-ray and dental photos for a free quotation; travel and accommodation planning after the treatment plan is accepted; first appointment in Antalya with smile design, photographs, and x-rays; then treatment while the patient is in Antalya. Accommodation close to the clinic can be offered during treatment, but do not guarantee package details.', { steps: ['free quotation', 'travel and accommodation', 'first appointment', 'treatment in Antalya'] }, ['tourism', 'travel', 'quotation']),
  kb('faq', 'Why dental treatment in Turkey', 'The website says dental treatment in Turkey can be significantly lower priced than Europe while using high-quality materials and implant brands, partly because living and clinic operating costs are lower. Use this as a general answer and bring the conversation back to free case evaluation.', {}, ['faq', 'turkey', 'cost']),
  kb('faq', 'Dental implant duration', 'Typical implant process from the FAQ: two visits, about 5 days for the first visit and about 8 days for the second visit. Healing may vary from 3 to 6 months depending on bone condition. The specialist confirms the actual plan.', {}, ['faq', 'implant', 'duration']),
  kb('faq', 'Dental anxiety and sedation', 'The website says sedation options may help anxious patients, gag reflex, or longer/complicated treatment. The dentist decides which sedation type is suitable. Do not recommend a specific sedation type.', {}, ['faq', 'anxiety', 'sedation']),
  kb('faq', 'Digital Smile Design', 'Digital Smile Design evaluates teeth, gums, lips, and face as a whole. It can consider facial features, lip structure, gum levels, gender, skin color, and character to prepare a personalized plan. Offer to collect photos and x-ray for specialist evaluation.', {}, ['faq', 'smiledesign']),
  kb('faq', 'Veneer care', 'The website says porcelain veneers require similar maintenance to natural teeth and recommends good oral hygiene, brushing 3 times a day, and flossing once a day. Do not replace dentist-specific aftercare instructions.', {}, ['faq', 'veneers', 'aftercare']),
  kb('policy', 'Medical safety boundaries', 'The assistant must not diagnose, prescribe medication, interpret x-rays, or guarantee results. For pain, infection symptoms, swelling, bleeding, trauma, or urgent clinical concerns, recommend contacting the clinic directly or seeking urgent medical/dental care. For prices, share public starting prices only with a clear final-quote disclaimer.', {}, ['safety', 'medical', 'guardrails']),
]

const basePrompt = `You are the English-language digital receptionist for Dental Excellence Turkey, a dental implant and cosmetic dentistry clinic in Antalya, Turkey.

Use only verified clinic knowledge. Help international patients understand treatments, guide prices, travel process, and free consultation steps. Collect lead details one by one: full name, phone or WhatsApp, country or city, treatment interest, main concern, whether they have panoramic x-ray/photos, and preferred travel dates.

Tone: warm, professional, calm, concise. Speak in English unless the user clearly asks otherwise. Do not sound generic. Do not ask multiple questions at once.

Pricing: you may share public starting prices from the knowledge base, but always say they are guide prices, not final quotes. Never invent prices, discounts, packages, hotel names, flights, or appointment availability.

Medical safety: do not diagnose, prescribe medication, interpret x-rays, or guarantee results. For urgent pain, swelling, bleeding, trauma, or suspected infection, advise direct clinic contact or urgent dental/medical care.

If you do not know a verified answer, say so clearly and offer to pass the question to the clinic team.`

const whatsappPlaybook = {
  name: 'Dental Excellence Turkey - WhatsApp/Chat Assistant',
  channel: 'whatsapp',
  system_prompt_template: `${basePrompt}\n\nFor chat, keep replies to 2 to 5 sentences. Ask for x-ray/photos when useful. When enough details are collected, say: "Thank you, I have noted your details. The Dental Excellence Turkey team can review your case and follow up with a treatment plan estimate."`,
  fallback_responses: {
    no_kb_match: 'I do not have a verified answer for that. I can note your question and have the Dental Excellence Turkey team follow up.',
    off_topic: 'I can help with Dental Excellence Turkey treatments, prices, travel process, and consultation details.',
    error: 'There is a short technical issue. You can contact Dental Excellence Turkey on WhatsApp or phone: +90 542 122 7780.',
    kb_empty_3x: 'I do not want to guess on this. I can pass your question to the clinic team for a verified answer.',
  },
  handoff_triggers: { keywords: ['human', 'agent', 'doctor', 'dentist', 'specialist', 'call me', 'consultant'], frustration_keywords: ['not helpful', 'wrong', 'nonsense'], missing_required_after_turns: 10, kb_empty_consecutive: 3, qualified_fields: ['full_name', 'phone', 'treatment_interest'] },
  hard_blocks: [
    { trigger_id: 'medical_diagnosis', keywords: ['diagnose', 'prescribe', 'antibiotic', 'painkiller', 'read my xray'], response: 'I cannot diagnose, read x-rays, or prescribe medication remotely. For clinical symptoms, please contact the clinic or seek urgent dental care if severe.' },
    { trigger_id: 'guaranteed_price', keywords: ['final price', 'guaranteed price', 'exact quote'], response: 'I can share public starting prices, but the final quote depends on the dentist evaluation, x-rays, photos, and exact treatment plan.' },
  ],
  features: { calendar_booking: false },
  few_shot_examples: [
    { user: 'How much is All on 4?', assistant: 'The public guide price starts from GBP 1,800 per jaw. That is not a final quote because the specialist needs to review your x-ray, bone condition, and treatment needs. Do you already have a panoramic x-ray or dental photos?' },
  ],
  opening_message: null,
}

const voicePlaybook = {
  ...whatsappPlaybook,
  name: 'Dental Excellence Turkey - Voice Receptionist',
  channel: 'voice',
  system_prompt_template: `${basePrompt}\n\nYou are on a live voice call. Keep answers very short and natural. Ask only one question at a time. Do not say bullet points or markdown. Opening: "Good day, Dental Excellence Turkey. How can I help you today?"`,
  fallback_responses: { ...whatsappPlaybook.fallback_responses, error: 'There is a short technical issue. Please contact the clinic directly on plus ninety, five hundred forty two, one hundred twenty two, seventy seven eighty.' },
  features: { calendar_booking: false, voice_language: 'en', tts_voice_id: '' },
  opening_message: 'Good day, Dental Excellence Turkey. How can I help you today?',
}

const intakeFields = [
  { key: 'full_name', label: 'Full name', type: 'text', priority: 'must', voice_prompt: 'May I have your full name, please?' },
  { key: 'phone', label: 'Phone or WhatsApp', type: 'phone', priority: 'must', voice_prompt: 'What is the best phone or WhatsApp number for follow-up?' },
  { key: 'country_city', label: 'Country or city', type: 'text', priority: 'should', voice_prompt: 'Which country or city are you contacting us from?' },
  { key: 'treatment_interest', label: 'Treatment interest', type: 'text', priority: 'must', voice_prompt: 'Which dental treatment are you interested in?' },
  { key: 'main_concern', label: 'Main dental concern', type: 'text', priority: 'should', voice_prompt: 'What is the main dental concern you would like help with?' },
  { key: 'has_xray_photos', label: 'Has panoramic x-ray or dental photos', type: 'text', priority: 'should', voice_prompt: 'Do you already have a panoramic x-ray or dental photos?' },
  { key: 'preferred_travel_dates', label: 'Preferred travel dates', type: 'text', priority: 'should', voice_prompt: 'Do you have preferred travel dates for Antalya?' },
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
  const { data: org, error: orgReadError } = await sb.from('organizations').select('channel_config, ai_persona').eq('id', ORG_ID).maybeSingle()
  if (orgReadError) throw orgReadError
  if (!org) throw new Error(`Organization not found: ${ORG_ID}`)

  const channelConfig = {
    ...(org.channel_config || {}),
    voice_inbound: { ...((org.channel_config || {}).voice_inbound || {}), active: true, voice_language: 'en', tts_voice_id: '' },
    voice_outbound: { ...((org.channel_config || {}).voice_outbound || {}), active: false, voice_language: 'en', tts_voice_id: '' },
    whatsapp: { ...((org.channel_config || {}).whatsapp || {}), active: true, language: 'en' },
    instagram: { ...((org.channel_config || {}).instagram || {}), active: false },
  }

  const { error: orgError } = await sb.from('organizations').update({
    name: ORG_NAME,
    slug: 'dental-excellence',
    sector: 'clinic',
    status: 'active',
    onboarding_status: 'completed',
    phone: '+905421227780',
    email: 'contact@dentalexcellenceturkey.com',
    city: 'Antalya',
    country: 'TR',
    website: WEBSITE,
    timezone: 'Europe/Istanbul',
    ai_persona: {
      ...(org.ai_persona || {}),
      persona_name: 'Dental Excellence Receptionist',
      language: 'en',
      tone: 'warm-professional',
      never_hallucinate: true,
      fallback_instruction: 'Use only verified clinic knowledge. Do not diagnose, prescribe, interpret x-rays, guarantee outcomes, or invent prices.',
    },
    channel_config: channelConfig,
    working_hours: { weekdays: '09:00-18:00', saturday: '10:00-16:00', sunday: 'Closed', timezone: 'Europe/Istanbul' },
    updated_at: new Date().toISOString(),
  }).eq('id', ORG_ID)
  if (orgError) throw orgError

  const deactivated = await deactivateOldKnowledge(sb)
  const knowledge = []
  for (const item of kbItems) knowledge.push(await upsertKnowledgeItem(sb, item))
  const playbooks = [await upsertPlaybook(sb, whatsappPlaybook), await upsertPlaybook(sb, voicePlaybook)]
  const intake = [
    await upsertIntakeSchema(sb, 'whatsapp', 'Dental Excellence Turkey WhatsApp Lead Form'),
    await upsertIntakeSchema(sb, 'voice', 'Dental Excellence Turkey Voice Lead Form'),
  ]

  console.log(JSON.stringify({ organization_id: ORG_ID, organization_updated: true, deactivated, knowledge, playbooks, intake }, null, 2))
}

main().catch(err => { console.error(err); process.exit(1) })
