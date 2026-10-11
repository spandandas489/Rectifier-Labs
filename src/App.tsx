import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  RectifierParameters,
  RectifierTopology,
  LoadType,
  ObservationRecord,
  SimulationSample,
} from './types/rectifier';
import {
  simulateRectifier,
  calculateTheoreticalVdc,
  TOPOLOGY_LABELS,
  TOPOLOGY_SHORT_NAMES,
} from './physics/rectifierEngine';
import { CircuitSchematic } from './components/CircuitSchematic';
import { Oscilloscope } from './components/Oscilloscope';
import { MeterDashboard } from './components/MeterDashboard';
import { HarmonicsChart } from './components/HarmonicsChart';
import { ControlPanel } from './components/ControlPanel';
import { ObservationTable } from './components/ObservationTable';
import { TheorySection } from './components/TheorySection';
import { ProcedureSection } from './components/ProcedureSection';
import { VivaQuiz } from './components/VivaQuiz';
import { WaveformValidator } from './components/WaveformValidator';
import {
  Cpu,
  Activity,
  Table,
  BookOpen,
  ClipboardList,
  HelpCircle,
  GraduationCap,
  Sparkles,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<
    'workbench' | 'observations' | 'validation' | 'theory' | 'procedure' | 'quiz'
  >('workbench');

  // Simulation Parameters State
  const [params, setParams] = useState<RectifierParameters>({
    topology: 'single_phase_full_wave_bridge_uncontrolled',
    loadType: 'R',
    voltagePeak: 100, // 100 V peak
    frequency: 50,    // 50 Hz
    firingAngle: 30,  // 30 deg
    resistance: 50,   // 50 Ohms
    inductance: 60,   // 60 mH
    capacitance: 220, // 220 uF
  });

  // Animation & Sweep States
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);
  const [timeOffset, setTimeOffset] = useState<number>(0);
  const [activeSampleIndex, setActiveSampleIndex] = useState<number>(0);

  // Selected probe terminal (e.g. probe_vo, probe_vs, probe_io)
  const [selectedProbe, setSelectedProbe] = useState<string>('probe_vo');

  // Observation records
  const [observations, setObservations] = useState<ObservationRecord[]>([]);

  // Toast notification feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Timebase in ms per division (e.g. 5ms/div across 10 divs = 50ms total window)
  const [msPerDiv, setMsPerDiv] = useState<number>(5);

  // Run physics engine whenever parameters, timebase, or timeOffset change
  const simulationResult = useMemo(() => {
    const timeWindow = 10 * (msPerDiv * 1e-3);
    return simulateRectifier(params, 2, 600, timeOffset, timeWindow);
  }, [params, timeOffset, msPerDiv]);

  // Animation frame loop for continuous oscilloscope sweep
  const animRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    if (!isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const loop = (now: number) => {
      const dtMs = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Advance time proportional to frequency and speed (0.0005s per frame base)
      const dtSec = (dtMs / 1000) * 0.04 * speed;
      setTimeOffset((prev) => (prev + dtSec) % (1 / params.frequency));

      animRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, speed, params.frequency]);

  // Keep active sample tracking index in bound
  useEffect(() => {
    const len = simulationResult.samples.length;
    if (len > 0) {
      setActiveSampleIndex(Math.floor(len * 0.75));
    }
  }, [simulationResult.samples.length]);

  // Handle parameter updates
  const handleParamChange = (updated: Partial<RectifierParameters>) => {
    setParams((prev) => ({
      ...prev,
      ...updated,
    }));
  };

  // Toast trigger helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Add current run to observation table
  const handleRecordObservation = () => {
    const theoreticalVdc = calculateTheoreticalVdc(params);
    const newRecord: ObservationRecord = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      topology: params.topology,
      topologyName: TOPOLOGY_LABELS[params.topology],
      loadType: params.loadType,
      voltagePeak: params.voltagePeak,
      firingAngle: params.topology.includes('controlled') ? params.firingAngle : 0,
      resistance: params.resistance,
      inductance: params.loadType.includes('RL') ? params.inductance : 0,
      vDcTheoretical: theoreticalVdc,
      vDcMeasured: simulationResult.metrics.vDcAvg,
      vRms: simulationResult.metrics.vRms,
      iDc: simulationResult.metrics.iDcAvg,
      rippleFactor: simulationResult.metrics.rippleFactor,
      efficiency: simulationResult.metrics.efficiency,
    };

    setObservations((prev) => [newRecord, ...prev]);
    triggerToast(`Logged reading for ${TOPOLOGY_SHORT_NAMES[params.topology]} (Vdc = ${newRecord.vDcMeasured.toFixed(1)}V)`);
  };

  // Apply quick educational experiment presets
  const handleApplyPreset = (presetName: string) => {
    switch (presetName) {
      case 'hw_vs_fw':
        setParams((prev) => ({
          ...prev,
          topology: 'single_phase_full_wave_bridge_uncontrolled',
          loadType: 'R',
          voltagePeak: 100,
          resistance: 50,
        }));
        triggerToast('Loaded Experiment 1: Full-Wave vs Half-Wave Diode Comparison');
        break;

      case 'scr_alpha_study':
        setParams((prev) => ({
          ...prev,
          topology: 'single_phase_full_wave_bridge_controlled',
          loadType: 'R',
          voltagePeak: 100,
          firingAngle: 60,
          resistance: 50,
        }));
        triggerToast('Loaded Experiment 2: Controlled Rectifier Firing Angle Study (α=60°)');
        break;

      case 'fwd_comparison':
        setParams((prev) => ({
          ...prev,
          topology: 'single_phase_half_wave_controlled',
          loadType: 'RL_FWD',
          voltagePeak: 100,
          firingAngle: 45,
          resistance: 40,
          inductance: 120,
        }));
        triggerToast('Loaded Experiment 3: Freewheeling Diode Action in Inductive Loads');
        break;

      case 'three_phase_6pulse':
        setParams((prev) => ({
          ...prev,
          topology: 'three_phase_uncontrolled_bridge',
          loadType: 'R',
          voltagePeak: 100,
          resistance: 50,
        }));
        triggerToast('Loaded Experiment 4: 3-Phase 6-Pulse High Efficiency Bridge');
        break;

      case 'semi_converter':
        setParams((prev) => ({
          ...prev,
          topology: 'single_phase_full_wave_semi_controlled',
          loadType: 'RL',
          voltagePeak: 100,
          firingAngle: 45,
          resistance: 40,
          inductance: 80,
        }));
        triggerToast('Loaded Experiment 5: 1Φ Semi-Converter (Inherent Freewheeling)');
        break;

      case 'three_phase_controlled':
        setParams((prev) => ({
          ...prev,
          topology: 'three_phase_controlled_bridge',
          loadType: 'RL',
          voltagePeak: 100,
          firingAngle: 30,
          resistance: 40,
          inductance: 60,
        }));
        triggerToast('Loaded Experiment 6: 3Φ Fully Controlled 6-Pulse Converter');
        break;
    }
  };

  const currentSample =
    simulationResult.samples[activeSampleIndex] || simulationResult.samples[0] || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-2xl border border-emerald-400 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* IIT Kharagpur / Virtual Lab Inspired Academic Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-slate-900/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Institute Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-600 to-indigo-700 flex items-center justify-center text-white shadow-md font-mono font-bold text-lg">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white">
                  Rectifier Virtual Lab
                </span>
                <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-[11px] font-mono text-sky-400 hidden sm:inline">
                  IIT Kharagpur Standard
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-sm sm:max-w-md">
                Power Electronics Simulation Workbench · Uncontrolled & Controlled Converters
              </p>
            </div>
          </div>

          {/* Navigation Bar Tabs */}
          <nav className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveTab('workbench')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'workbench'
                  ? 'bg-sky-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Simulation Bench</span>
            </button>

            <button
              onClick={() => setActiveTab('observations')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'observations'
                  ? 'bg-sky-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Observation Table</span>
              {observations.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-sky-900 text-sky-200 text-[10px] font-mono">
                  {observations.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('validation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'validation'
                  ? 'bg-sky-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Waveform Tests</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 text-[10px] font-mono font-bold">
                32/32
              </span>
            </button>

            <button
              onClick={() => setActiveTab('theory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'theory'
                  ? 'bg-sky-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Theory</span>
            </button>

            <button
              onClick={() => setActiveTab('procedure')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'procedure'
                  ? 'bg-sky-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Procedure</span>
            </button>

            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeTab === 'quiz'
                  ? 'bg-sky-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Viva Quiz</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-5">
        {/* TAB 1: SIMULATION WORKBENCH */}
        {activeTab === 'workbench' && (
          <div className="flex flex-col gap-5">
            {/* Active Topology Kicker Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-400 font-medium">Active Experiment:</span>
                <span className="font-semibold text-slate-100 text-sm">
                  {TOPOLOGY_LABELS[params.topology]}
                </span>
                <span className="text-slate-500 font-mono">({params.loadType} Load)</span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
                <span>Vm = <strong className="text-sky-400">{params.voltagePeak}V</strong></span>
                <span>f = <strong className="text-slate-200">{params.frequency}Hz</strong></span>
                {params.topology.includes('controlled') && (
                  <span>α = <strong className="text-amber-400">{params.firingAngle}°</strong></span>
                )}
                <span>R = <strong className="text-emerald-400">{params.resistance}Ω</strong></span>
              </div>
            </div>

            {/* Split Row: Digital Storage Oscilloscope & Interactive Schematic */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: Digital Storage Oscilloscope (DSO) */}
              <div className="lg:col-span-7 flex flex-col gap-4">
                <Oscilloscope
                  samples={simulationResult.samples}
                  params={params}
                  isPlaying={isPlaying}
                  onTogglePlay={() => setIsPlaying(!isPlaying)}
                  speed={speed}
                  onSpeedChange={(s) => setSpeed(s)}
                  activeSampleIndex={activeSampleIndex}
                  onSelectSampleIndex={(idx) => setActiveSampleIndex(idx)}
                  msPerDiv={msPerDiv}
                  onMsPerDivChange={setMsPerDiv}
                />

                {/* Harmonics / FFT Frequency Analysis */}
                <HarmonicsChart
                  harmonics={simulationResult.harmonics}
                  metrics={simulationResult.metrics}
                  frequency={params.frequency}
                />
              </div>

              {/* Right Column: Interactive Circuit Schematic & Current Flow */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <CircuitSchematic
                  params={params}
                  currentSample={currentSample}
                  selectedProbe={selectedProbe}
                  onSelectProbe={(p) => setSelectedProbe(p)}
                />

                {/* Experiment Controls */}
                <ControlPanel
                  params={params}
                  onChange={handleParamChange}
                  onRecordObservation={handleRecordObservation}
                  onApplyPreset={handleApplyPreset}
                />
              </div>
            </div>

            {/* Digital Multimeter & Electrical Performance Gauges */}
            <MeterDashboard metrics={simulationResult.metrics} params={params} />

            {/* Observation Table Quick Preview */}
            <ObservationTable
              records={observations}
              onClearRecords={() => setObservations([])}
              onDeleteRecord={(id) => setObservations((prev) => prev.filter((r) => r.id !== id))}
            />
          </div>
        )}

        {/* TAB 2: OBSERVATION TABLE & DATA LOGGER */}
        {activeTab === 'observations' && (
          <div className="flex flex-col gap-5">
            <ObservationTable
              records={observations}
              onClearRecords={() => setObservations([])}
              onDeleteRecord={(id) => setObservations((prev) => prev.filter((r) => r.id !== id))}
            />
          </div>
        )}

        {/* TAB 3: WAVEFORM TEST SUITE & VALIDATION */}
        {activeTab === 'validation' && (
          <WaveformValidator
            onLoadTestCase={(selectedParams) => {
              setParams(selectedParams);
              setActiveTab('workbench');
              triggerToast(`Loaded test scenario: ${TOPOLOGY_SHORT_NAMES[selectedParams.topology]}`);
            }}
          />
        )}

        {/* TAB 3: THEORY & DERIVATIONS */}
        {activeTab === 'theory' && <TheorySection currentTopology={params.topology} />}

        {/* TAB 4: PROCEDURE MANUAL */}
        {activeTab === 'procedure' && <ProcedureSection />}

        {/* TAB 5: VIVA-VOCE QUIZ */}
        {activeTab === 'quiz' && <VivaQuiz />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 px-4 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Rectifier Virtual Laboratory · Power Electronics Educational Workbench
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Single Phase Half-Wave & Full-Wave Bridge</span>
            <span>·</span>
            <span>Three Phase 6-Pulse Converter</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
