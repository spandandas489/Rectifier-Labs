import {
  RectifierParameters,
  SimulationSample,
  RectifierMetrics,
  HarmonicComponent,
  RectifierTopology,
} from '../types/rectifier';

export const TOPOLOGY_LABELS: Record<RectifierTopology, string> = {
  single_phase_half_wave_uncontrolled: '1-Phase Half-Wave Uncontrolled Rectifier (Diode)',
  single_phase_half_wave_controlled: '1-Phase Half-Wave Controlled Rectifier (SCR)',
  single_phase_full_wave_bridge_uncontrolled: '1-Phase Full-Wave Bridge Uncontrolled Rectifier',
  single_phase_full_wave_semi_controlled: '1-Phase Full-Wave Semi-Controlled Bridge Rectifier',
  single_phase_full_wave_bridge_controlled: '1-Phase Full-Wave Controlled Bridge Rectifier (SCR)',
  three_phase_uncontrolled_bridge: '3-Phase 6-Pulse Uncontrolled Bridge Rectifier',
  three_phase_controlled_bridge: '3-Phase 6-Pulse Fully Controlled Bridge Rectifier (SCR)',
};

export const TOPOLOGY_SHORT_NAMES: Record<RectifierTopology, string> = {
  single_phase_half_wave_uncontrolled: '1Φ HW Uncontrolled',
  single_phase_half_wave_controlled: '1Φ HW Controlled (SCR)',
  single_phase_full_wave_bridge_uncontrolled: '1Φ FW Bridge Diode',
  single_phase_full_wave_semi_controlled: '1Φ FW Semi-Controlled',
  single_phase_full_wave_bridge_controlled: '1Φ FW Controlled Bridge',
  three_phase_uncontrolled_bridge: '3Φ 6-Pulse Uncontrolled',
  three_phase_controlled_bridge: '3Φ 6-Pulse Controlled',
};

/**
 * Finds the extinction angle beta for RL load in 1-phase half wave
 */
function findExtinctionAngle(alphaRad: number, phiRad: number): number {
  const tanPhi = Math.tan(phiRad);
  if (tanPhi < 0.0001) return Math.PI; // purely resistive

  const step = 0.005;
  for (let theta = Math.PI; theta < 2 * Math.PI; theta += step) {
    const val =
      Math.sin(theta - phiRad) -
      Math.sin(alphaRad - phiRad) * Math.exp(-(theta - alphaRad) / tanPhi);
    if (val <= 0) {
      return theta;
    }
  }
  return 2 * Math.PI;
}

/**
 * Run dynamic simulation over time span
 */
