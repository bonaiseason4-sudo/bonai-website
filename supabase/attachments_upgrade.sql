-- Run once only if an attachments table already exists.
-- Renames drive_url to url and allows interactive form and quiz attachment types.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'attachments' and column_name = 'drive_url'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'attachments' and column_name = 'url'
  ) then
    alter table public.attachments rename column drive_url to url;
  end if;
end $$;

alter table public.attachments drop constraint if exists attachments_file_type_check;
alter table public.attachments add constraint attachments_file_type_check
  check (file_type in ('PDF', 'POWERPOINT', 'WORD', 'SPREADSHEET', 'GOOGLE_FORM', 'GEMINI_QUIZ', 'LINK', 'OTHER'));
