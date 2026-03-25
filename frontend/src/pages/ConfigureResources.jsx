import { useEffect, useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import { Server, Cpu, MemoryStick, Save, Loader2, AlertCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const SERVER_MIN = 100;
const SERVER_MAX = 5000;
const SERVER_DEFAULT = 500;

export default function ConfigureResources() {
  const { tokens } = useTheme();
  const [form, setForm]       = useState(null);   // null until fetched — prevents stale defaults
  const [saved, setSaved]     = useState(null);   // last confirmed saved values
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get('/resources')
      .then(res => {
        setForm(res.data);
        setSaved(res.data);   // track what's actually persisted
      })
      .catch(() => toast.error('Failed to load current resource configuration'))
      .finally(() => setLoading(false));
  }, []);

  const validate = (f) => {
    const e = {};
    if (f.servers < SERVER_MIN) e.servers = `Minimum ${SERVER_MIN} servers required`;
    if (f.servers > SERVER_MAX) e.servers = `Maximum limit is ${SERVER_MAX} servers`;
    if (f.cpuPerServer < 4)    e.cpuPerServer = 'Minimum 4 cores required';
    if (f.cpuPerServer > 64)   e.cpuPerServer = 'Maximum 64 cores allowed';
    if (f.memoryPerServer < 8) e.memoryPerServer = 'Minimum 8 GB required';
    if (f.memoryPerServer > 256) e.memoryPerServer = 'Maximum 256 GB allowed';
    return e;
  };

  const set = (key, val) => {
    const next = { ...form, [key]: Number(val) };
    setForm(next);
    setErrors(validate(next));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form) return;
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const res = await api.post('/resources', form);
      setSaved(res.data.resources);   // update saved snapshot
      toast.success('Resources saved — next scheduler run will use new capacity');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setSaving(false); }
  };

  const totalCpu = (form?.servers ?? 0) * (form?.cpuPerServer ?? 0);
  const totalMem = (form?.servers ?? 0) * (form?.memoryPerServer ?? 0);
  const hasErrors = Object.keys(errors).length > 0;
  const isDirty = saved && form && (
    form.servers !== saved.servers ||
    form.cpuPerServer !== saved.cpuPerServer ||
    form.memoryPerServer !== saved.memoryPerServer
  );

  const inputStyle = (hasErr) => ({
    width: '100%', padding: '0.6rem 0.9rem', borderRadius: '10px',
    outline: 'none', fontSize: '0.875rem', boxSizing: 'border-box',
    ...tokens.input,
    border: hasErr ? '1px solid #ef4444' : tokens.input.border,
  });

  const sliderStyle = {
    width: '100%', accentColor: tokens.accent, cursor: 'pointer', height: '4px',
  };

  const btn = {
    backgroundColor: tokens.accent,
    color: tokens.accent === '#22d3ee' ? '#000' : '#fff',
    fontWeight: 600, padding: '0.6rem 1.4rem', borderRadius: '10px',
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
    border: 'none', cursor: hasErrors || saving ? 'not-allowed' : 'pointer',
    opacity: hasErrors || saving ? 0.55 : 1, transition: 'all 0.2s',
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '16rem' }}>
      <Loader2 size={32} style={{ color: tokens.accent, animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!form) return (
    <div style={{ color: tokens.textMuted, textAlign: 'center', padding: '4rem' }}>
      Failed to load resource configuration. Please refresh.
    </div>
  );

  return (
    <div style={{ maxWidth: '660px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ color: tokens.textPrimary, fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Configure Resources</h1>
        <p style={{ color: tokens.textSecondary, fontSize: '0.875rem', marginTop: '0.3rem' }}>
          Define your data center capacity. Changes take effect on the next scheduler run.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* ── Number of Servers (slider + number) ── */}
        <div style={{ ...tokens.cardSm }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: tokens.textSecondary, fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            <Server size={15} style={{ color: tokens.accent }} />
            Number of Servers
          </label>

          {/* Slider */}
          <input
            type="range"
            min={SERVER_MIN} max={SERVER_MAX} step={50}
            value={form.servers}
            onChange={e => set('servers', e.target.value)}
            style={sliderStyle}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: tokens.textMuted, margin: '0.3rem 0 0.75rem' }}>
            <span>{SERVER_MIN}</span>
            <span style={{ color: tokens.accent, fontWeight: 700, fontSize: '0.85rem' }}>{form.servers.toLocaleString()} servers</span>
            <span>{SERVER_MAX.toLocaleString()}</span>
          </div>

          {/* Number input for precise entry */}
          <input
            type="number"
            min={SERVER_MIN} max={SERVER_MAX} step={50}
            value={form.servers}
            onChange={e => set('servers', e.target.value)}
            style={inputStyle(!!errors.servers)}
          />
          {errors.servers && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ef4444', fontSize: '0.78rem', marginTop: '0.4rem' }}>
              <AlertCircle size={13} /> {errors.servers}
            </div>
          )}
        </div>

        {/* ── CPU + Memory per server ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {[
            { key: 'cpuPerServer',    label: 'CPU Cores / Server',  icon: Cpu,         min: 4,  max: 64,  step: 4,  placeholder: '16', unit: 'cores' },
            { key: 'memoryPerServer', label: 'Memory / Server (GB)', icon: MemoryStick, min: 8,  max: 256, step: 8,  placeholder: '64', unit: 'GB'    },
          ].map(({ key, label, icon: Icon, min, max, step, placeholder, unit }) => (
            <div key={key} style={{ ...tokens.cardSm }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: tokens.textSecondary, fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                <Icon size={15} style={{ color: tokens.accent }} /> {label}
              </label>
              <input
                type="range" min={min} max={max} step={step}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                style={sliderStyle}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: tokens.textMuted, margin: '0.3rem 0 0.75rem' }}>
                <span>{min}</span>
                <span style={{ color: tokens.accent, fontWeight: 700, fontSize: '0.85rem' }}>{form[key]} {unit}</span>
                <span>{max}</span>
              </div>
              <input
                type="number" min={min} max={max} step={step}
                value={form[key]}
                onChange={e => set(key, e.target.value)}
                style={inputStyle(!!errors[key])}
                placeholder={placeholder}
                required
              />
              {errors[key] && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ef4444', fontSize: '0.78rem', marginTop: '0.4rem' }}>
                  <AlertCircle size={13} /> {errors[key]}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Capacity summary ── */}
        {totalCpu > 0 && (
          <div style={{
            backgroundColor: tokens.accentBg,
            border: `1px solid ${tokens.accentBorder}`,
            borderRadius: '14px', padding: '1.1rem',
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', textAlign: 'center',
          }}>
            {[
              ['Servers',       form.servers.toLocaleString()],
              ['Total CPU',     `${totalCpu.toLocaleString()} cores`],
              ['Total Memory',  `${(totalMem / 1024).toFixed(1)} TB`],
              ['Capacity Tier', form.servers >= 2000 ? 'Enterprise' : form.servers >= 500 ? 'Standard' : 'Starter'],
            ].map(([lbl, val]) => (
              <div key={lbl}>
                <div style={{ color: tokens.accent, fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 }}>{val}</div>
                <div style={{ color: tokens.textMuted, fontSize: '0.7rem', marginTop: '0.25rem' }}>{lbl}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button type="submit" disabled={hasErrors || saving} style={btn}>
            {saving
              ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
              : <Save size={15} />}
            Save Configuration
          </button>
          {isDirty && (
            <button
              type="button"
              onClick={() => { setForm(saved); setErrors({}); }}
              style={{
                padding: '0.6rem 1.1rem', borderRadius: '10px', fontWeight: 600,
                fontSize: '0.875rem', border: `1px solid ${tokens.divider}`,
                backgroundColor: 'transparent', color: tokens.textSecondary,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              Reset to Saved
            </button>
          )}
        </div>
      </form>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
