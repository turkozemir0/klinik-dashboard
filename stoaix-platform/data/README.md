# Data Sources

Her organizasyon icin `data/<slug>/` klasoru kullanilir.

Zorunlu dosya:

- `source.config.json`

Ornek:

```json
{
  "organization_id": "uuid",
  "organization_name": "Acme Danismanlik",
  "brand_name": "Acme",
  "slug": "acme",
  "sector": "education",
  "parser_profile": "manual_onboarding"
}
```

Notlar:

- `parser_profile: "manual_onboarding"` ise bilgi girisi onboarding veya admin KB ekranindan yapilir.
- CSV tabanli import icin uygun parser eklendiginde ayni klasore CSV dosyalari konur ve script ilgili profille calistirilir.
- Eurostar su an `education_eurostar_v3` profili ile calisir.
