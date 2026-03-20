#!/usr/bin/env bash
# Supabase Edge Functions deploy script
# Önce: supabase login && supabase link --project-ref ablntzdbsrzbqyrnfwpl

set -e

PROJECT_REF="ablntzdbsrzbqyrnfwpl"

echo "📦 Deploying whatsapp-inbound edge function..."
supabase functions deploy whatsapp-inbound --project-ref $PROJECT_REF

echo ""
echo "✅ Deploy tamamlandı!"
echo ""
echo "📌 Sonraki adım — Supabase Dashboard'da secret'ları ekle:"
echo "   Dashboard → Edge Functions → whatsapp-inbound → Secrets"
echo ""
echo "   ANTHROPIC_API_KEY = <your-key>"
echo "   OPENAI_API_KEY    = <already in .env.local>"
echo ""
echo "📌 GHL Webhook URL:"
echo "   https://ablntzdbsrzbqyrnfwpl.supabase.co/functions/v1/whatsapp-inbound"
echo ""
echo "   Bu URL'yi GHL → Sub Account → Settings → Integrations → Webhook'a ekle"
echo "   Events: InboundMessage"
