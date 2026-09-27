-- Create popup_settings table for dynamic popups
CREATE TABLE IF NOT EXISTS public.popup_settings (
  id TEXT PRIMARY KEY DEFAULT 'global_popup',
  title TEXT DEFAULT '',
  content TEXT DEFAULT '',
  sub_content TEXT DEFAULT '',
  footer_text TEXT DEFAULT '',
  start_date TEXT DEFAULT NULL,
  end_date TEXT DEFAULT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.popup_settings ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to popup_settings"
  ON public.popup_settings
  FOR SELECT
  TO public
  USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access to popup_settings"
  ON public.popup_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
