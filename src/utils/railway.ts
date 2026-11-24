import { CoachType } from '../types';

export interface BerthInfo {
  code: string;
  name: string;
  isLower: boolean;
  color: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

/**
 * Calculates standard Indian Railways berth type and position from berth number.
 * Follows official Indian Railways ICF/LHB coach patterns.
 */
export function getIndianRailwaysBerthType(berthNum: number, coachType: CoachType = 'sleeper'): BerthInfo {
  if (berthNum <= 0) {
    return {
      code: 'Seat',
      name: 'Seat',
      isLower: true,
      color: 'slate',
      bgClass: 'bg-slate-800',
      textClass: 'text-slate-300',
      borderClass: 'border-slate-700',
    };
  }

  if (coachType === '2ac') {
    // 2AC: 6 berths per bay (1-LB, 2-UB, 3-LB, 4-UB, 5-SL, 6-SU)
    const rem = berthNum % 6;
    if (rem === 1 || rem === 3) {
      return {
        code: 'LB',
        name: 'Lower Berth',
        isLower: true,
        color: 'emerald',
        bgClass: 'bg-emerald-500/20',
        textClass: 'text-emerald-400',
        borderClass: 'border-emerald-500/40',
      };
    }
    if (rem === 2 || rem === 4) {
      return {
        code: 'UB',
        name: 'Upper Berth',
        isLower: false,
        color: 'blue',
        bgClass: 'bg-blue-500/20',
        textClass: 'text-blue-400',
        borderClass: 'border-blue-500/40',
      };
    }
    if (rem === 5) {
      return {
        code: 'SL',
        name: 'Side Lower',
        isLower: true,
        color: 'teal',
        bgClass: 'bg-teal-500/20',
        textClass: 'text-teal-300',
        borderClass: 'border-teal-500/40',
      };
    }
    return {
      code: 'SU',
      name: 'Side Upper',
      isLower: false,
      color: 'indigo',
      bgClass: 'bg-indigo-500/20',
      textClass: 'text-indigo-400',
      borderClass: 'border-indigo-500/40',
    };
  }

  if (coachType === 'cc') {
    // AC Chair Car (5 seats per row: Window, Middle, Aisle | Aisle, Window)
    const rem = berthNum % 5;
    if (rem === 1 || rem === 0) {
      return {
        code: 'WS',
        name: 'Window Seat',
        isLower: true,
        color: 'amber',
        bgClass: 'bg-amber-500/20',
        textClass: 'text-amber-400',
        borderClass: 'border-amber-500/40',
      };
    }
    if (rem === 2 || rem === 4) {
      return {
        code: 'MS',
        name: 'Middle Seat',
        isLower: false,
        color: 'slate',
        bgClass: 'bg-slate-700/40',
        textClass: 'text-slate-300',
        borderClass: 'border-slate-600',
      };
    }
    return {
      code: 'AS',
      name: 'Aisle Seat',
      isLower: false,
      color: 'blue',
      bgClass: 'bg-blue-500/20',
      textClass: 'text-blue-400',
      borderClass: 'border-blue-500/40',
    };
  }

  // Sleeper (SL) & 3AC (AC Three-Tier): 8 berths per bay
  const rem = berthNum % 8;
  switch (rem) {
    case 1:
    case 4:
      return {
        code: 'LB',
        name: 'Lower Berth',
        isLower: true,
        color: 'emerald',
        bgClass: 'bg-emerald-500/20',
        textClass: 'text-emerald-400',
        borderClass: 'border-emerald-500/40',
      };
    case 2:
    case 5:
      return {
        code: 'MB',
        name: 'Middle Berth',
        isLower: false,
        color: 'amber',
        bgClass: 'bg-amber-500/20',
        textClass: 'text-amber-300',
        borderClass: 'border-amber-500/40',
      };
    case 3:
    case 6:
      return {
        code: 'UB',
        name: 'Upper Berth',
        isLower: false,
        color: 'blue',
        bgClass: 'bg-blue-500/20',
        textClass: 'text-blue-400',
        borderClass: 'border-blue-500/40',
      };
    case 7:
      return {
        code: 'SL',
        name: 'Side Lower',
        isLower: true,
        color: 'teal',
        bgClass: 'bg-teal-500/20',
        textClass: 'text-teal-300',
        borderClass: 'border-teal-500/40',
      };
    case 0:
      return {
        code: 'SU',
        name: 'Side Upper',
        isLower: false,
        color: 'indigo',
        bgClass: 'bg-indigo-500/20',
        textClass: 'text-indigo-300',
        borderClass: 'border-indigo-500/40',
      };
    default:
      return {
        code: 'Berth',
        name: 'Berth',
        isLower: false,
        color: 'slate',
        bgClass: 'bg-slate-800',
        textClass: 'text-slate-300',
        borderClass: 'border-slate-700',
      };
  }
}

/**
 * Parses numeric berth from seat string (e.g. "24" -> 24, "S2-45" -> 45, "B1 - 18 (LB)" -> 18)
 */
export function extractBerthNumber(seatStr?: string): number | null {
  if (!seatStr) return null;
  const match = seatStr.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num) && num > 0 && num <= 120) return num;
  }
  return null;
}

/**
 * Returns formatted berth label e.g. "24 (LB)" or "45 (MB)"
 */
export function getFormattedBerthLabel(seatStr?: string, coachType: CoachType = 'sleeper'): string {
  if (!seatStr) return '';
  const num = extractBerthNumber(seatStr);
  if (!num) return seatStr;
  const info = getIndianRailwaysBerthType(num, coachType);
  if (seatStr.toUpperCase().includes(info.code)) return seatStr;
  return `${seatStr} (${info.code})`;
}

export const COMMON_BOARDING_STATIONS = [
  'Durgapur (DGR)',
  'Asansol (ASN)',
  'Howrah (HWH)',
  'Sealdah (SDAH)',
  'Kolkata (KOAA)',
  'Barddhaman (BWN)',
  'Raniganj (RNG)',
  'Dhanbad (DHN)',
  'Patna Jn (PNBE)',
  'New Delhi (NDLS)',
  'Puri (PURI)',
  'Mathura Jn (MTJ)',
  'Varanasi (BSB)',
  'Haridwar (HW)',
];

export const POPULAR_YATRA_TRAINS = [
  { no: '12802', name: 'Purushottam Express' },
  { no: '12876', name: 'Neelachal Express' },
  { no: '12816', name: 'Nandan Kanan Express' },
  { no: '12822', name: 'Dhauli Express' },
  { no: '18410', name: 'Sri Jagannath Express' },
  { no: '12381', name: 'Poorva Express' },
  { no: '12311', name: 'Netaji Express (Kalka Mail)' },
  { no: '13151', name: 'Kolkata - Jammu Tawi Express' },
  { no: '12301', name: 'Howrah New Delhi Rajdhani' },
  { no: '12329', name: 'West Bengal Sampark Kranti' },
  { no: '13009', name: 'Doon Express' },
  { no: '13155', name: 'Mithilanchal Express' },
];
