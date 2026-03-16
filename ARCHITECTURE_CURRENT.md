# STOAIX Current Architecture

Bu doküman projenin mevcut mimarisini görsel olarak özetler.

## 1. High-Level System

```mermaid
flowchart LR
    CRM[External CRM / Messaging Channel\nGHL / HubSpot / Kommo / Custom] -->|Webhook| HIM[Supabase Edge Function\nhandle-incoming-message]
    HIM --> MB[(message_buffer)]
    HIM --> CL[(conversation_locks)]
    HIM -->|Normalized payload| N8N[n8n Workflows]

    N8N -->|Read / Write| SB[(Supabase Postgres)]
    N8N -->|CRM actions| CG[Supabase Edge Function\ncrm-gateway]
    CG -->|Provider-specific API calls| CRM

    WEB[Next.js Dashboard\nApp Router on Vercel] -->|SSR / Actions / Auth| SB
    SB -->|Realtime updates| WEB

    VA[LiveKit Voice Agent\nPython service] -->|Read clinic + KB| SB
    VA -->|Write call logs| SB
    VA -->|Inbound / Outbound calls| LK[LiveKit Cloud / SIP]
```

## 2. Application Layers

```mermaid
flowchart TD
    subgraph Presentation
        WEB[Next.js Dashboard]
        ADMIN[Admin CRM Settings]
        CALLS[Calls / Leads / Handoffs / Knowledge Views]
    end

    subgraph Backend
        ACT[Server Actions]
        HIM[handle-incoming-message]
        CG[crm-gateway]
        N8N[n8n automation layer]
    end

    subgraph Data
        AUTH[(Supabase Auth)]
        CLINICS[(clinics)]
        CONV[(conversations)]
        MSG[(messages)]
        HAND[(handoff_logs)]
        STATS[(daily_stats)]
        KB[(services / faqs / kb_documents)]
        FUP[(follow_up_schedule)]
        VC[(voice_calls)]
        CRMLOG[(crm_action_logs)]
    end

    WEB --> ACT
    ADMIN --> ACT
    CALLS --> ACT

    ACT --> AUTH
    ACT --> CLINICS
    ACT --> CONV
    ACT --> MSG
    ACT --> HAND
    ACT --> STATS
    ACT --> KB
    ACT --> FUP
    ACT --> VC

    HIM --> CLINICS
    HIM --> CONV
    HIM --> MSG
    HIM --> N8N

    N8N --> CONV
    N8N --> MSG
    N8N --> HAND
    N8N --> STATS
    N8N --> FUP
    N8N --> CG

    CG --> CLINICS
    CG --> CRMLOG
```

## 3. CRM Abstraction Flow

```mermaid
sequenceDiagram
    participant CRM as CRM / Channel
    participant HIM as handle-incoming-message
    participant DB as Supabase
    participant N8N as n8n
    participant CG as crm-gateway

    CRM->>HIM: Incoming webhook
    HIM->>DB: Resolve clinic by webhook_token
    HIM->>HIM: Normalize payload by crm_provider + crm_config
    HIM->>DB: Write message_buffer / lock
    HIM->>N8N: Send normalized event

    N8N->>DB: Read/write conversations, scores, handoff data
    N8N->>CG: send_message / add_tags / update_contact_fields / move_pipeline_stage
    CG->>DB: Read clinic.crm_provider, crm_config, crm_token
    CG->>CRM: Provider-specific API request
    CG->>DB: Write crm_action_logs
```

## 4. Dashboard Data Model

```mermaid
flowchart TD
    CU[clinic_users] --> C[clinics]
    C --> S[services]
    C --> F[faqs]
    C --> K[kb_documents]
    C --> CV[conversations]
    CV --> M[messages]
    CV --> H[handoff_logs]
    CV --> FU[follow_up_schedule]
    CV --> VC[voice_calls]
    C --> DS[daily_stats]
    C --> ST[support_tickets]
    C --> CAL[crm_action_logs]
```

## 5. Voice + Follow-up Readiness

```mermaid
flowchart LR
    subgraph Current
        VCODE[LiveKit voice-agent service]
        VTABLE[(voice_calls)]
        FTABLE[(follow_up_schedule)]
        N8N[n8n follow-up workflows]
    end

    VCODE -->|reads clinic + KB| SB[(Supabase)]
    VCODE -->|writes logs| VTABLE
    N8N -->|schedules / sends text follow-up| FTABLE

    FUTURE[Future integration path] -->|trigger outbound voice reminders / follow-up calls| VCODE
    FTABLE -. possible orchestration .-> FUTURE
```

## 6. Current Flexibility Summary

- Panel ve tenant modeli güçlü; Supabase RLS ile iyi izole edilmiş.
- CRM katmanı artık doğrudan tek provider'a bağlı değil, `crm-gateway` üzerinden soyutlanmış.
- n8n akışları CRM gateway'i kullanıyor; bu iyi bir ayrım.
- Voice agent ayrı bir servis olarak hazır, ama ana follow-up orchestration'a tam bağlanmış değil.
- `custom` provider temel mesaj gönderme için uygun; derin CRM senaryosu için provider adapter gerekir.
