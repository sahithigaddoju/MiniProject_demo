import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useDashboard } from '../context/DashboardContext';
import { Loader2, ExternalLink, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

const statusColors = {
  Accepted: 'bg-emerald-500/15 text-emerald-400',
  Rejected: 'bg-red-500/15 text-red-400',
  Preempted: 'bg-amber-500/15 text-amber-400',
};

const priorityColors = {
  emergency: 'bg-red-500/15 text-red-400',
  high: 'bg-orange-500/15 text-orange-400',
  normal: 'bg-white/5 text-slate-400',
};

export default function ScheduledWorkloads() {
  const { theme } = useTheme();
  const { scheduleResults, loading, refresh } = useDashboard();
  const [expanded, setExpanded] = useState(null);
  const [filter, setFilter] = useState('All');

  const schedules = [...(scheduleResults || [])].reverse();

  // Auto-expand latest batch when data arrives
  useEffect(() => {
    if (schedules.length > 0 && !expanded) {
      setExpanded(schedules[0].id);
    }
  }, [scheduleResults]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeSchedule = schedules.find(s => s.id === expanded);
  const filteredResults = activeSchedule?.results?.filter(r =>
    filter === 'All' || r.status === filter
  ) || [];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin text-cyan-400" />
    </div>
  );

  if (schedules.length === 0) return (
    <div className={`text-center py-20 ${theme.subtext}`}>
      <p className="text-lg font-medium">No scheduled workloads yet</p>
      <p className="text-sm mt-1">Upload and schedule workloads to see results here.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${theme.heading}`}>Scheduled Workloads</h1>
          <p className={`text-sm mt-1 ${theme.subtext}`}>View allocation results from the scheduler</p>
        </div>
        <button onClick={refresh} className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl border font-medium transition-all ${theme.btnSecondary}`}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Batch selector */}
      <div className={`rounded-2xl p-5 ${theme.card}`}>
        <h2 className={`font-semibold text-sm mb-3 ${theme.heading}`}>Scheduling Batches</h2>
        {schedules.map(s => (
          <button key={s.id} onClick={() => setExpanded(expanded === s.id ? null : s.id)}
            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left mb-2 ${
              expanded === s.id
                ? 'border-cyan-500/40 bg-cyan-500/10'
                : 'border-white/8 hover:border-white/15'
            }`}>
            <div className="flex items-center gap-2">
              <span className={`font-medium text-sm ${theme.heading}`}>{s.filename}</span>
              {s.isEmergency && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                  EMERGENCY
                </span>
              )}
              <span className={`text-xs ml-1 ${theme.subtext}`}>{new Date(s.scheduledAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-emerald-500 font-medium">{s.summary?.accepted} accepted</span>
              <span className="text-xs text-red-400">{s.summary?.rejected} rejected</span>
              {expanded === s.id ? <ChevronUp size={16} className={theme.subtext} /> : <ChevronDown size={16} className={theme.subtext} />}
            </div>
          </button>
        ))}
      </div>

      {/* Results table */}
      {activeSchedule && (
        <div className={`rounded-2xl p-5 space-y-4 ${theme.card}`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[['Total', activeSchedule.summary?.total, theme.heading],
              ['Accepted', activeSchedule.summary?.accepted, 'text-emerald-400'],
              ['Rejected', activeSchedule.summary?.rejected, 'text-red-400'],
              ['Preempted', activeSchedule.summary?.preempted, 'text-amber-400'],
            ].map(([label, val, cls]) => (
              <div key={label} className="rounded-xl p-3 text-center bg-white/[0.03] border border-white/8">
                <div className={`text-xl font-bold ${cls}`}>{val}</div>
                <div className={`text-xs mt-0.5 ${theme.subtext}`}>{label}</div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {['All', 'Accepted', 'Rejected', 'Preempted'].map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    filter === f
                      ? 'bg-cyan-500 text-black font-semibold'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}>{f}</button>
              ))}
            </div>
            {activeSchedule.outputFileUrl && (
              <a href={activeSchedule.outputFileUrl} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:underline">
                <ExternalLink size={13} /> Download Output
              </a>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${theme.divider}`}>
                  {['Workload ID','CPU','Memory','Server','Status','Priority','Price ($)','Start','End'].map(h => (
                    <th key={h} className={`text-left py-2.5 px-3 text-xs font-semibold whitespace-nowrap ${theme.tableHead}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((r, i) => (
                  <tr key={i} className={`border-b transition-colors ${theme.tableRow}`}>
                    <td className={`py-2.5 px-3 font-mono text-xs ${theme.tableCell}`}>{r.workloadId}</td>
                    <td className={`py-2.5 px-3 ${theme.tableCell}`}>{r.cpu}</td>
                    <td className={`py-2.5 px-3 ${theme.tableCell}`}>{r.memory} GB</td>
                    <td className={`py-2.5 px-3 font-medium ${theme.tableCell}`}>{r.server}</td>
                    <td className="py-2.5 px-3">
                      <span className={`badge ${statusColors[r.status] || ''}`}>{r.status}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`badge ${priorityColors[r.priority] || ''}`}>{r.priority}</span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-emerald-500">${r.predictedPrice ?? r.revenue ?? '-'}</td>
                    <td className={`py-2.5 px-3 text-xs whitespace-nowrap ${theme.subtext}`}>
                      {r.startTime !== '-' ? new Date(r.startTime).toLocaleTimeString() : '-'}
                    </td>
                    <td className={`py-2.5 px-3 text-xs whitespace-nowrap ${theme.subtext}`}>
                      {r.endTime !== '-' ? new Date(r.endTime).toLocaleTimeString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredResults.length === 0 && (
              <p className={`text-center text-sm py-8 ${theme.subtext}`}>No results for this filter.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
