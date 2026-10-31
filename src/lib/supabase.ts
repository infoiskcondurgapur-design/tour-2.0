import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Tour, PassengerRegistration, FinancialTransaction } from '../types';

const DEFAULT_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mjwmheedvdabxhsihixc.supabase.co';
const DEFAULT_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJqa3Z2ZmJ6eHByYnF4b2RkdHZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNTc5ODUsImV4cCI6MjEwNzYzMzk4NX0.58r4Q9clZ6XMP8vg0j0S2Q4NMwZ5UcnvzqNyiAwPuaU';

let cachedClient: SupabaseClient | null = null;
let currentClientKey = '';

export function getActiveSupabaseConfig() {
  const customUrl = typeof window !== 'undefined' ? localStorage.getItem('tour_supabase_custom_url') : null;
  const customKey = typeof window !== 'undefined' ? localStorage.getItem('tour_supabase_custom_key') : null;

  return {
    url: customUrl?.trim() || DEFAULT_URL,
    key: customKey?.trim() || DEFAULT_KEY,
    isCustom: Boolean(customUrl && customKey),
  };
}

export function getActiveSupabaseClient(): SupabaseClient | null {
  const { url, key } = getActiveSupabaseConfig();
  if (!url || !key) return null;

  const keyCombo = `${url}::${key}`;
  if (cachedClient && currentClientKey === keyCombo) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 10 } }
    });
    currentClientKey = keyCombo;
    return cachedClient;
  } catch (e) {
    console.error('Failed to create Supabase client:', e);
    return null;
  }
}

export const isSupabaseConfigured = Boolean(DEFAULT_URL && DEFAULT_KEY);
export const supabase = getActiveSupabaseClient();

export function setCustomSupabaseCredentials(url: string, key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('tour_supabase_custom_url', url.trim());
    localStorage.setItem('tour_supabase_custom_key', key.trim());
  }
  cachedClient = null;
  currentClientKey = '';
}

export function clearCustomSupabaseCredentials() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tour_supabase_custom_url');
    localStorage.removeItem('tour_supabase_custom_key');
  }
  cachedClient = null;
  currentClientKey = '';
}

// =========================================================================
// Mappers: Domain <-> DB Rows
// =========================================================================

export function tourToDb(t: Tour) {
  return {
    id: t.id,
    name: t.name,
    code: t.code,
    destination: t.destination,
    start_date: t.startDate,
    end_date: t.endDate,
    default_fee: t.defaultFee,
    budget: t.budget,
    status: t.status,
    notes: t.notes || null,
    updated_at: new Date().toISOString(),
  };
}

export function tourFromDb(r: any): Tour {
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    destination: r.destination,
    startDate: r.start_date,
    endDate: r.end_date,
    defaultFee: Number(r.default_fee || 0),
    budget: Number(r.budget || 0),
    status: r.status,
    notes: r.notes || undefined,
  };
}

export function regToDb(p: PassengerRegistration) {
  return {
    id: p.id,
    registration_number: p.registrationNumber,
    full_name: p.fullName,
    gender: p.gender || null,
    age: p.age ?? null,
    date_of_birth: p.dateOfBirth || null,
    phone_number: p.phoneNumber,
    whatsapp_number: p.whatsappNumber || null,
    address: p.address || null,
    tour_name: p.tourName,
    registration_date: p.registrationDate,
    agreed_fee: p.agreedFee,
    paid_amount: p.paidAmount,
    due_amount: p.dueAmount,
    refund_amount: p.refundAmount ?? 0,
    refund_status: p.refundStatus || 'not_refunded',
    refund_reason: p.refundReason || null,
    refund_date: p.refundDate || null,
    refund_method: p.refundMethod || null,
    payment_method: p.paymentMethod,
    seat_number: p.seatNumber || null,
    vehicle_name: p.vehicleName || null,
    notes: p.notes || null,
    status: p.status,
    updated_at: new Date().toISOString(),
  };
}

export function regFromDb(r: any): PassengerRegistration {
  return {
    id: r.id,
    registrationNumber: r.registration_number,
    fullName: r.full_name,
    gender: r.gender || undefined,
    age: r.age !== null ? Number(r.age) : undefined,
    dateOfBirth: r.date_of_birth || undefined,
    phoneNumber: r.phone_number,
    whatsappNumber: r.whatsapp_number || undefined,
    address: r.address || undefined,
    tourName: r.tour_name,
    registrationDate: r.registration_date,
    agreedFee: Number(r.agreed_fee || 0),
    paidAmount: Number(r.paid_amount || 0),
    dueAmount: Number(r.due_amount || 0),
    refundAmount: r.refund_amount ? Number(r.refund_amount) : undefined,
    refundStatus: r.refund_status || undefined,
    refundReason: r.refund_reason || undefined,
    refundDate: r.refund_date || undefined,
    refundMethod: r.refund_method || undefined,
    paymentMethod: r.payment_method || 'Cash',
    seatNumber: r.seat_number || undefined,
    vehicleName: r.vehicle_name || undefined,
    notes: r.notes || undefined,
    status: r.status || 'unpaid',
  };
}

