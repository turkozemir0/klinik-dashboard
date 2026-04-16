const fs = require('fs')
const path = require('path')
const { createClient } = require('../dashboard/node_modules/@supabase/supabase-js')

const ORG_ID = 'a12d666e-d83e-482c-8a39-f7bc98c62433'
const DEMO_SEED = 'stoaix_website_dashboard_demo_v1'

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env')
  const raw = fs.readFileSync(envPath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i !== -1) process.env[t.slice(0, i)] = t.slice(i + 1)
  }
}

function daysAgo(days, hour = 10, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function daysAhead(days, hour = 10, minute = 0) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function dateAhead(days) {
  return daysAhead(days).slice(0, 10)
}

async function maybeDelete(sb, table, column, values) {
  if (!values.length) return { table, deleted: 0 }
  const { error } = await sb.from(table).delete().in(column, values)
  if (error) {
    console.warn(`[skip delete] ${table}: ${error.message}`)
    return { table, skipped: true, error: error.message }
  }
  return { table, deleted: values.length }
}

async function maybeInsert(sb, table, rows) {
  if (!rows.length) return []
  const { data, error } = await sb.from(table).insert(rows).select()
  if (error) {
    console.warn(`[skip insert] ${table}: ${error.message}`)
    return []
  }
  return data || []
}

async function cleanup(sb) {
  const { data: oldLeads, error: leadError } = await sb
    .from('leads')
    .select('id, contact_id')
    .eq('organization_id', ORG_ID)
    .contains('collected_data', { demo_seed: DEMO_SEED })

  if (leadError) throw leadError

  const leadIds = (oldLeads || []).map(row => row.id)

  const { data: oldContacts, error: contactError } = await sb
    .from('contacts')
    .select('id')
    .eq('organization_id', ORG_ID)
    .contains('metadata', { demo_seed: DEMO_SEED })

  if (contactError) throw contactError

  const contactIds = [
    ...new Set([
      ...(oldLeads || []).map(row => row.contact_id).filter(Boolean),
      ...(oldContacts || []).map(row => row.id),
    ]),
  ]

  const { data: oldConversations } = leadIds.length
    ? await sb.from('conversations').select('id').eq('organization_id', ORG_ID).in('lead_id', leadIds)
    : { data: [] }
  const conversationIds = (oldConversations || []).map(row => row.id)

  const { data: oldProposals } = leadIds.length
    ? await sb.from('proposals').select('id').eq('organization_id', ORG_ID).in('lead_id', leadIds)
    : { data: [] }
  const proposalIds = (oldProposals || []).map(row => row.id)

  await maybeDelete(sb, 'payment_schedules', 'proposal_id', proposalIds)
  await maybeDelete(sb, 'proposals', 'id', proposalIds)
  await maybeDelete(sb, 'follow_up_tasks', 'lead_id', leadIds)
  await maybeDelete(sb, 'handoff_logs', 'lead_id', leadIds)
  await maybeDelete(sb, 'voice_calls', 'lead_id', leadIds)
  await maybeDelete(sb, 'messages', 'conversation_id', conversationIds)
  await maybeDelete(sb, 'conversations', 'id', conversationIds)
  await maybeDelete(sb, 'leads', 'id', leadIds)
  await maybeDelete(sb, 'contacts', 'id', contactIds)

  return { old_leads: leadIds.length, old_contacts: contactIds.length, old_conversations: conversationIds.length }
}

const baseDemoPeople = [
  {
    full_name: 'Emily Carter',
    phone: '+44 7700 900143',
    email: 'emily.carter@example.com',
    city: 'London',
    treatment_interest: 'Dental implants',
    main_concern: 'Missing lower molar and wants to compare implant options',
    target_country: 'United Kingdom',
    source_channel: 'voice',
    status: 'handed_off',
    score: 94,
    created_days_ago: 0,
    assigned_to: 'Maya',
    handoff: true,
    next_action: 'Specialist callback requested today',
  },
  {
    full_name: 'James Wilson',
    phone: '+44 7700 900284',
    email: 'james.wilson@example.com',
    city: 'Manchester',
    treatment_interest: 'All-on-4',
    main_concern: 'Full arch restoration and travel planning',
    target_country: 'United Kingdom',
    source_channel: 'whatsapp',
    status: 'qualified',
    score: 88,
    created_days_ago: 1,
    assigned_to: 'Olivia',
    next_action: 'Send treatment estimate after x-ray review',
  },
  {
    full_name: 'Sofia Martinez',
    phone: '+34 612 345 901',
    email: 'sofia.martinez@example.com',
    city: 'Madrid',
    treatment_interest: 'Smile makeover',
    main_concern: 'Wants whiter, more symmetric front teeth',
    target_country: 'Spain',
    source_channel: 'instagram',
    status: 'in_progress',
    score: 76,
    created_days_ago: 2,
    assigned_to: 'Maya',
    next_action: 'Ask for smile photos',
  },
  {
    full_name: 'Daniel Brooks',
    phone: '+1 415 555 0138',
    email: 'daniel.brooks@example.com',
    city: 'San Francisco',
    treatment_interest: 'Invisalign',
    main_concern: 'Crowding on lower teeth',
    target_country: 'United States',
    source_channel: 'web',
    status: 'nurturing',
    score: 63,
    created_days_ago: 3,
    assigned_to: 'Ethan',
    next_action: 'Follow up in 48 hours',
  },
  {
    full_name: 'Ava Thompson',
    phone: '+44 7700 900385',
    email: 'ava.thompson@example.com',
    city: 'Birmingham',
    treatment_interest: 'Veneers',
    main_concern: 'Interested in 10 upper veneers',
    target_country: 'United Kingdom',
    source_channel: 'whatsapp',
    status: 'converted',
    score: 91,
    created_days_ago: 4,
    assigned_to: 'Olivia',
    next_action: 'Appointment confirmed for case review',
  },
  {
    full_name: 'Noah Miller',
    phone: '+49 1512 3456781',
    email: 'noah.miller@example.com',
    city: 'Berlin',
    treatment_interest: 'Teeth whitening',
    main_concern: 'Planning quick cosmetic treatment during travel',
    target_country: 'Germany',
    source_channel: 'voice',
    status: 'new',
    score: 41,
    created_days_ago: 0,
    assigned_to: 'Ethan',
    next_action: 'Collect travel dates',
  },
  {
    full_name: 'Mia Anderson',
    phone: '+31 6 12345672',
    email: 'mia.anderson@example.com',
    city: 'Amsterdam',
    treatment_interest: 'Dental crowns',
    main_concern: 'Old crowns need replacement',
    target_country: 'Netherlands',
    source_channel: 'whatsapp',
    status: 'qualified',
    score: 82,
    created_days_ago: 5,
    assigned_to: 'Maya',
    next_action: 'Prepare draft proposal',
  },
  {
    full_name: 'Liam Scott',
    phone: '+353 86 123 4567',
    email: 'liam.scott@example.com',
    city: 'Dublin',
    treatment_interest: 'All-on-6',
    main_concern: 'Needs a second opinion for full mouth treatment',
    target_country: 'Ireland',
    source_channel: 'web',
    status: 'handed_off',
    score: 97,
    created_days_ago: 6,
    assigned_to: 'Olivia',
    handoff: true,
    next_action: 'Senior consultant call scheduled',
  },
  {
    full_name: 'Chloe Evans',
    phone: '+44 7700 900451',
    email: 'chloe.evans@example.com',
    city: 'Leeds',
    treatment_interest: 'Gum contouring',
    main_concern: 'Uneven gum line before wedding',
    target_country: 'United Kingdom',
    source_channel: 'instagram',
    status: 'in_progress',
    score: 58,
    created_days_ago: 7,
    assigned_to: 'Ethan',
    next_action: 'Ask for close-up photos',
  },
  {
    full_name: 'Oliver Reed',
    phone: '+46 70 123 4568',
    email: 'oliver.reed@example.com',
    city: 'Stockholm',
    treatment_interest: 'Dental implants',
    main_concern: 'Comparing implant treatment timeline',
    target_country: 'Sweden',
    source_channel: 'voice',
    status: 'lost',
    score: 36,
    created_days_ago: 8,
    assigned_to: 'Maya',
    next_action: 'No action, chose local clinic',
  },
  {
    full_name: 'Grace Bennett',
    phone: '+44 7700 900592',
    email: 'grace.bennett@example.com',
    city: 'Bristol',
    treatment_interest: 'Smile makeover',
    main_concern: 'Interested in treatment before summer travel',
    target_country: 'United Kingdom',
    source_channel: 'whatsapp',
    status: 'new',
    score: 52,
    created_days_ago: 9,
    assigned_to: 'Olivia',
    next_action: 'Send x-ray/photo instructions',
  },
  {
    full_name: 'Henry Cooper',
    phone: '+33 6 12 34 56 79',
    email: 'henry.cooper@example.com',
    city: 'Paris',
    treatment_interest: 'Implant consultation',
    main_concern: 'Wants quote after failed bridge',
    target_country: 'France',
    source_channel: 'web',
    status: 'nurturing',
    score: 67,
    created_days_ago: 10,
    assigned_to: 'Ethan',
    next_action: 'Follow up next week',
  },
]

const extraNames = [
  ['Ella Hughes', 'Cardiff', 'United Kingdom'],
  ['Thomas Wright', 'Edinburgh', 'United Kingdom'],
  ['Ruby Clark', 'Liverpool', 'United Kingdom'],
  ['Oscar Lewis', 'Brighton', 'United Kingdom'],
  ['Hannah Young', 'Nottingham', 'United Kingdom'],
  ['George Walker', 'Glasgow', 'United Kingdom'],
  ['Isla Hall', 'Newcastle', 'United Kingdom'],
  ['Benjamin King', 'Cambridge', 'United Kingdom'],
  ['Amelia Green', 'Oxford', 'United Kingdom'],
  ['Lucas Adams', 'Belfast', 'United Kingdom'],
  ['Lily Baker', 'Sheffield', 'United Kingdom'],
  ['Theo Nelson', 'York', 'United Kingdom'],
  ['Emma Schneider', 'Munich', 'Germany'],
  ['Max Fischer', 'Hamburg', 'Germany'],
  ['Anna Weber', 'Vienna', 'Austria'],
  ['Luca Rossi', 'Milan', 'Italy'],
  ['Giulia Romano', 'Rome', 'Italy'],
  ['Camille Bernard', 'Lyon', 'France'],
  ['Louis Martin', 'Marseille', 'France'],
  ['Eva Sanz', 'Barcelona', 'Spain'],
  ['Mateo Garcia', 'Valencia', 'Spain'],
  ['Nora Hansen', 'Copenhagen', 'Denmark'],
  ['Erik Larsen', 'Oslo', 'Norway'],
  ['Freya Nilsson', 'Gothenburg', 'Sweden'],
  ['Mila Novak', 'Prague', 'Czech Republic'],
  ['Adam Kowalski', 'Warsaw', 'Poland'],
  ['Sara Ahmed', 'Dubai', 'United Arab Emirates'],
  ['Maya Cohen', 'Tel Aviv', 'Israel'],
  ['Ethan Parker', 'Toronto', 'Canada'],
  ['Olivia Moore', 'Vancouver', 'Canada'],
  ['Sophia Harris', 'New York', 'United States'],
  ['Jack Turner', 'Chicago', 'United States'],
  ['Aiden Murphy', 'Boston', 'United States'],
  ['Zoe Campbell', 'Dublin', 'Ireland'],
  ['Mason Hill', 'Auckland', 'New Zealand'],
  ['Charlotte Ward', 'Sydney', 'Australia'],
  ['Harper Bell', 'Melbourne', 'Australia'],
  ['Leo Morgan', 'Zurich', 'Switzerland'],
  ['Clara Meier', 'Geneva', 'Switzerland'],
  ['Felix Bauer', 'Frankfurt', 'Germany'],
  ['Ivy Foster', 'Bath', 'United Kingdom'],
  ['Arthur Price', 'Portsmouth', 'United Kingdom'],
  ['Molly Russell', 'Norwich', 'United Kingdom'],
  ['Finn Cooper', 'Reading', 'United Kingdom'],
  ['Alice Perry', 'Exeter', 'United Kingdom'],
  ['Samuel Wood', 'Leicester', 'United Kingdom'],
  ['Grace Phillips', 'Derby', 'United Kingdom'],
  ['Harry Morris', 'Swansea', 'United Kingdom'],
  ['Elena Costa', 'Lisbon', 'Portugal'],
  ['Noa Levi', 'Haifa', 'Israel'],
  ['Yasmin Khan', 'Doha', 'Qatar'],
  ['Marta Nowak', 'Krakow', 'Poland'],
]

const treatmentProfiles = [
  ['Dental implants', 'Missing tooth and wants a durable implant option'],
  ['All-on-4', 'Full arch restoration and wants a clear travel timeline'],
  ['All-on-6', 'Looking for a full mouth treatment plan after multiple missing teeth'],
  ['Smile makeover', 'Wants a brighter and more balanced smile'],
  ['Veneers', 'Interested in upper veneers for visible front teeth'],
  ['Dental crowns', 'Old crowns need replacement and color matching'],
  ['Invisalign', 'Mild crowding and wants a discreet orthodontic option'],
  ['Teeth whitening', 'Wants a fast cosmetic improvement before an event'],
  ['Gum contouring', 'Uneven gum line affecting smile aesthetics'],
  ['Implant consultation', 'Needs a second opinion after a failed bridge'],
]

const statuses = ['new', 'in_progress', 'qualified', 'handed_off', 'nurturing', 'converted', 'lost']
const channels = ['voice', 'whatsapp', 'instagram', 'web']
const owners = ['Maya', 'Olivia', 'Ethan', 'Aylin']

const generatedDemoPeople = extraNames.map(([full_name, city, target_country], idx) => {
  const [treatment_interest, main_concern] = treatmentProfiles[idx % treatmentProfiles.length]
  const status = statuses[idx % statuses.length]
  const scoreByStatus = {
    new: 45,
    in_progress: 68,
    qualified: 84,
    handed_off: 92,
    nurturing: 61,
    converted: 89,
    lost: 34,
  }
  const score = Math.min(99, scoreByStatus[status] + (idx % 7))
  const countryCode = target_country === 'United Kingdom' ? '+44 7700' : '+49 1512'
  const phoneSuffix = String(901000 + idx).slice(-6)
  return {
    full_name,
    phone: `${countryCode} ${phoneSuffix}`,
    email: `${full_name.toLowerCase().replaceAll(' ', '.')}@example.com`,
    city,
    treatment_interest,
    main_concern,
    target_country,
    source_channel: channels[idx % channels.length],
    status,
    score,
    created_days_ago: (idx % 14),
    assigned_to: owners[idx % owners.length],
    handoff: status === 'handed_off',
    next_action: status === 'converted'
      ? 'Appointment confirmed'
      : status === 'lost'
        ? 'No further action requested'
        : status === 'qualified'
          ? 'Prepare treatment estimate'
          : status === 'handed_off'
            ? 'Consultant callback requested'
            : 'Continue qualification follow-up',
  }
})

const demoPeople = [...baseDemoPeople, ...generatedDemoPeople]

function collectedData(person) {
  return {
    demo_seed: DEMO_SEED,
    full_name: person.full_name,
    phone: person.phone,
    email: person.email,
    city: person.city,
    target_country: person.target_country,
    treatment_interest: person.treatment_interest,
    main_concern: person.main_concern,
    has_xray_photos: person.score >= 70 ? 'yes' : 'not yet',
    preferred_travel_dates: person.score >= 80 ? 'within 4-6 weeks' : 'flexible',
    budget_range: person.treatment_interest.includes('All-on') ? 'GBP 4,000-8,000' : 'needs quote',
  }
}

function leadSummary(person) {
  return `${person.full_name} is interested in ${person.treatment_interest}. Main concern: ${person.main_concern}. Location: ${person.city}, ${person.target_country}. Next action: ${person.next_action}.`
}

function conversationMessages(person, leadCreatedAt) {
  const isVoice = person.source_channel === 'voice'
  const first = isVoice
    ? `Hi, I am calling about ${person.treatment_interest}. I would like to understand the process and whether I can get a quote.`
    : `Hi, I am interested in ${person.treatment_interest}. Can you help me understand the next step?`

  return [
    { role: 'user', content: first, created_at: leadCreatedAt },
    { role: 'assistant', content: `Of course, I can help. To guide you correctly, could you tell me your main dental concern?`, created_at: daysAgo(Math.max(person.created_days_ago - 0.02, 0), 10, 4) },
    { role: 'user', content: person.main_concern, created_at: daysAgo(Math.max(person.created_days_ago - 0.02, 0), 10, 5) },
    { role: 'assistant', content: `Thank you. I have noted your interest in ${person.treatment_interest}. Do you already have a panoramic x-ray or clear dental photos for the specialist review?`, created_at: daysAgo(Math.max(person.created_days_ago - 0.02, 0), 10, 6) },
    { role: 'user', content: person.score >= 70 ? 'Yes, I can send the x-ray and photos today.' : 'Not yet, but I can arrange photos later.', created_at: daysAgo(Math.max(person.created_days_ago - 0.02, 0), 10, 7) },
    { role: 'assistant', content: person.score >= 70 ? `Perfect. I will mark your case as priority and the team can follow up with the next steps.` : `No problem. I can keep this open and send instructions for the photos.`, created_at: daysAgo(Math.max(person.created_days_ago - 0.02, 0), 10, 8) },
  ]
}

async function main() {
  loadEnv()
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

  const { data: org, error: orgError } = await sb
    .from('organizations')
    .select('id, name, channel_config')
    .eq('id', ORG_ID)
    .maybeSingle()

  if (orgError) throw orgError
  if (!org) throw new Error(`Organization not found: ${ORG_ID}`)

  const cleaned = await cleanup(sb)

  const contacts = await maybeInsert(sb, 'contacts', demoPeople.map(person => ({
    organization_id: ORG_ID,
    phone: person.phone,
    email: person.email,
    full_name: person.full_name,
    status: person.status === 'converted' ? 'customer' : person.score >= 80 ? 'qualified' : 'known',
    source_channel: person.source_channel,
    channel_identifiers: {
      [person.source_channel === 'voice' ? 'phone' : person.source_channel]: person.phone,
      demo_seed: DEMO_SEED,
    },
    tags: ['website-demo', person.treatment_interest.toLowerCase().replaceAll(' ', '-')],
    metadata: {
      demo_seed: DEMO_SEED,
      city: person.city,
      target_country: person.target_country,
      lifecycle_stage: person.status,
    },
    created_at: daysAgo(person.created_days_ago, 9, 30),
  })))

  const contactByPhone = new Map(contacts.map(contact => [contact.phone, contact]))

  const leads = await maybeInsert(sb, 'leads', demoPeople.map(person => ({
    organization_id: ORG_ID,
    contact_id: contactByPhone.get(person.phone)?.id,
    status: person.status,
    source_channel: person.source_channel === 'voice' ? 'voice' : person.source_channel,
    collected_data: collectedData(person),
    data_completeness: {
      full_name: 'collected',
      phone: 'collected',
      treatment_interest: 'collected',
      main_concern: 'collected',
      has_xray_photos: person.score >= 70 ? 'collected' : 'pending_followup',
      preferred_travel_dates: person.score >= 80 ? 'collected' : 'unknown',
    },
    missing_fields: person.score >= 70 ? [] : ['xray_photos', 'preferred_travel_dates'],
    qualification_score: person.score,
    handoff_triggered: Boolean(person.handoff),
    handoff_at: person.handoff ? daysAgo(person.created_days_ago, 10, 20) : null,
    handoff_summary: person.handoff ? leadSummary(person) : null,
    next_action: person.next_action,
    follow_up_at: person.status === 'lost' || person.status === 'converted' ? null : daysAhead(Math.max(1, person.created_days_ago % 4), 11, 0),
    notes: 'Website dashboard demo data. Safe to delete.',
    ai_summary: leadSummary(person),
    created_at: daysAgo(person.created_days_ago, 9, 45),
    updated_at: daysAgo(Math.max(person.created_days_ago - 0.1, 0), 11, 10),
  })).filter(row => row.contact_id))

  const leadByPhone = new Map()
  for (const lead of leads) {
    const phone = lead.collected_data?.phone
    if (phone) leadByPhone.set(phone, lead)
  }

  const conversations = await maybeInsert(sb, 'conversations', demoPeople.map(person => {
    const lead = leadByPhone.get(person.phone)
    const contact = contactByPhone.get(person.phone)
    if (!lead || !contact) return null
    const startedAt = daysAgo(person.created_days_ago, 9, 50)
    return {
      organization_id: ORG_ID,
      contact_id: contact.id,
      lead_id: lead.id,
      channel: person.source_channel === 'voice' ? 'voice' : person.source_channel === 'web' ? 'web' : person.source_channel,
      status: person.handoff ? 'handed_off' : person.status === 'converted' || person.status === 'lost' ? 'closed' : 'active',
      channel_metadata: {
        demo_seed: DEMO_SEED,
        message_count: 6,
        source: 'website dashboard demo',
      },
      started_at: startedAt,
      ended_at: person.status === 'new' || person.status === 'in_progress' ? null : daysAgo(person.created_days_ago, 10, 12),
    }
  }).filter(Boolean))

  const conversationByLeadId = new Map(conversations.map(conversation => [conversation.lead_id, conversation]))

  const messageRows = []
  for (const person of demoPeople) {
    const lead = leadByPhone.get(person.phone)
    if (!lead) continue
    const conversation = conversationByLeadId.get(lead.id)
    if (!conversation) continue
    for (const message of conversationMessages(person, daysAgo(person.created_days_ago, 9, 52))) {
      messageRows.push({
        conversation_id: conversation.id,
        organization_id: ORG_ID,
        role: message.role,
        content: message.content,
        content_type: person.source_channel === 'voice' ? 'audio_transcript' : 'text',
        created_at: message.created_at,
      })
    }
  }
  const messages = await maybeInsert(sb, 'messages', messageRows)

  const voiceCalls = await maybeInsert(sb, 'voice_calls', demoPeople.filter(person => person.source_channel === 'voice').map(person => {
    const lead = leadByPhone.get(person.phone)
    const contact = contactByPhone.get(person.phone)
    const conversation = lead ? conversationByLeadId.get(lead.id) : null
    return {
      organization_id: ORG_ID,
      contact_id: contact?.id,
      conversation_id: conversation?.id,
      lead_id: lead?.id,
      direction: 'inbound',
      status: person.status === 'lost' ? 'completed' : 'completed',
      phone_from: person.phone,
      phone_to: '+90 542 122 7780',
      duration_seconds: person.score >= 80 ? 312 : 168,
      transcript: conversationMessages(person, daysAgo(person.created_days_ago, 9, 52)).map(m => `${m.role}: ${m.content}`).join('\n'),
      livekit_room_name: `demo-${person.full_name.toLowerCase().replaceAll(' ', '-')}`,
      started_at: daysAgo(person.created_days_ago, 9, 50),
      ended_at: daysAgo(person.created_days_ago, 9, person.score >= 80 ? 56 : 53),
      metadata: { demo_seed: DEMO_SEED, recording_available: true },
    }
  }).filter(row => row.contact_id && row.lead_id))

  const handoffs = await maybeInsert(sb, 'handoff_logs', demoPeople.filter(person => person.handoff).map(person => {
    const lead = leadByPhone.get(person.phone)
    const conversation = lead ? conversationByLeadId.get(lead.id) : null
    return {
      organization_id: ORG_ID,
      lead_id: lead?.id,
      conversation_id: conversation?.id,
      trigger_reason: 'qualified',
      summary: leadSummary(person),
      collected_data_snapshot: collectedData(person),
      missing_at_handoff: [],
      routing_target: person.assigned_to,
      status: person.status === 'handed_off' ? 'pending' : 'accepted',
      created_at: daysAgo(person.created_days_ago, 10, 20),
    }
  }).filter(row => row.lead_id))

  const followUps = await maybeInsert(sb, 'follow_up_tasks', demoPeople.filter(person => !['lost', 'converted'].includes(person.status)).flatMap((person, idx) => {
    const lead = leadByPhone.get(person.phone)
    const contact = contactByPhone.get(person.phone)
    const conversation = lead ? conversationByLeadId.get(lead.id) : null
    if (!lead || !contact) return []
    const stages = ['warm_day4', 'warm_day11', 'warm_to_cold', 'cold_month1', 're_contact_1', 're_contact_2']
    const stage = stages[idx % stages.length]
    return [
      {
        organization_id: ORG_ID,
        lead_id: lead.id,
        contact_id: contact.id,
        conversation_id: conversation?.id,
        task_type: 'whatsapp_followup',
        sequence_stage: stage,
        channel: person.source_channel === 'instagram' ? 'instagram' : 'whatsapp',
        scheduled_at: daysAhead((idx % 5) + 1, 10 + (idx % 4), 30),
        status: idx % 4 === 0 ? 'sent' : 'pending',
        sent_at: idx % 4 === 0 ? daysAgo(0, 12, idx * 3) : null,
        sent_message: idx % 4 === 0 ? `Hi ${person.full_name.split(' ')[0]}, just checking if you were able to send the photos for your ${person.treatment_interest} review.` : null,
        template_key: 'clinic_case_review_followup',
        variables: { demo_seed: DEMO_SEED, name: person.full_name, treatment_interest: person.treatment_interest },
        attempt_count: idx % 4 === 0 ? 1 : 0,
        created_at: daysAgo(person.created_days_ago, 12, 0),
      },
    ]
  }))

  const proposalPeople = demoPeople.filter(person => ['qualified', 'converted', 'handed_off'].includes(person.status)).slice(0, 24)
  const proposals = await maybeInsert(sb, 'proposals', proposalPeople.map((person, idx) => {
    const lead = leadByPhone.get(person.phone)
    const amounts = [4800, 7200, 3100, 6500, 2400]
    const status = person.status === 'converted' ? 'accepted' : idx % 2 === 0 ? 'sent' : 'draft'
    return {
      organization_id: ORG_ID,
      lead_id: lead?.id,
      title: `${person.treatment_interest} case plan`,
      description: `Demo treatment plan for ${person.full_name}. Final quote depends on clinical evaluation, x-ray and photos.`,
      total_amount: amounts[idx] || 3200,
      currency: 'GBP',
      status,
      sent_at: status === 'draft' ? null : daysAgo(person.created_days_ago, 15, 0),
      accepted_at: status === 'accepted' ? daysAgo(1, 14, 20) : null,
      notes: `Generated by ${DEMO_SEED}.`,
      client_name: person.full_name,
      client_phone: person.phone,
      created_at: daysAgo(person.created_days_ago, 13, 15),
      updated_at: daysAgo(Math.max(person.created_days_ago - 0.1, 0), 13, 45),
    }
  }).filter(row => row.lead_id))

  const paymentRows = proposals.flatMap((proposal, idx) => ([
    {
      organization_id: ORG_ID,
      proposal_id: proposal.id,
      amount: Math.round(Number(proposal.total_amount) * 0.35),
      due_date: dateAhead(idx - 1),
      status: proposal.status === 'accepted' ? 'paid' : idx === 0 ? 'pending' : 'overdue',
      paid_at: proposal.status === 'accepted' ? daysAgo(1, 16, 0) : null,
      notes: `Demo deposit schedule generated by ${DEMO_SEED}.`,
    },
    {
      organization_id: ORG_ID,
      proposal_id: proposal.id,
      amount: Math.round(Number(proposal.total_amount) * 0.65),
      due_date: dateAhead(idx + 14),
      status: 'pending',
      paid_at: null,
      notes: `Demo balance schedule generated by ${DEMO_SEED}.`,
    },
  ]))
  const payments = await maybeInsert(sb, 'payment_schedules', paymentRows)

  console.log(JSON.stringify({
    organization_id: ORG_ID,
    cleaned,
    inserted: {
      contacts: contacts.length,
      leads: leads.length,
      conversations: conversations.length,
      messages: messages.length,
      voice_calls: voiceCalls.length,
      handoffs: handoffs.length,
      follow_up_tasks: followUps.length,
      proposals: proposals.length,
      payment_schedules: payments.length,
    },
  }, null, 2))
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
