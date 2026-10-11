import React, { useState } from 'react';
import { RectifierParameters, SimulationSample } from '../types/rectifier';
import { Zap, Activity, Eye, ArrowRight, Radio } from 'lucide-react';

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
  const [showCurrentArrows, setShowCurrentArrows] = useState(true);

  const activeDevs = currentSample?.activeDevices || [];
  const vSource = currentSample?.vSource || 0;
  const vOutput = currentSample?.vOutput || 0;
  const iOutput = currentSample?.iOutput || 0;
  const isCurrentActive = Math.abs(iOutput) > 0.005;

  const isD1On = activeDevs.includes('D1') || activeDevs.includes('T1');
  const isD2On = activeDevs.includes('D2') || activeDevs.includes('T2');
  const isD3On = activeDevs.includes('D3') || activeDevs.includes('T3');
  const isD4On = activeDevs.includes('D4') || activeDevs.includes('T4');
  const isD5On = activeDevs.includes('D5') || activeDevs.includes('T5');
  const isD6On = activeDevs.includes('D6') || activeDevs.includes('T6');
  const isFwdOn = activeDevs.includes('FWD');

  // Full-bridge specific loop states
  const isBridgePosLoop = (isD1On && isD2On) || (isCurrentActive && vSource > 0.5 && (isD1On || isD2On));
  const isBridgeNegLoop = (isD3On && isD4On) || (isCurrentActive && vSource < -0.5 && (isD3On || isD4On));

  // Determine human-readable active loop description
  let pathDescription = 'All switches blocking (Dead-time / Zero crossing)';
  let pathBadgeColor = 'bg-slate-800 text-slate-400 border-slate-700';

  if (topology === 'single_phase_half_wave_uncontrolled' || topology === 'single_phase_half_wave_controlled') {
    if (isD1On && isCurrentActive) {
      pathDescription = 'AC Source (+) ➔ Switch D1/T1 ➔ Load ➔ AC Source (-)';
      pathBadgeColor = 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50 shadow-emerald-950/50';
    } else if (isFwdOn && isCurrentActive) {
      pathDescription = 'Inductive Energy Loop: Load ➔ FWD Diode ➔ Load (Freewheeling)';
      pathBadgeColor = 'bg-amber-950/90 text-amber-300 border-amber-500/50 shadow-amber-950/50';
    }
  } else if (
    topology === 'single_phase_full_wave_bridge_uncontrolled' ||
    topology === 'single_phase_full_wave_semi_controlled' ||
    topology === 'single_phase_full_wave_bridge_controlled'
  ) {
    if (isBridgePosLoop) {
      const dev1 = topology === 'single_phase_full_wave_bridge_controlled' ? 'T1' : 'D1';
      const dev2 = topology === 'single_phase_full_wave_bridge_controlled' ? 'T2' : topology === 'single_phase_full_wave_semi_controlled' ? 'D1' : 'D2';
      pathDescription = `AC Source (+) ➔ ${dev1} ➔ + DC Bus ➔ Load ➔ - DC Bus ➔ ${dev2} ➔ AC Source (-)`;
      pathBadgeColor = 'bg-emerald-950/90 text-emerald-300 border-emerald-500/60 shadow-emerald-950/50';
    } else if (isBridgeNegLoop) {
      const dev3 = topology === 'single_phase_full_wave_bridge_controlled' ? 'T3' : topology === 'single_phase_full_wave_semi_controlled' ? 'T2' : 'D3';
      const dev4 = topology === 'single_phase_full_wave_bridge_controlled' ? 'T4' : topology === 'single_phase_full_wave_semi_controlled' ? 'D2' : 'D4';
      pathDescription = `AC Source (-) ➔ ${dev3} ➔ + DC Bus ➔ Load ➔ - DC Bus ➔ ${dev4} ➔ AC Source (+)`;
      pathBadgeColor = 'bg-teal-950/90 text-teal-300 border-teal-500/60 shadow-teal-950/50';
    } else if (isFwdOn && isCurrentActive) {
      pathDescription = 'Freewheeling Loop: Load ➔ FWD Diode ➔ Load (Dissipating stored energy)';
      pathBadgeColor = 'bg-amber-950/90 text-amber-300 border-amber-500/50 shadow-amber-950/50';
    }
  } else if (topology.startsWith('three_phase')) {
    if (activeDevs.length >= 2) {
      pathDescription = `3-Phase Commutation: Phase ➔ Top Switch ➔ Load ➔ Bottom Switch ➔ Return Phase`;
      pathBadgeColor = 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50 shadow-emerald-950/50';
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-full text-slate-100 shadow-lg">
      {/* Header with Title and Mode Controls */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500" />
          <h3 className="text-sm font-semibold tracking-wide text-slate-200">
            Interactive Circuit Schematic & Live Current Path
          </h3>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowCurrentArrows(!showCurrentArrows)}
            className={`px-2 py-1 rounded flex items-center gap-1.5 border transition-colors ${
              showCurrentArrows
                ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle animated current flow indicators"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Flow Vectors</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 text-slate-400 pl-2 border-l border-slate-800">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400"></span> ON
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-600"></span> OFF
            </span>
          </div>
        </div>
      </div>

      {/* Real-Time Current Loop Callout Banner */}
      <div className="mt-2.5 px-3 py-1.5 rounded-lg border flex flex-wrap items-center justify-between gap-2 text-xs transition-colors duration-200 shadow-sm font-mono ${pathBadgeColor}">
        <div className="flex items-center gap-2 font-medium">
          <span className="text-[11px] uppercase tracking-wider text-slate-400 font-sans font-bold flex items-center gap-1">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Current Loop:
          </span>
          <span className="text-emerald-200 font-semibold">{pathDescription}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-sans text-slate-300">
          <span>Vs: <strong className={vSource >= 0 ? 'text-amber-400' : 'text-sky-400'}>{vSource.toFixed(1)}V</strong></span>
          <span>Vo: <strong className="text-cyan-400">{vOutput.toFixed(1)}V</strong></span>
          <span>Io: <strong className="text-emerald-400">{iOutput.toFixed(2)}A</strong></span>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative flex-1 min-h-[340px] flex items-center justify-center p-2">
        <svg
          viewBox="0 0 720 360"
          className="w-full h-full max-h-[390px] select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="schematicGrid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>

            {/* Glowing Neon Filter for Active Conduction Path */}
            <filter id="currentGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Arrowhead Markers for Flow Direction */}
            <marker id="arrowFwd" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
            </marker>
            <marker id="arrowRev" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 10 1 L 0 5 L 10 9 z" fill="#10b981" />
            </marker>

            {/* Inline CSS Keyframe for continuous current flowing dashes */}
            <style>{`
              @keyframes fwdDash {
                from { stroke-dashoffset: 24; }
                to { stroke-dashoffset: 0; }
              }
              @keyframes revDash {
                from { stroke-dashoffset: 0; }
                to { stroke-dashoffset: 24; }
              }
              .flow-fwd {
                stroke-dasharray: 8 5;
                animation: fwdDash 0.75s linear infinite;
              }
              .flow-rev {
                stroke-dasharray: 8 5;
                animation: revDash 0.75s linear infinite;
              }
            `}</style>
          </defs>

          {/* Canvas Background Grid */}
          <rect width="720" height="360" fill="url(#schematicGrid)" rx="8" />

          {/* ========================================================================= */}
          {/* 1. SINGLE-PHASE HALF-WAVE (UNCONTROLLED OR CONTROLLED) */}
          {/* ========================================================================= */}
          {(topology === 'single_phase_half_wave_uncontrolled' ||
            topology === 'single_phase_half_wave_controlled') && (
            <g>
              {/* AC Source at (110, 180) */}
              <g transform="translate(110, 180)">
                <circle cx="0" cy="0" r="26" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
                <path d="M -14 0 Q -7 -14 0 0 Q 7 14 14 0" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                <text x="0" y="42" fill="#94a3b8" fontSize="12" textAnchor="middle" fontWeight="500">Vs (AC)</text>
                <text x="0" y="56" fill="#64748b" fontSize="10" textAnchor="middle">{voltagePeak}Vpk, {params.frequency}Hz</text>

                {/* Real-time Dynamic Polarity Badges */}
                <circle cx="0" cy="-28" r="7" fill={vSource >= 0 ? '#10b981' : '#ef4444'} />
                <text x="0" y="-25" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                  {vSource >= 0 ? '+' : '−'}
                </text>
                <circle cx="0" cy="28" r="7" fill={vSource >= 0 ? '#ef4444' : '#10b981'} />
                <text x="0" y="31" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                  {vSource >= 0 ? '−' : '+'}
                </text>
              </g>

              {/* Wire: Source Top (110, 154) to Switch Anode (280, 95) */}
              <path
                d="M 110 154 L 110 95 L 280 95"
                fill="none"
                stroke={isD1On ? '#10b981' : '#475569'}
                strokeWidth={isD1On ? '3.5' : '2'}
                className={isD1On ? 'flow-fwd' : ''}
                filter={isD1On ? 'url(#currentGlow)' : undefined}
                markerEnd={showCurrentArrows && isD1On ? 'url(#arrowFwd)' : undefined}
              />
              <circle cx="110" cy="95" r="3" fill={isD1On ? '#10b981' : '#475569'} />

              {/* Switch at (300, 95) */}
              <g transform="translate(300, 95)">
                <line x1="-20" y1="0" x2="0" y2="0" stroke={isD1On ? '#10b981' : '#475569'} strokeWidth="2" />
                <polygon
                  points="0,-14 0,14 20,0"
                  fill={isD1On ? '#10b981' : '#1e293b'}
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
                  {topology === 'single_phase_half_wave_controlled' ? 'SCR T1' : 'Diode D1'} {isD1On ? '(ON)' : '(OFF)'}
                </text>
              </g>

              {/* Wire: Switch Cathode (340, 95) to Load Top Node (520, 95) */}
              <path
                d="M 340 95 L 520 95 L 520 135"
                fill="none"
                stroke={isD1On ? '#10b981' : '#475569'}
                strokeWidth={isD1On ? '3.5' : '2'}
                className={isD1On ? 'flow-fwd' : ''}
                filter={isD1On ? 'url(#currentGlow)' : undefined}
                markerEnd={showCurrentArrows && isD1On ? 'url(#arrowFwd)' : undefined}
              />

              {/* Freewheeling Diode Branch if RL_FWD */}
              {loadType === 'RL_FWD' && (
                <g transform="translate(420, 180)">
                  <path
                    d="M 0 85 L 0 14"
                    stroke={isFwdOn ? '#10b981' : '#475569'}
                    strokeWidth={isFwdOn ? '3.5' : '2'}
                    className={isFwdOn ? 'flow-fwd' : ''}
                  />
                  <polygon
                    points="-12,12 12,12 0,-12"
                    fill={isFwdOn ? '#10b981' : '#1e293b'}
                    stroke={isFwdOn ? '#34d399' : '#64748b'}
                    strokeWidth="2"
                  />
                  <line x1="-12" y1="-12" x2="12" y2="-12" stroke={isFwdOn ? '#34d399' : '#64748b'} strokeWidth="2.5" />
                  <path
                    d="M 0 -14 L 0 -85"
                    stroke={isFwdOn ? '#10b981' : '#475569'}
                    strokeWidth={isFwdOn ? '3.5' : '2'}
                    className={isFwdOn ? 'flow-fwd' : ''}
                  />
                  <circle cx="0" cy="-85" r="3.5" fill="#38bdf8" />
                  <circle cx="0" cy="85" r="3.5" fill="#38bdf8" />
                  <text x="18" y="4" fill={isFwdOn ? '#10b981' : '#94a3b8'} fontSize="11" fontWeight="bold">
                    FWD {isFwdOn ? '(ON)' : '(OFF)'}
                  </text>
                </g>
              )}

              {/* Wire: Load Bottom (520, 225) to Source Bottom (110, 206) */}
              <path
                d="M 520 225 L 520 265 L 110 265 L 110 206"
                fill="none"
                stroke={isD1On ? '#10b981' : '#475569'}
                strokeWidth={isD1On ? '3.5' : '2'}
                className={isD1On ? 'flow-fwd' : ''}
                filter={isD1On ? 'url(#currentGlow)' : undefined}
                markerEnd={showCurrentArrows && isD1On ? 'url(#arrowFwd)' : undefined}
              />
              <circle cx="520" cy="265" r="3" fill="#64748b" />
              <circle cx="110" cy="265" r="3" fill="#64748b" />

              {/* Ground Symbol */}
              <g transform="translate(315, 265)">
                <line x1="0" y1="0" x2="0" y2="15" stroke="#64748b" strokeWidth="2" />
                <line x1="-12" y1="15" x2="12" y2="15" stroke="#64748b" strokeWidth="2" />
                <line x1="-8" y1="19" x2="8" y2="19" stroke="#64748b" strokeWidth="2" />
                <line x1="-4" y1="23" x2="4" y2="23" stroke="#64748b" strokeWidth="2" />
              </g>

              {/* Load Symbol */}
              <LoadSymbol x={520} y={180} loadType={loadType} params={params} isCurrent={isD1On || isFwdOn} />
            </g>
          )}

          {/* ========================================================================= */}
          {/* 2. FULL-WAVE BRIDGE: UNCONTROLLED, SEMI-CONTROLLED, OR FULLY CONTROLLED */}
          {/* ========================================================================= */}
          {(topology === 'single_phase_full_wave_bridge_uncontrolled' ||
            topology === 'single_phase_full_wave_semi_controlled' ||
            topology === 'single_phase_full_wave_bridge_controlled') && (
            <g>
              {/* AC Source centered at (80, 180) */}
              <g transform="translate(80, 180)">
                <circle cx="0" cy="0" r="26" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
                <path d="M -14 0 Q -7 -14 0 0 Q 7 14 14 0" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
                <text x="0" y="44" fill="#94a3b8" fontSize="11" textAnchor="middle" fontWeight="bold">Vs (AC)</text>
                <text x="0" y="58" fill="#64748b" fontSize="9" textAnchor="middle">{voltagePeak}Vpk, {params.frequency}Hz</text>

                {/* Instantaneous Alternating Polarity Badges on Source Terminals */}
                {/* Top Terminal (1) Polarity */}
                <g transform="translate(0, -32)">
                  <circle cx="0" cy="0" r="8" fill={vSource >= 0 ? '#10b981' : '#38bdf8'} stroke="#0f172a" strokeWidth="1.5" />
                  <text x="0" y="3" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                    {vSource >= 0 ? '+' : '−'}
                  </text>
                </g>
                {/* Bottom Terminal (2) Polarity */}
                <g transform="translate(0, 32)">
                  <circle cx="0" cy="0" r="8" fill={vSource >= 0 ? '#38bdf8' : '#10b981'} stroke="#0f172a" strokeWidth="1.5" />
                  <text x="0" y="3" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                    {vSource >= 0 ? '−' : '+'}
                  </text>
                </g>
              </g>

              {/* --------------------------------------------------------------------- */}
              {/* AC SUPPLY LINE 1: from Source Top (80, 154) to AC Node 1 (240, 180) */}
              {/* Pure orthogonal route along centerline band: does NOT cross any diodes */}
              {/* --------------------------------------------------------------------- */}
              <path
                d="M 80 154 L 140 154 L 140 180 L 240 180"
                fill="none"
                stroke={isBridgePosLoop ? '#10b981' : isBridgeNegLoop ? '#10b981' : '#38bdf8'}
                strokeWidth={isBridgePosLoop || isBridgeNegLoop ? '3.5' : '2.5'}
                className={isBridgePosLoop ? 'flow-fwd' : isBridgeNegLoop ? 'flow-rev' : ''}
                filter={isBridgePosLoop || isBridgeNegLoop ? 'url(#currentGlow)' : undefined}
                markerEnd={
                  showCurrentArrows
                    ? isBridgePosLoop
                      ? 'url(#arrowFwd)'
                      : isBridgeNegLoop
                      ? 'url(#arrowRev)'
                      : undefined
                    : undefined
                }
              />
              <circle cx="80" cy="154" r="3.5" fill="#38bdf8" />
              {/* AC Node 1 Terminal Dot at (240, 180) */}
              <circle cx="240" cy="180" r="5" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
              <text x="216" y="174" fill="#38bdf8" fontSize="10" fontWeight="bold">AC 1</text>

              {/* --------------------------------------------------------------------- */}
              {/* AC SUPPLY LINE 2: from Source Bottom (80, 206) to AC Node 2 (380, 180) */}
              {/* Routed at y=198 with a clean, high-visibility semicircular jumper arch */}
              {/* jumping cleanly over Leg 1 without touching any diode body */}
              {/* --------------------------------------------------------------------- */}
              {/* Path before jump: (80, 206) -> (140, 206) -> (140, 198) -> (226, 198) */}
              <path
                d="M 80 206 L 140 206 L 140 198 L 226 198"
                fill="none"
                stroke={isBridgePosLoop ? '#10b981' : isBridgeNegLoop ? '#10b981' : '#38bdf8'}
                strokeWidth={isBridgePosLoop || isBridgeNegLoop ? '3.5' : '2.5'}
                className={isBridgeNegLoop ? 'flow-fwd' : isBridgePosLoop ? 'flow-rev' : ''}
                filter={isBridgePosLoop || isBridgeNegLoop ? 'url(#currentGlow)' : undefined}
              />
              {/* Semicircular Jumper Arc jumping over Leg 1 vertical wire */}
              <path
                d="M 226 198 A 14 14 0 0 1 254 198"
                fill="none"
                stroke={isBridgePosLoop ? '#10b981' : isBridgeNegLoop ? '#10b981' : '#38bdf8'}
                strokeWidth={isBridgePosLoop || isBridgeNegLoop ? '3.5' : '2.5'}
                filter={isBridgePosLoop || isBridgeNegLoop ? 'url(#currentGlow)' : undefined}
              />
              {/* Path after jump: (254, 198) -> (380, 198) -> (380, 180) */}
              <path
                d="M 254 198 L 380 198 L 380 180"
                fill="none"
                stroke={isBridgePosLoop ? '#10b981' : isBridgeNegLoop ? '#10b981' : '#38bdf8'}
                strokeWidth={isBridgePosLoop || isBridgeNegLoop ? '3.5' : '2.5'}
                className={isBridgeNegLoop ? 'flow-fwd' : isBridgePosLoop ? 'flow-rev' : ''}
                filter={isBridgePosLoop || isBridgeNegLoop ? 'url(#currentGlow)' : undefined}
                markerEnd={
                  showCurrentArrows
                    ? isBridgeNegLoop
                      ? 'url(#arrowFwd)'
                      : isBridgePosLoop
                      ? 'url(#arrowRev)'
                      : undefined
                    : undefined
                }
              />
              <circle cx="80" cy="206" r="3.5" fill="#38bdf8" />
              {/* AC Node 2 Terminal Dot at (380, 180) */}
              <circle cx="380" cy="180" r="5" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
              <text x="394" y="174" fill="#38bdf8" fontSize="10" fontWeight="bold">AC 2</text>

              {/* Jumper Bridge Non-contact label */}
              <text x="240" y="214" fill="#64748b" fontSize="8" textAnchor="middle" fontStyle="italic">
                (no contact)
              </text>

              {/* --------------------------------------------------------------------- */}
              {/* 4 BRIDGE ARMS (Leg 1 at x=240, Leg 2 at x=380) */}
              {/* Diodes point UP: Anode at bottom/AC, Cathode at AC/+ rail */}
              {/* --------------------------------------------------------------------- */}

              {/* Switch 1 (Top Left, Leg 1): D1 or T1 */}
              <BridgeArmSwitch
                x={240}
                y={118}
                isConducting={isD1On}
                isSCR={topology !== 'single_phase_full_wave_bridge_uncontrolled'}
                label={topology === 'single_phase_full_wave_bridge_uncontrolled' ? 'D1' : 'T1'}
                isTop={true}
                showArrow={showCurrentArrows}
              />

              {/* Switch 3 (Top Right, Leg 2): D3, T2, or T3 */}
              <BridgeArmSwitch
                x={380}
                y={118}
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
                showArrow={showCurrentArrows}
              />

              {/* Switch 4 (Bottom Left, Leg 1): D4, D2, or T4 */}
              <BridgeArmSwitch
                x={240}
                y={242}
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
                showArrow={showCurrentArrows}
              />

              {/* Switch 2 (Bottom Right, Leg 2): D2, D1, or T2 */}
              <BridgeArmSwitch
                x={380}
                y={242}
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
                showArrow={showCurrentArrows}
              />

              {/* --------------------------------------------------------------------- */}
              {/* POSITIVE DC RAIL (+) */}
              {/* Joins Leg 1 Top (240, 58) & Leg 2 Top (380, 58) -> Load Top (540, 58) */}
              {/* --------------------------------------------------------------------- */}
              <path
                d="M 240 58 L 380 58 L 540 58 L 540 135"
                fill="none"
                stroke={isD1On || isD3On ? '#10b981' : '#475569'}
                strokeWidth={isD1On || isD3On ? '3.5' : '2.5'}
                className={isD1On || isD3On ? 'flow-fwd' : ''}
                filter={isD1On || isD3On ? 'url(#currentGlow)' : undefined}
                markerEnd={showCurrentArrows && (isD1On || isD3On) ? 'url(#arrowFwd)' : undefined}
              />
              <circle cx="240" cy="58" r="4" fill="#38bdf8" />
              <circle cx="380" cy="58" r="4" fill="#38bdf8" />
              <circle cx="540" cy="58" r="4" fill="#38bdf8" />
              <text x="440" y="50" fill="#38bdf8" fontSize="11" fontWeight="bold">
                + DC Bus (Cathodes)
              </text>

              {/* --------------------------------------------------------------------- */}
              {/* NEGATIVE DC RAIL (-) */}
              {/* Returns from Load Bottom (540, 225) -> (540, 302) -> Leg 2 & 1 Bottoms */}
              {/* --------------------------------------------------------------------- */}
              <path
                d="M 540 225 L 540 302 L 380 302 L 240 302"
                fill="none"
                stroke={isD2On || isD4On ? '#10b981' : '#475569'}
                strokeWidth={isD2On || isD4On ? '3.5' : '2.5'}
                className={isD2On || isD4On ? 'flow-fwd' : ''}
                filter={isD2On || isD4On ? 'url(#currentGlow)' : undefined}
                markerEnd={showCurrentArrows && (isD2On || isD4On) ? 'url(#arrowFwd)' : undefined}
              />
              <circle cx="240" cy="302" r="4" fill="#64748b" />
              <circle cx="380" cy="302" r="4" fill="#64748b" />
              <circle cx="540" cy="302" r="4" fill="#64748b" />
              <text x="440" y="318" fill="#64748b" fontSize="11" fontWeight="bold">
                − DC Bus (Anodes / Ground)
              </text>

              {/* Ground Symbol on negative bus */}
              <g transform="translate(450, 302)">
                <line x1="0" y1="0" x2="0" y2="12" stroke="#64748b" strokeWidth="2" />
                <line x1="-10" y1="12" x2="10" y2="12" stroke="#64748b" strokeWidth="2" />
                <line x1="-6" y1="16" x2="6" y2="16" stroke="#64748b" strokeWidth="2" />
                <line x1="-3" y1="20" x2="3" y2="20" stroke="#64748b" strokeWidth="2" />
              </g>

              {/* Optional Freewheeling Diode branch for RL_FWD load in bridge */}
              {loadType === 'RL_FWD' && (
                <g transform="translate(470, 180)">
                  <path
                    d="M 0 122 L 0 14"
                    stroke={isFwdOn ? '#10b981' : '#475569'}
                    strokeWidth={isFwdOn ? '3.5' : '2'}
                    className={isFwdOn ? 'flow-fwd' : ''}
                  />
                  <polygon
                    points="-11,11 11,11 0,-11"
                    fill={isFwdOn ? '#10b981' : '#1e293b'}
                    stroke={isFwdOn ? '#34d399' : '#64748b'}
                    strokeWidth="2"
                  />
                  <line x1="-11" y1="-11" x2="11" y2="-11" stroke={isFwdOn ? '#34d399' : '#64748b'} strokeWidth="2.5" />
                  <path
                    d="M 0 -14 L 0 -122"
                    stroke={isFwdOn ? '#10b981' : '#475569'}
                    strokeWidth={isFwdOn ? '3.5' : '2'}
                    className={isFwdOn ? 'flow-fwd' : ''}
                  />
                  <circle cx="0" cy="-122" r="3.5" fill="#38bdf8" />
                  <circle cx="0" cy="122" r="3.5" fill="#64748b" />
                  <text x="16" y="4" fill={isFwdOn ? '#10b981' : '#94a3b8'} fontSize="10" fontWeight="bold">
                    FWD
                  </text>
                </g>
              )}

              {/* Load Symbol at (540, 180) */}
              <LoadSymbol x={540} y={180} loadType={loadType} params={params} isCurrent={isCurrentActive} />
            </g>
          )}

          {/* ========================================================================= */}
          {/* 3. THREE-PHASE 6-PULSE (UNCONTROLLED OR FULLY CONTROLLED) */}
          {/* ========================================================================= */}
          {(topology === 'three_phase_uncontrolled_bridge' ||
            topology === 'three_phase_controlled_bridge') && (
            <g>
              {/* 3-Phase Sources at x=60 */}
              <g transform="translate(60, 120)">
                <circle cx="0" cy="0" r="16" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
                <text x="0" y="4" fill="#ef4444" fontSize="10" textAnchor="middle" fontWeight="bold">Va</text>
                <text x="-24" y="4" fill="#ef4444" fontSize="10">R</text>
              </g>
              <g transform="translate(60, 180)">
                <circle cx="0" cy="0" r="16" fill="#0f172a" stroke="#eab308" strokeWidth="2" />
                <text x="0" y="4" fill="#eab308" fontSize="10" textAnchor="middle" fontWeight="bold">Vb</text>
                <text x="-24" y="4" fill="#eab308" fontSize="10">Y</text>
              </g>
              <g transform="translate(60, 240)">
                <circle cx="0" cy="0" r="16" fill="#0f172a" stroke="#3b82f6" strokeWidth="2" />
                <text x="0" y="4" fill="#3b82f6" fontSize="10" textAnchor="middle" fontWeight="bold">Vc</text>
                <text x="-24" y="4" fill="#3b82f6" fontSize="10">B</text>
              </g>

              {/* Phase A Line: to Leg 1 AC terminal (190, 180) */}
              <path
                d="M 76 120 L 190 120 L 190 180"
                fill="none"
                stroke={isD1On || isD4On ? '#10b981' : '#ef4444'}
                strokeWidth={isD1On || isD4On ? '3' : '2'}
                className={isD1On ? 'flow-fwd' : isD4On ? 'flow-rev' : ''}
              />
              <circle cx="190" cy="180" r="4" fill="#ef4444" />

              {/* Phase B Line: to Leg 2 AC terminal (280, 180) */}
              <path
                d="M 76 180 L 280 180"
                fill="none"
                stroke={isD3On || isD6On ? '#10b981' : '#eab308'}
                strokeWidth={isD3On || isD6On ? '3' : '2'}
                className={isD3On ? 'flow-fwd' : isD6On ? 'flow-rev' : ''}
              />
              <circle cx="280" cy="180" r="4" fill="#eab308" />

              {/* Phase C Line: to Leg 3 AC terminal (370, 180) */}
              <path
                d="M 76 240 L 370 240 L 370 180"
                fill="none"
                stroke={isD5On || isD2On ? '#10b981' : '#3b82f6'}
                strokeWidth={isD5On || isD2On ? '3' : '2'}
                className={isD5On ? 'flow-fwd' : isD2On ? 'flow-rev' : ''}
              />
              <circle cx="370" cy="180" r="4" fill="#3b82f6" />

              {/* 3 Legs: Top & Bottom Switches */}
              <ThreePhaseSwitch
                x={190}
                y={120}
                label={topology === 'three_phase_controlled_bridge' ? 'T1' : 'D1'}
                isSCR={topology === 'three_phase_controlled_bridge'}
                isOn={isD1On}
                isTop={true}
              />
              <ThreePhaseSwitch
                x={190}
                y={240}
                label={topology === 'three_phase_controlled_bridge' ? 'T4' : 'D4'}
                isSCR={topology === 'three_phase_controlled_bridge'}
                isOn={isD4On}
                isTop={false}
              />

              <ThreePhaseSwitch
                x={280}
                y={120}
                label={topology === 'three_phase_controlled_bridge' ? 'T3' : 'D3'}
                isSCR={topology === 'three_phase_controlled_bridge'}
                isOn={isD3On}
                isTop={true}
              />
              <ThreePhaseSwitch
                x={280}
                y={240}
                label={topology === 'three_phase_controlled_bridge' ? 'T6' : 'D6'}
                isSCR={topology === 'three_phase_controlled_bridge'}
                isOn={isD6On}
                isTop={false}
              />

              <ThreePhaseSwitch
                x={370}
                y={120}
                label={topology === 'three_phase_controlled_bridge' ? 'T5' : 'D5'}
                isSCR={topology === 'three_phase_controlled_bridge'}
                isOn={isD5On}
                isTop={true}
              />
              <ThreePhaseSwitch
                x={370}
                y={240}
                label={topology === 'three_phase_controlled_bridge' ? 'T2' : 'D2'}
                isSCR={topology === 'three_phase_controlled_bridge'}
                isOn={isD2On}
                isTop={false}
              />

              {/* Positive DC Rail */}
              <path
                d="M 190 60 L 370 60 L 540 60 L 540 135"
                fill="none"
                stroke={isD1On || isD3On || isD5On ? '#10b981' : '#475569'}
                strokeWidth={isD1On || isD3On || isD5On ? '3.5' : '2'}
                className={isD1On || isD3On || isD5On ? 'flow-fwd' : ''}
              />
              <circle cx="190" cy="60" r="3.5" fill="#38bdf8" />
              <circle cx="280" cy="60" r="3.5" fill="#38bdf8" />
              <circle cx="370" cy="60" r="3.5" fill="#38bdf8" />
              <circle cx="540" cy="60" r="3.5" fill="#38bdf8" />
              <text x="430" y="52" fill="#38bdf8" fontSize="11" fontWeight="bold">+ Positive DC Bus</text>

              {/* Negative DC Rail */}
              <path
                d="M 540 225 L 540 300 L 370 300 L 190 300"
                fill="none"
                stroke={isD4On || isD6On || isD2On ? '#10b981' : '#475569'}
                strokeWidth={isD4On || isD6On || isD2On ? '3.5' : '2'}
                className={isD4On || isD6On || isD2On ? 'flow-fwd' : ''}
              />
              <circle cx="190" cy="300" r="3.5" fill="#64748b" />
              <circle cx="280" cy="300" r="3.5" fill="#64748b" />
              <circle cx="370" cy="300" r="3.5" fill="#64748b" />
              <circle cx="540" cy="300" r="3.5" fill="#64748b" />
              <text x="430" y="316" fill="#64748b" fontSize="11" fontWeight="bold">− Negative DC Bus</text>

              {/* Load Symbol */}
              <LoadSymbol x={540} y={180} loadType={loadType} params={params} isCurrent={isCurrentActive} />
            </g>
          )}

          {/* ========================================================================= */}
          {/* INTERACTIVE PROBE TEST POINTS */}
          {/* ========================================================================= */}
          <ProbeTerminal
            x={105}
            y={120}
            id="probe_vs"
            name="CH1: Vs"
            color="#eab308"
            isSelected={selectedProbe === 'probe_vs'}
            onClick={() => onSelectProbe('probe_vs')}
          />
          <ProbeTerminal
            x={510}
            y={58}
            id="probe_vo"
            name="CH2: Vo"
            color="#06b6d4"
            isSelected={selectedProbe === 'probe_vo'}
            onClick={() => onSelectProbe('probe_vo')}
          />
          <ProbeTerminal
            x={510}
            y={302}
            id="probe_io"
            name="CH3: Io"
            color="#10b981"
            isSelected={selectedProbe === 'probe_io'}
            onClick={() => onSelectProbe('probe_io')}
          />
        </svg>
      </div>

      {/* Conducting Device Details & Operating State Bar */}
      <div className="pt-2.5 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs gap-2">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Conducting Switches:</span>
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
            <span className="text-slate-500 italic">None conducting (Zero crossing or reverse blocking)</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Electrical Phase: <strong>{(((currentSample?.phase || 0) * 180) / Math.PI).toFixed(0)}°</strong></span>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// HELPER COMPONENTS WITH PRECISE TOUCHING NODES & CLEAR STATUS LABELS
// ============================================================================

const BridgeArmSwitch: React.FC<{
  x: number;
  y: number;
  isConducting: boolean;
  isSCR: boolean;
  label: string;
  isTop: boolean;
  showArrow?: boolean;
}> = ({ x, y, isConducting, isSCR, label, isTop, showArrow }) => {
  // Top arm connects from y=180 (AC node) up to y=58 (+ DC rail)
  // Bottom arm connects from y=302 (- DC rail) up to y=180 (AC node)
  const yStart = isTop ? 180 : 302;
  const yEnd = isTop ? 58 : 180;

  return (
    <g>
      {/* Continuous vertical connecting lead wire */}
      <line
        x1={x}
        y1={yStart}
        x2={x}
        y2={yEnd}
        stroke={isConducting ? '#10b981' : '#475569'}
        strokeWidth={isConducting ? '3.5' : '2'}
        className={isConducting ? 'flow-fwd' : ''}
        filter={isConducting ? 'url(#currentGlow)' : undefined}
      />

      {/* Switch Housing Circle */}
      <circle
        cx={x}
        cy={y}
        r="19"
        fill="#0f172a"
        stroke={isConducting ? '#10b981' : '#475569'}
        strokeWidth={isConducting ? '2.5' : '1.5'}
        filter={isConducting ? 'url(#currentGlow)' : undefined}
      />

      {/* Diode Triangle pointing UPWARDS (Anode to Cathode) */}
      <polygon
        points={`${x - 9},${y + 8} ${x + 9},${y + 8} ${x},${y - 8}`}
        fill={isConducting ? '#10b981' : '#1e293b'}
        stroke={isConducting ? '#34d399' : '#64748b'}
        strokeWidth="2"
      />
      {/* Cathode Bar */}
      <line
        x1={x - 9}
        y1={y - 8}
        x2={x + 9}
        y2={y - 8}
        stroke={isConducting ? '#34d399' : '#64748b'}
        strokeWidth="2.5"
      />

      {/* SCR Gate Terminal for controlled / semi-controlled */}
      {isSCR && (
        <path
          d={`M ${x + 4} ${y + 3} L ${x + 16} ${y + 8}`}
          stroke={isConducting ? '#f59e0b' : '#64748b'}
          strokeWidth="2"
        />
      )}

      {/* Directional current flow indicator arrow inside or beside arm */}
      {showArrow && isConducting && (
        <path
          d={`M ${x} ${y - 14} L ${x} ${y - 20}`}
          stroke="#34d399"
          strokeWidth="2"
          markerEnd="url(#arrowFwd)"
        />
      )}

      {/* Switch Label Badge with clear ON / OFF status */}
      <text
        x={x - 24}
        y={y - 2}
        fill={isConducting ? '#34d399' : '#94a3b8'}
        fontSize="11"
        fontWeight="bold"
        textAnchor="end"
      >
        {label}
      </text>
      <text
        x={x - 24}
        y={y + 10}
        fill={isConducting ? '#10b981' : '#64748b'}
        fontSize="9"
        fontWeight="600"
        textAnchor="end"
      >
        {isConducting ? 'ON' : 'OFF'}
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
  const yStart = isTop ? 180 : 300;
  const yEnd = isTop ? 60 : 180;

  return (
    <g>
      <line
        x1={x}
        y1={yStart}
        x2={x}
        y2={yEnd}
        stroke={isOn ? '#10b981' : '#475569'}
        strokeWidth={isOn ? '3' : '2'}
        className={isOn ? 'flow-fwd' : ''}
      />
      <circle
        cx={x}
        cy={y}
        r="18"
        fill="#0f172a"
        stroke={isOn ? '#10b981' : '#475569'}
        strokeWidth="1.5"
      />
      <polygon
        points={`${x - 8},${y + 8} ${x + 8},${y + 8} ${x},${y - 8}`}
        fill={isOn ? '#10b981' : '#1e293b'}
        stroke={isOn ? '#34d399' : '#64748b'}
        strokeWidth="1.5"
      />
      <line
        x1={x - 8}
        y1={y - 8}
        x2={x + 8}
        y2={y - 8}
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
        x={x + 24}
        y={y + 4}
        fill={isOn ? '#34d399' : '#94a3b8'}
        fontSize="10"
        fontWeight="bold"
      >
        {label} {isOn ? '(ON)' : ''}
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
      {/* Box container for Load: top lead connects to y=-45 (which matches y=135 in canvas) */}
      <rect
        x="-38"
        y="-45"
        width="76"
        height="90"
        fill="#0f172a"
        stroke={isCurrent ? '#10b981' : '#334155'}
        strokeWidth={isCurrent ? '2' : '1.5'}
        rx="6"
        filter={isCurrent ? 'url(#currentGlow)' : undefined}
      />

      {/* Internal connecting lead wires touching box boundary */}
      <line
        x1="0"
        y1="-45"
        x2="0"
        y2="-32"
        stroke={isCurrent ? '#10b981' : '#38bdf8'}
        strokeWidth="2"
      />
      <line
        x1="0"
        y1="32"
        x2="0"
        y2="45"
        stroke={isCurrent ? '#10b981' : '#38bdf8'}
        strokeWidth="2"
      />

      {/* Downward flow arrow through load */}
      {isCurrent && (
        <path
          d="M 24 -15 L 24 15"
          stroke="#10b981"
          strokeWidth="2"
          markerEnd="url(#arrowFwd)"
        />
      )}

      {loadType === 'R' && (
        <g>
          <path
            d="M 0 -32 L 0 -22 L -8 -15 L 8 -5 L -8 5 L 8 15 L 0 22 L 0 32"
            fill="none"
            stroke={isCurrent ? '#10b981' : '#38bdf8'}
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
            stroke={isCurrent ? '#10b981' : '#38bdf8'}
            strokeWidth="2"
          />
          <path
            d="M 0 0 C -10 5, -10 12, 0 14 C -10 18, -10 24, 0 26 L 0 32"
            fill="none"
            stroke={isCurrent ? '#10b981' : '#10b981'}
            strokeWidth="2.5"
          />
          <text x="0" y="58" fill="#38bdf8" fontSize="9" textAnchor="middle" fontWeight="bold">
            R={resistance}Ω, L={inductance}mH
          </text>
        </g>
      )}

      {loadType === 'RC' && (
        <g>
          <path d="M -14 -28 L -14 28" stroke={isCurrent ? '#10b981' : '#38bdf8'} strokeWidth="2" />
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
        LOAD (DC OUT)
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