export function simulateRectifier(
  params: RectifierParameters,
  numCycles = 2,
  samplesPerCycle = 600,
  timeOffset = 0,
  durationSeconds?: number
): { samples: SimulationSample[]; metrics: RectifierMetrics; harmonics: HarmonicComponent[] } {
  const { topology, loadType, voltagePeak: Vm, frequency, firingAngle, resistance: R } = params;
  const L = (params.inductance || 0) * 1e-3; // H
  const C = (params.capacitance || 0) * 1e-6; // F

  const omega = 2 * Math.PI * frequency;
  const T = 1 / frequency;
  const totalDuration = durationSeconds && durationSeconds > 0 ? durationSeconds : numCycles * T;
  const totalSamples = Math.max(600, Math.round(samplesPerCycle * (totalDuration / T)));
  const dt = totalDuration / totalSamples;

  const alphaRad = (firingAngle * Math.PI) / 180;
  const phi = Math.atan2(omega * L, R);
  const Z = Math.sqrt(R * R + (omega * L) * (omega * L));
  const betaRad = findExtinctionAngle(alphaRad, phi);

  const samples: SimulationSample[] = [];

  // State variables for continuous time-domain differential simulation
  // Pre-seed capacitor voltage to steady state to avoid turn-on transient
  let v_cap = 0;
  if (loadType === 'RC') {
    const tau = Math.max(R * C, 1e-5);
    const dischargePeriod = topology.includes('full') || topology.includes('three') ? T / 2 : T;
    v_cap = Vm * Math.exp(-dischargePeriod / tau);
  }

  for (let s = 0; s < totalSamples; s++) {
    const t = timeOffset + s * dt;
    const phaseTotal = (omega * t) % (2 * Math.PI);
    const theta = phaseTotal < 0 ? phaseTotal + 2 * Math.PI : phaseTotal;

    // AC input sources
    const vs = Vm * Math.sin(theta);
    const vsB = Vm * Math.sin(theta - (2 * Math.PI) / 3);
    const vsC = Vm * Math.sin(theta + (2 * Math.PI) / 3);

    let vo = 0;
    let io = 0;
    let is = 0; // source current
    let iDev = 0; // switch current
    let vDev = 0;
    let vGate = 0;
    const activeDevs: string[] = [];

    // Firing gate pulse generator (15-degree window)
    const gateWidth = (14 * Math.PI) / 180;

    switch (topology) {
      // -------------------------------------------------------------
      // 1. SINGLE-PHASE HALF-WAVE UNCONTROLLED (DIODE)
      // -------------------------------------------------------------
      case 'single_phase_half_wave_uncontrolled': {
        if (loadType === 'R') {
          if (theta >= 0 && theta <= Math.PI) {
            vo = vs;
            io = vo / R;
            is = io;
            iDev = io;
            vDev = 0;
            activeDevs.push('D1');
          } else {
            vo = 0;
            io = 0;
            is = 0;
            iDev = 0;
            vDev = vs;
          }
        } else if (loadType === 'RL') {
          const beta = betaRad;
          if (theta >= 0 && theta <= beta) {
            vo = vs;
            const tanPhi = Math.tan(phi);
            const i_anal =
              (Vm / Z) * (Math.sin(theta - phi) + Math.sin(phi) * Math.exp(-theta / tanPhi));
            io = Math.max(0, i_anal);
            is = io;
            iDev = io;
            vDev = 0;
            activeDevs.push('D1');
          } else {
            vo = 0;
            io = 0;
            is = 0;
            iDev = 0;
            vDev = vs;
          }
        } else if (loadType === 'RL_FWD') {
          if (theta >= 0 && theta <= Math.PI) {
            vo = vs;
            const tanPhi = Math.tan(phi);
            const i_anal =
              (Vm / Z) * (Math.sin(theta - phi) + Math.sin(phi) * Math.exp(-theta / tanPhi));
            io = Math.max(0, i_anal);
            is = io;
            iDev = io;
            vDev = 0;
            activeDevs.push('D1');
          } else {
            vo = 0;
            const tanPhi = Math.tan(phi);
            const i_at_pi =
              (Vm / Z) * (Math.sin(Math.PI - phi) + Math.sin(phi) * Math.exp(-Math.PI / tanPhi));
            const i_freewheel = i_at_pi * Math.exp(-(theta - Math.PI) / tanPhi);
            io = Math.max(0, i_freewheel);
            is = 0; // source disconnected during freewheel
            iDev = 0;
            vDev = vs;
            if (io > 0.001) activeDevs.push('FWD');
          }
        } else if (loadType === 'RC') {
          if (vs > v_cap && theta >= 0 && theta <= Math.PI / 2 + 0.1) {
            v_cap = vs;
            vo = vs;
            vDev = 0;
            io = vo / R;
            is = io * 1.5;
            iDev = is;
            activeDevs.push('D1');
          } else {
            const tau = Math.max(R * C, 1e-5);
            v_cap = Math.max(0, v_cap * Math.exp(-dt / tau));
            vo = v_cap;
            io = vo / R;
            is = 0;
            iDev = 0;
            vDev = vs - vo;
          }
        }
        break;
      }

      // -------------------------------------------------------------
      // 2. SINGLE-PHASE HALF-WAVE CONTROLLED (SCR)
      // -------------------------------------------------------------
      case 'single_phase_half_wave_controlled': {
        const isGateActive = theta >= alphaRad && theta <= alphaRad + gateWidth;
        vGate = isGateActive ? 5 : 0;

        if (loadType === 'R') {
          if (theta >= alphaRad && theta <= Math.PI) {
            vo = vs;
            io = vo / R;
            is = io;
            iDev = io;
            vDev = 0;
            activeDevs.push('T1');
          } else {
            vo = 0;
            io = 0;
            is = 0;
            iDev = 0;
            vDev = vs;
          }
        } else if (loadType === 'RL') {
          const beta = Math.max(Math.PI, betaRad);
          if (theta >= alphaRad && theta <= beta) {
            vo = vs;
            const tanPhi = Math.tan(phi);
            const i_anal =
              (Vm / Z) *
              (Math.sin(theta - phi) -
                Math.sin(alphaRad - phi) * Math.exp(-(theta - alphaRad) / tanPhi));
            io = Math.max(0, i_anal);
            is = io;
            iDev = io;
            vDev = 0;
            activeDevs.push('T1');
          } else {
            vo = 0;
            io = 0;
            is = 0;
            iDev = 0;
            vDev = vs;
          }
        } else if (loadType === 'RL_FWD') {
          if (theta >= alphaRad && theta <= Math.PI) {
            vo = vs;
            const tanPhi = Math.tan(phi);
            const i_anal =
              (Vm / Z) *
              (Math.sin(theta - phi) -
                Math.sin(alphaRad - phi) * Math.exp(-(theta - alphaRad) / tanPhi));
            io = Math.max(0, i_anal);
            is = io;
            iDev = io;
            vDev = 0;
            activeDevs.push('T1');
          } else if (theta > Math.PI) {
            vo = 0;
            const tanPhi = Math.tan(phi);
            const i_at_pi =
              (Vm / Z) *
              (Math.sin(Math.PI - phi) -
                Math.sin(alphaRad - phi) * Math.exp(-(Math.PI - alphaRad) / tanPhi));
            const i_freewheel = Math.max(0, i_at_pi) * Math.exp(-(theta - Math.PI) / tanPhi);
            io = Math.max(0, i_freewheel);
            is = 0;
            iDev = 0;
            vDev = vs;
            if (io > 0.001) activeDevs.push('FWD');
          } else {
            vo = 0;
            io = 0;
            is = 0;
            iDev = 0;
            vDev = vs;
          }
        } else if (loadType === 'RC') {
          if (theta >= alphaRad && theta <= Math.PI && vs > v_cap) {
            v_cap = vs;
            vo = vs;
            io = vo / R;
            is = io * 1.5;
            iDev = is;
            vDev = 0;
            activeDevs.push('T1');
          } else {
            const tau = Math.max(R * C, 1e-5);
            v_cap = Math.max(0, v_cap * Math.exp(-dt / tau));
            vo = v_cap;
            io = vo / R;
            is = 0;
            iDev = 0;
            vDev = vs - vo;
          }
        }
        break;
      }

      // -------------------------------------------------------------
      // 3. SINGLE-PHASE FULL-WAVE BRIDGE UNCONTROLLED (DIODES)
      // -------------------------------------------------------------
      case 'single_phase_full_wave_bridge_uncontrolled': {
        const isPosHalf = theta < Math.PI;
        vo = Math.abs(vs);

        if (loadType === 'R') {
          io = vo / R;
          is = isPosHalf ? io : -io;
          iDev = isPosHalf ? io : 0;
          vDev = isPosHalf ? 0 : vs;
          if (isPosHalf) activeDevs.push('D1', 'D2');
          else activeDevs.push('D3', 'D4');
        } else if (loadType === 'RL' || loadType === 'RL_FWD') {
          const idc = (2 * Vm) / (Math.PI * R);
          const i_ripple =
            ((4 * Vm) / (3 * Math.PI * Math.sqrt(R * R + (2 * omega * L) ** 2))) *
            Math.cos(2 * theta);
          io = Math.max(0.02, idc - i_ripple);
          is = isPosHalf ? io : -io;
          iDev = isPosHalf ? io : 0;
          vDev = isPosHalf ? 0 : vs;
          if (isPosHalf) activeDevs.push('D1', 'D2');
          else activeDevs.push('D3', 'D4');
        } else if (loadType === 'RC') {
          const absVs = Math.abs(vs);
          if (absVs >= v_cap) {
            v_cap = absVs;
            vo = absVs;
            io = vo / R;
            is = isPosHalf ? io * 1.8 : -io * 1.8;
            iDev = isPosHalf ? is : 0;
            vDev = 0;
            if (isPosHalf) activeDevs.push('D1', 'D2');
            else activeDevs.push('D3', 'D4');
          } else {
            const tau = Math.max(R * C, 1e-5);
            v_cap = Math.max(0, v_cap * Math.exp(-dt / tau));
            vo = v_cap;
            io = vo / R;
            is = 0;
            iDev = 0;
            vDev = vs - vo;
          }
        }
        break;
      }

      // -------------------------------------------------------------
      // 4. SINGLE-PHASE FULL-WAVE SEMI-CONTROLLED BRIDGE (SEMI-CONVERTER)
      // (2 SCRs: T1, T2 and 2 Diodes: D1, D2 - Inherent Freewheeling!)
      // -------------------------------------------------------------
      case 'single_phase_full_wave_semi_controlled': {
        const isGate1 = theta >= alphaRad && theta <= alphaRad + gateWidth;
        const isGate2 = theta >= Math.PI + alphaRad && theta <= Math.PI + alphaRad + gateWidth;
        vGate = isGate1 || isGate2 ? 5 : 0;

        const inPulse1 = theta >= alphaRad && theta <= Math.PI;
        const inPulse2 = theta >= Math.PI + alphaRad && theta <= 2 * Math.PI;

        if (inPulse1) {
          // T1 and D1 conduct
          vo = vs;
          io = vo / R;
          is = io;
          iDev = io; // T1 current
          vDev = 0;
          activeDevs.push('T1', 'D1');
        } else if (inPulse2) {
          // T2 and D2 conduct
          vo = -vs;
          io = vo / R;
          is = -io;
          iDev = 0;
          vDev = vs;
          activeDevs.push('T2', 'D2');
        } else {
          // Freewheeling interval: [0, alpha] or [pi, pi + alpha]
          vo = 0;
          vDev = vs;
          is = 0; // AC source current is 0 during freewheel!
          iDev = 0;

          if (loadType === 'RL' || loadType === 'RL_FWD') {
            const idc = (Vm * (1 + Math.cos(alphaRad))) / (Math.PI * R);
            io = Math.max(0.02, idc);
            // Diodes and SCRs freewheel
            if (theta < alphaRad) activeDevs.push('T2', 'D1');
            else activeDevs.push('T1', 'D2');
          } else {
            io = 0;
          }
        }
        break;
      }

      // -------------------------------------------------------------
      // 5. SINGLE-PHASE FULL-WAVE FULLY CONTROLLED BRIDGE (4 SCRs)
      // -------------------------------------------------------------
      case 'single_phase_full_wave_bridge_controlled': {
        const isGate1 = theta >= alphaRad && theta <= alphaRad + gateWidth;
        const isGate2 = theta >= Math.PI + alphaRad && theta <= Math.PI + alphaRad + gateWidth;
        vGate = isGate1 || isGate2 ? 5 : 0;

        if (loadType === 'R') {
          if (theta >= alphaRad && theta <= Math.PI) {
            vo = vs;
            io = vo / R;
            is = io;
            iDev = io;
            vDev = 0;
            activeDevs.push('T1', 'T2');
          } else if (theta >= Math.PI + alphaRad && theta <= 2 * Math.PI) {
            vo = -vs;
            io = vo / R;
            is = -io;
            iDev = 0;
            vDev = vs;
            activeDevs.push('T3', 'T4');
          } else {
            vo = 0;
            io = 0;
            is = 0;
            iDev = 0;
            vDev = vs;
          }
        } else if (loadType === 'RL') {
          // Continuous conduction: output voltage swings negative from pi to pi+alpha
          if (theta >= alphaRad && theta < Math.PI + alphaRad) {
            vo = vs;
            is = Math.max(0.02, (2 * Vm * Math.cos(alphaRad)) / (Math.PI * R));
            io = is;
            iDev = is;
            vDev = 0;
            activeDevs.push('T1', 'T2');
          } else {
            vo = -vs;
            io = Math.max(0.02, (2 * Vm * Math.cos(alphaRad)) / (Math.PI * R));
            is = -io;
            iDev = 0;
            vDev = vs;
            activeDevs.push('T3', 'T4');
          }
        } else if (loadType === 'RL_FWD') {
          // FWD prevents negative excursion
          if (theta >= alphaRad && theta <= Math.PI) {
            vo = vs;
            io = vo / R;
            is = io;
            iDev = io;
            activeDevs.push('T1', 'T2');
            vDev = 0;
          } else if (theta >= Math.PI + alphaRad && theta <= 2 * Math.PI) {
            vo = -vs;
            io = vo / R;
            is = -io;
            iDev = 0;
            activeDevs.push('T3', 'T4');
            vDev = vs;
          } else {
            vo = 0;
            io = Math.max(0.05, (Vm * (1 + Math.cos(alphaRad))) / (Math.PI * R));
            is = 0;
            iDev = 0;
            activeDevs.push('FWD');
            vDev = vs;
          }
        } else if (loadType === 'RC') {
          const inFirstPulse = theta >= alphaRad && theta <= Math.PI;
          const inSecondPulse = theta >= Math.PI + alphaRad && theta <= 2 * Math.PI;
          const driveV = inFirstPulse ? vs : inSecondPulse ? -vs : 0;

          if ((inFirstPulse || inSecondPulse) && driveV >= v_cap) {
            v_cap = driveV;
            vo = driveV;
            io = vo / R;
            is = inFirstPulse ? io * 1.5 : -io * 1.5;
            iDev = inFirstPulse ? is : 0;
            vDev = 0;
            if (inFirstPulse) activeDevs.push('T1', 'T2');
            else activeDevs.push('T3', 'T4');
          } else {
            const tau = Math.max(R * C, 1e-5);
            v_cap = Math.max(0, v_cap * Math.exp(-dt / tau));
            vo = v_cap;
            io = vo / R;
            is = 0;
            iDev = 0;
            vDev = vs - vo;
          }
        }
        break;
      }

      // -------------------------------------------------------------
      // 6. THREE-PHASE 6-PULSE UNCONTROLLED BRIDGE (6 DIODES)
      // -------------------------------------------------------------
      case 'three_phase_uncontrolled_bridge': {
        let maxPhase = 'A';
        let minPhase = 'B';
        let vMax = vs;
        let vMin = vsB;

        if (vsB > vMax) {
          vMax = vsB;
          maxPhase = 'B';
        }
        if (vsC > vMax) {
          vMax = vsC;
          maxPhase = 'C';
        }

        if (vs < vMin) {
          vMin = vs;
          minPhase = 'A';
        }
        if (vsC < vMin) {
          vMin = vsC;
          minPhase = 'C';
        }

        const topDiode = maxPhase === 'A' ? 'D1' : maxPhase === 'B' ? 'D3' : 'D5';
        const botDiode = minPhase === 'A' ? 'D4' : minPhase === 'B' ? 'D6' : 'D2';

        activeDevs.push(topDiode, botDiode);

        vo = vMax - vMin; // Line-to-line instantaneous voltage
        io = vo / R;
        is = maxPhase === 'A' ? io : minPhase === 'A' ? -io : 0;
        iDev = topDiode === 'D1' ? io : 0;
        vDev = topDiode === 'D1' ? 0 : vs - vMax;
        break;
      }

      // -------------------------------------------------------------
      // 7. THREE-PHASE 6-PULSE FULLY CONTROLLED BRIDGE (6 SCRs)
      // -------------------------------------------------------------
      case 'three_phase_controlled_bridge': {
        // Natural commutation points occur at 30 deg (pi/6) + k * 60 deg (pi/3)
        // With firing angle alpha:
        // T1 & T6: pi/6 + alpha to pi/2 + alpha   (v_ab)
        // T1 & T2: pi/2 + alpha to 5pi/6 + alpha  (v_ac)
        // T3 & T2: 5pi/6 + alpha to 7pi/6 + alpha (v_bc)
        // T3 & T4: 7pi/6 + alpha to 3pi/2 + alpha (v_ba)
        // T5 & T4: 3pi/2 + alpha to 11pi/6 + alpha (v_ca)
        // T5 & T6: 11pi/6 + alpha to 13pi/6 + alpha (v_cb)

        // Line-to-line voltages:
        const vab = vs - vsB;
        const vac = vs - vsC;
        const vbc = vsB - vsC;
        const vba = vsB - vs;
        const vca = vsC - vs;
        const vcb = vsC - vsB;

        // Shift theta by firing delay
        const refTheta = (theta - alphaRad + 2 * Math.PI) % (2 * Math.PI);

        let vInst = 0;
        let topScr = 'T1';
        let botScr = 'T6';

        // 6 intervals of 60 deg (pi/3) starting from pi/6 (30 deg)
        if (refTheta >= Math.PI / 6 && refTheta < Math.PI / 2) {
          vInst = vab;
          topScr = 'T1';
          botScr = 'T6';
        } else if (refTheta >= Math.PI / 2 && refTheta < (5 * Math.PI) / 6) {
          vInst = vac;
          topScr = 'T1';
          botScr = 'T2';
        } else if (refTheta >= (5 * Math.PI) / 6 && refTheta < (7 * Math.PI) / 6) {
          vInst = vbc;
          topScr = 'T3';
          botScr = 'T2';
        } else if (refTheta >= (7 * Math.PI) / 6 && refTheta < (3 * Math.PI) / 2) {
          vInst = vba;
          topScr = 'T3';
          botScr = 'T4';
        } else if (refTheta >= (3 * Math.PI) / 2 && refTheta < (11 * Math.PI) / 6) {
          vInst = vca;
          topScr = 'T5';
          botScr = 'T4';
        } else {
          vInst = vcb;
          topScr = 'T5';
          botScr = 'T6';
        }

        // Gate pulse active if near firing edges
        const isNearFiring =
          Math.abs(refTheta - Math.PI / 6) < gateWidth ||
          Math.abs(refTheta - Math.PI / 2) < gateWidth ||
          Math.abs(refTheta - (5 * Math.PI) / 6) < gateWidth ||
          Math.abs(refTheta - (7 * Math.PI) / 6) < gateWidth ||
          Math.abs(refTheta - (3 * Math.PI) / 2) < gateWidth ||
          Math.abs(refTheta - (11 * Math.PI) / 6) < gateWidth;
        vGate = isNearFiring ? 5 : 0;

        activeDevs.push(topScr, botScr);

        if (loadType === 'R') {
          // In resistive load, voltage cannot swing negative unless current is forced
          vo = Math.max(0, vInst);
          io = vo / R;
        } else {
          // RL continuous conduction: output follows line voltage (can swing negative for alpha > 90)
          vo = vInst;
          const idc = Math.max(0.05, (3 * Math.sqrt(3) * Vm * Math.cos(alphaRad)) / (Math.PI * R));
          io = idc;
        }

        is = topScr === 'T1' ? io : botScr === 'T4' ? -io : 0;
        iDev = topScr === 'T1' ? io : 0;
        vDev = topScr === 'T1' ? 0 : vs - (topScr === 'T3' ? vsB : vsC);
        break;
      }
    }

    samples.push({
      time: t,
      phase: theta,
      vSource: vs,
      vSourceB: vsB,
      vSourceC: vsC,
      vOutput: vo,
      iOutput: io,
      iSource: is,
      vDevice: vDev,
      iDevice: iDev,
      vGate,
      activeDevices: activeDevs,
    });
  }

  // Calculate Numerical and Analytical Metrics
  const metrics = calculateMetrics(params, samples, samplesPerCycle);
  const harmonics = calculateHarmonics(samples, samplesPerCycle, frequency);

  return { samples, metrics, harmonics };
}

