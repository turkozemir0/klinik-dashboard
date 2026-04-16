const fs = require('fs')
const path = require('path')
const { createClient } = require('../dashboard/node_modules/@supabase/supabase-js')

const ORG_ID = 'ecd032a8-f40c-4171-947a-b6417461e987'

function loadEnv() {
  const raw = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const idx = t.indexOf('=')
    if (idx === -1) continue
    process.env[t.slice(0, idx)] = t.slice(idx + 1)
  }
}

async function embed(text) {
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text, dimensions: 1536 }),
  })
  if (!res.ok) throw new Error(`Embedding failed: ${res.status} ${await res.text()}`)
  return (await res.json()).data[0].embedding
}

function kbItem(item_type, title, description_for_ai, data = {}, tags = []) {
  return { item_type, title, description_for_ai, data, tags, is_active: true }
}

// ─── YENİ / GÜNCELLENECEK KB İTEMS ────────────────────────────────────────
// Mevcut 27 item üzerine ekleniyor. Almanca öncelikli, Türkçe de anlaşılıyor.
// !! İşletme bu description_for_ai metinlerini kendi üslubuna göre düzenleyecek.

const newKbItems = [

  // ─── DOKTOR BİYOGRAFİSİ — mevcut item çok zayıf, güncelleniyor ─────────
  kbItem(
    'doctor',
    'Dr.Batuhan Yıldırım',
    `Dr. Batuhan Yıldırım ist Gründer und leitender Arzt von EsteLife Hair in Grevenbroich. ` +
    `Er verfügt über mehr als 10 Jahre Erfahrung in der Haartransplantationschirurgie und ist spezialisiert auf FUE, DHI und Saphir FUE. ` +
    `Er betreut jeden Patienten persönlich – von der ersten Haaranalyse bis zur abschließenden Kontrolle. ` +
    `Dr. Yıldırım spricht fließend Deutsch und Türkisch. ` +
    `Sein Schwerpunkt liegt auf natürlichen Ergebnissen und minimal-invasiven Techniken. ` +
    `[HINWEIS FÜR DAS TEAM: Bitte hier Ausbildung, Facharzttitel, Zertifizierungen und ggf. Mitgliedschaften ergänzen.]`,
    {
      name: 'Dr. Batuhan Yıldırım',
      role: 'Gründer & leitender Arzt',
      experience_years: 10,
      specializations: ['FUE', 'DHI', 'Saphir FUE'],
      languages: ['Deutsch', 'Türkisch'],
    },
    ['arzt', 'dr-yildirim', 'erfahrung', 'spezialist']
  ),

  // ─── KRANKENKASSe / SİGORTA ─────────────────────────────────────────────
  kbItem(
    'faq',
    'Übernimmt die Krankenkasse die Kosten?',
    `Krankenkasse und Haartransplantation bei EsteLife Hair: ` +
    `Gesetzliche Krankenversicherungen (GKV) übernehmen in der Regel keine Kosten für Haartransplantationen, ` +
    `da es sich um einen ästhetischen Eingriff handelt. ` +
    `Private Krankenversicherungen (PKV) können in Einzelfällen – z. B. bei nachgewiesenem Haarausfall durch Erkrankung oder Unfall – ` +
    `eine Kostenübernahme prüfen; dies ist jedoch selten und erfordert vorherige Klärung mit der Versicherung. ` +
    `EsteLife Hair stellt auf Wunsch eine detaillierte Rechnung für Erstattungsanfragen aus. ` +
    `[HINWEIS FÜR DAS TEAM: Bitte prüfen, ob ihr PKV-Abrechnungen oder spezielle Formulare ausstellt.]`,
    {
      question: 'Übernimmt die Krankenkasse die Kosten?',
      answer: 'GKV: in der Regel nicht. PKV: Einzelfallprüfung möglich. Rechnung wird ausgestellt.',
    },
    ['gkv', 'pkv', 'krankenkasse', 'versicherung', 'kosten', 'faq']
  ),

  // ─── GARANTİ ─────────────────────────────────────────────────────────────
  kbItem(
    'faq',
    'Gibt es eine Garantie auf die Haartransplantation?',
    `Garantie bei Haartransplantation EsteLife Hair Grevenbroich: ` +
    `Transplantierte Haarfollikel aus dem DHT-resistenten Spenderbereich wachsen dauerhaft – das ist biologisch belegt. ` +
    `EsteLife Hair steht für die Qualität der Durchführung: sorgfältige Entnahme, schonende Implantation, optimale Follikelüberlebensrate. ` +
    `Ein Einheilungsgrad von 90–95 % ist bei korrekter Nachsorge realistisch. ` +
    `Sollte es in seltenen Fällen zu lokalem Nicht-Einwachsen kommen, wird dies beim Kontrolltermin besprochen und ggf. eine Lösung erarbeitet. ` +
    `[HINWEIS FÜR DAS TEAM: Bitte hier eure konkrete Garantiepolitik eintragen – z. B. kostenlose Nachkorrektur, Kontrolltermine, Fristen.]`,
    {
      question: 'Gibt es eine Garantie?',
      answer: '90–95% Einheilungsrate bei korrekter Nachsorge. Kontrolltermin inklusive. Details bitte vom Team ergänzen.',
    },
    ['garantie', 'einheilung', 'qualitaet', 'ergebnis', 'faq']
  ),

  // ─── NEDEN ESTELİFE / NEDEN ALMANYA'DA ──────────────────────────────────
  kbItem(
    'general',
    'Warum EsteLife Hair – Haartransplantation in Deutschland',
    `Warum Haartransplantation bei EsteLife Hair in Grevenbroich statt im Ausland? ` +
    `EsteLife Hair bietet Haartransplantationen in Deutschland auf höchstem medizinischem Niveau. ` +
    `Vorteile: Behandlung in Deutschland nach deutschen Hygienestandards und Zulassungsregeln. ` +
    `Kein Reiseaufwand – ideal für Patienten aus NRW, Düsseldorf, Köln, Aachen, Mönchengladbach und Umgebung. ` +
    `Vollständige Kommunikation auf Deutsch. ` +
    `Persönliche Betreuung durch Dr. Yıldırım vor, während und nach dem Eingriff. ` +
    `Alle Kontrolltermine bequem vor Ort. ` +
    `Keine versteckten Zusatzkosten durch Reise oder Hotel. ` +
    `[HINWEIS FÜR DAS TEAM: Bitte weitere USPs ergänzen – z. B. Zertifizierungen, spezielle Geräte, Alleinstellungsmerkmale.]`,
    {
      title: 'Warum EsteLife Hair',
      usps: [
        'Deutschland-Standard',
        'Kein Reiseaufwand',
        'Deutsch & Türkisch',
        'Persönliche Betreuung Dr. Yıldırım',
        'Kontrolltermine vor Ort',
        'Grevenbroich – zwischen Düsseldorf und Köln',
      ],
    },
    ['warum', 'vorteile', 'deutschland', 'nrw', 'vertrauen', 'qualitaet']
  ),

  // ─── İKİNCİ SEANS ────────────────────────────────────────────────────────
  kbItem(
    'faq',
    'Ist eine zweite Sitzung notwendig?',
    `Zweite Sitzung bei Haartransplantation EsteLife Hair: ` +
    `Bei ausgedehntem Haarausfall (z. B. Norwood 5–7) oder begrenzter Spenderdichte kann eine zweite Sitzung sinnvoll sein. ` +
    `Die Spenderdichte bestimmt, wie viele Grafts in einer Sitzung entnommen werden können – in der Regel 2.000–4.500 Grafts. ` +
    `Eine zweite Sitzung ist frühestens nach 12 Monaten möglich, sobald das Ergebnis der ersten Sitzung vollständig sichtbar ist. ` +
    `Ob eine zweite Sitzung nötig ist, wird in der kostenlosen Haaranalyse mit Dr. Yıldırım besprochen und geplant. ` +
    `[HINWEIS FÜR DAS TEAM: Bitte Rabatt oder Vorzugskonditionen für zweite Sitzung ergänzen, falls vorhanden.]`,
    {
      question: 'Ist eine zweite Sitzung notwendig?',
      answer: 'Nur bei großem Haarverlust oder begrenzter Spenderdichte. Frühestens nach 12 Monaten. Wird in Analyse besprochen.',
    },
    ['zweite-sitzung', 'norwood', 'spender', 'planung', 'faq']
  ),

  // ─── PRP TEDAVİSİ ────────────────────────────────────────────────────────
  kbItem(
    'service',
    'PRP-Behandlung (Eigenbluttherapie)',
    `PRP (Platelet-Rich Plasma) Behandlung bei EsteLife Hair Grevenbroich. ` +
    `Eigenblut wird entnommen, zentrifugiert und das plättchenreiche Plasma in die Kopfhaut injiziert. ` +
    `Stimuliert Haarfollikel, verlangsamt Haarausfall, verbessert Haardichte. ` +
    `Wird häufig ergänzend zur Haartransplantation eingesetzt, um die Einheilung zu unterstützen. ` +
    `Auch als eigenständige Behandlung bei frühem diffusen Haarausfall geeignet. ` +
    `Behandlungsdauer: ca. 45–60 Minuten. Empfohlene Frequenz: 3–4 Sitzungen im Abstand von 4–6 Wochen, danach Erhaltungstherapie. ` +
    `Keine Ausfallzeit. Leichte Rötung/Schwellung am Behandlungstag möglich. ` +
    `[HINWEIS FÜR DAS TEAM: Bitte Preis pro Sitzung und Paketangebote ergänzen.]`,
    {
      name: 'PRP-Behandlung',
      description: 'Eigenbluttherapie zur Haarwachstumsförderung. Ergänzend zu OP oder eigenständig.',
      duration: '45–60 Minuten',
      sessions_recommended: '3–4 Sitzungen, dann Erhaltungstherapie',
      downtime: 'Keine',
    },
    ['prp', 'eigenblut', 'haarwachstum', 'behandlung', 'erhaelt', 'plasma']
  ),

  // ─── RANDEVU / TERMİN AKIŞI ─────────────────────────────────────────────
  kbItem(
    'general',
    'Terminvereinbarung – So läuft es ab',
    `Terminvereinbarung bei EsteLife Hair Grevenbroich – Schritt für Schritt: ` +
    `1. Kostenlose Erstberatung: Kontakt per WhatsApp (+49 173 704 3983) oder Telefon. ` +
    `Auf Wunsch kann ein Foto zur ersten Einschätzung per WhatsApp gesendet werden – Dr. Yıldırım meldet sich persönlich. ` +
    `2. Persönliche Haaranalyse in der Klinik (Elfgener Platz 10, 41515 Grevenbroich): ` +
    `Norwood-Klassifikation, Spenderdichtemessung, individuelle Behandlungsplanung. ` +
    `3. OP-Termin: Nach gemeinsamer Planung wird der Operationstermin festgelegt. ` +
    `4. Operation: Je nach Methode 6–9 Stunden. Snacks, TV, Musik vorhanden. ` +
    `5. Nachsorge & Kontrolltermin: Nachsorgekit wird mitgegeben. Kontrolltermin nach ca. 10–14 Tagen. ` +
    `[HINWEIS FÜR DAS TEAM: Bitte Wartezeit auf Ersttermin und OP-Termin ergänzen – z. B. 'Ersttermin in der Regel innerhalb von X Tagen'.]`,
    {
      steps: [
        'Erstkontakt per WhatsApp/Telefon',
        'Kostenlose Haaranalyse in der Klinik',
        'OP-Termin vereinbaren',
        'Operation (6–9 Stunden)',
        'Nachsorge & Kontrolltermin',
      ],
      contact_whatsapp: '+49 173 704 3983',
    },
    ['termin', 'ablauf', 'buchung', 'erstgespraech', 'whatsapp', 'schritte']
  ),

  // ─── FOTO ANALİZ (WhatsApp yönlendirme) ─────────────────────────────────
  kbItem(
    'faq',
    'Kann ich ein Foto zur ersten Einschätzung senden?',
    `Fotoanalyse per WhatsApp bei EsteLife Hair: ` +
    `Ja – wer sich unsicher ist, ob eine Haartransplantation geeignet ist, kann ein Foto des Haaransatzes und Scheitels per WhatsApp senden. ` +
    `Dr. Yıldırım schaut sich das Foto persönlich an und gibt eine erste unverbindliche Einschätzung. ` +
    `WhatsApp: +49 173 704 3983. ` +
    `Wichtig: Die Fotoanalyse ersetzt keine persönliche Untersuchung. Für eine genaue Spenderdichtebewertung ist ein Termin in der Klinik notwendig. ` +
    `Die persönliche Analyse ist kostenlos und unverbindlich.`,
    {
      question: 'Kann ich ein Foto senden?',
      answer: 'Ja, per WhatsApp an +49 173 704 3983. Dr. Yıldırım gibt persönliche erste Einschätzung. Ersetzt keine Untersuchung.',
    },
    ['foto', 'whatsapp', 'einschaetzung', 'analyse', 'bild', 'faq']
  ),

]

