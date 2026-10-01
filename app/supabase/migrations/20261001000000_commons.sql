-- Forma Commons: profiles, course membership, threads and posts, rooms, battles.
-- Run once in the Supabase SQL editor (or `supabase db push` if the CLI is linked later).

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  created_at timestamptz not null default now()
);

-- One community per course. The join code is never readable from the client.
create table public.communities (
  course_id text primary key,
  join_code text not null check (char_length(join_code) >= 8)
);

create table public.course_members (
  course_id text not null references public.communities(course_id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'owner')),
  joined_at timestamptz not null default now(),
  primary key (course_id, user_id)
);

create function public.is_member(c text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.course_members m where m.course_id = c and m.user_id = (select auth.uid()));
$$;

create function public.is_owner(c text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.course_members m where m.course_id = c and m.user_id = (select auth.uid()) and m.role = 'owner');
$$;

-- ponytail: no rate limit on code guesses; codes are >= 8 characters. Add a pg attempt counter if codes leak.
create function public.join_course(p_course text, p_code text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.communities where course_id = p_course and join_code = p_code) then
    return false;
  end if;
  insert into public.course_members (course_id, user_id) values (p_course, auth.uid()) on conflict do nothing;
  return true;
end;
$$;

create table public.threads (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references public.communities(course_id) on delete cascade,
  kind text not null check (kind in ('question', 'discussion', 'room')),
  anchor jsonb,
  anchor_key text,
  title text not null check (char_length(title) between 3 and 140),
  body text not null default '' check (char_length(body) <= 8000),
  author_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  answer_post_id uuid,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  last_post_at timestamptz not null default now()
);
create index threads_course_anchor on public.threads (course_id, anchor_key);
create index threads_course_recent on public.threads (course_id, last_post_at desc);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null,
  author_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 8000),
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  constraint posts_thread_fk foreign key (thread_id) references public.threads(id) on delete cascade
);
create index posts_thread on public.posts (thread_id, created_at);

alter table public.threads
  add constraint threads_answer_fk foreign key (answer_post_id) references public.posts(id) on delete set null;

create function public.thread_course(t uuid) returns text
language sql stable security definer set search_path = '' as $$
  select course_id from public.threads where id = t;
$$;

create function public.touch_thread() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.threads set last_post_at = now() where id = new.thread_id;
  return new;
