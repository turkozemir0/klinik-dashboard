# Voice Agent Research: Human-Like, Non-Robotic, Sales-Capable Voice Assistants

## Objective

This document focuses on one goal:

Build voice assistants that make a clinic owner say:

"This is surprisingly human. I can actually imagine using this."

For STOAIX, that means the assistant must sound:

- natural, not robotic
- concise, not tiring
- helpful, not scripted
- persuasive, not pushy
- structured enough to sell
- flexible enough to feel human

This research is tailored to the current STOAIX voice stack:

- LiveKit Agents
- Deepgram STT
- OpenAI LLM
- Cartesia TTS
- SIP / phone calls

It also includes recommendations for a possible future A/B path with native speech-to-speech models.

---

## Executive Summary

The biggest mistake teams make is thinking "human-like" comes mostly from a better voice model.

It does not.

The strongest drivers of perceived humanness in phone agents are usually:

1. turn-taking quality
2. response length discipline
3. interruption handling
4. conversation-state control
5. prosody and pacing
6. contextual memory
7. variation in phrasing
8. good escalation logic

For STOAIX specifically, the path to a much stronger demo is:

1. Upgrade turn-taking behavior first.
2. Split the prompt into explicit conversation states.
3. Enforce short spoken turns by default.
4. Add variation rules so the agent does not repeat stock lines.
5. Add sales behavior as consultative discovery, not aggressive pitching.
6. Use dynamic TTS controls by state, not one flat voice style.
7. Build evals around "does this sound human?" instead of only "did the task complete?"

My strongest practical conclusion:

Your current architecture can get much better without a full rebuild.

But if your target is "wow, this sounds almost like a real person", you should also A/B test a native speech-to-speech path such as OpenAI `gpt-realtime`, because the official docs explicitly position speech-to-speech as the architecture that better preserves emotion, intent, and low-latency natural interaction than chained STT -> text LLM -> TTS pipelines. That is especially relevant for demos and premium clinic sales conversations.

---

## What "Human-Like" Actually Means In Voice

People do not judge humanness by "voice quality" alone.

They judge it by the full interaction:

- Does it interrupt me at the wrong time?
- Does it pause too long before replying?
- Does it sound like it understood why I asked?
- Does it answer first and only then ask for information?
- Does it sound repetitive?
- Does it keep asking checklist questions like a bot?
- Does it adapt if I sound rushed, skeptical, confused, or busy?

In practice, "robotic" usually comes from one of five failure modes:

### 1. The assistant over-talks

This is one of the fastest ways to irritate callers.

Voice is linear. Unlike text, users cannot skim. Google conversation design guidance and Amazon Alexa design guidance both emphasize brief, relevant turns because long spoken turns increase cognitive load and listener fatigue.

Implication for STOAIX:

- default spoken turns should usually be 1 to 3 short sentences
- long explanations should be broken into chunks
- after each chunk, the caller should get a chance to steer

### 2. The assistant sounds too consistent

Humans repeat ideas, but not the same sentence shape every time.

OpenAI's realtime prompting guide explicitly recommends adding variety rules and sample phrases that vary instead of being reused identically. If you do not instruct for variation, the model often locks into one or two stock phrasings and begins to sound synthetic.

Implication:

- never use only one canonical acknowledgment line
- never use one fixed greeting
- never use one fixed clarification phrase
- define phrase families per state

### 3. The assistant asks questions like a form

Human sales reps do not sound like intake software.

They answer, react, then gather information naturally.

Your current prompt already has a good instinct here by saying:

- answer the user's question first
- ask for information one at a time

That should be expanded into a full conversation-state design.

### 4. The assistant handles interruptions badly

Bad interruption behavior kills realism faster than mediocre wording.

If the caller says "hmm", "tamam", "evet", or starts to interject, and the assistant either:

- hard stops too often
- fails to stop when it should
- gets stuck in silence

the illusion breaks immediately.

### 5. The assistant has no social sense

Human-like agents acknowledge:

- urgency
- frustration
- uncertainty
- hesitation
- time pressure
- trust barriers

Sales effectiveness is strongly tied to this. The best sales assistants do not sound "salesy"; they sound context-aware and helpful.

---

## The Highest-Leverage Technical Areas

## 1. Turn-Taking And Interruptions

If I had to prioritize one system area for a voice demo, it would be this.

### Why it matters

If the assistant responds too slowly, it feels dumb.

