# Meta Ads Reporting Setup

Bu entegrasyonda organization ile eslestirilecek ana kimlik `Meta reklam hesabi ID`'dir.

## Hangi ID saklanacak?

- `organizations.id`
  Platformdaki tenant/musteri kimligi.
- `meta_ad_accounts.meta_ad_account_id`
  Meta Ads Manager'daki reklam hesabi ID'si.
  Ornek: `123456789012345`
- API cagrisi yaparken n8n bunu `act_123456789012345` formatina cevirir.

Asagidaki alanlar opsiyoneldir:

- `meta_business_id`
  Reklam hesabinin bagli oldugu Business Manager ID.
- `access_token_ref`
  Meta access token'in kendisi degil, secret/vault referansi.

## Neden business id degil?

Raporu `Insights API` ile reklam hesabindan cekeceksin. Bu yuzden asıl calisma birimi business degil `ad account` olur.

Dogru esleme:

`organizations.id -> meta_ad_accounts.id -> meta_ad_accounts.meta_ad_account_id`

## Onerilen akış

1. Dashboard veya manuel SQL ile organization icin `meta_ad_accounts` kaydi olustur.
2. Ayni hesap icin `ad_report_configs` kaydi olustur.
3. n8n workflow her gece aktif config'leri ceker.
4. Workflow `meta_ad_account_id` alanini `act_<id>` formatina cevirir.
5. Meta Insights API'den dunun verisi cekilir.
6. `ad_report_runs` tablosundan ayni hesabin son `sent` raporu cekilir.
7. Harcama, gosterim, tiklama, CTR ve CPC onceki raporla kiyaslanir.
8. Sonuc `ad_report_runs` tablosuna yazilir ve Resend ile gonderilir.

## Ornek insert

```sql
insert into public.meta_ad_accounts (
  organization_id,
  account_name,
  meta_ad_account_id,
  meta_business_id,
  access_token_ref,
  report_timezone
) values (
  'YOUR_ORGANIZATION_UUID',
  'Main Meta Ads Account',
  '123456789012345',
  '987654321000111',
  'vault/meta/org-1-main-account',
  'Europe/Istanbul'
);

insert into public.ad_report_configs (
  organization_id,
  meta_ad_account_id,
  recipient_emails,
  from_email,
  from_name
) values (
  'YOUR_ORGANIZATION_UUID',
  'META_AD_ACCOUNT_ROW_UUID',
  '{"client@example.com","ops@example.com"}',
  'reports@yourdomain.com',
  'stoaix Reports'
);
```