// ─── PLAYBOOK GÜNCELLEME — Fallback responses doldurma ──────────────────────
// Mevcut whatsapp playbook'a fallback eklenecek (id ile bulunup update)
const updatedFallbackResponses = {
  no_kb_match:
    `Das kann ich leider nicht genau beantworten – schreiben Sie uns direkt auf WhatsApp (+49 173 704 3983) ` +
    `oder hinterlassen Sie Ihren Namen, damit sich das Team bei Ihnen meldet.`,
  off_topic:
    `Das liegt außerhalb meines Fachgebiets. Ich helfe gerne bei Fragen zur Haartransplantation, ` +
    `zu unseren Behandlungen oder zur Terminvereinbarung bei EsteLife Hair.`,
  kb_empty_3x:
    `Ich möchte Ihnen die bestmögliche Antwort geben – daher leite ich Sie direkt an Dr. Yıldırım weiter. ` +
    `Schreiben Sie uns: +49 173 704 3983.`,
  error:
    `Kurzzeitiger technischer Fehler. Bitte schreiben Sie uns direkt: +49 173 704 3983.`,
  outside_hours:
    `Gerade sind wir außerhalb der Sprechzeiten. Ihre Nachricht wurde gespeichert – ` +
    `wir melden uns schnellstmöglich. Dringende Anfragen gerne direkt per WhatsApp: +49 173 704 3983.`,
}

