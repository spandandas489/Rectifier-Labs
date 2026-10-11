import React from 'react';
import { RectifierMetrics, RectifierParameters } from '../types/rectifier';
import { calculateTheoreticalVdc } from '../physics/rectifierEngine';
import { Activity, Gauge, Percent, Zap, Cpu, CheckCircle } from 'lucide-react';

interface MeterDashboardProps {
  metrics: RectifierMetrics;
  params: RectifierParameters;
}

export const MeterDashboard: React.FC<MeterDashboardProps> = ({ metrics, params }) => {
  const theoreticalVdc = calculateTheoreticalVdc(params);
  const diffPercent =
    theoreticalVdc > 0.1
      ? Math.abs(((metrics.vDcAvg - theoreticalVdc) / theoreticalVdc) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-100 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-semibold tracking-wide text-slate-200">
            Digital Multimeter & Electrical Performance Meters
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">Theory Match:</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-semibold">
            ±{diffPercent}%
          </span>
        </div>
      </div>

      {/* Grid of Meter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Vdc (Average) */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>V_dc (Avg)</span>
            <span className="text-[10px] text-sky-400 font-mono">DC Volts</span>
          </div>
          <div className="my-1">
            <span className="text-xl font-mono font-bold text-cyan-400">
              {metrics.vDcAvg.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 ml-1">V</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Theory: {theoreticalVdc.toFixed(2)} V
          </div>
        </div>

        {/* Vrms */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>V_rms (Effective)</span>
            <span className="text-[10px] text-amber-400 font-mono">RMS</span>
          </div>
          <div className="my-1">
            <span className="text-xl font-mono font-bold text-amber-300">
              {metrics.vRms.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 ml-1">V</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            AC Comp: {metrics.fundamentalRms.toFixed(2)} V
          </div>
        </div>

        {/* Idc */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>I_dc (Avg)</span>
            <span className="text-[10px] text-emerald-400 font-mono">Current</span>
          </div>
          <div className="my-1">
            <span className="text-xl font-mono font-bold text-emerald-400">
              {metrics.iDcAvg.toFixed(3)}
            </span>
            <span className="text-xs text-slate-400 ml-1">A</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            I_rms: {metrics.iRms.toFixed(3)} A
          </div>
        </div>

        {/* Ripple Factor (Gamma) */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Ripple Factor (γ)</span>
            <Activity className="w-3 h-3 text-rose-400" />
          </div>
          <div className="my-1">
            <span
              className={`text-xl font-mono font-bold ${
                metrics.rippleFactor < 0.2
                  ? 'text-emerald-400'
                  : metrics.rippleFactor < 0.6
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {metrics.rippleFactor.toFixed(3)}
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            Form Factor: {metrics.formFactor.toFixed(3)}
          </div>
        </div>

        {/* Rectification Efficiency */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Efficiency (η)</span>
            <Percent className="w-3 h-3 text-sky-400" />
          </div>
          <div className="my-1">
            <span className="text-xl font-mono font-bold text-sky-400">
              {metrics.efficiency.toFixed(1)}%
            </span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            P_dc: {metrics.pDc.toFixed(1)} W
          </div>
        </div>

        {/* PIV & Ripple Frequency */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Switch PIV</span>
            <span className="text-[10px] text-purple-400 font-mono">Stress</span>
          </div>
          <div className="my-1">
            <span className="text-xl font-mono font-bold text-purple-300">
              {metrics.peakInverseVoltage.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 ml-1">V</span>
          </div>
          <div className="text-[10px] text-slate-500 font-mono">
            f_ripple: {metrics.rippleFrequency} Hz
          </div>
        </div>
      </div>
    </div>
  );
};
