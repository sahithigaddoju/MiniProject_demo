import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { Upload, FileText, AlertTriangle, CheckCircle, Loader2, X, Play, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { useDashboard } from '../context/DashboardContext';

// ── Light theme palette ───────────────────────────────────────────────────────
const L = {
  bg:          '#f8fafc',
  card:        '#ffffff',
  border:      '#e2e8f0',
  borderDash:  '#cbd5e1',
  text:        '#0f172a',
  textSub:     '#475569',
  textMuted:   '#94a3b8',
  accent:      '#2563eb',
  accentBg:    'rgba(37,99,235,0.06)',
  danger:      '#ef4444',
  dangerBg:    'rgba(239,68,68,0.08)',
  success:     '#16a34a',
  successBg:   'rgba(22,163,74,0.08)',
  successBorder:'rgba(22,163,74,0.25)',
  inputBg:     '#f8fafc',
  inputBorder: '#cbd5e1',
};

const inp = {
  width: '100%', boxSizing: 'border-box',
  padding: '0.6rem 0.75rem', borderRadius: '8px',
  border: `1px solid ${L.inputBorder}`, backgroundColor: L.inputBg,
  color: L.text, fontSize: '0.875rem', outline: 'none',
};

// ── Emergency modal ───────────────────────────────────────────────────────────
function EmergencyModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ id: '', cpu: '', memory: '', runtime: '', price: '', deadline: '', delayTolerant: false });
  const [submitting, setSubmitting] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.id || !form.cpu || !form.memory || !form.runtime || !form.price) {
      toast.error('Please fill all required fields'); return;
    }
    setSubmitting(true);
    try {
      const workload = {
        id: form.id, cpu: parseFloat(form.cpu), memory: parseFloat(form.memory),
        duration: parseFloat(form.runtime), price: parseFloat(form.price),
        deadline: form.deadline || null, delayTolerant: form.delayTolerant,
        priority: 10, emergency: true,
      };
      const res = await api.post('/upload/emergency', { workload });
      toast.success('Emergency workload injected & rescheduled!');
      onSuccess(res.data); onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Injection failed');
    } finally { setSubmitting(false); }
  };

  const row2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '0.875rem' };
  const lbl = { display: 'block', fontSize: '0.78rem', fontWeight: 600, color: L.textSub, marginBottom: '0.3rem' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
      <div style={{ backgroundColor: L.card, border: `1px solid ${L.border}`, borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: '520px', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: L.dangerBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} style={{ color: L.danger }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: L.text }}>Inject Emergency Workload</div>
              <div style={{ fontSize: '0.75rem', color: L.textMuted }}>Highest priority — will preempt if needed</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: L.textMuted, padding: '0.25rem' }}><X size={18} /></button>
        </div>

        <div style={{ marginBottom: '0.875rem' }}>
          <label style={lbl}>Workload ID *</label>
          <input value={form.id} onChange={e => set('id', e.target.value)} placeholder="e.g. emergency-001" style={inp} />
        </div>
        <div style={row2}>
          <div><label style={lbl}>CPU Cores *</label><input type="number" min="1" value={form.cpu} onChange={e => set('cpu', e.target.value)} placeholder="4" style={inp} /></div>
          <div><label style={lbl}>Memory (GB) *</label><input type="number" min="1" value={form.memory} onChange={e => set('memory', e.target.value)} placeholder="8" style={inp} /></div>
        </div>
        <div style={row2}>
          <div><label style={lbl}>Runtime (hrs) *</label><input type="number" min="0.1" step="0.1" value={form.runtime} onChange={e => set('runtime', e.target.value)} placeholder="2" style={inp} /></div>
          <div><label style={lbl}>Base Price ($) *</label><input type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} placeholder="50" style={inp} /></div>
        </div>
        <div style={row2}>
          <div><label style={lbl}>Deadline (optional)</label><input type="datetime-local" value={form.deadline} onChange={e => set('deadline', e.target.value)} style={{ ...inp, colorScheme: 'light' }} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '1.4rem' }}>
            <input type="checkbox" id="dt" checked={form.delayTolerant} onChange={e => set('delayTolerant', e.target.checked)} style={{ width: 16, height: 16, accentColor: L.accent, cursor: 'pointer' }} />
            <label htmlFor="dt" style={{ fontSize: '0.875rem', color: L.textSub, cursor: 'pointer' }}>Delay Tolerant</label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button onClick={onClose} style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: `1px solid ${L.border}`, backgroundColor: 'transparent', color: L.textSub, fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: L.danger, color: '#fff', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <AlertTriangle size={15} />}
            Inject &amp; Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Invalid format popup ──────────────────────────────────────────────────────
