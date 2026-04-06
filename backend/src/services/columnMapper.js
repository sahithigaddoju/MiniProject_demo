/**
 * Intelligent column mapper for Kaggle-style cloud workload datasets.
 */

import { v4 as uuidv4 } from 'uuid';

// ── Column alias maps (first match wins) ─────────────────────────────────────
const ID_COLS      = ['job_id', 'task_id', 'workload_id', 'workloadid', 'id', 'jid'];
const CPU_COLS     = ['cpu_usage', 'cpu_request', 'cpu_avg', 'cpurequired', 'cpu_required', 'cpu', 'cores', 'vcpu',
                      'cpu_utilization (%)', 'cpu_utilization', 'cpu_util', 'cpu_percent'];
const MEM_COLS     = ['memory_usage', 'memory_request', 'mem_usage', 'mem_request', 'memoryrequired',
                      'memory_required', 'memory', 'mem', 'ram',
                      'memory_consumption (mb)', 'memory_consumption', 'mem_consumption'];
const START_COLS   = ['start_time', 'submit_time', 'start', 'submit', 'starttime', 'submittime',
                      'task_start_time', 'job_start_time'];
const END_COLS     = ['end_time', 'finish_time', 'end', 'finish', 'endtime', 'finishtime',
                      'task_end_time', 'job_end_time'];
const DUR_COLS     = ['duration', 'runtime', 'exec_time', 'execution_time', 'elapsed', 'walltime',
                      'task_execution_time (ms)', 'task_execution_time', 'execution_time_ms'];
const PRICE_COLS   = ['base_price', 'price', 'cost', 'baseprice', 'charge', 'billing'];
const PRIORITY_COLS= ['priority', 'prio', 'urgency', 'sla_level', 'qos', 'job_priority'];
const DEADLINE_COLS= ['deadline', 'due_time', 'sla_deadline', 'due'];
const DELAY_COLS   = ['delay_tolerant', 'delaytolerant', 'flexible', 'deferrable', 'delay_ok'];
const ERROR_COLS   = ['error_rate', 'failure_rate', 'error', 'fail_rate', 'error_rate (%)'];

