import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowRight, ChevronDown } from 'lucide-react';

// ── All styles are inline / light-only — no global theme classes used ─────────

const L = {
  bg:          '#ffffff',
  bgAlt:       '#f8fafc',
  border:      '#e2e8f0',
  text:        '#0f172a',
  textSub:     '#475569',
  textMuted:   '#94a3b8',
  accent:      '#06b6d4',   // cyan-500
  accentHover: '#22d3ee',   // cyan-400
  accentBg:    'rgba(6,182,212,0.08)',
  accentBorder:'rgba(6,182,212,0.3)',
  cardBg:      '#f1f5f9',
  cardBorder:  '#e2e8f0',
  cardHover:   '#e8f4f8',
};

function Navbar() {
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      backgroundColor: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${L.border}`,
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ width: 32, height: 32, backgroundColor: L.accent, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={16} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: L.text, letterSpacing: '-0.02em' }}>CloudOpt</span>
        </div>

        {/* Center nav */}
        <div style={{ display: 'flex', gap: '2rem' }}>
          {['Features', 'How It Works', 'Scale'].map(link => (
            <a key={link} href={`#${link.toLowerCase().replace(/ /g, '-')}`}
              style={{ fontSize: '0.875rem', color: L.textSub, textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = L.text}
              onMouseLeave={e => e.target.style.color = L.textSub}>
              {link}
            </a>
          ))}
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/login" style={{ fontSize: '0.875rem', fontWeight: 500, color: L.textSub, textDecoration: 'none', padding: '0.375rem 0.75rem' }}>
            Sign In
          </Link>
          <Link to="/login" style={{
            fontSize: '0.875rem', fontWeight: 600, backgroundColor: L.accent, color: '#fff',
            padding: '0.5rem 1.25rem', borderRadius: 8, textDecoration: 'none',
            boxShadow: '0 2px 12px rgba(6,182,212,0.3)', transition: 'all 0.15s',
          }}>
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: '6rem 1.5rem 4rem', position: 'relative', overflow: 'hidden',
      backgroundColor: L.bg,
    }}>
      {/* Subtle grid */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `linear-gradient(${L.border} 1px, transparent 1px), linear-gradient(90deg, ${L.border} 1px, transparent 1px)`,
        backgroundSize: '60px 60px', opacity: 0.5,
      }} />
      {/* Soft glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 600, height: 400, backgroundColor: 'rgba(6,182,212,0.06)',
        borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 768, margin: '0 auto' }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          border: `1px solid ${L.accentBorder}`, backgroundColor: L.accentBg,
          color: L.accent, fontSize: '0.7rem', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          borderRadius: 9999, padding: '0.375rem 1rem', marginBottom: '2rem',
        }}>
          <Zap size={11} /> Energy-Aware Cloud Scheduler
        </div>

        <h1 style={{ fontSize: 'clamp(2.5rem,6vw,4.5rem)', fontWeight: 800, lineHeight: 1.1, color: L.text, margin: '0 0 0.5rem', letterSpacing: '-0.03em' }}>
          Schedule smarter.
        </h1>
        <h1 style={{ fontSize: 'clamp(2.5rem,6vw,4.5rem)', fontWeight: 800, lineHeight: 1.1, color: L.accent, margin: '0 0 2rem', letterSpacing: '-0.03em' }}>
          Save energy.
        </h1>

        <p style={{ color: L.textSub, fontSize: '1.1rem', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 2.5rem' }}>
          CloudOpt is a full-stack data center scheduling platform that allocates
          cloud workloads using a multi-dimensional knapsack algorithm —
          minimizing energy costs while maximizing revenue.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: L.accent, color: '#fff', fontWeight: 600,
            padding: '0.875rem 2rem', borderRadius: 12, textDecoration: 'none',
            fontSize: '0.875rem', boxShadow: '0 4px 20px rgba(6,182,212,0.35)',
          }}>
            Open Dashboard <ArrowRight size={16} />
          </Link>
          <a href="#features" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: L.cardBg, color: L.text, fontWeight: 600,
            padding: '0.875rem 2rem', borderRadius: 12, textDecoration: 'none',
            fontSize: '0.875rem', border: `1px solid ${L.border}`,
          }}>
            Explore Features <ChevronDown size={16} />
          </a>
        </div>
      </div>

      {/* Stats */}
      <div style={{ position: 'relative', zIndex: 1, marginTop: '5rem', display: 'flex', gap: '4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {[['50K+', 'Max Servers'], ['< 1ms', 'Schedule Time'], ['JWT', 'Auth Secured']].map(([val, label]) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.875rem', fontWeight: 800, color: L.text }}>{val}</div>
            <div style={{ color: L.textMuted, fontSize: '0.875rem', marginTop: '0.25rem' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', color: L.textMuted }}>
        <ChevronDown size={20} style={{ animation: 'bounce 1.5s infinite' }} />
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: '⚡', title: 'Energy Optimization', desc: 'Reduce power consumption by intelligently scheduling workloads across servers using energy-aware algorithms.' },
    { icon: '💰', title: 'Dynamic Pricing', desc: 'Automatically compute workload pricing based on resource usage, energy cost, and scheduling priority.' },
    { icon: '📊', title: 'Smart Scheduling', desc: 'Multi-dimensional knapsack model ensures maximum resource utilization with minimal waste.' },
    { icon: '🛡️', title: 'Emergency Preemption', desc: 'Critical workloads are prioritized and can preempt lower-priority tasks in real time.' },
    { icon: '🕐', title: 'Real-time Tracking', desc: 'Monitor workload status, server assignments, and scheduling outcomes live.' },
    { icon: '📈', title: 'Revenue Analytics', desc: 'Track revenue, energy savings, and workload acceptance rates from a unified dashboard.' },
  ];
  return (
    <section id="features" style={{ backgroundColor: L.bgAlt, padding: '6rem 1.5rem', borderTop: `1px solid ${L.border}` }}>
      <div style={{ maxWidth: 1152, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: L.text, margin: '0 0 0.75rem' }}>Everything You Need</h2>
          <p style={{ color: L.textSub, maxWidth: 480, margin: '0 auto' }}>A complete platform for energy-aware workload management in modern data centers.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {items.map(({ icon, title, desc }) => (
            <div key={title} style={{
              backgroundColor: L.bg, border: `1px solid ${L.cardBorder}`,
              borderRadius: 16, padding: '1.5rem',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = L.accentBorder; e.currentTarget.style.boxShadow = '0 4px 20px rgba(6,182,212,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = L.cardBorder; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{icon}</div>
              <h3 style={{ fontWeight: 600, color: L.text, marginBottom: '0.5rem', fontSize: '0.9rem' }}>{title}</h3>
              <p style={{ color: L.textSub, fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: '01', title: 'Configure Servers', desc: 'Set up your data center resources — number of servers, CPU, and memory capacity.' },
    { n: '02', title: 'Upload Workloads', desc: 'Upload workload definitions via CSV or JSON. Mark urgent tasks as emergency.' },
    { n: '03', title: 'Run Scheduler', desc: 'The system applies the knapsack algorithm to optimally assign workloads to servers.' },
    { n: '04', title: 'View Results', desc: 'Review allocations, pricing, energy savings, and download output reports.' },
  ];
  return (
    <section id="how-it-works" style={{ backgroundColor: L.bg, padding: '6rem 1.5rem', borderTop: `1px solid ${L.border}` }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: L.text, margin: '0 0 0.75rem' }}>How It Works</h2>
          <p style={{ color: L.textSub }}>Four simple steps to optimized workload scheduling.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '2rem' }}>
          {steps.map(({ n, title, desc }) => (
            <div key={n} style={{ textAlign: 'center' }}>
              <div style={{
                width: 56, height: 56, backgroundColor: L.accentBg,
                border: `1px solid ${L.accentBorder}`, color: L.accent,
                borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.1rem', fontWeight: 700, margin: '0 auto 1rem',
              }}>{n}</div>
              <h3 style={{ fontWeight: 600, color: L.text, marginBottom: '0.5rem', fontSize: '0.9rem' }}>{title}</h3>
              <p style={{ color: L.textSub, fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Scale() {
  return (
    <section id="scale" style={{ backgroundColor: L.bgAlt, padding: '5rem 1.5rem', borderTop: `1px solid ${L.border}` }}>
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <div style={{
          background: `linear-gradient(135deg, ${L.accentBg}, ${L.bgAlt})`,
          border: `1px solid ${L.accentBorder}`,
          borderRadius: 24, padding: '3rem',
        }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 700, color: L.text, margin: '0 0 1rem' }}>Ready to Optimize?</h2>
          <p style={{ color: L.textSub, marginBottom: '2rem' }}>Join administrators already saving energy and maximizing revenue with CloudOpt.</p>
          <Link to="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            backgroundColor: L.accent, color: '#fff', fontWeight: 600,
            padding: '0.875rem 2rem', borderRadius: 12, textDecoration: 'none',
            fontSize: '0.875rem', boxShadow: '0 4px 20px rgba(6,182,212,0.3)',
          }}>
            Open Dashboard <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ backgroundColor: L.bg, borderTop: `1px solid ${L.border}`, padding: '2rem 1.5rem', textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <div style={{ width: 24, height: 24, backgroundColor: L.accent, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={12} color="#fff" />
        </div>
        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: L.text }}>CloudOpt</span>
      </div>
      <p style={{ color: L.textMuted, fontSize: '0.75rem', margin: 0 }}>
        © {new Date().getFullYear()} CloudOpt. Energy-aware workload scheduling for modern data centers.
      </p>
    </footer>
  );
}

export default function Landing() {
  // Override body background for this page only — restore on unmount
  useEffect(() => {
    const prev = document.body.style.backgroundColor;
    const prevColor = document.body.style.color;
    document.body.style.backgroundColor = '#ffffff';
    document.body.style.color = '#0f172a';
    return () => {
      document.body.style.backgroundColor = prev;
      document.body.style.color = prevColor;
    };
  }, []);
  return (
    <div style={{ minHeight: '100vh', backgroundColor: L.bg, fontFamily: 'inherit' }}>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Scale />
      <Footer />
      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }`}</style>
    </div>
  );
}
