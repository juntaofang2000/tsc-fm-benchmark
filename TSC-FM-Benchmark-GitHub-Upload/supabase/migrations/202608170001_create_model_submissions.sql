create table if not exists public.model_submissions (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  model_name text not null,
  organization text not null,
  model_category text not null check (model_category in ('Foundation Model', 'Representation Learning', 'In-Context Learning', 'Supervised')),
  paper_url text,
  github_repository text not null,
  github_commit text not null check (github_commit ~ '^[0-9a-f]{40}$'),
  github_snapshot_url text not null,
  huggingface_repository text not null,
  huggingface_revision text not null check (huggingface_revision ~ '^[0-9a-f]{40}$'),
  huggingface_snapshot_url text not null,
  contact_email text not null,
  evaluation_track text not null check (evaluation_track in ('Standard', 'Low-shot', 'OOD', 'Training-Free / ICL', 'Frozen-Probe')),
  license text,
  environment_requirements text,
  model_description text,
  protocol_confirmed boolean not null default false check (protocol_confirmed = true),
  status text not null default 'pending' check (status in ('pending', 'under_review', 'approved', 'rejected', 'evaluation_failed', 'published')),
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists model_submissions_status_created_idx
  on public.model_submissions (status, created_at desc);

alter table public.model_submissions enable row level security;

revoke all on table public.model_submissions from anon, authenticated;

grant insert on table public.model_submissions to anon;

create policy "Allow validated pending submissions"
  on public.model_submissions
  for insert
  to anon
  with check (
    status = 'pending'
    and protocol_confirmed = true
    and review_notes is null
  );

comment on table public.model_submissions is
  'Public benchmark submissions. The website inserts through a validated server route; review happens in the Supabase dashboard.';
