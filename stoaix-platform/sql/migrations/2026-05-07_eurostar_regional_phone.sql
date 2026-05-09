-- ═══════════════════════════════════════════════════════════════
-- Eurostar — Bölge Temsilcilik Numarası Sesli Okuma
-- system_prompt_template'e temsilcilik numarası talimatı +
-- few-shot İzmir örneği
--
-- NOT: routing_rules 2026-03-28_routing_rules_v2.sql ile obje
-- formatına geçti (istanbul_check artık yok). Yönlendirme
-- tamamen system_prompt talimatıyla yapılıyor.
-- ═══════════════════════════════════════════════════════════════

-- 1. system_prompt_template'e BÖLGE TEMSİLCİLİK YÖNLENDİRME bloğu ekle
UPDATE public.agent_playbooks
SET system_prompt_template = system_prompt_template || '

BÖLGE TEMSİLCİLİK YÖNLENDİRME:
- İstanbul dışından arayan varsa, bilgi tabanından o şehrin temsilcilik numarasını bul.
- Temsilcilik numarası varsa, numarayı YAVAŞÇA ve YAZILI olarak oku.
  Örnek: "0553 407 01 43" → "sıfır beş yüz elli üç, dört yüz yedi, sıfır bir, kırk üç"
- Temsilci adını da söyle: "İzmir temsilcimiz Şüheda Hanım, numarası sıfır beş yüz elli üç..."
- Temsilcilik olmayan şehirler için: "Şehrinize en yakın temsilciliğimizi danışmanımız size iletecek."
- Numarayı söyledikten sonra yine isim ve telefon bilgilerini al.',
    updated_at = now()
WHERE organization_id = 'a1b2c3d4-0000-0000-0000-000000000001'
  AND channel = 'voice';

-- 2. few_shot_examples'a İzmir temsilcilik örneği ekle
UPDATE public.agent_playbooks
SET few_shot_examples = COALESCE(few_shot_examples, '[]'::jsonb) || '[
  {
    "user": "İzmir''den arıyorum",
    "assistant": "İzmir temsilcimiz Şüheda Hanım. Numarası sıfır beş yüz elli üç, dört yüz yedi, sıfır bir, kırk üç. Bir yandan adınızı ve numaranızı da alayım, danışmanımız da sizi arasın."
  }
]'::jsonb,
    updated_at = now()
WHERE organization_id = 'a1b2c3d4-0000-0000-0000-000000000001'
  AND channel = 'voice';
