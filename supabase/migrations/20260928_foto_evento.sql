-- Ejecutar en Supabase > SQL Editor. No modifica las sesiones existentes.
begin;
alter table public.drinking_sessions
  add column if not exists photo_url text;
comment on column public.drinking_sessions.photo_url
  is 'URL de la foto opcional del evento guardada en Storage.';
-- Las políticas de lectura/actualización propias creadas anteriormente siguen aplicando.
commit;
