import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api';

const DashboardContext = createContext(null);

// ── localStorage cache ────────────────────────────────────────────────────────
const LS_KEY = 'cloudopt_dashboard_cache';
function loadCache() {
  try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null; }
  catch { return null; }
}
function saveCache(d) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch {}
}

// ── Derive all dashboard state from a single /schedule/latest response ────────
function deriveFromLatest(latest) {
  const s = latest.summary;

  // ── metrics ──────────────────────────────────────────────────────────────
  const metrics = {
    cpuUtilization: parseFloat(s.cpuUtilization ?? 0),
    energyConsumed: parseFloat(s.totalEnergy    ?? 0),
    revenue:        parseFloat(s.totalRevenue   ?? 0),
    rejectedCount:  (s.rejected ?? 0) + (s.preempted ?? 0),
  };

  // ── trends — bucket accepted workloads into ≤15 points ───────────────────
  const accepted = (latest.results || []).filter(r => r.status === 'Accepted');
  let trends = [];
  if (accepted.length > 0) {
    const TARGET = Math.min(15, accepted.length);
    const bSize  = Math.ceil(accepted.length / TARGET);
    for (let i = 0; i < TARGET; i++) {
      const slice = accepted.slice(i * bSize, (i + 1) * bSize);
      if (!slice.length) break;
      trends.push({
        label:   `B${i + 1}`,
        energy:  parseFloat(slice.reduce((a, r) => a + (r.energy  ?? 0), 0).toFixed(3)),
        revenue: parseFloat(slice.reduce((a, r) => a + (r.revenue ?? 0), 0).toFixed(3)),
      });
    }
  }

  // ── workload status ───────────────────────────────────────────────────────
  const workloadStatus = {
    total:     s.total     ?? 0,
    scheduled: s.accepted  ?? 0,
    rejected:  s.rejected  ?? 0,
    preempted: s.preempted ?? 0,
    pending:   0,
  };

  return { metrics, trends, workloadStatus };
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function DashboardProvider({ children }) {
  const cache = loadCache();

  const [metrics,         setMetrics]        = useState(cache?.metrics         ?? null);
  const [trends,          setTrends]         = useState(cache?.trends          ?? []);
  const [workloadStatus,  setWorkloadStatus] = useState(cache?.workloadStatus  ?? null);
  const [scheduleResults, setScheduleResults]= useState(cache?.scheduleResults ?? []);
  const [history,         setHistory]        = useState(cache?.history         ?? []);
  const [loading,         setLoading]        = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      // Single source of truth for all dashboard metrics/charts
      const [latestRes, allRes, historyRes] = await Promise.all([
        api.get('/schedule/latest'),
        api.get('/schedule'),
        api.get('/history'),
      ]);

      const latest  = latestRes.data;   // null if nothing scheduled yet
      const all     = allRes.data;      // array of all schedule entries
      const hist    = historyRes.data;  // array of history entries

      console.log('[Dashboard] /schedule/latest:', latest?.summary ?? 'no data');
      console.log('[Dashboard] /schedule entries:', all?.length);
      console.log('[Dashboard] /history entries:', hist?.length);

      // ── Derive metrics/trends/status from latest — guaranteed consistent ──
      if (latest) {
        const { metrics: m, trends: t, workloadStatus: ws } = deriveFromLatest(latest);
        setMetrics(m);
        setTrends(t);
        setWorkloadStatus(ws);
      }
      // If latest is null (nothing scheduled), keep existing state — don't zero out

      // ── scheduleResults & history — only update when non-empty ────────────
      if (Array.isArray(all)  && all.length  > 0) setScheduleResults(all);
      if (Array.isArray(hist) && hist.length > 0) setHistory(hist);

      // ── Persist good snapshot ─────────────────────────────────────────────
      if (latest) {
        const { metrics: m, trends: t, workloadStatus: ws } = deriveFromLatest(latest);
        saveCache({
          metrics:         m,
          trends:          t,
          workloadStatus:  ws,
          scheduleResults: Array.isArray(all)  && all.length  > 0 ? all  : (cache?.scheduleResults ?? []),
          history:         Array.isArray(hist) && hist.length > 0 ? hist : (cache?.history         ?? []),
        });
      }

    } catch (e) {
      console.error('[Dashboard] refresh error:', e.message);
      // On error: keep whatever state we already have — never reset to zero
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch once on mount
  useEffect(() => { refresh(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DashboardContext.Provider value={{ metrics, trends, workloadStatus, scheduleResults, history, loading, refresh }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}
