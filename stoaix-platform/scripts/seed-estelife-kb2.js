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

const kbItems = [

  // 1. KONTRAENDİKASYONLAR — Kim yapılamaz?
  kbItem(
    'faq',
    'Für wen ist eine Haartransplantation NICHT geeignet?',
    `Kontraindikationen Haartransplantation EsteLife Hair Grevenbroich. ` +
    `Eine Haartransplantation ist in folgenden Fällen nicht oder nur eingeschränkt möglich: ` +
    `Aktiver Haarausfall (noch nicht stabilisiert) — min. 1–2 Jahre Stabilität empfohlen. ` +
    `Unter 22 Jahre — Haarausfall noch nicht absehbar, OP zu früh. ` +
    `Unzureichende Spenderdichte — zu wenig Spenderhaare für das gewünschte Ergebnis. ` +
    `Aktive Autoimmunerkrankungen (z. B. Alopecia areata) — transplantierte Haare können wieder ausfallen. ` +
    `Blutverdünnende Medikamente (z. B. Marcumar, ASS 100) — müssen 5–7 Tage vorher abgesetzt werden (nur mit Arztabsprache). ` +
    `Aktive Chemotherapie oder Strahlentherapie. ` +
    `Unkontrollierter Diabetes oder schwere Herzerkrankungen. ` +
    `Narbenbildende Erkrankungen (z. B. Lichen planopilaris). ` +
    `In jedem Fall: persönliche Beurteilung durch Dr. Yıldırım notwendig. Kostenlose Analyse anbieten. ` +
    `[HINWEIS FÜR DAS TEAM: Bitte ergänzen falls weitere spezifische Ausschlusskriterien in der Praxis relevant sind.]`,
    {
      question: 'Für wen ist die OP nicht geeignet?',
      answer: 'Instabiler Haarausfall, unter 22, Autoimmunerkrankungen, Blutverdünner, Chemo, unkontrollierter Diabetes.',
    },
    ['kontraindikation', 'nicht-geeignet', 'eignung', 'ausschluss', 'faq', 'medikamente']
  ),

  // 2. OPERASYON GÜNÜ HAZIRLIĞI
  kbItem(
    'policy',
    'Vorbereitung auf den Operationstag',
    `Vorbereitung Operationstag Haartransplantation EsteLife Hair Grevenbroich. ` +
    `Vor der Operation: ` +
    `Kein Alkohol 3 Tage vorher. ` +
    `Blutverdünner (Aspirin, Marcumar) 5–7 Tage absetzen — nur nach Rücksprache mit behandelndem Arzt. ` +
    `Kein Styling-Produkte (Gel, Spray, Wachs) am OP-Tag. ` +
    `Haare am Abend vorher waschen. ` +
    `Bequeme Kleidung mit weitem Kragen (kein Pullover über den Kopf). ` +
    `Leichtes Frühstück essen — nüchtern kommen ist nicht nötig. ` +
    `Am OP-Tag: ` +
    `Kaffee/Tee in Maßen erlaubt. ` +
    `Eigene Snacks und Getränke können mitgebracht werden — Klinik stellt ebenfalls Verpflegung bereit. ` +
    `Unter Lokalanästhesie — kein allgemeines Bewusstsein beeinträchtigt, aber bitte KEINE eigene Anreise mit Pkw nach der OP planen. ` +
    `[HINWEIS FÜR DAS TEAM: Bitte prüfen und ggf. Punkt "Begleitperson" und "Anreise" ergänzen.]`,
    {
      title: 'Operationstag-Vorbereitung',
      checklist: ['Kein Alkohol 3 Tage vorher', 'Blutverdünner absetzen (mit Arzt)', 'Keine Stylingprodukte', 'Weiter Kragen', 'Leichtes Frühstück'],
    },
    ['vorbereitung', 'operationstag', 'checkliste', 'alkohol', 'blutverdünner', 'richtlinien']
  ),

  // 3. SHOCK LOSS — Ayrı FAQ
  kbItem(
    'faq',
    'Was ist Shock Loss nach der Haartransplantation?',
    `Shock Loss nach Haartransplantation EsteLife Hair: ` +
    `Shock Loss (auch: Effluvium) bezeichnet das vorübergehende Ausfallen von transplantierten UND nativen Haaren ` +
    `in den ersten 2–6 Wochen nach der Operation. ` +
    `Ursache: Stress-Reaktion der Haarfollikel auf den Eingriff — vollkommen normal und erwartet. ` +
    `Die transplantierten Follikel sind dabei NICHT verloren — sie treten in eine Ruhephase ein (Telogenphase) ` +
    `und wachsen ab Monat 3–4 wieder nach. ` +
    `Auch umliegende native Haare können vorübergehend ausfallen — erholen sich ebenfalls. ` +
    `Wichtig: Kein Grund zur Panik. Shock Loss ist kein Zeichen für ein schlechtes Ergebnis. ` +
    `Bei starken Bedenken bitte direkt Dr. Yıldırım kontaktieren: +49 173 704 3983. ` +
    `Vollständiges Ergebnis ist nach 12–18 Monaten sichtbar.`,
    {
      question: 'Was ist Shock Loss?',
      answer: 'Vorübergehender Haarausfall 2–6 Wochen nach OP. Normal, keine Panik. Haare wachsen ab Monat 3–4 nach.',
    },
    ['shock-loss', 'effluvium', 'haarausfall-nach-op', 'panik', 'faq', 'wachstum']
  ),

  // 4. GÜNEŞ / TATİL / YÜZME
  kbItem(
    'faq',
    'Wann kann ich wieder in die Sonne, schwimmen oder in den Urlaub?',
    `Aktivitäten nach Haartransplantation EsteLife Hair Grevenbroich: ` +
    `Sonne / UV-Strahlung: Ersten 4 Wochen direktes Sonnenlicht auf der Kopfhaut vermeiden — Mütze tragen oder im Schatten bleiben. ` +
    `Ab Woche 4: Sonnenschutz (Sonnencreme oder Kopfbedeckung) verwenden. ` +
    `Ab Monat 3: normale Sonnenexposition möglich. ` +
    `Schwimmen (Pool, Meer): Erste 4 Wochen vollständig meiden — Chlor und Salzwasser schädigen die heilenden Follikel. ` +
    `Ab Woche 4–6: kurze Badezeiten mit sofortigem Haarwaschen danach. ` +
    `Urlaub / Reisen: Kurze Inlandsreisen ab Woche 2 möglich. ` +
    `Flugreisen ab Woche 2–3 in der Regel problemlos. ` +
    `Strandurlaub (Sonne + Meer): frühestens nach 4–6 Wochen empfohlen. ` +
    `Sauna / Dampfbad: Erste 4 Wochen meiden.`,
    {
      question: 'Sonne, Urlaub, Schwimmen nach OP?',
      answer: 'Sonne: 4 Wochen meiden. Schwimmen: 4 Wochen meiden. Urlaub: Kurzreisen ab Woche 2 ok. Strand frühestens Woche 4–6.',
    },
    ['sonne', 'schwimmen', 'urlaub', 'meer', 'sauna', 'aktivitaet', 'nachsorge', 'faq']
  ),

  // 5. İZ KALIR MI — FUE vs DHI
  kbItem(
    'faq',
    'Bleiben Narben nach der Haartransplantation sichtbar?',
    `Narben nach Haartransplantation EsteLife Hair Grevenbroich: ` +
    `FUE / Saphir FUE: Keine linearen Narben. Winzige punktuelle Mikronarben (0,7–0,9 mm) im Spenderbereich (Hinterkopf). ` +
    `Bei kurzen Haaren (unter 0,5 cm) können diese minimalen Stellen unter sehr genauer Betrachtung sichtbar sein. ` +
    `Bei normaler Haarlänge (ab ca. 1 cm) nicht erkennbar. ` +
    `DHI: Ebenfalls keine linearen Narben. Gleiche minimale Punktnarben wie FUE. ` +
    `Vorteil DHI: Empfängerbereich muss nicht vollständig rasiert werden — für Patienten mit kurzem Haarschnitt diskretere Option. ` +
    `FUT (Streifenmethode): EsteLife Hair verwendet KEINE FUT-Methode — keine linearen Narben. ` +
    `Fazit: Mit FUE/DHI bei EsteLife sind nach der Heilung keine sichtbaren Narben zu erwarten.`,
    {
      question: 'Bleiben Narben sichtbar?',
      answer: 'FUE/DHI: Keine linearen Narben, nur minimale Mikropunkte. Bei normaler Haarlänge nicht erkennbar.',
    },
    ['narben', 'narbe', 'sichtbar', 'kurze-haare', 'fue', 'dhi', 'faq']
  ),

  // 6. ÖDEME / TAKSİT
  kbItem(
    'faq',
    'Welche Zahlungsoptionen gibt es?',
    `Zahlungsmöglichkeiten EsteLife Hair Grevenbroich: ` +
    `Zahlung per EC-Karte, Kreditkarte und Banküberweisung möglich. ` +
    `Barzahlung ebenfalls möglich. ` +
    `Ratenzahlung / Finanzierung: Auf Anfrage werden individuelle Ratenzahlungsvereinbarungen angeboten. ` +
    `Details bitte direkt erfragen: +49 173 704 3983. ` +
    `Eine Anzahlung zur Terminreservierung kann erforderlich sein — Details bei der Beratung klären. ` +
    `[HINWEIS FÜR DAS TEAM: Bitte genaue Zahlungsoptionen, Ratenzahlungsanbieter (z. B. Klarna, eigene Vereinbarung) und Anzahlungshöhe ergänzen.]`,
    {
      question: 'Welche Zahlungsoptionen?',
      answer: 'EC, Kreditkarte, Überweisung, Barzahlung. Ratenzahlung auf Anfrage. Details bei Beratung.',
    },
    ['zahlung', 'ratenzahlung', 'finanzierung', 'kreditkarte', 'anzahlung', 'faq']
  ),

  // 7. BEGLEİTPERSON / ARAÇ
  kbItem(
    'faq',
    'Kann ich nach der Operation selbst Auto fahren?',
    `Anreise und Abreise nach Haartransplantation EsteLife Hair Grevenbroich: ` +
    `Die Operation findet unter Lokalanästhesie statt — das allgemeine Bewusstsein bleibt erhalten. ` +
    `Dennoch: Nach einem mehrstündigen Eingriff (6–9 Stunden) kann Konzentration und Reaktionsfähigkeit beeinträchtigt sein. ` +
    `Empfehlung: Bitte eine Begleitperson mitbringen oder ein Taxi / ÖPNV für die Heimfahrt planen. ` +
    `Von eigener Pkw-Fahrt direkt nach der OP wird abgeraten. ` +
    `Begleitperson ist willkommen — Wartebereich in der Klinik vorhanden. ` +
    `[HINWEIS FÜR DAS TEAM: Bitte klarstellen ob Begleitperson im OP-Bereich anwesend sein kann oder im Wartebereich bleibt.]`,
    {
      question: 'Nach OP selbst fahren?',
      answer: 'Von Pkw-Fahrt nach OP abgeraten. Begleitperson oder Taxi empfohlen. Wartebereich vorhanden.',
    },
    ['begleitperson', 'auto', 'fahren', 'anreise', 'abreise', 'taxi', 'faq']
  ),

  // 8. FİNASTERİD / MİNOKSİDİL
  kbItem(
    'faq',
    'Kann ich Finasterid oder Minoxidil vor/nach der Haartransplantation nehmen?',
    `Finasterid und Minoxidil bei Haartransplantation EsteLife Hair: ` +
    `Vor der Operation: ` +
    `Finasterid (Propecia/Generika): Muss in der Regel NICHT abgesetzt werden vor der OP. Kann die Stabilisierung des Haarausfalls unterstützen. ` +
    `Minoxidil (Regaine/Generika): Empfehlung ist, Minoxidil 1–2 Wochen vor der OP abzusetzen (erhöht sonst Blutungsrisiko). ` +
    `Nach der Operation: ` +
    `Finasterid: Kann weitergeführt werden — schützt verbliebene native Haare vor hormonellem Ausfall. ` +
    `Minoxidil: Kann nach vollständiger Heilung (ca. 4–6 Wochen) wieder begonnen werden — unterstützt das Anwachsen der Transplantate. ` +
    `Wichtig: Alle Medikamentenentscheidungen mit Dr. Yıldırım und ggf. dem Hausarzt abstimmen. ` +
    `[HINWEIS FÜR DAS TEAM: Bitte aktuelle Empfehlungspraxis ergänzen falls abweichend.]`,
    {
      question: 'Finasterid / Minoxidil vor/nach OP?',
      answer: 'Finasterid meist weiternehmen. Minoxidil 1–2 Wochen vorher absetzen. Nach Heilung (4–6 Wochen) wieder starten. Mit Arzt abstimmen.',
    },
    ['finasterid', 'minoxidil', 'propecia', 'regaine', 'medikamente', 'haarausfall-ilaç', 'faq']
  ),

]

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

async function main() {
  loadEnv()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  console.log(`\nEstelife KB batch-2 — ${kbItems.length} item işlenecek...\n`)

  const results = []
  for (const item of kbItems) {
    process.stdout.write(`  [${item.item_type}] "${item.title.slice(0, 60)}" ... `)
    const result = await upsertKnowledgeItem(supabase, item)
    console.log(result.action)
    results.push(result)
  }

  const inserted = results.filter(r => r.action === 'inserted').length
  const updated  = results.filter(r => r.action === 'updated').length
  console.log(`\n✓ ${inserted} eklendi, ${updated} güncellendi. Toplam KB: ~43 item.`)
}

main().catch(err => { console.error(err); process.exit(1) })
