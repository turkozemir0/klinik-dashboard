-- Inbox arama RPC fonksiyonu: isim, telefon veya mesaj içeriğinde arar
CREATE OR REPLACE FUNCTION search_inbox_conversations(
  p_org_id UUID,
  p_search_text TEXT
)
RETURNS TABLE(conversation_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT c.id
  FROM conversations c
  LEFT JOIN contacts ct ON ct.id = c.contact_id
  LEFT JOIN messages m ON m.conversation_id = c.id
  WHERE c.organization_id = p_org_id
    AND (
      ct.full_name ILIKE '%' || p_search_text || '%'
      OR ct.phone ILIKE '%' || p_search_text || '%'
      OR m.content ILIKE '%' || p_search_text || '%'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
