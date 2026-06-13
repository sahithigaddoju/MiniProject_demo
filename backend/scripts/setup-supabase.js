/**
 * Creates the scheduled_workloads table and tests a write.
 * Run: node scripts/setup-supabase.js
 *
 * If table creation fails (no SQL access), run the SQL manually in
 * Supabase Dashboard → SQL Editor.
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const CREATE_SQL = `
create table if not exists scheduled_workloads (
  id              uuid default gen_random_uuid() primary key,
  run_id          text,
  filename        text,
  scheduled_at    timestamptz,
  is_emergency    boolean default false,
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

console.log('=== CloudOpt Supabase Setup ===\n');
console.log('If the table does not exist, run this SQL in Supabase Dashboard → SQL Editor:\n');
console.log(CREATE_SQL);

// Test connection
const { data, error } = await sb.from('scheduled_workloads').select('id').limit(1);
if (error) {
  console.error('❌ Table missing or connection failed:', error.message);
  console.log('\nCreate the table using the SQL above, then re-run this script.');
  process.exit(1);
}
console.log('✅ scheduled_workloads table exists');

// Test insert + delete
const testId = 'test-run-' + Date.now();
const { error: ie } = await sb.from('scheduled_workloads').insert({
  run_id: testId, filename: 'test.csv',
  scheduled_at: new Date().toISOString(), is_emergency: false,
  workload_id: 'W-TEST', cpu: 4, memory: 8, duration: 1,
  server: 'SRV-01', status: 'Accepted', priority: 'normal',
  energy_cost: 0.4, profit: 49.6, predicted_price: 65, revenue: 65,
  start_time: new Date().toISOString(), end_time: new Date().toISOString(),
  reason: 'accepted',
});
if (ie) { console.error('❌ Insert failed:', ie.message); process.exit(1); }
await sb.from('scheduled_workloads').delete().eq('run_id', testId);
console.log('✅ Insert/delete test passed');
console.log('\n✅ All good! Upload a CSV and run the scheduler — workloads will appear in Supabase.');
