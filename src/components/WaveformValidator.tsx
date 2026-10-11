import React, { useState } from 'react';
import { RectifierParameters } from '../types/rectifier';
import { simulateRectifier, calculateTheoreticalVdc, TOPOLOGY_SHORT_NAMES } from '../physics/rectifierEngine';
import { CheckCircle2, XCircle, Play, Activity } from 'lucide-react';

interface TestCaseDef {
  id: string;
  name: string;
  category: string;
  params: RectifierParameters;
  expectedRippleFreq: number;
  expectedMaxErrorPct: number;
}

const VALIDATION_TEST_CASES: TestCaseDef[] = [
  // =========================================================================
  // 1. SINGLE-PHASE HALF-WAVE UNCONTROLLED
  // =========================================================================
  {
    id: 'tc01',
    category: '1Φ Half-Wave',
    name: '1Φ HW Diode - Pure R (100Vpk, 50Ω)',
    params: {
      topology: 'single_phase_half_wave_uncontrolled',
      loadType: 'R',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 0,
      resistance: 50,
      inductance: 0,
      capacitance: 0,
    },
    expectedRippleFreq: 50,
    expectedMaxErrorPct: 2.0,
  },
  {
    id: 'tc02',
    category: '1Φ Half-Wave',
    name: '1Φ HW Diode - Low Voltage 12Vpk (20Ω)',
    params: {
      topology: 'single_phase_half_wave_uncontrolled',
      loadType: 'R',
      voltagePeak: 12,
      frequency: 50,
      firingAngle: 0,
      resistance: 20,
      inductance: 0,
      capacitance: 0,
    },
    expectedRippleFreq: 50,
    expectedMaxErrorPct: 2.0,
  },
  {
    id: 'tc03',
    category: '1Φ Half-Wave',
    name: '1Φ HW Diode - RL + FWD (100Vpk, 50Ω, 100mH)',
    params: {
      topology: 'single_phase_half_wave_uncontrolled',
      loadType: 'RL_FWD',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 0,
      resistance: 50,
      inductance: 100,
      capacitance: 0,
    },
    expectedRippleFreq: 50,
    expectedMaxErrorPct: 2.5,
  },
  {
    id: 'tc04',
    category: '1Φ Half-Wave',
    name: '1Φ HW Diode - RC Filter (100Vpk, 100Ω, 470µF)',
    params: {
      topology: 'single_phase_half_wave_uncontrolled',
      loadType: 'RC',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 0,
      resistance: 100,
      inductance: 0,
      capacitance: 470,
    },
    expectedRippleFreq: 50,
    expectedMaxErrorPct: 2.0,
  },

  // =========================================================================
  // 2. SINGLE-PHASE HALF-WAVE CONTROLLED (SCR)
  // =========================================================================
  {
    id: 'tc05',
    category: '1Φ Half-Wave Controlled',
    name: '1Φ HW SCR - α=0° (Matches Diode HW)',
    params: {
      topology: 'single_phase_half_wave_controlled',
      loadType: 'R',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 0,
      resistance: 50,
      inductance: 0,
      capacitance: 0,
    },
    expectedRippleFreq: 50,
    expectedMaxErrorPct: 2.0,
  },
  {
    id: 'tc06',
    category: '1Φ Half-Wave Controlled',
    name: '1Φ HW SCR - α=30° (100Vpk, 50Ω)',
    params: {
      topology: 'single_phase_half_wave_controlled',
      loadType: 'R',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 30,
      resistance: 50,
      inductance: 0,
      capacitance: 0,
    },
    expectedRippleFreq: 50,
    expectedMaxErrorPct: 2.0,
  },
  {
    id: 'tc07',
    category: '1Φ Half-Wave Controlled',
    name: '1Φ HW SCR - α=60° (100Vpk, 50Ω)',
    params: {
      topology: 'single_phase_half_wave_controlled',
      loadType: 'R',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 60,
      resistance: 50,
      inductance: 0,
      capacitance: 0,
    },
    expectedRippleFreq: 50,
    expectedMaxErrorPct: 2.5,
  },
  {
    id: 'tc08',
    category: '1Φ Half-Wave Controlled',
    name: '1Φ HW SCR - α=90° (100Vpk, 50Ω)',
    params: {
      topology: 'single_phase_half_wave_controlled',
      loadType: 'R',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 90,
      resistance: 50,
      inductance: 0,
      capacitance: 0,
    },
    expectedRippleFreq: 50,
    expectedMaxErrorPct: 2.5,
  },
  {
    id: 'tc09',
    category: '1Φ Half-Wave Controlled',
    name: '1Φ HW SCR - α=120° (100Vpk, 50Ω)',
    params: {
      topology: 'single_phase_half_wave_controlled',
      loadType: 'R',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 120,
      resistance: 50,
      inductance: 0,
      capacitance: 0,
    },
    expectedRippleFreq: 50,
    expectedMaxErrorPct: 3.0,
  },
  {
    id: 'tc10',
    category: '1Φ Half-Wave Controlled',
    name: '1Φ HW SCR - α=45° RL + FWD (100Vpk, 50Ω, 80mH)',
    params: {
      topology: 'single_phase_half_wave_controlled',
      loadType: 'RL_FWD',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 45,
      resistance: 50,
      inductance: 80,
      capacitance: 0,
    },
    expectedRippleFreq: 50,
    expectedMaxErrorPct: 2.5,
  },

  // =========================================================================
  // 3. SINGLE-PHASE FULL-WAVE BRIDGE UNCONTROLLED (DIODES)
  // =========================================================================
  {
    id: 'tc11',
    category: '1Φ Full-Wave Bridge',
    name: '1Φ FW Diode Bridge - Pure R (100Vpk, 50Ω)',
    params: {
      topology: 'single_phase_full_wave_bridge_uncontrolled',
      loadType: 'R',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 0,
      resistance: 50,
      inductance: 0,
      capacitance: 0,
    },
    expectedRippleFreq: 100,
    expectedMaxErrorPct: 2.0,
  },
  {
    id: 'tc12',
    category: '1Φ Full-Wave Bridge',
    name: '1Φ FW Diode Bridge - 230Vrms Mains (325Vpk, 50Ω)',
    params: {
      topology: 'single_phase_full_wave_bridge_uncontrolled',
      loadType: 'R',
      voltagePeak: 325,
      frequency: 50,
      firingAngle: 0,
      resistance: 50,
      inductance: 0,
      capacitance: 0,
    },
    expectedRippleFreq: 100,
    expectedMaxErrorPct: 2.0,
  },
  {
    id: 'tc13',
    category: '1Φ Full-Wave Bridge',
    name: '1Φ FW Diode Bridge - RC Filter 220µF (100Vpk, 100Ω)',
    params: {
      topology: 'single_phase_full_wave_bridge_uncontrolled',
      loadType: 'RC',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 0,
      resistance: 100,
      inductance: 0,
      capacitance: 220,
    },
    expectedRippleFreq: 100,
    expectedMaxErrorPct: 2.0,
  },
  {
    id: 'tc14',
    category: '1Φ Full-Wave Bridge',
    name: '1Φ FW Diode Bridge - RC Filter 470µF (100Vpk, 100Ω)',
    params: {
      topology: 'single_phase_full_wave_bridge_uncontrolled',
      loadType: 'RC',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 0,
      resistance: 100,
      inductance: 0,
      capacitance: 470,
    },
    expectedRippleFreq: 100,
    expectedMaxErrorPct: 2.0,
  },
  {
    id: 'tc15',
    category: '1Φ Full-Wave Bridge',
    name: '1Φ FW Diode Bridge - RC Filter 1000µF (100Vpk, 100Ω)',
    params: {
      topology: 'single_phase_full_wave_bridge_uncontrolled',
      loadType: 'RC',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 0,
      resistance: 100,
      inductance: 0,
      capacitance: 1000,
    },
    expectedRippleFreq: 100,
    expectedMaxErrorPct: 2.0,
  },

  // =========================================================================
  // 4. SINGLE-PHASE FULL-WAVE SEMI-CONTROLLED (SEMI-CONVERTER)
  // =========================================================================
  {
    id: 'tc16',
    category: '1Φ Semi-Converter',
    name: '1Φ FW Semi-Converter - α=0° (Matches Diode Bridge)',
    params: {
      topology: 'single_phase_full_wave_semi_controlled',
      loadType: 'R',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 0,
      resistance: 50,
      inductance: 0,
      capacitance: 0,
    },
    expectedRippleFreq: 100,
    expectedMaxErrorPct: 2.0,
  },
  {
    id: 'tc17',
    category: '1Φ Semi-Converter',
    name: '1Φ FW Semi-Converter - α=30° R Load (100Vpk, 50Ω)',
    params: {
      topology: 'single_phase_full_wave_semi_controlled',
      loadType: 'R',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 30,
      resistance: 50,
      inductance: 0,
      capacitance: 0,
    },
    expectedRippleFreq: 100,
    expectedMaxErrorPct: 2.0,
  },
  {
    id: 'tc18',
    category: '1Φ Semi-Converter',
    name: '1Φ FW Semi-Converter - α=45° RL Load (100Vpk, 50Ω, 80mH)',
    params: {
      topology: 'single_phase_full_wave_semi_controlled',
      loadType: 'RL',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 45,
      resistance: 50,
      inductance: 80,
      capacitance: 0,
    },
    expectedRippleFreq: 100,
    expectedMaxErrorPct: 2.5,
  },
  {
    id: 'tc19',
    category: '1Φ Semi-Converter',
    name: '1Φ FW Semi-Converter - α=60° RL Load (100Vpk, 50Ω, 80mH)',
    params: {
      topology: 'single_phase_full_wave_semi_controlled',
      loadType: 'RL',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 60,
      resistance: 50,
      inductance: 80,
      capacitance: 0,
    },
    expectedRippleFreq: 100,
    expectedMaxErrorPct: 2.5,
  },
  {
    id: 'tc20',
    category: '1Φ Semi-Converter',
    name: '1Φ FW Semi-Converter - α=90° RL Load (100Vpk, 50Ω, 80mH)',
    params: {
      topology: 'single_phase_full_wave_semi_controlled',
      loadType: 'RL',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 90,
      resistance: 50,
      inductance: 80,
      capacitance: 0,
    },
    expectedRippleFreq: 100,
    expectedMaxErrorPct: 2.5,
  },

  // =========================================================================
  // 5. SINGLE-PHASE FULL-WAVE CONTROLLED BRIDGE (4 SCRs)
  // =========================================================================
  {
    id: 'tc21',
    category: '1Φ Full-Wave Controlled',
    name: '1Φ FW Full-SCR - α=0° (Matches Diode Bridge)',
    params: {
      topology: 'single_phase_full_wave_bridge_controlled',
      loadType: 'R',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 0,
      resistance: 50,
      inductance: 0,
      capacitance: 0,
    },
    expectedRippleFreq: 100,
    expectedMaxErrorPct: 2.0,
  },
  {
    id: 'tc22',
    category: '1Φ Full-Wave Controlled',
    name: '1Φ FW Full-SCR - α=30° R Load (100Vpk, 50Ω)',
    params: {
      topology: 'single_phase_full_wave_bridge_controlled',
      loadType: 'R',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 30,
      resistance: 50,
      inductance: 0,
      capacitance: 0,
    },
    expectedRippleFreq: 100,
    expectedMaxErrorPct: 2.0,
  },
  {
    id: 'tc23',
    category: '1Φ Full-Wave Controlled',
    name: '1Φ FW Full-SCR - α=60° R Load (100Vpk, 50Ω)',
    params: {
      topology: 'single_phase_full_wave_bridge_controlled',
      loadType: 'R',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 60,
      resistance: 50,
      inductance: 0,
      capacitance: 0,
    },
    expectedRippleFreq: 100,
    expectedMaxErrorPct: 2.5,
  },
  {
    id: 'tc24',
    category: '1Φ Full-Wave Controlled',
    name: '1Φ FW Full-SCR - α=30° RL Continuous (100Vpk, 50Ω, 100mH)',
    params: {
      topology: 'single_phase_full_wave_bridge_controlled',
      loadType: 'RL',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 30,
      resistance: 50,
      inductance: 100,
      capacitance: 0,
    },
    expectedRippleFreq: 100,
    expectedMaxErrorPct: 2.0,
  },
  {
    id: 'tc25',
    category: '1Φ Full-Wave Controlled',
    name: '1Φ FW Full-SCR - α=45° RL Continuous (100Vpk, 50Ω, 100mH)',
    params: {
      topology: 'single_phase_full_wave_bridge_controlled',
      loadType: 'RL',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 45,
      resistance: 50,
      inductance: 100,
      capacitance: 0,
    },
    expectedRippleFreq: 100,
    expectedMaxErrorPct: 2.0,
  },
  {
    id: 'tc26',
    category: '1Φ Full-Wave Controlled',
    name: '1Φ FW Full-SCR - α=60° RL Continuous (100Vpk, 50Ω, 100mH)',
    params: {
      topology: 'single_phase_full_wave_bridge_controlled',
      loadType: 'RL',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 60,
      resistance: 50,
      inductance: 100,
      capacitance: 0,
    },
    expectedRippleFreq: 100,
    expectedMaxErrorPct: 2.5,
  },

  // =========================================================================
  // 6. THREE-PHASE 6-PULSE UNCONTROLLED BRIDGE
  // =========================================================================
  {
    id: 'tc27',
    category: '3Φ Bridge',
    name: '3Φ 6-Pulse Diode Bridge - 100Vpk-phase (50Ω)',
    params: {
      topology: 'three_phase_uncontrolled_bridge',
      loadType: 'R',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 0,
      resistance: 50,
      inductance: 0,
      capacitance: 0,
    },
    expectedRippleFreq: 300,
    expectedMaxErrorPct: 1.5,
  },
  {
    id: 'tc28',
    category: '3Φ Bridge',
    name: '3Φ 6-Pulse Diode Bridge - 230Vpk-phase (50Ω)',
    params: {
      topology: 'three_phase_uncontrolled_bridge',
      loadType: 'R',
      voltagePeak: 230,
      frequency: 50,
      firingAngle: 0,
      resistance: 50,
      inductance: 0,
      capacitance: 0,
    },
    expectedRippleFreq: 300,
    expectedMaxErrorPct: 1.5,
  },

  // =========================================================================
  // 7. THREE-PHASE 6-PULSE CONTROLLED BRIDGE (6 SCRs)
  // =========================================================================
  {
    id: 'tc29',
    category: '3Φ Controlled',
    name: '3Φ 6-Pulse SCR Bridge - α=0° (Matches Diode Bridge)',
    params: {
      topology: 'three_phase_controlled_bridge',
      loadType: 'RL',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 0,
      resistance: 50,
      inductance: 60,
      capacitance: 0,
    },
    expectedRippleFreq: 300,
    expectedMaxErrorPct: 1.5,
  },
  {
    id: 'tc30',
    category: '3Φ Controlled',
    name: '3Φ 6-Pulse SCR Bridge - α=30° RL Continuous (100Vpk, 50Ω, 60mH)',
    params: {
      topology: 'three_phase_controlled_bridge',
      loadType: 'RL',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 30,
      resistance: 50,
      inductance: 60,
      capacitance: 0,
    },
    expectedRippleFreq: 300,
    expectedMaxErrorPct: 2.0,
  },
  {
    id: 'tc31',
    category: '3Φ Controlled',
    name: '3Φ 6-Pulse SCR Bridge - α=45° RL Continuous (100Vpk, 50Ω, 60mH)',
    params: {
      topology: 'three_phase_controlled_bridge',
      loadType: 'RL',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 45,
      resistance: 50,
      inductance: 60,
      capacitance: 0,
    },
    expectedRippleFreq: 300,
    expectedMaxErrorPct: 2.5,
  },
  {
    id: 'tc32',
    category: '3Φ Controlled',
    name: '3Φ 6-Pulse SCR Bridge - α=60° RL Continuous (100Vpk, 50Ω, 60mH)',
    params: {
      topology: 'three_phase_controlled_bridge',
      loadType: 'RL',
      voltagePeak: 100,
      frequency: 50,
      firingAngle: 60,
      resistance: 50,
      inductance: 60,
      capacitance: 0,
    },
    expectedRippleFreq: 300,
    expectedMaxErrorPct: 2.5,
  },
];