function InvalidFormatModal({ onClose }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, backgroundColor: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
      <div style={{ backgroundColor: L.card, border: `1px solid ${L.border}`, borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '440px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: L.dangerBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <AlertCircle size={28} style={{ color: L.danger }} />
        </div>
        <h2 style={{ color: L.text, fontWeight: 700, fontSize: '1.1rem', margin: '0 0 0.6rem' }}>Invalid File Format</h2>
        <p style={{ color: L.textSub, fontSize: '0.875rem', lineHeight: 1.6, margin: '0 0 1.25rem' }}>
          Please upload a valid file. Your CSV/JSON must contain at least one recognizable workload column:
        </p>
        <div style={{ backgroundColor: L.bg, borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', textAlign: 'left', border: `1px solid ${L.border}` }}>
          <code style={{ fontSize: '0.75rem', color: L.accent, lineHeight: 1.8, display: 'block' }}>
            job_id, cpu_usage, memory_usage,<br />
            start_time, end_time, priority,<br />
            base_price, error_rate
          </code>
        </div>
        <button onClick={onClose} style={{ backgroundColor: L.danger, color: '#fff', fontWeight: 600, padding: '0.6rem 2rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>Got it</button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function UploadWorkloads() {
  const [file, setFile]               = useState(null);
  const [uploading, setUploading]     = useState(false);
  const [scheduling, setScheduling]   = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragOver, setDragOver]       = useState(false);
  const [modalOpen, setModalOpen]     = useState(false);
  const [formatOpen, setFormatOpen]   = useState(false);
  const [invalidFormat, setInvalidFormat] = useState(false);
  const inputRef  = useRef();
  const navigate  = useNavigate();
  const { refresh: refreshDashboard, scheduleResults } = useDashboard();
  const hasScheduled = scheduleResults && scheduleResults.length > 0;

  const handleEmergencySuccess = async (data) => {
    console.log('[Emergency] result:', data.summary);
    await refreshDashboard();
    navigate('/app/scheduled');
  };

  const handleFile = (f) => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['csv', 'json'].includes(ext)) { toast.error('Only CSV or JSON files are supported'); return; }
    setFile(f); setUploadResult(null);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); };

  const handleUpload = async () => {
    if (!file) return toast.error('Please select a file');
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadResult(res.data);
      toast.success(`Uploaded ${res.data.count} workloads`);
      refreshDashboard();
    } catch (err) {
      const msg = err.response?.data?.error || 'Upload failed';
      if (msg.toLowerCase().includes('no valid workload') || msg.toLowerCase().includes('could not be parsed') || msg.toLowerCase().includes('empty')) {
        setInvalidFormat(true); setFile(null);
      } else { toast.error(msg); }
    } finally { setUploading(false); }
  };

  const handleSchedule = async () => {
    if (!uploadResult?.batchId) return;
    setScheduling(true);
    try {
      await api.post(`/schedule/run/${uploadResult.batchId}`);
      toast.success('Scheduling complete!');
      await refreshDashboard();
      navigate('/app');
    } catch (err) { toast.error(err.response?.data?.error || 'Scheduling failed'); }
    finally { setScheduling(false); }
  };

  return (
    <div style={{ backgroundColor: L.bg, minHeight: '100%', padding: '0.25rem' }}>
      {modalOpen    && <EmergencyModal onClose={() => setModalOpen(false)} onSuccess={handleEmergencySuccess} />}
      {invalidFormat && <InvalidFormatModal onClose={() => setInvalidFormat(false)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ color: L.text, fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Upload Workloads</h1>
          <p style={{ color: L.textSub, fontSize: '0.875rem', marginTop: '0.3rem', margin: '0.3rem 0 0' }}>Import batch workloads via CSV/JSON or inject emergency tasks.</p>
        </div>
        <button
          onClick={() => hasScheduled ? setModalOpen(true) : toast.error('Run the scheduler first before injecting an emergency workload.')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.1rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem', backgroundColor: hasScheduled ? L.dangerBg : 'rgba(239,68,68,0.04)', color: hasScheduled ? L.danger : 'rgba(239,68,68,0.4)', border: `1px solid ${hasScheduled ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.15)'}`, cursor: hasScheduled ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap' }}
        >
          <AlertTriangle size={15} />
          Inject Emergency Task
          {!hasScheduled && <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>(schedule first)</span>}
        </button>
      </div>

      {/* Two-column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.25rem', alignItems: 'start' }}>

        {/* Drop zone card */}
        <div
          style={{ backgroundColor: L.card, borderRadius: '16px', border: `2px dashed ${dragOver ? L.accent : L.borderDash}`, padding: '3.5rem 2rem', cursor: 'pointer', transition: 'all 0.2s', minHeight: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !file && inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept=".csv,.json" style={{ display: 'none' }} onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
          <div style={{ textAlign: 'center', width: '100%' }}>
            {file ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: '14px', backgroundColor: L.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={28} style={{ color: L.accent }} />
                </div>
                <div>
                  <p style={{ color: L.text, fontWeight: 600, margin: 0 }}>{file.name}</p>
                  <p style={{ color: L.textMuted, fontSize: '0.8rem', margin: '0.25rem 0 0' }}>{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button onClick={e => { e.stopPropagation(); setFile(null); setUploadResult(null); }} style={{ color: L.textMuted, background: 'none', border: `1px solid ${L.border}`, borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.3rem 0.75rem' }}>
                  <X size={13} /> Remove
                </button>
              </div>
            ) : (
              <>
                <div style={{ width: 64, height: 64, borderRadius: '16px', backgroundColor: L.accentBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                  <Upload size={30} style={{ color: L.accent }} />
                </div>
                <p style={{ color: L.text, fontWeight: 600, fontSize: '1rem', margin: '0 0 0.4rem' }}>Drag &amp; drop file here</p>
                <p style={{ color: L.textSub, fontSize: '0.875rem', margin: '0 0 1.5rem' }}>Supports .csv and .json files</p>
                <button onClick={e => { e.stopPropagation(); inputRef.current?.click(); }} style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.875rem', border: `1px solid ${L.border}`, backgroundColor: L.card, color: L.text, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  Browse Files
                </button>
              </>
            )}
          </div>
        </div>

        {/* File Format Reference */}
        <div style={{ backgroundColor: L.card, borderRadius: '14px', border: `1px solid ${L.border}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <button onClick={() => setFormatOpen(v => !v)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: L.text, fontWeight: 600, fontSize: '0.875rem' }}>
            File Format Reference
            {formatOpen ? <ChevronUp size={16} style={{ color: L.textMuted }} /> : <ChevronDown size={16} style={{ color: L.textMuted }} />}
          </button>
          {formatOpen && (
            <div style={{ borderTop: `1px solid ${L.border}` }}>
              <p style={{ margin: '0.75rem 1rem 0.6rem', fontSize: '0.72rem', color: L.textMuted, lineHeight: 1.5 }}>Accepts Kaggle-style datasets. Columns are auto-mapped.</p>
              <div style={{ margin: '0 1rem' }}>
                {[
                  ['workloadId',    'job_id, task_id, id',          'string'],
                  ['cpuRequired',   'cpu_usage, cpu_request, vcpu', 'number'],
                  ['memoryRequired','memory_usage, mem_request, ram','number'],
                  ['runtime',       'duration, end_time−start_time','number'],
                  ['deadline',      'deadline, due_time',           'number'],
                  ['delayTolerant', 'delay_tolerant, deferrable',   'boolean'],
                  ['basePrice',     'base_price, cost, charge',     'number'],
                  ['emergencyFlag', 'emergency, urgent',            'boolean'],
                ].map(([field, aliases, type], i, arr) => (
                  <div key={field} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', padding: '0.4rem 0', borderBottom: i < arr.length - 1 ? `1px solid ${L.border}` : 'none' }}>
                    <div>
                      <code style={{ fontSize: '0.72rem', fontWeight: 700, color: L.accent }}>{field}</code>
                      <span style={{ fontSize: '0.65rem', color: L.textMuted, marginLeft: '0.3rem' }}>({type})</span>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: L.textMuted, textAlign: 'right', lineHeight: 1.4 }}>{aliases}</span>
                  </div>
                ))}
              </div>
              <div style={{ margin: '0.75rem 1rem 1rem', borderRadius: '8px', backgroundColor: L.bg, border: `1px solid ${L.border}`, overflow: 'hidden' }}>
                <div style={{ padding: '0.3rem 0.65rem', borderBottom: `1px solid ${L.border}`, backgroundColor: '#f1f5f9' }}>
                  <span style={{ fontSize: '0.63rem', color: L.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sample CSV</span>
                </div>
                <pre style={{ margin: 0, padding: '0.6rem 0.75rem', fontSize: '0.63rem', lineHeight: 1.7, color: L.accent, overflowX: 'auto', fontFamily: 'monospace' }}>{`job_id,start_time,end_time,cpu_usage,memory_usage,priority,error_rate
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
        <div style={{ marginTop: '1.25rem', borderRadius: '14px', padding: '1rem 1.25rem', border: `1px solid ${L.successBorder}`, backgroundColor: L.successBg }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <CheckCircle size={18} style={{ color: L.success }} />
            <span style={{ fontWeight: 600, color: L.success }}>Upload Successful</span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: uploadResult.columnMap ? '0.75rem' : 0 }}>
            <div>
              <span style={{ color: L.textMuted, fontSize: '0.75rem' }}>Batch ID</span>
              <div><code style={{ backgroundColor: 'rgba(22,163,74,0.1)', padding: '0.1rem 0.45rem', borderRadius: '6px', fontSize: '0.75rem', color: L.success }}>{uploadResult.batchId}</code></div>
            </div>
            <div>
              <span style={{ color: L.textMuted, fontSize: '0.75rem' }}>Workloads parsed</span>
              <div style={{ color: L.text, fontWeight: 700, fontSize: '1rem' }}>{uploadResult.count}</div>
            </div>
            {uploadResult.skipped > 0 && (
              <div>
                <span style={{ color: L.textMuted, fontSize: '0.75rem' }}>Rows skipped</span>
                <div style={{ color: '#d97706', fontWeight: 700, fontSize: '1rem' }}>{uploadResult.skipped}</div>
              </div>
            )}
          </div>
          {uploadResult.columnMap && Object.keys(uploadResult.columnMap).length > 0 && (
            <div style={{ borderTop: `1px solid ${L.successBorder}`, paddingTop: '0.75rem' }}>
              <p style={{ color: L.textMuted, fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Column Mapping</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.3rem' }}>
                {Object.entries(uploadResult.columnMap).map(([field, mapped]) => {
                  const isMissing = String(mapped).startsWith('(missing');
                  return (
                    <div key={field} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem' }}>
                      <code style={{ color: L.success, fontWeight: 600 }}>{field}</code>
                      <span style={{ color: L.textMuted }}>←</span>
                      <span style={{ color: isMissing ? '#d97706' : L.textSub, fontStyle: isMissing ? 'italic' : 'normal' }}>{mapped}</span>
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
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.4rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem', border: 'none', cursor: (!file || uploading || !!uploadResult) ? 'not-allowed' : 'pointer', backgroundColor: L.accent, color: '#fff', opacity: (!file || uploading || !!uploadResult) ? 0.45 : 1, boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>
          {uploading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={15} />}
          Upload File
        </button>
        {uploadResult && (
          <button onClick={handleSchedule} disabled={scheduling}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.4rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.875rem', border: 'none', cursor: scheduling ? 'not-allowed' : 'pointer', backgroundColor: '#059669', color: '#fff', opacity: scheduling ? 0.5 : 1, boxShadow: '0 2px 8px rgba(5,150,105,0.25)' }}>
            {scheduling ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={15} />}
            Run Scheduler
          </button>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
