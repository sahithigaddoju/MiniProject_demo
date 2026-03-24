import { Link } from 'react-router-dom';
import { Zap, ArrowRight, ChevronDown } from 'lucide-react';

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/40">
            <Zap size={16} className="text-black" />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">CloudOpt</span>
        </div>

        {/* Center nav */}
        <div className="hidden md:flex items-center gap-8">
          {['Features', 'How It Works', 'Scale'].map(link => (
            <a key={link} href={`#${link.toLowerCase().replace(/ /g, '-')}`}
              className="text-sm text-slate-400 hover:text-white transition-colors">
              {link}
            </a>
          ))}
        </div>


        {/* Right */}
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-1.5">
            Sign In
          </Link>
          <Link to="/login"
            className="text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-black px-5 py-2 rounded-lg transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/40">
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 overflow-hidden bg-black">
      {/* Grid background */}
      <div className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
      {/* Radial glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 border border-cyan-500/40 bg-cyan-500/10 text-cyan-400 text-xs font-semibold tracking-widest uppercase rounded-full px-4 py-1.5 mb-8">
          <Zap size={12} />
          Energy-Aware Cloud Scheduler
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight text-white mb-4 tracking-tight">
          Schedule smarter.
        </h1>
        <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-8 tracking-tight text-cyan-400"
          style={{ textShadow: '0 0 40px rgba(34,211,238,0.4)' }}>
          Save energy.
        </h1>

        {/* Description */}
        <p className="text-slate-400 text-lg leading-relaxed max-w-2xl mx-auto mb-10 text-center">
          CloudOpt is a full-stack data center scheduling platform that allocates
          cloud workloads using a multi-dimensional knapsack algorithm —
          minimizing energy costs while maximizing revenue.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/login"
            className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-400/50 text-sm">
            Open Dashboard <ArrowRight size={16} />
          </Link>
          <a href="#features"
            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-8 py-3.5 rounded-xl transition-all text-sm">
            Explore Features <ChevronDown size={16} />
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="relative z-10 mt-20 flex flex-col sm:flex-row items-center justify-center gap-12 sm:gap-20">
        {[
          { val: '50K+', label: 'Max Servers' },
          { val: '< 1ms', label: 'Schedule Time' },
          { val: 'JWT', label: 'Auth Secured' },
        ].map(({ val, label }) => (
          <div key={label} className="text-center">
            <div className="text-3xl font-extrabold text-white">{val}</div>
            <div className="text-slate-500 text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-slate-600">
        <ChevronDown size={20} className="animate-bounce" />
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
    <section id="features" className="bg-black py-24 px-6 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-3">Everything You Need</h2>
          <p className="text-slate-500 max-w-lg mx-auto">A complete platform for energy-aware workload management in modern data centers.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(({ icon, title, desc }) => (
            <div key={title} className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 hover:border-cyan-500/30 hover:bg-white/[0.05] transition-all group">
              <div className="text-2xl mb-4">{icon}</div>
              <h3 className="font-semibold text-white mb-2 text-sm">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
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
    <section id="how-it-works" className="bg-black py-24 px-6 border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-3">How It Works</h2>
          <p className="text-slate-500">Four simple steps to optimized workload scheduling.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map(({ n, title, desc }) => (
            <div key={n} className="text-center">
              <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-2xl flex items-center justify-center text-lg font-bold mx-auto mb-4">
                {n}
              </div>
              <h3 className="font-semibold text-white mb-2 text-sm">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Scale() {
  return (
    <section id="scale" className="bg-black py-20 px-6 border-t border-white/5">
      <div className="max-w-3xl mx-auto text-center">
        <div className="bg-gradient-to-br from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Optimize?</h2>
          <p className="text-slate-400 mb-8">Join administrators already saving energy and maximizing revenue with CloudOpt.</p>
          <Link to="/login"
            className="inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-500/30 text-sm">
            Open Dashboard <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-black border-t border-white/5 py-8 px-6 text-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <div className="w-6 h-6 bg-cyan-500 rounded-md flex items-center justify-center">
          <Zap size={12} className="text-black" />
        </div>
        <span className="text-white font-semibold text-sm">CloudOpt</span>
      </div>
      <p className="text-slate-600 text-xs">© {new Date().getFullYear()} CloudOpt. Energy-aware workload scheduling for modern data centers.</p>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Scale />
      <Footer />
    </div>
  );
}