If it responds too quickly, it cuts the user off and feels rude.

If it stops talking every time the user says "hmm" or "evet", it feels broken.

### What the latest docs say

LiveKit documents adaptive interruption handling that distinguishes real barge-ins from backchanneling like "uh-huh", "okay", or "right". Their docs say it analyzes acoustic signals rather than only relying on transcript timing, which reduces unnecessary interruptions and makes interactions smoother. LiveKit also says this is enabled by default in LiveKit Cloud when VAD is enabled, the LLM is not a realtime model, and the STT supports aligned transcripts.

Deepgram's newer Flux conversational STT is built specifically for voice agents and exposes end-of-turn controls:

- `eot_threshold`
- `eager_eot_threshold`
- `eot_timeout_ms`

Deepgram explicitly positions different configurations for:

- low latency
- high reliability
- complex RAG/tool-calling pipelines

That matters a lot for STOAIX because your agent is exactly a tool-calling, RAG-heavy, multilingual phone workflow.

### Current STOAIX gap

Current code uses:

- `deepgram.STT(model="nova-2", language=tts_lang)`
- `silero.VAD.load()`

This is workable, but it is not the best currently-documented Deepgram path for conversational voice agents.

### Recommendation

For demo quality and more human turn-taking:

1. A/B test Deepgram Flux instead of Nova-2 for voice calls.
2. Keep silence tolerance longer than you think for older, cautious, or skeptical callers.
3. Tune turn-taking differently by call state.

Suggested starting profiles:

- Greeting/discovery:
  - slightly conservative
  - prioritize not cutting the caller off
- FAQ/Q&A:
  - faster end-of-turn
  - optimize responsiveness
- Data capture:
  - more conservative, because caller may spell names or pause between digits
- Booking/confirmation:
  - slower, deliberate, confirmation-focused

Deepgram also documents dynamic mid-stream configuration, including injecting keyterms and changing turn behavior during the call. That is very important for structured voice sales flows.

### STOAIX-specific design move

When you ask for:

- name
- phone number
- city
- treatment type
- appointment date

you should temporarily switch STT into a more careful mode and inject expected vocabulary. Deepgram explicitly recommends dynamically biasing keyterms for the current step, including cases like collecting a customer name.

This is a major quality improvement opportunity.

---

## 2. Response Length Control

This is the second-biggest lever after turn-taking.

### Core rule

A voice assistant should not answer like ChatGPT text.

OpenAI's voice agent docs explicitly recommend:

- concise conversational tone
- short sentences
- no lists/enumerations
- no markdown-style formatting

The realtime prompting docs also show explicit length controls like:

- `2–3 sentences per turn`

### Why this matters

Long answers sound robotic even if the words are good.

Human reps usually do this:

1. brief acknowledgment
2. direct answer
3. one forward-moving question

Bad voice agents do this:

1. big greeting
2. big explanation
3. policy dump
4. mini pitch
5. then finally a question

### Recommendation

Define a response-length policy by state:

- Greeting:
  - 1 to 2 sentences
- Discovery:
  - answer in 1 to 2 sentences, then 1 question
- FAQ:
  - 2 to 3 short sentences max
- Objection handling:
  - acknowledge, address, check reaction
- Booking:
  - 1 instruction at a time
- Error recovery:
  - 1 calm sentence + 1 retry question

### Important nuance

Short does not mean cold.

The trick is:

- short content
- warm tone
- smooth pacing

Example:

Bad:
"Kliniğimiz saç ekimi, dental implant, estetik cerrahi ve çeşitli medikal estetik uygulamaları sunmaktadır. Bunların her biri için süreç farklılık göstermekte olup ön değerlendirme sonrasında net bilgi paylaşılmaktadır."

Better:
"Elbette. Bu tarafta saç ekimi ve estetik işlemler için ön değerlendirme yapabiliyoruz. İsterseniz size en uygun süreci hızlıca netleştirelim."

Same information density direction, much better spoken UX.

---

## 3. Prompt Structure: Move From "Rules" To "Conversation Operating System"

Your current prompt has useful rules, but it is still mostly a long policy block.

The latest OpenAI realtime prompting guidance recommends explicit labeled sections such as:

- Role & Objective
- Personality & Tone
- Context
- Tools
- Instructions / Rules
- Conversation Flow
- Safety & Escalation

It also explicitly recommends flow snippets and sample phrases for each state.

