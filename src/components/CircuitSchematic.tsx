import React from 'react';
import { RectifierParameters, SimulationSample } from '../types/rectifier';
import { Zap } from 'lucide-react';

interface CircuitSchematicProps {
  params: RectifierParameters;
  currentSample: SimulationSample | null;
  selectedProbe: string;
  onSelectProbe: (probeId: string) => void;
}

export const CircuitSchematic: React.FC<CircuitSchematicProps> = ({
  params,
  currentSample,
  selectedProbe,
  onSelectProbe,
}) => {
  const { topology, loadType, voltagePeak, firingAngle } = params;
  const activeDevs = currentSample?.activeDevices || [];

  const isD1On = activeDevs.includes('D1') || activeDevs.includes('T1');
  const isD2On = activeDevs.includes('D2') || activeDevs.includes('T2');
  const isD3On = activeDevs.includes('D3') || activeDevs.includes('T3');
  const isD4On = activeDevs.includes('D4') || activeDevs.includes('T4');
  const isD5On = activeDevs.includes('D5') || activeDevs.includes('T5');
  const isD6On = activeDevs.includes('D6') || activeDevs.includes('T6');
  const isFwdOn = activeDevs.includes('FWD');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-full text-slate-100">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h3 className="text-sm font-semibold tracking-wide text-slate-200">
            Interactive Circuit Schematic & Current Flow
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Conducting
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-600"></span> Blocking
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative flex-1 min-h-[320px] flex items-center justify-center p-2">
        <svg
          viewBox="0 0 680 340"
          className="w-full h-full max-h-[380px] select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="schematicGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
            <filter id="glowGreen" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid */}
          <rect width="680" height="340" fill="url(#schematicGrid)" rx="8" />

          {/* ========================================================================= */}
          {/* 1. SINGLE-PHASE HALF-WAVE (UNCONTROLLED OR CONTROLLED) */}
          {/* ========================================================================= */}
          {(topology === 'single_phase_half_wave_uncontrolled' ||
            topology === 'single_phase_half_wave_controlled') && (
            <g>
              {/* AC Source at (100, 170) */}
              <g transform="translate(100, 170)">
                <circle cx="0" cy="0" r="26" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
                <path d="M -14 0 Q -7 -14 0 0 Q 7 14 14 0" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                <text x="0" y="42" fill="#94a3b8" fontSize="12" textAnchor="middle" fontWeight="500">Vs (AC)</text>
                <text x="0" y="56" fill="#64748b" fontSize="10" textAnchor="middle">{voltagePeak}Vpk</text>
              </g>

              {/* Wire: Source Top (100, 144) to Switch Anode (250, 90) */}
              <path
                d="M 100 144 L 100 90 L 250 90"
                fill="none"
                stroke={isD1On ? '#10b981' : '#475569'}
                strokeWidth={isD1On ? '3.5' : '2'}
                strokeDasharray={isD1On ? '6 3' : 'none'}
              />
              <circle cx="100" cy="90" r="3" fill={isD1On ? '#10b981' : '#475569'} />

              {/* Switch at (270, 90) */}
              <g transform="translate(270, 90)">
                <line x1="-20" y1="0" x2="0" y2="0" stroke={isD1On ? '#10b981' : '#475569'} strokeWidth="2" />
                <polygon
                  points="0,-14 0,14 20,0"
                  fill={isD1On ? '#10b981' : '#334155'}
                  stroke={isD1On ? '#34d399' : '#64748b'}
                  strokeWidth="2"
                />
                <line x1="20" y1="-14" x2="20" y2="14" stroke={isD1On ? '#34d399' : '#64748b'} strokeWidth="2.5" />
                <line x1="20" y1="0" x2="40" y2="0" stroke={isD1On ? '#10b981' : '#475569'} strokeWidth="2" />

                {topology === 'single_phase_half_wave_controlled' && (
                  <g>
                    <path d="M 10 10 L 10 24 L -4 30" fill="none" stroke={currentSample?.vGate ? '#f59e0b' : '#64748b'} strokeWidth="2" />
                    <circle cx="-4" cy="30" r="3.5" fill={currentSample?.vGate ? '#f59e0b' : '#334155'} stroke="#f59e0b" />
                    <text x="-10" y="42" fill="#f59e0b" fontSize="10" textAnchor="end">Gate (α={firingAngle}°)</text>
                  </g>
                )}

                <text x="10" y="-22" fill={isD1On ? '#34d399' : '#cbd5e1'} fontSize="11" fontWeight="bold" textAnchor="middle">
                  {topology === 'single_phase_half_wave_controlled' ? 'SCR T1' : 'Diode D1'}
                </text>
              </g>

              {/* Wire: Switch Cathode (310, 90) to Load Top Node (480, 90) */}
              <path
                d="M 310 90 L 480 90 L 480 125"
                fill="none"
                stroke={isD1On ? '#10b981' : '#475569'}
                strokeWidth={isD1On ? '3.5' : '2'}
                strokeDasharray={isD1On ? '6 3' : 'none'}
              />

              {/* Freewheeling Diode Branch if RL_FWD */}
              {loadType === 'RL_FWD' && (
                <g transform="translate(390, 170)">
                  <path d="M 0 -80 L 0 -14" stroke={isFwdOn ? '#10b981' : '#475569'} strokeWidth="2" />
                  <polygon points="-12,12 12,12 0,-12" fill={isFwdOn ? '#10b981' : '#1e293b'} stroke={isFwdOn ? '#34d399' : '#64748b'} strokeWidth="2" />
                  <line x1="-12" y1="-12" x2="12" y2="-12" stroke={isFwdOn ? '#34d399' : '#64748b'} strokeWidth="2.5" />
                  <path d="M 0 12 L 0 80" stroke={isFwdOn ? '#10b981' : '#475569'} strokeWidth="2" />
                  <circle cx="0" cy="-80" r="3.5" fill="#38bdf8" />
                  <circle cx="0" cy="80" r="3.5" fill="#38bdf8" />
                  <text x="18" y="4" fill={isFwdOn ? '#10b981' : '#94a3b8'} fontSize="11" fontWeight="bold">FWD</text>
                </g>
              )}

              {/* Wire: Load Bottom (480, 215) to Source Bottom (100, 196) */}
              <path
                d="M 480 215 L 480 250 L 100 250 L 100 196"
                fill="none"
                stroke={isD1On || isFwdOn ? '#10b981' : '#475569'}
                strokeWidth={isD1On || isFwdOn ? '3.5' : '2'}
                strokeDasharray={isD1On || isFwdOn ? '6 3' : 'none'}
              />
              <circle cx="480" cy="90" r="3.5" fill="#38bdf8" />
              <circle cx="480" cy="250" r="3.5" fill="#38bdf8" />
              <circle cx="100" cy="250" r="3.5" fill="#475569" />

              {/* Ground Symbol */}
              <g transform="translate(280, 250)">
                <line x1="0" y1="0" x2="0" y2="15" stroke="#64748b" strokeWidth="2" />
                <line x1="-12" y1="15" x2="12" y2="15" stroke="#64748b" strokeWidth="2" />
                <line x1="-8" y1="19" x2="8" y2="19" stroke="#64748b" strokeWidth="2" />
                <line x1="-4" y1="23" x2="4" y2="23" stroke="#64748b" strokeWidth="2" />
              </g>

              {/* Load Symbol */}
              <LoadSymbol x={480} y={170} loadType={loadType} params={params} isCurrent={isD1On || isFwdOn} />
            </g>
          )}

          {/* ========================================================================= */}
          {/* 2. FULL-WAVE BRIDGE: UNCONTROLLED, SEMI-CONTROLLED, OR FULLY CONTROLLED */}
          {/* ========================================================================= */}
          {(topology === 'single_phase_full_wave_bridge_uncontrolled' ||
            topology === 'single_phase_full_wave_semi_controlled' ||
            topology === 'single_phase_full_wave_bridge_controlled') && (
            <g>
              {/* AC Source at (70, 170) */}
              <g transform="translate(70, 170)">
                <circle cx="0" cy="0" r="24" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
                <path d="M -12 0 Q -6 -12 0 0 Q 6 12 12 0" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                <text x="0" y="38" fill="#94a3b8" fontSize="11" textAnchor="middle" fontWeight="500">Vs (AC)</text>
                <text x="0" y="50" fill="#64748b" fontSize="9" textAnchor="middle">{voltagePeak}Vpk, {params.frequency}Hz</text>
              </g>

              {/* Source Top Terminal (70, 146) to Bridge AC Node 1 (200, 170) */}
              {/* Clean Orthogonal line: up to y=110, across to x=200, down to (200, 170) */}
              <path
                d="M 70 146 L 70 110 L 200 110 L 200 170"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
              />
              <circle cx="70" cy="146" r="3" fill="#38bdf8" />
              <circle cx="200" cy="170" r="4.5" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
              <text x="176" y="166" fill="#38bdf8" fontSize="10" fontWeight="bold">AC 1</text>

              {/* Source Bottom Terminal (70, 194) to Bridge AC Node 2 (330, 170) */}
              {/* Clean route down to y=230, right across to x=330 with a visual bridge jumper hop over the left leg if needed, then up to (330, 170) */}
              <path
                d="M 70 194 L 70 230 L 192 230 M 208 230 L 330 230 L 330 170"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
              />
              {/* Jumper arc at (200, 230) jumping cleanly over left leg */}
              <path
                d="M 192 230 A 8 8 0 0 1 208 230"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
              />
              <circle cx="70" cy="194" r="3" fill="#38bdf8" />
              <circle cx="330" cy="170" r="4.5" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
              <text x="342" y="166" fill="#38bdf8" fontSize="10" fontWeight="bold">AC 2</text>

              {/* Bridge Arms - Leg 1 at x=200, Leg 2 at x=330 */}
              {/* Switch 1 (Top Left): D1 (uncontrolled) or T1 (controlled/semi) */}
              <BridgeArmSwitch
                x={200}
                y={120}
                isConducting={isD1On}
                isSCR={topology !== 'single_phase_full_wave_bridge_uncontrolled'}
                label={topology === 'single_phase_full_wave_bridge_uncontrolled' ? 'D1' : 'T1'}
                isTop={true}
              />

              {/* Switch 3 (Top Right): D3 (uncontrolled), T2 (semi), T3 (controlled) */}
              <BridgeArmSwitch
                x={330}
                y={120}
                isConducting={isD3On}
                isSCR={topology === 'single_phase_full_wave_bridge_controlled'}
                label={
                  topology === 'single_phase_full_wave_bridge_controlled'
                    ? 'T3'
                    : topology === 'single_phase_full_wave_semi_controlled'
                    ? 'T2'
                    : 'D3'
                }
                isTop={true}
              />

              {/* Switch 4 (Bottom Left): D4 (uncontrolled), D2 (semi), T4 (controlled) */}
              <BridgeArmSwitch
                x={200}
                y={220}
                isConducting={isD4On}
                isSCR={topology === 'single_phase_full_wave_bridge_controlled'}
                label={
                  topology === 'single_phase_full_wave_bridge_controlled'
                    ? 'T4'
                    : topology === 'single_phase_full_wave_semi_controlled'
                    ? 'D2'
                    : 'D4'
                }
                isTop={false}
              />

              {/* Switch 2 (Bottom Right): D2 (uncontrolled), D1 (semi), T2 (controlled) */}
              <BridgeArmSwitch
                x={330}
                y={220}
                isConducting={isD2On}
                isSCR={topology === 'single_phase_full_wave_bridge_controlled'}
                label={
                  topology === 'single_phase_full_wave_bridge_controlled'
                    ? 'T2'
                    : topology === 'single_phase_full_wave_semi_controlled'
                    ? 'D1'
                    : 'D2'
                }
                isTop={false}
              />

              {/* Positive DC Rail joining Leg 1 Top (200, 70), Leg 2 Top (330, 70), continuing to Load Top (520, 70) */}
              <path
                d="M 200 70 L 330 70 L 520 70 L 520 125"
                fill="none"
                stroke={isD1On || isD3On ? '#10b981' : '#475569'}
                strokeWidth={isD1On || isD3On ? '3.5' : '2.5'}
                strokeDasharray={isD1On || isD3On ? '6 3' : 'none'}
              />
              <circle cx="200" cy="70" r="4" fill="#38bdf8" />
              <circle cx="330" cy="70" r="4" fill="#38bdf8" />
              <circle cx="520" cy="70" r="4" fill="#38bdf8" />
              <circle cx="520" cy="125" r="3.5" fill="#38bdf8" />
              <text x="405" y="62" fill="#38bdf8" fontSize="11" fontWeight="bold">+ DC Rail (Cathodes)</text>

              {/* Negative DC Rail joining Leg 1 Bottom (200, 270), Leg 2 Bottom (330, 270), returning from Load Bottom (520, 215) */}
              <path
                d="M 200 270 L 330 270 L 520 270 L 520 215"
                fill="none"
                stroke={isD2On || isD4On ? '#10b981' : '#475569'}
                strokeWidth={isD2On || isD4On ? '3.5' : '2.5'}
                strokeDasharray={isD2On || isD4On ? '6 3' : 'none'}
              />
              <circle cx="200" cy="270" r="4" fill="#64748b" />
              <circle cx="330" cy="270" r="4" fill="#64748b" />
              <circle cx="520" cy="270" r="4" fill="#64748b" />
              <circle cx="520" cy="215" r="3.5" fill="#64748b" />
              <text x="405" y="285" fill="#64748b" fontSize="11" fontWeight="bold">- DC Rail (Anodes / Ref)</text>

              {/* Ground Symbol on negative rail */}
              <g transform="translate(425, 270)">
                <line x1="0" y1="0" x2="0" y2="12" stroke="#64748b" strokeWidth="2" />
                <line x1="-10" y1="12" x2="10" y2="12" stroke="#64748b" strokeWidth="2" />
                <line x1="-6" y1="16" x2="6" y2="16" stroke="#64748b" strokeWidth="2" />
                <line x1="-3" y1="20" x2="3" y2="20" stroke="#64748b" strokeWidth="2" />
              </g>

              {/* Load Symbol */}
              <LoadSymbol x={520} y={170} loadType={loadType} params={params} isCurrent={isD1On || isD2On || isD3On || isD4On} />
            </g>
          )}

          {/* ========================================================================= */}
          {/* 3. THREE-PHASE 6-PULSE (UNCONTROLLED OR FULLY CONTROLLED) */}
          {/* ========================================================================= */}
          {(topology === 'three_phase_uncontrolled_bridge' ||
            topology === 'three_phase_controlled_bridge') && (
            <g>
              {/* 3-Phase Sources at x=60 */}
              {/* Phase A */}
              <g transform="translate(60, 110)">
                <circle cx="0" cy="0" r="16" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
                <text x="0" y="4" fill="#ef4444" fontSize="10" textAnchor="middle" fontWeight="bold">Va</text>
                <text x="-24" y="4" fill="#ef4444" fontSize="10">R</text>
              </g>
              {/* Phase B */}
              <g transform="translate(60, 170)">
                <circle cx="0" cy="0" r="16" fill="#0f172a" stroke="#eab308" strokeWidth="2" />
                <text x="0" y="4" fill="#eab308" fontSize="10" textAnchor="middle" fontWeight="bold">Vb</text>
                <text x="-24" y="4" fill="#eab308" fontSize="10">Y</text>
              </g>
              {/* Phase C */}
              <g transform="translate(60, 230)">
                <circle cx="0" cy="0" r="16" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
                <text x="0" y="4" fill="#3b82f6" fontSize="10" textAnchor="middle" fontWeight="bold">Vc</text>
                <text x="-24" y="4" fill="#3b82f6" fontSize="10">B</text>
              </g>

              {/* Phase A Line: from (76, 110) to Leg 1 AC terminal (180, 170) */}
              <path d="M 76 110 L 180 110 L 180 170" fill="none" stroke="#ef4444" strokeWidth="2" />
              <circle cx="180" cy="170" r="3.5" fill="#ef4444" />

              {/* Phase B Line: from (76, 170) to Leg 2 AC terminal (260, 170) */}
              <path d="M 76 170 L 260 170" fill="none" stroke="#eab308" strokeWidth="2" />
              <circle cx="260" cy="170" r="3.5" fill="#eab308" />

              {/* Phase C Line: from (76, 230) to Leg 3 AC terminal (340, 170) */}
              <path d="M 76 230 L 340 230 L 340 170" fill="none" stroke="#3b82f6" strokeWidth="2" />
              <circle cx="340" cy="170" r="3.5" fill="#3b82f6" />

              {/* 3 Legs with Top and Bottom Switches */}
              {/* Leg 1: T1 / D1 (top), T4 / D4 (bot) */}
              <ThreePhaseSwitch
                x={180}
                y={120}
                label={topology === 'three_phase_controlled_bridge' ? 'T1' : 'D1'}
                isSCR={topology === 'three_phase_controlled_bridge'}
                isOn={isD1On}
                isTop={true}
              />
              <ThreePhaseSwitch
                x={180}
                y={220}
                label={topology === 'three_phase_controlled_bridge' ? 'T4' : 'D4'}
                isSCR={topology === 'three_phase_controlled_bridge'}
                isOn={isD4On}
                isTop={false}
              />

              {/* Leg 2: T3 / D3 (top), T6 / D6 (bot) */}
              <ThreePhaseSwitch
                x={260}
                y={120}
                label={topology === 'three_phase_controlled_bridge' ? 'T3' : 'D3'}
                isSCR={topology === 'three_phase_controlled_bridge'}
                isOn={isD3On}
                isTop={true}
              />
              <ThreePhaseSwitch
                x={260}
                y={220}
                label={topology === 'three_phase_controlled_bridge' ? 'T6' : 'D6'}
                isSCR={topology === 'three_phase_controlled_bridge'}
                isOn={isD6On}
                isTop={false}
              />

              {/* Leg 3: T5 / D5 (top), T2 / D2 (bot) */}
              <ThreePhaseSwitch
                x={340}
                y={120}
                label={topology === 'three_phase_controlled_bridge' ? 'T5' : 'D5'}
                isSCR={topology === 'three_phase_controlled_bridge'}
                isOn={isD5On}
                isTop={true}
              />
              <ThreePhaseSwitch
                x={340}
                y={220}
                label={topology === 'three_phase_controlled_bridge' ? 'T2' : 'D2'}
                isSCR={topology === 'three_phase_controlled_bridge'}
                isOn={isD2On}
                isTop={false}
              />

              {/* Positive DC Rail joining tops at y=70 to Load Top (530, 70) */}
              <path
                d="M 180 70 L 340 70 L 530 70 L 530 125"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
              />
              <circle cx="180" cy="70" r="3.5" fill="#38bdf8" />
              <circle cx="260" cy="70" r="3.5" fill="#38bdf8" />
              <circle cx="340" cy="70" r="3.5" fill="#38bdf8" />
              <circle cx="530" cy="70" r="3.5" fill="#38bdf8" />
              <text x="410" y="62" fill="#38bdf8" fontSize="11" fontWeight="bold">+ Positive DC Bus</text>

              {/* Negative DC Rail joining bottoms at y=270 to Load Bottom (530, 270) */}
              <path
                d="M 180 270 L 340 270 L 530 270 L 530 215"
                fill="none"
                stroke="#64748b"
                strokeWidth="3"
              />
              <circle cx="180" cy="270" r="3.5" fill="#64748b" />
              <circle cx="260" cy="270" r="3.5" fill="#64748b" />
              <circle cx="340" cy="270" r="3.5" fill="#64748b" />
              <circle cx="530" cy="270" r="3.5" fill="#64748b" />
              <text x="410" y="285" fill="#64748b" fontSize="11" fontWeight="bold">- Negative DC Bus</text>

              {/* Load Symbol */}
              <LoadSymbol x={530} y={170} loadType={loadType} params={params} isCurrent={true} />
            </g>
          )}

          {/* ========================================================================= */}
          {/* INTERACTIVE PROBE TEST POINTS */}
          {/* ========================================================================= */}
          <ProbeTerminal
            x={100}
            y={115}
            id="probe_vs"
            name="CH1: Vs"
            color="#eab308"
            isSelected={selectedProbe === 'probe_vs'}
            onClick={() => onSelectProbe('probe_vs')}
          />
          <ProbeTerminal
            x={500}
            y={70}
            id="probe_vo"
            name="CH2: Vo"
            color="#06b6d4"
            isSelected={selectedProbe === 'probe_vo'}
            onClick={() => onSelectProbe('probe_vo')}
          />
          <ProbeTerminal
            x={500}
            y={270}
            id="probe_io"
            name="CH3: Io"
            color="#10b981"
            isSelected={selectedProbe === 'probe_io'}
            onClick={() => onSelectProbe('probe_io')}
          />
        </svg>
      </div>

      {/* Conducting Device Status Bar */}
      <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Active Path:</span>
          {activeDevs.length > 0 ? (
            <div className="flex items-center gap-1.5">
              {activeDevs.map((dev) => (
                <span
                  key={dev}
                  className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 font-mono font-semibold"
                >
                  {dev} (ON)
                </span>
              ))}
            </div>
          ) : (
            <span className="text-slate-500 italic">All switches blocking (Dead time)</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-slate-400 text-xs">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Phase: {(((currentSample?.phase || 0) * 180) / Math.PI).toFixed(0)}°</span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// HELPER COMPONENTS WITH CONTINUOUS, TOUCHING CONNECTIONS
// ============================================================================

const BridgeArmSwitch: React.FC<{
  x: number;
  y: number;
  isConducting: boolean;
  isSCR: boolean;
  label: string;
  isTop: boolean;
}> = ({ x, y, isConducting, isSCR, label, isTop }) => {
  // Top arm connects from y=170 (AC node) up to y=70 (+ DC rail)
  // Bottom arm connects from y=270 (- DC rail) up to y=170 (AC node)
  const yStart = isTop ? 170 : 270;
  const yEnd = isTop ? 70 : 170;

  return (
    <g>
      {/* Continuous vertical connecting line */}
      <line
        x1={x}
        y1={yStart}
        x2={x}
        y2={yEnd}
        stroke={isConducting ? '#10b981' : '#475569'}
        strokeWidth={isConducting ? '3' : '2'}
      />
      {/* Circle housing switch symbol at (x, y) */}
      <circle
        cx={x}
        cy={y}
        r="18"
        fill="#0f172a"
        stroke={isConducting ? '#10b981' : '#475569'}
        strokeWidth="1.5"
      />
      {/* Diode triangle pointing upward toward positive rail */}
      <polygon
        points={`${x - 8},${y + 8} ${x + 8},${y + 8} ${x},${y - 8}`}
        fill={isConducting ? '#10b981' : '#1e293b'}
        stroke={isConducting ? '#34d399' : '#64748b'}
        strokeWidth="1.5"
      />
      <line
        x1={x - 8}
        y1={y - 8}
        x2={x + 8}
        y2={y - 8}
        stroke={isConducting ? '#34d399' : '#64748b'}
        strokeWidth="2"
      />

      {/* SCR Gate terminal */}
      {isSCR && (
        <path
          d={`M ${x + 4} ${y + 2} L ${x + 16} ${y + 6}`}
          stroke={isConducting ? '#f59e0b' : '#64748b'}
          strokeWidth="1.5"
        />
      )}

      {/* Switch Label */}
      <text
        x={x - 22}
        y={y + 4}
        fill={isConducting ? '#34d399' : '#94a3b8'}
        fontSize="10"
        fontWeight="bold"
        textAnchor="end"
      >
        {label}
      </text>
    </g>
  );
};

const ThreePhaseSwitch: React.FC<{
  x: number;
  y: number;
  label: string;
  isSCR: boolean;
  isOn: boolean;
  isTop: boolean;
}> = ({ x, y, label, isSCR, isOn, isTop }) => {
  const yStart = isTop ? 170 : 270;
  const yEnd = isTop ? 70 : 170;

  return (
    <g>
      <line
        x1={x}
        y1={yStart}
        x2={x}
        y2={yEnd}
        stroke={isOn ? '#10b981' : '#475569'}
        strokeWidth={isOn ? '3' : '2'}
      />
      <circle
        cx={x}
        cy={y}
        r="17"
        fill="#0f172a"
        stroke={isOn ? '#10b981' : '#475569'}
        strokeWidth="1.5"
      />
      <polygon
        points={`${x - 8},${y + 7} ${x + 8},${y + 7} ${x},${y - 7}`}
        fill={isOn ? '#10b981' : '#1e293b'}
        stroke={isOn ? '#34d399' : '#64748b'}
        strokeWidth="1.5"
      />
      <line
        x1={x - 8}
        y1={y - 7}
        x2={x + 8}
        y2={y - 7}
        stroke={isOn ? '#34d399' : '#64748b'}
        strokeWidth="2"
      />

      {isSCR && (
        <path
          d={`M ${x + 4} ${y + 2} L ${x + 14} ${y + 6}`}
          stroke={isOn ? '#f59e0b' : '#64748b'}
          strokeWidth="1.5"
        />
      )}

      <text
        x={x + 22}
        y={y + 4}
        fill={isOn ? '#34d399' : '#94a3b8'}
        fontSize="10"
        fontWeight="bold"
      >
        {label}
      </text>
    </g>
  );
};

const LoadSymbol: React.FC<{
  x: number;
  y: number;
  loadType: string;
  params: RectifierParameters;
  isCurrent: boolean;
}> = ({ x, y, loadType, params, isCurrent }) => {
  const { resistance, inductance, capacitance } = params;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Box container for Load: top edge connects to y=-45 (which matches y=125 in canvas) */}
      <rect
        x="-35"
        y="-45"
        width="70"
        height="90"
        fill="#0f172a"
        stroke={isCurrent ? '#38bdf8' : '#334155'}
        strokeWidth="1.5"
        rx="6"
      />

      {/* Internal connecting lead wires touching box boundary */}
      <line x1="0" y1="-45" x2="0" y2="-32" stroke="#38bdf8" strokeWidth="2" />
      <line x1="0" y1="32" x2="0" y2="45" stroke="#38bdf8" strokeWidth="2" />

      {loadType === 'R' && (
        <g>
          <path
            d="M 0 -32 L 0 -22 L -8 -15 L 8 -5 L -8 5 L 8 15 L 0 22 L 0 32"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2.5"
          />
          <text x="0" y="58" fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">
            R={resistance}Ω
          </text>
        </g>
      )}

      {(loadType === 'RL' || loadType === 'RL_FWD') && (
        <g>
          <path
            d="M 0 -32 L 0 -24 L -6 -18 L 6 -10 L -6 -2 L 0 0"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="2"
          />
          <path
            d="M 0 0 C -10 5, -10 12, 0 14 C -10 18, -10 24, 0 26 L 0 32"
            fill="none"
            stroke="#10b981"
            strokeWidth="2"
          />
          <text x="0" y="58" fill="#38bdf8" fontSize="9" textAnchor="middle" fontWeight="bold">
            R={resistance}Ω, L={inductance}mH
          </text>
        </g>
      )}

      {loadType === 'RC' && (
        <g>
          <path d="M -14 -28 L -14 28" stroke="#38bdf8" strokeWidth="2" />
          <path d="M 14 -28 L 14 -5" stroke="#06b6d4" strokeWidth="2" />
          <line x1="8" y1="-5" x2="20" y2="-5" stroke="#06b6d4" strokeWidth="2" />
          <line x1="8" y1="5" x2="20" y2="5" stroke="#06b6d4" strokeWidth="2" />
          <path d="M 14 5 L 14 28" stroke="#06b6d4" strokeWidth="2" />
          <text x="0" y="58" fill="#38bdf8" fontSize="9" textAnchor="middle" fontWeight="bold">
            R={resistance}Ω, C={capacitance}µF
          </text>
        </g>
      )}

      <text x="0" y="-52" fill="#94a3b8" fontSize="10" textAnchor="middle" fontWeight="bold">
        LOAD
      </text>
    </g>
  );
};

const ProbeTerminal: React.FC<{
  x: number;
  y: number;
  id: string;
  name: string;
  color: string;
  isSelected: boolean;
  onClick: () => void;
}> = ({ x, y, name, color, isSelected, onClick }) => {
  return (
    <g
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer group"
      onClick={onClick}
    >
      <circle
        cx="0"
        cy="0"
        r="9"
        fill={isSelected ? color : '#0f172a'}
        stroke={color}
        strokeWidth="2"
        className="transition-all duration-150 group-hover:scale-125"
      />
      <circle cx="0" cy="0" r="3" fill={isSelected ? '#0f172a' : color} />
      <text
        x="14"
        y="4"
        fill={isSelected ? '#ffffff' : color}
        fontSize="10"
        fontWeight={isSelected ? 'bold' : 'normal'}
        className="pointer-events-none drop-shadow"
      >
        {name}
      </text>
    </g>
  );
};
