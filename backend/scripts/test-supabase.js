/**
 * Tests Supabase connection and verifies tables exist.
 * Run: node scripts/test-supabase.js
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function test() {
  console.log('Testing Supabase connection...\n');

  // Test schedule_runs
  const { data: runs, error: e1 } = await sb.from('schedule_runs').select('id').limit(1);
  if (e1) {
    console.error('❌ schedule_runs:', e1.message);
    console.log('\nTable does not exist. Run this SQL in Supabase Dashboard → SQL Editor:\n');
    console.log(SQL);
  } else {
    console.log('✅ schedule_runs table exists, rows:', runs?.length ?? 0);
  }

  // Test scheduled_workloads
  const { data: wl, error: e2 } = await sb.from('scheduled_workloads').select('id').limit(1);
  if (e2) {
    console.error('❌ scheduled_workloads:', e2.message);
  } else {
    console.log('✅ scheduled_workloads table exists, rows:', wl?.length ?? 0);
  }

  if (!e1 && !e2) {
    console.log('\n✅ All good! Run the scheduler and data will appear in Supabase.');
  }
}

const SQL = `
-- Run this in Supabase Dashboard → SQL Editor

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

test().catch(console.error);