### Recommendation

Refactor STOAIX playbooks into a state-based prompt model.

Use a prompt structure like this:

1. Role & Objective
2. Brand Persona
3. Call Intent
4. Conversation State Machine
5. State-Specific Response Rules
6. Data Capture Rules
7. Sales Rules
8. Tool Rules
9. Escalation Rules
10. Language / Accent / Pronunciation Rules
11. Variety Rules

### Minimum state set for clinic sales / intake

Suggested states:

- `opening`
- `reason_for_call`
- `discovery`
- `faq_answering`
- `soft_qualification`
- `objection_handling`
- `commitment`
- `booking`
- `handoff`
- `close`

### Why this helps

Without state logic, the model improvises too much.

Improvisation is good for naturalness, bad for consistency.

You want controlled freedom:

- freedom of phrasing
- constraint of business logic

Pipecat Flows is worth studying here because it is explicitly designed for structured conversations and includes examples like patient intake, insurance quotes, reservations, and warm transfers. Even if you stay on LiveKit, the design pattern is valuable.

Inference:

For STOAIX, the ideal system is not a fully open conversation engine and not a rigid IVR tree.

It is a guided flow with flexible phrasing inside each state.

---

## 4. Make The Assistant Sound Human Without Becoming Annoying

Teams often over-correct here.

They hear "sound human" and add:

- filler words everywhere
- too much enthusiasm
- fake laughter
- overly casual tone

That usually backfires in B2B or clinic contexts.

### The right target

The right target is not "friend talking on the phone."

It is:

"competent, warm, socially aware front-desk/sales coordinator."

### How to achieve that

#### Persona depth

Google's conversation design guidance argues that all voices project a persona whether planned or not. If you do not define one, the default often feels flat or inconsistent.

For STOAIX clinic assistants, define persona on these axes:

- warmth: medium-high
- confidence: high
- enthusiasm: medium
- formality: medium
- empathy: medium-high
- urgency: adaptive
- assertiveness: medium

#### Filler policy

Use fillers sparingly.

For example:

- okay occasionally
- tabii
- anladım
- bir saniye
- haklısınız

Avoid:

- constant "eee", "ııı", "şey"
- fake over-humanization

My recommendation:

- written prompt can allow "occasional natural spoken fillers"
- never "often"
- never during critical data capture

#### Acknowledgment library

Create a rotating library of acknowledgments by intent:

- interest:
  - "Tabii."
  - "Elbette."
  - "Memnuniyetle."
- concern:
  - "Anlıyorum."
  - "Haklısınız, bu önemli."
  - "Bu noktayı netleştirelim."
- hesitation:
  - "İsterseniz hızlıca birlikte bakalım."
  - "Kafanızdaki kısmı netleştirebiliriz."
- interruption recovery:
  - "Tabii, buyurun."
  - "Sizi dinliyorum."
  - "Orayı açayım."

This reduces robot repetition while keeping brand consistency.

#### Emotional discipline

Cartesia Sonic 3 supports speed, volume, emotion, SSML-style tags, and pauses. Cartesia also recommends stable, realistic voices for production voice agents over more emotive voices.

That is exactly the right lesson for STOAIX:

- do not choose a highly theatrical voice
- choose a stable, realistic base voice
- add controlled emotional modulation by state

For example:

- opening: calm, welcoming
- FAQ: neutral-confident
- objection handling: calm, reassuring
- booking close: slightly upbeat/confident
- apology/recovery: sympathetic, calm

Important:

Cartesia says emotion controls are guidance, not exact deterministic controls, and recommends testing against your real content. So emotion should be used as a light nudge, not a crutch.

---

## 5. Sales-Like, But Not Pushy: The Right Sales Psychology

This is the area where many AI voice demos fail.

They either:

- sound like customer support, not sales
- or sound like hard-selling telemarketers

Neither is ideal for premium clinics.

### What you actually want

You want a consultative sales coordinator.

Not:

- hype machine
- closing machine
- scripted appointment setter

But:

- diagnostic
- reassuring
- outcome-oriented
- commercially aware

### Best sales style for STOAIX

For healthcare clinics and high-trust services, the best voice-sales behavior is:

- consultative
- problem-led
- lightly persuasive
- trust-first

HubSpot's consultative selling and SPIN summaries are useful here because they emphasize:

- understanding first
- diagnosing real needs
- not pushing a solution before understanding the problem
- guiding the buyer to articulate the need

