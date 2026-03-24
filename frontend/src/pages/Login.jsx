import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import toast from 'react-hot-toast';
import {
  Zap, Phone, Mail, KeyRound, ArrowRight,
  Loader2, ShieldCheck, AlertTriangle, Clock, ChevronLeft
} from 'lucide-react';

const CHANNEL = { MOBILE: 'mobile', EMAIL: 'email' };

// OTP countdown timer
function OtpTimer({ seconds, onExpire }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) { onExpire(); return; }
    const t = setTimeout(() => setLeft(l => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);
  const color = left <= 30 ? 'text-red-400' : 'text-emerald-400';
  return (
    <span className={`flex items-center gap-1 text-xs font-medium ${color}`}>
      <Clock size={12} /> {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}
    </span>
  );
}

export default function Login() {
  const [channel, setChannel] = useState(CHANNEL.MOBILE);
  const [step, setStep] = useState('input');   // 'input' | 'otp'
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [adminName, setAdminName] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpExpired, setOtpExpired] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const clearError = () => setError('');

  const formatMobile = (val) => {
    const digits = val.replace(/\D/g, '');
    return digits.slice(0, 10);
  };

  // ─── STEP 1: Send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    clearError();
    if (!identifier) return setError('Please enter your ' + (channel === CHANNEL.MOBILE ? 'mobile number' : 'email address'));

    setLoading(true);
    try {
      const payload = {
        channel,
        identifier: channel === CHANNEL.MOBILE ? `+91${identifier}` : identifier,
      };
      const res = await api.post('/auth/start', payload);
      setAdminName(res.data.adminName);
      setDemoOtp(res.data.demoOtp || '');
      setOtpExpired(false);
      setOtp('');
      setStep('otp');
      toast.success(`OTP sent to your ${channel === CHANNEL.MOBILE ? 'mobile' : 'email'}!`);
    } catch (err) {
      const msg = err.response?.data?.error
        || (err.code === 'ERR_NETWORK' || !err.response ? 'Cannot connect to server. Make sure the backend is running on port 5000.' : 'Failed to send OTP. Try again.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ─── STEP 2: Verify OTP ────────────────────────────────────────────────────
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
      const msg = err.response?.data?.error
        || (err.code === 'ERR_NETWORK' || !err.response ? 'Cannot connect to server. Make sure the backend is running on port 5000.' : 'Invalid OTP. Try again.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('input');
    setOtp('');
    setDemoOtp('');
    clearError();
  };

  const isAccessDenied = error.toLowerCase().includes('access denied') || error.toLowerCase().includes('not authorized');

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 relative overflow-hidden">

      {/* Background grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-cyan-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 mb-10 group">
        <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/50 transition-shadow">
          <Zap size={20} className="text-black" />
        </div>
        <span className="text-white font-bold text-xl tracking-tight">CloudOpt</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-white/10">
            <div className="flex items-center gap-3 mb-1">
              <ShieldCheck size={20} className="text-blue-400" />
              <h1 className="text-white font-bold text-xl">
                {step === 'input' ? 'Admin Login' : 'Verify OTP'}
              </h1>
            </div>
            <p className="text-slate-400 text-sm">
              {step === 'input'
                ? 'Restricted to authorized data center administrators only.'
                : `OTP sent to ${channel === CHANNEL.MOBILE ? `+91 ${identifier}` : identifier}`}
            </p>
          </div>

          <div className="px-8 py-7">
            {step === 'input' && (
              <>
                {/* Channel toggle */}
                <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 mb-6">
                  {[
                    { key: CHANNEL.MOBILE, label: 'Mobile Number', icon: Phone },
                    { key: CHANNEL.EMAIL, label: 'Email Address', icon: Mail },
                  ].map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => { setChannel(key); setIdentifier(''); clearError(); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        channel === key
                          ? 'bg-cyan-500 text-black font-semibold shadow-lg shadow-cyan-500/20'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon size={15} />
                      {label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {channel === CHANNEL.MOBILE ? 'Mobile Number' : 'Email Address'}
                    </label>
                    {channel === CHANNEL.MOBILE ? (
                      <div className="flex">
                        <span className="flex items-center px-3.5 bg-white/5 border border-r-0 border-white/10 rounded-l-xl text-slate-400 text-sm font-medium">
                          +91
                        </span>
                        <input
                          type="tel"
                          value={identifier}
                          onChange={e => { setIdentifier(formatMobile(e.target.value)); clearError(); }}
                          placeholder="98765 43210"
                          className="flex-1 bg-white/5 border border-white/10 rounded-r-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                          maxLength={10}
                          required
                        />
                      </div>
                    ) : (
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="email"
                          value={identifier}
                          onChange={e => { setIdentifier(e.target.value); clearError(); }}
                          placeholder="admin@datacenter.com"
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Error */}
                  {error && (
                    <div className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-sm ${
                      isAccessDenied
                        ? 'bg-red-500/10 border-red-500/30 text-red-300'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    }`}>
                      <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? <Loader2 size={18} className="animate-spin" />
                      : <><span>Send OTP</span><ArrowRight size={16} /></>
                    }
                  </button>
                </form>

                {/* Demo hint */}
                <div className="mt-5 p-3.5 bg-white/3 border border-white/8 rounded-xl">
                  <p className="text-xs text-slate-500 font-medium mb-1.5">Demo credentials:</p>
                  <div className="space-y-1 text-xs text-slate-400">
                    <p>📱 Mobile: <code className="text-blue-400">9999999999</code></p>
                    <p>📧 Email: <code className="text-blue-400">demo@cloudopt.io</code></p>
                  </div>
                </div>
              </>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                {/* Admin greeting */}
                {adminName && (
                  <div className="flex items-center gap-3 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <ShieldCheck size={18} className="text-emerald-400 flex-shrink-0" />
                    <div>
                      <p className="text-emerald-300 text-sm font-medium">Access Approved</p>
                      <p className="text-emerald-400/70 text-xs">Welcome, {adminName}</p>
                    </div>
                  </div>
                )}

                {/* Demo OTP box */}
                {demoOtp && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                    <p className="text-amber-400 text-xs font-medium mb-2">DEMO MODE — Your OTP</p>
                    <p className="text-3xl font-bold tracking-[0.3em] text-white">{demoOtp}</p>
                    <p className="text-amber-400/60 text-xs mt-2">Configure Twilio/SMTP for real delivery</p>
                  </div>
                )}

                {/* OTP input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300">Enter 6-digit OTP</label>
                    {!otpExpired
                      ? <OtpTimer seconds={120} onExpire={() => setOtpExpired(true)} />
                      : <span className="text-xs text-red-400 font-medium">Expired</span>
                    }
                  </div>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={otp}
                      onChange={e => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); clearError(); }}
                      placeholder="• • • • • •"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-center text-2xl font-bold tracking-[0.4em]"
                      maxLength={6}
                      required
                      disabled={otpExpired}
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl border bg-red-500/10 border-red-500/30 text-red-300 text-sm">
                    <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || otpExpired || otp.length !== 6}
                  className="w-full flex items-center justify-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading
                    ? <Loader2 size={18} className="animate-spin" />
                    : <><ShieldCheck size={16} /><span>Verify & Login</span></>
                  }
                </button>

                <div className="flex items-center justify-between">
                  <button type="button" onClick={handleBack} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors">
                    <ChevronLeft size={15} /> Change {channel === CHANNEL.MOBILE ? 'number' : 'email'}
                  </button>
                  {otpExpired && (
                    <button type="button" onClick={handleBack} className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors">
                      Resend OTP
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-slate-600 text-xs mt-6">
          🔒 Restricted system — Unauthorized access is prohibited
        </p>
      </div>
    </div>
  );
}
