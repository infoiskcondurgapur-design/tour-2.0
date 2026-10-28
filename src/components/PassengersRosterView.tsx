import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  RotateCcw, 
  Trash2, 
  Wallet, 
  AlertCircle, 
  DollarSign, 
  Compass, 
  UserPlus, 
  CheckCircle2, 
  X,
  CreditCard,
  Phone,
  Calendar,
  FileCheck,
  ArrowRight,
  Edit3,
  UserCheck,
  Check,
  AlertTriangle
} from 'lucide-react';
import { PassengerRegistration, Tour, RefundStatus } from '../types';

interface PassengersRosterViewProps {
  registrations: PassengerRegistration[];
  onDeleteRegistration: (id: string) => void;
  onUpdateRegistration: (registration: PassengerRegistration) => void;
  onProcessRefund: (
    regId: string,
    refundAmount: number,
    refundReason: string,
    refundMethod: 'Cash' | 'UPI' | 'Bank Transfer',
    cancelBooking: boolean
  ) => void;
  onNavigateToRegistration: () => void;
  tours: Tour[];
}

export const PassengersRosterView: React.FC<PassengersRosterViewProps> = ({
  registrations,
  onDeleteRegistration,
  onUpdateRegistration,
  onProcessRefund,
  onNavigateToRegistration,
  tours,
}) => {
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [tourFilter, setTourFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [refundStatusFilter, setRefundStatusFilter] = useState('ALL');

  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Edit Passenger Modal State
  const [editingTarget, setEditingTarget] = useState<PassengerRegistration | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editGender, setEditGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [editDateOfBirth, setEditDateOfBirth] = useState('');
  const [editAge, setEditAge] = useState<number | ''>(45);
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editWhatsappNumber, setEditWhatsappNumber] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editTourName, setEditTourName] = useState('');
  const [editAgreedFee, setEditAgreedFee] = useState<number | ''>(5000);
  const [editPaidAmount, setEditPaidAmount] = useState<number | ''>(0);
  const [editPaymentMethod, setEditPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer'>('UPI');
  const [editSeatNumber, setEditSeatNumber] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<'paid' | 'partial' | 'unpaid' | 'refunded'>('unpaid');

  // Delete Confirmation Modal State
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<PassengerRegistration | null>(null);

  // Refund Modal State
  const [refundTarget, setRefundTarget] = useState<PassengerRegistration | null>(null);
  const [refundAmountInput, setRefundAmountInput] = useState<number | ''>('');
  const [refundReasonInput, setRefundReasonInput] = useState('Pilgrim Cancelled Booking');
  const [customReason, setCustomReason] = useState('');
  const [refundMethodInput, setRefundMethodInput] = useState<'Cash' | 'UPI' | 'Bank Transfer'>('UPI');
  const [cancelBookingChecked, setCancelBookingChecked] = useState(true);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Open Edit Modal for a user
  const handleOpenEditModal = (reg: PassengerRegistration) => {
    setEditingTarget(reg);
    setEditFullName(reg.fullName);
    setEditGender(reg.gender || 'Male');
    setEditDateOfBirth(reg.dateOfBirth || '');
    setEditAge(reg.age ?? '');
    setEditPhoneNumber(reg.phoneNumber);
    setEditWhatsappNumber(reg.whatsappNumber || '');
    setEditAddress(reg.address || '');
    setEditTourName(reg.tourName);
    setEditAgreedFee(reg.agreedFee);
    setEditPaidAmount(reg.paidAmount);
    setEditPaymentMethod(reg.paymentMethod || 'UPI');
    setEditSeatNumber(reg.seatNumber || '');
    setEditNotes(reg.notes || '');
    setEditStatus(reg.status);
  };

  // Auto-calculate age in Edit Modal when Date of Birth changes
  const handleEditDobChange = (newDob: string) => {
    setEditDateOfBirth(newDob);
    if (newDob) {
      const birth = new Date(newDob);
      const today = new Date();
      if (!isNaN(birth.getTime())) {
        let calculatedAge = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          calculatedAge--;
        }
        if (calculatedAge >= 0 && calculatedAge <= 125) {
          setEditAge(calculatedAge);
        }
      }
    }
  };

  // Save Edited Passenger Details
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTarget) return;

    if (!editFullName.trim() || !editPhoneNumber.trim() || !editTourName.trim()) {
      alert('Please fill in required fields (Name, Phone, and Tour Name).');
      return;
    }

    const feeNum = Number(editAgreedFee || 0);
    const paidNum = Number(editPaidAmount || 0);
    const refundAmt = Number(editingTarget.refundAmount || 0);
    const netPaid = Math.max(0, paidNum - refundAmt);
    const dueAmount = Math.max(0, feeNum - netPaid);

    let status: 'paid' | 'partial' | 'unpaid' | 'refunded' = editStatus;
    if (status !== 'refunded') {
      if (netPaid >= feeNum && feeNum > 0) status = 'paid';
      else if (netPaid > 0) status = 'partial';
      else status = 'unpaid';
    }

    const updated: PassengerRegistration = {
      ...editingTarget,
      fullName: editFullName.trim(),
      gender: editGender,
      dateOfBirth: editDateOfBirth || undefined,
      age: editAge !== '' ? Number(editAge) : undefined,
      phoneNumber: editPhoneNumber.trim(),
      whatsappNumber: (editWhatsappNumber || editPhoneNumber).trim(),
      address: editAddress.trim(),
      tourName: editTourName.trim(),
      agreedFee: feeNum,
      paidAmount: paidNum,
      dueAmount,
      paymentMethod: editPaymentMethod,
      seatNumber: editSeatNumber.trim() ? editSeatNumber.trim().toUpperCase() : undefined,
      notes: editNotes.trim(),
      status,
    };

    onUpdateRegistration(updated);
    setEditingTarget(null);
    setSuccessNotice(`Updated details for "${updated.fullName}" (#${updated.registrationNumber}) successfully!`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  // Permanently Delete Passenger
  const handleConfirmDelete = () => {
    if (!deleteConfirmTarget) return;
    const pilgrimName = deleteConfirmTarget.fullName;
    const regNumber = deleteConfirmTarget.registrationNumber;
    onDeleteRegistration(deleteConfirmTarget.id);
    setDeleteConfirmTarget(null);
    setSuccessNotice(`Pilgrim "${pilgrimName}" (#${regNumber}) was permanently deleted from roster.`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  // Open Refund Modal for a user
  const handleOpenRefundModal = (reg: PassengerRegistration) => {
    const existingRefund = reg.refundAmount || 0;
    const maxRefundable = Math.max(0, reg.paidAmount - existingRefund);
    setRefundTarget(reg);
    setRefundAmountInput(maxRefundable);
    setRefundReasonInput('Pilgrim Cancelled Booking');
    setCustomReason('');
    setRefundMethodInput(reg.paymentMethod || 'UPI');
    setCancelBookingChecked(true);
  };

  // Submit User Refund
  const handleConfirmRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundTarget) return;

    const amt = Number(refundAmountInput || 0);
    const existingRefund = refundTarget.refundAmount || 0;
    const maxRefundable = Math.max(0, refundTarget.paidAmount - existingRefund);

    if (amt <= 0) {
      alert('Please enter a valid refund amount greater than ₹0.');
      return;
    }

    if (amt > maxRefundable) {
      alert(`Refund cannot exceed the remaining paid balance of ${formatINR(maxRefundable)}.`);
      return;
    }

    const finalReason = refundReasonInput === 'Other' ? (customReason.trim() || 'Other') : refundReasonInput;

    onProcessRefund(
      refundTarget.id,
      amt,
      finalReason,
      refundMethodInput,
      cancelBookingChecked
    );

    setSuccessNotice(`Refund of ${formatINR(amt)} successfully processed for ${refundTarget.fullName}!`);
    setTimeout(() => setSuccessNotice(null), 4500);

    setRefundTarget(null);
  };

  // Aggregate calculations
  const totalAgreed = registrations.reduce((sum, r) => sum + (r.agreedFee || 0), 0);
  const totalCollected = registrations.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
  const totalRefunded = registrations.reduce((sum, r) => sum + (r.refundAmount || 0), 0);
  const netInHand = Math.max(0, totalCollected - totalRefunded);
  const totalDue = registrations.reduce((sum, r) => sum + (r.dueAmount || 0), 0);
  const refundedUsersCount = registrations.filter(r => (r.refundAmount || 0) > 0).length;

  // Filter registrations
  const filteredRegistrations = registrations.filter(r => {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchQuery = (
        r.fullName.toLowerCase().includes(q) ||
        r.tourName.toLowerCase().includes(q) ||
        r.phoneNumber.includes(q) ||
        r.registrationNumber.toLowerCase().includes(q)
      );
      if (!matchQuery) return false;
    }

    if (tourFilter !== 'ALL' && r.tourName !== tourFilter) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;

    if (refundStatusFilter !== 'ALL') {
      const currentRefStatus = r.refundStatus || 'not_refunded';
      if (refundStatusFilter === 'has_refund') {
        if ((r.refundAmount || 0) <= 0) return false;
      } else if (currentRefStatus !== refundStatusFilter) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-400" />
            Registered Passengers Roster
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Complete pilgrim records, user refund status, advance collections, and dues ledger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {successNotice && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          <button
            onClick={onNavigateToRegistration}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 cursor-pointer transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Register New Passenger</span>
          </button>
        </div>
      </div>

      {/* Roster Financial Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Registered */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Pilgrims</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {registrations.length}
          </div>
          <span className="text-[10px] text-slate-500">Registered users</span>
        </div>

        {/* Total Agreed Fees */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Total Agreed Fees</span>
            <FileCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-200 mt-1">
            {formatINR(totalAgreed)}
          </div>
          <span className="text-[10px] text-slate-500">Agreed contract fees</span>
        </div>

        {/* Total Paid (Gross Collections) */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-medium">
            <span>Total Paid</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {formatINR(totalCollected)}
          </div>
          <span className="text-[10px] text-slate-500">Gross advance received</span>
        </div>

        {/* User Refunds Status Metric */}
        <div className="bg-slate-900/90 border border-purple-500/40 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-400 text-xs font-medium">
            <span>Total Refunded</span>
            <RotateCcw className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black font-mono text-purple-400 mt-1">
            {formatINR(totalRefunded)}
          </div>
          <span className="text-[10px] text-purple-300/80">
            {refundedUsersCount} {refundedUsersCount === 1 ? 'user refunded' : 'users refunded'}
          </span>
        </div>

        {/* Net In-Hand for users */}
        <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-cyan-400 text-xs font-medium">
            <span>Net Collected</span>
            <DollarSign className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-cyan-400 mt-1">
            {formatINR(netInHand)}
          </div>
          <span className="text-[10px] text-slate-500">Paid minus user refunds</span>
        </div>

        {/* Total Due */}
        <div className="bg-slate-900/90 border border-rose-500/30 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-400 text-xs font-medium">
            <span>Outstanding Due</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black font-mono text-rose-400 mt-1">
            {formatINR(totalDue)}
          </div>
          <span className="text-[10px] text-slate-500">Pending passenger dues</span>
        </div>
      </div>

      {/* Main Roster Container */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Controls & Filters Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/40 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-white text-base">Passenger Records Table</h3>
              <p className="text-xs text-slate-400">
                Showing {filteredRegistrations.length} of {registrations.length} total registered pilgrims
              </p>
            </div>

            {/* Quick Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, phone, tour, reg#..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
            {/* Tour Filter */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 py-1 text-slate-300">
              <Compass className="w-3.5 h-3.5 text-orange-400" />
              <select
                value={tourFilter}
                onChange={(e) => setTourFilter(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer font-medium"
              >
                <option value="ALL" className="bg-slate-900">All Tours</option>
                {Array.from(new Set(registrations.map(r => r.tourName))).map(t => (
                  <option key={t} value={t} className="bg-slate-900">{t}</option>
                ))}
              </select>
            </div>

            {/* Payment Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 py-1 text-slate-300">
              <span className="text-[11px] text-slate-400 font-semibold">Payment:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer font-medium"
              >
                <option value="ALL" className="bg-slate-900">All Payment Status</option>
                <option value="paid" className="bg-slate-900">Paid</option>
                <option value="partial" className="bg-slate-900">Partial</option>
                <option value="unpaid" className="bg-slate-900">Unpaid</option>
                <option value="refunded" className="bg-slate-900">Refunded / Cancelled</option>
              </select>
            </div>

            {/* User Refund Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-800/80 border border-purple-500/40 rounded-xl px-2.5 py-1 text-purple-300 font-medium">
              <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
              <select
                value={refundStatusFilter}
                onChange={(e) => setRefundStatusFilter(e.target.value)}
                className="bg-transparent text-purple-200 text-xs focus:outline-none cursor-pointer font-medium"
              >
                <option value="ALL" className="bg-slate-900">All Refund Status</option>
                <option value="has_refund" className="bg-slate-900">Any Refund Issued</option>
                <option value="fully_refunded" className="bg-slate-900">Fully Refunded</option>
                <option value="partially_refunded" className="bg-slate-900">Partially Refunded</option>
                <option value="not_refunded" className="bg-slate-900">Not Refunded</option>
              </select>
            </div>
          </div>
        </div>

        {/* Full Roster Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Reg # & Pilgrim Name</th>
                <th className="py-3.5 px-4">Tour / Yatra</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4 text-right">Agreed Fee</th>
                <th className="py-3.5 px-4 text-right">Paid</th>
                <th className="py-3.5 px-4 text-center">User Refund Status</th>
                <th className="py-3.5 px-4 text-right">Net In-Hand</th>
                <th className="py-3.5 px-4 text-right">Due</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredRegistrations.map((reg) => {
                const refAmt = reg.refundAmount || 0;
                const netAmt = Math.max(0, reg.paidAmount - refAmt);
                const isFullyRefunded = reg.refundStatus === 'fully_refunded' || (refAmt > 0 && refAmt >= reg.paidAmount);
                const isPartiallyRefunded = reg.refundStatus === 'partially_refunded' || (refAmt > 0 && refAmt < reg.paidAmount);

                return (
                  <tr key={reg.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Name & Reg # */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-orange-400 text-[11px] block">
                        {reg.registrationNumber}
                      </span>
                      <strong className="text-white text-sm">{reg.fullName}</strong>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                        {reg.gender && <span className="font-medium text-slate-300">{reg.gender}</span>}
                        {reg.age && <span>• {reg.age} yrs</span>}
                        {reg.dateOfBirth && <span>• DOB: {reg.dateOfBirth}</span>}
                        {reg.address && <span>• {reg.address}</span>}
                      </div>
                    </td>

                    {/* Tour */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-300 font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-orange-400" />
                        {reg.tourName}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono">
                      <div>{reg.phoneNumber}</div>
                      {reg.whatsappNumber && reg.whatsappNumber !== reg.phoneNumber && (
                        <div className="text-[10px] text-emerald-400">WA: {reg.whatsappNumber}</div>
                      )}
                    </td>

                    {/* Agreed Fee */}
                    <td className="py-3 px-4 text-right font-mono font-medium whitespace-nowrap text-slate-300">
                      {formatINR(reg.agreedFee)}
                    </td>

                    {/* Paid */}
                    <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap text-emerald-400">
                      {formatINR(reg.paidAmount)}
                    </td>

                    {/* USER REFUND STATUS */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {isFullyRefunded ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 font-bold text-purple-300 bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 rounded text-[10px]">
                            <RotateCcw className="w-3 h-3 text-purple-400" />
                            Fully Refunded
                          </span>
                          <span className="text-[10px] font-mono text-purple-400 mt-0.5 font-bold">
                            -{formatINR(refAmt)}
                          </span>
                          {reg.refundReason && (
                            <span className="text-[9px] text-slate-400 max-w-[120px] truncate" title={reg.refundReason}>
                              {reg.refundReason}
                            </span>
                          )}
                        </div>
                      ) : isPartiallyRefunded ? (
                        <div className="inline-flex flex-col items-center">
                          <span className="inline-flex items-center gap-1 font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/40 px-2 py-0.5 rounded text-[10px]">
                            <RotateCcw className="w-3 h-3 text-indigo-400" />
                            Partial Refund
                          </span>
                          <span className="text-[10px] font-mono text-indigo-400 mt-0.5 font-bold">
                            -{formatINR(refAmt)}
                          </span>
                          {reg.refundReason && (
                            <span className="text-[9px] text-slate-400 max-w-[120px] truncate" title={reg.refundReason}>
                              {reg.refundReason}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-block text-slate-500 bg-slate-800/60 border border-slate-700/60 px-2 py-0.5 rounded text-[10px] font-medium">
                          Not Refunded
                        </span>
                      )}
                    </td>

                    {/* Net In-Hand */}
                    <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap text-cyan-400">
                      {formatINR(netAmt)}
                    </td>

                    {/* Due */}
                    <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                      <span className={reg.dueAmount > 0 ? 'text-rose-400' : 'text-slate-500'}>
                        {formatINR(reg.dueAmount)}
                      </span>
                    </td>

                    {/* Overall Booking Status */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {reg.status === 'refunded' ? (
                        <span className="font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded text-[10px]">
                          Refunded
                        </span>
                      ) : reg.status === 'paid' ? (
                        <span className="font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px]">
                          Paid
                        </span>
                      ) : reg.status === 'partial' ? (
                        <span className="font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded text-[10px]">
                          Partial
                        </span>
                      ) : (
                        <span className="font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded text-[10px]">
                          Unpaid
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Edit Passenger Details Button */}
                        <button
                          onClick={() => handleOpenEditModal(reg)}
                          className="p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 transition-all cursor-pointer"
                          title="Edit pilgrim personal, contact & payment details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-[11px]">Edit</span>
                        </button>

                        {/* Issue Refund Button */}
                        <button
                          onClick={() => handleOpenRefundModal(reg)}
                          disabled={reg.paidAmount <= (reg.refundAmount || 0)}
                          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                            reg.paidAmount > (reg.refundAmount || 0)
                              ? 'bg-purple-500/10 hover:bg-purple-500/25 text-purple-400 border border-purple-500/30 cursor-pointer'
                              : 'bg-slate-800/40 text-slate-600 border border-slate-800 cursor-not-allowed opacity-50'
                          }`}
                          title={
                            reg.paidAmount <= 0
                              ? 'No advance paid to refund'
                              : reg.paidAmount <= (reg.refundAmount || 0)
                              ? 'Already fully refunded'
                              : 'Issue / Record refund for this passenger'
                          }
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-[11px]">Refund</span>
                        </button>

                        {/* Delete User */}
                        <button
                          onClick={() => setDeleteConfirmTarget(reg)}
                          className="p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                          title="Delete this passenger"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-[11px]">Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRegistrations.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-500">
                    <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-400">No passengers found</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {registrations.length === 0
                        ? 'No passengers have been registered yet. Click the button below to register your first passenger.'
                        : 'No passenger records match your current search and filter settings.'}
                    </p>
                    {registrations.length === 0 && (
                      <button
                        onClick={onNavigateToRegistration}
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Register First Passenger</span>
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================== */}
      {/* EDIT PASSENGER DETAILS MODAL                             */}
      {/* ======================================================== */}
      {editingTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Edit Pilgrim Details — {editingTarget.fullName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Registration #: <span className="font-mono text-orange-400 font-bold">{editingTarget.registrationNumber}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveEdit} className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Section 1: Personal Details */}
              <div>
                <h4 className="font-bold uppercase tracking-wider text-orange-400 text-[11px] mb-2.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editFullName}
                      onChange={(e) => setEditFullName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-white font-medium focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Gender *</label>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                    >
                      <option value="Male">Male (পুরুষ)</option>
                      <option value="Female">Female (মহিলা)</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                      <span>Date of Birth</span>
                      <span className="text-[10px] text-orange-400">DOB</span>
                    </label>
                    <input
                      type="date"
                      value={editDateOfBirth}
                      onChange={(e) => handleEditDobChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-1.5 text-slate-200 font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Contact, Age & Address */}
              <div className="pt-3 border-t border-slate-800/80">
                <h4 className="font-bold uppercase tracking-wider text-orange-400 text-[11px] mb-2.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  Contact & Location
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                      <span>Age (Years)</span>
                      {editDateOfBirth && <span className="text-[10px] text-emerald-400">Auto-calc</span>}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      value={editPhoneNumber}
                      onChange={(e) => setEditPhoneNumber(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">WhatsApp Number</label>
                    <input
                      type="text"
                      value={editWhatsappNumber}
                      onChange={(e) => setEditWhatsappNumber(e.target.value)}
                      placeholder="Optional"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Seat Number</label>
                    <input
                      type="text"
                      value={editSeatNumber}
                      onChange={(e) => setEditSeatNumber(e.target.value)}
                      placeholder="e.g. 1A, 12, S-3"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-slate-300 font-semibold mb-1">Residential Address / City</label>
                    <input
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="e.g. Kolkata, West Bengal"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Tour & Financial Agreement */}
              <div className="pt-3 border-t border-slate-800/80">
                <h4 className="font-bold uppercase tracking-wider text-orange-400 text-[11px] mb-2.5 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5" />
                  Tour & Financial Agreement
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Tour / Yatra *</label>
                    <select
                      value={editTourName}
                      onChange={(e) => setEditTourName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-200 font-medium focus:outline-none"
                    >
                      {tours.map(t => (
                        <option key={t.id} value={t.name}>{t.code} — {t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Agreed Tour Fee (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={editAgreedFee}
                      onChange={(e) => setEditAgreedFee(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Total Paid Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={editPaidAmount}
                      onChange={(e) => setEditPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Payment Method</label>
                    <select
                      value={editPaymentMethod}
                      onChange={(e) => setEditPaymentMethod(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                    >
                      <option value="UPI">UPI / Google Pay / PhonePe</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1">Special Notes / Dietary Requests</label>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="e.g. Front seat for senior citizen, prasadam preferences"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Financial Preview Box */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Net Paid: </span>
                  <strong className="text-emerald-400 font-mono">
                    {formatINR(Math.max(0, Number(editPaidAmount || 0) - (editingTarget.refundAmount || 0)))}
                  </strong>
                  {(editingTarget.refundAmount || 0) > 0 && (
                    <span className="text-purple-400 ml-1">
                      (-{formatINR(editingTarget.refundAmount || 0)} refunded)
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400">Outstanding Due: </span>
                  <strong className={
                    Math.max(0, Number(editAgreedFee || 0) - Math.max(0, Number(editPaidAmount || 0) - (editingTarget.refundAmount || 0))) > 0
                      ? 'text-rose-400 font-mono'
                      : 'text-slate-500 font-mono'
                  }>
                    {formatINR(Math.max(0, Number(editAgreedFee || 0) - Math.max(0, Number(editPaidAmount || 0) - (editingTarget.refundAmount || 0))))}
                  </strong>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = editingTarget;
                    setEditingTarget(null);
                    setDeleteConfirmTarget(target);
                  }}
                  className="px-3.5 py-2.5 rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-500/15 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete User</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTarget(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE PASSENGER CONFIRMATION MODAL                      */}
      {/* ======================================================== */}
      {deleteConfirmTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/30 rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Delete Pilgrim Record?</h3>
                  <p className="text-xs text-rose-400 font-medium">Permanent action cannot be undone</p>
                </div>
              </div>
              <button
                onClick={() => setDeleteConfirmTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <p className="text-slate-300">
                Are you sure you want to permanently delete this registered user?
              </p>

              {/* Pilgrim Details Card */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Pilgrim Name:</span>
                  <strong className="text-white text-sm">{deleteConfirmTarget.fullName}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Registration #:</span>
                  <span className="font-mono font-bold text-orange-400">{deleteConfirmTarget.registrationNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Tour / Yatra:</span>
                  <span className="text-slate-200 font-medium">{deleteConfirmTarget.tourName}</span>
                </div>
                {deleteConfirmTarget.seatNumber && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Allocated Seat:</span>
                    <span className="font-mono text-cyan-400 font-bold">{deleteConfirmTarget.seatNumber}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400">Total Paid:</span>
                  <strong className="font-mono text-emerald-400">{formatINR(deleteConfirmTarget.paidAmount)}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Remaining Due:</span>
                  <strong className={deleteConfirmTarget.dueAmount > 0 ? 'font-mono text-rose-400' : 'font-mono text-slate-500'}>
                    {formatINR(deleteConfirmTarget.dueAmount)}
                  </strong>
                </div>
              </div>

              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[11px] text-rose-300">
                ⚠️ Deleting this user will remove them from the pilgrims roster, release their assigned seat, and clear associated accounts.
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="w-1/2 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete User</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ISSUE USER REFUND MODAL                                  */}
      {/* ======================================================== */}
      {refundTarget && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Issue Passenger Refund</h3>
                  <p className="text-xs text-slate-400">Record refund & update financial ledger</p>
                </div>
              </div>
              <button
                onClick={() => setRefundTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Passenger Summary Context */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 mb-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Passenger Name:</span>
                <span className="font-bold text-white">{refundTarget.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Registration #:</span>
                <span className="font-mono text-orange-400 font-bold">{refundTarget.registrationNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tour / Yatra:</span>
                <span className="text-slate-300 font-medium">{refundTarget.tourName}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">Total Paid by User:</span>
                <span className="font-mono font-bold text-emerald-400">{formatINR(refundTarget.paidAmount)}</span>
              </div>
              {(refundTarget.refundAmount || 0) > 0 && (
                <div className="flex justify-between text-purple-400">
                  <span>Already Refunded:</span>
                  <span className="font-mono font-bold">-{formatINR(refundTarget.refundAmount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-slate-800/80">
                <span className="font-semibold text-slate-300">Max Refundable Amount:</span>
                <span className="font-mono font-extrabold text-cyan-400">
                  {formatINR(Math.max(0, refundTarget.paidAmount - (refundTarget.refundAmount || 0)))}
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmRefund} className="space-y-4 text-xs">
              {/* Refund Amount */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-semibold">Refund Amount (₹) *</label>
                  {/* Preset quick buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const maxAmt = Math.max(0, refundTarget.paidAmount - (refundTarget.refundAmount || 0));
                        setRefundAmountInput(maxAmt);
                      }}
                      className="px-2 py-0.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[10px] font-bold rounded"
                    >
                      Full Refund
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const maxAmt = Math.max(0, refundTarget.paidAmount - (refundTarget.refundAmount || 0));
                        setRefundAmountInput(Math.round(maxAmt / 2));
                      }}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded"
                    >
                      50% Refund
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  max={Math.max(0, refundTarget.paidAmount - (refundTarget.refundAmount || 0))}
                  value={refundAmountInput}
                  onChange={(e) => setRefundAmountInput(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Refund Reason */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Refund Reason *</label>
                <select
                  value={refundReasonInput}
                  onChange={(e) => setRefundReasonInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 font-medium"
                >
                  <option value="Pilgrim Cancelled Booking">Pilgrim Cancelled Booking</option>
                  <option value="Medical / Health Emergency">Medical / Health Emergency</option>
                  <option value="Excess / Overpayment Adjustment">Excess / Overpayment Adjustment</option>
                  <option value="Tour Rescheduled / Discontinued">Tour Rescheduled / Discontinued</option>
                  <option value="Family / Personal Commitment">Family / Personal Commitment</option>
                  <option value="Other">Other Reason (Custom)</option>
                </select>
              </div>

              {refundReasonInput === 'Other' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Specify Reason</label>
                  <input
                    type="text"
                    required
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter custom reason for refund..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              {/* Refund Payment Method */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Refund Payment Method</label>
                <select
                  value={refundMethodInput}
                  onChange={(e) => setRefundMethodInput(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="UPI">UPI / Google Pay / PhonePe</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Cash">Cash Return</option>
                </select>
              </div>

              {/* Booking Cancellation Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cancelBookingChecked}
                  onChange={(e) => setCancelBookingChecked(e.target.checked)}
                  className="mt-0.5 accent-purple-500 rounded"
                />
                <div className="text-[11px] text-slate-300">
                  <span className="font-bold text-white block">Cancel Tour Registration</span>
                  Clears remaining outstanding dues to ₹0 and sets user status to <span className="text-purple-400 font-bold">Refunded</span>.
                </div>
              </label>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundTarget(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-purple-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Process Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