For STOAIX, this means the assistant should behave more like:

"Let me understand your situation, then I’ll point you to the best next step."

not:

"Let me tell you why we’re amazing."

### Recommended sales micro-structure

For inbound clinic or service calls:

1. Warm opening
2. Understand reason for calling
3. Clarify intent
4. Answer immediate concern
5. Discover fit / urgency / eligibility
6. Tie answer back to likely outcome
7. Offer a light next step
8. Book / handoff / follow-up

### Suggested behavioral rules

The assistant should:

- lead with relevance, not pitch
- ask one useful question at a time
- answer before gathering more information
- never ignore emotional cues
- softly summarize what it heard
- recommend a next step only after enough context exists

The assistant should not:

- over-explain services too early
- force a booking too soon
- stack 3 to 5 questions at once
- sound excited when the caller sounds worried
- use generic "limited time / best deal" sales language

---

## 6. A Concrete Sales Persona For STOAIX Clinic Agents

Here is the persona I would optimize for in demos:

### Persona concept

"Trusted clinic coordinator with light sales instinct."

### Behavioral profile

- Sounds like an experienced patient coordinator or admissions advisor
- Speaks clearly and warmly
- Does not rush anxious callers
- Can guide indecisive callers
- Knows when to move toward booking
- Never sounds desperate to close

### Communication formula

Use this pattern repeatedly:

1. acknowledge
2. answer or clarify
3. connect to caller's situation
4. suggest next step

Example:

Caller:
"Fiyatlarınız çok yüksek olmaz değil mi?"

Bad AI:
"Fiyatlandırmalarımız işlem türüne göre değişiklik göstermektedir. Kampanyalarımız hakkında bilgi almak için ad soyad ve telefon numaranızı paylaşabilir misiniz?"

Better AI:
"Bu işlemde fiyat, ihtiyaç ve planlamaya göre değişebiliyor. Ama isterseniz sizi yanlış yönlendirmeden önce hangi işlemle ilgilendiğinizi netleştirelim; ona göre daha anlamlı bilgi verebilirim."

Why it works:

- acknowledges concern
- answers partially
- avoids fake precision
- asks a relevant next question
- feels human and commercially competent

---

## 7. The "One Question Too Many" Problem

One of the main reasons voice agents feel robotic is that they ask too many questions before providing value.

This is especially dangerous in clinic and healthcare tourism contexts, where callers often want one of these first:

- rough fit
- rough price direction
- process overview
- timing
- trust

### Recommendation

Use a "value before extraction" rule.

For every information request, ask:

"Did we already give the caller enough reason to continue?"

Practical rule:

- no more than one unanswered information request at a time
- after two data-capture turns, return value

Example pattern:

1. caller asks about treatment
2. assistant gives useful overview
3. assistant asks one tailored question
4. caller answers
5. assistant uses that answer to give more relevant value

That loop feels much more human.

---

## 8. Human-Like Speech Output: TTS Strategy

TTS quality absolutely matters, but mostly after the conversational structure is good.

### What Cartesia's docs imply for STOAIX

Cartesia documents:

- stable, realistic voices work better for voice agents
- Sonic 3 supports speed, volume, emotion, laughter, pauses, and SSML-like controls
- emotion shifts mid-generation are less reliable than using separate generation contexts

### What to do

#### Choose one "production realism" voice per language

For clinics:

- Turkish female: calm, clear, credible
- Turkish male: optional depending on clinic brand
- English variants for tourism clinics: polished, confident, internationally understandable

#### Use state-based prosody

Not one voice style for the whole call.

Map TTS controls by state:

- `opening`:
  - slightly slower
  - warmer
- `discovery`:
  - neutral pace
  - attentive
- `digits/spelling`:
  - slower and clearer
- `reassurance`:
  - calm, softer, slightly slower
- `booking close`:
  - slightly faster, more confident

#### Use pauses intentionally

SSML breaks can help:

- before a key reassurance
- before reading a date/time
- before confirming a booking

But overusing pauses will sound theatrical.

#### Do not chase "maximum emotive"

For clinic sales, exaggerated emotion decreases trust.

What sounds best is:

- stable
- clear
- confident
- slightly expressive

not:

- overly bubbly
- overly dramatic
- over-acted empathy

---

## 9. Retrieval And Context: Answer Like A Human Who Actually Knows The Business

Many agents sound robotic because they answer in generic language even when KB exists.