end;
$$;
create trigger posts_touch_thread after insert on public.posts for each row execute function public.touch_thread();

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references public.communities(course_id) on delete cascade,
  target_kind text not null check (target_kind in ('thread', 'post')),
  target_id uuid not null,
  reason text not null default '' check (char_length(reason) <= 500),
  reporter_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create function public.hide_item(p_kind text, p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare c text;
begin
  if p_kind = 'thread' then
    select course_id into c from public.threads where id = p_id;
  elsif p_kind = 'post' then
    select t.course_id into c from public.posts p join public.threads t on t.id = p.thread_id where p.id = p_id;
  else
    raise exception 'unknown kind %', p_kind;
  end if;
  if c is null or not public.is_owner(c) then
    raise exception 'not allowed';
  end if;
  if p_kind = 'thread' then
    update public.threads set hidden = true where id = p_id;
  else
    update public.posts set hidden = true where id = p_id;
  end if;
end;
$$;

-- A room is a thread (kind 'room') with a shared paper.
create table public.rooms (
  thread_id uuid primary key references public.threads(id) on delete cascade,
  svg text not null default '' check (char_length(svg) <= 2000000),
  updated_at timestamptz not null default now()
);

-- Battles (shape from supabase-community/kahoot-alternative; writes only through /api/battle).
create table public.battles (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references public.communities(course_id) on delete cascade,
  host_id uuid not null references public.profiles(id) on delete cascade,
  concepts text[] not null,
  items jsonb not null,
  phase text not null default 'lobby' check (phase in ('lobby', 'question', 'reveal', 'done')),
  item_index smallint not null default 0,
  started_at timestamptz,
  created_at timestamptz not null default now()
);
create index battles_course_phase on public.battles (course_id, phase, created_at desc);

create table public.battle_players (
  battle_id uuid not null references public.battles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (battle_id, user_id)
);

create table public.battle_answers (
  battle_id uuid not null references public.battles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_index smallint not null,
  correct boolean not null,
  score integer not null,
  answered_at timestamptz not null default now(),
  primary key (battle_id, user_id, item_index)
);

create function public.battle_course(b uuid) returns text
language sql stable security definer set search_path = '' as $$
  select course_id from public.battles where id = b;
$$;

-- Row level security
alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.course_members enable row level security;
alter table public.threads enable row level security;
alter table public.posts enable row level security;
alter table public.reports enable row level security;
alter table public.rooms enable row level security;
alter table public.battles enable row level security;
alter table public.battle_players enable row level security;
alter table public.battle_answers enable row level security;

create policy "profiles readable when signed in" on public.profiles for select to authenticated using (true);
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = (select auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- communities: no policies, so no client can read join codes.

create policy "members see the roster" on public.course_members for select to authenticated
  using (user_id = (select auth.uid()) or public.is_member(course_id));

create policy "members read threads" on public.threads for select to authenticated
  using (public.is_member(course_id) and (not hidden or author_id = (select auth.uid()) or public.is_owner(course_id)));
create policy "members start threads" on public.threads for insert to authenticated
  with check (public.is_member(course_id) and author_id = (select auth.uid()) and not hidden and answer_post_id is null);
create policy "authors edit threads" on public.threads for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy "authors delete threads" on public.threads for delete to authenticated using (author_id = (select auth.uid()));

create policy "members read posts" on public.posts for select to authenticated
  using (public.is_member(public.thread_course(thread_id)) and (not hidden or author_id = (select auth.uid()) or public.is_owner(public.thread_course(thread_id))));
create policy "members post" on public.posts for insert to authenticated
  with check (public.is_member(public.thread_course(thread_id)) and author_id = (select auth.uid()) and not hidden);
create policy "authors edit posts" on public.posts for update to authenticated
  using (author_id = (select auth.uid())) with check (author_id = (select auth.uid()));
create policy "authors delete posts" on public.posts for delete to authenticated using (author_id = (select auth.uid()));

-- Authors may edit only these columns; `hidden` stays owner-only (hide_item).
revoke update on public.threads from anon, authenticated;
grant update (title, body, answer_post_id) on public.threads to authenticated;
revoke update on public.posts from anon, authenticated;
grant update (body) on public.posts to authenticated;

create policy "members report" on public.reports for insert to authenticated
  with check (public.is_member(course_id) and reporter_id = (select auth.uid()));
create policy "owners read reports" on public.reports for select to authenticated using (public.is_owner(course_id));

create policy "members read rooms" on public.rooms for select to authenticated using (public.is_member(public.thread_course(thread_id)));
create policy "members open rooms" on public.rooms for insert to authenticated with check (public.is_member(public.thread_course(thread_id)));
create policy "members save rooms" on public.rooms for update to authenticated
  using (public.is_member(public.thread_course(thread_id))) with check (public.is_member(public.thread_course(thread_id)));

create policy "members read battles" on public.battles for select to authenticated using (public.is_member(course_id));
create policy "members read players" on public.battle_players for select to authenticated using (public.is_member(public.battle_course(battle_id)));
create policy "members read answers" on public.battle_answers for select to authenticated using (public.is_member(public.battle_course(battle_id)));
-- No insert/update/delete policies on battles, battle_players, battle_answers: only the service role (/api/battle) writes.

-- Private room channels: topic `room:<thread id>`, members of the thread's course only.
create policy "room members receive" on realtime.messages for select to authenticated
  using (
    realtime.messages.extension in ('broadcast', 'presence')
    and exists (select 1 from public.rooms r where 'room:' || r.thread_id::text = (select realtime.topic()) and public.is_member(public.thread_course(r.thread_id)))
  );
create policy "room members send" on realtime.messages for insert to authenticated
  with check (
    realtime.messages.extension in ('broadcast', 'presence')
    and exists (select 1 from public.rooms r where 'room:' || r.thread_id::text = (select realtime.topic()) and public.is_member(public.thread_course(r.thread_id)))
  );

alter publication supabase_realtime add table public.posts, public.battles, public.battle_players, public.battle_answers;
