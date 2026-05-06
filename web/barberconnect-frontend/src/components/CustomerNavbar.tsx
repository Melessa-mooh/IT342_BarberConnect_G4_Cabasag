/**
 * CustomerNavbar — single shared navbar for all customer-facing pages.
 * Import this once in each page and remove any page-level headers.
 */
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface CustomerNavbarProps {
  /** Optional: controlled search value (pass from parent if you need filtering) */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Whether to show the search bar (default: true) */
  showSearch?: boolean;
}

const CustomerNavbar: React.FC<CustomerNavbarProps> = ({
  searchValue = '',
  onSearchChange,
  showSearch = true,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: '#fff',
      borderBottom: '1px solid #E5E7EB',
      boxShadow: '0 1px 8px rgba(0,0,0,0.06)',
      height: 60,
      display: 'flex',
      alignItems: 'center',
    }}>
      <div style={{
        maxWidth: 1280,
        width: '100%',
        margin: '0 auto',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.25rem',
      }}>

        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
          <div style={{
            width: 32, height: 32, background: '#F97316', borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 16, fontWeight: 800,
            boxShadow: '0 2px 8px rgba(249,115,22,0.35)',
          }}>
            ✂
          </div>
          <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
            BarberConnect
          </span>
        </Link>

        {/* ── Search ───────────────────────────────────────────────────── */}
        {showSearch && (
          <div style={{ flex: 1, maxWidth: 420, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', display: 'flex', pointerEvents: 'none' }}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search barbers or styles…"
              value={searchValue}
              onChange={e => onSearchChange?.(e.target.value)}
              style={{
                width: '100%', height: 38,
                background: '#F5F7FB', border: '1px solid #E5E7EB',
                borderRadius: 20, padding: '0 14px 0 38px',
                fontSize: 13.5, color: '#374151', outline: 'none',
                transition: 'border-color .15s, box-shadow .15s',
                fontFamily: 'inherit',
              }}
              onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)'; e.target.style.background = '#fff'; }}
              onBlur={e  => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F5F7FB'; }}
            />
          </div>
        )}

        {/* ── Nav links ────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>

          {/* Dashboard */}
          <NavLink to="/dashboard" active={isActive('/dashboard')} label="Dashboard">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 18, height: 18 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </NavLink>

          {/* Bookings — only for customers */}
          {user?.role === 'CUSTOMER' && (
            <NavLink to="/booking" active={isActive('/booking')} label="Bookings">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 18, height: 18 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </NavLink>
          )}

          {/* Profile */}
          <NavLink to="/profile" active={isActive('/profile')} label="Profile">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 18, height: 18 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </NavLink>

          {/* Divider */}
          <div style={{ width: 1, height: 24, background: '#E5E7EB', margin: '0 6px' }} />

          {/* Sign out */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', border: '1px solid #E5E7EB',
              borderRadius: 8, background: '#fff', color: '#6B7280',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all .15s', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#EF4444'; (e.currentTarget as HTMLButtonElement).style.color = '#EF4444'; (e.currentTarget as HTMLButtonElement).style.background = '#FEF2F2'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB'; (e.currentTarget as HTMLButtonElement).style.color = '#6B7280'; (e.currentTarget as HTMLButtonElement).style.background = '#fff'; }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 15, height: 15 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
};

// ── Small helper: nav link with icon + label + active underline ───────────────
const NavLink: React.FC<{
  to: string; active: boolean; label: string; children: React.ReactNode;
}> = ({ to, active, label, children }) => (
  <Link
    to={to}
    style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
      padding: '6px 14px', borderRadius: 10, textDecoration: 'none',
      color: active ? '#F97316' : '#6B7280',
      fontSize: 11, fontWeight: 600,
      position: 'relative', transition: 'color .15s, background .15s',
    }}
    onMouseEnter={e => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = '#F5F7FB'; }}
    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
  >
    <span style={{ color: active ? '#F97316' : '#9CA3AF', display: 'flex', transition: 'color .15s' }}>
      {children}
    </span>
    <span>{label}</span>
    {active && (
      <span style={{
        position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)',
        width: 20, height: 2, background: '#F97316', borderRadius: 2,
      }} />
    )}
  </Link>
);

export default CustomerNavbar;
