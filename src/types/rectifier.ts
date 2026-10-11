export type RectifierTopology =
  | 'single_phase_half_wave_uncontrolled'
  | 'single_phase_half_wave_controlled'
  | 'single_phase_full_wave_bridge_uncontrolled'
  | 'single_phase_full_wave_semi_controlled'
  | 'single_phase_full_wave_bridge_controlled'
  | 'three_phase_uncontrolled_bridge'
  | 'three_phase_controlled_bridge';

export type LoadType = 'R' | 'RL' | 'RL_FWD' | 'RC';

export interface RectifierParameters {
  topology: RectifierTopology;
  loadType: LoadType;
  voltagePeak: number; // Vm (Volts)
  frequency: number;   // f (Hz, default 50)
  firingAngle: number; // alpha in degrees (0 - 180)
  resistance: number;  // R (Ohms)
  inductance: number;  // L (mH)
  capacitance: number; // C (uF)
}

export interface SimulationSample {
  time: number;          // seconds
  phase: number;         // radians (0 to 2pi or multi-cycle)
  vSource: number;       // Vs (or Phase A)
  vSourceB?: number;     // Phase B for 3-phase
  vSourceC?: number;     // Phase C for 3-phase
  vOutput: number;       // Vo (load voltage)
  iOutput: number;       // Io (load current)
  iSource: number;       // Is (source input current)
  vDevice: number;       // Voltage across switch
  iDevice?: number;      // Current through switch
  vGate?: number;        // Gate pulse voltage for SCR
  activeDevices: string[]; // List of currently conducting devices
}

export interface RectifierMetrics {
  vDcAvg: number;        // Average DC output voltage (V)
  vRms: number;          // RMS output voltage (V)
  iDcAvg: number;        // Average DC load current (A)
  iRms: number;          // RMS load current (A)
  pDc: number;           // DC output power (W)
  pAc: number;           // AC input / RMS power (W)
  rippleFactor: number;  // Gamma = sqrt((Vrms/Vdc)^2 - 1)
  formFactor: number;    // FF = Vrms / Vdc
  efficiency: number;    // % (Pdc / Pac * 100)
  rippleFrequency: number; // Hz
  peakInverseVoltage: number; // PIV in Volts
  extinctionAngleDeg?: number; // Beta in degrees for RL load
  fundamentalRms: number;
  thdPercent: number;    // Total Harmonic Distortion %
}

export interface HarmonicComponent {
  order: number;
  frequency: number;
  magnitude: number;
  relativePercent: number;
}

export interface ObservationRecord {
  id: string;
  timestamp: string;
  topology: RectifierTopology;
  topologyName: string;
  loadType: LoadType;
  voltagePeak: number;
  firingAngle: number;
  resistance: number;
  inductance: number;
  vDcTheoretical: number;
  vDcMeasured: number;
  vRms: number;
  iDc: number;
  rippleFactor: number;
  efficiency: number;
}
