import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Tour, PassengerRegistration, FinancialTransaction, SeatType, SEAT_TYPE_OPTIONS } from '../types';

const DEFAULT_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mjwmheedvdabxhsihixc.supabase.co';
const DEFAULT_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qd21oZWVkdmRhYnhoc2loaXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMzNDUxNjEsImV4cCI6MjEwODkyMTE2MX0.BbCnFJy2aIVOFo9i7Yb_KW8_9H4OY5BJgq8KZ4qaeRg';

let cachedClient: SupabaseClient | null = null;
let currentClientKey = '';

export function getActiveSupabaseConfig() {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('tour_supabase_custom_url');
    // Clear old project reference if cached in browser
    if (customUrl && customUrl.includes('bjkvvfbzxprbqxoddtvm')) {
      localStorage.removeItem('tour_supabase_custom_url');
      localStorage.removeItem('tour_supabase_custom_key');
    }
  }

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
  let combinedNotes = t.notes || '';
  if (t.transportType) {
    combinedNotes = combinedNotes.replace(/\|\s*\[Transport:\s*[^\]]+\]/gi, '').replace(/\[Transport:\s*[^\]]+\]/gi, '').trim();
    combinedNotes = combinedNotes ? `${combinedNotes} | [Transport: ${t.transportType}]` : `[Transport: ${t.transportType}]`;
  }
  if (t.trainNumber) {
    combinedNotes = combinedNotes.replace(/\|\s*\[TrainNo:\s*[^\]]+\]/gi, '').replace(/\[TrainNo:\s*[^\]]+\]/gi, '').trim();
    combinedNotes = combinedNotes ? `${combinedNotes} | [TrainNo: ${t.trainNumber}]` : `[TrainNo: ${t.trainNumber}]`;
  }
  if (t.trainName) {
    combinedNotes = combinedNotes.replace(/\|\s*\[TrainName:\s*[^\]]+\]/gi, '').replace(/\[TrainName:\s*[^\]]+\]/gi, '').trim();
    combinedNotes = combinedNotes ? `${combinedNotes} | [TrainName: ${t.trainName}]` : `[TrainName: ${t.trainName}]`;
  }
  if (t.boardingStation) {
    combinedNotes = combinedNotes.replace(/\|\s*\[BoardingStn:\s*[^\]]+\]/gi, '').replace(/\[BoardingStn:\s*[^\]]+\]/gi, '').trim();
    combinedNotes = combinedNotes ? `${combinedNotes} | [BoardingStn: ${t.boardingStation}]` : `[BoardingStn: ${t.boardingStation}]`;
  }
  if (t.destinationStation) {
    combinedNotes = combinedNotes.replace(/\|\s*\[DestStn:\s*[^\]]+\]/gi, '').replace(/\[DestStn:\s*[^\]]+\]/gi, '').trim();
    combinedNotes = combinedNotes ? `${combinedNotes} | [DestStn: ${t.destinationStation}]` : `[DestStn: ${t.destinationStation}]`;
  }

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
    notes: combinedNotes || null,
    updated_at: new Date().toISOString(),
  };
}

export function tourFromDb(r: any): Tour {
  let transportType = r.transport_type || undefined;
  if (!transportType && r.notes) {
    const match = r.notes.match(/\[Transport:\s*([^\]]+)\]/i);
    if (match && match[1]) transportType = match[1].trim();
  }

  let trainNumber = r.train_number || undefined;
  if (!trainNumber && r.notes) {
    const match = r.notes.match(/\[TrainNo:\s*([^\]]+)\]/i);
    if (match && match[1]) trainNumber = match[1].trim();
  }

  let trainName = r.train_name || undefined;
  if (!trainName && r.notes) {
    const match = r.notes.match(/\[TrainName:\s*([^\]]+)\]/i);
    if (match && match[1]) trainName = match[1].trim();
  }

  let boardingStation = r.boarding_station || undefined;
  if (!boardingStation && r.notes) {
    const match = r.notes.match(/\[BoardingStn:\s*([^\]]+)\]/i);
    if (match && match[1]) boardingStation = match[1].trim();
  }

  let destinationStation = r.destination_station || undefined;
  if (!destinationStation && r.notes) {
    const match = r.notes.match(/\[DestStn:\s*([^\]]+)\]/i);
    if (match && match[1]) destinationStation = match[1].trim();
  }

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
    transportType,
    trainNumber,
    trainName,
    boardingStation,
    destinationStation,
    notes: r.notes || undefined,
  };
}

