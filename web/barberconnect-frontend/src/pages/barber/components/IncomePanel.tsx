import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { incomeService, type IncomeRecord } from '../../../services/barberFeatureService';
import { appointmentService, type Appointment } from '../../../services/appointmentService';

// ── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard = ({
  label, value, sub, iconBg, iconColor, icon,
}: {
  label: string; value: string; sub: string;
  iconBg: string; iconColor: string; icon: React.ReactNode;
}) => (
  <div style={{
    background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14,
    padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: 12,
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)', transition: 'box-shadow .2s, transform .2s',
  }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, fontSize: 14, fontWeight: 800 }}>
        {icon}
      </div>
    </div>
    <div>
      <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
      <p style={{ margin: '5px 0 0', fontSize: 12, color: '#9CA3AF' }}>{sub}</p>
    </div>
  </div>
);

// ── Smooth SVG Line Chart ─────────────────────────────────────────────────────
const LineChart = ({ data, maxVal }: { data: { label: string; net: number }[]; maxVal: number }) => {
  const W = 600, H = 180, PAD = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const pts = data.map((d, i) => ({
    x: PAD.left + (i / (data.length - 1)) * chartW,
    y: PAD.top + chartH - (maxVal > 0 ? (d.net / maxVal) * chartH : 0),
    ...d,
  }));

  // Smooth bezier path
  const path = pts.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = pts[i - 1];
    const cpx = (prev.x + pt.x) / 2;
    return `${acc} C ${cpx} ${prev.y} ${cpx} ${pt.y} ${pt.x} ${pt.y}`;
  }, '');

  // Area fill path
  const areaPath = `${path} L ${pts[pts.length - 1].x} ${PAD.top + chartH} L ${pts[0].x} ${PAD.top + chartH} Z`;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    y: PAD.top + chartH - f * chartH,
    label: maxVal > 0 ? `₱${((f * maxVal) / 1000).toFixed(0)}k` : '₱0',
  }));

  const [tooltip, setTooltip] = useState<{ x: number; y: number; label: string; net: number } | null>(null);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F97316" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} y1={t.y} x2={W - PAD.right} y2={t.y} stroke="#F3F4F6" strokeWidth={1} />
            <text x={PAD.left - 8} y={t.y + 4} textAnchor="end" fontSize={10} fill="#9CA3AF">{t.label}</text>
          </g>
        ))}

        {/* X axis labels */}
        {pts.map((pt, i) => (
          <text key={i} x={pt.x} y={H - 4} textAnchor="middle" fontSize={11} fill={i === pts.length - 1 ? '#F97316' : '#9CA3AF'} fontWeight={i === pts.length - 1 ? 700 : 400}>
            {pt.label}
          </text>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Line */}
        <path d={path} fill="none" stroke="#F97316" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points */}
        {pts.map((pt, i) => (
          <g key={i}
            onMouseEnter={() => setTooltip(pt)}
            onMouseLeave={() => setTooltip(null)}
            style={{ cursor: 'pointer' }}
          >
            <circle cx={pt.x} cy={pt.y} r={12} fill="transparent" />
            <circle cx={pt.x} cy={pt.y} r={i === pts.length - 1 ? 5 : 4}
              fill={i === pts.length - 1 ? '#F97316' : '#fff'}
              stroke={i === pts.length - 1 ? '#EA580C' : '#F97316'}
              strokeWidth={2}
            />
          </g>
        ))}

        {/* Tooltip */}
        {tooltip && (
          <g>
            <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={PAD.top + chartH} stroke="#E5E7EB" strokeWidth={1} strokeDasharray="4 3" />
            <rect x={tooltip.x - 60} y={tooltip.y - 46} width={120} height={40} rx={8} fill="#111827" />
            <text x={tooltip.x} y={tooltip.y - 30} textAnchor="middle" fontSize={11} fill="#9CA3AF">{tooltip.label}</text>
            <text x={tooltip.x} y={tooltip.y - 14} textAnchor="middle" fontSize={13} fill="#fff" fontWeight={700}>
              ₱{tooltip.net.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const IncomePanel: React.FC = () => {
  const { user } = useAuth();
  const barberProfileId = user?.barberProfile?.id ?? '';

  const [activeTab,     setActiveTab]     = useState<'overview' | 'history'>('overview');
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [appointments,  setAppointments]  = useState<Appointment[]>([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    if (!barberProfileId) return;
    (async () => {
      try {
        const [inc, appts] = await Promise.all([
          incomeService.getIncomeForBarber(barberProfileId),
          appointmentService.getBarberAppointments(barberProfileId),
        ]);
        setIncomeRecords(inc); setAppointments(appts);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [barberProfileId]);

  const now = new Date();
  const cm  = now.getMonth(), cy = now.getFullYear();
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const thisMonthRecs = incomeRecords.filter(r => { const d = new Date(r.recordedAt); return d.getMonth() === cm && d.getFullYear() === cy; });
  // Handle both `amount` and `grossAmount` field names from different backend versions
  const getGross = (r: IncomeRecord) => r.amount ?? r.grossAmount ?? 0;
  const gross  = thisMonthRecs.reduce((s, r) => s + getGross(r), 0);
  const net    = thisMonthRecs.reduce((s, r) => s + (r.netAmount ?? 0), 0);
  const fee    = thisMonthRecs.reduce((s, r) => s + (r.platformFee ?? 0), 0);
  const appts  = appointments.filter(a => { const d = new Date(a.appointmentDateTime); return d.getMonth() === cm && d.getFullYear() === cy; });
  const avg    = appts.length > 0 ? gross / appts.length : 0;
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  // 6-month chart data
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const label = d.toLocaleString('default', { month: 'short' });
    const n = incomeRecords
      .filter(r => { const rd = new Date(r.recordedAt); return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear(); })
      .reduce((s, r) => s + (r.netAmount ?? 0), 0);
    return { label, net: n };
  });
  const maxNet = Math.max(...last6.map(m => m.net), 1);

  const recentRecords = [...incomeRecords]
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
    .slice(0, 10);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '3px solid #E5E7EB', borderTopColor: '#F97316', borderRadius: '50%', animation: 'barberSpin .8s linear infinite' }} />
      <p style={{ color: '#9CA3AF', fontSize: 14 }}>Loading income data…</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, paddingBottom: 20, borderBottom: '1px solid #F3F4F6' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Income Analytics</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6B7280' }}>{monthName} — your earnings breakdown</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Tab toggle */}
          <div style={{ display: 'flex', background: '#F3F4F6', borderRadius: 9, padding: 3, gap: 2 }}>
            {(['overview', 'history'] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                background: activeTab === t ? '#fff' : 'transparent',
                color: activeTab === t ? '#111827' : '#6B7280',
                border: 'none', borderRadius: 7, padding: '6px 16px', fontSize: 13,
                fontWeight: activeTab === t ? 700 : 500, cursor: 'pointer',
                boxShadow: activeTab === t ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all .15s', textTransform: 'capitalize',
              }}>
                {t}
              </button>
            ))}
          </div>
          {/* Month selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 9, padding: '7px 13px', fontSize: 13, color: '#374151', fontWeight: 500, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#9CA3AF" style={{ width: 14, height: 14 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            {monthName}
          </div>
        </div>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <KpiCard label="Gross Revenue"       value={`₱${fmt(gross)}`} sub="Total billed this month"  iconBg="#DCFCE7" iconColor="#16A34A" icon="₱" />
        <KpiCard label="Your Earnings (80%)" value={`₱${fmt(net)}`}   sub="After platform fee"       iconBg="#DBEAFE" iconColor="#1D4ED8" icon="₱" />
        <KpiCard label="Platform Fee (20%)"  value={`₱${fmt(fee)}`}   sub="Deducted from gross"      iconBg="#FEF3C7" iconColor="#D97706" icon="%" />
        <KpiCard label="Avg per Appointment" value={`₱${fmt(avg)}`}   sub={`${appts.length} appointments`} iconBg="#FFF7ED" iconColor="#EA580C" icon="~" />
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Line Chart ─────────────────────────────────────────────── */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>6-Month Earnings Trend</p>
                <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9CA3AF' }}>Your 80% share — hover for details</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F97316' }} />
                <span style={{ fontSize: 12, color: '#6B7280' }}>Net Earnings</span>
              </div>
            </div>
            <LineChart data={last6} maxVal={maxNet} />
          </div>

          {/* ── Revenue Breakdown ──────────────────────────────────────── */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Revenue Breakdown</p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#9CA3AF' }}>{monthName}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {[
                { label: 'Gross Revenue',     value: gross, color: '#22C55E', pct: 100, textColor: '#15803D', bg: '#DCFCE7' },
                { label: 'Your Share (80%)',   value: net,   color: '#3B82F6', pct: 80,  textColor: '#1D4ED8', bg: '#DBEAFE' },
                { label: 'Platform Fee (20%)', value: fee,   color: '#F97316', pct: 20,  textColor: '#C2410C', bg: '#FFF7ED' },
              ].map(row => (
                <div key={row.label}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: row.color }} />
                      <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{row.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, background: row.bg, color: row.textColor, padding: '2px 8px', borderRadius: 12 }}>{row.pct}%</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>₱{fmt(row.value)}</span>
                    </div>
                  </div>
                  <div style={{ height: 8, background: '#F3F4F6', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${row.pct}%`, background: row.color, borderRadius: 4, transition: 'width .6s ease' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 100px', padding: '10px 1.5rem', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
            {['Date', 'Payment', 'Gross', 'Your Share'].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>

          {recentRecords.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>No income records yet.</div>
          ) : (
            recentRecords.map((r, idx) => {
              const d = new Date(r.recordedAt);
              return (
                <div key={r.income_record_id ?? r.appointment_id ?? idx} style={{
                  display: 'grid', gridTemplateColumns: '1fr 120px 120px 100px',
                  padding: '14px 1.5rem', alignItems: 'center',
                  borderBottom: idx < recentRecords.length - 1 ? '1px solid #F9FAFB' : 'none',
                  transition: 'background .15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>
                      {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9CA3AF' }}>Appt ···{r.appointment_id?.slice(-6)}</p>
                  </div>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{r.paymentMethod ?? 'Cash'}</span>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 600 }}>₱{fmt(r.amount)}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#22C55E' }}>₱{fmt(r.netAmount)}</span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default IncomePanel;
