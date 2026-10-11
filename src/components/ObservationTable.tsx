import React, { useState } from 'react';
import { ObservationRecord } from '../types/rectifier';
import { Table, Download, Trash2, LineChart, FileSpreadsheet } from 'lucide-react';

interface ObservationTableProps {
  records: ObservationRecord[];
  onClearRecords: () => void;
  onDeleteRecord: (id: string) => void;
}

export const ObservationTable: React.FC<ObservationTableProps> = ({
  records,
  onClearRecords,
  onDeleteRecord,
}) => {
  const [showPlot, setShowPlot] = useState(false);

  // Export records to CSV file
  const handleExportCSV = () => {
    if (records.length === 0) return;

    const headers = [
      'Sl. No.',
      'Timestamp',
      'Topology',
      'Load Type',
      'Vm (V)',
      'Alpha (deg)',
      'R (Ohms)',
      'L (mH)',
      'Vdc Theory (V)',
      'Vdc Measured (V)',
      'Vrms (V)',
      'Idc (A)',
      'Ripple Factor',
      'Efficiency (%)',
    ];

    const rows = records.map((r, idx) => [
      idx + 1,
      r.timestamp,
      `"${r.topologyName}"`,
      r.loadType,
      r.voltagePeak,
      r.firingAngle,
      r.resistance,
      r.inductance,
      r.vDcTheoretical.toFixed(2),
      r.vDcMeasured.toFixed(2),
      r.vRms.toFixed(2),
      r.iDc.toFixed(3),
      r.rippleFactor.toFixed(3),
      r.efficiency.toFixed(1),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rectifier_lab_observations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sort records with alpha for plotting Vdc vs Alpha
  const alphaRecords = records.filter(
    (r) => r.topology.includes('controlled')
  ).sort((a, b) => a.firingAngle - b.firingAngle);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-100 flex flex-col gap-4">
      {/* Table Header & Controls */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-semibold tracking-wide text-slate-200">
            Observation Table & Experimental Data Logger
          </h3>
          <span className="text-xs text-slate-400 ml-1">
            ({records.length} {records.length === 1 ? 'reading' : 'readings'} logged)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {alphaRecords.length >= 2 && (
            <button
              onClick={() => setShowPlot(!showPlot)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                showPlot
                  ? 'bg-amber-600 text-white border-amber-500'
                  : 'bg-slate-950 text-amber-300 border-amber-500/40 hover:bg-slate-800'
              }`}
            >
              <LineChart className="w-3.5 h-3.5" />
              <span>{showPlot ? 'Hide Vdc vs α Plot' : 'Plot Vdc vs α'}</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            disabled={records.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {records.length > 0 && (
            <button
              onClick={onClearRecords}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs transition-colors"
              title="Clear all recorded entries"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Experimental Curve Plot (Vdc vs Alpha) if enabled */}
      {showPlot && alphaRecords.length >= 2 && (
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
            <span className="flex items-center gap-2">
              <span className="w-3 h-0.5 bg-amber-400"></span> Measured Experimental Vdc
              <span className="w-3 h-0.5 bg-sky-400 border-t border-dashed ml-3"></span> Theoretical Vdc
            </span>
            <span className="text-slate-400 font-mono">Characteristic Curve: V_dc vs α</span>
          </div>

          <div className="h-52 w-full pt-2">
            <svg viewBox="0 0 600 200" className="w-full h-full">
              {/* Axes */}
              <line x1="50" y1="20" x2="50" y2="170" stroke="#334155" strokeWidth="1.5" />
              <line x1="50" y1="170" x2="570" y2="170" stroke="#334155" strokeWidth="1.5" />
              {/* Labels */}
              <text x="46" y="15" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="end">Vdc (V)</text>
              <text x="565" y="186" fill="#94a3b8" fontSize="10" textAnchor="end">α (°)</text>

              {/* Y-axis Ticks, Grid Lines, and Values */}
              {(() => {
                const maxV = Math.max(...alphaRecords.map((r) => Math.max(r.vDcTheoretical, r.vDcMeasured)), 50);
                return [0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
                  const vVal = frac * maxV;
                  const y = 170 - frac * 140;
                  return (
                    <g key={frac}>
                      {frac > 0 && (
                        <line x1="50" y1={y} x2="570" y2={y} stroke="#1e293b" strokeDasharray="3 3" strokeWidth="1" />
                      )}
                      <line x1="44" y1={y} x2="50" y2={y} stroke="#64748b" strokeWidth="1.5" />
                      <text x="40" y={y + 3} fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="monospace">
                        {vVal.toFixed(0)}V
                      </text>
                    </g>
                  );
                });
              })()}

              {/* Grid ticks for Alpha: 0, 30, 60, 90, 120, 150, 180 */}
              {[0, 30, 60, 90, 120, 150, 180].map((deg) => {
                const x = 50 + (deg / 180) * 500;
                return (
                  <g key={deg}>
                    <line x1={x} y1="170" x2={x} y2="174" stroke="#64748b" strokeWidth="1" />
                    <text x={x} y="184" fill="#64748b" fontSize="9" textAnchor="middle">{deg}°</text>
                  </g>
                );
              })}

              {/* Plot theoretical line: Vdc(alpha) */}
              {(() => {
                const maxV = Math.max(...alphaRecords.map((r) => Math.max(r.vDcTheoretical, r.vDcMeasured)), 50);
                const points = [];
                for (let a = 0; a <= 180; a += 5) {
                  const rad = (a * Math.PI) / 180;
                  // Generic bridge formula (Vm/pi)*(1+cos a)
                  const v = (alphaRecords[0].voltagePeak / Math.PI) * (1 + Math.cos(rad));
                  const x = 50 + (a / 180) * 500;
                  const y = 170 - (v / maxV) * 140;
                  points.push(`${x},${y}`);
                }
                return (
                  <polyline
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    points={points.join(' ')}
                  />
                );
              })()}

              {/* Plot experimental measured points & polyline */}
              {(() => {
                const maxV = Math.max(...alphaRecords.map((r) => Math.max(r.vDcTheoretical, r.vDcMeasured)), 50);
                const measuredPoints = alphaRecords.map((r) => {
                  const x = 50 + (r.firingAngle / 180) * 500;
                  const y = 170 - (r.vDcMeasured / maxV) * 140;
                  return { x, y, r };
                });

                return (
                  <g>
                    <polyline
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                      points={measuredPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                    />
                    {measuredPoints.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                        <text x={p.x} y={p.y - 8} fill="#f59e0b" fontSize="9" fontWeight="bold" textAnchor="middle">
                          {p.r.vDcMeasured.toFixed(1)}V
                        </text>
                      </g>
                    ))}
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>
      )}

      {/* Observation Data Table */}
      {records.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
          <FileSpreadsheet className="w-8 h-8 text-slate-600 mb-2" />
          <p className="font-medium text-slate-400">Observation Table is empty</p>
          <p className="text-slate-500 mt-0.5">
            Adjust circuit parameters and click <strong>"Add to Observation Table"</strong> above to record readings.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">Topology</th>
                <th className="py-2.5 px-3">Load</th>
                <th className="py-2.5 px-3 text-right">Vm</th>
                <th className="py-2.5 px-3 text-right">α (deg)</th>
                <th className="py-2.5 px-3 text-right">R (Ω)</th>
                <th className="py-2.5 px-3 text-right text-cyan-400">Vdc Theo</th>
                <th className="py-2.5 px-3 text-right text-cyan-300 font-bold">Vdc Meas</th>
                <th className="py-2.5 px-3 text-right text-amber-300">Vrms</th>
                <th className="py-2.5 px-3 text-right text-emerald-300">Idc</th>
                <th className="py-2.5 px-3 text-right">Ripple γ</th>
                <th className="py-2.5 px-3 text-right">Eff η (%)</th>
                <th className="py-2.5 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
              {records.map((r, idx) => (
                <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2 px-3 text-slate-500 font-sans">{idx + 1}</td>
                  <td className="py-2 px-3 font-sans font-medium text-slate-200">
                    {r.topologyName.replace('Rectifier', '')}
                  </td>
                  <td className="py-2 px-3 font-sans">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                      {r.loadType}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-slate-400">{r.voltagePeak}V</td>
                  <td className="py-2 px-3 text-right text-amber-400 font-bold">{r.firingAngle}°</td>
                  <td className="py-2 px-3 text-right text-slate-400">{r.resistance}</td>
                  <td className="py-2 px-3 text-right text-cyan-400">{r.vDcTheoretical.toFixed(2)}V</td>
                  <td className="py-2 px-3 text-right text-cyan-300 font-bold bg-cyan-950/20">
                    {r.vDcMeasured.toFixed(2)}V
                  </td>
                  <td className="py-2 px-3 text-right text-amber-300">{r.vRms.toFixed(2)}V</td>
                  <td className="py-2 px-3 text-right text-emerald-300">{r.iDc.toFixed(3)}A</td>
                  <td className="py-2 px-3 text-right text-slate-300">{r.rippleFactor.toFixed(3)}</td>
                  <td className="py-2 px-3 text-right text-sky-400">{r.efficiency.toFixed(1)}%</td>
                  <td className="py-2 px-2 text-center font-sans">
                    <button
                      onClick={() => onDeleteRecord(r.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded"
                      title="Delete row"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
