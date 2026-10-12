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
 * Finds the extinction angle beta for RL load in 1-phase half wave.
 * For uncontrolled rectifiers, alphaRad must be 0 regardless of UI controls.
 */
export function findExtinctionAngle(alphaRad: number, phiRad: number): number {
  const tanPhi = Math.tan(phiRad);
  if (tanPhi < 0.0001) return Math.PI; // purely resistive

  const step = 0.001;
  const startAngle = Math.max(Math.PI, alphaRad);
  for (let theta = startAngle; theta <= 2 * Math.PI; theta += step) {
    const val =
      Math.sin(theta - phiRad) -
      Math.sin(alphaRad - phiRad) * Math.exp(-(theta - alphaRad) / tanPhi);
    if (val <= 0) {
      return theta;
    }
  }
  return 2 * Math.PI;
}

interface InternalCycleSample {
  theta: number;
  vSource: number;
  vSourceB: number;
  vSourceC: number;
  vOutput: number;
  iOutput: number;
  iSource: number;
  vDevice: number;
  iDevice: number;
  vGate: number;
  activeDevices: string[];
}

/**
 * Solves the periodic steady-state cycle for the given rectifier parameters
 * using numerically exact differential equation integration (2400 steps/cycle).
 */
function solvePeriodicSteadyStateCycle(
  params: RectifierParameters,
  stepsPerCycle: number = 2400
): InternalCycleSample[] {
  const { topology, loadType, voltagePeak: Vm, frequency, firingAngle, resistance: R } = params;
  const L = (params.inductance || 0) * 1e-3;
  const C = (params.capacitance || 0) * 1e-6;
  const T = 1 / frequency;
  const dt = T / stepsPerCycle;
  const alphaRad = (firingAngle * Math.PI) / 180;
  const gateWidth = (12 * Math.PI) / 180;

  // Realistic source resistance for finite charging currents
  const Rs = Math.max(0.02 * R, 0.1);

  // Phase voltage generators
  const getVs = (th: number) => Vm * Math.sin(th);
  const get3Phase = (th: number) => {
    const va = Vm * Math.sin(th);
    const vb = Vm * Math.sin(th - (2 * Math.PI) / 3);
    const vc = Vm * Math.sin(th + (2 * Math.PI) / 3);
    return { va, vb, vc };
  };

  // State variables
  let iL = 0;
  let vC = 0;

  // Pre-seed initial guesses to speed up periodic settling
  if (loadType === 'RC') {
    vC = Vm * 0.85;
  } else if (loadType === 'RL' || loadType === 'RL_FWD') {
    if (topology.includes('three')) {
      iL = (1.654 * Vm * Math.cos(alphaRad > Math.PI / 2 ? 0 : alphaRad)) / Math.max(R, 0.5);
    } else if (topology.includes('full')) {
      iL = (0.6366 * Vm * Math.cos(alphaRad > Math.PI / 2 ? 0 : alphaRad)) / Math.max(R, 0.5);
    }
  }

  const settlingCycles = loadType === 'RC' || loadType === 'RL' || loadType === 'RL_FWD' ? 10 : 2;

  // One time-step differential integration
  const stepCircuit = (
    currentIL: number,
    currentVC: number,
    theta: number
  ): {
    nextIL: number;
    nextVC: number;
    sample: InternalCycleSample;
  } => {
    const vs = getVs(theta);
    const { va, vb, vc } = get3Phase(theta);

    let vo = 0;
    let io = 0;
    let is = 0;
    let iDev = 0;
    let vDev = 0;
    let vGate = 0;
    const activeDevs: string[] = [];

    let nextIL = currentIL;
    let nextVC = currentVC;

    switch (topology) {
      // -------------------------------------------------------------------
      // 1. SINGLE-PHASE HALF-WAVE UNCONTROLLED (DIODE)
      // -------------------------------------------------------------------
      case 'single_phase_half_wave_uncontrolled': {
        if (loadType === 'R') {
          if (theta >= 0 && theta < Math.PI) {
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
          // Without FWD: Diode conducts whenever vs > 0 OR currentIL > 0
          if (theta >= 0 && theta < Math.PI) {
            vo = vs;
            const di_dt = (vo - R * currentIL) / L;
            nextIL = Math.max(0, currentIL + di_dt * dt);
            io = currentIL;
            is = io;
            iDev = io;
            vDev = 0;
            activeDevs.push('D1');
          } else {
            // Negative half-cycle: diode stays on until current extinguishes (extinction beta)
            if (currentIL > 1e-6) {
              vo = vs; // Output follows negative source voltage!
              const di_dt = (vo - R * currentIL) / L;
              nextIL = Math.max(0, currentIL + di_dt * dt);
              io = currentIL;
              is = io;
              iDev = io;
              vDev = 0;
              activeDevs.push('D1');
            } else {
              nextIL = 0;
              vo = 0;
              io = 0;
              is = 0;
              iDev = 0;
              vDev = vs;
            }
          }
        } else if (loadType === 'RL_FWD') {
          // With FWD: FWD clamps output voltage to 0 at pi
          if (theta >= 0 && theta < Math.PI) {
            vo = vs;
            const di_dt = (vo - R * currentIL) / L;
            nextIL = Math.max(0, currentIL + di_dt * dt);
            io = currentIL;
            is = io;
            iDev = io;
            vDev = 0;
            activeDevs.push('D1');
          } else {
            // Freewheeling interval: source current is 0, FWD carries load current
            if (currentIL > 1e-6) {
              vo = 0; // clamped to zero
              const di_dt = (0 - R * currentIL) / L;
              nextIL = Math.max(0, currentIL + di_dt * dt);
              io = currentIL;
              is = 0; // source is isolated!
              iDev = 0;
              vDev = vs;
              activeDevs.push('FWD');
            } else {
              nextIL = 0;
              vo = 0;
              io = 0;
              is = 0;
              iDev = 0;
              vDev = vs;
            }
          }
        } else if (loadType === 'RC') {
          // Capacitor charging differential equation
          if (vs > currentVC && theta >= 0 && theta < Math.PI) {
            const iD = (vs - currentVC) / Rs;
            const dvc_dt = (iD - currentVC / R) / C;
            nextVC = Math.max(0, currentVC + dvc_dt * dt);
            vo = currentVC;
            io = vo / R;
            is = iD;
            iDev = iD;
            vDev = 0;
            activeDevs.push('D1');
          } else {
            const dvc_dt = -currentVC / (R * C);
            nextVC = Math.max(0, currentVC + dvc_dt * dt);
            vo = currentVC;
            io = vo / R;
            is = 0;
            iDev = 0;
            vDev = vs - vo;
          }
        }
        break;
      }

      // -------------------------------------------------------------------
      // 2. SINGLE-PHASE HALF-WAVE CONTROLLED (SCR)
      // -------------------------------------------------------------------
      case 'single_phase_half_wave_controlled': {
        const isGateActive = theta >= alphaRad && theta < alphaRad + gateWidth;
        vGate = isGateActive ? 5 : 0;

        if (loadType === 'R') {
          if (theta >= alphaRad && theta < Math.PI) {
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
          // SCR fires at alpha; conducts past pi until current extinguishes at beta
          const inConduction = (theta >= alphaRad && theta < Math.PI) || currentIL > 1e-6;
          if (inConduction) {
            vo = vs;
            const di_dt = (vo - R * currentIL) / L;
            nextIL = Math.max(0, currentIL + di_dt * dt);
            io = currentIL;
            is = io;
            iDev = io;
            vDev = 0;
            activeDevs.push('T1');
          } else {
            nextIL = 0;
            vo = 0;
            io = 0;
            is = 0;
            iDev = 0;
            vDev = vs;
          }
        } else if (loadType === 'RL_FWD') {
          if (theta >= alphaRad && theta < Math.PI) {
            vo = vs;
            const di_dt = (vo - R * currentIL) / L;
            nextIL = Math.max(0, currentIL + di_dt * dt);
            io = currentIL;
            is = io;
            iDev = io;
            vDev = 0;
            activeDevs.push('T1');
          } else if (theta >= Math.PI && currentIL > 1e-6) {
            vo = 0; // FWD clamped
            const di_dt = (0 - R * currentIL) / L;
            nextIL = Math.max(0, currentIL + di_dt * dt);
            io = currentIL;
            is = 0;
            iDev = 0;
            vDev = vs;
            activeDevs.push('FWD');
          } else {
            nextIL = 0;
            vo = 0;
            io = 0;
            is = 0;
            iDev = 0;
            vDev = vs;
          }
        } else if (loadType === 'RC') {
          const canConduct = theta >= alphaRad && theta < Math.PI && vs > currentVC;
          if (canConduct) {
            const iD = (vs - currentVC) / Rs;
            const dvc_dt = (iD - currentVC / R) / C;
            nextVC = Math.max(0, currentVC + dvc_dt * dt);
            vo = currentVC;
            io = vo / R;
            is = iD;
            iDev = iD;
            vDev = 0;
            activeDevs.push('T1');
          } else {
            const dvc_dt = -currentVC / (R * C);
            nextVC = Math.max(0, currentVC + dvc_dt * dt);
            vo = currentVC;
            io = vo / R;
            is = 0;
            iDev = 0;
            vDev = vs - vo;
          }
        }
        break;
      }

      // -------------------------------------------------------------------
      // 3. SINGLE-PHASE FULL-WAVE BRIDGE UNCONTROLLED (DIODES)
      // -------------------------------------------------------------------
      case 'single_phase_full_wave_bridge_uncontrolled': {
        const isPosHalf = theta < Math.PI;
        const absVs = Math.abs(vs);

        if (loadType === 'R') {
          vo = absVs;
          io = vo / R;
          is = isPosHalf ? io : -io;
          iDev = isPosHalf ? io : 0;
          vDev = isPosHalf ? 0 : vs;
          if (isPosHalf) activeDevs.push('D1', 'D2');
          else activeDevs.push('D3', 'D4');
        } else if (loadType === 'RL' || loadType === 'RL_FWD') {
          // Full-wave bridge with RL load: differential solution
          vo = absVs;
          const di_dt = (vo - R * currentIL) / L;
          nextIL = Math.max(0, currentIL + di_dt * dt);
          io = currentIL;
          is = isPosHalf ? io : -io;
          iDev = isPosHalf ? io : 0;
          vDev = isPosHalf ? 0 : vs;
          if (isPosHalf) activeDevs.push('D1', 'D2');
          else activeDevs.push('D3', 'D4');
        } else if (loadType === 'RC') {
          if (absVs > currentVC) {
            const iD = (absVs - currentVC) / Rs;
            const dvc_dt = (iD - currentVC / R) / C;
            nextVC = Math.max(0, currentVC + dvc_dt * dt);
            vo = currentVC;
            io = vo / R;
            is = isPosHalf ? iD : -iD;
            iDev = isPosHalf ? iD : 0;
            vDev = 0;
            if (isPosHalf) activeDevs.push('D1', 'D2');
            else activeDevs.push('D3', 'D4');
          } else {
            const dvc_dt = -currentVC / (R * C);
            nextVC = Math.max(0, currentVC + dvc_dt * dt);
            vo = currentVC;
            io = vo / R;
            is = 0;
            iDev = 0;
            vDev = vs - vo;
          }
        }
        break;
      }

      // -------------------------------------------------------------------
      // 4. SINGLE-PHASE FULL-WAVE SEMI-CONTROLLED BRIDGE
      // -------------------------------------------------------------------
      case 'single_phase_full_wave_semi_controlled': {
        const isGate1 = theta >= alphaRad && theta < alphaRad + gateWidth;
        const isGate2 = theta >= Math.PI + alphaRad && theta < Math.PI + alphaRad + gateWidth;
        vGate = isGate1 || isGate2 ? 5 : 0;

        const inPulse1 = theta >= alphaRad && theta < Math.PI;
        const inPulse2 = theta >= Math.PI + alphaRad && theta < 2 * Math.PI;

        if (loadType === 'R') {
          if (inPulse1) {
            vo = vs;
            io = vo / R;
            is = io;
            iDev = io;
            vDev = 0;
            activeDevs.push('T1', 'D2');
          } else if (inPulse2) {
            vo = -vs;
            io = vo / R;
            is = -io;
            iDev = 0;
            vDev = vs;
            activeDevs.push('T2', 'D1');
          } else {
            vo = 0;
            io = 0;
            is = 0;
            iDev = 0;
            vDev = vs;
          }
        } else if (loadType === 'RL' || loadType === 'RL_FWD') {
          if (inPulse1) {
            vo = vs;
            const di_dt = (vo - R * currentIL) / L;
            nextIL = Math.max(0, currentIL + di_dt * dt);
            io = currentIL;
            is = io;
            iDev = io;
            vDev = 0;
            activeDevs.push('T1', 'D2');
          } else if (inPulse2) {
            vo = -vs;
            const di_dt = (vo - R * currentIL) / L;
            nextIL = Math.max(0, currentIL + di_dt * dt);
            io = currentIL;
            is = -io;
            iDev = 0;
            vDev = vs;
            activeDevs.push('T2', 'D1');
          } else {
            // Freewheeling interval: output voltage clamps to 0, source current is 0
            if (currentIL > 1e-6) {
              vo = 0;
              const di_dt = (0 - R * currentIL) / L;
              nextIL = Math.max(0, currentIL + di_dt * dt);
              io = currentIL;
              is = 0;
              iDev = 0;
              vDev = vs;
              if (theta < alphaRad) activeDevs.push('T2', 'D1');
              else activeDevs.push('T1', 'D2');
            } else {
              nextIL = 0;
              vo = 0;
              io = 0;
              is = 0;
              iDev = 0;
              vDev = vs;
            }
          }
        } else if (loadType === 'RC') {
          const driveV = inPulse1 ? vs : inPulse2 ? -vs : 0;
          if (driveV > currentVC) {
            const iD = (driveV - currentVC) / Rs;
            const dvc_dt = (iD - currentVC / R) / C;
            nextVC = Math.max(0, currentVC + dvc_dt * dt);
            vo = currentVC;
            io = vo / R;
            is = inPulse1 ? iD : -iD;
            iDev = inPulse1 ? iD : 0;
            vDev = 0;
            if (inPulse1) activeDevs.push('T1', 'D2');
            else activeDevs.push('T2', 'D1');
          } else {
            const dvc_dt = -currentVC / (R * C);
            nextVC = Math.max(0, currentVC + dvc_dt * dt);
            vo = currentVC;
            io = vo / R;
            is = 0;
            iDev = 0;
            vDev = vs - vo;
          }
        }
        break;
      }

      // -------------------------------------------------------------------
      // 5. SINGLE-PHASE FULL-WAVE FULLY CONTROLLED BRIDGE
      // -------------------------------------------------------------------
      case 'single_phase_full_wave_bridge_controlled': {
        const isGate1 = theta >= alphaRad && theta < alphaRad + gateWidth;
        const isGate2 = theta >= Math.PI + alphaRad && theta < Math.PI + alphaRad + gateWidth;
        vGate = isGate1 || isGate2 ? 5 : 0;

        if (loadType === 'R') {
          if (theta >= alphaRad && theta < Math.PI) {
            vo = vs;
            io = vo / R;
            is = io;
            iDev = io;
            vDev = 0;
            activeDevs.push('T1', 'T2');
          } else if (theta >= Math.PI + alphaRad && theta < 2 * Math.PI) {
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
          // Without FWD: SCRs conduct negative voltage as long as current persists (CCM or DCM)
          const inPair1 = theta >= alphaRad && theta < Math.PI + alphaRad;
          const driveV = inPair1 ? vs : -vs;

          if (currentIL > 1e-6 || (inPair1 ? isGate1 : isGate2)) {
            vo = driveV;
            const di_dt = (vo - R * currentIL) / L;
            nextIL = Math.max(0, currentIL + di_dt * dt);
            io = currentIL;
            is = inPair1 ? io : -io;
            iDev = inPair1 ? io : 0;
            vDev = inPair1 ? 0 : vs;
            if (inPair1) activeDevs.push('T1', 'T2');
            else activeDevs.push('T3', 'T4');
          } else {
            nextIL = 0;
            vo = 0;
            io = 0;
            is = 0;
            iDev = 0;
            vDev = vs;
          }
        } else if (loadType === 'RL_FWD') {
          // With FWD: FWD clamps negative voltage to 0
          if (theta >= alphaRad && theta < Math.PI) {
            vo = vs;
            const di_dt = (vo - R * currentIL) / L;
            nextIL = Math.max(0, currentIL + di_dt * dt);
            io = currentIL;
            is = io;
            iDev = io;
            vDev = 0;
            activeDevs.push('T1', 'T2');
          } else if (theta >= Math.PI + alphaRad && theta < 2 * Math.PI) {
            vo = -vs;
            const di_dt = (vo - R * currentIL) / L;
            nextIL = Math.max(0, currentIL + di_dt * dt);
            io = currentIL;
            is = -io;
            iDev = 0;
            vDev = vs;
            activeDevs.push('T3', 'T4');
          } else {
            // Freewheeling through external FWD
            if (currentIL > 1e-6) {
              vo = 0;
              const di_dt = (0 - R * currentIL) / L;
              nextIL = Math.max(0, currentIL + di_dt * dt);
              io = currentIL;
              is = 0;
              iDev = 0;
              vDev = vs;
              activeDevs.push('FWD');
            } else {
              nextIL = 0;
              vo = 0;
              io = 0;
              is = 0;
              iDev = 0;
              vDev = vs;
            }
          }
        } else if (loadType === 'RC') {
          const inPulse1 = theta >= alphaRad && theta < Math.PI;
          const inPulse2 = theta >= Math.PI + alphaRad && theta < 2 * Math.PI;
          const driveV = inPulse1 ? vs : inPulse2 ? -vs : 0;
          if (driveV > currentVC) {
            const iD = (driveV - currentVC) / Rs;
            const dvc_dt = (iD - currentVC / R) / C;
            nextVC = Math.max(0, currentVC + dvc_dt * dt);
            vo = currentVC;
            io = vo / R;
            is = inPulse1 ? iD : -iD;
            iDev = inPulse1 ? iD : 0;
            vDev = 0;
            if (inPulse1) activeDevs.push('T1', 'T2');
            else activeDevs.push('T3', 'T4');
          } else {
            const dvc_dt = -currentVC / (R * C);
            nextVC = Math.max(0, currentVC + dvc_dt * dt);
            vo = currentVC;
            io = vo / R;
            is = 0;
            iDev = 0;
            vDev = vs - vo;
          }
        }
        break;
      }

      // -------------------------------------------------------------------
      // 6. THREE-PHASE 6-PULSE UNCONTROLLED BRIDGE
      // -------------------------------------------------------------------
      case 'three_phase_uncontrolled_bridge': {
        let maxPhase = 'A';
        let minPhase = 'B';
        let vMax = va;
        let vMin = vb;

        if (vb > vMax) {
          vMax = vb;
          maxPhase = 'B';
        }
        if (vc > vMax) {
          vMax = vc;
          maxPhase = 'C';
        }

        if (va < vMin) {
          vMin = va;
          minPhase = 'A';
        }
        if (vc < vMin) {
          vMin = vc;
          minPhase = 'C';
        }

        const topDiode = maxPhase === 'A' ? 'D1' : maxPhase === 'B' ? 'D3' : 'D5';
        const botDiode = minPhase === 'A' ? 'D4' : minPhase === 'B' ? 'D6' : 'D2';
        activeDevs.push(topDiode, botDiode);

        const vLL = vMax - vMin;

        if (loadType === 'R') {
          vo = vLL;
          io = vo / R;
        } else if (loadType === 'RL' || loadType === 'RL_FWD') {
          vo = vLL;
          const di_dt = (vo - R * currentIL) / L;
          nextIL = Math.max(0, currentIL + di_dt * dt);
          io = currentIL;
        } else if (loadType === 'RC') {
          if (vLL > currentVC) {
            const iD = (vLL - currentVC) / Rs;
            const dvc_dt = (iD - currentVC / R) / C;
            nextVC = Math.max(0, currentVC + dvc_dt * dt);
            vo = currentVC;
            io = vo / R;
          } else {
            const dvc_dt = -currentVC / (R * C);
            nextVC = Math.max(0, currentVC + dvc_dt * dt);
            vo = currentVC;
            io = vo / R;
          }
        }

        is = (maxPhase === 'A' ? io : 0) - (minPhase === 'A' ? io : 0);
        iDev = topDiode === 'D1' ? io : 0;
        vDev = topDiode === 'D1' ? 0 : va - vMax;
        break;
      }

      // -------------------------------------------------------------------
      // 7. THREE-PHASE 6-PULSE CONTROLLED BRIDGE
      // -------------------------------------------------------------------
      case 'three_phase_controlled_bridge': {
        const vab = va - vb;
        const vac = va - vc;
        const vbc = vb - vc;
        const vba = vb - va;
        const vca = vc - va;
        const vcb = vc - vb;

        // Shift theta by firing delay
        const refTheta = (theta - alphaRad + 4 * Math.PI) % (2 * Math.PI);

        let vInst = 0;
        let topScr = 'T1';
        let botScr = 'T6';

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

        const isNearFiring =
          Math.abs(refTheta - Math.PI / 6) < gateWidth ||
          Math.abs(refTheta - Math.PI / 2) < gateWidth ||
          Math.abs(refTheta - (5 * Math.PI) / 6) < gateWidth ||
          Math.abs(refTheta - (7 * Math.PI) / 6) < gateWidth ||
          Math.abs(refTheta - (3 * Math.PI) / 2) < gateWidth ||
          Math.abs(refTheta - (11 * Math.PI) / 6) < gateWidth;
        vGate = isNearFiring ? 5 : 0;

        if (loadType === 'R') {
          vo = Math.max(0, vInst);
          io = vo / R;
        } else if (loadType === 'RL') {
          if (currentIL > 1e-6 || isNearFiring) {
            vo = vInst;
            const di_dt = (vo - R * currentIL) / L;
            nextIL = Math.max(0, currentIL + di_dt * dt);
            io = currentIL;
          } else {
            nextIL = 0;
            vo = 0;
            io = 0;
          }
        } else if (loadType === 'RL_FWD') {
          if (vInst >= 0 && (currentIL > 1e-6 || isNearFiring)) {
            vo = vInst;
            const di_dt = (vo - R * currentIL) / L;
            nextIL = Math.max(0, currentIL + di_dt * dt);
            io = currentIL;
          } else if (currentIL > 1e-6) {
            vo = 0;
            const di_dt = (0 - R * currentIL) / L;
            nextIL = Math.max(0, currentIL + di_dt * dt);
            io = currentIL;
            activeDevs.push('FWD');
          } else {
            nextIL = 0;
            vo = 0;
            io = 0;
          }
        } else if (loadType === 'RC') {
          if (vInst > currentVC) {
            const iD = (vInst - currentVC) / Rs;
            const dvc_dt = (iD - currentVC / R) / C;
            nextVC = Math.max(0, currentVC + dvc_dt * dt);
            vo = currentVC;
            io = vo / R;
          } else {
            const dvc_dt = -currentVC / (R * C);
            nextVC = Math.max(0, currentVC + dvc_dt * dt);
            vo = currentVC;
            io = vo / R;
          }
        }

        if (io > 0.001) {
          activeDevs.push(topScr, botScr);
        }

        is = (topScr === 'T1' ? io : 0) - (botScr === 'T4' ? io : 0);
        iDev = topScr === 'T1' ? io : 0;
        vDev = topScr === 'T1' ? 0 : va - (topScr === 'T3' ? vb : vc);
        break;
      }
    }

    return {
      nextIL,
      nextVC,
      sample: {
        theta,
        vSource: vs,
        vSourceB: vb,
        vSourceC: vc,
        vOutput: vo,
        iOutput: io,
        iSource: is,
        vDevice: vDev,
        iDevice: iDev,
        vGate,
        activeDevices: activeDevs,
      },
    };
  };

  // 1. Settle to periodic steady state
  for (let c = 0; c < settlingCycles; c++) {
    for (let k = 0; k < stepsPerCycle; k++) {
      const theta = (k * 2 * Math.PI) / stepsPerCycle;
      const res = stepCircuit(iL, vC, theta);
      iL = res.nextIL;
      vC = res.nextVC;
    }
  }

  // 2. Capture final steady-state cycle
  const cycleSamples: InternalCycleSample[] = [];
  for (let k = 0; k < stepsPerCycle; k++) {
    const theta = (k * 2 * Math.PI) / stepsPerCycle;
    const res = stepCircuit(iL, vC, theta);
    cycleSamples.push(res.sample);
    iL = res.nextIL;
    vC = res.nextVC;
  }

  return cycleSamples;
}

/**
 * Run dynamic simulation over requested time span.
 * Uses the pre-solved periodic steady-state cycle to deterministically
 * evaluate waveforms across any timeOffset and timeWindow without transient jumps.
 */
export function simulateRectifier(
  params: RectifierParameters,
  numCycles = 2,
  samplesPerCycle = 600,
  timeOffset = 0,
  durationSeconds?: number
): { samples: SimulationSample[]; metrics: RectifierMetrics; harmonics: HarmonicComponent[] } {
  const { frequency } = params;
  const T = 1 / frequency;
  const totalDuration = durationSeconds && durationSeconds > 0 ? durationSeconds : numCycles * T;
  const totalSamples = Math.max(600, Math.round(samplesPerCycle * (totalDuration / T)));
  const dt = totalDuration / totalSamples;

  // 1. Solve steady state cycle at fine resolution
  const lutSize = 2400;
  const lut = solvePeriodicSteadyStateCycle(params, lutSize);

  // 2. Generate output samples mapped continuously to steady-state phase
  const samples: SimulationSample[] = [];

  for (let s = 0; s < totalSamples; s++) {
    const t = timeOffset + s * dt;
    const phaseRaw = 2 * Math.PI * frequency * t;
    const phaseNorm = ((phaseRaw % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    // Map to LUT index
    const lutIdx = Math.min(lutSize - 1, Math.floor((phaseNorm / (2 * Math.PI)) * lutSize));
    const ref = lut[lutIdx];

    samples.push({
      time: t,
      phase: phaseNorm,
      vSource: ref.vSource,
      vSourceB: ref.vSourceB,
      vSourceC: ref.vSourceC,
      vOutput: ref.vOutput,
      iOutput: ref.iOutput,
      iSource: ref.iSource,
      vDevice: ref.vDevice,
      iDevice: ref.iDevice,
      vGate: ref.vGate,
      activeDevices: [...ref.activeDevices],
    });
  }

  // 3. Compute accurate metrics from the steady-state cycle
  const metrics = calculateMetrics(params, lut);
  const harmonics = calculateHarmonics(lut, frequency);

  return { samples, metrics, harmonics };
}

/**
 * Calculates DC, RMS, Real Power, Ripple Factor, Efficiency, Form Factor
 * directly from the periodic steady-state cycle.
 */
function calculateMetrics(
  params: RectifierParameters,
  cycleSamples: InternalCycleSample[]
): RectifierMetrics {
  const { topology, voltagePeak: Vm, resistance: R, inductance, firingAngle } = params;
  const N = cycleSamples.length;

  let sumVo = 0;
  let sumVoSq = 0;
  let sumIo = 0;
  let sumIoSq = 0;
  let sumPower = 0;

  for (let i = 0; i < N; i++) {
    const s = cycleSamples[i];
    sumVo += s.vOutput;
    sumVoSq += s.vOutput * s.vOutput;
    sumIo += s.iOutput;
    sumIoSq += s.iOutput * s.iOutput;
    sumPower += s.vOutput * s.iOutput; // Real instantaneous power
  }

  const vDcAvg = sumVo / N;
  const vRms = Math.sqrt(sumVoSq / N);
  const iDcAvg = sumIo / N;
  const iRms = Math.sqrt(sumIoSq / N);

  // DC Power delivered to load
  const pDc = vDcAvg * iDcAvg;

  // Real Active AC/load power (average of instantaneous power)
  const pAc = Math.max(0.001, sumPower / N);

  const formFactor = Math.abs(vDcAvg) > 0.001 ? vRms / Math.abs(vDcAvg) : 1;
  const rippleFactor =
    Math.abs(vDcAvg) > 0.001 ? Math.sqrt(Math.max(0, formFactor * formFactor - 1)) : 0;
  const efficiency = Math.min(100, Math.max(0, (pDc / pAc) * 100));

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

  // Calculate beta (extinction angle) if RL load
  let extinctionAngleDeg: number | undefined;
  if (params.loadType === 'RL' || params.loadType === 'RL_FWD') {
    const omega = 2 * Math.PI * params.frequency;
    const L = (inductance || 0) * 1e-3;
    const phi = Math.atan2(omega * L, R);
    const alphaRad = topology.includes('uncontrolled') ? 0 : (firingAngle * Math.PI) / 180;
    const betaRad = findExtinctionAngle(alphaRad, phi);
    extinctionAngleDeg = (betaRad * 180) / Math.PI;
  }

  const acRms = Math.sqrt(Math.max(0, vRms * vRms - vDcAvg * vDcAvg));
  const thdPercent = Math.abs(vDcAvg) > 0.001 ? (acRms / Math.abs(vDcAvg)) * 100 : 0;

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
    extinctionAngleDeg,
    fundamentalRms: acRms,
    thdPercent,
  };
}

/**
 * Calculates Theoretical Vdc for comparison in observation table and test suites.
 * Uses exact analytical formulas for all supported topologies and conditions.
 */
export function calculateTheoreticalVdc(params: RectifierParameters): number {
  const { topology, loadType, voltagePeak: Vm, frequency, firingAngle, resistance: R, inductance, capacitance } = params;
  const alphaRad = (firingAngle * Math.PI) / 180;
  const omega = 2 * Math.PI * frequency;
  const L = (inductance || 0) * 1e-3;

  // 1. RC Filter Load Across Topologies
  if (loadType === 'RC') {
    const C = Math.max(capacitance || 100, 1) * 1e-6;
    const tau = Math.max(R * C, 1e-5);
    const m = topology.includes('three') ? 6 : topology.includes('full') ? 2 : 1;
    const period = 1 / (m * frequency);
    const steps = 600;
    const dt = period / steps;
    const Rs = Math.max(0.02 * R, 0.1);

    let vc = Vm * Math.exp(-period / tau);
    // Settle
    for (let c = 0; c < 5; c++) {
      for (let s = 0; s < steps; s++) {
        const t = s * dt;
        let vDrive = 0;
        if (m === 1) {
          vDrive = Math.max(0, Vm * Math.sin(omega * t));
        } else if (m === 2) {
          vDrive = Math.abs(Vm * Math.sin(omega * t));
        } else {
          // 3-phase line-to-line pulse
          const th = (Math.PI / 6) + (omega * t) % (Math.PI / 3);
          vDrive = Math.sqrt(3) * Vm * Math.cos(th - Math.PI / 3);
        }

        if (vDrive > vc) {
          const iD = (vDrive - vc) / Rs;
          vc += ((iD - vc / R) / C) * dt;
        } else {
          vc += (-vc / (R * C)) * dt;
        }
      }
    }

    let sumV = 0;
    for (let s = 0; s < steps; s++) {
      const t = s * dt;
      let vDrive = 0;
      if (m === 1) {
        vDrive = Math.max(0, Vm * Math.sin(omega * t));
      } else if (m === 2) {
        vDrive = Math.abs(Vm * Math.sin(omega * t));
      } else {
        const th = (Math.PI / 6) + (omega * t) % (Math.PI / 3);
        vDrive = Math.sqrt(3) * Vm * Math.cos(th - Math.PI / 3);
      }

      if (vDrive > vc) {
        const iD = (vDrive - vc) / Rs;
        vc += ((iD - vc / R) / C) * dt;
      } else {
        vc += (-vc / (R * C)) * dt;
      }
      sumV += vc;
    }
    return sumV / steps;
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
      return (Vm / Math.PI) * (1 + Math.cos(alphaRad));

    case 'single_phase_full_wave_bridge_controlled':
      if (loadType === 'RL') {
        const phi = Math.atan2(omega * L, R);
        if (alphaRad <= phi) {
          // Continuous Conduction Mode (CCM)
          return (2 * Vm * Math.cos(alphaRad)) / Math.PI;
        } else {
          // Discontinuous Conduction Mode (DCM)
          const beta = findExtinctionAngle(alphaRad, phi);
          const betaEff = Math.min(Math.PI + alphaRad, beta);
          return (Vm / Math.PI) * (Math.cos(alphaRad) - Math.cos(betaEff));
        }
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
 * Calculates Discrete Fourier Transform for Harmonic Spectrum from the steady-state cycle
 */
function calculateHarmonics(
  cycleSamples: InternalCycleSample[],
  fundamentalFreq: number
): HarmonicComponent[] {
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
