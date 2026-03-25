import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { Upload, FileText, AlertTriangle, CheckCircle, Loader2, X, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';
import { useTheme } from '../context/ThemeContext';

const FIELD_STYLE = (tokens) => ({
  width: '100%',
  padding: '0.6rem 0.75rem',
  borderRadius: '8px',
  border: '1px solid rgba(239,68,68,0.35)',
  backgroundColor: 'rgba(255,255,255,0.04)',
  color: '#fff',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
});

function EmergencyModal({ onClose, tokens, onSuccess }) {
  const [form, setForm] = useState({
    id: '', cpu: '', memory: '', runtime: '', price: '', deadline: '', delayTolerant: false,
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.id || !form.cpu || !form.memory || !form.runtime || !form.price) {
      toast.error('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const workload = {
        id: form.id,
        cpu: parseFloat(form.cpu),
        memory: parseFloat(form.memory),
        duration: parseFloat(form.runtime),
        price: parseFloat(form.price),
        deadline: form.deadline || null,
        delayTolerant: form.delayTolerant,
        priority: 10, // emergency = highest priority
        emergency: true,
      };
      // Upload as single-workload batch then schedule immediately
      const res = await api.post('/upload/emergency', { workload });
      toast.success('Emergency workload injected & rescheduled!');
      onSuccess(res.data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Injection failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#0d1117',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '1.75rem',
          width: '100%',
          maxWidth: '540px',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={20} style={{ color: '#ef4444' }} />
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ef4444' }}>Inject Emergency Workload</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '0.25rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Workload ID — full width */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Workload ID</label>
          <input
            value={form.id}
            onChange={e => set('id', e.target.value)}
            placeholder="e.g. emergency-001"
            style={FIELD_STYLE(tokens)}
          />
        </div>

        {/* CPU + Memory */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>CPU Cores</label>
            <input type="number" min="1" value={form.cpu} onChange={e => set('cpu', e.target.value)}
              placeholder="4" style={FIELD_STYLE(tokens)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Memory (GB)</label>
            <input type="number" min="1" value={form.memory} onChange={e => set('memory', e.target.value)}
              placeholder="8" style={FIELD_STYLE(tokens)} />
          </div>
        </div>

        {/* Runtime + Base Price */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Runtime (hrs)</label>
            <input type="number" min="0.1" step="0.1" value={form.runtime} onChange={e => set('runtime', e.target.value)}
              placeholder="2" style={FIELD_STYLE(tokens)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Base Price ($)</label>
            <input type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)}
              placeholder="50" style={FIELD_STYLE(tokens)} />
          </div>
        </div>

        {/* Deadline + Delay Tolerant */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Deadline (timestamp)</label>
            <input type="datetime-local" value={form.deadline} onChange={e => set('deadline', e.target.value)}
              style={{ ...FIELD_STYLE(tokens), colorScheme: 'dark' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', paddingBottom: '0.1rem' }}>
            <input
              type="checkbox"
              id="delayTolerant"
              checked={form.delayTolerant}
              onChange={e => set('delayTolerant', e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#ef4444', cursor: 'pointer' }}
            />
            <label htmlFor="delayTolerant" style={{ fontSize: '0.875rem', color: '#94a3b8', cursor: 'pointer' }}>Delay Tolerant</label>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              backgroundColor: '#ef4444', color: '#fff', fontWeight: 700,
              padding: '0.65rem 1.5rem', borderRadius: '10px',
              border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
              fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
              opacity: submitting ? 0.7 : 1, transition: 'all 0.2s',
            }}
          >
            {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <AlertTriangle size={16} />}
            Inject &amp; Schedule
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function UploadWorkloads() {
  const { tokens } = useTheme();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [formatOpen, setFormatOpen] = useState(false);
  const inputRef = useRef();
  const navigate = useNavigate();
  const { refresh: refreshDashboard, scheduleResults } = useDashboard();
  const hasScheduled = scheduleResults && scheduleResults.length > 0;

  const handleEmergencySuccess = async (data) => {
    console.log('[Emergency] Injection result:', data.summary);
    await refreshDashboard();
    navigate('/app/scheduled');
  };

  const handleFile = (f) => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['csv', 'json'].includes(ext)) { toast.error('Only CSV or JSON files are supported'); return; }
    setFile(f);
    setUploadResult(null);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); };

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a file');
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadResult(res.data);
      toast.success(`Uploaded ${res.data.count} workloads`);
      // Refresh dashboard so pending count shows immediately
      refreshDashboard();
    } catch (err) { toast.error(err.response?.data?.error || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const handleSchedule = async () => {
    if (!uploadResult?.batchId) return;
    setScheduling(true);
    try {
      await api.post(`/schedule/run/${uploadResult.batchId}`);
      toast.success('Scheduling complete! Dashboard updated.');
      await refreshDashboard();
      navigate('/app');           // go to dashboard to see updated metrics
    } catch (err) { toast.error(err.response?.data?.error || 'Scheduling failed'); }
    finally { setScheduling(false); }
  };

  const btnCyan = {
    backgroundColor: tokens.accent, color: tokens.accent === '#22d3ee' ? '#000' : '#fff',
    fontWeight: 600, padding: '0.6rem 1.25rem', borderRadius: '10px',
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
    border: 'none', cursor: 'pointer', fontSize: '0.875rem',
  };
  const btnGreen = {
    backgroundColor: '#059669', color: '#fff', fontWeight: 600,
    padding: '0.6rem 1.25rem', borderRadius: '10px',
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
    border: 'none', cursor: 'pointer', fontSize: '0.875rem',
  };

  return (
    <div style={{ maxWidth: '900px' }}>
      {modalOpen && <EmergencyModal onClose={() => setModalOpen(false)} tokens={tokens} onSuccess={handleEmergencySuccess} />}

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ color: tokens.textPrimary, fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Upload Workloads</h1>
          <p style={{ color: tokens.textSecondary, fontSize: '0.875rem', marginTop: '0.3rem' }}>
            Import batch workloads via CSV/JSON or inject emergency tasks.
          </p>
        </div>
        <button
          onClick={() => hasScheduled ? setModalOpen(true) : toast.error('Run the scheduler first before injecting an emergency workload.')}
          title={hasScheduled ? 'Inject an emergency workload into the current schedule' : 'Upload and run the scheduler first'}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.6rem 1.1rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem',
            backgroundColor: hasScheduled ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.05)',
            color: hasScheduled ? '#ef4444' : 'rgba(239,68,68,0.4)',
            border: `1px solid ${hasScheduled ? 'rgba(239,68,68,0.35)' : 'rgba(239,68,68,0.15)'}`,
            cursor: hasScheduled ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s', whiteSpace: 'nowrap',
          }}
        >
          <AlertTriangle size={15} />
          Inject Emergency Task
          {!hasScheduled && <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>(schedule first)</span>}
        </button>
      </div>

      {/* Two-column layout: drop zone left, file format right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.25rem', alignItems: 'start' }}>

        {/* Drop zone */}
        <div
          style={{
            borderRadius: '16px',
            border: `2px dashed ${dragOver ? tokens.accent : tokens.dropZoneBorder}`,
            backgroundColor: dragOver ? tokens.accentBg : tokens.dropZoneBg,
            padding: '3rem 2rem', cursor: 'pointer', transition: 'all 0.2s',
            minHeight: '260px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !file && inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept=".csv,.json" style={{ display: 'none' }}
            onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
          <div style={{ textAlign: 'center', width: '100%' }}>
            {file ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <FileText size={36} style={{ color: tokens.accent }} />
                <div>
                  <p style={{ color: tokens.textPrimary, fontWeight: 600, margin: 0 }}>{file.name}</p>
                  <p style={{ color: tokens.textSecondary, fontSize: '0.8rem', marginTop: '0.25rem' }}>{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={e => { e.stopPropagation(); setFile(null); setUploadResult(null); }}
                  style={{ color: tokens.textSecondary, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <X size={14} /> Remove
                </button>
              </div>
            ) : (
              <>
                <Upload size={40} style={{ color: tokens.textMuted, margin: '0 auto 1rem' }} />
                <p style={{ color: tokens.textPrimary, fontWeight: 600, fontSize: '1rem', margin: '0 0 0.4rem' }}>Drag &amp; drop file here</p>
                <p style={{ color: tokens.textSecondary, fontSize: '0.85rem', margin: '0 0 1.25rem' }}>Supports .csv and .json files</p>
                <button
                  onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
                  style={{
                    padding: '0.55rem 1.25rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem',
                    border: `1px solid ${tokens.divider}`, backgroundColor: 'rgba(255,255,255,0.06)',
                    color: tokens.textPrimary, cursor: 'pointer',
                  }}
                >
                  Browse Files
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right column: File Format Reference accordion */}
        <div style={{ borderRadius: '14px', border: `1px solid ${tokens.divider}`, overflow: 'hidden', backgroundColor: tokens.dropZoneBg }}>
          {/* Header toggle */}
          <button
            onClick={() => setFormatOpen(v => !v)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '0.85rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
              color: tokens.textPrimary, fontWeight: 600, fontSize: '0.875rem',
            }}
          >
            File Format Reference
            {formatOpen ? <ChevronUp size={16} style={{ color: tokens.textMuted }} /> : <ChevronDown size={16} style={{ color: tokens.textMuted }} />}
          </button>

          {formatOpen && (
            <div style={{ borderTop: `1px solid ${tokens.divider}` }}>
              <p style={{ margin: '0.75rem 1rem 0.6rem', fontSize: '0.72rem', color: tokens.textMuted, lineHeight: 1.5 }}>
                Accepts Kaggle-style datasets. Columns are auto-mapped — missing fields get smart defaults.
              </p>

              {/* Accepted column aliases */}
              <div style={{ margin: '0 1rem' }}>
                {[
                  ['ID',       'job_id, task_id, id'],
                  ['CPU',      'cpu_usage, cpu_request, vcpu'],
                  ['Memory',   'memory_usage, mem_request, ram'],
                  ['Duration', 'runtime, duration, end_time − start_time'],
                  ['Price',    'base_price, cost, charge'],
                  ['Priority', 'priority, urgency, sla_level'],
                  ['Deadline', 'deadline, due_time'],
                  ['Flexible', 'delay_tolerant, deferrable'],
                ].map(([field, aliases], i, arr) => (
                  <div key={field} style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem',
                    padding: '0.4rem 0',
                    borderBottom: i < arr.length - 1 ? `1px solid ${tokens.divider}` : 'none',
                  }}>
                    <code style={{ fontSize: '0.73rem', fontWeight: 700, color: tokens.accent, flexShrink: 0 }}>{field}</code>
                    <span style={{ fontSize: '0.67rem', color: tokens.textMuted, textAlign: 'right', lineHeight: 1.4 }}>{aliases}</span>
                  </div>
                ))}
              </div>

              <p style={{ margin: '0.5rem 1rem', fontSize: '0.67rem', color: tokens.textMuted, fontStyle: 'italic' }}>
                Missing columns auto-filled. Units normalized (MB→GB, seconds→hours).
              </p>

              {/* Sample CSV */}
              <div style={{ margin: '0 1rem 1rem', borderRadius: '8px', backgroundColor: 'rgba(0,0,0,0.25)', border: `1px solid ${tokens.divider}`, overflow: 'hidden' }}>
                <div style={{ padding: '0.3rem 0.65rem', borderBottom: `1px solid ${tokens.divider}` }}>
                  <span style={{ fontSize: '0.63rem', color: tokens.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sample CSV (Kaggle-style)</span>
                </div>
                <pre style={{ margin: 0, padding: '0.6rem 0.75rem', fontSize: '0.63rem', lineHeight: 1.7, color: tokens.accent, overflowX: 'auto', fontFamily: 'monospace' }}>{`job_id,start_time,end_time,cpu_usage,memory_usage,priority,error_rate
J1,0,10,2,4,3,0.5
J2,5,20,4,8,5,1.2
J3,10,15,1,2,1,0.0`}</pre>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload result */}
      {uploadResult && (
        <div style={{ marginTop: '1.25rem', borderRadius: '14px', padding: '1rem 1.25rem', border: '1px solid rgba(16,185,129,0.3)', backgroundColor: 'rgba(16,185,129,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <CheckCircle size={18} style={{ color: '#34d399' }} />
            <span style={{ fontWeight: 600, color: '#34d399' }}>Upload Successful</span>
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: uploadResult.columnMap ? '0.75rem' : 0 }}>
            <div>
              <span style={{ color: tokens.textMuted, fontSize: '0.75rem' }}>Batch ID</span>
              <div><code style={{ backgroundColor: 'rgba(16,185,129,0.15)', padding: '0.1rem 0.45rem', borderRadius: '6px', fontSize: '0.75rem', color: '#34d399' }}>{uploadResult.batchId}</code></div>
            </div>
            <div>
              <span style={{ color: tokens.textMuted, fontSize: '0.75rem' }}>Workloads parsed</span>
              <div style={{ color: tokens.textPrimary, fontWeight: 700, fontSize: '1rem' }}>{uploadResult.count}</div>
            </div>
            {uploadResult.skipped > 0 && (
              <div>
                <span style={{ color: tokens.textMuted, fontSize: '0.75rem' }}>Rows skipped</span>
                <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '1rem' }}>{uploadResult.skipped}</div>
              </div>
            )}
          </div>

          {/* Column mapping report */}
          {uploadResult.columnMap && Object.keys(uploadResult.columnMap).length > 0 && (
            <div style={{ borderTop: `1px solid rgba(16,185,129,0.2)`, paddingTop: '0.75rem' }}>
              <p style={{ color: tokens.textMuted, fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Column Mapping</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.3rem' }}>
                {Object.entries(uploadResult.columnMap).map(([field, mapped]) => {
                  const isMissing = String(mapped).startsWith('(missing');
                  return (
                    <div key={field} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem' }}>
                      <code style={{ color: '#34d399', fontWeight: 600 }}>{field}</code>
                      <span style={{ color: tokens.textMuted }}>←</span>
                      <span style={{ color: isMissing ? '#f59e0b' : tokens.textSecondary, fontStyle: isMissing ? 'italic' : 'normal' }}>{mapped}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
        <button onClick={handleUpload} disabled={!file || uploading || !!uploadResult}
          style={{ ...btnCyan, opacity: (!file || uploading || !!uploadResult) ? 0.45 : 1 }}>
          {uploading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={15} />}
          Upload File
        </button>
        {uploadResult && (
          <button onClick={handleSchedule} disabled={scheduling}
            style={{ ...btnGreen, opacity: scheduling ? 0.5 : 1 }}>
            {scheduling ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={15} />}
            Run Scheduler
          </button>
        )}
      </div>
    </div>
  );
}
