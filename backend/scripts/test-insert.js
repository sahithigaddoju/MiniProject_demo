import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const testRunId = 'test-run-' + Date.now();

// Insert a test run
const { error: e1 } = await sb.from('schedule_runs').insert({
  id: testRunId,
  batch_id: 'test-batch',
  filename: 'test.csv',
  scheduled_at: new Date().toISOString(),
  is_emergency: false,
  total: 3, accepted: 2, rejected: 1, preempted: 0,
  cpu_utilization: 45.5,
  total_energy: 12.3, total_revenue: 99.9, total_profit: 87.6,
  used_cpu: 8, used_memory: 32, total_cpu: 8000, total_memory: 32000,
});
if (e1) { console.error('❌ Insert run failed:', e1.message); process.exit(1); }
console.log('✅ Inserted test run:', testRunId);

// Insert test workloads
const { error: e2 } = await sb.from('scheduled_workloads').insert([
  { run_id: testRunId, workload_id: 'W1', cpu: 4, memory: 8, duration: 2, server: 'SRV-01', status: 'Accepted', priority: 'normal', energy_cost: 0.8, profit: 49.2, predicted_price: 65, revenue: 65, start_time: new Date().toISOString(), end_time: new Date().toISOString(), reason: 'accepted' },
  { run_id: testRunId, workload_id: 'W2', cpu: 2, memory: 4, duration: 1, server: 'SRV-02', status: 'Accepted', priority: 'urgent', energy_cost: 0.2, profit: 29.8, predicted_price: 39, revenue: 39, start_time: new Date().toISOString(), end_time: new Date().toISOString(), reason: 'accepted' },
  { run_id: testRunId, workload_id: 'W3', cpu: 1, memory: 2, duration: 0.5, server: '-', status: 'Rejected', priority: 'flexible', energy_cost: 0.05, profit: -0.05, predicted_price: 0, revenue: 0, start_time: '-', end_time: '-', reason: 'low_profit' },
]);
if (e2) { console.error('❌ Insert workloads failed:', e2.message); process.exit(1); }
console.log('✅ Inserted 3 test workloads');

// Clean up
await sb.from('schedule_runs').delete().eq('id', testRunId);
console.log('✅ Cleaned up test data');
console.log('\n✅ Supabase writes are working! Run the scheduler and data will appear.');