Your current code does on-turn vector search and injects matched knowledge as system context. That is a good base.

But there are still quality upgrades available.

### Recommendation

#### Retrieve by state and intent, not only raw similarity

For example, separate retrieval buckets:

- service overview
- price guidance
- candidacy / eligibility
- process / timeline
- location / logistics
- aftercare / policy
- objections

Then bias retrieval by current state.

Why:

If the caller says:

"Peki bu işlem kaç gün sürüyor?"

you do not want five semantically similar chunks from mixed topics. You want:

- process duration
- arrival timeline
- number of visits
- recovery expectation

#### Add sales-oriented knowledge items

Not only factual KB.

You also need:

- trust-building reframes
- common objections
- gentle next-step offers
- clinic differentiators
- handoff triggers

That allows the assistant to sound less like FAQ software and more like a skilled coordinator.

---

## 10. How To Avoid Irritating The Caller

This deserves its own section because "not annoying" is half the win.

### Main irritation triggers

1. Too much talking
2. Repeating the same wording
3. Asking before answering
4. Repeating already-known info requests
5. Saying obvious things
6. Over-apologizing
7. Over-enthusiasm
8. Fake certainty
9. Bad repair after misunderstanding
10. No graceful exit or handoff

### Anti-irritation rules

- Never give more than one main idea before checking alignment.
- Never ask for contact details before answering at least one substantive question, unless the caller started with booking intent.
- Never say the full company intro after the first turn.
- Never repeat a greeting or acknowledgment phrase within a short window.
- Never say "I understand" unless the next sentence proves understanding.
- Never read more than one or two options aloud unless absolutely necessary.
- Never ask the caller to memorize long spoken content.

Amazon's voice design guidance is strong here: spoken responses should be readable in one or two breaths, use simple sentence structures, and avoid burdening the listener with long options or long readouts.

---

## 11. Repair Behavior: One Of The Biggest Markers Of Intelligence

Human conversations are messy.

The assistant must handle:

- partial speech
- unclear audio
- accent variance
- caller changes topic mid-turn
- caller answers indirectly
- caller gives extra information

### The difference between bad and great agents

Bad agent:

"I didn't understand. Please repeat."

Great agent:

"Sanırım fiyat kısmını soruyorsunuz. Eğer isterseniz onu netleştireyim; sonra uygunluk tarafına geçeriz."

### Recommendation

Build explicit repair patterns:

- confirm probable intent
- offer a narrow clarification
- continue smoothly

Repair pattern library:

- low confidence:
  - "Tam net duyamadım; fiyat mı soruyordunuz, süreç mi?"
- partial capture:
  - "Şunu doğru anladıysam saç ekimiyle ilgileniyorsunuz, doğru mu?"
- interruption:
  - "Tabii, buyurun."
- caller changes topic:
  - "Elbette, önce onu cevaplayayım."

This is a major realism driver.

---

## 12. Digit, Name, And Date Handling

This is disproportionately important in phone calls.

OpenAI's voice guidance explicitly recommends repeating back names, phone numbers, and other critical values for confirmation.

Your current prompt already says:

- speak numbers in words

That is useful, but not enough.

### Recommendation

Add a dedicated confirmation policy:

- names:
  - repeat back and confirm
- phone numbers:
  - chunk and confirm
- dates:
  - say full date naturally
- times:
  - repeat twice if booking-critical

Example:

"Numarayı doğru aldım mı kontrol edeyim: sıfır beş otuz iki, yüz yirmi üç, kırk beş, altmış yedi. Doğru mu?"

Also:

During these steps, slow TTS speed slightly.

---

## 13. Conversation Memory And Context Awareness

Google's conversation design guidance stresses that systems should track what was already said and use context instead of acting like each utterance is isolated.

This is critical for perceived intelligence.

### Recommendation

Maintain explicit short-term call memory fields:

- caller_goal
- service_interest
- urgency
- price_sensitivity
- trust_concern
- preferred_language
- qualification_progress
- objections_raised
- next_best_action

Then use that state to control both:

- retrieval
- phrasing

Example:

If `price_sensitivity = high`, answer later price questions differently:

- more framing
- less generic
- earlier anchoring around value and fit

If `urgency = high`, shorten discovery and move faster to booking/handoff.

If `trust_concern = high`, slow down and use social proof or process clarity before asking for commitment.

---

