import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/bookingService';
import type { CreateAppointmentRequest } from '../../services/bookingService';
import './BookingPage.css';

interface HaircutStyle {
  id: string;
  name: string;
  price: number;
  image: string;
}

interface AdditionalService {
  id: string;
  name: string;
  price: number;
  selected: boolean;
}

const BookingPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isBooking, setIsBooking] = useState(false);
  
  const [selectedBarber] = useState({
    id: '1',
    name: 'Marcus Johnson',
    specialties: 'Fade, Beard Trim, Classic Cut',
    experience: '5 years experience'
  });

  const [selectedStyle, setSelectedStyle] = useState<HaircutStyle | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'gcash'>('cash');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const [additionalServices, setAdditionalServices] = useState<AdditionalService[]>([
    { id: '1', name: 'Beard Trim', price: 10, selected: false },
    { id: '2', name: 'Hot Towel Shave', price: 15, selected: false },
    { id: '3', name: 'Hair Coloring', price: 35, selected: false },
    { id: '4', name: 'Scalp Treatment', price: 20, selected: false },
    { id: '5', name: 'Hair Styling', price: 12, selected: false }
  ]);

  const haircutStyles: HaircutStyle[] = [
    { id: '1', name: 'Classic Fade', price: 25, image: '/api/placeholder/150/150' },
    { id: '2', name: 'Modern Pompadour', price: 30, image: '/api/placeholder/150/150' }
  ];
  
  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM',
    '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setAdditionalServices(prev =>
      prev.map(service =>
        service.id === serviceId
          ? { ...service, selected: !service.selected }
          : service
      )
    );
  };

  const calculateTotal = () => {
    const stylePrice = selectedStyle?.price || 0;
    const servicesPrice = additionalServices
      .filter(service => service.selected)
      .reduce((total, service) => total + service.price, 0);
    return stylePrice + servicesPrice;
  };

  const handleContinueBooking = async () => {
    if (!selectedStyle || !selectedDate || !selectedTime) {
      alert('Please complete all required fields');
      return;
    }
    
    // Combine selectedDate and selectedTime
    const timeMatch = selectedTime.match(/(\d+):(\d+)\s(AM|PM)/);
    const dateCopy = new Date(selectedDate);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3];
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      dateCopy.setHours(hours, minutes, 0, 0);
    }
    
    setIsBooking(true);
    try {
      const request: CreateAppointmentRequest = {
        customerId: user?.firebaseUid || 'temp-user-id',
        barberProfileId: selectedBarber.id,
        haircutStyleId: selectedStyle.id,
        appointmentDateTime: dateCopy.toISOString(),
        totalPrice: calculateTotal(),
        paymentMethod: paymentMethod === 'gcash' ? 'DIGITAL_WALLET' : 'CASH',
        selectedOptionIds: additionalServices.filter(s => s.selected).map(s => s.id)
      };
      
      await bookingService.createAppointment(request);
      alert('Booking confirmed!');
      navigate('/dashboard');
    } catch (e: any) {
      alert('Failed to save booking. Make sure your local Backend Server is running.');
      console.error(e);
    } finally {
      setIsBooking(false);
    }
  };

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isSameDate = (date1: Date | null, date2: Date) => {
    if (!date1) return false;
    return date1.toDateString() === date2.toDateString();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isDisabled = isDateDisabled(date);
      const isSelected = isSameDate(selectedDate, date);

      days.push(
        <button
          key={day}
          className={`calendar-day ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => !isDisabled && setSelectedDate(date)}
          disabled={isDisabled}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="booking-page">
      {/* Navigation Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">✂</span>
            <span className="logo-text">BarberConnect</span>
          </div>
          <nav className="header-nav">
            <Link to="/dashboard" className="nav-btn">🏠 Dashboard</Link>
            <Link to="/booking" className="nav-btn">📅 My Bookings</Link>
            <Link to="/profile" className="nav-btn">👤 Profile</Link>
            <button className="nav-btn logout-btn" onClick={handleLogout}>
              🚪 Logout
            </button>
          </nav>
        </div>
      </header>

      <main className="booking-main">
        <div className="booking-container">
          {/* Header */}
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
              {/* Selected Barber */}
              <section className="form-section">
                <h2>Selected Barber</h2>
                <div className="barber-card">
                  <div className="barber-avatar">
                    <img src="/api/placeholder/60/60" alt={selectedBarber.name} />
                  </div>
                  <div className="barber-info">
                    <h3>{selectedBarber.name}</h3>
                    <p>{selectedBarber.specialties}</p>
                    <span>{selectedBarber.experience}</span>
                  </div>
                </div>
              </section>

              {/* Select Haircut Style */}
              <section className="form-section">
                <h2>Select Haircut Style</h2>
                <div className="haircut-styles">
                  {haircutStyles.map((style) => (
                    <div
                      key={style.id}
                      className={`style-card ${selectedStyle?.id === style.id ? 'selected' : ''}`}
                      onClick={() => setSelectedStyle(style)}
                    >
                      <img src={style.image} alt={style.name} />
                      <h4>{style.name}</h4>
                      <span>${style.price}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Additional Styling Options */}
              <section className="form-section">
                <h2>Additional Styling Options</h2>
                <div className="additional-services">
                  {additionalServices.map((service) => (
                    <div key={service.id} className="service-item">
                      <label className="service-label">
                        <input
                          type="checkbox"
                          checked={service.selected}
                          onChange={() => handleServiceToggle(service.id)}
                        />
                        <span className="checkmark"></span>
                        <span className="service-name">{service.name}</span>
                      </label>
                      <span className="service-price">+${service.price}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Select Date */}
              <section className="form-section">
                <h2>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
                    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Select Date
                </h2>
                <div className="calendar-container">
                  <div className="calendar-header">
                    <button 
                      className="calendar-nav-btn"
                      onClick={() => navigateMonth('prev')}
                      type="button"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <h3 className="calendar-month">{getMonthName(currentMonth)}</h3>
                    <button 
                      className="calendar-nav-btn"
                      onClick={() => navigateMonth('next')}
                      type="button"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="calendar-weekdays">
                    <div className="weekday">Sun</div>
                    <div className="weekday">Mon</div>
                    <div className="weekday">Tue</div>
                    <div className="weekday">Wed</div>
                    <div className="weekday">Thu</div>
                    <div className="weekday">Fri</div>
                    <div className="weekday">Sat</div>
                  </div>
                  
                  <div className="calendar-grid">
                    {renderCalendar()}
                  </div>
                  
                  {selectedDate && (
                    <div className="selected-date-display">
                      Selected: {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                  )}
                </div>
              </section>

              {/* Select Time */}
              <section className="form-section">
                <h2>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Select Time
                </h2>
                <div className="time-selector">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      className={`time-btn ${selectedTime === time ? 'selected' : ''}`}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </section>

              {/* Payment Method */}
              <section className="form-section">
                <h2>Payment Method</h2>
                <div className="payment-methods">
                  <button
                    className={`payment-btn ${paymentMethod === 'cash' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                      <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2"/>
                      <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Cash
                  </button>
                  <button
                    className={`payment-btn ${paymentMethod === 'gcash' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('gcash')}
                  >
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

            {/* Booking Summary */}
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

              {additionalServices.filter(s => s.selected).map(service => (
                <div key={service.id} className="summary-item">
                  <span className="label">{service.name}</span>
                  <span className="value">+${service.price}</span>
                </div>
              ))}

              <div className="summary-item">
                <span className="label">Payment Method</span>
                <span className="value">{paymentMethod === 'cash' ? 'Cash' : 'E-Cash'}</span>
              </div>

              <div className="summary-total">
                <span className="label">Total</span>
                <span className="value">${calculateTotal()}</span>
              </div>

              <button 
                className="continue-btn"
                onClick={handleContinueBooking}
                disabled={!selectedStyle || !selectedDate || !selectedTime || isBooking}
              >
                {isBooking ? 'Booking...' : 'Continue Booking'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BookingPage;