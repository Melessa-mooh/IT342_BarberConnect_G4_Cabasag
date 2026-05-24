import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentService } from '../../services/appointmentService';
import { barberService } from '../../services/barberService';
import api from '../../services/api';
import CustomerNavbar from '../../components/CustomerNavbar';
import { getHaircutImage, setHaircutImageFallback } from '../../utils/haircutImages';
import './BookingPage.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface HaircutStyle {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface AddOnItem {
  id: string;
  name: string;
  price: number;
  selected: boolean;
}

interface AddOnCategory {
  category: string;
  items: AddOnItem[];
}

// ─── Component ────────────────────────────────────────────────────────────────

const BookingPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedBarber] = useState(() => {
    if (location.state?.selectedBarber) return location.state.selectedBarber;
    return null; // No fake fallback — prevents 400 errors on /barbers/public/1
  });

  const [selectedStyle,       setSelectedStyle]       = useState<HaircutStyle | null>(null);
  const [selectedDate,        setSelectedDate]        = useState<Date | null>(null);
  const [selectedTime,        setSelectedTime]        = useState<string>('');
  const [paymentMethod,       setPaymentMethod]       = useState<'cash' | 'gcash'>('cash');
  const [currentMonth,        setCurrentMonth]        = useState(new Date());

  const [haircutStyles,       setHaircutStyles]       = useState<HaircutStyle[]>([]);
  const [loadingStyles,       setLoadingStyles]       = useState(false);
  const [bookedSlots,         setBookedSlots]         = useState<string[]>([]);
  const [approvedLeaveDates,  setApprovedLeaveDates]  = useState<string[]>([]);

  // Global add-on categories from backend
  const [addOnCategories,     setAddOnCategories]     = useState<AddOnCategory[]>([]);
  const [loadingAddOns,       setLoadingAddOns]       = useState(false);
  const [expandedCategories,  setExpandedCategories]  = useState<Record<string, boolean>>({});

  // ── Fetch barber's haircut styles + leave dates ──────────────────────────────
  useEffect(() => {
    if (!selectedBarber?.id) return;
    const run = async () => {
      setLoadingStyles(true);
      try {
        const res = await api.get(`/haircuts/barber/${selectedBarber.id}`);
        const styles = res.data?.data ?? [];
        setHaircutStyles(styles.map((s: any) => ({
          id:    s.haircut_style_id,
          name:  s.name,
          price: s.basePrice ?? s.base_price ?? 0,
          image: getHaircutImage({ name: s.name, imageUrl: s.imageUrl }),
        })));
        const leaveDates = await barberService.getApprovedLeaveDates(selectedBarber.id);
        setApprovedLeaveDates(leaveDates);
      } catch (e) {
        console.error('Failed to fetch styles:', e);
        setHaircutStyles([]);
      } finally {
        setLoadingStyles(false);
      }
    };
    run();
  }, [selectedBarber]);

  // ── Fetch global add-on categories once on mount ─────────────────────────────
  useEffect(() => {
    const run = async () => {
      setLoadingAddOns(true);
      try {
        const res = await api.get('/addons');
        const cats: any[] = res.data?.data ?? [];
        const mapped: AddOnCategory[] = cats.map((cat: any) => ({
          category: cat.category,
          items: (cat.items ?? []).map((item: any) => ({
            id:       item.id,
            name:     item.name,
            price:    item.price,
            selected: false,
          })),
        }));
        setAddOnCategories(mapped);
        // Expand first category by default
        if (mapped.length > 0) {
          setExpandedCategories({ [mapped[0].category]: true });
        }
      } catch (e) {
        console.error('Failed to fetch add-ons:', e);
      } finally {
        setLoadingAddOns(false);
      }
    };
    run();
  }, []);

  // ── Fetch booked slots when date changes ─────────────────────────────────────
  useEffect(() => {
    if (!selectedBarber?.id || !selectedDate) return;
    const run = async () => {
      try {
        const res = await api.get(`/appointments/barber/${selectedBarber.id}`);
        const appointments: any[] = res.data?.data ?? [];
        const selectedDateStr = new Date(selectedDate).toLocaleDateString('en-CA');
        const booked = appointments
          .filter(apt => apt.status !== 'CANCELLED' &&
            new Date(apt.appointmentDateTime).toLocaleDateString('en-CA') === selectedDateStr)
          .map(apt =>
            new Date(apt.appointmentDateTime).toLocaleTimeString('en-US', {
              hour: 'numeric', minute: '2-digit', hour12: true,
            })
          );
        setBookedSlots(booked);
      } catch (e) {
        console.error('Failed to fetch booked slots:', e);
        setBookedSlots([]);
      }
    };
    run();
  }, [selectedBarber, selectedDate]);

  // ── Helpers ───────────────────────────────────────────────────────────────────

  // Guard: if no barber was passed, redirect back to dashboard
  if (!selectedBarber) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F5F7FB', gap: 16 }}>
        <p style={{ fontSize: 16, color: '#6B7280' }}>No barber selected. Please choose a barber first.</p>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: '#F97316', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM',
  ];

  const toggleAddOn = (categoryName: string, itemId: string) => {
    setAddOnCategories(prev =>
      prev.map(cat =>
        cat.category === categoryName
          ? { ...cat, items: cat.items.map(i => i.id === itemId ? { ...i, selected: !i.selected } : i) }
          : cat
      )
    );
  };

  const toggleCategory = (name: string) =>
    setExpandedCategories(prev => ({ ...prev, [name]: !prev[name] }));

  const getAllSelectedAddOns = (): AddOnItem[] =>
    addOnCategories.flatMap(cat => cat.items.filter(i => i.selected));

  const calculateTotal = () => {
    const base    = selectedStyle?.price ?? 0;
    const addOns  = getAllSelectedAddOns().reduce((s, i) => s + i.price, 0);
    return base + addOns;
  };

  const handleContinueBooking = async () => {
    if (!selectedStyle || !selectedDate || !selectedTime) {
      alert('Please complete all required fields'); return;
    }
    if (!user) { alert('Please log in to book an appointment.'); return; }

    try {
      setIsSubmitting(true);
      const [timeStr, period] = selectedTime.split(' ');
      const [hoursStr, minutes] = timeStr.split(':');
      let hours = parseInt(hoursStr, 10);
      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(hours, parseInt(minutes, 10), 0, 0);

      await appointmentService.bookAppointment({
        customerId:          user.firebaseUid,
        barberProfileId:     selectedBarber.id,
        haircutStyleId:      selectedStyle.id,
        appointmentDateTime: appointmentDate.toISOString(),
        totalPrice:          calculateTotal(),
        paymentMethod:       paymentMethod === 'gcash' ? 'DIGITAL_WALLET' : 'CASH',
        selectedOptionIds:   getAllSelectedAddOns().map(i => i.id),
      });

      alert('Booking confirmed!');
      // Navigate back to dashboard with refresh flag so calendar updates
      navigate('/dashboard', { state: { refreshCalendar: true } });
    } catch (error: any) {
      console.error('Booking failed:', error);
      alert(error.message || 'Failed to book appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Calendar helpers ──────────────────────────────────────────────────────────

  const getDaysInMonth  = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1).getDay();
  const getMonthName    = (d: Date) => d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const isDateDisabled = (date: Date) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (date < today) return true;
    return approvedLeaveDates.includes(date.toLocaleDateString('en-CA'));
  };

  const isSameDate = (d1: Date | null, d2: Date) =>
    !!d1 && d1.toDateString() === d2.toDateString();

  const navigateMonth = (dir: 'prev' | 'next') =>
    setCurrentMonth(prev => {
      const n = new Date(prev);
      n.setMonth(prev.getMonth() + (dir === 'next' ? 1 : -1));
      return n;
    });

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay    = getFirstDayOfMonth(currentMonth);
    const days: React.ReactNode[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`e-${i}`} className="calendar-day empty" />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date     = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const disabled = isDateDisabled(date);
      const selected = isSameDate(selectedDate, date);
      const isLeave  = approvedLeaveDates.includes(date.toLocaleDateString('en-CA'));
      days.push(
        <button
          key={day}
          className={`calendar-day ${disabled ? 'disabled' : ''} ${selected ? 'selected' : ''} ${isLeave ? 'leave-day' : ''}`}
          onClick={() => !disabled && setSelectedDate(date)}
          disabled={disabled}
          title={isLeave ? 'Barber is on leave this day' : ''}
        >
          {day}
          {isLeave && <span className="leave-indicator">🚫</span>}
        </button>
      );
    }
    return days;
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  const selectedAddOns = getAllSelectedAddOns();

  return (
    <div className="booking-page">
      {/* ── Single shared navbar ── */}
      <CustomerNavbar showSearch={false} />

      <main className="booking-main">
        <div className="booking-container">
          <div className="booking-header">
            <button className="back-btn" onClick={() => navigate('/dashboard')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back
            </button>
            <h1>Book Appointment</h1>
          </div>

          <div className="booking-content">
            <div className="booking-form">

              {/* ── Selected Barber ─────────────────────────────────────────── */}
              <section className="form-section">
                <h2>Selected Barber</h2>
                <div className="barber-card">
                  <div className="barber-avatar">
                    <img 
                      src={selectedBarber.profileImageUrl || '/api/placeholder/60/60'} 
                      alt={selectedBarber.name}
                      onError={(e) => { (e.target as HTMLImageElement).src = '/api/placeholder/60/60'; }}
                      style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  </div>
                  <div className="barber-info">
                    <h3>{selectedBarber.name}</h3>
                    <p>{selectedBarber.specialties}</p>
                    <span>{selectedBarber.experience}</span>
                  </div>
                </div>
              </section>

              {/* ── Select Haircut Style ────────────────────────────────────── */}
              <section className="form-section">
                <h2>Select Haircut Style</h2>
                <div className="haircut-styles">
                  {loadingStyles ? (
                    <div style={{ padding: '20px', color: '#888' }}>Loading styles...</div>
                  ) : haircutStyles.length === 0 ? (
                    <div style={{ padding: '20px', color: '#888' }}>No styles available for this barber yet.</div>
                  ) : haircutStyles.map(style => (
                    <div
                      key={style.id}
                      className={`style-card ${selectedStyle?.id === style.id ? 'selected' : ''}`}
                      onClick={() => setSelectedStyle(style)}
                    >
                      <img
                        src={style.image}
                        alt={style.name}
                        onError={(event) => setHaircutImageFallback(event, style.name)}
                      />
                      <h4>{style.name}</h4>
                      <span>₱{style.price}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Add-on Services (Global, Categorized) ──────────────────── */}
              <section className="form-section">
                <h2>Add-on Services <span style={{ fontSize: '13px', fontWeight: 400, color: '#888' }}>(Optional)</span></h2>
                <p style={{ fontSize: '13px', color: '#888', marginBottom: '16px', marginTop: '-4px' }}>
                  Enhance your visit with any of these optional services.
                </p>

                {loadingAddOns ? (
                  <p style={{ color: '#888', fontSize: '14px' }}>Loading add-ons...</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {addOnCategories.map(cat => {
                      const isOpen      = !!expandedCategories[cat.category];
                      const selectedCnt = cat.items.filter(i => i.selected).length;
                      return (
                        <div key={cat.category} style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          background: '#fff',
                        }}>
                          {/* Category header */}
                          <button
                            type="button"
                            onClick={() => toggleCategory(cat.category)}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '14px 18px',
                              background: isOpen ? '#FFF8F0' : '#fff',
                              border: 'none',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'background 0.2s',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>
                                {cat.category}
                              </span>
                              {selectedCnt > 0 && (
                                <span style={{
                                  background: '#D2691E',
                                  color: '#fff',
                                  borderRadius: '999px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                }}>
                                  {selectedCnt} selected
                                </span>
                              )}
                            </div>
                            <svg
                              width="18" height="18" viewBox="0 0 24 24" fill="none"
                              style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#D2691E' }}
                            >
                              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>

                          {/* Category items */}
                          {isOpen && (
                            <div style={{ borderTop: '1px solid #f1f5f9' }}>
                              {cat.items.map((item, idx) => (
                                <label
                                  key={item.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 18px',
                                    cursor: 'pointer',
                                    background: item.selected ? '#FFF8F0' : '#fff',
                                    borderTop: idx > 0 ? '1px solid #f8fafc' : 'none',
                                    transition: 'background 0.15s',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <input
                                      type="checkbox"
                                      checked={item.selected}
                                      onChange={() => toggleAddOn(cat.category, item.id)}
                                      style={{
                                        width: '18px',
                                        height: '18px',
                                        accentColor: '#D2691E',
                                        cursor: 'pointer',
                                        flexShrink: 0,
                                      }}
                                    />
                                    <span style={{ fontSize: '14px', color: '#374151', fontWeight: item.selected ? 600 : 400 }}>
                                      {item.name}
                                    </span>
                                  </div>
                                  <span style={{
                                    fontSize: '14px',
                                    fontWeight: 700,
                                    color: item.selected ? '#D2691E' : '#6b7280',
                                    whiteSpace: 'nowrap',
                                    marginLeft: '12px',
                                  }}>
                                    +₱{item.price.toLocaleString()}
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Selected add-ons summary strip */}
                {selectedAddOns.length > 0 && (
                  <div style={{
                    marginTop: '14px',
                    padding: '12px 16px',
                    background: '#FFF8F0',
                    border: '1px solid #D2691E',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#8B4513',
                  }}>
                    <strong>{selectedAddOns.length} add-on{selectedAddOns.length > 1 ? 's' : ''} selected:</strong>{' '}
                    {selectedAddOns.map(i => i.name).join(', ')}
                    {' '}— <strong>+₱{selectedAddOns.reduce((s, i) => s + i.price, 0).toLocaleString()}</strong>
                  </div>
                )}
              </section>

              {/* ── Select Date ─────────────────────────────────────────────── */}
              <section className="form-section">
                <h2>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                    <line x1="8"  y1="2" x2="8"  y2="6" stroke="currentColor" strokeWidth="2"/>
                    <line x1="3"  y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Select Date
                </h2>
                <div className="calendar-container">
                  <div className="calendar-header">
                    <button className="calendar-nav-btn" onClick={() => navigateMonth('prev')} type="button">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <h3 className="calendar-month">{getMonthName(currentMonth)}</h3>
                    <button className="calendar-nav-btn" onClick={() => navigateMonth('next')} type="button">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  <div className="calendar-weekdays">
                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                      <div key={d} className="weekday">{d}</div>
                    ))}
                  </div>
                  <div className="calendar-grid">{renderCalendar()}</div>
                  {selectedDate && (
                    <div className="selected-date-display">
                      Selected: {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  )}
                </div>
              </section>

              {/* ── Select Time ─────────────────────────────────────────────── */}
              <section className="form-section">
                <h2>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Select Time
                </h2>
                {approvedLeaveDates.includes(selectedDate?.toLocaleDateString('en-CA') ?? '') && (
                  <div style={{ padding: '16px', background: '#fee2e2', borderRadius: '8px', color: '#991b1b', fontWeight: '600', marginBottom: '16px' }}>
                    🚫 This barber is on approved leave on this day. Please select a different date.
                  </div>
                )}
                <div className="time-selector">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      className={`time-btn ${selectedTime === time ? 'selected' : ''} ${bookedSlots.includes(time) ? 'booked' : ''}`}
                      onClick={() => { if (!bookedSlots.includes(time)) setSelectedTime(time); }}
                      disabled={bookedSlots.includes(time)}
                      title={bookedSlots.includes(time) ? 'This slot is already booked' : ''}
                    >
                      {time}
                      {bookedSlots.includes(time) && (
                        <span style={{ fontSize: '10px', display: 'block', color: '#999' }}>Booked</span>
                      )}
                    </button>
                  ))}
                </div>
              </section>

              {/* ── Payment Method ──────────────────────────────────────────── */}
              <section className="form-section">
                <h2>Payment Method</h2>
                <div className="payment-methods">
                  <button className={`payment-btn ${paymentMethod === 'cash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cash')}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                      <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2"/>
                      <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Cash
                  </button>
                  <button className={`payment-btn ${paymentMethod === 'gcash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('gcash')}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="5" y="4" width="14" height="16" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                      <line x1="9" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth="2"/>
                      <line x1="9" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    E-Cash
                  </button>
                </div>
              </section>
            </div>

            {/* ── Booking Summary ──────────────────────────────────────────── */}
            <div className="booking-summary">
              <h2>Booking Summary</h2>

              <div className="summary-item">
                <span className="label">Barber</span>
                <span className="value">{selectedBarber.name}</span>
              </div>

              {selectedStyle && (
                <div className="summary-item">
                  <span className="label">Style</span>
                  <span className="value">{selectedStyle.name}</span>
                </div>
              )}

              {selectedStyle && (
                <div className="summary-item">
                  <span className="label">Base Price</span>
                  <span className="value">₱{selectedStyle.price.toLocaleString()}</span>
                </div>
              )}

              {selectedAddOns.length > 0 && (
                <>
                  <div style={{ borderTop: '1px solid #f1f5f9', margin: '8px 0', paddingTop: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Add-ons
                    </span>
                  </div>
                  {selectedAddOns.map(addon => (
                    <div key={addon.id} className="summary-item">
                      <span className="label" style={{ fontSize: '13px' }}>{addon.name}</span>
                      <span className="value" style={{ fontSize: '13px' }}>+₱{addon.price.toLocaleString()}</span>
                    </div>
                  ))}
                </>
              )}

              <div className="summary-item">
                <span className="label">Payment</span>
                <span className="value">{paymentMethod === 'cash' ? 'Cash' : 'E-Cash'}</span>
              </div>

              <div className="summary-total">
                <span className="label">Total</span>
                <span className="value">₱{calculateTotal().toLocaleString()}</span>
              </div>

              <button
                className="continue-btn"
                onClick={handleContinueBooking}
                disabled={!selectedStyle || !selectedDate || !selectedTime || isSubmitting}
              >
                {isSubmitting ? 'Booking...' : 'Continue Booking'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingPage;