/**
 * Calculates DC, RMS, Ripple Factor, Efficiency, Form Factor
 */
function calculateMetrics(
  params: RectifierParameters,
  samples: SimulationSample[],
  samplesPerCycle: number
): RectifierMetrics {
  const { topology, voltagePeak: Vm } = params;

  const cycleSamples = samples.slice(-samplesPerCycle);
  const N = cycleSamples.length;

  let sumVo = 0;
  let sumVoSq = 0;
  let sumIo = 0;
  let sumIoSq = 0;

  for (let i = 0; i < N; i++) {
    const s = cycleSamples[i];
    sumVo += s.vOutput;
    sumVoSq += s.vOutput * s.vOutput;
    sumIo += s.iOutput;
    sumIoSq += s.iOutput * s.iOutput;
  }

  const vDcAvg = sumVo / N;
  const vRms = Math.sqrt(sumVoSq / N);
  const iDcAvg = sumIo / N;
  const iRms = Math.sqrt(sumIoSq / N);

  const pDc = vDcAvg * iDcAvg;
  const pAc = vRms * iRms;

  const formFactor = Math.abs(vDcAvg) > 0.001 ? vRms / Math.abs(vDcAvg) : 1;
  const rippleFactor =
    Math.abs(vDcAvg) > 0.001 ? Math.sqrt(Math.max(0, formFactor * formFactor - 1)) : 0;
  const efficiency = pAc > 0.001 ? Math.min(100, Math.max(0, (pDc / pAc) * 100)) : 0;

  let rippleFrequency = params.frequency;
  let peakInverseVoltage = Vm;

  switch (topology) {
    case 'single_phase_half_wave_uncontrolled':
    case 'single_phase_half_wave_controlled':
      rippleFrequency = params.frequency;
      peakInverseVoltage = Vm;
      break;
    case 'single_phase_full_wave_bridge_uncontrolled':
    case 'single_phase_full_wave_semi_controlled':
    case 'single_phase_full_wave_bridge_controlled':
      rippleFrequency = 2 * params.frequency;
      peakInverseVoltage = Vm;
      break;
    case 'three_phase_uncontrolled_bridge':
    case 'three_phase_controlled_bridge':
      rippleFrequency = 6 * params.frequency;
      peakInverseVoltage = Math.sqrt(3) * Vm;
      break;
  }

  const acRms = Math.sqrt(Math.max(0, vRms * vRms - vDcAvg * vDcAvg));
  const thdPercent = Math.abs(vDcAvg) > 0.001 ? (acRms / Math.abs(vDcAvg)) : 0;

  return {
    vDcAvg,
    vRms,
    iDcAvg,
    iRms,
    pDc,
    pAc,
    rippleFactor,
    formFactor,
    efficiency,
    rippleFrequency,
    peakInverseVoltage,
    fundamentalRms: acRms,
    thdPercent: thdPercent * 100,
  };
}

