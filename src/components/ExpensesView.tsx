import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  Printer, 
  TrendingDown, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Building2, 
  Bus, 
  Utensils, 
  Layers, 
  PieChart, 
  Tag, 
  Wallet,
  Clock,
  ArrowUpDown,
  FileSpreadsheet,
  Compass
} from 'lucide-react';
import { FinancialTransaction, Tour } from '../types';

export const EXPENSE_CATEGORIES = [
  'Transport / Bus / Train',
  'Food & Prasadam',
  'Hotel & Accommodation',
  'Temple Entry / Puja / Seva',
  'Medical & Emergency',
  'ID Cards, Badges & Printing',
  'Guide, Toll & Local Transport',
  'Sound, Stage & Events',
  'Miscellaneous / Other',
];

interface ExpensesViewProps {
  tours: Tour[];
  transactions: FinancialTransaction[];
  onAddExpense: (expense: FinancialTransaction) => void;
  onUpdateExpense: (expense: FinancialTransaction) => void;
  onDeleteExpense: (id: string) => void;
  initialTourFilter?: string;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  tours,
  transactions,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  initialTourFilter = 'ALL',
}) => {
  // Filters & Search
  const [selectedTour, setSelectedTour] = useState<string>(initialTourFilter);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<FinancialTransaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State for Add / Edit
  const [formTourName, setFormTourName] = useState(tours[0]?.name || '');
  const [formCategory, setFormCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formPartyName, setFormPartyName] = useState('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState<'Cash' | 'UPI' | 'Bank Transfer'>('UPI');
  const [formPaymentStatus, setFormPaymentStatus] = useState<'completed' | 'pending'>('completed');
  const [formNotes, setFormNotes] = useState('');

  // Extract all expenses from transactions
  const allExpenses = useMemo(() => {
    return transactions.filter(t => t.type === 'expense');
  }, [transactions]);

  // Unique tours available in system
  const uniqueTourNames = useMemo(() => {
    const set = new Set<string>();
    tours.forEach(t => { if (t.name?.trim()) set.add(t.name.trim()); });
    allExpenses.forEach(e => { if (e.tourName?.trim()) set.add(e.tourName.trim()); });
    return Array.from(set);
  }, [tours, allExpenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return allExpenses.filter(e => {
      // Tour filter
      if (selectedTour !== 'ALL' && (e.tourName || '').trim().toLowerCase() !== selectedTour.trim().toLowerCase()) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'ALL' && e.category !== selectedCategory) {
        return false;
      }
      // Payment method filter
      if (selectedPaymentMethod !== 'ALL' && e.paymentMethod !== selectedPaymentMethod) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesParty = (e.partyName || '').toLowerCase().includes(q);
        const matchesCategory = (e.category || '').toLowerCase().includes(q);
        const matchesNotes = (e.notes || '').toLowerCase().includes(q);
        const matchesTour = (e.tourName || '').toLowerCase().includes(q);
        const matchesId = (e.id || '').toLowerCase().includes(q);
        if (!matchesParty && !matchesCategory && !matchesNotes && !matchesTour && !matchesId) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'date_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      return 0;
    });
  }, [allExpenses, selectedTour, selectedCategory, selectedPaymentMethod, searchQuery, sortBy]);

  // Currency Formatter
  const formatINR = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    let total = 0;
    let pendingCount = 0;
    let pendingTotal = 0;
    const catMap = new Map<string, number>();

    filteredExpenses.forEach(e => {
      const amt = Number(e.amount || 0);
      total += amt;
      if (e.status === 'pending') {
        pendingCount += 1;
        pendingTotal += amt;
      }
      const cat = e.category || 'Other';
      catMap.set(cat, (catMap.get(cat) || 0) + amt);
    });

    // Find highest expense category
    let topCategory = 'None';
    let topCatAmount = 0;
    catMap.forEach((amt, cat) => {
      if (amt > topCatAmount) {
        topCatAmount = amt;
        topCategory = cat;
      }
    });

    const avgExpense = filteredExpenses.length > 0 ? Math.round(total / filteredExpenses.length) : 0;

    // Tour budget comparison if single tour is selected
    const currentTourObj = selectedTour !== 'ALL' 
      ? tours.find(t => (t.name || '').trim().toLowerCase() === selectedTour.trim().toLowerCase()) 
      : null;

    return {
      totalAmount: total,
      vouchersCount: filteredExpenses.length,
      pendingCount,
      pendingTotal,
      topCategory,
      topCatAmount,
      topCatPercent: total > 0 ? Math.round((topCatAmount / total) * 100) : 0,
      avgExpense,
      currentTourObj,
      categoryBreakdown: Array.from(catMap.entries()).map(([name, amount]) => ({
        name,
        amount,
        percent: total > 0 ? Math.round((amount / total) * 100) : 0,
      })).sort((a, b) => b.amount - a.amount),
    };
  }, [filteredExpenses, selectedTour, tours]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingExpense(null);
    setFormTourName(selectedTour !== 'ALL' ? selectedTour : (uniqueTourNames[0] || ''));
    setFormCategory(EXPENSE_CATEGORIES[0]);
    setFormCustomCategory('');
    setFormPartyName('');
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMethod('UPI');
    setFormPaymentStatus('completed');
    setFormNotes('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (expense: FinancialTransaction) => {
    setEditingExpense(expense);
    setFormTourName(expense.tourName);
    if (EXPENSE_CATEGORIES.includes(expense.category)) {
      setFormCategory(expense.category);
      setFormCustomCategory('');
    } else {
      setFormCategory('Other');
      setFormCustomCategory(expense.category);
    }
    setFormPartyName(expense.partyName);
    setFormAmount(String(expense.amount));
    setFormDate(expense.date);
    setFormPaymentMethod((expense.paymentMethod === 'Pending' ? 'Cash' : expense.paymentMethod) as any);
    setFormPaymentStatus(expense.status || 'completed');
    setFormNotes(expense.notes || '');
    setIsAddModalOpen(true);
  };

  // Save Expense (Add or Edit)
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPartyName.trim()) {
      alert('Please enter Vendor / Payee Name.');
      return;
    }
    if (!formAmount || Number(formAmount) <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }
    if (!formTourName.trim()) {
      alert('Please select or specify a tour.');
      return;
    }

    const finalCategory = formCategory === 'Other' && formCustomCategory.trim() 
      ? formCustomCategory.trim() 
      : formCategory;

    if (editingExpense) {
      // Update existing
      const updated: FinancialTransaction = {
        ...editingExpense,
        tourName: formTourName.trim(),
        tourId: formTourName.toLowerCase().replace(/\s+/g, '-'),
        partyName: formPartyName.trim(),
        category: finalCategory,
        amount: Number(formAmount),
        date: formDate,
        paymentMethod: formPaymentStatus === 'pending' ? 'Pending' : formPaymentMethod,
        status: formPaymentStatus,
        notes: formNotes.trim() || undefined,
      };
      onUpdateExpense(updated);
    } else {
      // Create new
      const newExp: FinancialTransaction = {
        id: 'tx-exp-' + Date.now(),
        type: 'expense',
        tourId: formTourName.toLowerCase().replace(/\s+/g, '-'),
        tourName: formTourName.trim(),
        partyName: formPartyName.trim(),
        category: finalCategory,
        amount: Number(formAmount),
        date: formDate,
        paymentMethod: formPaymentStatus === 'pending' ? 'Pending' : formPaymentMethod,
        status: formPaymentStatus,
        notes: formNotes.trim() || undefined,
      };
      onAddExpense(newExp);
    }

    setIsAddModalOpen(false);
  };

  // Delete Expense
  const handleConfirmDelete = (id: string) => {
    onDeleteExpense(id);
    setDeletingId(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredExpenses.length === 0) {
      alert('No expense records to export.');
      return;
    }

    const headers = ['Voucher ID', 'Date', 'Tour Name', 'Category', 'Vendor / Payee', 'Amount (INR)', 'Payment Method', 'Status', 'Notes'];
    const rows = filteredExpenses.map(e => [
      `"${e.id}"`,
      `"${e.date}"`,
      `"${(e.tourName || '').replace(/"/g, '""')}"`,
      `"${(e.category || '').replace(/"/g, '""')}"`,
      `"${(e.partyName || '').replace(/"/g, '""')}"`,
      e.amount,
      `"${e.paymentMethod}"`,
      `"${e.status}"`,
      `"${(e.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Tour_Expenses_${selectedTour !== 'ALL' ? selectedTour.replace(/\s+/g, '_') : 'All'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report
  const handlePrintReport = () => {
    window.print();
  };

  // Helper for Category Icon & Color
  const getCategoryTheme = (cat: string) => {
    const lower = (cat || '').toLowerCase();
    if (lower.includes('transport') || lower.includes('bus') || lower.includes('train')) {
      return { icon: Bus, badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
    }
    if (lower.includes('food') || lower.includes('prasad')) {
      return { icon: Utensils, badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
    }
    if (lower.includes('hotel') || lower.includes('stay') || lower.includes('room')) {
      return { icon: Building2, badge: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
    }
    if (lower.includes('puja') || lower.includes('seva') || lower.includes('temple')) {
      return { icon: Tag, badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
    }
    return { icon: Receipt, badge: 'bg-slate-800 text-slate-300 border-slate-700' };
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20 flex-shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Tour Expenses & Vouchers
              </h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {stats.vouchersCount} Entries
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Track vendor payments, travel costs, food, hotels and tour operating expenses (ট্যুর খরচ ও ভাউচার)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            title="Download CSV Spreadsheet"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrintReport}
            title="Print or Save as PDF"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-all cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-blue-400" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-rose-500/25 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expenses Card */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-rose-500/40 rounded-2xl p-4 sm:p-5 transition-all shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>Total Operational Expenses</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
            {formatINR(stats.totalAmount)}
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-rose-400 font-bold">{stats.vouchersCount}</span> vouchers recorded
            {stats.pendingCount > 0 && (
              <span className="text-amber-400 font-bold">({stats.pendingCount} pending)</span>
            )}
          </p>
        </div>

        {/* Highest Category Card */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 sm:p-5 transition-all shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>Highest Expense Sector</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-amber-400 truncate tracking-tight">
            {stats.topCategory}
          </div>
          <p className="text-xs text-slate-400 mt-1 flex items-center justify-between">
            <span>{formatINR(stats.topCatAmount)}</span>
            <span className="font-mono text-amber-400 font-bold">{stats.topCatPercent}% of total</span>
          </p>
        </div>

        {/* Average Voucher Card */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-blue-500/40 rounded-2xl p-4 sm:p-5 transition-all shadow-lg">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>Average Per Voucher</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
            {formatINR(stats.avgExpense)}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mean cost per transaction entry
          </p>
        </div>

        {/* Budget or Pending Card */}
        <div className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-4 sm:p-5 transition-all shadow-lg">
          {stats.currentTourObj && stats.currentTourObj.budget > 0 ? (
            <>
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
                <span>Tour Budget Utilization</span>
                <span className="text-[11px] font-bold text-emerald-400">
                  {Math.round((stats.totalAmount / stats.currentTourObj.budget) * 100)}%
                </span>
              </div>
              <div className="text-lg sm:text-xl font-extrabold font-mono text-white tracking-tight">
                {formatINR(stats.totalAmount)} / {formatINR(stats.currentTourObj.budget)}
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    stats.totalAmount > stats.currentTourObj.budget ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.round((stats.totalAmount / stats.currentTourObj.budget) * 100))}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
                <span>Active Scope</span>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </div>
              </div>
              <div className="text-lg font-bold text-white truncate">
                {selectedTour === 'ALL' ? 'All Yatras & Tours' : selectedTour}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {uniqueTourNames.length} total tour projects
              </p>
            </>
          )}
        </div>
      </div>

      {/* Category Breakdown Bar (if there are expenses) */}
      {stats.categoryBreakdown.length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
          <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-orange-400" />
              <span>Category-Wise Expense Distribution</span>
            </span>
            <span className="text-slate-400 text-[11px]">
              {stats.categoryBreakdown.length} active sectors
            </span>
          </div>

          {/* Multi-segmented Progress Bar */}
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex mb-3">
            {stats.categoryBreakdown.map((cat, i) => {
              const colors = [
                'bg-blue-500', 
                'bg-amber-500', 
                'bg-purple-500', 
                'bg-emerald-500', 
                'bg-rose-500', 
                'bg-cyan-500', 
                'bg-orange-500'
              ];
              const color = colors[i % colors.length];
              return (
                <div
                  key={cat.name}
                  className={`${color} h-full transition-all duration-300`}
                  style={{ width: `${cat.percent}%` }}
                  title={`${cat.name}: ${formatINR(cat.amount)} (${cat.percent}%)`}
                />
              );
            })}
          </div>

          {/* Legend Badges */}
          <div className="flex flex-wrap gap-2 text-xs">
            {stats.categoryBreakdown.map((cat, i) => {
              const dotColors = [
                'bg-blue-400', 
                'bg-amber-400', 
                'bg-purple-400', 
                'bg-emerald-400', 
                'bg-rose-400', 
                'bg-cyan-400', 
                'bg-orange-400'
              ];
              const dot = dotColors[i % dotColors.length];
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(selectedCategory === cat.name ? 'ALL' : cat.name)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                    selectedCategory === cat.name
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                      : 'bg-slate-950/60 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span>{cat.name}</span>
                  <span className="font-mono text-slate-400">({formatINR(cat.amount)})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search vendor, category, notes, or tour..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:border-orange-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tour Filter */}
          <div>
            <select
              value={selectedTour}
              onChange={(e) => setSelectedTour(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-orange-500"
            >
              <option value="ALL">All Tours (সকল ট্যুর)</option>
              {uniqueTourNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-orange-500"
            >
              <option value="ALL">All Categories (সকল খাত)</option>
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-orange-500"
            >
              <option value="date_desc">Date: Newest First</option>
              <option value="date_asc">Date: Oldest First</option>
              <option value="amount_desc">Amount: High to Low</option>
              <option value="amount_asc">Amount: Low to High</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Pills */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80 flex-wrap text-xs">
          <span className="text-slate-400 font-medium">Payment Method:</span>
          {(['ALL', 'Cash', 'UPI', 'Bank Transfer'] as const).map(pm => (
            <button
              key={pm}
              onClick={() => setSelectedPaymentMethod(pm)}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                selectedPaymentMethod === pm
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                  : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {pm === 'ALL' ? 'All Methods' : pm}
            </button>
          ))}

          {(selectedTour !== 'ALL' || selectedCategory !== 'ALL' || selectedPaymentMethod !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedTour('ALL');
                setSelectedCategory('ALL');
                setSelectedPaymentMethod('ALL');
                setSearchQuery('');
              }}
              className="ml-auto text-orange-400 hover:text-orange-300 text-xs font-bold underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Expenses Table (Desktop) & Cards (Mobile) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Receipt className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-white text-base">No Expense Records Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              {allExpenses.length === 0 
                ? 'No expenses have been recorded yet. Click "Record Expense" to add your first voucher.' 
                : 'No expenses match the current filter criteria. Try clearing search or filters.'}
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record First Expense</span>
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Date & Voucher</th>
                    <th className="py-3.5 px-4">Tour Name</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Payee / Vendor</th>
                    <th className="py-3.5 px-4">Method & Status</th>
                    <th className="py-3.5 px-4">Notes / Bill Ref</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredExpenses.map((expense) => {
                    const theme = getCategoryTheme(expense.category);
                    const Icon = theme.icon;

                    return (
                      <tr key={expense.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-white font-bold">{expense.date}</div>
                          <div className="text-[10px] text-slate-500 font-mono">#{expense.id.slice(-6)}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-semibold text-white">
                            <Compass className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                            <span className="truncate max-w-[160px]">{expense.tourName}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${theme.badge}`}>
                            <Icon className="w-3 h-3" />
                            <span>{expense.category}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-white">{expense.partyName}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-300">{expense.paymentMethod}</span>
                            <span className={`text-[10px] font-bold uppercase ${
                              expense.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              ● {expense.status}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-slate-400 line-clamp-1 max-w-[200px]" title={expense.notes}>
                            {expense.notes || '—'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-extrabold text-sm text-rose-400">
                          {formatINR(expense.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(expense)}
                              title="Edit Expense"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingId(expense.id)}
                              title="Delete Expense"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-800/80">
              {filteredExpenses.map((expense) => {
                const theme = getCategoryTheme(expense.category);
                const Icon = theme.icon;

                return (
                  <div key={expense.id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${theme.badge}`}>
                        <Icon className="w-3 h-3" />
                        <span>{expense.category}</span>
                      </span>
                      <span className="font-mono font-extrabold text-base text-rose-400">
                        {formatINR(expense.amount)}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-white text-sm">{expense.partyName}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Compass className="w-3 h-3 text-orange-400" />
                        <span>{expense.tourName}</span>
                      </div>
                    </div>

                    {expense.notes && (
                      <p className="text-xs text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                        {expense.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60 text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{expense.date}</span>
                        <span>•</span>
                        <span>{expense.paymentMethod}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(expense)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingId(expense.id)}
                          className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-lg text-[11px] font-semibold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Add / Edit Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {editingExpense ? 'Edit Expense Record' : 'Record New Tour Expense'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingExpense ? 'Update voucher details and financials' : 'Add operational expense, transport, prasadam or stay'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              {/* Tour Name Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tour / Yatra <span className="text-rose-400">*</span>
                </label>
                <select
                  required
                  value={formTourName}
                  onChange={(e) => setFormTourName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-rose-500"
                >
                  {uniqueTourNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              {/* Expense Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Expense Category (ব্যয়ের খাত) <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-rose-500"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Other">Other (কাস্টম ক্যাটাগরি)</option>
                </select>
                {formCategory === 'Other' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter custom category name..."
                    value={formCustomCategory}
                    onChange={(e) => setFormCustomCategory(e.target.value)}
                    className="mt-2 w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-rose-500"
                  />
                )}
              </div>

              {/* Vendor / Payee Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Vendor / Payee Name (প্রাপক / দোকান / ভেন্ডরের নাম) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shyam Travels, Radhe Govinda Caterers, Hotel Shivam"
                  value={formPartyName}
                  onChange={(e) => setFormPartyName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-rose-500"
                />
              </div>

              {/* Amount & Date in Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Amount (₹) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="5000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm font-mono font-bold text-white focus:outline-hidden focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Expense Date <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Payment Method & Payment Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-rose-500"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="Cash">Cash (নগদ)</option>
                    <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Payment Status
                  </label>
                  <select
                    value={formPaymentStatus}
                    onChange={(e) => setFormPaymentStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-rose-500"
                  >
                    <option value="completed">Completed (পরিশোধিত)</option>
                    <option value="pending">Pending (বাকি / অপরিশোধিত)</option>
                  </select>
                </div>
              </div>

              {/* Notes / Voucher Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Voucher / Bill No & Notes (মন্তব্য / বিল নং)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Bill #8842 for 52 passenger mineral water bottles & snacks"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-hidden focus:border-rose-500"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-rose-500/20 transition-all cursor-pointer active:scale-95"
                >
                  {editingExpense ? 'Save Changes' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Delete Expense Record?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to permanently delete this expense voucher? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDelete(deletingId)}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