export function regToDb(p: PassengerRegistration) {
  // Strip all legacy and structured metadata tags from p.notes so we get genuine user text
  const baseNotes = (p.notes || '')
    .replace(/(?:^|\s*\|\s*)Seat Type:\s*[^|,\n\]]+/gi, '')
    .replace(/(?:^|\s*\|\s*)\[SeatType:\s*[^\]]+\]/gi, '')
    .replace(/(?:^|\s*\|\s*)Leader(?:'s)?(?:\s*Name)?:\s*[^|,\n\]]+/gi, '')
    .replace(/(?:^|\s*\|\s*)\[Leader:\s*[^\]]+\]/gi, '')
    .replace(/(?:^|\s*\|\s*)\[Boarded:\s*[^\]]+\]/gi, '')
    .replace(/(?:^|\s*\|\s*)\[Emergency:\s*[^\]]+\]/gi, '')
    .replace(/(?:^|\s*\|\s*)\[Blood:\s*[^\]]+\]/gi, '')
    .replace(/(?:^|\s*\|\s*)\[PNR:\s*[^\]]+\]/gi, '')
    .replace(/(?:^|\s*\|\s*)\[Berth:\s*[^\]]+\]/gi, '')
    .replace(/(?:^|\s*\|\s*)\[Station:\s*[^\]]+\]/gi, '')
    .replace(/^[\s|]+|[\s|]+$/g, '')
    .trim();

  const parts: string[] = [];

  // Structured tags in a clear, consistent order:
  if (p.seatType && p.seatType !== 'None') {
    parts.push(`Seat Type: ${p.seatType}`);
  }
  if (p.leaderName) {
    parts.push(`Leader's Name: ${p.leaderName}`);
  }
  if (baseNotes) {
    parts.push(baseNotes);
  }
  if (p.boarded) {
    parts.push('[Boarded: true]');
  }
  if (p.emergencyPhone) {
    parts.push(`[Emergency: ${p.emergencyPhone}]`);
  }
  if (p.bloodGroup) {
    parts.push(`[Blood: ${p.bloodGroup}]`);
  }
  if (p.pnrNumber) {
    parts.push(`[PNR: ${p.pnrNumber}]`);
  }
  if (p.berthPreference) {
    parts.push(`[Berth: ${p.berthPreference}]`);
  }
  if (p.boardingStation) {
    parts.push(`[Station: ${p.boardingStation}]`);
  }

  const combinedNotes = parts.join(' | ') || null;

  return {
    id: p.id,
    registration_number: p.registrationNumber,
    full_name: p.fullName,
    leader_name: p.leaderName || null,
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
    seat_type: p.seatType || 'None',
    vehicle_name: p.vehicleName || null,
    notes: combinedNotes,
    status: p.status,
    updated_at: new Date().toISOString(),
  };
}

