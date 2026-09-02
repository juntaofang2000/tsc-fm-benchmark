alter table public.model_submissions
  drop constraint if exists model_submissions_evaluation_track_check;

alter table public.model_submissions
  add constraint model_submissions_evaluation_track_check
  check (evaluation_track in ('Standard', 'Low-shot', 'Training-Free / ICL', 'Frozen-Probe'));