/**
 * Helper to calculate exact theoretical Vdc for RC filter load in periodic steady-state
 */
function getRCLoadTheoreticalVdc(
  Vm: number,
  f: number,
  R: number,
  C_uF: number,
  isFullWave: boolean
): number {
  const C = Math.max(C_uF, 1) * 1e-6;
  const tau = Math.max(R * C, 1e-5);
  const period = isFullWave ? 1 / (2 * f) : 1 / f;
  const omega = 2 * Math.PI * f;
  const steps = 300;
  const dt = period / steps;

  // Settle periodic steady-state capacitor voltage
  let v = Vm * Math.exp(-period / tau);
  for (let s = 0; s < steps; s++) {
    const t = s * dt;
    const vs = isFullWave
      ? Math.abs(Vm * Math.sin(omega * t))
      : Math.max(0, Vm * Math.sin(omega * t));
    if (vs >= v) {
      v = vs;
    } else {
      v = v * Math.exp(-dt / tau);
    }
  }

  // Exact numerical average over 1 complete steady-state period
  let sumV = 0;
  for (let s = 0; s < steps; s++) {
    const t = s * dt;
    const vs = isFullWave
      ? Math.abs(Vm * Math.sin(omega * t))
      : Math.max(0, Vm * Math.sin(omega * t));
    if (vs >= v) {
      v = vs;
    } else {
      v = v * Math.exp(-dt / tau);
    }
    sumV += v;
  }

  return sumV / steps;
}

