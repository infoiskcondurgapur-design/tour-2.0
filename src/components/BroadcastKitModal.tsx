import React, { useState, useMemo } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  MessageSquare, 
  Send, 
  Compass, 
  Calendar, 
  MapPin, 
  Clock, 
  Phone, 
  AlertCircle,
  Users,
  Armchair,
  Wallet
} from 'lucide-react';
import { PassengerRegistration, Tour } from '../types';

interface BroadcastKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourName: string;
  tour?: Tour | null;
  registrations: PassengerRegistration[];
}

export const BroadcastKitModal: React.FC<BroadcastKitModalProps> = ({
  isOpen,
  onClose,
  tourName,
  tour,
  registrations,
}) => {
  const [activeTab, setActiveTab] = useState<'departure' | 'seats' | 'dues' | 'packing'>('departure');
  const [copied, setCopied] = useState(false);

  // Customizer fields
  const [reportingPlace, setReportingPlace] = useState('ISKCON Durgapur Temple Complex, City Centre');
  const [reportingTime, setReportingTime] = useState('05:30 AM');
  const [departureTime, setDepartureTime] = useState('06:00 AM');
  const [busNumber, setBusNumber] = useState('WB-02-YATRA-01 (AC Deluxe)');
  const [coordinatorPhone, setCoordinatorPhone] = useState('+91 98311 22334 / +91 94344 55667');
  const [upiId, setUpiId] = useState('iskcon.yatra@upi');

  // Filter registrations for this tour
  const tourRegistrations = useMemo(() => {
    return registrations.filter(r => (r.tourName || '').trim().toLowerCase() === tourName.trim().toLowerCase());
  }, [registrations, tourName]);

  // Pilgrims with pending dues
  const duePilgrims = useMemo(() => {
    return tourRegistrations.filter(r => r.dueAmount > 0);
  }, [tourRegistrations]);

  // Currency Formatter
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Generate Message Content based on tab
  const messageText = useMemo(() => {
    if (activeTab === 'departure') {
      return `🙏 *Hare Krishna! ISKCON Durgapur Yatra Notice* 🙏\n\n` +
        `🚩 *Tour:* ${tourName} (${tour?.destination || 'Holy Dham'})\n` +
        `📅 *Dates:* ${tour?.startDate || 'Upcoming'} to ${tour?.endDate || 'End'}\n\n` +
        `📍 *Reporting Place:* ${reportingPlace}\n` +
        `⏰ *Reporting Time:* ${reportingTime}\n` +
        `🚌 *Departure Time:* ${departureTime} (Sharp)\n` +
        `🚍 *Bus / Coach:* ${busNumber}\n\n` +
        `📞 *Emergency / Coordinator Contacts:*\n${coordinatorPhone}\n\n` +
        `⚠️ *Important Instructions:*\n` +
        `• Please carry your original Aadhaar Card / Govt ID.\n` +
        `• Bring your personal prescribed medicines and essential warm/cotton clothing.\n` +
        `• Devotees are requested to maintain punctuality to avoid departure delays.\n\n` +
        `_Jay Jagannath! Hare Krishna!_`;
    }

    if (activeTab === 'seats') {
      const sortedSeats = [...tourRegistrations].sort((a, b) => {
        const sa = parseInt(a.seatNumber || '999', 10);
        const sb = parseInt(b.seatNumber || '999', 10);
        return sa - sb;
      });

      const seatListText = sortedSeats.map((p, i) => {
        const seatStr = p.seatNumber ? `*Seat ${p.seatNumber}*` : '_Seat Unassigned_';
        const leaderStr = p.leaderName ? ` (Group: ${p.leaderName})` : '';
        return `${i + 1}. ${seatStr}: ${p.fullName}${leaderStr}`;
      }).join('\n');

      return `🙏 *Hare Krishna! Seat Allotment Chart* 🙏\n\n` +
        `🚩 *Tour:* ${tourName}\n` +
        `🚌 *Coach:* ${busNumber}\n` +
        `👥 *Total Devotees:* ${tourRegistrations.length}\n\n` +
        `📋 *Official Seat Allocation List:*\n` +
        `${seatListText}\n\n` +
        `⚠️ Please occupy your allotted seats peacefully and assist senior citizens.\n\n` +
        `📞 *Queries Contact:* ${coordinatorPhone}`;
    }

    if (activeTab === 'dues') {
      const dueListText = duePilgrims.map((p, i) => {
        return `${i + 1}. *${p.fullName}* (#${p.registrationNumber}) — Due: *${formatINR(p.dueAmount)}*`;
      }).join('\n');

      return `🙏 *Hare Krishna! Friendly Reminder for Tour Fee Balance* 🙏\n\n` +
        `🚩 *Tour:* ${tourName}\n\n` +
        `Dear Devotees, all registered yatris are kindly requested to clear their pending tour balance prior to departure.\n\n` +
        `📋 *Pending Dues Summary:*\n` +
        `${dueListText || 'All devotee balances are currently clear! Hare Krishna!'}\n\n` +
        `💳 *Payment Options:*\n` +
        `• UPI ID: *${upiId}*\n` +
        `• Or pay Cash directly at the Temple Accounts Office.\n\n` +
        `After payment, please send screenshot to: ${coordinatorPhone}\n\n` +
        `_Thank you for your kind cooperation._`;
    }

    // Packing guidelines
    return `🙏 *Hare Krishna! Yatra Checklist & Guidelines* 🙏\n\n` +
      `🚩 *Tour:* ${tourName}\n\n` +
      `🎒 *What to Carry:*\n` +
      `1. Original Photo ID (Aadhaar / Voter ID / Passport) - *Mandatory*\n` +
      `2. 1-2 water bottles (refillable)\n` +
      `3. Regular prescribed medications with doctor prescription\n` +
      `4. Tilak, Japa Mala & Bead bag\n` +
      `5. Traditional Vaishnava attire (Dhoti/Kurta for Prabhujis, Saree/Suit for Matajis)\n` +
      `6. Light shawl/bedsheet for night travel\n` +
      `7. Power bank & phone charger\n\n` +
      `🚫 *Please Avoid:*\n` +
      `• Heavy precious jewelry or excess cash\n` +
      `• Plastic carry bags\n\n` +
      `📞 *Tour Helpline:* ${coordinatorPhone}\n\n` +
      `_Haribol! Wishing you a transcendentally blissful pilgrimage!_`;
  }, [
    activeTab, 
    tourName, 
    tour, 
    reportingPlace, 
    reportingTime, 
    departureTime, 
    busNumber, 
    coordinatorPhone, 
    upiId, 
    tourRegistrations, 
    duePilgrims
  ]);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>WhatsApp Broadcast & Notice Kit</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  {tourRegistrations.length} Pilgrims
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                1-click formatted announcements for {tourName} WhatsApp groups & pilgrims
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Selector Tabs */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/60 flex flex-wrap gap-2 flex-shrink-0 text-xs">
          <button
            onClick={() => setActiveTab('departure')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'departure'
                ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Departure & Reporting</span>
          </button>

          <button
            onClick={() => setActiveTab('seats')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'seats'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Armchair className="w-3.5 h-3.5" />
            <span>Seat Allotment Chart</span>
          </button>

          <button
            onClick={() => setActiveTab('dues')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'dues'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Due Reminder ({duePilgrims.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('packing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'packing'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Yatra Checklist & Packing</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-950/40">
          
          {/* Left Column: Quick Parameters Editor */}
          <div className="lg:col-span-5 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Customize Announcement Details
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reporting Location
              </label>
              <input
                type="text"
                value={reportingPlace}
                onChange={(e) => setReportingPlace(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reporting Time
                </label>
                <input
                  type="text"
                  value={reportingTime}
                  onChange={(e) => setReportingTime(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Departure Time
                </label>
                <input
                  type="text"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Bus / Coach Details
              </label>
              <input
                type="text"
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Coordinator Contacts
              </label>
              <input
                type="text"
                value={coordinatorPhone}
                onChange={(e) => setCoordinatorPhone(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                UPI Payment ID
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Right Column: Live Formatted WhatsApp Message Preview */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Live WhatsApp Message Preview
              </span>
              <span className="text-[11px] text-emerald-400 font-medium">
                Ready to Send
              </span>
            </div>

            {/* WhatsApp Chat Simulation Bubble */}
            <div className="flex-1 bg-[#0b141a] border border-emerald-500/20 rounded-2xl p-4 font-sans text-xs sm:text-sm text-slate-200 whitespace-pre-wrap overflow-y-auto max-h-[340px] shadow-inner select-text">
              {messageText}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-800">
              <button
                onClick={handleCopy}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs sm:text-sm font-bold border border-slate-700 transition-all cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-400" />
                    <span>Copy Message</span>
                  </>
                )}
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/25 transition-all cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>Share on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
