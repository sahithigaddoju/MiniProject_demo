/**
 * Creates CloudOpt tables in Supabase using the Management API.
 * Requires SUPABASE_ACCESS_TOKEN (personal access token from supabase.com/dashboard/account/tokens)
 *
 * Run: SUPABASE_ACCESS_TOKEN=your_token node scripts/create-tables.js
 */
import dotenv from 'dotenv';
dotenv.config();

// Extract project ref from URL: https://xxxx.supabase.co → xxxx
const projectRef = process.env.SUPABASE_URL?.replace('https://', '').split('.')[0];
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!accessToken) {
  console.error('Set SUPABASE_ACCESS_TOKEN env var (get from supabase.com/dashboard/account/tokens)');
  process.exit(1);
}

const query = `
create table if not exists schedule_runs (
  id              text primary key,
  batch_id        text,
  filename        text,
  scheduled_at    timestamptz,
  is_emergency    boolean default false,
  total           int,
  accepted        int,
  rejected        int,
  preempted       int,
  cpu_utilization numeric,
  total_energy    numeric,
  total_revenue   numeric,
  total_profit    numeric,
  used_cpu        int,
  used_memory     int,
  total_cpu       int,
  total_memory    int,
  created_at      timestamptz default now()
);

create table if not exists scheduled_workloads (
  id              uuid default gen_random_uuid() primary key,
  run_id          text references schedule_runs(id) on delete cascade,
  workload_id     text,
  cpu             numeric,
  memory          numeric,
  duration        numeric,
  server          text,
  status          text,
  priority        text,
  energy_cost     numeric,
  profit          numeric,
  predicted_price numeric,
  revenue         numeric,
  start_time      text,
  end_time        text,
  reason          text
);
`;

const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query }),
});

const body = await res.text();
if (res.ok) {
  console.log('✅ Tables created successfully!');
} else {
  console.error('❌ Failed:', res.status, body);
}
