-- Comunidade do salsa: perfis, publicações de receitas, curtidas, receitas salvas,
-- comentários, seguidores e denúncias. Todas as tabelas usam RLS.

-- Perfis --------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_.]{3,20}$'),
  name text not null check (char_length(name) between 1 and 40),
  bio text not null default '' check (char_length(bio) <= 160),
  city text not null default '' check (char_length(city) <= 40),
  avatar_emoji text check (avatar_emoji is null or char_length(avatar_emoji) <= 40),
  avatar_color text check (avatar_color is null or avatar_color ~ '^#[0-9A-Fa-f]{6}$'),
  avatar_url text check (avatar_url is null or char_length(avatar_url) <= 500),
  created_at timestamptz not null default now()
);

-- Publicações ---------------------------------------------------------------
-- ingredients: [{ "name": text, "qty": number | null, "unit": text, "catalogId": text? }]
-- steps: [text]
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 80),
  description text not null default '' check (char_length(description) <= 500),
  photo_url text check (photo_url is null or char_length(photo_url) <= 500),
  minutes int not null check (minutes between 1 and 600),
  servings int not null check (servings between 1 and 30),
  ingredients jsonb not null check (jsonb_typeof(ingredients) = 'array' and jsonb_array_length(ingredients) between 1 and 40),
  steps jsonb not null check (jsonb_typeof(steps) = 'array' and jsonb_array_length(steps) between 1 and 30),
  appliances text[] not null default '{}',
  like_count int not null default 0,
  save_count int not null default 0,
  comment_count int not null default 0,
  created_at timestamptz not null default now()
);
create index posts_created_at_idx on public.posts (created_at desc);
create index posts_author_idx on public.posts (author_id, created_at desc);
create index posts_popular_idx on public.posts (save_count desc, like_count desc);

create table public.likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index likes_user_idx on public.likes (user_id);

create table public.saves (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index saves_user_idx on public.saves (user_id, created_at desc);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at);

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index follows_following_idx on public.follows (following_id);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null default '' check (char_length(reason) <= 200),
  created_at timestamptz not null default now(),
  unique (post_id, reporter_id)
);

-- Contadores mantidos por gatilhos (ninguém edita os números diretamente) ------
create function public.bump_post_counter() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  delta int := case when tg_op = 'INSERT' then 1 else -1 end;
  target uuid := case when tg_op = 'INSERT' then new.post_id else old.post_id end;
begin
  if tg_table_name = 'likes' then
    update public.posts set like_count = greatest(0, like_count + delta) where id = target;
  elsif tg_table_name = 'saves' then
    update public.posts set save_count = greatest(0, save_count + delta) where id = target;
  elsif tg_table_name = 'comments' then
    update public.posts set comment_count = greatest(0, comment_count + delta) where id = target;
  end if;
  return null;
end;
$$;

create trigger likes_counter after insert or delete on public.likes
  for each row execute function public.bump_post_counter();
create trigger saves_counter after insert or delete on public.saves
  for each row execute function public.bump_post_counter();
create trigger comments_counter after insert or delete on public.comments
  for each row execute function public.bump_post_counter();

-- Estatísticas do perfil -------------------------------------------------------
create view public.profile_stats with (security_invoker = true) as
select
  pr.id,
  (select count(*) from public.posts p where p.author_id = pr.id)::int as posts,
  (select count(*) from public.follows f where f.following_id = pr.id)::int as followers,
  (select count(*) from public.follows f where f.follower_id = pr.id)::int as following
from public.profiles pr;

-- Row Level Security -----------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.saves enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.reports enable row level security;

create policy "Perfis são públicos" on public.profiles for select to anon, authenticated using (true);
create policy "Cada um cria o próprio perfil" on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy "Cada um edita o próprio perfil" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Publicações são públicas" on public.posts for select to anon, authenticated using (true);
create policy "Autor publica" on public.posts for insert to authenticated
  with check ((select auth.uid()) = author_id and like_count = 0 and save_count = 0 and comment_count = 0);
create policy "Autor apaga" on public.posts for delete to authenticated using ((select auth.uid()) = author_id);

create policy "Curtidas são públicas" on public.likes for select to anon, authenticated using (true);
create policy "Curtir" on public.likes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Descurtir" on public.likes for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Salvas são privadas" on public.saves for select to authenticated using ((select auth.uid()) = user_id);
create policy "Salvar" on public.saves for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Remover das salvas" on public.saves for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Comentários são públicos" on public.comments for select to anon, authenticated using (true);
create policy "Comentar" on public.comments for insert to authenticated with check ((select auth.uid()) = author_id);
create policy "Apagar o próprio comentário" on public.comments for delete to authenticated
  using ((select auth.uid()) = author_id);

create policy "Seguidores são públicos" on public.follows for select to anon, authenticated using (true);
create policy "Seguir" on public.follows for insert to authenticated with check ((select auth.uid()) = follower_id);
create policy "Deixar de seguir" on public.follows for delete to authenticated using ((select auth.uid()) = follower_id);

create policy "Denunciar" on public.reports for insert to authenticated with check ((select auth.uid()) = reporter_id);

-- Fotos (receitas e avatares) --------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('recipe-photos', 'recipe-photos', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Enviar fotos na própria pasta" on storage.objects for insert to authenticated
  with check (bucket_id = 'recipe-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Apagar as próprias fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'recipe-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