## 14. A Better Sales Flow For STOAIX Clinic Demos

Here is the exact demo behavior I would aim for.

## Demo goal

Make the clinic owner feel:

- this sounds human
- this sounds commercially useful
- this could reduce my front-desk or call center load
- this could qualify and move leads forward without sounding robotic

## Recommended demo scenario

Do not demo only FAQ.

Demo a mixed call:

1. Greeting
2. Price/process question
3. Clarification
4. Light objection
5. Qualification
6. Booking / handoff suggestion

Why:

Pure FAQ demos are too easy and do not prove commercial value.

Pure booking demos feel scripted.

Mixed-flow demos show real intelligence.

### Best demo script shape

Caller:
"Saç ekimi düşünüyorum ama önce fiyat ve süreç hakkında bilgi almak istiyorum."

Agent should:

1. briefly acknowledge
2. explain broad pricing/process honestly
3. ask one qualifier
4. adapt answer using qualifier
5. handle hesitation naturally
6. suggest next step softly

That gives the strongest "wow" moment.

---

## 15. Should STOAIX Stay On Chained STT -> LLM -> TTS Or Test Speech-to-Speech?

This is an important strategic question.

## Current reality

Chained pipelines still work very well.

With the right turn-taking, prompting, and TTS control, they can feel excellent.

Your current stack is capable of strong production quality.

## But the latest official guidance matters

OpenAI's voice agent docs describe speech-to-speech as the architecture that directly processes audio and does not rely only on transcript text. OpenAI's product announcement for `gpt-realtime` specifically says this reduces latency, preserves nuance, and yields more natural expressive responses than traditional chained pipelines.

### My recommendation

Do both:

1. Improve current stack now because it is already integrated into your platform.
2. In parallel, run an A/B demo track with native speech-to-speech.

Use S2S especially for:

- premium demos
- English-speaking medical tourism clinics
- emotionally sensitive call flows
- "wow factor" showcase calls

Keep chained architecture for:

- reliability-sensitive flows
- strict structured tool-calling
- production steps where transcript traceability matters more

Inference:

For STOAIX, the likely best future setup is hybrid:

- structured production pipeline for most telephony
- high-end S2S mode for premium demos and selected premium clients

---

## 16. What To Change In The Current STOAIX Codebase First

Looking at the current `voice-agent/agent.py`, the foundations are already respectable:

- DB-driven playbook
- RAG injection
- intake schema
- booking tools
- handoff logging
- transcript persistence

That is good infrastructure.

The next changes should focus on conversation quality, not just features.

## Priority 1: Replace "single monolithic prompt" with stateful prompt sections

Current prompt has:

- rules
- KB
- intake
- routing
- blocks
- handoff

Needed next:

- explicit conversation states
- example phrase families
- length rules per state
- sales rules per state
- repair rules
- objection-handling rules

## Priority 2: Upgrade STT path for agent-style conversations

Test Deepgram Flux for:

- turn-taking
- pause tolerance
- low-latency responsiveness
- dynamic step-specific keyterms

## Priority 3: Explicit anti-robot rules

Add:

- variety section
- no repeated sentence rule
- answer-before-ask rule
- one-question-at-a-time rule
- no list-reading rule

## Priority 4: TTS state controls

Map speed/emotion by state instead of one global TTS style.

## Priority 5: Better handoff intelligence

Do not only handoff on keywords.

Also handoff on:

- repeated confusion
- severe dissatisfaction
- high-value booking intent
- medically sensitive questions
- pricing exceptions / custom quote need

## Priority 6: Extract real conversational features from transcript

Beyond `collected_data`, derive:

- caller_sentiment
- urgency_score
- trust_level
- objection_type
- booking_readiness

These are far more useful for commercial optimization.

---

## 17. Suggested Prompt Skeleton For STOAIX

Below is the shape I would use. Not full final copy, but the right architecture.

### Role & Objective

You are the first-point voice coordinator for `clinic_name`.
Your job is to:

- make callers feel understood
- answer clearly and briefly
- identify fit and urgency
- guide toward the next best step
- book or hand off when appropriate

### Personality & Tone

- Warm
- Confident
- Calm
- Professional but conversational
- Slightly sales-aware, never pushy
- Sounds like an experienced clinic coordinator, not a call center robot

### Length

- Default: 1 to 2 short sentences
- Max: 3 short sentences unless user explicitly asks for detail
- After answering, ask at most 1 follow-up question

