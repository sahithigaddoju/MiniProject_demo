/**
 * Energy-aware, profit-driven workload scheduler.
 *
 * Canonical workload schema (from upload.js normalizeWorkload):
 *   { id, cpu, memory, duration, basePrice, deadline, delayTolerant, priority }
 *
 * Pipeline:
 *   1. Emergency workloads → bypass profit check, schedule first (preempt if needed)
 *   2. Urgent workloads (delayTolerant=false) → accept only if profit > 0, sorted by profit desc
 *   3. Flexible workloads (delayTolerant=true) → accept only if profit > 0 AND energy is low,
 *      sorted by profit/energy ratio desc (best ROI per kWh)
 *   4. Hard capacity gate: totalCPU and totalMemory from db.resources
 *
 * Formulas:
 *   energyCost    = cpu * duration * 0.1          (kWh, treated as $ cost)
 *   profit        = basePrice - energyCost
 *   predictedPrice (urgent)   = basePrice * [1.3 … 1.8] scaled by cpu+runtime
 *   predictedPrice (flexible) = basePrice * [0.6 … 0.9] scaled by cpu+runtime
 */

const ENERGY_PER_CPU_HR = 0.10;   // kWh per CPU-core per hour (= energy cost coefficient)

export function scheduleWorkloads(workloads, resources) {
  const totalCPU    = resources.servers * resources.cpuPerServer;
  const totalMemory = resources.servers * resources.memoryPerServer;

  console.log(`[Scheduler] Cluster — CPU: ${totalCPU}, Memory: ${totalMemory} GB`);
  console.log(`[Scheduler] Incoming: ${workloads.length} workloads`);

  let usedCPU    = 0;
  let usedMemory = 0;
  const results  = [];
  const now      = new Date();
  let   _srv     = 0;

  // ── helpers ──────────────────────────────────────────────────────────────

  function energyCost(w)  { return w.cpu * (w.duration || 1) * ENERGY_PER_CPU_HR; }
  function profit(w)      { return (w.basePrice || 0) - energyCost(w); }

  function predictedPrice(w) {
    const base    = w.basePrice || 0;
    // scale factor: higher cpu/runtime → closer to upper bound
    const factor  = Math.min(1, (w.cpu * (w.duration || 1)) / 200);
    if (!w.delayTolerant) {
      // urgent: 1.3 → 1.8
      return base * (1.3 + factor * 0.5);
    } else {
      // flexible: 0.9 → 0.6 (discount for deferrable)
      return base * (0.9 - factor * 0.3);
    }
  }

  function serverLabel() {
    const label = `SRV-${String((_srv % resources.servers) + 1).padStart(2, '0')}`;
    _srv++;
    return label;
  }

  function accept(w, overrideStatus = 'Accepted') {
    const ec   = energyCost(w);
    const pr   = profit(w);
    const pp   = predictedPrice(w);
    const dur  = w.duration || 1;
    usedCPU    += w.cpu;
    usedMemory += w.memory;
    results.push({
      workloadId:     w.id,
      cpu:            w.cpu,
      memory:         w.memory,
      duration:       dur,
      server:         serverLabel(),
      status:         overrideStatus,
      priority:       w.priority || (w.delayTolerant ? 'flexible' : 'urgent'),
      energyCost:     parseFloat(ec.toFixed(4)),
      profit:         parseFloat(pr.toFixed(4)),
      predictedPrice: parseFloat(pp.toFixed(4)),
      revenue:        parseFloat(pp.toFixed(4)),   // revenue = what we charge
      energy:         parseFloat(ec.toFixed(4)),   // alias used by dashboard trends
      startTime:      now.toISOString(),
      endTime:        new Date(now.getTime() + dur * 3600000).toISOString(),
      reason:         'accepted',
    });
  }

  function reject(w, reason) {
    const ec = energyCost(w);
    const pr = profit(w);
    results.push({
      workloadId:     w.id,
      cpu:            w.cpu,
      memory:         w.memory,
      duration:       w.duration || 1,
      server:         '-',
      status:         'Rejected',
      priority:       w.priority || (w.delayTolerant ? 'flexible' : 'urgent'),
      energyCost:     parseFloat(ec.toFixed(4)),
      profit:         parseFloat(pr.toFixed(4)),
      predictedPrice: 0,
      revenue:        0,
      energy:         0,
      startTime:      '-',
      endTime:        '-',
      reason,
    });
  }

  function fitsCapacity(w) {
    return usedCPU + w.cpu <= totalCPU && usedMemory + w.memory <= totalMemory;
  }

  // ── 1. Emergency workloads (bypass profit check) ─────────────────────────
  const emergency = workloads.filter(w => w.priority === 'emergency');
  for (const ew of emergency) {
    if (fitsCapacity(ew)) {
      accept(ew, 'Accepted');
    } else {
      // Try to preempt the lowest-revenue accepted non-emergency workload
      const preemptable = results
        .filter(r => r.priority !== 'emergency' && r.status === 'Accepted')
        .sort((a, b) => a.revenue - b.revenue);
      if (preemptable.length > 0 &&
          preemptable[0].cpu >= ew.cpu &&
          preemptable[0].memory >= ew.memory) {
        const victim = preemptable[0];
        victim.status = 'Preempted';
        victim.reason = 'preempted_by_emergency';
        usedCPU    -= victim.cpu;
        usedMemory -= victim.memory;
        accept(ew, 'Accepted');
      } else {
        reject(ew, 'capacity_full');
      }
    }
  }

  // ── 2. Urgent workloads (delayTolerant = false) ──────────────────────────
  // Sort by profit descending — most profitable urgent jobs first
  const urgent = workloads
    .filter(w => w.priority !== 'emergency' && !w.delayTolerant)
    .map(w => ({ ...w, _profit: profit(w) }))
    .sort((a, b) => b._profit - a._profit);

  for (const w of urgent) {
    if (w._profit <= 0) {
      reject(w, 'low_profit');          // not profitable even if urgent
      continue;
    }
    if (!fitsCapacity(w)) {
      reject(w, 'capacity_full');
      continue;
    }
    accept(w);
  }

  // ── 3. Flexible workloads (delayTolerant = true) ─────────────────────────
  // Sort by profit/energyCost ratio — best ROI per kWh first
  const flexible = workloads
    .filter(w => w.priority !== 'emergency' && w.delayTolerant)
    .map(w => {
      const ec    = energyCost(w);
      const pr    = profit(w);
      const ratio = ec > 0 ? pr / ec : pr;   // profit per unit of energy
      return { ...w, _profit: pr, _energyCost: ec, _ratio: ratio };
    })
    .sort((a, b) => b._ratio - a._ratio);

  for (const w of flexible) {
    if (w._profit <= 0) {
      reject(w, 'low_profit');
      continue;
    }
    // Extra gate for flexible: reject if energy cost is disproportionately high
    // (energyCost > 70% of basePrice means thin margin — not worth deferring)
    if (w._energyCost > (w.basePrice || 0) * 0.7) {
      reject(w, 'high_energy_cost');
      continue;
    }
    if (!fitsCapacity(w)) {
      reject(w, 'capacity_full');
      continue;
    }
    accept(w);
  }

  // ── 4. Summary ───────────────────────────────────────────────────────────
  const accepted  = results.filter(r => r.status === 'Accepted');
  const rejected  = results.filter(r => r.status === 'Rejected');
  const preempted = results.filter(r => r.status === 'Preempted');

  const totalEnergy  = accepted.reduce((s, r) => s + r.energyCost, 0);
  const totalRevenue = accepted.reduce((s, r) => s + r.revenue,    0);
  const totalProfit  = accepted.reduce((s, r) => s + r.profit,     0);
  const cpuUtil      = totalCPU > 0 ? (usedCPU / totalCPU) * 100 : 0;

  const summary = {
    total:          workloads.length,
    accepted:       accepted.length,
    rejected:       rejected.length,
    preempted:      preempted.length,
    totalEnergy:    parseFloat(totalEnergy.toFixed(4)),
    totalRevenue:   parseFloat(totalRevenue.toFixed(4)),
    totalProfit:    parseFloat(totalProfit.toFixed(4)),
    cpuUtilization: parseFloat(cpuUtil.toFixed(1)),
    usedCPU,
    usedMemory,
    totalCPU,
    totalMemory,
  };

  console.log(`[Scheduler] accepted=${summary.accepted} rejected=${summary.rejected} preempted=${summary.preempted}`);
  console.log(`[Scheduler] CPU ${usedCPU}/${totalCPU} (${summary.cpuUtilization}%) | Energy=${summary.totalEnergy} kWh | Revenue=$${summary.totalRevenue} | Profit=$${summary.totalProfit}`);

  return { results, summary };
}