/**
 * Calculates Theoretical Vdc for comparison in observation table and test suites
 */
export function calculateTheoreticalVdc(params: RectifierParameters): number {
  const { topology, loadType, voltagePeak: Vm, frequency, firingAngle, resistance: R, inductance, capacitance } = params;
  const alphaRad = (firingAngle * Math.PI) / 180;
  const omega = 2 * Math.PI * frequency;
  const L = (inductance || 0) * 1e-3;

  // 1. RC Filter Load Across Topologies
  if (loadType === 'RC') {
    const isFullWave =
      topology.includes('full') || topology.includes('three');
    return getRCLoadTheoreticalVdc(Vm, frequency, R, capacitance || 100, isFullWave);
  }

  // 2. Topology Specific Formulations
  switch (topology) {
    case 'single_phase_half_wave_uncontrolled': {
      if (loadType === 'RL') {
        const phi = Math.atan2(omega * L, R);
        const beta = findExtinctionAngle(0, phi);
        return (Vm / (2 * Math.PI)) * (1 - Math.cos(beta));
      }
      return Vm / Math.PI; // ~ 0.3183 * Vm
    }

    case 'single_phase_half_wave_controlled': {
      if (loadType === 'RL') {
        const phi = Math.atan2(omega * L, R);
        const beta = findExtinctionAngle(alphaRad, phi);
        return (Vm / (2 * Math.PI)) * (Math.cos(alphaRad) - Math.cos(beta));
      }
      return (Vm / (2 * Math.PI)) * (1 + Math.cos(alphaRad));
    }

    case 'single_phase_full_wave_bridge_uncontrolled':
      return (2 * Vm) / Math.PI; // ~ 0.6366 * Vm

    case 'single_phase_full_wave_semi_controlled':
      // Semi-converter inherently prevents negative excursions via diodes
      return (Vm / Math.PI) * (1 + Math.cos(alphaRad));

    case 'single_phase_full_wave_bridge_controlled':
      if (loadType === 'RL') {
        return (2 * Vm * Math.cos(alphaRad)) / Math.PI;
      }
      return (Vm / Math.PI) * (1 + Math.cos(alphaRad));

    case 'three_phase_uncontrolled_bridge':
      return (3 * Math.sqrt(3) * Vm) / Math.PI; // ~ 1.654 * Vm

    case 'three_phase_controlled_bridge':
      if (loadType === 'RL') {
        return (3 * Math.sqrt(3) * Vm * Math.cos(alphaRad)) / Math.PI;
      }
      return alphaRad <= Math.PI / 3
        ? (3 * Math.sqrt(3) * Vm * Math.cos(alphaRad)) / Math.PI
        : (3 * Math.sqrt(3) * Vm * (1 + Math.cos(alphaRad + Math.PI / 3))) / Math.PI;

    default:
      return 0;
  }
}