export function txToDb(t: FinancialTransaction) {
  return {
    id: t.id,
    type: t.type,
    tour_id: t.tourId,
    tour_name: t.tourName,
    party_name: t.partyName,
    category: t.category,
    amount: t.amount,
    date: t.date,
    payment_method: t.paymentMethod,
    notes: t.notes || null,
    status: t.status,
    updated_at: new Date().toISOString(),
  };
}

export function txFromDb(r: any): FinancialTransaction {
  return {
    id: r.id,
    type: r.type,
    tourId: r.tour_id,
    tourName: r.tour_name,
    partyName: r.party_name,
    category: r.category,
    amount: Number(r.amount || 0),
    date: r.date,
    paymentMethod: r.payment_method,
    notes: r.notes || undefined,
    status: r.status,
  };
}

// =========================================================================
// Database Services
// =========================================================================

export async function fetchToursFromDb(): Promise<Tour[] | null> {
  const client = getActiveSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from('tour_tours').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Supabase fetch tours error:', error.message);
      return null;
    }
    return (data || []).map(tourFromDb);
  } catch (err) {
    console.warn('Network error fetching tours:', err);
    return null;
  }
}

export async function upsertTourInDb(tour: Tour): Promise<boolean> {
  const client = getActiveSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('tour_tours').upsert(tourToDb(tour), { onConflict: 'id' });
    if (error) {
      console.error('Supabase upsert tour error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Network error saving tour:', err);
    return false;
  }
}

export async function deleteTourFromDb(tourId: string): Promise<boolean> {
  const client = getActiveSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('tour_tours').delete().eq('id', tourId);
    if (error) {
      console.error('Supabase delete tour error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Network error deleting tour:', err);
    return false;
  }
}

export async function fetchRegistrationsFromDb(): Promise<PassengerRegistration[] | null> {
  const client = getActiveSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from('tour_registrations').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Supabase fetch registrations error:', error.message);
      return null;
    }
    return (data || []).map(regFromDb);
  } catch (err) {
    console.warn('Network error fetching registrations:', err);
    return null;
  }
}

export async function upsertRegistrationInDb(reg: PassengerRegistration): Promise<boolean> {
  const client = getActiveSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('tour_registrations').upsert(regToDb(reg), { onConflict: 'id' });
    if (error) {
      console.error('Supabase upsert registration error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Network error saving registration:', err);
    return false;
  }
}

export async function deleteRegistrationFromDb(regId: string): Promise<boolean> {
  const client = getActiveSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('tour_registrations').delete().eq('id', regId);
    if (error) {
      console.error('Supabase delete registration error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Network error deleting registration:', err);
    return false;
  }
}

export async function fetchTransactionsFromDb(): Promise<FinancialTransaction[] | null> {
  const client = getActiveSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client.from('tour_transactions').select('*').order('created_at', { ascending: false });
    if (error) {
      console.warn('Supabase fetch transactions error:', error.message);
      return null;
    }
    return (data || []).map(txFromDb);
  } catch (err) {
    console.warn('Network error fetching transactions:', err);
    return null;
  }
}

export async function upsertTransactionInDb(tx: FinancialTransaction): Promise<boolean> {
  const client = getActiveSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('tour_transactions').upsert(txToDb(tx), { onConflict: 'id' });
    if (error) {
      console.error('Supabase upsert transaction error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Network error saving transaction:', err);
    return false;
  }
}

export async function deleteTransactionFromDb(txId: string): Promise<boolean> {
  const client = getActiveSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('tour_transactions').delete().eq('id', txId);
    if (error) {
      console.error('Supabase delete transaction error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Network error deleting transaction:', err);
    return false;
  }
}

// Batch delete transactions by tourName and partyName (used when a pilgrim is deleted)
export async function deleteTransactionsForPassengerInDb(tourName: string, passengerName: string): Promise<boolean> {
  const client = getActiveSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client
      .from('tour_transactions')
      .delete()
      .eq('tour_name', tourName)
      .eq('party_name', passengerName);
    if (error) {
      console.warn('Supabase delete passenger transactions error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Network error deleting passenger transactions:', err);
    return false;
  }
}
