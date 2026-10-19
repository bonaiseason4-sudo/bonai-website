-- Removes the video source / URL check constraints on public.videos so quiz rows
-- ("isQuiz" = true) no longer need a fake drive_file_id or video_url.
-- Also makes video_source optional. Safe to run more than once.

begin;

do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.videos'::regclass
      and contype = 'c'
      and (pg_get_constraintdef(oid) ilike '%video_source%'
        or pg_get_constraintdef(oid) ilike '%drive_file_id%'
        or pg_get_constraintdef(oid) ilike '%video_url%')
  loop
    execute format('alter table public.videos drop constraint %I', c.conname);
    raise notice 'Dropped constraint %', c.conname;
  end loop;
end $$;

alter table public.videos alter column video_source drop not null;

commit;
