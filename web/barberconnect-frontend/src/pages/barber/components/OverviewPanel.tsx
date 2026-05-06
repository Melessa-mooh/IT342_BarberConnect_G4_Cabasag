import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { incomeService, leaveService, type IncomeRecord, type LeaveRequest } from '../../../services/barberFeatureService';
import { appointmentService, type Appointment } from '../../../services/appointmentService';
import { barberService, type Barber } from '../../../services/barberService';
import { haircutStyleService, type HaircutStyle } from '../../../services/haircutStyleService';

interface OverviewPanelProps { setActiveTab?: (tab: string) => void; }

// ── Tiny reusable components ──────────────────────────────────────────────────

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
    cursor: 'default',
  }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor, fontSize: 15, fontWeight: 700 }}>
        {icon}
      </div>
    </div>
    <div>
      <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
      <p style={{ margin: '5px 0 0', fontSize: 12, color: '#9CA3AF' }}>{sub}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    COMPLETED:  { bg: '#DCFCE7', color: '#15803D', label: 'Completed' },
    CONFIRMED:  { bg: '#DBEAFE', color: '#1D4ED8', label: 'Confirmed' },
    PENDING:    { bg: '#FFF7ED', color: '#C2410C', label: 'Pending'   },
    CANCELLED:  { bg: '#FEE2E2', color: '#B91C1C', label: 'Cancelled' },
    IN_PROGRESS:{ bg: '#EDE9FE', color: '#6D28D9', label: 'In Progress'},
  };
  const s = map[status] ?? { bg: '#F3F4F6', color: '#374151', label: status };
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
      {s.label}
    </span>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const OverviewPanel: React.FC<OverviewPanelProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const barberProfileId = user?.barberProfile?.id?.toString() ?? '';

  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [appointments,  setAppointments]  = useState<Appointment[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [haircutStyles, setHaircutStyles] = useState<HaircutStyle[]>([]);
  const [profile,       setProfile]       = useState<Barber | null>(null);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    if (!barberProfileId) return;
    (async () => {
      try {
        const [inc, appts, leaves, styles, prof] = await Promise.all([
          incomeService.getIncomeForBarber(barberProfileId),
          appointmentService.getBarberAppointments(barberProfileId),
          leaveService.getLeaveRequests(barberProfileId),
          haircutStyleService.getHaircutStylesForBarber(barberProfileId),
          barberService.getBarberById(barberProfileId),
        ]);
        setIncomeRecords(inc); setAppointments(appts); setLeaveRequests(leaves);
        setHaircutStyles(styles); setProfile(prof);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    })();
  }, [barberProfileId]);

  const now = new Date();
  const cm  = now.getMonth(), cy = now.getFullYear();
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const monthIncome = incomeRecords
    .filter(r => { const d = new Date(r.recordedAt); return d.getMonth() === cm && d.getFullYear() === cy; })
    .reduce((s, r) => s + r.netAmount, 0);

  const monthAppts = appointments.filter(a => { const d = new Date(a.appointmentDateTime); return d.getMonth() === cm && d.getFullYear() === cy; });

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd   = new Date(todayStart); todayEnd.setDate(todayEnd.getDate() + 1);
  const weekAgo    = new Date(todayStart); weekAgo.setDate(weekAgo.getDate() - 6);

  const todayAppts   = appointments.filter(a => { const d = new Date(a.appointmentDateTime); return d >= todayStart && d < todayEnd; });
  const pendingAppts = appointments.filter(a => a.status === 'PENDING');
  const todayIncome  = incomeRecords.filter(r => { const d = new Date(r.recordedAt); return d >= todayStart && d < todayEnd; }).reduce((s, r) => s + r.netAmount, 0);
  const weekIncome   = incomeRecords.filter(r => { const d = new Date(r.recordedAt); return d >= weekAgo && d < todayEnd; }).reduce((s, r) => s + r.netAmount, 0);
  const activeStyles = haircutStyles.filter(s => s.isActive).length;
  const leaveDays    = leaveRequests.filter(l => l.status === 'APPROVED').length;

  const recent = [...appointments]
    .sort((a, b) => new Date(b.appointmentDateTime).getTime() - new Date(a.appointmentDateTime).getTime())
    .slice(0, 6);

  const todayStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
      <div style={{ width: 36, height: 36, border: '3px solid #E5E7EB', borderTopColor: '#F97316', borderRadius: '50%', animation: 'barberSpin .8s linear infinite' }} />
      <p style={{ color: '#9CA3AF', fontSize: 14 }}>Loading overview…</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>Overview</h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6B7280' }}>
            Welcome back, <strong style={{ color: '#374151' }}>{user?.firstName}</strong>. Here's what's happening today.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Date chip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 9, padding: '7px 13px', fontSize: 13, color: '#374151', fontWeight: 500, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#9CA3AF" style={{ width: 15, height: 15 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            {todayStr}
          </div>
          {/* CTA */}
          <button
            onClick={() => setActiveTab?.('schedule')}
            style={{ background: '#F97316', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 8px rgba(249,115,22,0.35)', transition: 'background .15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#EA580C')}
            onMouseLeave={e => (e.currentTarget.style.background = '#F97316')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" style={{ width: 14, height: 14 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Appointment
          </button>
        </div>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <KpiCard label="Monthly Income"    value={`₱${fmt(monthIncome)}`}       sub="Your 80% share"          iconBg="#DCFCE7" iconColor="#16A34A" icon="₱" />
        <KpiCard label="Appointments"      value={String(monthAppts.length)}     sub="This month"              iconBg="#DBEAFE" iconColor="#1D4ED8"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>}
        />
        <KpiCard label="Average Rating"    value={profile?.rating ?? '0.0'}     sub={`${profile?.totalReviews ?? 0} reviews`} iconBg="#FEF3C7" iconColor="#D97706"
          icon={<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }}><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>}
        />
        <KpiCard label="Leave Days Used"   value={String(leaveDays)}            sub="Approved leaves"         iconBg="#EDE9FE" iconColor="#7C3AED"
          icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" /></svg>}
        />
      </div>

      {/* ── Main grid ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 14 }}>

        {/* Recent Appointments */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Recent Appointments</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9CA3AF' }}>{recent.length} most recent bookings</p>
            </div>
            <button
              onClick={() => setActiveTab?.('schedule')}
              style={{ background: 'none', border: '1px solid #E5E7EB', borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: '#6B7280', cursor: 'pointer', transition: 'all .15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#F97316'; (e.currentTarget as HTMLButtonElement).style.color = '#F97316'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLButtonElement).style.color = '#6B7280'; }}
            >
              View all
            </button>
          </div>

          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px 100px', padding: '10px 1.5rem', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
            {['Customer', 'Haircut Style', 'Date & Time', 'Status'].map(h => (
              <span key={h} style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
            ))}
          </div>

          {recent.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>No appointments yet.</div>
          ) : (
            recent.map((appt, idx) => {
              const d = new Date(appt.appointmentDateTime);
              const isToday = d.toDateString() === now.toDateString();
              return (
                <div key={appt.appointment_id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 140px 140px 100px',
                  padding: '14px 1.5rem', alignItems: 'center',
                  borderBottom: idx < recent.length - 1 ? '1px solid #F9FAFB' : 'none',
                  transition: 'background .15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  {/* Customer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: '#FFF7ED', border: '1px solid #FED7AA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#F97316', flexShrink: 0 }}>
                      {appt.customer_id.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#111827' }}>Customer ···{appt.customer_id.slice(-4)}</p>
                      <p style={{ margin: '1px 0 0', fontSize: 11, color: '#9CA3AF' }}>ID: {appt.customer_id.slice(0, 8)}…</p>
                    </div>
                  </div>
                  {/* Style */}
                  <p style={{ margin: 0, fontSize: 13, color: '#374151', fontWeight: 500 }}>···{appt.haircut_style_id.slice(-6)}</p>
                  {/* Date */}
                  <div>
                    <p style={{ margin: 0, fontSize: 13, color: '#374151', fontWeight: 500 }}>
                      {isToday ? 'Today' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <p style={{ margin: '1px 0 0', fontSize: 11, color: '#9CA3AF' }}>{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  {/* Status */}
                  <StatusBadge status={appt.status} />
                </div>
              );
            })
          )}
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #F3F4F6' }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>Quick Stats</p>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9CA3AF' }}>Today &amp; this week</p>
            </div>
            <div style={{ padding: '0.5rem 0' }}>
              {[
                { label: "Today's Appointments", value: todayAppts.length,       dot: '#3B82F6' },
                { label: 'Pending Bookings',      value: pendingAppts.length,     dot: '#F59E0B' },
                { label: "Today's Income",        value: `₱${fmt(todayIncome)}`, dot: '#22C55E' },
                { label: 'This Week Income',      value: `₱${fmt(weekIncome)}`,  dot: '#22C55E' },
                { label: 'Active Styles',         value: activeStyles,            dot: '#F97316' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 1.5rem', borderBottom: '1px solid #F9FAFB' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: row.dot, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#6B7280' }}>{row.label}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Grow Your Business CTA */}
          <div style={{
            background: 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
            borderRadius: 14, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: 14,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          }}>
            {/* Barber chair illustration (SVG) */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <svg viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 80, height: 60 }}>
                <rect x="30" y="8" width="20" height="14" rx="4" fill="#F97316" opacity=".9"/>
                <rect x="28" y="22" width="24" height="18" rx="3" fill="#F97316" opacity=".7"/>
                <rect x="24" y="40" width="6" height="14" rx="2" fill="#374151"/>
                <rect x="50" y="40" width="6" height="14" rx="2" fill="#374151"/>
                <rect x="20" y="52" width="40" height="4" rx="2" fill="#4B5563"/>
                <rect x="26" y="22" width="4" height="18" rx="2" fill="#374151"/>
                <rect x="50" y="22" width="4" height="18" rx="2" fill="#374151"/>
                <circle cx="40" cy="6" r="5" fill="#FDBA74"/>
                <rect x="36" y="10" width="8" height="2" rx="1" fill="#FFF7ED" opacity=".5"/>
              </svg>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#F9FAFB' }}>Grow Your Business</p>
              <p style={{ margin: '5px 0 0', fontSize: 12, color: '#9CA3AF', lineHeight: 1.5 }}>
                Manage your catalog, track income, and build your reputation — all in one place.
              </p>
            </div>
            <button
              onClick={() => setActiveTab?.('catalog')}
              style={{ background: '#F97316', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', width: '100%', transition: 'background .15s', boxShadow: '0 2px 8px rgba(249,115,22,0.4)' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#EA580C')}
              onMouseLeave={e => (e.currentTarget.style.background = '#F97316')}
            >
              Explore Features →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPanel;
