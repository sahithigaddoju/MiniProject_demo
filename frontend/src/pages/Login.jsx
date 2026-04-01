import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import {
  Zap, Phone, Mail, KeyRound, ArrowRight,
  Loader2, ShieldCheck, AlertTriangle, Clock, ChevronLeft
} from 'lucide-react';

const CHANNEL = { MOBILE: 'mobile', EMAIL: 'email' };

// ── Light theme palette (scoped to this page only) ────────────────────────────
const L = {
  bg:           '#ffffff',
  cardBg:       '#ffffff',
  cardBorder:   '#e2e8f0',
  inputBg:      '#f8fafc',
  inputBorder:  '#cbd5e1',
  inputFocus:   '#06b6d4',
  text:         '#0f172a',
  textSub:      '#475569',
  textMuted:    '#94a3b8',
  accent:       '#06b6d4',
  toggleBg:     '#f1f5f9',
  toggleBorder: '#e2e8f0',
  demoBg:       '#f8fafc',
  demoBorder:   '#e2e8f0',
  divider:      '#e2e8f0',
};

// OTP countdown timer — logic unchanged, colors updated
function OtpTimer({ seconds, onExpire }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) { onExpire(); return; }
    const t = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  const color = left <= 30 ? '#ef4444' : '#10b981';
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600, color }}>
      <Clock size={12} /> {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
    </span>
  );
}