### Variety

- Do not repeat the same sentence twice
- Rotate greetings, acknowledgments, and transition phrases
- Do not overuse the clinic name

### Core Voice Rules

- Answer before asking for extra data
- Ask only one question at a time
- Never sound like a form
- If caller sounds hesitant, slow down and reassure
- If caller sounds rushed, shorten responses
- If caller sounds skeptical, give concrete clarity before asking anything

### Sales Rules

- Sell through relevance, not hype
- First understand the caller's goal
- Then connect the clinic's next step to that goal
- Use soft closes:
  - "İsterseniz bunu bir sonraki adımda netleştirebiliriz."
  - "Uygunsa size en doğru yönlendirmeyi yapayım."
- Never hard-close unless caller is already ready

### Conversation States

- Opening
- Discover reason
- Clarify need
- Answer FAQ
- Qualify fit
- Handle objection
- Offer next step
- Book or hand off
- Close

### Repair Rules

- If audio is unclear, offer 2 likely interpretations
- If caller interrupts, yield naturally
- If caller changes topic, answer the new topic first

### Data Capture Rules

- Confirm names, numbers, and dates back to the caller
- Slow down when reading critical values

### Escalation

- Medical advice
- Explicit human request
- Severe frustration
- Repeated misunderstanding
- Custom pricing beyond approved range
- High-intent hot lead requesting immediate callback

---

## 18. How To Evaluate "Humanness"

Most teams evaluate the wrong things.

They check:

- was appointment booked?
- was the transcript accurate?
- did tool call succeed?

Those matter, but they do not measure perceived quality.

## Build a "human-like voice eval" scorecard

For each test call, score 1 to 5 on:

- natural interruption handling
- response brevity
- acknowledgment quality
- context retention
- phrasing variation
- emotional appropriateness
- objection handling quality
- clarity of next step
- trustworthiness
- overall humanness

Add failure tags:

- too_long
- repeated_phrase
- asked_before_answering
- ignored_emotion
- wrong_timing
- awkward_confirmation
- robotic_transition
- excessive_formality

This is the evaluation layer that most directly improves demos.

### Use transcript + audio evals, not transcript only

Text-only review misses:

- pace
- overlap
- pause timing
- prosodic mismatch
- interruption ugliness

So store and review:

- raw audio clips
- transcripts
- event timings
- STT confidence
- turn timing metrics

LiveKit's metrics and telemetry docs are relevant here because they support latency and execution observability. Use that to correlate "felt robotic" with actual runtime metrics.

---

## 19. Recommended Metrics Dashboard

Track these in production and demos:

- time to first spoken response
- end-of-turn latency
- interruptions per call
- false interruption rate
- average assistant turn length
- average user turn length
- booking conversion rate
- handoff rate
- no-match / repair count
- repeated phrase count
- user sentiment shift
- call drop-off within first 30 seconds

Two especially important metrics:

### 1. Assistant verbosity ratio

If the assistant is talking much more than the caller early in the call, it usually feels robotic.

### 2. Recovery quality after misunderstanding

This is one of the strongest real indicators of conversational maturity.

---

## 20. GitHub / Open Source Resources Worth Studying

These are useful more for patterns than for copy-pasting.

### LiveKit Agents

Why it matters:

- official framework you already use
- includes examples for starter agents, outbound caller, background audio, structured output, restaurant reservations

Use it for:

- better session configuration
- turn handling patterns
- evaluation and testing ideas

### LiveKit agent-starter-python

Why it matters:

- official starter with eval suite
- turn detector
- metrics and logging
- production deployment patterns

Use it for:

- testing/evals setup
- more modern reference implementation patterns

### Pipecat

Why it matters:

- open-source framework focused on real-time voice/multimodal agents
- useful architectural ideas for composable conversational pipelines

Use it for:

- pipeline design inspiration
- event-driven voice orchestration patterns

### Pipecat Flows

Why it matters:

- explicit structured dialogue framework
- examples include patient intake and warm transfers

Use it for:

- conversation-state design ideas
- semi-structured flows that still sound natural

### Vocode

Why it matters:

- long-running open-source voice AI stack
- useful reference point for modular voice orchestration

Use it for:

- architecture comparison
- telephony-oriented abstractions

---

## 21. Practical 30-Day Roadmap For STOAIX

## Week 1: Conversation architecture

