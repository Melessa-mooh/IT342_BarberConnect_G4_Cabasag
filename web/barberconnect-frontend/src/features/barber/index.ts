/**
 * Vertical Slice Architecture — Barber Feature
 *
 * Barrel module grouping all barber dashboard services and panel components.
 */
export { barberService, type Barber } from '../../services/barberService';
export { incomeService, leaveService, type IncomeRecord, type LeaveRequest } from '../../services/barberFeatureService';
export { default as OverviewPanel } from '../../pages/barber/components/OverviewPanel';
export { default as IncomePanel } from '../../pages/barber/components/IncomePanel';
