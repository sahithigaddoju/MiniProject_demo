import { createClient } from '@supabase/supabase-js';

// Lazy client — reads env vars at call time (after dotenv loads)
let _client = null;
function getClient() {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key || url === 'your_supabase_project_url') return null;
  _client = createClient(url, key);
  return _client;
}

/**
 * Persist scheduled workload rows to Supabase.
 * Only the scheduled_workloads table is used — one row per workload.
 *
 * Required table (run once in Supabase Dashboard → SQL Editor):
 *
 *   create table if not exists scheduled_workloads (
 *     id              uuid default gen_random_uuid() primary key,
 *     run_id          text,
 *     filename        text,
 *     scheduled_at    timestamptz,
 *     is_emergency    boolean default false,
 *     workload_id     text,
 *     cpu             numeric,
 *     memory          numeric,
 *     duration        numeric,
 *     server          text,
 *     status          text,
 *     priority        text,
 *     energy_cost     numeric,
 *     profit          numeric,
 *     predicted_price numeric,
 *     revenue         numeric,
 *     start_time      text,
 *     end_time        text,
 *     reason          text
 *   );
 */
export async function persistScheduleRun(entry) {
  const sb = getClient();
  if (!sb) {
    console.warn('[Supabase] Not configured — skipping persistence');
    return;
  }

  try {
    // Delete previous rows for this run (handles re-runs / emergency updates)
    await sb.from('scheduled_workloads').delete().eq('run_id', entry.id);

    // Build one flat row per workload result
    const rows = entry.results.map(r => ({
      run_id:          entry.id,
      filename:        entry.filename,
      scheduled_at:    entry.scheduledAt,
      is_emergency:    entry.isEmergency ?? false,
      workload_id:     r.workloadId,
      cpu:             r.cpu,
      memory:          r.memory,
      duration:        r.duration,
      server:          r.server,
      status:          r.status,
      priority:        r.priority,
      energy_cost:     r.energyCost,
      profit:          r.profit,
      predicted_price: r.predictedPrice,
      revenue:         r.revenue,
      start_time:      r.startTime,
      end_time:        r.endTime,
      reason:          r.reason,
    }));

    const { error } = await sb.from('scheduled_workloads').insert(rows);
    if (error) {
      console.error('[Supabase] insert error:', error.message);
      return;
    }

    console.log(`[Supabase] ✅ Saved ${rows.length} workloads to scheduled_workloads`);
  } catch (e) {
    console.error('[Supabase] persistScheduleRun failed:', e.message);
  }
}