- Refactor prompt into labeled sections
- Add conversation states
- Add variety rules
- Add length rules
- Add sales behavior rules
- Add repair patterns

## Week 2: Turn-taking and TTS

- A/B test Deepgram Flux vs current Nova-2
- Tune pause thresholds by call phase
- Add TTS speed/emotion profiles by state
- Improve number/name/date confirmation

## Week 3: Retrieval and sales intelligence

- Split KB by intent/state
- Add objection-handling knowledge items
- Add trust-building snippets
- Add booking-readiness features

## Week 4: Evals and demos

- Create 20 demo call scenarios
- Score with humanness rubric
- Review audio, not just transcript
- Build one premium demo scenario per vertical:
  - dental
  - hair transplant
  - medical aesthetics

---

## 22. Highest-Impact Recommendations In One List

If you only do a few things, do these:

1. Move to state-based prompting.
2. Enforce 1 to 3 sentence spoken turns.
3. Add explicit variation rules and phrase families.
4. Tune interruption handling aggressively.
5. A/B test Deepgram Flux for conversational STT.
6. Use dynamic STT keyterms during critical capture steps.
7. Use stable realistic Cartesia voices, not over-emotive ones.
8. Apply TTS pacing by call state.
9. Design the assistant as a consultative coordinator, not a hard closer.
10. Build audio-first evals for humanness.
11. Add graceful repair behavior.
12. Test a premium speech-to-speech demo path with `gpt-realtime`.

---

## Final Conclusion

To make a clinic owner say "I didn't expect AI to sound this good", you do not need only a better model.

You need a better conversation system.

The winning combination is:

- fast but not jumpy
- warm but not fake
- brief but not cold
- persuasive but not pushy
- structured but not scripted

The closest thing to "magic" in voice AI is not one giant prompt.

It is:

- great turn-taking
- disciplined short responses
- strong state design
- careful prosody
- repair intelligence
- contextual sales behavior

That is where STOAIX can create a genuinely impressive clinic demo.

---

## Sources

- OpenAI Voice Agents Guide: https://developers.openai.com/api/docs/guides/voice-agents
- OpenAI Realtime Prompting Guide: https://developers.openai.com/api/docs/guides/realtime-models-prompting
- OpenAI `gpt-realtime` announcement: https://openai.com/index/introducing-gpt-realtime/
- LiveKit Turns Overview: https://docs.livekit.io/agents/build/turns/
- LiveKit Adaptive Interruption Handling: https://docs.livekit.io/agents/logic/turns/adaptive-interruption-handling/
- LiveKit Metrics and Telemetry: https://docs.livekit.io/agents/build/metrics
- LiveKit official examples org: https://github.com/livekit-examples
- LiveKit agent starter Python: https://github.com/livekit-examples/agent-starter-python
- LiveKit agents repo: https://github.com/livekit/agents
- Deepgram Flux Quickstart: https://developers.deepgram.com/docs/flux/quickstart
- Deepgram Flux End-of-Turn Configuration: https://developers.deepgram.com/docs/flux/configuration
- Deepgram Flux Dynamic Configure: https://developers.deepgram.com/docs/flux/configure
- Cartesia Sonic 3 docs: https://docs.cartesia.ai/build-with-cartesia/tts-models/latest
- Cartesia Choosing a Voice: https://docs.cartesia.ai/build-with-cartesia/capability-guides/choosing-a-voice
- Cartesia Volume, Speed, and Emotion: https://docs.cartesia.ai/build-with-cartesia/sonic-3/volume-speed-emotion
- Cartesia SSML tags: https://docs.cartesia.ai/build-with-cartesia/sonic-3/ssml-tags
- Google Conversation Design: https://design.google/library/conversation-design-speaking-same-language
- Google Conversation Design Intro: https://design.google/library/conversation-design-intro
- Amazon Alexa "Be Brief": https://developer.amazon.com/en-US/alexa/alexa-haus/design-principles/be-brief
- HubSpot Consultative Selling overview: https://blog.hubspot.com/sales/consultative-selling
- HubSpot SPIN Selling overview: https://blog.hubspot.com/sales/spin-selling-the-ultimate-guide
- Gong objection handling reference: https://www.gong.io/blog/objection-handling-techniques/
- Pipecat: https://github.com/pipecat-ai/pipecat
- Pipecat Flows: https://github.com/pipecat-ai/pipecat-flows
- Vocode Core: https://github.com/vocodedev/vocode-core