async function upsertKnowledgeItem(supabase, item) {
  const textToEmbed = `${item.title}\n\n${item.description_for_ai}`
  const embedding = await embed(textToEmbed)
  const payload = {
    organization_id: ORG_ID,
    item_type: item.item_type,
    title: item.title,
    description_for_ai: item.description_for_ai,
    data: item.data,
    tags: item.tags,
    is_active: true,
    embedding,
  }
  const { data: existing } = await supabase
    .from('knowledge_items')
    .select('id')
    .eq('organization_id', ORG_ID)
    .eq('item_type', item.item_type)
    .eq('title', item.title)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await supabase
      .from('knowledge_items')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw error
    return { action: 'updated', title: item.title }
  }
  const { error } = await supabase.from('knowledge_items').insert(payload)
  if (error) throw error
  return { action: 'inserted', title: item.title }
}

async function updatePlaybookFallbacks(supabase) {
  // Aktif whatsapp playbook'u bul ve fallback_responses'ı güncelle
  const { data: pb, error: fetchErr } = await supabase
    .from('agent_playbooks')
    .select('id, fallback_responses')
    .eq('organization_id', ORG_ID)
    .eq('channel', 'whatsapp')
    .eq('is_active', true)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (fetchErr) throw fetchErr
  if (!pb) return { action: 'skipped', reason: 'No active whatsapp playbook found' }

  const { error } = await supabase
    .from('agent_playbooks')
    .update({
      fallback_responses: updatedFallbackResponses,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pb.id)

  if (error) throw error
  return { action: 'updated', playbook_id: pb.id, channel: 'whatsapp' }
}

async function main() {
  loadEnv()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log(`\nEsteLife KB seed başlıyor — ${newKbItems.length} item işlenecek...\n`)

  const kbResults = []
  for (const item of newKbItems) {
    process.stdout.write(`  [${item.item_type}] "${item.title}" ... `)
    const result = await upsertKnowledgeItem(supabase, item)
    console.log(result.action)
    kbResults.push(result)
  }

  console.log('\nPlaybook fallback_responses güncelleniyor...')
  const playbookResult = await updatePlaybookFallbacks(supabase)
  console.log(`  ${playbookResult.action}`)

  console.log('\n=== ÖZET ===')
  const inserted = kbResults.filter(r => r.action === 'inserted').length
  const updated = kbResults.filter(r => r.action === 'updated').length
  console.log(`KB items: ${inserted} eklendi, ${updated} güncellendi`)
  console.log(`Playbook: ${playbookResult.action}`)
  console.log('\nTamamlandı.')
}

main().catch(err => { console.error(err); process.exit(1) })