export default function Login() {
  const [channel, setChannel] = useState(CHANNEL.MOBILE);
  const [step, setStep]       = useState('input');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp]         = useState('');
  const [adminName, setAdminName] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [otpExpired, setOtpExpired] = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();

  // Override body to light for this page only
  useEffect(() => {
    const prevBg    = document.body.style.backgroundColor;
    const prevColor = document.body.style.color;
    document.body.style.backgroundColor = '#ffffff';
    document.body.style.color = '#0f172a';
    return () => {
      document.body.style.backgroundColor = prevBg;
      document.body.style.color = prevColor;
    };
  }, []);

  // Show session expired message if redirected from a 401
  useEffect(() => {
    const reason = sessionStorage.getItem('auth_redirect_reason');
    if (reason) {
      setError('Your session expired. Please login again.');
      sessionStorage.removeItem('auth_redirect_reason');
    }
  }, []);

  const clearError = () => setError('');
  const formatMobile = (val) => val.replace(/\D/g, '').slice(0, 10);

  // ── Send OTP ────────────────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    clearError();
    if (!identifier) return setError('Please enter your ' + (channel === CHANNEL.MOBILE ? 'mobile number' : 'email address'));
    setLoading(true);
    try {
      const res = await api.post('/auth/start', {
        channel,
        identifier: channel === CHANNEL.MOBILE ? `+91${identifier}` : identifier,
      });
      setAdminName(res.data.adminName);
      setDemoOtp(res.data.demoOtp || '');
      setOtpExpired(false);
      setOtp('');
      setStep('otp');
      toast.success(`OTP sent to your ${channel === CHANNEL.MOBILE ? 'mobile' : 'email'}!`);
    } catch (err) {
      setError(err.response?.data?.error
        || (err.code === 'ERR_NETWORK' || !err.response
          ? 'Cannot connect to server. Make sure the backend is running on port 5000.'
          : 'Failed to send OTP. Try again.'));
    } finally { setLoading(false); }
  };

  // ── Verify OTP ──────────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    clearError();
    if (otp.length !== 6) return setError('Enter the 6-digit OTP');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify', {
        channel,
        identifier: channel === CHANNEL.MOBILE ? `+91${identifier}` : identifier,
        otp,
      });
      login(res.data.token, res.data.admin);
      toast.success(`Welcome, ${res.data.admin.name}!`);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.error
        || (err.code === 'ERR_NETWORK' || !err.response
          ? 'Cannot connect to server. Make sure the backend is running on port 5000.'
          : 'Invalid OTP. Try again.'));
    } finally { setLoading(false); }
  };

  const handleBack = () => { setStep('input'); setOtp(''); setDemoOtp(''); clearError(); };
  const isAccessDenied = error.toLowerCase().includes('access denied') || error.toLowerCase().includes('not authorized');

  // ── Shared input style ──────────────────────────────────────────────────────
  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    backgroundColor: L.inputBg, border: `1px solid ${L.inputBorder}`,
    borderRadius: 12, padding: '0.75rem 1rem',
    color: L.text, fontSize: '0.875rem',
    outline: 'none', transition: 'border-color 0.15s',
  };

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: L.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '1rem', position: 'relative', overflow: 'hidden',
    }}>
      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)`,
        backgroundSize: '60px 60px', opacity: 0.4,
      }} />
      {/* Soft glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 500, height: 300, backgroundColor: 'rgba(6,182,212,0.06)',
        borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none',
      }} />

      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2.5rem', textDecoration: 'none' }}>
        <div style={{ width: 40, height: 40, backgroundColor: L.accent, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(6,182,212,0.3)' }}>
          <Zap size={20} color="#fff" />
        </div>
        <span style={{ fontWeight: 700, fontSize: '1.25rem', color: L.text, letterSpacing: '-0.02em' }}>CloudOpt</span>
      </Link>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 448, position: 'relative', zIndex: 1 }}>
        <div style={{ backgroundColor: L.cardBg, border: `1px solid ${L.cardBorder}`, borderRadius: 20, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '2rem 2rem 1.5rem', borderBottom: `1px solid ${L.divider}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
              <ShieldCheck size={20} color="#3b82f6" />
              <h1 style={{ color: L.text, fontWeight: 700, fontSize: '1.25rem', margin: 0 }}>
                {step === 'input' ? 'Admin Login' : 'Verify OTP'}
              </h1>
            </div>
            <p style={{ color: L.textSub, fontSize: '0.875rem', margin: 0 }}>
              {step === 'input'
                ? 'Restricted to authorized data center administrators only.'
                : `OTP sent to ${channel === CHANNEL.MOBILE ? `+91 ${identifier}` : identifier}`}
            </p>
          </div>

          <div style={{ padding: '1.75rem 2rem' }}>
            {step === 'input' && (
              <>
                {/* Channel toggle */}
                <div style={{ display: 'flex', backgroundColor: L.toggleBg, border: `1px solid ${L.toggleBorder}`, borderRadius: 12, padding: 4, marginBottom: '1.5rem' }}>
                  {[
                    { key: CHANNEL.MOBILE, label: 'Mobile Number', icon: Phone },
                    { key: CHANNEL.EMAIL,  label: 'Email Address',  icon: Mail  },
                  ].map(({ key, label, icon: Icon }) => (
                    <button key={key}
                      onClick={() => { setChannel(key); setIdentifier(''); clearError(); }}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                        padding: '0.625rem', borderRadius: 9, fontSize: '0.875rem', fontWeight: 500,
                        border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                        backgroundColor: channel === key ? L.accent : 'transparent',
                        color: channel === key ? '#fff' : L.textSub,
                        boxShadow: channel === key ? '0 2px 8px rgba(6,182,212,0.3)' : 'none',
                      }}>
                      <Icon size={15} /> {label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: L.textSub, marginBottom: '0.5rem' }}>
                      {channel === CHANNEL.MOBILE ? 'Mobile Number' : 'Email Address'}
                    </label>
                    {channel === CHANNEL.MOBILE ? (
                      <div style={{ display: 'flex' }}>
                        <span style={{ display: 'flex', alignItems: 'center', padding: '0 0.875rem', backgroundColor: L.toggleBg, border: `1px solid ${L.inputBorder}`, borderRight: 'none', borderRadius: '12px 0 0 12px', color: L.textSub, fontSize: '0.875rem', fontWeight: 500 }}>
                          +91
                        </span>
                        <input type="tel" value={identifier}
                          onChange={e => { setIdentifier(formatMobile(e.target.value)); clearError(); }}
                          placeholder="98765 43210"
                          style={{ ...inputStyle, borderRadius: '0 12px 12px 0', flex: 1 }}
                          maxLength={10} required
                        />
                      </div>
                    ) : (
                      <div style={{ position: 'relative' }}>
                        <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: L.textMuted }} />
                        <input type="email" value={identifier}
                          onChange={e => { setIdentifier(e.target.value); clearError(); }}
                          placeholder="admin@datacenter.com"
                          style={{ ...inputStyle, paddingLeft: '2.5rem' }}
                          required
                        />
                      </div>
                    )}
                  </div>

                  {error && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', padding: '0.875rem', borderRadius: 12, border: `1px solid ${isAccessDenied ? '#fca5a5' : '#fcd34d'}`, backgroundColor: isAccessDenied ? '#fef2f2' : '#fffbeb', color: isAccessDenied ? '#dc2626' : '#92400e', fontSize: '0.875rem' }}>
                      <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span>{error}</span>
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: L.accent, color: '#fff', fontWeight: 600, padding: '0.75rem', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.875rem', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 16px rgba(6,182,212,0.3)', transition: 'all 0.15s' }}>
                    {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <><span>Send OTP</span><ArrowRight size={16} /></>}
                  </button>
                </form>

                {/* Demo hint */}
                <div style={{ marginTop: '1.25rem', padding: '0.875rem', backgroundColor: L.demoBg, border: `1px solid ${L.demoBorder}`, borderRadius: 12 }}>
                  <p style={{ fontSize: '0.75rem', color: L.textSub, fontWeight: 600, margin: '0 0 0.375rem' }}>Demo credentials:</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', color: L.textSub }}>
                    <p style={{ margin: 0 }}>📱 Mobile: <code style={{ color: '#2563eb' }}>9999999999</code></p>
                    <p style={{ margin: 0 }}>📧 Email: <code style={{ color: '#2563eb' }}>demo@cloudopt.io</code></p>
                  </div>
                </div>
              </>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {adminName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12 }}>
                    <ShieldCheck size={18} color="#16a34a" style={{ flexShrink: 0 }} />
                    <div>
                      <p style={{ color: '#15803d', fontSize: '0.875rem', fontWeight: 600, margin: 0 }}>Access Approved</p>
                      <p style={{ color: '#16a34a', fontSize: '0.75rem', margin: 0 }}>Welcome, {adminName}</p>
                    </div>
                  </div>
                )}

                {demoOtp && (
                  <div style={{ padding: '1rem', backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, textAlign: 'center' }}>
                    <p style={{ color: '#92400e', fontSize: '0.75rem', fontWeight: 600, margin: '0 0 0.5rem' }}>DEMO MODE — Your OTP</p>
                    <p style={{ fontSize: '1.875rem', fontWeight: 700, letterSpacing: '0.3em', color: L.text, margin: '0 0 0.5rem' }}>{demoOtp}</p>
                    <p style={{ color: '#b45309', fontSize: '0.75rem', margin: 0 }}>Configure Twilio/SMTP for real delivery</p>
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 500, color: L.textSub }}>Enter 6-digit OTP</label>
                    {!otpExpired
                      ? <OtpTimer seconds={120} onExpire={() => setOtpExpired(true)} />
                      : <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>Expired</span>
                    }
                  </div>
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: L.textMuted }} />
                    <input type="text" value={otp}
                      onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); clearError(); }}
                      placeholder="• • • • • •"
                      style={{ ...inputStyle, paddingLeft: '2.5rem', textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.4em', opacity: otpExpired ? 0.5 : 1 }}
                      maxLength={6} required disabled={otpExpired}
                    />
                  </div>
                </div>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', padding: '0.875rem', borderRadius: 12, border: '1px solid #fca5a5', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '0.875rem' }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>{error}</span>
                  </div>
                )}

                <button type="submit" disabled={loading || otpExpired || otp.length !== 6}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', backgroundColor: L.accent, color: '#fff', fontWeight: 600, padding: '0.75rem', borderRadius: 12, border: 'none', cursor: (loading || otpExpired || otp.length !== 6) ? 'not-allowed' : 'pointer', fontSize: '0.875rem', opacity: (loading || otpExpired || otp.length !== 6) ? 0.5 : 1, boxShadow: '0 4px 16px rgba(6,182,212,0.3)', transition: 'all 0.15s' }}>
                  {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <><ShieldCheck size={16} /><span>Verify &amp; Login</span></>}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button type="button" onClick={handleBack}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: L.textSub, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>
                    <ChevronLeft size={15} /> Change {channel === CHANNEL.MOBILE ? 'number' : 'email'}
                  </button>
                  {otpExpired && (
                    <button type="button" onClick={handleBack}
                      style={{ color: L.accent, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>
                      Resend OTP
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>

        <p style={{ textAlign: 'center', color: L.textMuted, fontSize: '0.75rem', marginTop: '1.5rem' }}>
          🔒 Restricted system — Unauthorized access is prohibited
        </p>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
