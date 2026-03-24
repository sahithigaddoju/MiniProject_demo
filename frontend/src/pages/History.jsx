import React, { useEffect, useState } from 'react';
import api from '../api';
import { useTheme } from '../context/ThemeContext';
import { Loader2, ExternalLink, RefreshCw, FileText, AlertTriangle } from 'lucide-react';

export default function History() {
  const { theme } = useTheme();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/history').then(res => setHistory(res.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin text-cyan-400" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${theme.heading}`}>History</h1>
          <p className={`text-sm mt-1 ${theme.subtext}`}>All uploaded workload batches and their scheduling outcomes</p>
        </div>
        <button onClick={load} className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl border font-medium transition-all ${theme.btnSecondary}`}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {history.length === 0 ? (
        <div className={`text-center py-20 ${theme.subtext}`}>
          <FileText size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No history yet</p>
          <p className="text-sm mt-1">Uploaded workloads will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map(item => (
            <div key={item.id} className={`rounded-2xl p-5 transition-shadow ${theme.card} ${theme.cardHover}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    item.isEmergency ? 'bg-red-500/20' : 'bg-cyan-500/10'
                  }`}>
                    {item.isEmergency
                      ? <AlertTriangle size={18} className="text-red-400" />
                      : <FileText size={18} className="text-cyan-400" />
                    }
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-medium ${theme.heading}`}>{item.filename}</span>
                      {item.isEmergency && <span className="badge bg-red-100 text-red-700">Emergency</span>}
                      <span className={`badge ${item.status === 'scheduled' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${theme.subtext}`}>{new Date(item.uploadedAt).toLocaleString()} · {item.workloadCount} workloads</p>
                    {item.summary && (
                      <div className="flex gap-3 mt-2 text-xs flex-wrap">
                        <span className="text-emerald-500 font-medium">{item.summary.accepted} accepted</span>
                        <span className="text-red-400">{item.summary.rejected} rejected</span>
                        <span className="text-amber-400">{item.summary.preempted} preempted</span>
                        <span className={theme.subtext}>Revenue: ${item.summary.totalRevenue}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end flex-shrink-0">
                  {item.inputFileUrl && (
                    <a href={item.inputFileUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-cyan-400 hover:underline">
                      <ExternalLink size={12} /> Input File
                    </a>
                  )}
                  {item.outputFileUrl && (
                    <a href={item.outputFileUrl} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-emerald-500 hover:underline">
                      <ExternalLink size={12} /> Output File
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
