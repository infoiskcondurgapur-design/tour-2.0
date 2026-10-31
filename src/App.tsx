import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  RotateCcw, 
  AlertCircle, 
  Wallet, 
  Plus, 
  Filter, 
  Calendar, 
  Compass, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  X,
  Trash2,
  Menu,
  UserPlus,
  Users,
  Armchair,
  Database,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { FinancialTransaction, TransactionType, PassengerRegistration, Tour, TourStatus, RefundStatus } from './types';
import { Sidebar } from './components/Sidebar';
import { RegistrationView } from './components/RegistrationView';
import { PassengersRosterView } from './components/PassengersRosterView';
import { ToursView } from './components/ToursView';
import { SeatAllocationView } from './components/SeatAllocationView';
import { 
  supabase, 
  isSupabaseConfigured,
  fetchToursFromDb,
  upsertTourInDb,
  deleteTourFromDb,
  fetchRegistrationsFromDb,
  upsertRegistrationInDb,
  deleteRegistrationFromDb,
  fetchTransactionsFromDb,
  upsertTransactionInDb,
  deleteTransactionFromDb,
  deleteTransactionsForPassengerInDb,
  getActiveSupabaseConfig,
  setCustomSupabaseCredentials,
  clearCustomSupabaseCredentials
} from './lib/supabase';

const TX_STORAGE_KEY = 'real_finance_dashboard_data_v1';
const REG_STORAGE_KEY = 'real_finance_registrations_v1';
const TOURS_STORAGE_KEY = 'real_finance_tours_v1';

