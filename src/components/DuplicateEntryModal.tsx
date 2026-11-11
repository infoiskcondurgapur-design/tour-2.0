import React from 'react';
import { AlertTriangle, X, Users, ArrowRight, Eye, Calendar, MapPin, Wallet, CheckCircle2 } from 'lucide-react';
import { PassengerRegistration } from '../types';

interface DuplicateEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  duplicate: PassengerRegistration | null;
  onProceedAnyway?: () => void;
  onViewExisting?: () => void;
  viewExistingLabel?: string;
  isDevoteePortal?: boolean;
}

export const DuplicateEntryModal: React.FC<DuplicateEntryModalProps> = ({
  isOpen,
  onClose,
  duplicate,
  onProceedAnyway,
  onViewExisting,
  viewExistingLabel = 'View in Roster',
  isDevoteePortal = false,
}) => {
  if (!isOpen || !duplicate) return null;

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-rose-500/60 rounded-3xl w-full max-w-lg p-6 shadow-2xl shadow-rose-500/15 relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-rose-500/15 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-800 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                Duplicate Verification Alert
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                This is Duplicate Entry.
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close popup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-4 text-xs relative z-10">
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-200">
            <p className="font-semibold text-sm leading-snug">
              {isDevoteePortal ? (
                <>
                  You or a devotee with matching <span className="underline decoration-rose-400 font-bold">Name</span> and <span className="underline decoration-rose-400 font-bold">Mobile Number</span> has already been registered previously.
                </>
              ) : (
                <>
                  A devotee entry with identical <span className="underline decoration-rose-400 font-bold">Name</span> and <span className="underline decoration-rose-400 font-bold">Mobile Number</span> was already entered before in the database.
                </>
              )}
            </p>
          </div>

          {/* Existing Matching Record Details Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                Previously Entered Record
              </span>
              <span className="px-2 py-0.5 rounded-md font-mono font-bold text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
                #{duplicate.registrationNumber}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Full Name</span>
                <span className="text-white font-bold text-sm block truncate">{duplicate.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Mobile Number</span>
                <span className="text-white font-mono font-bold text-sm block">{duplicate.phoneNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tour / Yatra</span>
                <span className="text-amber-400 font-semibold block truncate">{duplicate.tourName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Registration Date</span>
                <span className="text-slate-200 font-mono block">{duplicate.registrationDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Seat & Class</span>
                <span className="text-cyan-400 font-medium block truncate">
                  {duplicate.seatNumber ? `Seat ${duplicate.seatNumber} • ` : ''}
                  {duplicate.seatType || 'None'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Payment Status</span>
                <span className="font-mono text-emerald-400 font-bold block">
                  Paid: {formatINR(duplicate.paidAmount)}
                  {duplicate.dueAmount > 0 && (
                    <span className="text-rose-400 ml-1">| Due: {formatINR(duplicate.dueAmount)}</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <p className="text-slate-400 text-[11px] leading-relaxed">
            {isDevoteePortal
              ? 'To avoid double payments or duplicate seat bookings, you can view your existing digital registration slip, or go back to update your details.'
              : 'To prevent duplicate payments, inaccurate passenger counts, and seat conflicts, please verify this record before adding.'}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 relative z-10">
          {onViewExisting ? (
            <button
              type="button"
              onClick={onViewExisting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all cursor-pointer"
            >
              {isDevoteePortal ? <Eye className="w-4 h-4 text-emerald-400" /> : <Users className="w-4 h-4 text-purple-400" />}
              <span>{viewExistingLabel}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all border border-slate-700 cursor-pointer text-center"
            >
              Cancel / Go Back
            </button>

            {onProceedAnyway && (
              <button
                type="button"
                onClick={onProceedAnyway}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 transition-all cursor-pointer text-center"
                title="Only click if this is deliberately a separate devotee with identical name & mobile"
              >
                Proceed Anyway
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
