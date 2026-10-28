import React, { useState } from 'react';
import { 
  UserPlus, 
  CheckCircle2, 
  Phone, 
  Compass, 
  Calendar,
  AlertCircle,
  FileCheck,
  Wallet,
  Users,
  ArrowRight,
  MapPin,
  Clock
} from 'lucide-react';
import { PassengerRegistration, Tour } from '../types';

interface RegistrationViewProps {
  registrations: PassengerRegistration[];
  onAddRegistration: (reg: PassengerRegistration) => void;
  onNavigateToRoster: () => void;
  tours: Tour[];
}

export const RegistrationView: React.FC<RegistrationViewProps> = ({
  registrations,
  onAddRegistration,
  onNavigateToRoster,
  tours,
}) => {
  // Form State
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [age, setAge] = useState<number | ''>(45);
  const [seatNumber, setSeatNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [address, setAddress] = useState('');
  const [tourName, setTourName] = useState(tours[0]?.name || '');
  const [agreedFee, setAgreedFee] = useState<number | ''>(tours[0]?.defaultFee || 5000);
  const [paidAmount, setPaidAmount] = useState<number | ''>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer'>('UPI');
  const [regDate, setRegDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Auto-calculated Due amount in form
  const feeNum = Number(agreedFee || 0);
  const paidNum = Number(paidAmount || 0);
  const dueAmount = Math.max(0, feeNum - paidNum);

  const selectedTourObj = tours.find(t => t.name === tourName);

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleTourChange = (selectedName: string) => {
    setTourName(selectedName);
    const matchedTour = tours.find(t => t.name === selectedName);
    if (matchedTour && matchedTour.defaultFee > 0) {
      setAgreedFee(matchedTour.defaultFee);
    }
  };

  // Auto calculate age from Date of Birth
  const handleDobChange = (newDob: string) => {
    setDateOfBirth(newDob);
    if (newDob) {
      const birth = new Date(newDob);
      const today = new Date();
      if (!isNaN(birth.getTime())) {
        let calculatedAge = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          calculatedAge--;
        }
        if (calculatedAge >= 0 && calculatedAge <= 125) {
          setAge(calculatedAge);
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phoneNumber || !tourName || feeNum <= 0) {
      alert('Please fill in required fields (Name, Phone, Tour Name, and Agreed Fee).');
      return;
    }

    const regId = 'REG-' + (1000 + registrations.length + 1);

    let status: 'paid' | 'partial' | 'unpaid' | 'refunded' = 'unpaid';
    if (paidNum >= feeNum) status = 'paid';
    else if (paidNum > 0) status = 'partial';

    const newReg: PassengerRegistration = {
      id: 'reg-' + Date.now(),
      registrationNumber: regId,
      fullName: fullName.trim(),
      gender,
      dateOfBirth: dateOfBirth || undefined,
      age: age ? Number(age) : undefined,
      seatNumber: seatNumber.trim() ? seatNumber.trim().toUpperCase() : undefined,
      phoneNumber: phoneNumber.trim(),
      whatsappNumber: (whatsappNumber || phoneNumber).trim(),
      address: address.trim(),
      tourName: tourName.trim(),
      registrationDate: regDate,
      agreedFee: feeNum,
      paidAmount: paidNum,
      dueAmount: dueAmount,
      refundAmount: 0,
      refundStatus: 'not_refunded',
      paymentMethod,
      notes: notes.trim(),
      status,
    };

    onAddRegistration(newReg);

    // Reset Form
    setFullName('');
    setGender('Male');
    setDateOfBirth('');
    setAge(45);
    setPhoneNumber('');
    setWhatsappNumber('');
    setAddress('');
    setPaidAmount(0);
    setNotes('');
    setSeatNumber('');

    setSuccessNotice(`Registration #${regId} created successfully! Earning and Due accounts updated.`);
    setTimeout(() => setSuccessNotice(null), 5000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-orange-400" />
            Passenger Registration Form
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Register new pilgrims, select tours, configure agreed fees, and record advance payments.
          </p>
        </div>

        {/* Link to Separate Roster */}
        <button
          onClick={onNavigateToRoster}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700/80 hover:border-orange-500/60 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-md"
        >
          <Users className="w-4 h-4 text-orange-400" />
          <span>View Registered Roster ({registrations.length})</span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {successNotice && (
        <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button
            onClick={onNavigateToRoster}
            className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
          >
            View in Roster →
          </button>
        </div>
      )}

      {/* Main Registration Form Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Tour Selection & Info */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400 mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4" />
              1. Tour & Pilgrimage Selection
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs">
                  Tour / Yatra *
                </label>
                {tours.length > 0 ? (
                  <select
                    required
                    value={tourName}
                    onChange={(e) => handleTourChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-orange-500 font-semibold"
                  >
                    <option value="">Select a Tour</option>
                    {tours.map(t => (
                      <option key={t.id} value={t.name}>{t.code} — {t.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={tourName}
                    onChange={(e) => setTourName(e.target.value)}
                    placeholder="e.g. Mayapur Dham Yatra 2026 (or create in Tours)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-orange-500"
                  />
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs">
                  Registration Date *
                </label>
                <input
                  type="date"
                  required
                  value={regDate}
                  onChange={(e) => setRegDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Quick Tour Details Preview */}
            {selectedTourObj && (
              <div className="mt-3 bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-orange-400" />
                  Destination: <strong className="text-slate-200">{selectedTourObj.destination}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-orange-400" />
                  Dates: <strong className="text-slate-200">{selectedTourObj.startDate} to {selectedTourObj.endDate}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  Standard Fee: <strong className="text-emerald-400">{formatINR(selectedTourObj.defaultFee)}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Personal & Contact Information */}
          <div className="pt-4 border-t border-slate-800/80">
            <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              2. Passenger Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1 text-xs">
                  Passenger Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Gouranga Das Adhikari"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs">
                  Gender *
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-orange-500 font-medium"
                >
                  <option value="Male">Male (পুরুষ)</option>
                  <option value="Female">Female (মহিলা)</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center justify-between">
                  <span>Date of Birth</span>
                  <span className="text-[10px] text-orange-400 font-normal">DOB</span>
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => handleDobChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 text-sm focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center justify-between">
                  <span>Age (Years)</span>
                  {dateOfBirth && <span className="text-[10px] text-emerald-400 font-normal">Auto-calc</span>}
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 45"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs">
                  Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98300 00000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs">
                  WhatsApp Number
                </label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="Optional (if different from phone)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center justify-between">
                  <span>Seat # (Direct Entry)</span>
                  <span className="text-[10px] text-amber-400/90 font-normal">Optional</span>
                </label>
                <input
                  type="text"
                  value={seatNumber}
                  onChange={(e) => setSeatNumber(e.target.value)}
                  placeholder="e.g. 1A, 12, S-3"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-orange-500 font-mono uppercase"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1 text-xs">
                  City / Residential Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Kolkata, West Bengal"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-300 font-semibold mb-1 text-xs">
                  Special Notes / Requests
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Front seat for senior citizen, prasadam diet"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Financial Agreement & Advance Payment */}
          <div className="pt-4 border-t border-slate-800/80">
            <h3 className="text-sm font-bold uppercase tracking-wider text-orange-400 mb-3 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              3. Financial Agreement & Payment
            </h3>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1 text-xs">
                    Agreed Tour Fee (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={agreedFee}
                    onChange={(e) => setAgreedFee(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 font-mono text-white text-base font-bold focus:outline-none focus:border-orange-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Total agreed payable fee</span>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1 text-xs">
                    Initial Paid / Advance (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={feeNum}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 font-mono text-emerald-400 text-base font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">Logs to Total Earning</span>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1 text-xs">
                    Auto-Calculated Due (₹)
                  </label>
                  <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3.5 py-2.5 font-mono text-base font-bold flex items-center justify-between">
                    <span className={dueAmount > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                      {formatINR(dueAmount)}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-sans">
                      {dueAmount > 0 ? 'Pending' : 'Cleared'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Logs to Outstanding Due</span>
                </div>
              </div>

              {/* Payment Method Selector if Advance is Paid */}
              {paidNum > 0 && (
                <div className="pt-3 border-t border-slate-800/80">
                  <label className="block text-slate-300 font-semibold mb-2 text-xs">
                    Advance Payment Method *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['UPI', 'Cash', 'Bank Transfer'] as const).map((method) => (
                      <button
                        type="button"
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          paymentMethod === method
                            ? 'bg-orange-500/20 text-orange-400 border-orange-500'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black rounded-2xl shadow-xl shadow-orange-500/20 transition-all cursor-pointer text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>Complete Registration & Post to Accounts</span>
            </button>
          </div>
        </form>
      </div>

      {/* Mini Quick Footer Notice */}
      <div className="text-center text-xs text-slate-500">
        All registrations automatically update <strong>Total Earning</strong>, <strong>Outstanding Due</strong>, and are organized in the{' '}
        <button
          onClick={onNavigateToRoster}
          className="text-orange-400 hover:underline font-semibold cursor-pointer"
        >
          Registered Passengers Roster
        </button>.
      </div>
    </div>
  );
};
