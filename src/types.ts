export type TransactionType = 'earning' | 'expense' | 'refund' | 'due';

export type TourStatus = 'planning' | 'registration_open' | 'ongoing' | 'completed' | 'archived';

export type TransportType = 'bus' | 'train' | 'flight' | 'mixed';

export type RefundStatus = 'not_refunded' | 'partially_refunded' | 'fully_refunded';

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  tourId: string;
  tourName: string;
  partyName: string; // Passenger or Vendor
  category: string;
  amount: number;
  date: string;
  paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer' | 'Pending';
  notes?: string;
  status: 'completed' | 'pending';
}

export interface Tour {
  id: string;
  name: string;
  code: string;
  destination: string;
  startDate: string;
  endDate: string;
  defaultFee: number;
  budget: number;
  status: TourStatus;
  transportType?: TransportType;
  trainNumber?: string;
  trainName?: string;
  boardingStation?: string;
  destinationStation?: string;
  notes?: string;
}

export type GenderType = 'Male' | 'Female' | 'Other';

export type SeatType = 
  | 'Sleeper Class (SL)' 
  | 'AC Three-Tier (3AC)' 
  | 'AC Two-Tier (2AC)' 
  | 'Executive Anubhuti (EA)' 
  | 'Executive Chair Car (EC)' 
  | 'First Class AC (1A)' 
  | 'AC Chair Car (CC)' 
  | 'None';

export const SEAT_TYPE_OPTIONS: SeatType[] = [
  'Sleeper Class (SL)',
  'AC Three-Tier (3AC)',
  'AC Two-Tier (2AC)',
  'Executive Anubhuti (EA)',
  'Executive Chair Car (EC)',
  'First Class AC (1A)',
  'AC Chair Car (CC)',
  'None',
];

export type BerthPreference = 
  | 'No Preference'
  | 'Lower Berth (LB)'
  | 'Middle Berth (MB)'
  | 'Upper Berth (UB)'
  | 'Side Lower (SL)'
  | 'Side Upper (SU)'
  | 'Window Seat (WS)';

export const BERTH_PREFERENCE_OPTIONS: BerthPreference[] = [
  'No Preference',
  'Lower Berth (LB)',
  'Middle Berth (MB)',
  'Upper Berth (UB)',
  'Side Lower (SL)',
  'Side Upper (SU)',
  'Window Seat (WS)',
];

export type CoachType = 'sleeper' | '3ac' | '2ac' | '1ac' | 'cc' | 'bus';

export interface VehicleConfig {
  id: string;
  tourName: string;
  vehicleName: string;
  vehicleType?: 'bus' | 'train';
  trainNumber?: string;
  trainName?: string;
  coachType?: CoachType;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  totalSeats: number;
  layout: '2x2' | '2x1' | 'train_sleeper' | 'train_3ac' | 'train_2ac' | 'train_cc';
}

export interface PassengerRegistration {
  id: string;
  registrationNumber: string;
  fullName: string;
  leaderName?: string;
  gender?: GenderType;
  age?: number;
  dateOfBirth?: string;
  phoneNumber: string;
  whatsappNumber?: string;
  emergencyPhone?: string;
  bloodGroup?: string;
  address?: string;
  tourName: string;
  registrationDate: string;
  agreedFee: number;
  paidAmount: number;
  dueAmount: number;
  refundAmount?: number;
  refundStatus?: RefundStatus;
  refundReason?: string;
  refundDate?: string;
  refundMethod?: 'Cash' | 'UPI' | 'Bank Transfer';
  paymentMethod: 'Cash' | 'UPI' | 'Bank Transfer';
  seatNumber?: string;
  seatType?: SeatType;
  vehicleName?: string;
  pnrNumber?: string;
  berthPreference?: BerthPreference | string;
  boardingStation?: string;
  boarded?: boolean;
  notes?: string;
  status: 'paid' | 'partial' | 'unpaid' | 'refunded';
}