/**
 * Calculates Discrete Fourier Transform for Harmonic Spectrum
 */
function calculateHarmonics(
  samples: SimulationSample[],
  samplesPerCycle: number,
  fundamentalFreq: number
): HarmonicComponent[] {
  const cycleSamples = samples.slice(-samplesPerCycle);
  const N = cycleSamples.length;
  if (N === 0) return [];

  const maxOrder = 12;
  const harmonics: HarmonicComponent[] = [];

  // DC component
  let dcSum = 0;
  for (let i = 0; i < N; i++) {
    dcSum += cycleSamples[i].vOutput;
  }
  const dcVal = dcSum / N;
  harmonics.push({
    order: 0,
    frequency: 0,
    magnitude: Math.abs(dcVal),
    relativePercent: 100,
  });

  const baseMag = Math.max(1, Math.abs(dcVal));

  for (let n = 1; n <= maxOrder; n++) {
    let realSum = 0;
    let imagSum = 0;
    for (let k = 0; k < N; k++) {
      const angle = (2 * Math.PI * n * k) / N;
      realSum += cycleSamples[k].vOutput * Math.cos(angle);
      imagSum -= cycleSamples[k].vOutput * Math.sin(angle);
    }
    const mag = (2 * Math.sqrt(realSum * realSum + imagSum * imagSum)) / N;
    harmonics.push({
      order: n,
      frequency: n * fundamentalFreq,
      magnitude: mag,
      relativePercent: Math.min(100, (mag / baseMag) * 100),
    });
  }

  return harmonics;
}
