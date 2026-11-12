-- Run after the official starter and PS6 seeds. Safe to reapply.
alter table public.tasks enable row level security;
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.shortlists enable row level security;

revoke all on public.tasks, public.profiles, public.jobs, public.shortlists from public, anon, authenticated;
grant usage on schema public to service_role;
grant select on public.profiles, public.jobs, public.shortlists, public.tasks to service_role;
grant update (skills) on public.profiles to service_role;
grant insert on public.shortlists, public.tasks to service_role;
grant usage on sequence public.shortlists_id_seq, public.tasks_id_seq to service_role;

create index if not exists careermatch_jobs_deadline_cgpa_idx
  on public.jobs (apply_by, min_cgpa);
create index if not exists careermatch_jobs_branches_idx
  on public.jobs using gin (eligible_branches);
create index if not exists careermatch_shortlist_recent_idx
  on public.shortlists (profile_id, created_at desc, id desc);

create or replace function public.careermatch_search(
  profile_ref text,
  eligible_on date,
  city_filter text default null,
  role_filter text default null,
  mode_filter text default null,
  type_filter text default null
) returns jsonb
language sql stable security invoker
set search_path = ''
as $$
  with student as materialized (
    select p.cgpa, p.branch,
      array(
        select distinct skill
        from unnest(p.skills) as stored(value)
        cross join lateral regexp_split_to_table(stored.value, E'[,;\\r\\n]+') as entry(value)
        cross join lateral (
          select lower(btrim(regexp_replace(entry.value, '[[:space:]]+', ' ', 'g'))) as value
        ) normalized
        cross join lateral (
          select string_to_array(normalized.value, ' ') as values
        ) words
        cross join lateral unnest(case when words.values <@ array[
          'bash', 'c', 'c#', 'c++', 'css', 'docker', 'excel', 'figma', 'git', 'go', 'html',
          'java', 'javascript', 'kotlin', 'kubernetes', 'linux', 'node.js', 'numpy', 'pandas',
          'php', 'postgresql', 'python', 'react', 'ruby', 'rust', 'sql', 'swift', 'tableau', 'typescript'
        ] then words.values else array[normalized.value] end) as expanded(skill)
        where skill <> ''
      ) as skills
    from public.profiles p where p.id = profile_ref
  ), candidate_jobs as (
    select j.id, j.apply_by, j.required_skills, p.skills,
      to_jsonb(j) - array['nice_to_have', 'salary_lpa_min', 'salary_lpa_max'] as job
    from student p
    join public.jobs j on j.min_cgpa <= p.cgpa
      and j.apply_by >= eligible_on
      and j.eligible_branches @> array[p.branch]
    where (city_filter is null or lower(j.city) = city_filter)
      and (role_filter is null or strpos(lower(j.title), role_filter) > 0)
      and (mode_filter is null or j.work_mode = mode_filter)
      and (type_filter is null or j.job_type = type_filter)
  ), ranked as (
    select candidate_jobs.id, candidate_jobs.apply_by, candidate_jobs.job,
      coalesce(round(100.0 * cardinality(parts.matched) /
        nullif(cardinality(parts.matched) + cardinality(parts.missing), 0)), 100)::int as score,
      parts.matched, parts.missing
    from candidate_jobs
    cross join lateral (
      select
        coalesce(array_agg(r.skill order by r.position)
          filter (where r.skill = any (candidate_jobs.skills)), '{}'::text[]) as matched,
        coalesce(array_agg(r.skill order by r.position)
          filter (where r.skill <> all (candidate_jobs.skills)), '{}'::text[]) as missing
      from (
        select lower(btrim(regexp_replace(skill, '[[:space:]]+', ' ', 'g'))) as skill,
          min(position) as position
        from unnest(candidate_jobs.required_skills) with ordinality as required(skill, position)
        group by 1
      ) r
      where r.skill <> ''
    ) parts
  ), top_matches as (
    select *, count(*) over () as total_count
    from ranked
    order by score desc, apply_by, id
    limit 12
  )
  select jsonb_build_object(
    'count', coalesce(max(total_count), 0),
    'matches', coalesce(jsonb_agg(jsonb_build_object(
      'job', job, 'score', score, 'matched', matched, 'missing', missing
    ) order by score desc, apply_by, id), '[]'::jsonb)
  )
  from top_matches;
$$;

revoke all on function public.careermatch_search(text, date, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.careermatch_search(text, date, text, text, text, text)
  to service_role;
notify pgrst, 'reload schema';

-- Individual demo accounts write profiles under the UUID verified by Supabase Auth.
grant insert on public.profiles to service_role;
grant update (id, name, degree, branch, grad_year, cgpa, preferred_cities, skills, interests)
  on public.profiles to service_role;
