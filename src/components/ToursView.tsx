import React, { useState } from 'react';
import { 
  Compass, 
  Plus, 
  MapPin, 
  Calendar, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  AlertCircle, 
  Trash2, 
  Search,
  Wallet,
  CheckCircle2,
  X
} from 'lucide-react';
import { Tour, TourStatus, FinancialTransaction, PassengerRegistration } from '../types';

interface ToursViewProps {
  tours: Tour[];
  transactions: FinancialTransaction[];
  registrations: PassengerRegistration[];
  onAddTour: (tour: Tour) => void;
  onDeleteTour: (id: string) => void;
  onUpdateTourStatus: (id: string, status: TourStatus) => void;
}

export const ToursView: React.FC<ToursViewProps> = ({
  tours,
  transactions,
  registrations,
  onAddTour,
  onDeleteTour,
  onUpdateTourStatus,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [defaultFee, setDefaultFee] = useState<number | ''>(5000);
  const [budget, setBudget] = useState<number | ''>(200000);
  const [status, setStatus] = useState<TourStatus>('registration_open');
  const [notes, setNotes] = useState('');

  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const handleCreateTour = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !code || !destination || !startDate || !endDate) {
      alert('Please fill all required fields.');
      return;
    }

    const newTour: Tour = {
      id: 'tour-' + Date.now(),
      name: name.trim(),
      code: code.trim().toUpperCase(),
      destination: destination.trim(),
      startDate,
      endDate,
      defaultFee: Number(defaultFee || 0),
      budget: Number(budget || 0),
      status,
      notes: notes.trim(),
    };

    onAddTour(newTour);

    // Reset Form
    setName('');
    setCode('');
    setDestination('');
    setStartDate('');
    setEndDate('');
    setDefaultFee(5000);
    setBudget(200000);
    setStatus('registration_open');
    setNotes('');
    setIsModalOpen(false);
  };

  // Filtered tours
  const filteredTours = tours.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (st: TourStatus) => {
    switch (st) {
      case 'registration_open':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[11px] font-bold">Registration Open</span>;
      case 'ongoing':
        return <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded text-[11px] font-bold">Ongoing</span>;
      case 'planning':
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[11px] font-bold">Planning</span>;
      case 'completed':
        return <span className="bg-slate-700/60 text-slate-300 border border-slate-600 px-2 py-0.5 rounded text-[11px] font-bold">Completed</span>;
      case 'archived':
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded text-[11px] font-bold">Archived</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-orange-400" />
            Tours & Yatras Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Configure pilgrimage tours, monitor individual tour earnings, expenses, refunds, and dues.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Tour
        </button>
      </div>

      {/* Search Bar */}
      {tours.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tour by name, code or destination..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
            />
          </div>
          <span className="text-slate-400">Total Tours: <strong>{tours.length}</strong></span>
        </div>
      )}

      {/* Tours Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTours.map((tour) => {
          // Calculate tour-specific financial numbers
          const tourTxs = transactions.filter(t => t.tourName === tour.name || t.tourId === tour.id);
          const tourRegs = registrations.filter(r => r.tourName === tour.name);

          let earning = 0;
          let expenses = 0;
          let refund = 0;
          let due = 0;

          tourTxs.forEach(t => {
            const amt = Number(t.amount || 0);
            if (t.type === 'earning') earning += amt;
            else if (t.type === 'expense') expenses += amt;
            else if (t.type === 'refund') refund += amt;
            else if (t.type === 'due') due += amt;
          });

          const netSurplus = earning - expenses - refund;

          return (
            <div
              key={tour.id}
              className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all"
            >
              <div>
                {/* Title & Status */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded">
                        {tour.code}
                      </span>
                      {getStatusBadge(tour.status)}
                    </div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {tour.name}
                    </h3>
                  </div>

                  <button
                    onClick={() => onDeleteTour(tour.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Delete tour"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Destination & Dates */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 my-3">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                    <span className="truncate">{tour.destination}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                    <span>{tour.startDate} to {tour.endDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span>Registered: <strong className="text-white">{tourRegs.length}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>Default Fee: <strong className="text-white">{formatINR(tour.defaultFee)}</strong></span>
                  </div>
                </div>

                {/* Financial Indicators for this specific Tour */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2">
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase block">Earning</span>
                    <span className="font-mono font-bold text-white text-sm">{formatINR(earning)}</span>
                  </div>
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <span className="text-[10px] text-amber-400 font-bold uppercase block">Expenses</span>
                    <span className="font-mono font-bold text-white text-sm">{formatINR(expenses)}</span>
                  </div>
                  <div className="p-2.5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <span className="text-[10px] text-purple-400 font-bold uppercase block">Refund</span>
                    <span className="font-mono font-bold text-white text-sm">{formatINR(refund)}</span>
                  </div>
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                    <span className="text-[10px] text-rose-400 font-bold uppercase block">Due</span>
                    <span className="font-mono font-bold text-white text-sm">{formatINR(due)}</span>
                  </div>
                </div>
              </div>

              {/* Net Surplus Footer */}
              <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Net Tour Surplus:</span>
                <span className={`font-mono font-bold text-sm ${netSurplus >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatINR(netSurplus)}
                </span>
              </div>
            </div>
          );
        })}

        {filteredTours.length === 0 && (
          <div className="col-span-full bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-10 text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-3">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-white text-base">No Tours Created Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
              Add your pilgrimage tours here. Once created, they will automatically appear in your Registration Form and Financial Dashboard.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create First Tour
            </button>
          </div>
        )}
      </div>

      {/* Create Tour Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">Create New Tour</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTour} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tour Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mayapur Gaura Purnima Yatra 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Tour Code (Unique) *</label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. MYP-2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-slate-200 focus:outline-none focus:border-orange-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Destination *</label>
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. Sri Mayapur Dham, WB"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Default Fee (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={defaultFee}
                    onChange={(e) => setDefaultFee(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Estimated Budget (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tour Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as TourStatus)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="planning">Planning</option>
                  <option value="registration_open">Registration Open</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notes / Description</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional details..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 rounded-xl font-medium hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-bold hover:from-orange-600 hover:to-amber-600 shadow-md shadow-orange-500/20"
                >
                  Create Tour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
