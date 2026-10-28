export type TransactionType = 'earning' | 'expense' | 'refund' | 'due';

export type TourStatus = 'planning' | 'registration_open' | 'ongoing' | 'completed' | 'archived';

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
  notes?: string;
}

export type GenderType = 'Male' | 'Female' | 'Other';

export interface VehicleConfig {
  id: string;
  tourName: string;
  vehicleName: string;
  vehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  totalSeats: number;
  layout: '2x2' | '2x1';
}

export interface PassengerRegistration {
  id: string;
  registrationNumber: string;
  fullName: string;
  gender?: GenderType;
  age?: number;
  dateOfBirth?: string;
  phoneNumber: string;
  whatsappNumber?: string;
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
  vehicleName?: string;
  notes?: string;
  status: 'paid' | 'partial' | 'unpaid' | 'refunded';
}