// Defaults when a column is missing
const DEFAULTS = {
  cpu:          2,
  memory:       4,      // GB
  duration:     1,      // hours
  basePrice:    20,     // $
  delayTolerant:false,
  priority:     'normal',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Case-insensitive key lookup against an alias list */
function pick(row, aliases) {
  const keys = Object.keys(row).map(k => k.toLowerCase().trim());
  for (const alias of aliases) {
    const idx = keys.indexOf(alias);
    if (idx !== -1) return Object.values(row)[idx];
  }
  return undefined;
}

/** Detect if a column name looks like a percentage/utilization field */
function isPercentageColumn(row, aliases) {
  const keys = Object.keys(row).map(k => k.toLowerCase().trim());
  for (const alias of aliases) {
    const idx = keys.indexOf(alias);
    if (idx !== -1) {
      const colName = Object.keys(row)[idx].toLowerCase();
      return colName.includes('%') || colName.includes('utilization') || colName.includes('percent');
    }
  }
  return false;
}

/** Parse a float, return undefined if NaN */
function pf(v) {
  const n = parseFloat(v);
  return isNaN(n) ? undefined : n;
}

/**
 * Convert CPU value to cores.
 * If the column is a utilization percentage (0–100), map to 1–16 cores range.
 * If it's already a core count (e.g. 2, 4, 8), use directly.
 */
function toCores(val, isPercent) {
  const n = pf(val);
  if (n === undefined) return undefined;
  // Only treat as percentage if the column is explicitly a utilization/percent column
  // AND the value is in 0-100 range. Never scale down values like 32, 64 (valid core counts).
  if (isPercent && n <= 100) {
    // Treat as percentage: map 0–100% → 1–64 cores
    return Math.max(1, Math.round((n / 100) * 64));
  }
  return Math.max(0.5, n);
}

/** Convert memory to GB — handles MB, KB, bytes heuristically */
function toGB(val) {
  const n = pf(val);
  if (n === undefined) return undefined;
  if (n > 100000) return n / (1024 * 1024);  // bytes → GB
  if (n > 1000)   return n / 1024;            // MB → GB
  return n;                                   // already GB
}

/** Convert time delta to hours — handles seconds, milliseconds, minutes */
function toHours(val) {
  const n = pf(val);
  if (n === undefined) return undefined;
  if (n > 86400000) return n / 3600000;  // very large → milliseconds
  if (n > 86400)    return n / 3600;     // seconds
  if (n > 1440)     return n / 60;       // minutes
  if (n > 24)       return n;            // already hours (large)
  return n;                              // already hours
}

/**
 * Convert duration in ms to hours explicitly.
 * Since we know the column is in milliseconds from its name, all valid numbers are ms.
 * We clamp to minimum 0.5 hours for pricing purposes during mapping.
 */
function toHoursFromMs(val) {
  const n = pf(val);
  if (n === undefined) return undefined;
  return Math.max(0.5, n / 3600000);
}

/** Map a numeric or string priority to our internal labels */
function mapPriority(val, delayTolerant) {
  if (val === undefined || val === null || val === '') {
    return delayTolerant ? 'normal' : 'urgent';
  }
  const n = parseFloat(val);
  if (!isNaN(n)) {
    if (n >= 8)  return 'emergency';
    if (n >= 5)  return 'urgent';
    return 'normal';
  }
  const s = String(val).toLowerCase().trim();
  if (['emergency', 'critical', 'highest'].includes(s)) return 'emergency';
  if (['high', 'urgent', 'important'].includes(s))      return 'urgent';
  if (['medium', 'normal', 'moderate'].includes(s))     return 'normal';
  return 'normal';
}

// ── Main export ───────────────────────────────────────────────────────────────

export function detectColumns(rows) {
  if (!rows.length) return {};
  const sample = rows[0];
  const report = {};

  const check = (label, aliases) => {
    const val = pick(sample, aliases);
    report[label] = val !== undefined
      ? Object.keys(sample).find(k => aliases.includes(k.toLowerCase().trim())) || '(found)'
      : `(missing — default: ${DEFAULTS[label] ?? 'auto'})`;
  };

  check('id',           ID_COLS);
  check('cpu',          CPU_COLS);
  check('memory',       MEM_COLS);
  check('duration',     [...DUR_COLS, ...START_COLS]);
  check('basePrice',    PRICE_COLS);
  check('priority',     PRIORITY_COLS);
  check('delayTolerant',DELAY_COLS);
  check('deadline',     DEADLINE_COLS);
  return report;
}

/**
 * Map a single raw row to the canonical workload schema.
 */
export function mapRow(raw, rowIndex) {
  try {
    // ── ID ──
    const id = String(pick(raw, ID_COLS) ?? `wl-${rowIndex + 1}`).trim() || uuidv4();

    // ── CPU (cores) ──
    // Detect if the column is a utilization percentage
    const cpuIsPercent = isPercentageColumn(raw, CPU_COLS);
    const cpuRaw = pick(raw, CPU_COLS);
    const cpu = Math.max(1, toCores(cpuRaw, cpuIsPercent) ?? DEFAULTS.cpu);

    // ── Memory (GB) ──
    const memRaw = pick(raw, MEM_COLS);
    const memory = Math.max(0.5, toGB(memRaw) ?? DEFAULTS.memory);

    // ── Duration (hours) ──
    let duration = DEFAULTS.duration;
    const durRaw = pick(raw, DUR_COLS);
    if (durRaw !== undefined) {
      // Check if column name suggests milliseconds
      const durColName = Object.keys(raw).find(k => {
        const kl = k.toLowerCase().trim();
        return DUR_COLS.includes(kl);
      }) || '';
      const isMs = durColName.toLowerCase().includes('ms') || durColName.toLowerCase().includes('millisec');
      if (isMs) {
        duration = Math.max(0.5, toHoursFromMs(durRaw));
      } else {
        duration = Math.max(0.1, toHours(durRaw) ?? DEFAULTS.duration);
      }
    } else {
      // Try to derive from start/end timestamps
      const startRaw = pick(raw, START_COLS);
      const endRaw   = pick(raw, END_COLS);
      if (startRaw !== undefined && endRaw !== undefined) {
        // Try parsing as timestamps
        const startMs = Date.parse(String(startRaw));
        const endMs   = Date.parse(String(endRaw));
        if (!isNaN(startMs) && !isNaN(endMs) && endMs > startMs) {
          duration = Math.max(0.5, (endMs - startMs) / 3600000);
        } else {
          const delta = pf(endRaw) - pf(startRaw);
          if (!isNaN(delta) && delta > 0) {
            duration = Math.max(0.5, toHours(delta));
          }
        }
      }
    }

    // ── Base price ($) ──
    const priceRaw = pick(raw, PRICE_COLS);
    let basePrice;
    if (priceRaw !== undefined) {
      basePrice = Math.max(1, pf(priceRaw) ?? DEFAULTS.basePrice);
    } else {
      // Derive a realistic base price from resources
      // cpu cores * duration hours * $2/core-hr + memory GB * $0.5/GB-hr
      const derived = cpu * duration * 2 + memory * duration * 0.5;
      basePrice = Math.max(20, parseFloat(derived.toFixed(2)));
    }

    // ── Delay tolerant ──
    const delayRaw      = pick(raw, DELAY_COLS);
    const delayTolerant = delayRaw !== undefined
      ? (delayRaw === true || delayRaw === 'true' || delayRaw === '1' || delayRaw === 1)
      : false;

    // ── Priority ──
    const prioRaw  = pick(raw, PRIORITY_COLS);
    const priority = mapPriority(prioRaw, delayTolerant);

    // ── Deadline ──
    const deadlineRaw = pick(raw, DEADLINE_COLS);
    const deadline    = deadlineRaw ? String(deadlineRaw) : null;

    // ── Error rate ──
    const errorRaw  = pick(raw, ERROR_COLS);
    const errorRate = pf(errorRaw) ?? 0;

    console.log(`[Mapper] Row ${rowIndex}: id=${id} cpu=${cpu} mem=${memory.toFixed(2)}GB dur=${duration.toFixed(2)}h price=$${basePrice} priority=${priority}`);

    return { id, cpu, memory, duration, basePrice, delayTolerant, priority, deadline, errorRate };
  } catch (e) {
    console.warn(`[Mapper] Skipped row ${rowIndex}:`, e.message);
    return null;
  }
}

export function mapDataset(rows) {
  const columnMap = detectColumns(rows);
  const workloads = [];
  let skipped     = 0;

  for (let i = 0; i < rows.length; i++) {
    const w = mapRow(rows[i], i);
    if (w) workloads.push(w);
    else   skipped++;
  }

  console.log(`[ColumnMapper] ${rows.length} rows → ${workloads.length} valid, ${skipped} skipped`);
  console.log('[ColumnMapper] Column map:', columnMap);
  return { workloads, skipped, columnMap };
}
