import React, { useState, useEffect, useMemo } from 'react';
import { 
  Compass, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Copy, 
  Check, 
  Share2, 
  Printer, 
  ArrowLeft, 
  Sparkles, 
  CreditCard, 
  AlertCircle,
  HeartHandshake,
  ShieldCheck,
  UserCheck,
  ChevronRight,
  Info,
  AlertTriangle,
  Crown
} from 'lucide-react';
import { PassengerRegistration, Tour, SeatType, SEAT_TYPE_OPTIONS } from '../types';
import { PwaInstallPrompt } from './PwaInstallPrompt';
import { ThemeToggle } from '../context/ThemeContext';
import { DuplicateEntryModal } from './DuplicateEntryModal';

interface PublicRegistrationViewProps {
  tours: Tour[];
  registrationsCount: number;
  registrations?: PassengerRegistration[];
  onAddRegistration: (reg: PassengerRegistration) => void;
  onSwitchToAdmin: () => void;
}

export const PublicRegistrationView: React.FC<PublicRegistrationViewProps> = ({
  tours,
  registrationsCount,
  registrations = [],
  onAddRegistration,
  onSwitchToAdmin,
}) => {
  // Extract initial tour from URL query params or hash if provided
  const initialTourFromUrl = useMemo(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlTour = searchParams.get('tour');
      if (urlTour) return urlTour;

      // Also check hash: #/register?tour=xyz
      const hash = window.location.hash;
      if (hash.includes('?')) {
        const hashQuery = hash.split('?')[1];
        const hashParams = new URLSearchParams(hashQuery);
        const hashTour = hashParams.get('tour');
        if (hashTour) return hashTour;
      }
    } catch {
      // fallback
    }
    return '';
  }, []);

  // Filter available tours for registration (prefer open tours)
  const openTours = useMemo(() => {
    return tours.filter(t => t.status === 'registration_open' || t.status === 'planning' || t.status === 'ongoing');
  }, [tours]);

  // Determine starting tour
  const defaultTour = useMemo(() => {
    if (initialTourFromUrl) {
      const matched = tours.find(t => t.name.toLowerCase() === initialTourFromUrl.toLowerCase());
      if (matched) return matched;
    }
    return openTours[0] || tours[0] || null;
  }, [initialTourFromUrl, openTours, tours]);

  // Form State
  const [selectedTourName, setSelectedTourName] = useState<string>(defaultTour ? defaultTour.name : '');
  const [fullName, setFullName] = useState('');
  const [leaderName, setLeaderName] = useState('');
  const [spiritualName, setSpiritualName] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [seatType, setSeatType] = useState<SeatType>('Sleeper Class (SL)');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [sameAsCalling, setSameAsCalling] = useState(true);
  const [city, setCity] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  
  // Emergency Contact & Special Requests
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Payment Selection
  // 'pay_token' | 'pay_full' | 'pay_cash'
  const [paymentChoice, setPaymentChoice] = useState<'pay_token' | 'pay_full' | 'pay_cash'>('pay_token');
  const [tokenAmount, setTokenAmount] = useState<number>(1000);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Bank Transfer'>('UPI');
  const [upiRefId, setUpiRefId] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Submission & Confirmation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedRegistration, setCompletedRegistration] = useState<PassengerRegistration | null>(null);

  // Duplicate Verification Modal State
  const [duplicateMatch, setDuplicateMatch] = useState<PassengerRegistration | null>(null);
  const [pendingRegData, setPendingRegData] = useState<PassengerRegistration | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const normalizePhone = (p: string) => {
    if (!p) return '';
    const digits = p.replace(/\D/g, '');
    if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    return digits;
  };

  const normalizeName = (n: string) => {
    return (n || '').trim().toLowerCase().replace(/\s+/g, ' ');
  };

  // Live real-time duplicate detection
  const liveDuplicate = useMemo(() => {
    if (!registrations || registrations.length === 0) return null;
    const cleanName = normalizeName(fullName);
    const cleanPhone = normalizePhone(phoneNumber);
    if (!cleanName || !cleanPhone || cleanPhone.length < 5) return null;

    return registrations.find(r => {
      const matchName = normalizeName(r.fullName) === cleanName;
      const matchPhone = normalizePhone(r.phoneNumber) === cleanPhone;
      return matchName && matchPhone;
    }) || null;
  }, [fullName, phoneNumber, registrations]);

  // Active tour object
  const currentTourObj = useMemo(() => {
    return tours.find(t => t.name === selectedTourName) || defaultTour;
  }, [selectedTourName, tours, defaultTour]);

  // Sync default tour when loaded
  useEffect(() => {
    if (!selectedTourName && defaultTour) {
      setSelectedTourName(defaultTour.name);
    }
  }, [defaultTour, selectedTourName]);

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

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Fees calculation
  const totalTourFee = currentTourObj ? currentTourObj.defaultFee : 5000;
  
  const calculatedPaidAmount = useMemo(() => {
    if (paymentChoice === 'pay_full') return totalTourFee;
    if (paymentChoice === 'pay_token') return Math.min(tokenAmount, totalTourFee);
    return 0; // cash on boarding
  }, [paymentChoice, totalTourFee, tokenAmount]);

  const calculatedDueAmount = Math.max(0, totalTourFee - calculatedPaidAmount);

  const commitRegistration = (regData: PassengerRegistration) => {
    try {
      onAddRegistration(regData);
      setCompletedRegistration(regData);
      setShowDuplicateModal(false);
      setDuplicateMatch(null);
      setPendingRegData(null);
    } catch (err) {
      console.error('Registration failed:', err);
      alert('Could not complete registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert('Please enter your full name.');
      return;
    }
    if (!phoneNumber.trim()) {
      alert('Please enter your mobile phone number.');
      return;
    }
    if (!selectedTourName) {
      alert('Please select a pilgrimage tour.');
      return;
    }

    setIsSubmitting(true);

    const regNum = 'REG-' + (1000 + registrationsCount + 1);
    const finalWhatsApp = sameAsCalling ? phoneNumber.trim() : (whatsappNumber.trim() || phoneNumber.trim());

    let finalNotes = '';
    if (spiritualName.trim()) {
      finalNotes += `Spiritual Name: ${spiritualName.trim()} | `;
    }
    if (leaderName.trim()) {
      finalNotes += `Leader: ${leaderName.trim()} | `;
    }
    if (emergencyContactName.trim() || emergencyContactPhone.trim()) {
      finalNotes += `Emergency: ${emergencyContactName.trim()} (${emergencyContactPhone.trim()}) | `;
    }
    if (specialRequests.trim()) {
      finalNotes += `Special Request: ${specialRequests.trim()} | `;
    }
    if (upiRefId.trim()) {
      finalNotes += `UPI Ref/UTR: ${upiRefId.trim()} | `;
    }
    finalNotes += 'Self-Registered Online';

    let status: 'paid' | 'partial' | 'unpaid' = 'unpaid';
    if (calculatedPaidAmount >= totalTourFee && totalTourFee > 0) {
      status = 'paid';
    } else if (calculatedPaidAmount > 0) {
      status = 'partial';
    }

    const regData: PassengerRegistration = {
      id: 'reg-' + Date.now(),
      registrationNumber: regNum,
      fullName: fullName.trim(),
      leaderName: leaderName.trim() || undefined,
      gender,
      dateOfBirth: dateOfBirth || undefined,
      age: age ? Number(age) : undefined,
      phoneNumber: phoneNumber.trim(),
      whatsappNumber: finalWhatsApp,
      seatType: seatType || 'None',
      address: [city.trim(), fullAddress.trim()].filter(Boolean).join(', ') || 'Durgapur',
      tourName: selectedTourName,
      registrationDate: new Date().toISOString().split('T')[0],
      agreedFee: totalTourFee,
      paidAmount: calculatedPaidAmount,
      dueAmount: calculatedDueAmount,
      refundAmount: 0,
      refundStatus: 'not_refunded',
      paymentMethod: paymentChoice === 'pay_cash' ? 'Cash' : paymentMethod,
      notes: finalNotes,
      status,
    };

    // Check for duplicate entry (matching Name & Mobile Number)
    const existingDuplicate = liveDuplicate || (registrations || []).find(r => {
      const matchName = normalizeName(r.fullName) === normalizeName(fullName);
      const matchPhone = normalizePhone(r.phoneNumber) === normalizePhone(phoneNumber);
      return matchName && matchPhone;
    });

    if (existingDuplicate) {
      setIsSubmitting(false);
      setDuplicateMatch(existingDuplicate);
      setPendingRegData(regData);
      setShowDuplicateModal(true);
      return;
    }

    commitRegistration(regData);
  };

  // WhatsApp share link for completed registration
  const getWhatsAppShareUrl = (reg: PassengerRegistration) => {
    const text = `🙏 *Hare Krishna! ISKCON Durgapur Pilgrimage Registration*\n\n` +
      `✅ *Registration No:* ${reg.registrationNumber}\n` +
      `👤 *Pilgrim Name:* ${reg.fullName}\n` +
      (reg.leaderName ? `👑 *Leader:* ${reg.leaderName}\n` : '') +
      `🚩 *Tour / Yatra:* ${reg.tourName}\n` +
      `📅 *Destination:* ${currentTourObj?.destination || 'Holy Dham'}\n` +
      `🗓️ *Dates:* ${currentTourObj?.startDate || ''} to ${currentTourObj?.endDate || ''}\n` +
      `🚆 *Seat / Travel Class:* ${reg.seatType || 'None'}\n` +
      `📞 *Mobile:* ${reg.phoneNumber}\n` +
      `💰 *Total Yatra Fee:* ${formatINR(reg.agreedFee)}\n` +
      `💵 *Amount Paid:* ${formatINR(reg.paidAmount)} (${reg.paymentMethod})\n` +
      `⏳ *Balance Due:* ${formatINR(reg.dueAmount)}\n\n` +
      `_Looking forward to a spiritually enriching Yatra! Hari Bol!_`;

    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  // Reset form to register another person
  const handleResetForAnother = () => {
    setFullName('');
    setLeaderName('');
    setSpiritualName('');
    setDateOfBirth('');
    setAge('');
    setSeatType('Sleeper Class (SL)');
    setCompletedRegistration(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* Top Navigation Bar */}
      <nav className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-6 py-3.5 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-sm sm:text-base tracking-tight">
                  ISKCON Durgapur
                </span>
                <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Yatra Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Official Pilgrimage Self-Registration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PwaInstallPrompt variant="button" />

            <ThemeToggle />

            <button
              onClick={onSwitchToAdmin}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-700/60 transition-all cursor-pointer"
              title="Switch to Management Dashboard"
            >
              <span>Admin View</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {completedRegistration ? (
          /* =========================================================
             CONFIRMATION & DIGITAL YATRA SLIP SCREEN
             ========================================================= */
          <div className="space-y-6 animate-fadeIn">
            {/* Success Celebration Banner */}
            <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <span className="text-xs uppercase tracking-widest font-extrabold text-emerald-400 mb-1 block">
                Hare Krishna! Registration Confirmed
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Welcome Aboard, {completedRegistration.fullName}!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto mt-2">
                Your registration for <strong className="text-orange-400">{completedRegistration.tourName}</strong> has been successfully recorded in our central pilgrimage database.
              </p>
            </div>

            {/* Printable Digital Registration Slip */}
            <div id="registration-slip" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
              {/* Slip Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Compass className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-base sm:text-lg">
                      ISKCON Durgapur Yatra Slip
                    </h3>
                    <p className="text-xs text-orange-400 font-medium">
                      Sri Sri Radha Madhava Sundar Temple
                    </p>
                  </div>
                </div>

                <div className="sm:text-right bg-slate-950/80 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Registration Pass ID
                  </span>
                  <span className="font-mono font-black text-lg sm:text-xl text-orange-400">
                    {completedRegistration.registrationNumber}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Date: {completedRegistration.registrationDate}
                  </span>
                </div>
              </div>

              {/* Devotee & Tour Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-6 border-b border-slate-800 text-xs sm:text-sm">
                <div className="space-y-3">
                  <div>
                    <span className="text-slate-400 text-xs block">Devotee / Pilgrim Name:</span>
                    <strong className="text-white text-base font-bold">
                      {completedRegistration.fullName}
                    </strong>
                  </div>
                  {completedRegistration.leaderName && (
                    <div>
                      <span className="text-slate-400 text-xs block">Leader's Name / Group Leader:</span>
                      <strong className="text-amber-300 font-bold flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        {completedRegistration.leaderName}
                      </strong>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 text-xs block">Contact Phone / WhatsApp:</span>
                    <strong className="text-slate-200 font-mono">
                      {completedRegistration.phoneNumber}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">Address / Center:</span>
                    <span className="text-slate-300">
                      {completedRegistration.address || 'Durgapur'}
                    </span>
                  </div>
                  {completedRegistration.age && (
                    <div>
                      <span className="text-slate-400 text-xs block">Age & Gender:</span>
                      <span className="text-slate-300">
                        {completedRegistration.age} yrs • {completedRegistration.gender || 'Not specified'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3 sm:border-l sm:border-slate-800 sm:pl-6">
                  <div>
                    <span className="text-slate-400 text-xs block">Yatra Name:</span>
                    <strong className="text-orange-400 font-bold">
                      {completedRegistration.tourName}
                    </strong>
                  </div>
                  {currentTourObj && (
                    <>
                      <div>
                        <span className="text-slate-400 text-xs block">Destination:</span>
                        <span className="text-slate-300 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-orange-400" />
                          {currentTourObj.destination}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-xs block">Yatra Schedule:</span>
                        <span className="text-slate-300 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-orange-400" />
                          {currentTourObj.startDate} to {currentTourObj.endDate}
                        </span>
                      </div>
                    </>
                  )}
                  <div>
                    <span className="text-slate-400 text-xs block">Seat Type / Travel Class:</span>
                    <strong className="text-emerald-400 font-bold">
                      {completedRegistration.seatType || 'None'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">Seat Allocation:</span>
                    <span className="text-amber-400 font-medium">
                      Seat assignment by Yatra Coordinator prior to boarding
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="py-6 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                  Payment Summary
                </span>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
                    <span className="text-[11px] text-slate-400 block mb-1">Total Tour Fee</span>
                    <span className="font-mono font-bold text-white text-base sm:text-lg">
                      {formatINR(completedRegistration.agreedFee)}
                    </span>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3">
                    <span className="text-[11px] text-emerald-400 font-bold block mb-1">Amount Paid</span>
                    <span className="font-mono font-bold text-emerald-400 text-base sm:text-lg">
                      {formatINR(completedRegistration.paidAmount)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {completedRegistration.paymentMethod}
                    </span>
                  </div>
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3">
                    <span className="text-[11px] text-rose-400 font-bold block mb-1">Balance Due</span>
                    <span className="font-mono font-bold text-rose-400 text-base sm:text-lg">
                      {formatINR(completedRegistration.dueAmount)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {completedRegistration.dueAmount > 0 ? 'Pay before boarding' : 'Fully Cleared'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Important Pilgrim Guidelines */}
              <div className="pt-4 text-xs text-slate-400 space-y-1">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                  <span>
                    Please take a screenshot or print this slip. Our yatra coordinators will reach out on your WhatsApp number with bus timing, boarding spot, and packing guidelines.
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons: WhatsApp Share & Print & Another Registration */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 print:hidden">
              <a
                href={getWhatsAppShareUrl(completedRegistration)}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-600/25 transition-all text-sm"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Slip on WhatsApp</span>
              </a>

              <button
                onClick={() => window.print()}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold border border-slate-700 transition-all text-sm cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF Slip</span>
              </button>

              <button
                onClick={handleResetForAnother}
                className="w-full sm:w-auto py-3 px-5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-bold text-sm shadow-md shadow-orange-500/20 cursor-pointer"
              >
                Register Another Pilgrim
              </button>
            </div>
          </div>
        ) : (
          /* =========================================================
             PUBLIC SELF-REGISTRATION FORM
             ========================================================= */
          <div className="space-y-6">
            {/* Spiritual Devotional Hero Card */}
            <div className="bg-gradient-to-r from-orange-950/60 via-slate-900 to-amber-950/60 border border-orange-500/20 rounded-3xl p-6 sm:p-8 text-center relative overflow-hidden shadow-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-xs font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Holy Dham Pilgrimage</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
                Devotee Self-Registration
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
                Fill out the form below to reserve your holy yatra seat. Your registration is saved in real-time and a digital slip will be generated instantly.
              </p>
              <div className="mt-4 pt-4 border-t border-orange-500/10 text-[11px] text-amber-300/80 italic font-medium">
                "Hare Krishna Hare Krishna Krishna Krishna Hare Hare / Hare Rama Hare Rama Rama Rama Hare Hare"
              </div>
            </div>

            {/* If no tours are configured yet */}
            {tours.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
                <Compass className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-lg font-bold text-white">No Active Tours Available</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  There are currently no open pilgrimage tours configured. Please contact temple administration or check back soon.
                </p>
                <button
                  onClick={onSwitchToAdmin}
                  className="px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold"
                >
                  Go to Admin Panel to Create Tour
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 1. SELECT TOUR SECTION */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                    <Compass className="w-5 h-5 text-orange-400" />
                    <h3 className="font-extrabold text-white text-base">
                      1. Select Pilgrimage Tour
                    </h3>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold text-xs mb-2">
                      Choose Your Destination Tour *
                    </label>
                    <select
                      value={selectedTourName}
                      onChange={(e) => setSelectedTourName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      {tours.map(t => (
                        <option key={t.id} value={t.name}>
                          {t.name} ({t.destination}) • {formatINR(t.defaultFee)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Highlight of Selected Tour */}
                  {currentTourObj && (
                    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-orange-400 flex-shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Destination</span>
                          <span className="font-semibold text-white">{currentTourObj.destination}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-400 flex-shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Yatra Dates</span>
                          <span className="font-semibold text-white">{currentTourObj.startDate} to {currentTourObj.endDate}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Tour Fee</span>
                          <span className="font-bold text-emerald-400 font-mono text-sm">{formatINR(currentTourObj.defaultFee)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. PILGRIM PERSONAL DETAILS */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                    <User className="w-5 h-5 text-orange-400" />
                    <h3 className="font-extrabold text-white text-base">
                      2. Devotee / Pilgrim Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Full Legal Name (as per Aadhaar/ID) *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Ramesh Chandra Sharma"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                          <span>Leader's Name (দলনেতা)</span>
                        </span>
                        <span className="text-[10px] text-amber-400 font-normal">Optional</span>
                      </label>
                      <input
                        type="text"
                        value={leaderName}
                        onChange={(e) => setLeaderName(e.target.value)}
                        placeholder="e.g. HG Govinda Das / Self"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Spiritual Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={spiritualName}
                        onChange={(e) => setSpiritualName(e.target.value)}
                        placeholder="e.g. Radha Govinda Das"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Gender *</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as 'Male' | 'Female' | 'Other')}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-orange-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => handleDobChange(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Age (Years)</label>
                      <input
                        type="number"
                        min="1"
                        max="125"
                        value={age}
                        onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="e.g. 45"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* Seat Type Drop Down Menu */}
                  <div className="text-xs">
                    <label className="block text-slate-300 font-semibold mb-1">
                      Seat Type (Drop Down Menu) *
                    </label>
                    <select
                      value={seatType}
                      onChange={(e) => setSeatType(e.target.value as SeatType)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-orange-500 cursor-pointer font-medium"
                    >
                      {SEAT_TYPE_OPTIONS.map((st) => (
                        <option key={st} value={st} className="bg-slate-900 text-slate-100">
                          {st}
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      Select your preferred travel / coach class for this pilgrimage yatra.
                    </span>
                  </div>

                  {/* Phone & WhatsApp */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Mobile Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="e.g. 9876543210"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-200 text-sm font-mono focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-300 font-semibold">
                          WhatsApp Number *
                        </label>
                        <label className="flex items-center gap-1.5 text-[11px] text-orange-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={sameAsCalling}
                            onChange={(e) => setSameAsCalling(e.target.checked)}
                            className="rounded border-slate-700 bg-slate-900 text-orange-500 focus:ring-0"
                          />
                          Same as calling
                        </label>
                      </div>
                      <input
                        type="tel"
                        disabled={sameAsCalling}
                        value={sameAsCalling ? phoneNumber : whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm font-mono focus:outline-none focus:border-orange-500 ${
                          sameAsCalling ? 'opacity-60 cursor-not-allowed' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">City / Town *</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Durgapur"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-slate-300 font-semibold mb-1">Residential Address / Landmark</label>
                      <input
                        type="text"
                        value={fullAddress}
                        onChange={(e) => setFullAddress(e.target.value)}
                        placeholder="e.g. B-Zone, Steel Township, Near City Centre"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* Live Duplicate Warning */}
                  {liveDuplicate && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-xs text-rose-200 animate-in fade-in">
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <div className="font-bold text-rose-400 text-sm flex items-center gap-1.5">
                          <span>Already Registered</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono">
                            #{liveDuplicate.registrationNumber}
                          </span>
                        </div>
                        <p className="text-slate-300">
                          A registration with Name <strong className="text-white">"{liveDuplicate.fullName}"</strong> and Mobile <strong className="text-white font-mono">{liveDuplicate.phoneNumber}</strong> was already completed on <strong className="text-white font-mono">{liveDuplicate.registrationDate}</strong> for <strong className="text-amber-300">{liveDuplicate.tourName}</strong>.
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Submitting will display the duplicate entry verification popup so you can access your existing registration pass.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. SAFETY & SPECIAL REQUESTS */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                    <ShieldCheck className="w-5 h-5 text-orange-400" />
                    <h3 className="font-extrabold text-white text-base">
                      3. Yatra Safety & Preferences
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Emergency Contact Person Name
                      </label>
                      <input
                        type="text"
                        value={emergencyContactName}
                        onChange={(e) => setEmergencyContactName(e.target.value)}
                        placeholder="e.g. Brother, Son, Spouse"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Emergency Contact Phone Number
                      </label>
                      <input
                        type="tel"
                        value={emergencyContactPhone}
                        onChange={(e) => setEmergencyContactPhone(e.target.value)}
                        placeholder="e.g. 9812345678"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm font-mono focus:outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="block text-slate-300 font-semibold mb-1">
                      Special Requests (Medical assistance, ground-floor room for senior citizen, diet, etc.)
                    </label>
                    <input
                      type="text"
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      placeholder="e.g. Senior citizen requires lower berth / walking assistance"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* 4. TOUR FEE & PAYMENT CHOICE */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-extrabold text-white text-base">
                      4. Tour Fee Contribution & Payment
                    </h3>
                  </div>

                  {/* Summary Bar */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block">Total Tour Fee:</span>
                      <strong className="text-white text-xl font-bold font-mono">
                        {formatINR(totalTourFee)}
                      </strong>
                    </div>
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-emerald-400 block font-semibold">Paying Now:</span>
                        <strong className="text-emerald-400 text-base font-bold font-mono">
                          {formatINR(calculatedPaidAmount)}
                        </strong>
                      </div>
                      <div className="border-l border-slate-800 pl-4">
                        <span className="text-rose-400 block font-semibold">Balance Due:</span>
                        <strong className="text-rose-400 text-base font-bold font-mono">
                          {formatINR(calculatedDueAmount)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Payment Options Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {/* Token Advance */}
                    <button
                      type="button"
                      onClick={() => setPaymentChoice('pay_token')}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        paymentChoice === 'pay_token'
                          ? 'bg-orange-500/10 border-orange-500 text-white shadow-lg shadow-orange-500/10'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase text-orange-400">Option 1</span>
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          paymentChoice === 'pay_token' ? 'border-orange-500 bg-orange-500' : 'border-slate-600'
                        }`}>
                          {paymentChoice === 'pay_token' && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                      </div>
                      <div className="font-bold text-sm text-white mb-0.5">Pay Token Advance</div>
                      <div className="text-[11px] text-slate-400">Reserve seat with token amount, pay balance later.</div>
                    </button>

                    {/* Full Fee */}
                    <button
                      type="button"
                      onClick={() => setPaymentChoice('pay_full')}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        paymentChoice === 'pay_full'
                          ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase text-emerald-400">Option 2</span>
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          paymentChoice === 'pay_full' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
                        }`}>
                          {paymentChoice === 'pay_full' && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                      </div>
                      <div className="font-bold text-sm text-white mb-0.5">Pay Full Amount</div>
                      <div className="text-[11px] text-slate-400">Pay 100% {formatINR(totalTourFee)} upfront via UPI.</div>
                    </button>

                    {/* Cash on Boarding */}
                    <button
                      type="button"
                      onClick={() => setPaymentChoice('pay_cash')}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        paymentChoice === 'pay_cash'
                          ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg shadow-amber-500/10'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase text-amber-400">Option 3</span>
                        <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          paymentChoice === 'pay_cash' ? 'border-amber-500 bg-amber-500' : 'border-slate-600'
                        }`}>
                          {paymentChoice === 'pay_cash' && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                      </div>
                      <div className="font-bold text-sm text-white mb-0.5">Cash on Boarding</div>
                      <div className="text-[11px] text-slate-400">Register now, pay cash at temple or before departure.</div>
                    </button>
                  </div>

                  {/* If Token Advance is selected: Custom token input */}
                  {paymentChoice === 'pay_token' && (
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
                      <label className="block text-slate-300 font-semibold">
                        Enter Advance Token Amount (₹)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          min="100"
                          max={totalTourFee}
                          value={tokenAmount}
                          onChange={(e) => setTokenAmount(Number(e.target.value || 0))}
                          className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 font-mono text-base font-bold text-orange-400 focus:outline-none focus:border-orange-500 w-44"
                        />
                        <div className="flex items-center gap-2">
                          {[500, 1000, 2000].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setTokenAmount(val)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium cursor-pointer"
                            >
                              ₹{val}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* If Paying via UPI (Full or Token): Show Temple UPI Details */}
                  {(paymentChoice === 'pay_token' || paymentChoice === 'pay_full') && (
                    <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          Temple UPI Payment Details
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Scan or transfer using any UPI App
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-3.5 rounded-xl border border-slate-800">
                        <div>
                          <span className="text-[11px] text-slate-400 block">ISKCON Durgapur UPI ID:</span>
                          <span className="font-mono font-bold text-base text-white select-all">
                            iskcon.durgapur@sbi
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('iskcon.durgapur@sbi');
                            setCopiedUpi(true);
                            setTimeout(() => setCopiedUpi(false), 2500);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer border border-slate-700 self-start sm:self-auto"
                        >
                          {copiedUpi ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Copied UPI ID!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-orange-400" />
                              <span>Copy UPI ID</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="text-xs">
                        <label className="block text-slate-300 font-semibold mb-1">
                          UPI Reference / UTR Number (Optional, for instant verification)
                        </label>
                        <input
                          type="text"
                          value={upiRefId}
                          onChange={(e) => setUpiRefId(e.target.value)}
                          placeholder="e.g. 12-digit UTR from GPay / PhonePe / Paytm"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 text-xs font-mono focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. SUBMIT REGISTRATION BUTTON */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-2xl font-black text-base sm:text-lg shadow-xl shadow-orange-500/25 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Saving Devotee Registration...</span>
                    ) : (
                      <>
                        <UserCheck className="w-5 h-5" />
                        <span>Confirm & Submit Self-Registration</span>
                      </>
                    )}
                  </button>
                  <p className="text-center text-slate-500 text-xs mt-2.5">
                    Your details are secured in real-time. A digital yatra pass will be issued immediately upon confirmation.
                  </p>
                </div>
              </form>
            )}
          </div>
        )}
      </main>

      {/* Duplicate Entry Verification Popup Modal */}
      <DuplicateEntryModal
        isOpen={showDuplicateModal}
        onClose={() => {
          setShowDuplicateModal(false);
          setPendingRegData(null);
        }}
        duplicate={duplicateMatch}
        onProceedAnyway={pendingRegData ? () => commitRegistration(pendingRegData) : undefined}
        onViewExisting={() => {
          if (duplicateMatch) {
            setCompletedRegistration(duplicateMatch);
            setShowDuplicateModal(false);
          }
        }}
        viewExistingLabel="View My Registration Pass"
        isDevoteePortal={true}
      />

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500 print:hidden">
        <p>
          International Society for Krishna Consciousness (ISKCON), Durgapur • Founder-Acharya: A.C. Bhaktivedanta Swami Prabhupada
        </p>
      </footer>
    </div>
  );
};
