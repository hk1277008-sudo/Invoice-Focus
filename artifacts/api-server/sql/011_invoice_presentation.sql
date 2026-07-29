alter table public.user_settings
  add column if not exists invoice_presentation jsonb not null default '{
    "template": "modern",
    "primaryColor": "#2e5bff",
    "accentColor": "#13a6a6",
    "font": "Inter",
    "headerLayout": "Split",
    "footerLayout": "Simple",
    "paperSize": "A4",
    "titleStyle": "default"
  }'::jsonb;

notify pgrst, 'reload schema';