export function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'registration' | 'roster' | 'tours' | 'seats'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load tours from localStorage with zero dummy fallback
  const [tours, setTours] = useState<Tour[]>(() => {
    try {
      const saved = localStorage.getItem(TOURS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load transactions strictly from localStorage with zero dummy fallback
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(TX_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Load registrations from localStorage with zero dummy fallback
  const [registrations, setRegistrations] = useState<PassengerRegistration[]>(() => {
    try {
      const saved = localStorage.getItem(REG_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedTour, setSelectedTour] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<'connected' | 'syncing' | 'offline' | 'needs_setup'>('syncing');
  const [showDbModal, setShowDbModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState(() => getActiveSupabaseConfig().url);
  const [customKeyInput, setCustomKeyInput] = useState(() => getActiveSupabaseConfig().key);
  const [showCredentialInputs, setShowCredentialInputs] = useState(false);

  // Cloud Database (Supabase) Sync & Realtime Listener
  useEffect(() => {
    let isMounted = true;

    async function syncCloudData() {
      if (!supabase || !isSupabaseConfigured) {
        if (isMounted) setDbStatus('offline');
        return;
      }

      try {
        if (isMounted) setDbStatus('syncing');
        const [remoteTours, remoteRegs, remoteTxs] = await Promise.all([
          fetchToursFromDb(),
          fetchRegistrationsFromDb(),
          fetchTransactionsFromDb(),
        ]);

        if (!isMounted) return;

        // If all 3 returned null, tables do not exist yet on Supabase
        if (remoteTours === null && remoteRegs === null && remoteTxs === null) {
          setDbStatus('needs_setup');
          return;
        }

        // 1. Sync Tours
        if (remoteTours !== null) {
          if (remoteTours.length > 0) {
            setTours(remoteTours);
          } else if (tours.length > 0) {
            // Push existing local tours to cloud
            for (const t of tours) {
              await upsertTourInDb(t);
            }
          }
        }

        // 2. Sync Registrations
        if (remoteRegs !== null) {
          if (remoteRegs.length > 0) {
            setRegistrations(remoteRegs);
          } else if (registrations.length > 0) {
            // Push existing local registrations to cloud
            for (const r of registrations) {
              await upsertRegistrationInDb(r);
            }
          }
        }

        // 3. Sync Transactions
        if (remoteTxs !== null) {
          if (remoteTxs.length > 0) {
            setTransactions(remoteTxs);
          } else if (transactions.length > 0) {
            // Push existing local transactions to cloud
            for (const tx of transactions) {
              await upsertTransactionInDb(tx);
            }
          }
        }

        setDbStatus('connected');
      } catch (e) {
        console.warn('Initial cloud sync exception:', e);
        if (isMounted) setDbStatus('offline');
      }
    }

    syncCloudData();

    // Subscribe to realtime changes so all devices stay in sync
    if (supabase) {
      const channel = supabase
        .channel('realtime_tour_channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tour_tours' }, async () => {
          const fresh = await fetchToursFromDb();
          if (fresh && isMounted) setTours(fresh);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tour_registrations' }, async () => {
          const fresh = await fetchRegistrationsFromDb();
          if (fresh && isMounted) setRegistrations(fresh);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tour_transactions' }, async () => {
          const fresh = await fetchTransactionsFromDb();
          if (fresh && isMounted) setTransactions(fresh);
        })
        .subscribe();

      return () => {
        isMounted = false;
        supabase?.removeChannel(channel);
      };
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync state to localStorage as instant offline cache
  useEffect(() => {
    try {
      localStorage.setItem(TOURS_STORAGE_KEY, JSON.stringify(tours));
    } catch (e) {
      console.error('Failed to save tours to localStorage', e);
    }
  }, [tours]);

  useEffect(() => {
    try {
      localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions to localStorage', e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(REG_STORAGE_KEY, JSON.stringify(registrations));
    } catch (e) {
      console.error('Failed to save registrations to localStorage', e);
    }
  }, [registrations]);

  // Derive unique tour names from tours table, transactions, and registrations
  const uniqueTours = useMemo(() => {
    const tourSet = new Set<string>();
    tours.forEach(t => tourSet.add(t.name));
    transactions.forEach(t => {
      if (t.tourName) tourSet.add(t.tourName);
    });
    registrations.forEach(r => {
      if (r.tourName) tourSet.add(r.tourName);
    });
    return Array.from(tourSet);
  }, [tours, transactions, registrations]);

  // Modal form state for generic entry
  const [formData, setFormData] = useState({
    type: 'earning' as TransactionType,
    tourName: '',
    partyName: '',
    category: 'Passenger Payment',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'UPI' as 'Cash' | 'UPI' | 'Bank Transfer' | 'Pending',
    notes: '',
  });

  // Filtered transactions by Tour
  const tourFilteredTransactions = useMemo(() => {
    if (selectedTour === 'ALL') return transactions;
    return transactions.filter(t => t.tourName === selectedTour);
  }, [transactions, selectedTour]);

  // The 4 Core Requested Metrics + Net Balance (Calculated strictly from real entries)
  const { totalEarning, totalExpenses, totalRefund, totalDue, netBalance } = useMemo(() => {
    let earning = 0;
    let expense = 0;
    let refund = 0;
    let due = 0;

    tourFilteredTransactions.forEach(t => {
      const amt = Number(t.amount || 0);
      if (t.type === 'earning') earning += amt;
      else if (t.type === 'expense') expense += amt;
      else if (t.type === 'refund') refund += amt;
      else if (t.type === 'due') due += amt;
    });

    const net = earning - expense - refund;

    return {
      totalEarning: earning,
      totalExpenses: expense,
      totalRefund: refund,
      totalDue: due,
      netBalance: net,
    };
  }, [tourFilteredTransactions]);

  // Formatter for currency
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Handle Add Entry from Quick Modal
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.partyName || !formData.tourName) return;

    const newTx: FinancialTransaction = {
      id: 'tx-' + Date.now(),
      type: formData.type,
      tourId: formData.tourName.toLowerCase().replace(/\s+/g, '-'),
      tourName: formData.tourName.trim(),
      partyName: formData.partyName.trim(),
      category: formData.category.trim() || 'General',
      amount: Number(formData.amount),
      date: formData.date,
      paymentMethod: formData.type === 'due' ? 'Pending' : formData.paymentMethod,
      notes: formData.notes,
      status: formData.type === 'due' ? 'pending' : 'completed',
    };

    setTransactions(prev => [newTx, ...prev]);
    upsertTransactionInDb(newTx);
    setIsModalOpen(false);
    setFormData({
      type: 'earning',
      tourName: '',
      partyName: '',
      category: 'Passenger Payment',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'UPI',
      notes: '',
    });
  };

  // Handle New Registration: automatically updates Total Earning and Due!
  const handleAddRegistration = (reg: PassengerRegistration) => {
    setRegistrations(prev => [reg, ...prev]);
    upsertRegistrationInDb(reg);

    const newTxs: FinancialTransaction[] = [];

    // If advance paid, record as Earning
    if (reg.paidAmount > 0) {
      newTxs.push({
        id: 'tx-reg-earn-' + Date.now(),
        type: 'earning',
        tourId: reg.tourName.toLowerCase().replace(/\s+/g, '-'),
        tourName: reg.tourName,
        partyName: reg.fullName,
        category: 'Passenger Registration Fee',
        amount: reg.paidAmount,
        date: reg.registrationDate,
        paymentMethod: reg.paymentMethod,
        notes: `Registration #${reg.registrationNumber} initial installment`,
        status: 'completed',
      });
    }

    // If remaining due, record as Due
    if (reg.dueAmount > 0) {
      newTxs.push({
        id: 'tx-reg-due-' + (Date.now() + 1),
        type: 'due',
        tourId: reg.tourName.toLowerCase().replace(/\s+/g, '-'),
        tourName: reg.tourName,
        partyName: reg.fullName,
        category: 'Pending Passenger Due',
        amount: reg.dueAmount,
        date: reg.registrationDate,
        paymentMethod: 'Pending',
        notes: `Registration #${reg.registrationNumber} balance due`,
        status: 'pending',
      });
    }

    if (newTxs.length > 0) {
      setTransactions(prev => [...newTxs, ...prev]);
      newTxs.forEach(tx => upsertTransactionInDb(tx));
    }
  };

  // Tour management handlers
  const handleAddTour = (tour: Tour) => {
    setTours(prev => [tour, ...prev]);
    upsertTourInDb(tour);
  };

  const handleDeleteTour = (id: string) => {
    setTours(prev => prev.filter(t => t.id !== id));
    deleteTourFromDb(id);
  };

  const handleUpdateTourStatus = (id: string, status: TourStatus) => {
    setTours(prev => prev.map(t => {
      if (t.id === id) {
        const updated = { ...t, status };
        upsertTourInDb(updated);
        return updated;
      }
      return t;
    }));
  };

  // Handle Processing Refund for a registered passenger
  const handleProcessPassengerRefund = (
    regId: string,
    refundAmount: number,
    refundReason: string,
    refundMethod: 'Cash' | 'UPI' | 'Bank Transfer',
    cancelBooking: boolean
  ) => {
    const target = registrations.find(r => r.id === regId);
    if (!target) return;

    const currentRefund = target.refundAmount || 0;
    const newTotalRefund = currentRefund + refundAmount;
    const netPaid = Math.max(0, target.paidAmount - newTotalRefund);

    let newRefundStatus: RefundStatus = 'partially_refunded';
    if (newTotalRefund >= target.paidAmount) {
      newRefundStatus = 'fully_refunded';
    } else if (newTotalRefund > 0) {
      newRefundStatus = 'partially_refunded';
    } else {
      newRefundStatus = 'not_refunded';
    }

    let newDue = target.dueAmount;
    let newStatus: 'paid' | 'partial' | 'unpaid' | 'refunded' = target.status;

    if (cancelBooking || newRefundStatus === 'fully_refunded') {
      newDue = 0;
      newStatus = 'refunded';
    } else {
      newDue = Math.max(0, target.agreedFee - netPaid);
      newStatus = netPaid >= target.agreedFee ? 'paid' : netPaid > 0 ? 'partial' : 'unpaid';
    }

    // Update passenger registration record
    const updatedTarget: PassengerRegistration = {
      ...target,
      refundAmount: newTotalRefund,
      refundStatus: newRefundStatus,
      refundReason: refundReason.trim(),
      refundDate: new Date().toISOString().split('T')[0],
      refundMethod,
      dueAmount: newDue,
      status: newStatus,
    };

    setRegistrations(prev =>
      prev.map(r => (r.id === regId ? updatedTarget : r))
    );
    upsertRegistrationInDb(updatedTarget);

    // Automatically create financial transaction of type 'refund' to update dashboard!
    const refundTx: FinancialTransaction = {
      id: 'tx-refund-' + Date.now(),
      type: 'refund',
      tourId: target.tourName.toLowerCase().replace(/\s+/g, '-'),
      tourName: target.tourName,
      partyName: target.fullName,
      category: 'Passenger Refund',
      amount: refundAmount,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: refundMethod,
      notes: `Refund for ${target.fullName} (#${target.registrationNumber})${refundReason ? ': ' + refundReason : ''}${cancelBooking ? ' (Booking Cancelled)' : ''}`,
      status: 'completed',
    };

    setTransactions(prev => [refundTx, ...prev]);
    upsertTransactionInDb(refundTx);
  };

  // Delete registration and clean up associated records
  const handleDeleteRegistration = (id: string) => {
    const target = registrations.find(r => r.id === id);
    if (!target) return;

    setRegistrations(prev => prev.filter(r => r.id !== id));
    deleteRegistrationFromDb(id);
    deleteTransactionsForPassengerInDb(target.tourName, target.fullName);

    // Reconcile transactions: remove dues and advances tied to this deleted registration
    setTransactions(prev =>
      prev.filter(t => 
        !t.notes?.includes(target.registrationNumber) && 
        !(t.partyName === target.fullName && t.tourName === target.tourName)
      )
    );
  };

  // Update registration details
  const handleUpdateRegistration = (updatedReg: PassengerRegistration) => {
    setRegistrations(prev =>
      prev.map(r => (r.id === updatedReg.id ? updatedReg : r))
    );
    upsertRegistrationInDb(updatedReg);
  };

  // Seat Allocation Handlers
  const handleUpdateRegistrationSeat = (
    passengerId: string,
    seatNumber: string | undefined,
    vehicleName: string | undefined
  ) => {
    setRegistrations(prev =>
      prev.map(r => {
        if (r.id !== passengerId) return r;
        const updated = {
          ...r,
          seatNumber,
          vehicleName: seatNumber ? vehicleName : undefined,
        };
        upsertRegistrationInDb(updated);
        return updated;
      })
    );
  };

  const handleBatchUpdateSeats = (
    updates: { passengerId: string; seatNumber: string; vehicleName: string }[]
  ) => {
    const updateMap = new Map<string, { seatNumber: string; vehicleName: string }>();
    updates.forEach(u => updateMap.set(u.passengerId, { seatNumber: u.seatNumber, vehicleName: u.vehicleName }));

    setRegistrations(prev =>
      prev.map(r => {
        const u = updateMap.get(r.id);
        if (!u) return r;
        const updated = {
          ...r,
          seatNumber: u.seatNumber,
          vehicleName: u.vehicleName,
        };
        upsertRegistrationInDb(updated);
        return updated;
      })
    );
  };

  const handleClearAllSeatsForTour = (tourName: string) => {
    setRegistrations(prev =>
      prev.map(r => {
        if (r.tourName !== tourName) return r;
        const updated = {
          ...r,
          seatNumber: undefined,
          vehicleName: undefined,
        };
        upsertRegistrationInDb(updated);
        return updated;
      })
    );
  };

  const allocatedSeatsCount = useMemo(() => {
    return registrations.filter(r => !!r.seatNumber).length;
  }, [registrations]);

  // Delete single transaction
  const handleDeleteTx = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    deleteTransactionFromDb(id);
  };

  // Clear all data
  const handleClearAll = () => {
    if (confirm('Are you sure you want to delete all entries and reset the dashboard to empty?')) {
      setTransactions([]);
      setRegistrations([]);
      setTours([]);
      localStorage.removeItem(TX_STORAGE_KEY);
      localStorage.removeItem(REG_STORAGE_KEY);
      localStorage.removeItem(TOURS_STORAGE_KEY);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          currentView={currentView}
          setCurrentView={setCurrentView}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          totalEarning={totalEarning}
          totalDue={totalDue}
          toursCount={tours.length}
          passengersCount={registrations.length}
          allocatedSeatsCount={allocatedSeatsCount}
        />
      </div>

      {/* Mobile Sidebar Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-50 w-64 h-full bg-slate-900">
            <Sidebar
              currentView={currentView}
              setCurrentView={(v) => {
                setCurrentView(v);
                setMobileMenuOpen(false);
              }}
              collapsed={false}
              setCollapsed={() => setMobileMenuOpen(false)}
              totalEarning={totalEarning}
              totalDue={totalDue}
              toursCount={tours.length}
              passengersCount={registrations.length}
              allocatedSeatsCount={allocatedSeatsCount}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        {/* Top Header */}
        <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                  {currentView === 'dashboard'
                    ? 'Financial Dashboard'
                    : currentView === 'registration'
                    ? 'Passenger Registration'
                    : currentView === 'roster'
                    ? 'Registered Passengers Roster'
                    : currentView === 'tours'
                    ? 'Tours & Yatras Management'
                    : 'Seat Allocation & Coach Map'}
                </h1>
                <p className="text-xs text-slate-400">
                  {currentView === 'dashboard'
                    ? 'Overview: Earning, Expenses, Refund & Due'
                    : currentView === 'registration'
                    ? 'Register new pilgrims & set up initial fees'
                    : currentView === 'roster'
                    ? 'Pilgrim records, user refund status & dues'
                    : currentView === 'tours'
                    ? 'Configure tours, dates, budgets and financials'
                    : 'Interactive vehicle seat assignment & passenger manifests'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Database Status Indicator */}
              <button
                onClick={() => setShowDbModal(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  dbStatus === 'connected'
                    ? 'bg-emerald-950/70 border-emerald-600/70 text-emerald-300 hover:bg-emerald-900/60 shadow-xs shadow-emerald-500/20'
                    : dbStatus === 'syncing'
                    ? 'bg-sky-950/70 border-sky-600/70 text-sky-300 animate-pulse'
                    : dbStatus === 'needs_setup'
                    ? 'bg-amber-950/80 border-amber-500/80 text-amber-300 hover:bg-amber-900/80 shadow-xs shadow-amber-500/20 animate-pulse'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                }`}
                title="Cloud Database (Supabase) status - click to inspect or configure"
              >
                <Database className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {dbStatus === 'connected'
                    ? 'Cloud DB Live'
                    : dbStatus === 'syncing'
                    ? 'Syncing...'
                    : dbStatus === 'needs_setup'
                    ? 'DB Setup Needed'
                    : 'Local Cache'}
                </span>
                <span className={`w-2 h-2 rounded-full ${
                  dbStatus === 'connected'
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                    : dbStatus === 'syncing'
                    ? 'bg-sky-400 animate-ping'
                    : dbStatus === 'needs_setup'
                    ? 'bg-amber-400'
                    : 'bg-slate-500'
                }`} />
              </button>

              {/* Tour Filter (On dashboard when tours exist) */}
              {currentView === 'dashboard' && uniqueTours.length > 0 && (
                <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200">
                  <Filter className="w-3.5 h-3.5 text-orange-400" />
                  <select
                    value={selectedTour}
                    onChange={(e) => setSelectedTour(e.target.value)}
                    className="bg-transparent font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="ALL" className="bg-slate-900">All Tours ({uniqueTours.length})</option>
                    {uniqueTours.map(tName => (
                      <option key={tName} value={tName} className="bg-slate-900">{tName}</option>
                    ))}
                  </select>
                </div>
              )}

              {(transactions.length > 0 || registrations.length > 0 || tours.length > 0) && (
                <button
                  onClick={handleClearAll}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors text-xs"
                  title="Clear all records"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              {/* Add Entry Quick Button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Entry</span>
              </button>
            </div>
          </div>
        </header>

        {/* View Router */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {currentView === 'registration' ? (
            <RegistrationView
              registrations={registrations}
              onAddRegistration={handleAddRegistration}
              onNavigateToRoster={() => setCurrentView('roster')}
              tours={tours}
            />
          ) : currentView === 'roster' ? (
            <PassengersRosterView
              registrations={registrations}
              onDeleteRegistration={handleDeleteRegistration}
              onUpdateRegistration={handleUpdateRegistration}
              onProcessRefund={handleProcessPassengerRefund}
              onNavigateToRegistration={() => setCurrentView('registration')}
              tours={tours}
            />
          ) : currentView === 'tours' ? (
            <ToursView
              tours={tours}
              transactions={transactions}
              registrations={registrations}
              onAddTour={handleAddTour}
              onDeleteTour={handleDeleteTour}
              onUpdateTourStatus={handleUpdateTourStatus}
            />
          ) : currentView === 'seats' ? (
            <SeatAllocationView
              tours={tours}
              registrations={registrations}
              onUpdateRegistrationSeat={handleUpdateRegistrationSeat}
              onBatchUpdateSeats={handleBatchUpdateSeats}
              onClearAllSeatsForTour={handleClearAllSeatsForTour}
              onUpdateRegistration={handleUpdateRegistration}
              onDeleteRegistration={handleDeleteRegistration}
            />
          ) : (
            <>
              {/* Net In-Hand Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-800/80 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                    <Wallet className="w-4 h-4" />
                    Net Cash Balance (In Hand)
                  </span>
                  <div className="text-3xl font-extrabold font-mono text-white mt-1">
                    {formatINR(netBalance)}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Formula: Total Earning ({formatINR(totalEarning)}) - Total Expenses ({formatINR(totalExpenses)}) - Refund ({formatINR(totalRefund)})
                  </p>
                </div>
                <div className="flex items-center gap-4 bg-slate-950/60 border border-slate-800 px-4 py-2.5 rounded-xl">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 font-medium uppercase">Expected Total Inflow</span>
                    <div className="text-lg font-bold font-mono text-emerald-400">
                      {formatINR(totalEarning + totalDue)}
                    </div>
                  </div>
                </div>
              </div>

              {/* ======================================================== */}
              {/* THE 4 PRIMARY METRIC CARDS (Requested by User)           */}
              {/* Total Earning | Total Expenses | Refund | Due            */}
              {/* ======================================================== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. TOTAL EARNING */}
                <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-emerald-500/5 group hover:border-emerald-500/60 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Total Earning
                    </span>
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
                    {formatINR(totalEarning)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-400 font-medium">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Payments collected</span>
                  </div>
                </div>

                {/* 2. TOTAL EXPENSES */}
                <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-amber-500/5 group hover:border-amber-500/60 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Total Expenses
                    </span>
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <TrendingDown className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
                    {formatINR(totalExpenses)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-amber-400 font-medium">
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>Operational costs & bills</span>
                  </div>
                </div>

                {/* 3. REFUND */}
                <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-purple-500/5 group hover:border-purple-500/60 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                      Refund
                    </span>
                    <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <RotateCcw className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
                    {formatINR(totalRefund)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-purple-400 font-medium">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Returned to passengers</span>
                  </div>
                </div>

                {/* 4. DUE */}
                <div className="bg-slate-900/90 border border-rose-500/30 rounded-2xl p-5 relative overflow-hidden shadow-lg shadow-rose-500/5 group hover:border-rose-500/60 transition-all">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl -mr-6 -mt-6 pointer-events-none" />
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                      Due (Outstanding)
                    </span>
                    <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
                    {formatINR(totalDue)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-rose-400 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending receivables</span>
                  </div>
                </div>

              </div>

              {/* Executive Financial Summary & KPI Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Cash Collection Rate */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
                    <span className="uppercase tracking-wider">Cash Collection Rate</span>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-extrabold font-mono text-white">
                      {totalEarning + totalDue > 0
                        ? `${Math.round((totalEarning / (totalEarning + totalDue)) * 100)}%`
                        : '0%'}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatINR(totalEarning)} collected out of {formatINR(totalEarning + totalDue)} expected
                    </p>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-4">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${totalEarning + totalDue > 0 ? Math.min(100, Math.round((totalEarning / (totalEarning + totalDue)) * 100)) : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 2. Retained Cash vs Refunds */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
                    <span className="uppercase tracking-wider">Net Retained Cash</span>
                    <Wallet className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-extrabold font-mono text-cyan-400">
                      {formatINR(Math.max(0, totalEarning - totalRefund))}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {totalRefund > 0
                        ? `${formatINR(totalRefund)} refunded (${Math.round((totalRefund / Math.max(1, totalEarning)) * 100)}% of gross)`
                        : 'No refunds issued to passengers'}
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 mt-2">
                    <span>Active Pilgrims:</span>
                    <strong className="text-white font-mono">{registrations.length} registered</strong>
                  </div>
                </div>

                {/* 3. Operational Expenses Ratio */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
                    <span className="uppercase tracking-wider">Expense Ratio</span>
                    <TrendingDown className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-extrabold font-mono text-amber-400">
                      {totalEarning > 0
                        ? `${Math.round((totalExpenses / totalEarning) * 100)}%`
                        : '0%'}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatINR(totalExpenses)} spent out of {formatINR(totalEarning)} collected
                    </p>
                  </div>
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 mt-2">
                    <span>Pilgrimage Tours:</span>
                    <strong className="text-white font-mono">{tours.length} active</strong>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => setCurrentView('registration')}
                  className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-orange-500/50 rounded-2xl p-4 sm:p-5 cursor-pointer transition-all shadow-lg group"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-orange-400 transition-colors">
                    Registration
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 mb-3">
                    Enroll pilgrims & configure tour fee plans.
                  </p>
                  <span className="text-xs font-bold text-orange-400 inline-flex items-center gap-1">
                    Open Form →
                  </span>
                </div>

                <div
                  onClick={() => setCurrentView('roster')}
                  className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/50 rounded-2xl p-4 sm:p-5 cursor-pointer transition-all shadow-lg group"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-purple-400 transition-colors">
                    Passengers Roster
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 mb-3">
                    View {registrations.length} pilgrims, refund status, and dues.
                  </p>
                  <span className="text-xs font-bold text-purple-400 inline-flex items-center gap-1">
                    Open Roster ({registrations.length}) →
                  </span>
                </div>

                <div
                  onClick={() => setCurrentView('tours')}
                  className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 sm:p-5 cursor-pointer transition-all shadow-lg group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Compass className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-amber-400 transition-colors">
                    Tours & Yatras
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 mb-3">
                    Manage {tours.length} tours, dates, budgets, and financials.
                  </p>
                  <span className="text-xs font-bold text-amber-400 inline-flex items-center gap-1">
                    Manage Tours ({tours.length}) →
                  </span>
                </div>

                <div
                  onClick={() => setCurrentView('seats')}
                  className="bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 rounded-2xl p-4 sm:p-5 cursor-pointer transition-all shadow-lg group"
                >
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Armchair className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-cyan-400 transition-colors">
                    Seat Allocation
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 mb-3">
                    Visual bus layout, seat assignment & manifest.
                  </p>
                  <span className="text-xs font-bold text-cyan-400 inline-flex items-center gap-1">
                    Manage Seats ({allocatedSeatsCount} seated) →
                  </span>
                </div>
              </div>
            </>
          )}
        </main>

        {/* Add Entry Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <h3 className="font-bold text-white text-base">Add Financial Record</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Record Type *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['earning', 'expense', 'refund', 'due'] as TransactionType[]).map((t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setFormData({ ...formData, type: t })}
                        className={`py-2 rounded-xl font-bold uppercase text-[10px] border transition-all ${
                          formData.type === t
                            ? t === 'earning' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                              : t === 'expense' ? 'bg-amber-500/20 text-amber-400 border-amber-500'
                              : t === 'refund' ? 'bg-purple-500/20 text-purple-400 border-purple-500'
                              : 'bg-rose-500/20 text-rose-400 border-rose-500'
                            : 'border-slate-800 text-slate-400 bg-slate-950'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Tour Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.tourName}
                    onChange={(e) => setFormData({ ...formData, tourName: e.target.value })}
                    placeholder="e.g. Mayapur Yatra 2026 / Tour A"
                    list="tours-list"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                  {uniqueTours.length > 0 && (
                    <datalist id="tours-list">
                      {uniqueTours.map(tName => (
                        <option key={tName} value={tName} />
                      ))}
                    </datalist>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">
                    {formData.type === 'expense' ? 'Vendor / Payee Name *' : 'Passenger / Party Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.partyName}
                    onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                    placeholder={formData.type === 'expense' ? 'e.g. Hotel / Transport / Food' : 'e.g. Passenger Name'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="e.g. 5000"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Category / Head</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Installment, Hotel, Bus, Darshan"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {formData.type !== 'due' && (
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Payment Method</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-orange-500"
                    >
                      <option value="UPI">UPI / QR</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                )}

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
                    Save Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Database Status & Setup Modal */}
        {showDbModal && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Cloud Database (Supabase)</h3>
                    <p className="text-xs text-slate-400">Multi-device real-time PostgreSQL synchronization</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDbModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 my-4 text-xs">
                {/* Connection Status Box */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  dbStatus === 'connected'
                    ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300'
                    : dbStatus === 'needs_setup'
                    ? 'bg-amber-950/40 border-amber-600/60 text-amber-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-300'
                }`}>
                  {dbStatus === 'connected' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold text-sm">
                      {dbStatus === 'connected'
                        ? 'Cloud Database Connected & Live!'
                        : dbStatus === 'needs_setup'
                        ? 'Tables Need Setup in Supabase'
                        : dbStatus === 'syncing'
                        ? 'Syncing with Supabase...'
                        : 'Offline Local Storage'}
                    </div>
                    <p className="mt-1 text-slate-300 text-xs leading-relaxed">
                      {dbStatus === 'connected'
                        ? 'Your data is being stored in PostgreSQL and synced in real time across all computers, tablets, and phones.'
                        : dbStatus === 'needs_setup'
                        ? `Connected to your Supabase project (${getActiveSupabaseConfig().url.replace('https://', '').replace('.supabase.co', '')}), but the Tour tables (tour_tours, tour_registrations, tour_transactions) are not created yet.`
                        : 'Currently operating in fast local offline mode.'}
                    </p>
                  </div>
                </div>

                {/* Project Details */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Target Project:</span>
                    <span className="font-mono text-white text-[11px] bg-slate-900 px-2 py-0.5 rounded font-bold text-orange-400">
                      {getActiveSupabaseConfig().url.replace('https://', '')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Database Engine:</span>
                    <span className="text-slate-200 font-semibold">PostgreSQL (Supabase)</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Real-time Sync:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Ready
                    </span>
                  </div>
                </div>

                {/* Supabase Project Credentials Setup */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs block">Supabase Connection Credentials</span>
                      <span className="text-[11px] text-slate-400">Enter Project URL and Anon API Key for Tour 2.0</span>
                    </div>
                    <a
                      href={`https://supabase.com/dashboard/project/${getActiveSupabaseConfig().url.replace('https://', '').replace('.supabase.co', '')}/settings/api`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-orange-400 hover:text-orange-300 font-bold flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded-lg border border-orange-500/30"
                    >
                      Get API Key <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Project URL</label>
                      <input
                        type="text"
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        placeholder="https://mjwmheedvdabxhsihixc.supabase.co"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-[10px] uppercase font-bold text-slate-400">Anon Public Key (Required)</label>
                        <a
                          href={`https://supabase.com/dashboard/project/${getActiveSupabaseConfig().url.replace('https://', '').replace('.supabase.co', '')}/settings/api`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-sky-400 hover:underline"
                        >
                          Find in Supabase → Settings → API
                        </a>
                      </div>
                      <input
                        type="text"
                        value={customKeyInput}
                        onChange={(e) => setCustomKeyInput(e.target.value)}
                        placeholder="Paste your anon public key (starts with eyJ...)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-[11px] text-slate-200 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          setCustomSupabaseCredentials(customUrlInput, customKeyInput);
                          setDbStatus('syncing');
                          const [remoteTours, remoteRegs, remoteTxs] = await Promise.all([
                            fetchToursFromDb(),
                            fetchRegistrationsFromDb(),
                            fetchTransactionsFromDb(),
                          ]);
                          if (remoteTours === null && remoteRegs === null && remoteTxs === null) {
                            setDbStatus('needs_setup');
                          } else {
                            if (remoteTours && remoteTours.length > 0) setTours(remoteTours);
                            if (remoteRegs && remoteRegs.length > 0) setRegistrations(remoteRegs);
                            if (remoteTxs && remoteTxs.length > 0) setTransactions(remoteTxs);
                            setDbStatus('connected');
                          }
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg text-xs font-bold cursor-pointer shadow-md shadow-orange-500/20"
                      >
                        Save & Connect
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          clearCustomSupabaseCredentials();
                          setCustomUrlInput('https://mjwmheedvdabxhsihixc.supabase.co');
                          setCustomKeyInput('');
                        }}
                        className="px-3 py-2 border border-slate-700 text-slate-400 hover:text-white rounded-lg text-xs"
                      >
                        Reset Defaults
                      </button>
                    </div>
                  </div>
                </div>

                {/* SQL Setup Instructions */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="font-bold text-white text-xs flex items-center justify-between">
                    <span>1-Step SQL Schema Setup:</span>
                    <a
                      href={`https://supabase.com/dashboard/project/${getActiveSupabaseConfig().url.replace('https://', '').replace('.supabase.co', '')}/sql/new`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-orange-400 hover:text-orange-300 flex items-center gap-1 font-semibold"
                    >
                      Open Supabase SQL Editor <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <p className="text-slate-400 text-xs">
                    Paste this SQL schema into your Supabase SQL editor and click <strong>Run</strong>:
                  </p>
                  <button
                    onClick={() => {
                      const sql = `-- 1. Create Tables
CREATE TABLE IF NOT EXISTS public.tour_tours (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  destination TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  default_fee NUMERIC NOT NULL DEFAULT 0,
  budget NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'planning',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tour_registrations (
  id TEXT PRIMARY KEY,
  registration_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  gender TEXT,
  age INTEGER,
  date_of_birth TEXT,
  phone_number TEXT NOT NULL,
  whatsapp_number TEXT,
  address TEXT,
  tour_name TEXT NOT NULL,
  registration_date TEXT NOT NULL,
  agreed_fee NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  due_amount NUMERIC NOT NULL DEFAULT 0,
  refund_amount NUMERIC DEFAULT 0,
  refund_status TEXT DEFAULT 'not_refunded',
  refund_reason TEXT,
  refund_date TEXT,
  refund_method TEXT,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  seat_number TEXT,
  vehicle_name TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tour_transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  tour_id TEXT NOT NULL,
  tour_name TEXT NOT NULL,
  party_name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'Cash',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Grants for PostgREST & Anon API
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.tour_tours TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.tour_registrations TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.tour_transactions TO anon, authenticated, service_role;

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.tour_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_transactions ENABLE ROW LEVEL SECURITY;

-- 4. Policies
DROP POLICY IF EXISTS "Allow anon on tour_tours" ON public.tour_tours;
CREATE POLICY "Allow anon on tour_tours" ON public.tour_tours FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon on tour_registrations" ON public.tour_registrations;
CREATE POLICY "Allow anon on tour_registrations" ON public.tour_registrations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon on tour_transactions" ON public.tour_transactions;
CREATE POLICY "Allow anon on tour_transactions" ON public.tour_transactions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. Reload Schema Cache
NOTIFY pgrst, 'reload schema';`;
                      navigator.clipboard.writeText(sql);
                      setCopiedSql(true);
                      setTimeout(() => setCopiedSql(false), 3000);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-all border border-slate-700 cursor-pointer"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">SQL Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-orange-400" />
                        <span>Copy Complete SQL Schema</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  onClick={async () => {
                    setDbStatus('syncing');
                    const [remoteTours, remoteRegs, remoteTxs] = await Promise.all([
                      fetchToursFromDb(),
                      fetchRegistrationsFromDb(),
                      fetchTransactionsFromDb(),
                    ]);
                    if (remoteTours === null && remoteRegs === null && remoteTxs === null) {
                      setDbStatus('needs_setup');
                    } else {
                      if (remoteTours && remoteTours.length > 0) setTours(remoteTours);
                      if (remoteRegs && remoteRegs.length > 0) setRegistrations(remoteRegs);
                      if (remoteTxs && remoteTxs.length > 0) setTransactions(remoteTxs);
                      setDbStatus('connected');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Check & Refresh Connection</span>
                </button>
                <button
                  onClick={() => setShowDbModal(false)}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
