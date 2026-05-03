/**
 * Vertical Slice Architecture — Appointment Feature
 *
 * Re-exports the appointment service and types as a cohesive feature module.
 * All appointment-related API calls, types, and components live under features/appointment/.
 */
export { appointmentService, type Appointment } from '../../services/appointmentService';
export { default as AppointmentsPanel } from '../../pages/barber/components/AppointmentsPanel';
