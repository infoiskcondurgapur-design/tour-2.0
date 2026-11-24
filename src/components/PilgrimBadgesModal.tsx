import React, { useState, useRef } from 'react';
import { 
  X, 
  Printer, 
  Compass, 
  Armchair, 
  Phone, 
  Crown, 
  Heart, 
  AlertCircle, 
  Check, 
  Copy,
  Layers,
  Sparkles,
  QrCode,
  Train
} from 'lucide-react';
import { PassengerRegistration, Tour } from '../types';
import { getIndianRailwaysBerthType, extractBerthNumber } from '../utils/railway';

interface PilgrimBadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  registrations: PassengerRegistration[];
  tour?: Tour | null;
  tourName: string;
}

export const PilgrimBadgesModal: React.FC<PilgrimBadgesModalProps> = ({
  isOpen,
  onClose,
  registrations,
  tour,
  tourName,
}) => {
  const [selectedLeader, setSelectedLeader] = useState<string>('ALL');
  const [onlyBoarded, setOnlyBoarded] = useState(false);
  const [badgeTheme, setBadgeTheme] = useState<'saffron' | 'royal' | 'gold'>('saffron');

  // Filter registrations for badges
  const badgePilgrims = registrations.filter(r => {
    if (selectedLeader !== 'ALL' && (r.leaderName || 'None') !== selectedLeader) return false;
    if (onlyBoarded && !r.boarded) return false;
    return true;
  });

  // Extract distinct leaders
  const distinctLeaders = Array.from(
    new Set(registrations.map(r => r.leaderName || 'None'))
  );

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Modal Dialog Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto print:max-w-none print:max-h-none print:border-none print:shadow-none print:m-0 print:p-0">
        
        {/* Header - Screen only */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 flex-shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Pilgrim ID Badges & Yatra Passes</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-mono">
                  {badgePilgrims.length} Badges Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official travel pass for {tourName} • Print 4 per A4 page for lanyards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-orange-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Badges (A4 Layout)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar - Screen only */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/60 flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0 print:hidden">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Filter by Leader:</span>
              <select
                value={selectedLeader}
                onChange={(e) => setSelectedLeader(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-hidden focus:border-orange-500"
              >
                <option value="ALL">All Leaders ({distinctLeaders.length})</option>
                {distinctLeaders.map(l => (
                  <option key={l} value={l}>
                    {l === 'None' ? 'No Leader Assigned' : `👑 ${l}`}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyBoarded}
                onChange={(e) => setOnlyBoarded(e.target.checked)}
                className="w-4 h-4 rounded text-orange-500 bg-slate-950 border-slate-800 focus:ring-orange-500"
              />
              <span>Only Boarded Devotees</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">Card Theme:</span>
            <div className="inline-flex rounded-lg border border-slate-800 p-0.5 bg-slate-950">
              <button
                onClick={() => setBadgeTheme('saffron')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  badgeTheme === 'saffron' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Saffron
              </button>
              <button
                onClick={() => setBadgeTheme('royal')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  badgeTheme === 'royal' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Royal Navy
              </button>
              <button
                onClick={() => setBadgeTheme('gold')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                  badgeTheme === 'gold' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Golden
              </button>
            </div>
          </div>
        </div>

        {/* Printable Badges Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/40 print:p-0 print:bg-white print:overflow-visible">
          {badgePilgrims.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-500" />
              <p className="font-semibold">No pilgrims match the badge filter criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3 print:p-2">
              {badgePilgrims.map((pilgrim, idx) => {
                const themeStyles = {
                  saffron: {
                    border: 'border-orange-500/40 print:border-orange-600',
                    headerBg: 'bg-gradient-to-r from-orange-600 to-amber-600 text-white',
                    seatBg: 'bg-orange-500/15 text-orange-400 print:bg-orange-50 print:text-orange-800 border-orange-500/30',
                    accentText: 'text-orange-400 print:text-orange-700',
                  },
                  royal: {
                    border: 'border-indigo-500/40 print:border-indigo-600',
                    headerBg: 'bg-gradient-to-r from-indigo-700 to-blue-600 text-white',
                    seatBg: 'bg-indigo-500/15 text-indigo-400 print:bg-indigo-50 print:text-indigo-800 border-indigo-500/30',
                    accentText: 'text-indigo-400 print:text-indigo-700',
                  },
                  gold: {
                    border: 'border-amber-500/40 print:border-amber-600',
                    headerBg: 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white',
                    seatBg: 'bg-amber-500/15 text-amber-400 print:bg-amber-50 print:text-amber-800 border-amber-500/30',
                    accentText: 'text-amber-400 print:text-amber-800',
                  },
                }[badgeTheme];

                return (
                  <div
                    key={pilgrim.id}
                    className={`bg-slate-900 print:bg-white border-2 ${themeStyles.border} rounded-2xl overflow-hidden shadow-lg print:shadow-none flex flex-col justify-between print:break-inside-avoid print:page-break-inside-avoid`}
                    style={{ minHeight: '260px' }}
                  >
                    {/* Badge Top Header */}
                    <div className={`${themeStyles.headerBg} px-4 py-2.5 flex items-center justify-between`}>
                      <div className="flex items-center gap-2">
                        <span className="text-base">🕉️</span>
                        <div>
                          <div className="font-extrabold text-[12px] uppercase tracking-wider leading-tight">
                            ISKCON DURGAPUR YATRA
                          </div>
                          <div className="text-[10px] opacity-90 truncate max-w-[200px]">
                            {tourName}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/25 uppercase">
                          PASS #{pilgrim.registrationNumber}
                        </span>
                      </div>
                    </div>

                    {/* Badge Body */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      {/* Name & Basic Demographics */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-extrabold text-base sm:text-lg text-white print:text-black tracking-tight leading-tight truncate">
                            {pilgrim.fullName}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-400 print:text-slate-600 mt-0.5 flex-wrap">
                            <span>{pilgrim.gender || 'Devotee'}</span>
                            {pilgrim.age && <span>• Age: {pilgrim.age} yrs</span>}
                            {pilgrim.bloodGroup && (
                              <span className="font-bold text-rose-400 print:text-rose-700">
                                • Blood: {pilgrim.bloodGroup}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Seat / Berth Stamp */}
                        {(() => {
                          const bNum = extractBerthNumber(pilgrim.seatNumber);
                          const bInfo = bNum ? getIndianRailwaysBerthType(bNum) : null;
                          return (
                            <div className={`px-3 py-1.5 rounded-xl border ${themeStyles.seatBg} text-center flex-shrink-0 min-w-[70px]`}>
                              <span className="text-[9px] uppercase font-bold tracking-wider block opacity-75">
                                {bInfo ? 'Berth' : 'Seat'}
                              </span>
                              <span className="text-base sm:text-lg font-extrabold font-mono leading-none block">
                                {pilgrim.seatNumber || '—'}
                              </span>
                              {bInfo && (
                                <span className="text-[8px] font-bold block mt-0.5 tracking-tight uppercase">
                                  {bInfo.code}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Travel & Train / Coach Info */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/60 print:bg-slate-50 p-2.5 rounded-xl border border-slate-800/80 print:border-slate-200">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Coach / Vehicle</span>
                          <strong className="text-slate-200 print:text-black truncate block">
                            {pilgrim.vehicleName || 'Coach S1'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Class / Type</span>
                          <strong className="text-slate-200 print:text-black truncate block">
                            {pilgrim.seatType || 'Sleeper (SL)'}
                          </strong>
                        </div>
                        {(tour?.trainNumber || tour?.trainName || pilgrim.pnrNumber) && (
                          <div className="col-span-2 pt-1 border-t border-slate-800/60 print:border-slate-200 flex items-center justify-between text-[10px]">
                            <span className="text-slate-300 print:text-slate-700 font-mono flex items-center gap-1">
                              <Train className="w-3 h-3 text-sky-400 print:text-sky-700" />
                              <span>{tour?.trainNumber ? `${tour.trainNumber} ` : ''}{tour?.trainName || 'Train Yatra'}</span>
                            </span>
                            {pilgrim.pnrNumber && (
                              <span className="font-mono font-bold text-sky-400 print:text-sky-800">
                                PNR: {pilgrim.pnrNumber}
                              </span>
                            )}
                          </div>
                        )}
                        {pilgrim.boardingStation && (
                          <div className="col-span-2 text-[10px] text-slate-400 print:text-slate-600">
                            Boarding: <strong className="text-slate-200 print:text-black">{pilgrim.boardingStation}</strong>
                          </div>
                        )}
                        {pilgrim.leaderName && (
                          <div className="col-span-2 pt-1 border-t border-slate-800/60 print:border-slate-200">
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">Group Leader: </span>
                            <strong className={`${themeStyles.accentText}`}>
                              👑 {pilgrim.leaderName}
                            </strong>
                          </div>
                        )}
                      </div>

                      {/* Contact & Verification Footer */}
                      <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 print:text-slate-600">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span className="font-mono">{pilgrim.phoneNumber}</span>
                          </div>
                          {pilgrim.emergencyPhone && (
                            <div className="text-[10px] text-rose-400 print:text-rose-700">
                              Emerg: <span className="font-mono">{pilgrim.emergencyPhone}</span>
                            </div>
                          )}
                        </div>

                        {/* Simulated QR Verification Box */}
                        <div className="flex items-center gap-1.5 border border-slate-800 print:border-slate-300 px-2 py-1 rounded bg-slate-950/80 print:bg-white text-[9px] font-mono">
                          <QrCode className="w-3.5 h-3.5 text-slate-400 print:text-black" />
                          <span>VERIFIED</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Colored Edge */}
                    <div className="h-1.5 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer - Screen only */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400 print:hidden flex-shrink-0">
          <span>Tip: In print preview, set margins to "None" or "Minimum" for optimal 4-per-page fit.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
