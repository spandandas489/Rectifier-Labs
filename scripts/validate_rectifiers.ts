import { simulateRectifier, calculateTheoreticalVdc, TOPOLOGY_LABELS } from '../src/physics/rectifierEngine.ts';
import { RectifierParameters } from '../src/types/rectifier.ts';

interface TestCase {
  name: string;
  params: RectifierParameters;
  expectedRippleFreq: number;
  expectedMaxErrorPct: number;
}

const testCases: TestCase[] = [
  // =========================================================================
  // 1. SINGLE-PHASE HALF-WAVE UNCONTROLLED
  // =========================================================================
  {
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
    expectedMaxErrorPct: 5.0,
  },

  // =========================================================================
  // 2. SINGLE-PHASE HALF-WAVE CONTROLLED (SCR)
  // =========================================================================
  {
    name: '1Φ HW SCR - α=0° (100Vpk, 50Ω)',
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
    expectedMaxErrorPct: 2.5,
  },
  {
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
    expectedMaxErrorPct: 3.5,
  },
  {
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
    expectedMaxErrorPct: 3.0,
  },

  // =========================================================================
  // 3. SINGLE-PHASE FULL-WAVE BRIDGE UNCONTROLLED (DIODES)
  // =========================================================================
  {
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
    name: '1Φ FW Diode Bridge - 230Vrms / 325Vpk Mains (50Ω)',
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
    expectedMaxErrorPct: 4.0,
  },
  {
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
    expectedMaxErrorPct: 3.5,
  },
  {
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
    expectedMaxErrorPct: 3.0,
  },

  // =========================================================================
  // 4. SINGLE-PHASE FULL-WAVE SEMI-CONTROLLED (SEMI-CONVERTER)
  // =========================================================================
  {
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
    expectedMaxErrorPct: 3.0,
  },

  // =========================================================================
  // 5. SINGLE-PHASE FULL-WAVE CONTROLLED BRIDGE (4 SCRs)
  // =========================================================================
  {
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
    expectedMaxErrorPct: 2.5,
  },
  {
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
    expectedMaxErrorPct: 2.5,
  },
  {
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
    expectedMaxErrorPct: 2.0,
  },
  {
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
    expectedMaxErrorPct: 2.0,
  },

  // =========================================================================
  // 7. THREE-PHASE 6-PULSE CONTROLLED BRIDGE (6 SCRs)
  // =========================================================================
  {
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
    expectedMaxErrorPct: 2.0,
  },
  {
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
    expectedMaxErrorPct: 2.5,
  },
  {
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
    expectedMaxErrorPct: 3.0,
  },
  {
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
    expectedMaxErrorPct: 3.0,
  },
];

console.log('===================================================================================');
console.log(`RECTIFIER SIMULATION ENGINE - EXTENSIVE ${testCases.length}-CASE VALIDATION SUITE`);
console.log('===================================================================================\n');

let passedCount = 0;
const totalCount = testCases.length;

testCases.forEach((tc, idx) => {
  const result = simulateRectifier(tc.params, 2, 600, 0);
  const metrics = result.metrics;
  const vDcMeas = metrics.vDcAvg;
  const theoVdc = calculateTheoreticalVdc(tc.params);

  const errorPct =
    Math.abs(theoVdc) > 0.1 ? (Math.abs(vDcMeas - theoVdc) / Math.abs(theoVdc)) * 100 : 0;

  const hasSamples = result.samples.length > 500;
  const vRmsValid = metrics.vRms >= Math.abs(metrics.vDcAvg) - 0.5;
  const formFactorValid = metrics.formFactor >= 0.95;
  const rippleFreqMatch = metrics.rippleFrequency === tc.expectedRippleFreq;
  const errorAcceptable = errorPct <= tc.expectedMaxErrorPct;

  const passed =
    hasSamples && vRmsValid && formFactorValid && rippleFreqMatch && errorAcceptable;

  if (passed) passedCount++;

  console.log(`[TEST ${(idx + 1).toString().padStart(2, '0')}/${totalCount}] ${tc.name}`);
  console.log(`  - Theoretical Vdc: ${theoVdc.toFixed(2)} V | Simulated Vdc: ${vDcMeas.toFixed(2)} V (Error: ±${errorPct.toFixed(2)}%)`);
  console.log(`  - Vrms: ${metrics.vRms.toFixed(2)} V | Form Factor: ${metrics.formFactor.toFixed(3)} | Ripple Factor: ${metrics.rippleFactor.toFixed(3)} | f_ripple: ${metrics.rippleFrequency}Hz`);
  console.log(`  - Status: ${passed ? 'PASS ✓' : `FAIL ✗ (Threshold: ${tc.expectedMaxErrorPct}%)`}\n`);
});

console.log('===================================================================================');
console.log(`FINAL RESULT: ${passedCount} / ${totalCount} TEST CASES PASSED (${((passedCount / totalCount) * 100).toFixed(1)}%)`);
console.log('===================================================================================');