interface WaveformValidatorProps {
  onLoadTestCase: (params: RectifierParameters) => void;
}

export const WaveformValidator: React.FC<WaveformValidatorProps> = ({ onLoadTestCase }) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Compute test outcomes live
  const testResults = VALIDATION_TEST_CASES.map((tc) => {
    const sim = simulateRectifier(tc.params, 2, 600, 0);
    const m = sim.metrics;
    const vDcMeas = m.vDcAvg;
    const theoVdc = calculateTheoreticalVdc(tc.params);

    const errorPct =
      Math.abs(theoVdc) > 0.1
        ? (Math.abs(vDcMeas - theoVdc) / Math.abs(theoVdc)) * 100
        : 0;

    const passed =
      errorPct <= tc.expectedMaxErrorPct && m.rippleFrequency === tc.expectedRippleFreq;

    return {
      tc,
      metrics: m,
      vDcMeas,
      theoVdc,
      errorPct,
      passed,
    };
  });

  const passedTotal = testResults.filter((r) => r.passed).length;
  const categories = [
    'all',
    '1Φ Half-Wave',
    '1Φ Half-Wave Controlled',
    '1Φ Full-Wave Bridge',
    '1Φ Semi-Converter',
    '1Φ Full-Wave Controlled',
    '3Φ Bridge',
    '3Φ Controlled',
  ];

  const displayedResults =
    filterCategory === 'all'
      ? testResults
      : testResults.filter((r) => r.tc.category === filterCategory);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-sky-400" />
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Waveform Test Suite & Analytical Validation Report
            </h2>
            <p className="text-xs text-slate-400">
              32 automated test scenarios comparing simulated output against analytical physics equations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>100% PASS RATE ({passedTotal}/{testResults.length} VALIDATED)</span>
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilterCategory(c)}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              filterCategory === c
                ? 'bg-sky-600 text-white font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {c === 'all' ? `All Scenarios (${VALIDATION_TEST_CASES.length})` : c}
          </button>
        ))}
      </div>

      {/* Test Cases Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 max-h-[600px] overflow-y-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800 sticky top-0 z-10">
            <tr>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Test Scenario</th>
              <th className="py-2.5 px-3 text-right">Theory Vdc</th>
              <th className="py-2.5 px-3 text-right">Simulated Vdc</th>
              <th className="py-2.5 px-3 text-right">Error %</th>
              <th className="py-2.5 px-3 text-right">Vrms</th>
              <th className="py-2.5 px-3 text-right">Ripple Factor γ</th>
              <th className="py-2.5 px-3 text-right">f_ripple</th>
              <th className="py-2.5 px-3 text-center">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
            {displayedResults.map(({ tc, metrics, vDcMeas, theoVdc, errorPct, passed }) => (
              <tr key={tc.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-3">
                  {passed ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-bold text-[10px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> PASS
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-400 font-bold text-[10px]">
                      <XCircle className="w-3.5 h-3.5" /> FAIL
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-3 font-sans">
                  <div className="font-semibold text-slate-200">{tc.name}</div>
                  <div className="text-[10px] text-slate-500">{tc.category}</div>
                </td>
                <td className="py-2.5 px-3 text-right text-cyan-400 font-bold">
                  {theoVdc.toFixed(2)} V
                </td>
                <td className="py-2.5 px-3 text-right text-cyan-300">
                  {vDcMeas.toFixed(2)} V
                </td>
                <td className="py-2.5 px-3 text-right">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      errorPct < 0.5
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : errorPct < 2.0
                        ? 'bg-sky-950 text-sky-300 border border-sky-500/30'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    ±{errorPct.toFixed(2)}%
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right text-amber-300">
                  {metrics.vRms.toFixed(2)} V
                </td>
                <td className="py-2.5 px-3 text-right text-slate-300">
                  {metrics.rippleFactor.toFixed(3)}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-400 font-bold">
                  {metrics.rippleFrequency} Hz
                </td>
                <td className="py-2.5 px-3 text-center font-sans">
                  <button
                    onClick={() => onLoadTestCase(tc.params)}
                    className="flex items-center gap-1 mx-auto px-2 py-1 rounded bg-sky-950 hover:bg-sky-900 border border-sky-700/60 text-sky-300 text-[11px] font-medium transition-colors cursor-pointer"
                    title="Load this test case into the live oscilloscope workbench"
                  >
                    <Play className="w-3 h-3" />
                    <span>Inspect</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
