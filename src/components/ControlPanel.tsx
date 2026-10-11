import React from 'react';
import {
  RectifierParameters,
  RectifierTopology,
  LoadType,
} from '../types/rectifier';
import { TOPOLOGY_LABELS, TOPOLOGY_SHORT_NAMES } from '../physics/rectifierEngine';
import { Sliders, Zap, BookmarkPlus, Sparkles, RotateCcw } from 'lucide-react';

interface ControlPanelProps {
  params: RectifierParameters;
  onChange: (updated: Partial<RectifierParameters>) => void;
  onRecordObservation: () => void;
  onApplyPreset: (presetName: string) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onChange,
  onRecordObservation,
  onApplyPreset,
}) => {
  const isControlled = params.topology.includes('controlled');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-slate-100 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-semibold tracking-wide text-slate-200">
            Experiment Configuration & Parameters
          </h3>
        </div>
        <button
          onClick={onRecordObservation}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <BookmarkPlus className="w-3.5 h-3.5" />
          <span>Add to Observation Table</span>
        </button>
      </div>

      {/* 1. Rectifier Topology Selector */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">
          Converter Topology
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {(
            [
              'single_phase_half_wave_uncontrolled',
              'single_phase_half_wave_controlled',
              'single_phase_full_wave_bridge_uncontrolled',
              'single_phase_full_wave_semi_controlled',
              'single_phase_full_wave_bridge_controlled',
              'three_phase_uncontrolled_bridge',
              'three_phase_controlled_bridge',
            ] as RectifierTopology[]
          ).map((top) => {
            const isSelected = params.topology === top;
            return (
              <button
                key={top}
                onClick={() => onChange({ topology: top })}
                className={`text-left p-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-950/80 border-sky-500 text-white shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold text-slate-200">{TOPOLOGY_SHORT_NAMES[top]}</div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">
                  {top === 'single_phase_full_wave_semi_controlled'
                    ? '2 SCR + 2 Diode (Semi-Conv)'
                    : top.includes('controlled')
                    ? 'SCR Controlled Bridge'
                    : 'Diode Rectifier'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Load Configuration Selector */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">
          Load Model Configuration
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(
            [
              { id: 'R', label: 'Resistive (R)', desc: 'Pure Resistance' },
              { id: 'RL', label: 'Inductive (R-L)', desc: 'Lagging Current' },
              { id: 'RL_FWD', label: 'R-L + Freewheeling', desc: 'Clamped to 0V' },
              { id: 'RC', label: 'Capacitive (R-C)', desc: 'Smoothing Filter' },
            ] as { id: LoadType; label: string; desc: string }[]
          ).map((load) => {
            const isSelected = params.loadType === load.id;
            return (
              <button
                key={load.id}
                onClick={() => onChange({ loadType: load.id })}
                className={`p-2 rounded-lg border text-left text-xs transition-all ${
                  isSelected
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <div className="font-medium text-slate-200 text-xs">{load.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{load.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Firing Angle Alpha Control (for Controlled Rectifiers) */}
      {isControlled && (
        <div className="p-3 bg-slate-950 rounded-lg border border-amber-900/40 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <label className="text-xs font-semibold text-amber-300">
                Firing Angle (α) Trigger Delay
              </label>
            </div>
            <div className="flex items-center gap-1 font-mono">
              <span className="text-base font-bold text-amber-400">{params.firingAngle}°</span>
              <span className="text-xs text-slate-400">
                ({((params.firingAngle * Math.PI) / 180).toFixed(2)} rad)
              </span>
            </div>
          </div>

          {/* Slider */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-500">0°</span>
            <input
              type="range"
              min="0"
              max="180"
              step="1"
              value={params.firingAngle}
              onChange={(e) => onChange({ firingAngle: Number(e.target.value) })}
              className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <span className="text-xs font-mono text-slate-500">180°</span>
          </div>

          {/* Preset Buttons for Alpha */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 mr-1">Presets:</span>
            {[0, 30, 45, 60, 90, 120, 150].map((deg) => (
              <button
                key={deg}
                onClick={() => onChange({ firingAngle: deg })}
                className={`px-2 py-0.5 text-xs font-mono rounded border transition-colors ${
                  params.firingAngle === deg
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {deg}°
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Electrical Parameters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
        {/* Peak Voltage Vm */}
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Peak Voltage (Vm):</span>
            <span className="font-mono font-bold text-sky-400">{params.voltagePeak} V</span>
          </div>
          <input
            type="range"
            min="10"
            max="325"
            step="5"
            value={params.voltagePeak}
            onChange={(e) => onChange({ voltagePeak: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <button onClick={() => onChange({ voltagePeak: 12 })} className="hover:text-slate-300">12V</button>
            <button onClick={() => onChange({ voltagePeak: 24 })} className="hover:text-slate-300">24V</button>
            <button onClick={() => onChange({ voltagePeak: 100 })} className="hover:text-slate-300">100V</button>
            <button onClick={() => onChange({ voltagePeak: 325 })} className="hover:text-slate-300">325V (230Vrms)</button>
          </div>
        </div>

        {/* Load Resistance R */}
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Load Resistance (R):</span>
            <span className="font-mono font-bold text-emerald-400">{params.resistance} Ω</span>
          </div>
          <input
            type="range"
            min="5"
            max="200"
            step="5"
            value={params.resistance}
            onChange={(e) => onChange({ resistance: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>5Ω</span>
            <span>100Ω</span>
            <span>200Ω</span>
          </div>
        </div>

        {/* Load Inductance L (if applicable) */}
        {(params.loadType === 'RL' || params.loadType === 'RL_FWD') && (
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Inductance (L):</span>
              <span className="font-mono font-bold text-amber-400">{params.inductance} mH</span>
            </div>
            <input
              type="range"
              min="5"
              max="250"
              step="5"
              value={params.inductance}
              onChange={(e) => onChange({ inductance: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>5mH</span>
              <span>120mH</span>
              <span>250mH</span>
            </div>
          </div>
        )}

        {/* Filter Capacitance C (if RC load) */}
        {params.loadType === 'RC' && (
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Capacitance (C):</span>
              <span className="font-mono font-bold text-cyan-400">{params.capacitance} µF</span>
            </div>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={params.capacitance}
              onChange={(e) => onChange({ capacitance: Number(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>10µF</span>
              <span>470µF</span>
              <span>1000µF</span>
            </div>
          </div>
        )}

        {/* Frequency */}
        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">Supply Frequency (f):</span>
            <span className="font-mono font-bold text-slate-200">{params.frequency} Hz</span>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => onChange({ frequency: 50 })}
              className={`flex-1 py-1 text-xs font-mono rounded border transition-colors ${
                params.frequency === 50
                  ? 'bg-sky-600 text-white font-bold border-sky-500'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              50 Hz (India/EU)
            </button>
            <button
              onClick={() => onChange({ frequency: 60 })}
              className={`flex-1 py-1 text-xs font-mono rounded border transition-colors ${
                params.frequency === 60
                  ? 'bg-sky-600 text-white font-bold border-sky-500'
                  : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              60 Hz (US)
            </button>
          </div>
        </div>
      </div>

      {/* Preset Virtual Lab Experiments */}
      <div className="pt-2 border-t border-slate-800">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Lab Experiments (IIT Virtual Lab Presets):</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => onApplyPreset('hw_vs_fw')}
            className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
          >
            Exp 1: HW vs FW Diode Ripple
          </button>
          <button
            onClick={() => onApplyPreset('scr_alpha_study')}
            className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
          >
            Exp 2: SCR Firing Angle α Sweep
          </button>
          <button
            onClick={() => onApplyPreset('fwd_comparison')}
            className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
          >
            Exp 3: Role of Freewheeling Diode (FWD)
          </button>
          <button
            onClick={() => onApplyPreset('three_phase_6pulse')}
            className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
          >
            Exp 4: 3-Phase 6-Pulse Diode Bridge
          </button>
          <button
            onClick={() => onApplyPreset('semi_converter')}
            className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
          >
            Exp 5: 1Φ Semi-Converter (Inherent FWD)
          </button>
          <button
            onClick={() => onApplyPreset('three_phase_controlled')}
            className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
          >
            Exp 6: 3Φ Controlled Rectifier (α Control)
          </button>
        </div>
      </div>
    </div>
  );
};
