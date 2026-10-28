import React, { useState, useMemo, useRef } from 'react';
import { 
  Armchair, 
  Compass, 
  Users, 
  Printer, 
  Sparkles, 
  RotateCcw, 
  Search, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Phone, 
  UserCheck, 
  FileText,
  BusFront,
  Filter,
  Check,
  ChevronDown,
  LayoutGrid,
  ListOrdered,
  Lock,
  Unlock,
  MousePointerClick,
  Edit3
} from 'lucide-react';
import { PassengerRegistration, Tour, VehicleConfig, GenderType } from '../types';

interface SeatAllocationViewProps {
  tours: Tour[];
  registrations: PassengerRegistration[];
  onUpdateRegistrationSeat: (passengerId: string, seatNumber: string | undefined, vehicleName: string | undefined) => void;
  onBatchUpdateSeats: (updates: { passengerId: string; seatNumber: string; vehicleName: string }[]) => void;
  onClearAllSeatsForTour: (tourName: string) => void;
  onUpdateRegistration?: (registration: PassengerRegistration) => void;
  onDeleteRegistration?: (id: string) => void;
}

const VEHICLES_STORAGE_KEY = 'real_finance_vehicles_v1';

export const SeatAllocationView: React.FC<SeatAllocationViewProps> = ({
  tours,
  registrations,
  onUpdateRegistrationSeat,
  onBatchUpdateSeats,
  onClearAllSeatsForTour,
  onUpdateRegistration,
  onDeleteRegistration,
}) => {
  // Active Tour Selection
  const [selectedTourName, setSelectedTourName] = useState<string>(() => {
    return tours[0]?.name || (registrations[0]?.tourName || '');
  });

  // View Mode: 'table' (Sl. No, Full Name, Gender, Age, Seat Number) vs 'coach_map' (Visual Layout)
  const [viewMode, setViewMode] = useState<'table' | 'coach_map'>('table');

  // Filter States for Table
  const [searchQuery, setSearchQuery] = useState('');
  const [seatFilter, setSeatFilter] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED' | 'MALE' | 'FEMALE' | 'SENIOR'>('ALL');

  // Vehicles list with localStorage fallback
  const [vehicles, setVehicles] = useState<VehicleConfig[]>(() => {
    try {
      const saved = localStorage.getItem(VEHICLES_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'veh-default-1',
        tourName: tours[0]?.name || 'General Tour',
        vehicleName: 'Bus 1 (AC 2x2 Deluxe)',
        vehicleNumber: 'WB-02-YATRA-01',
        driverName: 'Driver Sharma',
        driverPhone: '+91 98311 22334',
        totalSeats: 40,
        layout: '2x2',
      }
    ];
  });

  // Active Tour Vehicles
  const activeTourVehicles = useMemo(() => {
    const list = vehicles.filter(v => v.tourName === selectedTourName);
    if (list.length === 0) {
      const defaultBus: VehicleConfig = {
        id: 'veh-' + Date.now(),
        tourName: selectedTourName,
        vehicleName: 'Bus 1 (AC 2x2)',
        vehicleNumber: 'YATRA-01',
        totalSeats: 40,
        layout: '2x2',
      };
      return [defaultBus];
    }
    return list;
  }, [vehicles, selectedTourName]);

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(activeTourVehicles[0]?.id || '');
  const activeVehicle = activeTourVehicles.find(v => v.id === selectedVehicleId) || activeTourVehicles[0];

  // Save vehicles
  const saveVehicles = (newVehicles: VehicleConfig[]) => {
    setVehicles(newVehicles);
    try {
      localStorage.setItem(VEHICLES_STORAGE_KEY, JSON.stringify(newVehicles));
    } catch (e) {
      console.error('Failed to save vehicles', e);
    }
  };

  // Modals & Panels
  const [assigningPassenger, setAssigningPassenger] = useState<PassengerRegistration | null>(null);
  const [isNewBusModalOpen, setIsNewBusModalOpen] = useState(false);
  const [isManifestOpen, setIsManifestOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Direct & Manual Seat Entry & Lock States
  const [directSeatInputs, setDirectSeatInputs] = useState<Record<string, string>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [editingSeatPassengerId, setEditingSeatPassengerId] = useState<string | null>(null);
  const [manualSeatInput, setManualSeatInput] = useState<string>('');
  const [manualModalSeat, setManualModalSeat] = useState<string>('');

  // Click Tracker for Locked Seats (for robust triple-click detection)
  const clickTrackerRef = useRef<{ id: string; count: number; timer: ReturnType<typeof setTimeout> | null }>({
    id: '',
    count: 0,
    timer: null,
  });

  // Locked Notice Hint (gives live feedback on clicks: 1/3, 2/3)
  const [lockedHint, setLockedHint] = useState<{ id: string; message: string } | null>(null);

  // Quick Pilgrim Details Edit Modal State
  const [pilgrimEditTarget, setPilgrimEditTarget] = useState<PassengerRegistration | null>(null);
  const [pEditName, setPEditName] = useState('');
  const [pEditGender, setPEditGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [pEditDob, setPEditDob] = useState('');
  const [pEditAge, setPEditAge] = useState<number | ''>(45);
  const [pEditPhone, setPEditPhone] = useState('');
  const [pEditAddress, setPEditAddress] = useState('');
  const [pEditNotes, setPEditNotes] = useState('');

  const handleOpenPilgrimEdit = (p: PassengerRegistration) => {
    setPilgrimEditTarget(p);
    setPEditName(p.fullName);
    setPEditGender(p.gender || 'Male');
    setPEditDob(p.dateOfBirth || '');
    setPEditAge(p.age ?? '');
    setPEditPhone(p.phoneNumber);
    setPEditAddress(p.address || '');
    setPEditNotes(p.notes || '');
  };

  const handlePEditDobChange = (newDob: string) => {
    setPEditDob(newDob);
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
          setPEditAge(calculatedAge);
        }
      }
    }
  };

  const handleSavePilgrimEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pilgrimEditTarget || !onUpdateRegistration) return;
    const updated: PassengerRegistration = {
      ...pilgrimEditTarget,
      fullName: pEditName.trim(),
      gender: pEditGender,
      dateOfBirth: pEditDob || undefined,
      age: pEditAge !== '' ? Number(pEditAge) : undefined,
      phoneNumber: pEditPhone.trim(),
      address: pEditAddress.trim(),
      notes: pEditNotes.trim(),
    };
    onUpdateRegistration(updated);
    setPilgrimEditTarget(null);
    setNotice(`Updated details for "${updated.fullName}" successfully!`);
    setTimeout(() => setNotice(null), 3000);
  };

  // New Bus Form
  const [newBusName, setNewBusName] = useState('Bus 2 (AC Deluxe)');
  const [newBusNumber, setNewBusNumber] = useState('');
  const [newBusSeats, setNewBusSeats] = useState<number>(40);
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');

  // Pilgrims belonging to this Tour
  const tourPilgrims = useMemo(() => {
    return registrations.filter(r => r.tourName === selectedTourName);
  }, [registrations, selectedTourName]);

  // Pilgrims seated in active vehicle
  const seatedInThisVehicle = useMemo(() => {
    const vName = activeVehicle?.vehicleName || '';
    return tourPilgrims.filter(r => r.seatNumber && (r.vehicleName === vName || !r.vehicleName));
  }, [tourPilgrims, activeVehicle]);

  // Map: seatNumber -> Passenger
  const seatOccupantMap = useMemo(() => {
    const map = new Map<string, PassengerRegistration>();
    seatedInThisVehicle.forEach(p => {
      if (p.seatNumber) {
        map.set(p.seatNumber, p);
      }
    });
    return map;
  }, [seatedInThisVehicle]);

  // Unseated Pilgrims for this Tour
  const unseatedPilgrims = useMemo(() => {
    return tourPilgrims.filter(p => !p.seatNumber);
  }, [tourPilgrims]);

  // Generate 2x2 standard Seat Layout for this vehicle (e.g. 1A, 1B, 1C, 1D ...)
  const seatLayoutList = useMemo(() => {
    const count = activeVehicle?.totalSeats || 40;
    const seats: { id: string; label: string; row: number; col: 'A' | 'B' | 'C' | 'D' }[] = [];
    const rowsCount = Math.ceil(count / 4);

    let currentNum = 1;
    for (let r = 1; r <= rowsCount; r++) {
      ['A', 'B', 'C', 'D'].forEach((col) => {
        if (currentNum <= count) {
          const seatId = `${r}${col}`;
          seats.push({
            id: seatId,
            label: `Seat ${seatId}`,
            row: r,
            col: col as any,
          });
          currentNum++;
        }
      });
    }
    return seats;
  }, [activeVehicle]);

  // Vacant seats on this vehicle
  const vacantSeats = useMemo(() => {
    return seatLayoutList.filter(s => !seatOccupantMap.has(s.id));
  }, [seatLayoutList, seatOccupantMap]);

  // Unlock seat for editing upon triple-click
  const unlockSeatForEdit = (pilgrim: PassengerRegistration) => {
    setEditingSeatPassengerId(pilgrim.id);
    setManualSeatInput(pilgrim.seatNumber || '');
    setLockedHint(null);
    setNotice(`🔓 Seat ${pilgrim.seatNumber} unlocked for editing!`);
    setTimeout(() => setNotice(null), 3000);
  };

  // Handle clicking on an assigned seat (requires TRIPLE CLICK to unlock & edit)
  const handleSeatClick = (e: React.MouseEvent, pilgrim: PassengerRegistration) => {
    e.stopPropagation();

    // 1. Native browser multi-click count check
    if (e.detail >= 3) {
      if (clickTrackerRef.current.timer) clearTimeout(clickTrackerRef.current.timer);
      clickTrackerRef.current.count = 0;
      clickTrackerRef.current.id = '';
      unlockSeatForEdit(pilgrim);
      return;
    }

    // 2. Multi-click timestamp tracking fallback within 650ms window
    const tracker = clickTrackerRef.current;
    if (tracker.id !== pilgrim.id) {
      if (tracker.timer) clearTimeout(tracker.timer);
      tracker.id = pilgrim.id;
      tracker.count = 1;
    } else {
      tracker.count += 1;
    }

    if (tracker.count >= 3) {
      if (tracker.timer) clearTimeout(tracker.timer);
      tracker.count = 0;
      tracker.id = '';
      unlockSeatForEdit(pilgrim);
    } else {
      const remaining = 3 - tracker.count;
      setLockedHint({
        id: pilgrim.id,
        message: `🔒 Locked! Click ${remaining} more time${remaining > 1 ? 's' : ''} to edit`,
      });
      if (tracker.timer) clearTimeout(tracker.timer);
      tracker.timer = setTimeout(() => {
        tracker.count = 0;
        tracker.id = '';
        setLockedHint(null);
      }, 650);
    }
  };

  // Save direct / manual seat entry & immediately lock it
  const handleSaveManualSeat = (passengerId: string, seatVal: string, focusNext = false) => {
    const cleanSeat = seatVal.trim().toUpperCase();
    if (!cleanSeat) {
      alert('Please enter a seat number (e.g. 1A, 12, S-3).');
      return;
    }

    // Check if this seat is already occupied by another passenger on this tour
    const existingOccupant = tourPilgrims.find(
      p => p.id !== passengerId && p.seatNumber && p.seatNumber.trim().toUpperCase() === cleanSeat
    );

    if (existingOccupant) {
      const confirmReassign = window.confirm(
        `Seat "${cleanSeat}" is currently occupied by "${existingOccupant.fullName}".\n\nDo you want to reassign seat "${cleanSeat}" to this pilgrim?`
      );
      if (!confirmReassign) return;
      onUpdateRegistrationSeat(existingOccupant.id, undefined, undefined);
    }

    // Assign and immediately lock
    onUpdateRegistrationSeat(passengerId, cleanSeat, activeVehicle?.vehicleName || 'Standard Coach');

    // Clear draft direct input for this passenger
    setDirectSeatInputs(prev => {
      const copy = { ...prev };
      delete copy[passengerId];
      return copy;
    });

    setEditingSeatPassengerId(null);
    setManualSeatInput('');
    setAssigningPassenger(null);
    setManualModalSeat('');

    setNotice(`🔒 Seat ${cleanSeat} saved and locked! (Triple-click anytime to edit)`);
    setTimeout(() => setNotice(null), 3500);

    // If focusNext is true, auto-focus the next unseated pilgrim's direct entry input box
    if (focusNext) {
      setTimeout(() => {
        const remainingUnseated = filteredPilgrims.filter(p => p.id !== passengerId && !p.seatNumber);
        if (remainingUnseated.length > 0) {
          const nextInput = inputRefs.current[remainingUnseated[0].id];
          if (nextInput) nextInput.focus();
        }
      }, 50);
    }
  };

  // Handle assigning a specific seat (from modal or quick click) and lock it
  const handleAssignSeat = (passengerId: string, seatNumber: string) => {
    handleSaveManualSeat(passengerId, seatNumber);
  };

  // Handle freeing / unassigning a seat
  const handleUnassignSeat = (passengerId: string) => {
    onUpdateRegistrationSeat(passengerId, undefined, undefined);
    setEditingSeatPassengerId(null);
    setManualSeatInput('');
    setNotice('Seat freed successfully!');
    setTimeout(() => setNotice(null), 3000);
  };

  // Auto Assign all unseated pilgrims
  const handleAutoAssign = () => {
    if (unseatedPilgrims.length === 0) {
      alert('All registered pilgrims for this tour already have seats assigned!');
      return;
    }

    if (vacantSeats.length === 0) {
      alert('No vacant seats available on this vehicle. Please add another vehicle or free seats.');
      return;
    }

    const updates: { passengerId: string; seatNumber: string; vehicleName: string }[] = [];
    const countToAssign = Math.min(unseatedPilgrims.length, vacantSeats.length);

    for (let i = 0; i < countToAssign; i++) {
      updates.push({
        passengerId: unseatedPilgrims[i].id,
        seatNumber: vacantSeats[i].id,
        vehicleName: activeVehicle.vehicleName,
      });
    }

    onBatchUpdateSeats(updates);
    setNotice(`Auto-assigned & locked ${countToAssign} pilgrims!`);
    setTimeout(() => setNotice(null), 4000);
  };

  // Add new vehicle
  const handleAddNewBus = (e: React.FormEvent) => {
    e.preventDefault();
    const newVeh: VehicleConfig = {
      id: 'veh-' + Date.now(),
      tourName: selectedTourName,
      vehicleName: newBusName.trim(),
      vehicleNumber: newBusNumber.trim(),
      totalSeats: Number(newBusSeats || 40),
      driverName: newDriverName.trim(),
      driverPhone: newDriverPhone.trim(),
      layout: '2x2',
    };

    const updated = [...vehicles, newVeh];
    saveVehicles(updated);
    setSelectedVehicleId(newVeh.id);
    setIsNewBusModalOpen(false);

    setNotice(`Added ${newVeh.vehicleName}!`);
    setTimeout(() => setNotice(null), 3000);
  };

  // Filtered Pilgrims for the requested Table: Sl. No, Full Name, Gender, Age, Seat Number
  const filteredPilgrims = useMemo(() => {
    return tourPilgrims.filter(p => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const match = (
          p.fullName.toLowerCase().includes(q) ||
          p.phoneNumber.includes(q) ||
          p.registrationNumber.toLowerCase().includes(q) ||
          (p.seatNumber && p.seatNumber.toLowerCase().includes(q))
        );
        if (!match) return false;
      }

      // Seat / Category Filter
      if (seatFilter === 'ASSIGNED' && !p.seatNumber) return false;
      if (seatFilter === 'UNASSIGNED' && p.seatNumber) return false;
      if (seatFilter === 'MALE' && p.gender !== 'Male') return false;
      if (seatFilter === 'FEMALE' && p.gender !== 'Female') return false;
      if (seatFilter === 'SENIOR' && (!p.age || p.age < 60)) return false;

      return true;
    });
  }, [tourPilgrims, searchQuery, seatFilter]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Armchair className="w-6 h-6 text-orange-400" />
            Seat Allocation
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage seating: <strong>Sl. No, Full Name, Gender, Age, Seat Number</strong>.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {notice && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Table Roster</span>
            </button>
            <button
              onClick={() => setViewMode('coach_map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'coach_map'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Coach Map</span>
            </button>
          </div>

          {/* Print Manifest Button */}
          <button
            onClick={() => setIsManifestOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 border border-slate-700/80 hover:border-slate-600 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 text-orange-400" />
            <span>Print Manifest</span>
          </button>

          {/* Auto Assign Remaining Button */}
          <button
            onClick={handleAutoAssign}
            disabled={unseatedPilgrims.length === 0 || vacantSeats.length === 0}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
              unseatedPilgrims.length > 0 && vacantSeats.length > 0
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/20'
                : 'bg-slate-800 text-slate-500 border border-slate-800 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Auto-Assign ({unseatedPilgrims.length})</span>
          </button>
        </div>
      </div>

      {/* Tour & Vehicle Selector Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Tour Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5" />
              Tour:
            </span>
            <select
              value={selectedTourName}
              onChange={(e) => setSelectedTourName(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-orange-500"
            >
              {tours.length > 0 ? (
                tours.map(t => (
                  <option key={t.id} value={t.name}>{t.code} — {t.name}</option>
                ))
              ) : (
                <option value={selectedTourName || 'General Tour'}>General Tour</option>
              )}
            </select>
          </div>

          {/* Vehicle Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
              <BusFront className="w-3.5 h-3.5 text-cyan-400" />
              Bus:
            </span>
            {activeTourVehicles.map(v => (
              <button
                key={v.id}
                onClick={() => setSelectedVehicleId(v.id)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  (activeVehicle?.id === v.id)
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {v.vehicleName}
              </button>
            ))}

            {/* Add Bus Button */}
            <button
              onClick={() => setIsNewBusModalOpen(true)}
              className="p-1 px-2 text-slate-400 hover:text-orange-400 text-xs font-bold flex items-center gap-0.5 rounded-lg hover:bg-slate-800 transition-colors"
              title="Add another coach/bus"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Bus</span>
            </button>
          </div>
        </div>

        {/* Reset Seats */}
        {seatedInThisVehicle.length > 0 && (
          <button
            onClick={() => {
              if (confirm(`Are you sure you want to clear all seat allocations for ${selectedTourName}?`)) {
                onClearAllSeatsForTour(selectedTourName);
                setNotice('All seats cleared.');
                setTimeout(() => setNotice(null), 3000);
              }
            }}
            className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors self-end md:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Seats</span>
          </button>
        )}
      </div>

      {/* Seat Lock & Direct Entry Guidance Banner */}
      <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3.5 px-4 flex items-center gap-3 text-xs text-amber-200 shadow-md">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 flex-shrink-0">
          <Lock className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <span className="font-bold text-white">Direct Seat Entry & Auto-Lock Protection:</span>
          <p className="text-slate-300 text-[11px] mt-0.5">
            Type seat number (e.g. 1A, 12, S-3) <strong>directly</strong> in any unassigned row and press <strong>Enter ↵</strong>. Once entered, the seat is <strong>locked</strong> against accidental changes. To edit or change an assigned seat, <strong>triple-click (click 3 times)</strong> directly over the seat number.
          </p>
        </div>
      </div>

      {/* Seat Allocation Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Total Seats</span>
            <BusFront className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black font-mono text-white mt-1">
            {activeVehicle?.totalSeats || 40}
          </div>
          <span className="text-[10px] text-slate-500">{activeVehicle?.vehicleName}</span>
        </div>

        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-medium">
            <span>Allocated</span>
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
            {seatedInThisVehicle.length}
          </div>
          <span className="text-[10px] text-emerald-400/80">
            {Math.round((seatedInThisVehicle.length / (activeVehicle?.totalSeats || 40)) * 100)}% Occupancy
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-cyan-400 font-medium">
            <span>Vacant / Available</span>
            <Armchair className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black font-mono text-cyan-400 mt-1">
            {vacantSeats.length}
          </div>
          <span className="text-[10px] text-slate-500">Ready to assign</span>
        </div>

        <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-xs text-amber-400 font-medium">
            <span>Unassigned Pilgrims</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-400 mt-1">
            {unseatedPilgrims.length}
          </div>
          <span className="text-[10px] text-amber-400/80">Awaiting seat</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PRIMARY REQUESTED VIEW: Sl. No, Full Name, Gender, Age, Seat Number       */}
      {/* ========================================================================= */}
      {viewMode === 'table' ? (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden flex flex-col">
          {/* Controls & Search */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/40 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <ListOrdered className="w-4 h-4 text-orange-400" />
                  Seat Allocation Table Roster
                </h3>
                <p className="text-xs text-slate-400">
                  Showing {filteredPilgrims.length} of {tourPilgrims.length} pilgrims for {selectedTourName}
                </p>
              </div>

              {/* Quick Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, phone, age, seat #..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
              {[
                { id: 'ALL', label: 'All Pilgrims' },
                { id: 'ASSIGNED', label: 'Allocated Seats' },
                { id: 'UNASSIGNED', label: 'Unassigned Seats' },
                { id: 'MALE', label: 'Male (পুরুষ)' },
                { id: 'FEMALE', label: 'Female (মহিলা)' },
                { id: 'SENIOR', label: 'Seniors (Age 60+)' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setSeatFilter(f.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    seatFilter === f.id
                      ? 'bg-orange-500 text-white shadow-xs font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* MAIN SEAT ALLOCATION TABLE */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 text-slate-400 uppercase font-bold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 text-center w-16">Sl. No</th>
                  <th className="py-3.5 px-4">Full Name</th>
                  <th className="py-3.5 px-4 text-center">Gender</th>
                  <th className="py-3.5 px-4 text-center">Age</th>
                  <th className="py-3.5 px-4 text-center">Seat Number</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredPilgrims.map((pilgrim, index) => {
                  const slNo = index + 1;
                  const isSeated = !!pilgrim.seatNumber;
                  const isSenior = (pilgrim.age || 0) >= 60;

                  return (
                    <tr key={pilgrim.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* 1. Sl. No */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-400 whitespace-nowrap">
                        {slNo}
                      </td>

                      {/* 2. Full Name */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] text-orange-400 font-bold">
                                {pilgrim.registrationNumber}
                              </span>
                              {pilgrim.notes && (
                                <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded truncate max-w-[130px]" title={pilgrim.notes}>
                                  ★ {pilgrim.notes}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <strong className="text-white text-sm">
                                {pilgrim.fullName}
                              </strong>
                              {onUpdateRegistration && (
                                <button
                                  onClick={() => handleOpenPilgrimEdit(pilgrim)}
                                  className="p-1 text-slate-500 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                                  title="Edit pilgrim details"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {pilgrim.phoneNumber}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 3. Gender */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {pilgrim.gender === 'Female' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-500/10 text-pink-400 border border-pink-500/20">
                            Female
                          </span>
                        ) : pilgrim.gender === 'Male' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            Male
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-800 text-slate-400">
                            {pilgrim.gender || '—'}
                          </span>
                        )}
                      </td>

                      {/* 4. Age */}
                      <td className="py-3 px-4 text-center whitespace-nowrap font-mono">
                        {pilgrim.age ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center gap-1">
                              <strong className="text-white text-xs">{pilgrim.age} yrs</strong>
                              {isSenior && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                  Senior
                                </span>
                              )}
                            </span>
                            {pilgrim.dateOfBirth && (
                              <span className="text-[9px] text-slate-500 font-sans mt-0.5">
                                DOB: {pilgrim.dateOfBirth}
                              </span>
                            )}
                          </div>
                        ) : pilgrim.dateOfBirth ? (
                          <span className="text-[10px] text-slate-400 font-sans">
                            DOB: {pilgrim.dateOfBirth}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>

                      {/* 5. Seat Number */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {editingSeatPassengerId === pilgrim.id ? (
                          /* UNLOCKED EDIT MODE: Manual Seat Input */
                          <div className="inline-flex items-center justify-center gap-1.5 animate-in fade-in zoom-in-95">
                            <input
                              type="text"
                              value={manualSeatInput}
                              onChange={(e) => setManualSeatInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveManualSeat(pilgrim.id, manualSeatInput);
                                if (e.key === 'Escape') {
                                  setEditingSeatPassengerId(null);
                                  setManualSeatInput('');
                                }
                              }}
                              placeholder="e.g. 1A"
                              className="w-20 px-2 py-1 bg-slate-950 border-2 border-orange-500 rounded-lg text-white font-mono font-bold text-xs focus:outline-none shadow-md shadow-orange-500/20 text-center"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveManualSeat(pilgrim.id, manualSeatInput)}
                              className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors cursor-pointer"
                              title="Save & Lock (Enter)"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingSeatPassengerId(null);
                                setManualSeatInput('');
                              }}
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="Cancel (Esc)"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleUnassignSeat(pilgrim.id)}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 rounded-lg transition-colors cursor-pointer"
                              title="Free / Remove Seat"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : isSeated ? (
                          /* LOCKED SEAT BADGE (Triple-click to edit) */
                          <div className="flex flex-col items-center">
                            <div
                              onClick={(e) => handleSeatClick(e, pilgrim)}
                              className="cursor-pointer select-none group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:border-amber-400 hover:bg-emerald-500/25 transition-all shadow-xs"
                              title="🔒 Seat is locked! Triple-click here to edit"
                            >
                              <Lock className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                              <span className="text-white text-xs font-black tracking-wide">{pilgrim.seatNumber}</span>
                              <span className="text-[10px] text-amber-400/90 font-sans font-semibold">
                                (Locked)
                              </span>
                            </div>
                            <span className="text-[9px] text-slate-500 mt-1 flex items-center justify-center gap-1 select-none">
                              <MousePointerClick className="w-2.5 h-2.5 text-slate-500" />
                              Triple-click to edit
                            </span>
                            {lockedHint?.id === pilgrim.id && (
                              <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 rounded-full mt-1 inline-block animate-bounce">
                                {lockedHint.message}
                              </span>
                            )}
                          </div>
                        ) : (
                          /* DIRECT ENTRY INPUT FOR UNSEATED PILGRIM */
                          <div className="inline-flex items-center justify-center gap-1.5">
                            <input
                              ref={el => { inputRefs.current[pilgrim.id] = el; }}
                              type="text"
                              value={directSeatInputs[pilgrim.id] ?? ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDirectSeatInputs(prev => ({ ...prev, [pilgrim.id]: val }));
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const val = directSeatInputs[pilgrim.id];
                                  if (val && val.trim()) {
                                    handleSaveManualSeat(pilgrim.id, val, true /* auto-focus next */);
                                  } else {
                                    alert('Please enter a seat number (e.g. 1A, 12, S-3).');
                                  }
                                }
                              }}
                              placeholder="Type Seat #"
                              className="w-24 sm:w-28 px-2.5 py-1.5 bg-slate-950 border border-slate-700/80 hover:border-orange-500 focus:border-orange-500 rounded-xl text-white font-mono font-bold text-xs focus:outline-none shadow-xs text-center transition-all placeholder:text-slate-600 placeholder:font-sans placeholder:font-normal uppercase"
                            />
                            <button
                              onClick={() => {
                                const val = directSeatInputs[pilgrim.id];
                                if (val && val.trim()) {
                                  handleSaveManualSeat(pilgrim.id, val, true);
                                } else {
                                  alert('Please enter a seat number (e.g. 1A, 12, S-3).');
                                }
                              }}
                              disabled={!directSeatInputs[pilgrim.id]?.trim()}
                              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                                directSeatInputs[pilgrim.id]?.trim()
                                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer shadow-xs'
                                  : 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                              }`}
                              title="Save & Lock this seat (Enter)"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {editingSeatPassengerId === pilgrim.id ? (
                            /* Editing Action controls */
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleSaveManualSeat(pilgrim.id, manualSeatInput)}
                                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Save & Lock</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingSeatPassengerId(null);
                                  setManualSeatInput('');
                                }}
                                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : isSeated ? (
                            /* LOCKED: Can only be edited via Triple-Click */
                            <div
                              onClick={(e) => handleSeatClick(e, pilgrim)}
                              className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition-all select-none group"
                              title="Seat is locked! Triple-click over the seat to edit"
                            >
                              <Lock className="w-3.5 h-3.5 text-amber-500/80 group-hover:scale-110 transition-transform" />
                              <span className="text-xs font-semibold">Locked</span>
                            </div>
                          ) : (
                            /* Unassigned Pilgrim: Direct entry lock button + modal trigger */
                            <div className="flex items-center justify-center gap-1.5">
                              {directSeatInputs[pilgrim.id]?.trim() ? (
                                <button
                                  onClick={() => handleSaveManualSeat(pilgrim.id, directSeatInputs[pilgrim.id], true)}
                                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 animate-in fade-in"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Lock Seat</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                                  <span>↵ Enter</span>
                                </span>
                              )}
                              <button
                                onClick={() => {
                                  setAssigningPassenger(pilgrim);
                                  setManualModalSeat('');
                                }}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                                title="Pick from available seats modal"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredPilgrims.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-500">
                      <Armchair className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-slate-400">No pilgrims found</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        {tourPilgrims.length === 0
                          ? `No pilgrims registered for ${selectedTourName} yet. Go to Registration to register passengers.`
                          : 'No passenger records match your current search and filter settings.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* COACH MAP VIEW: Visual 2x2 Bus Layout                                     */
        /* ========================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Seating Map (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[11px] font-bold">
                    2x2 Standard Coach
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {activeVehicle?.vehicleNumber || 'Coach Reg: N/A'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">
                  {activeVehicle?.vehicleName}
                </h3>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-emerald-500/20 border border-emerald-500" />
                  <span className="text-slate-300">Allocated</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-slate-950 border border-slate-700 border-dashed" />
                  <span className="text-slate-400">Available</span>
                </div>
              </div>
            </div>

            {/* Cockpit */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-bold">
                  🚪
                </div>
                <span>Front Entrance</span>
              </div>
              <div className="font-mono text-[11px]">
                <span>FRONT (WINDSHIELD)</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl">
                <span>🛞</span>
                <span className="font-semibold text-slate-300">Driver Cabin</span>
              </div>
            </div>

            {/* Seats Grid */}
            <div className="space-y-3 pt-2">
              {Array.from(new Set(seatLayoutList.map(s => s.row))).map(rowNum => {
                const rowSeats = seatLayoutList.filter(s => s.row === rowNum);
                const leftSeats = rowSeats.filter(s => s.col === 'A' || s.col === 'B');
                const rightSeats = rowSeats.filter(s => s.col === 'C' || s.col === 'D');

                return (
                  <div key={rowNum} className="flex items-center justify-between gap-3 sm:gap-6 bg-slate-950/40 p-2 rounded-2xl border border-slate-800/40">
                    {/* Left Pair */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                      {leftSeats.map(seat => {
                        const occupant = seatOccupantMap.get(seat.id);
                        const isOccupied = !!occupant;

                        return (
                          <div
                            key={seat.id}
                            onClick={(e) => occupant && handleSeatClick(e, occupant)}
                            className={`flex-1 min-h-[64px] p-2 rounded-xl text-left border relative flex flex-col justify-between cursor-pointer transition-all ${
                              isOccupied
                                ? 'bg-emerald-500/15 border-emerald-500/50 hover:border-amber-400/60'
                                : 'bg-slate-950 border-slate-800 border-dashed hover:border-orange-500/60'
                            }`}
                            title={isOccupied ? `Seat ${seat.id} is occupied by ${occupant.fullName}. Locked (Triple-click to edit)` : `Seat ${seat.id} is vacant.`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-mono text-xs font-black ${isOccupied ? 'text-white' : 'text-slate-400'}`}>
                                {seat.id}
                              </span>
                              {isOccupied ? (
                                <Lock className="w-3 h-3 text-amber-400" />
                              ) : (
                                <Armchair className="w-3.5 h-3.5 text-slate-600" />
                              )}
                            </div>
                            <div className="mt-1">
                              {isOccupied ? (
                                <div>
                                  <strong className="text-xs text-white block truncate leading-tight">
                                    {occupant.fullName}
                                  </strong>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <span>{occupant.gender || '—'}</span>
                                    {occupant.age && <span>• {occupant.age}y</span>}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-medium">+ Vacant</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Aisle */}
                    <div className="w-8 sm:w-12 text-center text-[10px] font-mono text-slate-600 uppercase select-none">
                      R{rowNum}
                    </div>

                    {/* Right Pair */}
                    <div className="flex items-center gap-2 sm:gap-3 flex-1">
                      {rightSeats.map(seat => {
                        const occupant = seatOccupantMap.get(seat.id);
                        const isOccupied = !!occupant;

                        return (
                          <div
                            key={seat.id}
                            onClick={(e) => occupant && handleSeatClick(e, occupant)}
                            className={`flex-1 min-h-[64px] p-2 rounded-xl text-left border relative flex flex-col justify-between cursor-pointer transition-all ${
                              isOccupied
                                ? 'bg-emerald-500/15 border-emerald-500/50 hover:border-amber-400/60'
                                : 'bg-slate-950 border-slate-800 border-dashed hover:border-orange-500/60'
                            }`}
                            title={isOccupied ? `Seat ${seat.id} is occupied by ${occupant.fullName}. Locked (Triple-click to edit)` : `Seat ${seat.id} is vacant.`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-mono text-xs font-black ${isOccupied ? 'text-white' : 'text-slate-400'}`}>
                                {seat.id}
                              </span>
                              {isOccupied ? (
                                <Lock className="w-3 h-3 text-amber-400" />
                              ) : (
                                <Armchair className="w-3.5 h-3.5 text-slate-600" />
                              )}
                            </div>
                            <div className="mt-1">
                              {isOccupied ? (
                                <div>
                                  <strong className="text-xs text-white block truncate leading-tight">
                                    {occupant.fullName}
                                  </strong>
                                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <span>{occupant.gender || '—'}</span>
                                    {occupant.age && <span>• {occupant.age}y</span>}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-500 font-medium">+ Vacant</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unassigned Quick Panel (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-slate-800 pb-3">
              <Users className="w-4 h-4 text-orange-400" />
              Unseated Pilgrims ({unseatedPilgrims.length})
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {unseatedPilgrims.map(p => (
                <div key={p.id} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between gap-2.5">
                  <div className="truncate flex-1">
                    <strong className="text-white text-xs block truncate">{p.fullName}</strong>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <span>{p.gender || '—'}</span>
                      {p.age && <span>• {p.age}y</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => setAssigningPassenger(p)}
                    className="px-2.5 py-1 bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Assign
                  </button>
                </div>
              ))}
              {unseatedPilgrims.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs">
                  All pilgrims seated!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ASSIGN SEAT FOR PASSENGER                         */}
      {/* ======================================================== */}
      {assigningPassenger && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-orange-500/30 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
                  <Armchair className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Select Seat for {assigningPassenger.fullName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Gender: {assigningPassenger.gender || '—'} • Age: {assigningPassenger.age || '—'} yrs
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssigningPassenger(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Manual Seat Entry Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualModalSeat.trim()) {
                    handleSaveManualSeat(assigningPassenger.id, manualModalSeat.trim());
                  }
                }}
                className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Armchair className="w-4 h-4 text-orange-400" />
                    <span>Enter Seat Number Manually:</span>
                  </label>
                  <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Locks after entry
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={manualModalSeat}
                    onChange={(e) => setManualModalSeat(e.target.value)}
                    placeholder="Type seat (e.g. 1A, 12, S-3)..."
                    className="flex-1 bg-slate-900 border border-slate-700 focus:border-orange-500 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Assign & Lock</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  🔒 After entering, the seat is locked. To edit later, triple-click directly over the seat.
                </p>
              </form>

              {/* Vacant Seats Grid (Quick Pick) */}
              <div>
                <p className="text-xs text-slate-400 mb-2 font-medium">
                  Or pick an available seat on <strong>{activeVehicle?.vehicleName}</strong>:
                </p>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1">
                  {vacantSeats.map(seat => (
                    <button
                      key={seat.id}
                      type="button"
                      onClick={() => handleSaveManualSeat(assigningPassenger.id, seat.id)}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-orange-500 hover:bg-orange-500/10 text-center transition-all cursor-pointer group"
                    >
                      <Armchair className="w-4 h-4 text-slate-500 group-hover:text-orange-400 mx-auto mb-1" />
                      <span className="font-mono text-xs font-bold text-white group-hover:text-orange-400 block">
                        {seat.id}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {vacantSeats.length === 0 && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs text-center">
                  No vacant seats available on this vehicle. Please enter a custom seat number above or add another bus.
                </div>
              )}

              <button
                type="button"
                onClick={() => setAssigningPassenger(null)}
                className="w-full py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD NEW COACH / BUS                               */}
      {/* ======================================================== */}
      {isNewBusModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <BusFront className="w-5 h-5 text-orange-400" />
                Add New Coach / Vehicle
              </h3>
              <button
                onClick={() => setIsNewBusModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewBus} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Vehicle / Coach Name *</label>
                <input
                  type="text"
                  required
                  value={newBusName}
                  onChange={(e) => setNewBusName(e.target.value)}
                  placeholder="e.g. Bus 2 (AC Sleeper)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Vehicle Plate Number</label>
                <input
                  type="text"
                  value={newBusNumber}
                  onChange={(e) => setNewBusNumber(e.target.value)}
                  placeholder="e.g. UP-32-AB-5678"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Total Seats *</label>
                  <input
                    type="number"
                    required
                    min="10"
                    max="65"
                    value={newBusSeats}
                    onChange={(e) => setNewBusSeats(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Layout</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:outline-none">
                    <option value="2x2">2 x 2 Standard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Driver / Captain Name</label>
                  <input
                    type="text"
                    value={newDriverName}
                    onChange={(e) => setNewDriverName(e.target.value)}
                    placeholder="e.g. Ram Sevak"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Driver Phone</label>
                  <input
                    type="text"
                    value={newDriverPhone}
                    onChange={(e) => setNewDriverPhone(e.target.value)}
                    placeholder="+91 98300 00000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewBusModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 cursor-pointer"
                >
                  Add Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PRINTABLE MANIFEST MATCHING EXACT REQUESTED STRUCTURE              */}
      {/* Sl. No, Full Name, Gender, Age, Seat Number                               */}
      {/* ========================================================================= */}
      {isManifestOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Seat Allocation Passenger Manifest</h3>
                  <p className="text-xs text-slate-400">{selectedTourName} • {activeVehicle?.vehicleName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Sheet</span>
                </button>
                <button
                  onClick={() => setIsManifestOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto p-5 flex-1 space-y-4">
              <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
                <thead className="bg-slate-950 text-slate-400 uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-16">Sl. No</th>
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3 text-center">Gender</th>
                    <th className="py-2.5 px-3 text-center">Age</th>
                    <th className="py-2.5 px-3 text-center">Seat Number</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Special Request</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {tourPilgrims
                    .slice()
                    .sort((a, b) => {
                      if (a.seatNumber && b.seatNumber) return a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true });
                      if (a.seatNumber) return -1;
                      if (b.seatNumber) return 1;
                      return a.fullName.localeCompare(b.fullName);
                    })
                    .map((p, idx) => (
                      <tr key={p.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-white">
                          {p.fullName}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {p.gender || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          {p.age ? `${p.age} yrs` : '—'}
                          {p.dateOfBirth && <div className="text-[10px] text-slate-500 font-sans">{p.dateOfBirth}</div>}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-cyan-400">
                          {p.seatNumber || '— Unassigned —'}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">
                          {p.phoneNumber}
                        </td>
                        <td className="py-2.5 px-3 text-amber-300">
                          {p.notes || '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: QUICK EDIT PILGRIM DETAILS                        */}
      {/* ======================================================== */}
      {pilgrimEditTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Edit Pilgrim Details
                  </h3>
                  <p className="text-xs text-slate-400">
                    #{pilgrimEditTarget.registrationNumber} • {pilgrimEditTarget.tourName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPilgrimEditTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePilgrimEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={pEditName}
                  onChange={(e) => setPEditName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-white font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Gender *</label>
                  <select
                    value={pEditGender}
                    onChange={(e) => setPEditGender(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
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
                    value={pEditDob}
                    onChange={(e) => handlePEditDobChange(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-1.5 text-slate-200 font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Age (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={pEditAge}
                    onChange={(e) => setPEditAge(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={pEditPhone}
                    onChange={(e) => setPEditPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Residential City / Address</label>
                  <input
                    type="text"
                    value={pEditAddress}
                    onChange={(e) => setPEditAddress(e.target.value)}
                    placeholder="e.g. Kolkata, West Bengal"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Special Notes / Requests</label>
                <input
                  type="text"
                  value={pEditNotes}
                  onChange={(e) => setPEditNotes(e.target.value)}
                  placeholder="e.g. Senior citizen, diet preferences"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                {onDeleteRegistration && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to permanently delete pilgrim "${pilgrimEditTarget.fullName}"? This will release their allocated seat.`)) {
                        onDeleteRegistration(pilgrimEditTarget.id);
                        setPilgrimEditTarget(null);
                        setNotice(`Deleted pilgrim "${pilgrimEditTarget.fullName}".`);
                        setTimeout(() => setNotice(null), 3000);
                      }
                    }}
                    className="px-3 py-2.5 rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-500/15 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete User</span>
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPilgrimEditTarget(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-400 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Details</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
