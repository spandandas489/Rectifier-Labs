import React from 'react';
import { HarmonicComponent, RectifierMetrics } from '../types/rectifier';
import { BarChart3, Info } from 'lucide-react';

interface HarmonicsChartProps {
  harmonics: HarmonicComponent[];
  metrics: RectifierMetrics;
  frequency: number;
}

export const HarmonicsChart: React.FC<HarmonicsChartProps> = ({
  harmonics,
  metrics,
  frequency,
}) => {
  const maxMag = Math.max(...harmonics.map((h) => h.magnitude), 1);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-100 flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-semibold tracking-wide text-slate-200">
            Harmonic Spectrum & FFT Frequency Analysis
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-slate-400">
            Ripple Freq:{' '}
            <span className="text-amber-400 font-bold">{metrics.rippleFrequency} Hz</span>
          </span>
          <span className="text-slate-400">
            AC THD:{' '}
            <span className="text-rose-400 font-bold">{metrics.thdPercent.toFixed(1)}%</span>
          </span>
        </div>
      </div>

      {/* Bar Chart Container with Y-Axis */}
      <div className="flex gap-2 items-stretch h-44 w-full bg-slate-950/60 rounded-lg border border-slate-800/80 p-2">
        {/* Y-Axis Scale with Values */}
        <div className="flex flex-col justify-between items-end pr-2 pt-2 pb-6 border-r border-slate-800 text-[9px] font-mono text-slate-400 select-none w-13 shrink-0">
          <div className="flex items-center gap-1">
            <span>{maxMag.toFixed(0)}V</span>
            <span className="w-1.5 h-px bg-slate-700"></span>
          </div>
          <div className="flex items-center gap-1">
            <span>{(maxMag * 0.75).toFixed(0)}V</span>
            <span className="w-1.5 h-px bg-slate-700"></span>
          </div>
          <div className="flex items-center gap-1">
            <span>{(maxMag * 0.5).toFixed(0)}V</span>
            <span className="w-1.5 h-px bg-slate-700"></span>
          </div>
          <div className="flex items-center gap-1">
            <span>{(maxMag * 0.25).toFixed(0)}V</span>
            <span className="w-1.5 h-px bg-slate-700"></span>
          </div>
          <div className="flex items-center gap-1">
            <span>0V</span>
            <span className="w-1.5 h-px bg-slate-700"></span>
          </div>
        </div>

        {/* Bars Container */}
        <div className="flex-1 flex items-end gap-1.5 sm:gap-2.5 pt-4 pb-2 px-1 relative">
          {/* Subtle horizontal grid lines */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between pt-2 pb-6">
            <div className="w-full h-px border-b border-slate-800/60 border-dashed"></div>
            <div className="w-full h-px border-b border-slate-800/60 border-dashed"></div>
            <div className="w-full h-px border-b border-slate-800/60 border-dashed"></div>
            <div className="w-full h-px border-b border-slate-800/60 border-dashed"></div>
            <div className="w-full h-px border-b border-slate-800"></div>
          </div>
        {harmonics.slice(0, 10).map((h) => {
          const heightPct = Math.max(4, (h.magnitude / maxMag) * 100);
          const isDc = h.order === 0;
          const isDominant =
            !isDc && h.magnitude > 0.05 * maxMag && h.magnitude === Math.max(...harmonics.slice(1).map((x) => x.magnitude));

          return (
            <div
              key={h.order}
              className="flex-1 flex flex-col items-center justify-end h-full group relative"
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-slate-100 border border-slate-700 rounded px-2 py-1 text-[10px] font-mono pointer-events-none whitespace-nowrap z-20 shadow-lg">
                <div>Order n = {isDc ? '0 (DC)' : `${h.order} (${h.frequency}Hz)`}</div>
                <div>Mag: {h.magnitude.toFixed(1)} V ({h.relativePercent.toFixed(0)}%)</div>
              </div>

              {/* Value Label above Bar */}
              <span className="text-[10px] font-mono text-slate-400 mb-1 truncate">
                {h.magnitude > 0.5 ? h.magnitude.toFixed(0) : ''}
              </span>

              {/* Bar Fill */}
              <div
                style={{ height: `${heightPct}%` }}
                className={`w-full rounded-t-sm transition-all duration-300 ${
                  isDc
                    ? 'bg-gradient-to-t from-cyan-600 to-cyan-400'
                    : isDominant
                    ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                    : 'bg-gradient-to-t from-slate-700 to-slate-500 hover:from-sky-600 hover:to-sky-400'
                }`}
              />

              {/* X Axis Order Label */}
              <span className="text-[10px] font-mono text-slate-400 mt-1.5">
                {isDc ? 'DC' : `n=${h.order}`}
              </span>
            </div>
          );
        })}
        </div>
      </div>

      {/* Explanation note */}
      <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong className="text-slate-200">Fourier Harmonic Analysis:</strong> An ideal DC supply
          has only the DC component ($n=0$). Rectification produces harmonic ripples. Single-phase
          rectifiers produce predominantly $2\omega$ (100Hz) ripples, while 3-phase 6-pulse bridges
          suppress low-order harmonics, shifting the lowest ripple harmonic to $6\omega$ (300Hz),
          drastically reducing the required filter capacitance.
        </p>
      </div>
    </div>
  );
};