export function regFromDb(r: any): PassengerRegistration {
  const notesStr = r.notes || '';

  // Extract seatType from r.seat_type or parse from notes as fallback
  let seatType: SeatType = 'None';
  if (r.seat_type && r.seat_type !== 'None' && SEAT_TYPE_OPTIONS.includes(r.seat_type)) {
    seatType = r.seat_type;
  } else if (notesStr) {
    const match = notesStr.match(/Seat Type:\s*([^|,\n\]]+)/i) || notesStr.match(/\[SeatType:\s*([^\]]+)\]/i);
    if (match && match[1]) {
      const parsed = match[1].trim() as SeatType;
      if (SEAT_TYPE_OPTIONS.includes(parsed)) {
        seatType = parsed;
      }
    }
  }

  // Extract leaderName from r.leader_name or parse from notes as fallback
  let leaderName: string | undefined = r.leader_name || undefined;
  if (!leaderName && notesStr) {
    const match = notesStr.match(/Leader(?:'s)?(?:\s*Name)?:\s*([^|,\n\]]+)/i) || notesStr.match(/\[Leader:\s*([^\]]+)\]/i);
    if (match && match[1]) {
      leaderName = match[1].trim();
    }
  }

  // Extract boarded
  const boarded = r.boarded === true || /\[Boarded:\s*true\]/i.test(notesStr);

  // Extract emergencyPhone
  let emergencyPhone = r.emergency_phone || undefined;
  if (!emergencyPhone && notesStr) {
    const match = notesStr.match(/\[Emergency:\s*([^\]]+)\]/i);
    if (match && match[1]) emergencyPhone = match[1].trim();
  }

  // Extract bloodGroup
  let bloodGroup = r.blood_group || undefined;
  if (!bloodGroup && notesStr) {
    const match = notesStr.match(/\[Blood:\s*([^\]]+)\]/i);
    if (match && match[1]) bloodGroup = match[1].trim();
  }

  // Extract pnrNumber
  let pnrNumber = r.pnr_number || undefined;
  if (!pnrNumber && notesStr) {
    const match = notesStr.match(/\[PNR:\s*([^\]]+)\]/i);
    if (match && match[1]) pnrNumber = match[1].trim();
  }

  // Extract berthPreference
  let berthPreference = r.berth_preference || undefined;
  if (!berthPreference && notesStr) {
    const match = notesStr.match(/\[Berth:\s*([^\]]+)\]/i);
    if (match && match[1]) berthPreference = match[1].trim();
  }

  // Extract boardingStation
  let boardingStation = r.boarding_station || undefined;
  if (!boardingStation && notesStr) {
    const match = notesStr.match(/\[Station:\s*([^\]]+)\]/i);
    if (match && match[1]) boardingStation = match[1].trim();
  }

  // Extract genuine user notes by stripping all system tags
  const cleanNotes = notesStr
    .replace(/(?:^|\s*\|\s*)Seat Type:\s*[^|,\n\]]+/gi, '')
    .replace(/(?:^|\s*\|\s*)\[SeatType:\s*[^\]]+\]/gi, '')
    .replace(/(?:^|\s*\|\s*)Leader(?:'s)?(?:\s*Name)?:\s*[^|,\n\]]+/gi, '')
    .replace(/(?:^|\s*\|\s*)\[Leader:\s*[^\]]+\]/gi, '')
    .replace(/(?:^|\s*\|\s*)\[Boarded:\s*[^\]]+\]/gi, '')
    .replace(/(?:^|\s*\|\s*)\[Emergency:\s*[^\]]+\]/gi, '')
    .replace(/(?:^|\s*\|\s*)\[Blood:\s*[^\]]+\]/gi, '')
    .replace(/(?:^|\s*\|\s*)\[PNR:\s*[^\]]+\]/gi, '')
    .replace(/(?:^|\s*\|\s*)\[Berth:\s*[^\]]+\]/gi, '')
    .replace(/(?:^|\s*\|\s*)\[Station:\s*[^\]]+\]/gi, '')
    .replace(/^[\s|]+|[\s|]+$/g, '')
    .trim();

  return {
    id: r.id,
    registrationNumber: r.registration_number,
    fullName: r.full_name,
    leaderName,
    gender: r.gender || undefined,
    age: r.age !== null ? Number(r.age) : undefined,
    dateOfBirth: r.date_of_birth || undefined,
    phoneNumber: r.phone_number,
    whatsappNumber: r.whatsapp_number || undefined,
    emergencyPhone,
    bloodGroup,
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
    seatType,
    vehicleName: r.vehicle_name || undefined,
    pnrNumber,
    berthPreference,
    boardingStation,
    boarded,
    notes: cleanNotes || undefined,
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

// Tracks whether the Supabase database table has explicit columns for seat_type and leader_name
let extraRegistrationColumnsSupported: boolean | null = null;

export async function upsertRegistrationInDb(reg: PassengerRegistration): Promise<boolean> {
  const client = getActiveSupabaseClient();
  if (!client) return false;
  try {
    const payload = regToDb(reg);
    
    // If we already know the database table lacks seat_type or leader_name columns, omit them to avoid 400 Bad Request
    const sendPayload: any = { ...payload };
    if (extraRegistrationColumnsSupported === false) {
      delete sendPayload.seat_type;
      delete sendPayload.leader_name;
    }

    let { error } = await client.from('tour_registrations').upsert(sendPayload, { onConflict: 'id' });
    
    // If 'seat_type' or 'leader_name' column does not exist yet on Supabase schema cache (PGRST204 or 42703), strip them and retry
    if (error && (error.code === 'PGRST204' || error.code === '42703' || (error.message && error.message.includes('column')))) {
      extraRegistrationColumnsSupported = false;
      delete sendPayload.seat_type;
      delete sendPayload.leader_name;
      const retryRes = await client.from('tour_registrations').upsert(sendPayload, { onConflict: 'id' });
      error = retryRes.error;
    } else if (!error && extraRegistrationColumnsSupported === null) {
      extraRegistrationColumnsSupported = true;
    }

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
