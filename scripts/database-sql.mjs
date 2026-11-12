import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const seeds = ["../seed/00_starter_example.sql", "../seed/ps6_job_match.sql"];
const initialData = seeds.map((path) => read(path)
  .replace(/^drop table if exists .*;\r?$/gim, ""));
const setup = read("../supabase/production.sql");

process.stdout.write(`begin;
set local search_path = public, pg_catalog;
do $$
begin
  perform pg_advisory_xact_lock(22006);
  if exists (
    select 1 from pg_class relation
    join pg_namespace namespace on relation.relnamespace = namespace.oid
    where namespace.nspname = 'public'
      and relation.relname in ('tasks', 'profiles', 'jobs', 'shortlists')
  ) then
    raise exception 'CareerMatch bootstrap requires a fresh database. No changes were made.';
  end if;
end
$$;

${initialData.join("\n")}
${setup}
commit;
`);
