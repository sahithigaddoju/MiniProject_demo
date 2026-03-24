import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useTheme } from '../context/ThemeContext';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, ReferenceLine,
} from 'recharts';
import { Activity, Zap, DollarSign, XCircle, RefreshCw, Loader2, Radio } from 'lucide-react';

// card and tooltipStyle are derived from tokens inside the component (see below)

function Pill({ active, onClick, children, tokens }) {
  const style = active
    ? { ...(tokens?.pillActive || { backgroundColor: '#22d3ee', color: '#000' }) }
    : { ...(tokens?.pillInactive || { backgroundColor: 'rgba(255,255,255,0.06)', color: '#94a3b8' }) };
  return (
    <button onClick={onClick} style={{
      padding: '0.2rem 0.65rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600,
      border: 'none', cursor: 'pointer', transition: 'all 0.15s', ...style,
    }}>{children}</button>
  );
}

function MetricCard({ icon: Icon, iconColor, iconBg, value, label, unit = '', tokens }) {
  return (
    <div style={{ ...tokens.card, display: 'flex', flexDirection: 'column', gap: '0.5rem', transition: 'all 0.3s' }}>
      <div style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} style={{ color: iconColor }} />
      </div>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: tokens.textPrimary, lineHeight: 1.1 }}>
        {unit}{value}
      </div>
      <div style={{ fontSize: '0.8rem', color: tokens.textMuted }}>{label}</div>
    </div>
  );
}

