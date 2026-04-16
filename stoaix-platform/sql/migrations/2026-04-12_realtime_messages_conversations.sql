-- Enable Supabase Realtime for messages and conversations tables
-- Required for unified inbox live updates (incoming messages, conv list)

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
