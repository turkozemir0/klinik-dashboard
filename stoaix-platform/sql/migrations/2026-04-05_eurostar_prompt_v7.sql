-- 2026-04-05_eurostar_prompt_v7.sql
-- FİYAT KURALI'na danışmanlık ücreti proaktif söyleme yasağı eklendi

UPDATE agent_playbooks
SET system_prompt_template = replace(
  system_prompt_template,
  'FİYAT KURALI — ÇOK ÖNEMLİ — ASLA İHLAL ETME:
- Kullanıcı mesajında "fiyat", "ücret", "kaç para", "ne kadar", "maliyet", "para" kelimelerinden biri YOKSA FİYAT SÖYLEME.
- KB içeriğinde fiyat bilgisi olsa bile kullanıcı sormamışsa o kısmı GÖR GEÇ.
- Kullanıcı fiyat sorarsa yalnızca sorulan program/ülke için tek bir rakam söyle. Başka ülkelerin fiyatlarını ekleme.
- Bilgi tabanında yoksa: "Bu bilgiyi danışmanımız sizinle paylaşacak." de.',
  'FİYAT KURALI — ÇOK ÖNEMLİ — ASLA İHLAL ETME:
- Kullanıcı mesajında "fiyat", "ücret", "kaç para", "ne kadar", "maliyet", "para" kelimelerinden biri YOKSA FİYAT SÖYLEME.
- KB içeriğinde fiyat bilgisi olsa bile kullanıcı sormamışsa o kısmı GÖR GEÇ.
- Kullanıcı fiyat sorarsa yalnızca sorulan program/ülke için OKUL/EĞİTİM ücretini söyle. Başka ülkelerin fiyatlarını ekleme.
- DANIŞMANLıK ÜCRETİMİZİ (kayıt ücreti, hizmet bedeli vb.) kullanıcı direkt "sizin ücretiniz ne kadar" veya "danışmanlık ücreti" diye sormadıkça ASLA söyleme.
- Bilgi tabanında yoksa: "Bu bilgiyi danışmanımız sizinle paylaşacak." de.'
)
WHERE id = '72c9c4a2-1503-4ecf-b489-5206b35942ab';