// CPU gauge ring
function CpuGauge({ value, tokens }) {
  const pct = Math.min(100, Math.max(0, parseFloat(value) || 0));
  const r = 52, stroke = 10;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct < 50 ? '#22d3ee' : pct < 80 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
      <svg width={130} height={130} style={{ overflow: 'visible' }}>
        <circle cx={65} cy={65} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        <circle cx={65} cy={65} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 65 65)" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        <text x={65} y={60} textAnchor="middle" fill={tokens?.textPrimary || '#fff'} fontSize={18} fontWeight={700}>{pct}%</text>
        <text x={65} y={78} textAnchor="middle" fill={tokens?.textMuted || '#64748b'} fontSize={11}>CPU Load</text>
      </svg>
      {/* gradient bar */}
      <div style={{ width: '100%' }}>
        <div style={{ height: 6, borderRadius: 9999, background: 'linear-gradient(to right, #22d3ee, #f59e0b, #ef4444)', position: 'relative' }}>
          <div style={{
            position: 'absolute', top: -3, width: 12, height: 12, borderRadius: '50%',
            backgroundColor: color, border: '2px solid #0d1117',
            left: `calc(${pct}% - 6px)`, transition: 'left 0.6s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem', fontSize: '0.7rem', color: tokens?.textSecondary || '#475569' }}>
          <span>Healthy</span><span>Overloaded</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: tokens?.textMuted || '#334155' }}>
          <span>0%</span><span>50%</span><span>100%</span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { metrics, trends, workloadStatus, loading, refresh } = useDashboard();
  const { tokens } = useTheme();
  const [autoRefresh, setAutoRefresh]   = useState(false);
  const [trendRange, setTrendRange]     = useState('all');
  const [chartType, setChartType]       = useState('area');
  const [activeDonut, setActiveDonut]   = useState(null);
  const [liveMode, setLiveMode]         = useState(false);
  const [liveSpeed, setLiveSpeed]       = useState('normal'); // slow | normal | fast
  const [liveData, setLiveData]         = useState([]);       // rolling window
  const intervalRef   = useRef(null);
  const liveRef       = useRef(null);
  const liveDataRef   = useRef([]);   // mirror for interval closure

  const WINDOW = 20;  // max points in rolling window
  const SPEEDS = { slow: 4000, normal: 2500, fast: 1000 };

  useEffect(() => {
    console.log('[Dashboard] mounting ΓÇö fetching data');
    refresh();
  }, []);

  useEffect(() => {
    if (metrics) console.log('[Dashboard] metrics updated:', metrics);
  }, [metrics]);

  useEffect(() => {
    if (workloadStatus) console.log('[Dashboard] workloadStatus updated:', workloadStatus);
  }, [workloadStatus]);

  // Seed liveData from real trends whenever trends arrive
  useEffect(() => {
    if (!trends.length) return;
    const seeded = trends.map(t => ({
      time:    t.label || new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      energy:  t.energy,
      revenue: t.revenue,
    })).slice(-WINDOW);
    setLiveData(seeded);
    liveDataRef.current = seeded;
  }, [trends]);

  // Auto-refresh (dashboard context)
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(refresh, 8000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, refresh]);

  // Live simulation interval
  useEffect(() => {
    clearInterval(liveRef.current);
    if (!liveMode) return;

    liveRef.current = setInterval(() => {
      setLiveData(prev => {
        const last    = prev[prev.length - 1];
        const baseE   = last ? last.energy  : (metrics?.energyConsumed ?? 5);
        const baseR   = last ? last.revenue : (metrics?.revenue        ?? 8);
        // small random walk ┬▒8% of current value
        const jitter  = v => Math.max(0.01, v * (1 + (Math.random() - 0.5) * 0.16));
        const energy  = parseFloat(jitter(baseE).toFixed(3));
        const revenue = parseFloat((energy * (0.8 + Math.random() * 0.4)).toFixed(3));
        const now     = new Date();
        const time    = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const next    = [...prev, { time, energy, revenue }].slice(-WINDOW);
        liveDataRef.current = next;
        return next;
      });
    }, SPEEDS[liveSpeed]);

    return () => clearInterval(liveRef.current);
  }, [liveMode, liveSpeed, metrics]);

  // Which data the chart actually renders
  const baseTrendData = (() => {
    const src = liveMode ? liveData : trends.map(t => ({
      time:    t.label || new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      energy:  t.energy,
      revenue: t.revenue,
    }));
    if (trendRange === '5') return src.slice(-5);
    if (trendRange === '7') return src.slice(-7);
    return src;
  })();
  const trendData = baseTrendData;

  // Donut data — include pending so uploaded-not-yet-scheduled workloads show up
  const donutData = workloadStatus ? [
    { name: 'Scheduled', value: workloadStatus.scheduled || 0, color: '#22d3ee' },
    { name: 'Pending',   value: workloadStatus.pending   || 0, color: '#f59e0b' },
    { name: 'Rejected',  value: (workloadStatus.rejected || 0) + (workloadStatus.preempted || 0), color: '#ef4444' },
  ].filter(d => d.value > 0) : [];

  // Workload distribution bar data
  const distData = workloadStatus ? [
    { name: 'Scheduled', value: workloadStatus.scheduled || 0, fill: '#22d3ee' },
    { name: 'Pending',   value: workloadStatus.pending   || 0, fill: '#f59e0b' },
    { name: 'Preempted', value: workloadStatus.preempted || 0, fill: '#a855f7' },
    { name: 'Rejected',  value: workloadStatus.rejected  || 0, fill: '#ef4444' },
  ] : [];

  const [hoverTime, setHoverTime] = useState(null);

  // Token-aware tooltip
  const TrendTooltip = useCallback(({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        backgroundColor: tokens.tooltipBg,
        border: `1px solid ${tokens.tooltipBorder}`,
        borderRadius: '10px',
        padding: '0.65rem 0.9rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        minWidth: 160,
      }}>
        <div style={{ fontSize: '0.7rem', color: tokens.textMuted, marginBottom: '0.4rem', fontWeight: 500 }}>{label}</div>
        {payload.map((p) => (
          <div key={p.dataKey} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: p.color, boxShadow: `0 0 6px ${p.color}` }} />
            <span style={{ fontSize: '0.75rem', color: tokens.textSecondary }}>{p.name}:</span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: tokens.textPrimary }}>
              {p.dataKey === 'revenue' ? '$' : ''}{Number(p.value).toLocaleString()}{p.dataKey === 'energy' ? ' kWh' : ''}
            </span>
          </div>
        ))}
      </div>
    );
  }, [tokens]);

  const renderTrendChart = () => {
    const common = {
      data: trendData,
      margin: { top: 10, right: 16, left: -10, bottom: 0 },
      onMouseMove: (s) => s?.activeLabel && setHoverTime(s.activeLabel),
      onMouseLeave: () => setHoverTime(null),
    };
    const defs = (
      <defs>
        <linearGradient id="gEnergy" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#a855f7" stopOpacity={0.55} />
          <stop offset="75%"  stopColor="#a855f7" stopOpacity={0.08} />
          <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="gRevenue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#22d3ee" stopOpacity={0.55} />
          <stop offset="75%"  stopColor="#22d3ee" stopOpacity={0.08} />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
        </linearGradient>
        {/* glow filters */}
        <filter id="glowPurple" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
    );
    const grid = (
      <CartesianGrid strokeDasharray="4 4" stroke={tokens.chartGrid} vertical={false} />
    );
    const axes = (
      <>
        <XAxis dataKey="time"
          tick={{ fontSize: 10, fill: tokens.chartTick }}
          axisLine={false} tickLine={false}
          interval={0}
          angle={trendData.length > 10 ? -35 : 0}
          textAnchor={trendData.length > 10 ? 'end' : 'middle'}
          height={trendData.length > 10 ? 36 : 20}
        />
        <YAxis yAxisId="left"
          tick={{ fontSize: 10, fill: tokens.chartTick }}
          axisLine={false} tickLine={false}
          tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
        />
        <YAxis yAxisId="right" orientation="right"
          tick={{ fontSize: 10, fill: tokens.chartTick }}
          axisLine={false} tickLine={false}
          tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`}
        />
      </>
    );
    const tip = (
      <Tooltip
        content={<TrendTooltip />}
        cursor={{ stroke: 'rgba(255,255,255,0.15)', strokeWidth: 1, strokeDasharray: '4 2' }}
        animationDuration={150}
      />
    );
    const refLine = hoverTime ? (
      <ReferenceLine x={hoverTime} yAxisId="left"
        stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="4 2" />
    ) : null;

    if (chartType === 'bar') return (
      <BarChart {...common}>{defs}{grid}{axes}{tip}
        <Bar yAxisId="left"  dataKey="energy"  fill="#a855f7" radius={[4,4,0,0]} name="Energy (kWh)" isAnimationActive />
        <Bar yAxisId="right" dataKey="revenue" fill="#22d3ee" radius={[4,4,0,0]} name="Revenue ($)"  isAnimationActive />
      </BarChart>
    );

    if (chartType === 'line') return (
      <LineChart {...common}>{defs}{grid}{axes}{tip}{refLine}
        <Line yAxisId="left"  type="monotone" dataKey="energy"
          stroke="#a855f7" strokeWidth={3}
          dot={false}
          activeDot={{ r: 6, fill: '#a855f7', stroke: 'rgba(168,85,247,0.4)', strokeWidth: 6 }}
          name="Energy (kWh)" filter="url(#glowPurple)"
          isAnimationActive animationDuration={800} animationEasing="ease-out"
        />
        <Line yAxisId="right" type="monotone" dataKey="revenue"
          stroke="#22d3ee" strokeWidth={3}
          dot={false}
          activeDot={{ r: 6, fill: '#22d3ee', stroke: 'rgba(34,211,238,0.4)', strokeWidth: 6 }}
          name="Revenue ($)" filter="url(#glowCyan)"
          isAnimationActive animationDuration={800} animationEasing="ease-out"
        />
      </LineChart>
    );

    // area ΓÇö default, matches reference
    return (
      <AreaChart {...common}>
        {defs}{grid}{axes}{tip}{refLine}
        <Area yAxisId="left"  type="monotone" dataKey="energy"
          stroke="#a855f7" strokeWidth={3} fill="url(#gEnergy)"
          dot={false}
          activeDot={{ r: 6, fill: '#a855f7', stroke: 'rgba(168,85,247,0.4)', strokeWidth: 6 }}
          name="Energy (kWh)" filter="url(#glowPurple)"
          isAnimationActive animationDuration={900} animationEasing="ease-out"
        />
        <Area yAxisId="right" type="monotone" dataKey="revenue"
          stroke="#22d3ee" strokeWidth={3} fill="url(#gRevenue)"
          dot={false}
          activeDot={{ r: 6, fill: '#22d3ee', stroke: 'rgba(34,211,238,0.4)', strokeWidth: 6 }}
          name="Revenue ($)" filter="url(#glowCyan)"
          isAnimationActive animationDuration={900} animationEasing="ease-out"
        />
      </AreaChart>
    );
  };

  const card       = tokens.card;
  const tooltipSt  = { backgroundColor: tokens.tooltipBg, border: `1px solid ${tokens.tooltipBorder}`, color: tokens.textPrimary, borderRadius: '10px', fontSize: '12px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', transition: 'all 0.3s' }}>

      {/* ΓöÇΓöÇ Header ΓöÇΓöÇ */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: tokens.textPrimary, margin: 0 }}>Platform Analytics</h1>
          <p style={{ fontSize: '0.82rem', color: tokens.textSecondary, marginTop: '0.25rem' }}>Real-time overview of your data center performance.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setAutoRefresh(p => !p)} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.45rem 0.9rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
            border: `1px solid ${autoRefresh ? tokens.accent : tokens.divider}`,
            backgroundColor: autoRefresh ? `${tokens.accent}18` : 'transparent',
            color: autoRefresh ? tokens.accent : tokens.textSecondary, cursor: 'pointer',
          }}>
            <RefreshCw size={13} style={{ animation: autoRefresh ? 'spin 2s linear infinite' : 'none' }} />
            Auto-Refresh
          </button>
          <button onClick={refresh} disabled={loading} style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.45rem 0.9rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
            border: `1px solid ${tokens.divider}`, backgroundColor: 'transparent',
            color: tokens.textSecondary, cursor: 'pointer', opacity: loading ? 0.6 : 1,
          }}>
            {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <RefreshCw size={13} />}
            Refresh
          </button>
        </div>
      </div>

      {/* ΓöÇΓöÇ Metric cards ΓöÇΓöÇ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <MetricCard tokens={tokens} icon={Activity}   iconColor="#22d3ee" iconBg="rgba(34,211,238,0.12)"  value={metrics?.cpuUtilization ?? '0.0'} label="CPU Utilization (%)" />
        <MetricCard tokens={tokens} icon={Zap}        iconColor="#a855f7" iconBg="rgba(168,85,247,0.12)"  value={metrics?.energyConsumed ?? '0.00'} label="Energy Consumed (kWh)" />
        <MetricCard tokens={tokens} icon={DollarSign} iconColor="#10b981" iconBg="rgba(16,185,129,0.12)"  value={metrics?.revenue ?? '0.00'} unit="$" label="Total Revenue" />
        {(workloadStatus?.pending > 0 && !workloadStatus?.scheduled)
          ? <MetricCard tokens={tokens} icon={Loader2} iconColor="#f59e0b" iconBg="rgba(245,158,11,0.12)" value={workloadStatus.pending} label="Pending (awaiting schedule)" />
          : <MetricCard tokens={tokens} icon={XCircle} iconColor="#ef4444" iconBg="rgba(239,68,68,0.12)"  value={metrics?.rejectedCount ?? 0} label="Rejected / Preempted" />
        }
      </div>

      {/* ΓöÇΓöÇ Row 2: Trend + Donut ΓöÇΓöÇ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem' }}>

        {/* Energy & Revenue Trend */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontWeight: 600, color: tokens.textPrimary, fontSize: '0.95rem' }}>Energy &amp; Revenue Trend</span>
              {liveMode && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem', fontWeight: 700,
                  color: '#22d3ee', backgroundColor: 'rgba(34,211,238,0.12)', border: '1px solid rgba(34,211,238,0.3)',
                  borderRadius: '9999px', padding: '0.1rem 0.55rem' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#22d3ee',
                    animation: 'pulse 1.2s ease-in-out infinite', display: 'inline-block' }} />
                  LIVE
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Live toggle */}
              <button onClick={() => setLiveMode(v => !v)} style={{
                display: 'flex', alignItems: 'center', gap: '0.3rem',
                padding: '0.2rem 0.65rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 600,
                border: `1px solid ${liveMode ? '#22d3ee' : tokens.divider}`,
                backgroundColor: liveMode ? 'rgba(34,211,238,0.12)' : 'transparent',
                color: liveMode ? '#22d3ee' : tokens.textSecondary, cursor: 'pointer',
              }}>
                <Radio size={11} /> Live
              </button>
              {/* Speed pills ΓÇö only when live */}
              {liveMode && ['slow','normal','fast'].map(s => (
                <Pill key={s} tokens={tokens} active={liveSpeed === s} onClick={() => setLiveSpeed(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Pill>
              ))}
              <div style={{ width: 1, height: 16, backgroundColor: tokens.divider, margin: '0 0.1rem' }} />
              <Pill tokens={tokens} active={trendRange === 'all'} onClick={() => setTrendRange('all')}>All</Pill>
              <Pill tokens={tokens} active={trendRange === '5'}   onClick={() => setTrendRange('5')}>Last 5</Pill>
              <Pill tokens={tokens} active={trendRange === '7'}   onClick={() => setTrendRange('7')}>Last 7</Pill>
              <div style={{ width: 1, height: 16, backgroundColor: tokens.divider, margin: '0 0.1rem' }} />
              <Pill tokens={tokens} active={chartType === 'area'} onClick={() => setChartType('area')}>Area</Pill>
              <Pill tokens={tokens} active={chartType === 'line'} onClick={() => setChartType('line')}>Line</Pill>
              <Pill tokens={tokens} active={chartType === 'bar'}  onClick={() => setChartType('bar')}>Bar</Pill>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.5rem' }}>
            {[['#a855f7', 'Energy (kWh)'], ['#22d3ee', 'Revenue ($)']].map(([color, label]) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: tokens.textSecondary,
                border: `1px solid ${color}40`, borderRadius: 9999, padding: '0.15rem 0.6rem', backgroundColor: `${color}12` }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color }} />
                {label}
              </div>
            ))}
          </div>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>{renderTrendChart()}</ResponsiveContainer>
          ) : (
            <div style={{ height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.textMuted, fontSize: '0.85rem' }}>
              No trend data yet. Upload workloads and run the scheduler.
            </div>
          )}
        </div>

        {/* Workload Status donut */}
        <div style={card}>
          <div style={{ fontWeight: 600, color: tokens.textPrimary, fontSize: '0.95rem', marginBottom: '0.2rem' }}>Workload Status</div>
          <div style={{ fontSize: '0.75rem', color: tokens.textMuted, marginBottom: '0.5rem' }}>Click a segment to highlight</div>
          {donutData.some(d => d.value > 0) ? (
            <>
              <div style={{ position: 'relative' }}>
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={78}
                      paddingAngle={3} dataKey="value"
                      onClick={(_, i) => setActiveDonut(activeDonut === i ? null : i)}>
                      {donutData.map((d, i) => (
                        <Cell key={i} fill={d.color}
                          opacity={activeDonut === null || activeDonut === i ? 1 : 0.25}
                          style={{ cursor: 'pointer', outline: 'none' }} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipSt} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <span style={{ fontSize: '1.6rem', fontWeight: 700, color: tokens.textPrimary, lineHeight: 1 }}>{workloadStatus?.total ?? 0}</span>
                  <span style={{ fontSize: '0.75rem', color: tokens.textMuted, marginTop: '0.2rem' }}>Total</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '0.5rem' }}>
                {donutData.map((d, i) => (
                  <div key={d.name} onClick={() => setActiveDonut(activeDonut === i ? null : i)}
                    style={{ textAlign: 'center', cursor: 'pointer', opacity: activeDonut === null || activeDonut === i ? 1 : 0.35 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: tokens.textSecondary }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: d.color }} />
                      {d.name}
                    </div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 700, color: tokens.textPrimary, marginTop: '0.2rem' }}>{d.value}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.textMuted, fontSize: '0.85rem', textAlign: 'center' }}>
              No scheduling data yet.
            </div>
          )}
        </div>
      </div>

      {/* ΓöÇΓöÇ Row 3: Workload Distribution + CPU Gauge ΓöÇΓöÇ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem' }}>
        <div style={card}>
          <div style={{ fontWeight: 600, color: tokens.textPrimary, fontSize: '0.95rem', marginBottom: '1rem' }}>Workload Distribution</div>
          {distData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={distData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: tokens.chartTick }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: tokens.textSecondary }} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={tooltipSt} cursor={{ fill: 'rgba(128,128,128,0.06)' }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={18}>
                  {distData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: tokens.textMuted, fontSize: '0.85rem' }}>
              No distribution data yet.
            </div>
          )}
        </div>

        <div style={card}>
          <div style={{ fontWeight: 600, color: tokens.textPrimary, fontSize: '0.95rem', marginBottom: '0.2rem' }}>Cluster CPU Load</div>
          <div style={{ fontSize: '0.75rem', color: tokens.textMuted, marginBottom: '1rem' }}>Based on last scheduler run</div>
          <CpuGauge value={metrics?.cpuUtilization ?? 0} tokens={tokens} />
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}
