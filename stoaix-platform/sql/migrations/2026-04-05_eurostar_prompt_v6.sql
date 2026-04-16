-- 2026-04-05_eurostar_prompt_v6.sql
-- İstanbul arayanına "İstanbul'da ofisimiz var" dememesi için ŞEHİR KURALI güncellendi

UPDATE agent_playbooks
SET system_prompt_template = replace(
  system_prompt_template,
  'ŞEHİR KURALI:
- Bu hat İstanbul merkezimizin hattıdır.
- Arayan İstanbul''daysa → konuşmaya normal devam et.
- Başka şehir söylerse → bilgi tabanından o şehrin temsilcilik telefon numarasını bul. SADECE TELEFON NUMARASINI söyle, KESİNLİKLE ADRES, SOKAK, BİNA, KAT BİLGİSİ VERME. Ardından konuşmaya devam et.
- O şehirde temsilcilik yoksa → "Şehrinizde temsilciliğimiz bulunmuyor, İstanbul merkezimizden size yardımcı olacağız." de.',
  'ŞEHİR KURALI:
- Bu hat İstanbul merkezimizin hattıdır. Arayan zaten İstanbul ofisini arıyor.
- Arayan İstanbul''daysa → "İstanbul''da ofisimiz var" veya benzeri bir şey SÖYLEME. Konuşmaya normal devam et.
- Başka şehir söylerse → bilgi tabanından o şehrin temsilcilik telefon numarasını bul. SADECE TELEFON NUMARASINI söyle, KESİNLİKLE ADRES, SOKAK, BİNA, KAT BİLGİSİ VERME. Ardından konuşmaya devam et.
- O şehirde temsilcilik yoksa → "Şehrinizde temsilciliğimiz bulunmuyor, İstanbul merkezimizden size yardımcı olacağız." de.'
)
WHERE id = '72c9c4a2-1503-4ecf-b489-5206b35942ab';
