import React from 'react';
import { ClipboardList, CheckCircle2, AlertTriangle, Cpu, HelpCircle } from 'lucide-react';

export const ProcedureSection: React.FC = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-sky-400" />
          <h2 className="text-base font-bold text-slate-100">
            Laboratory Experimental Procedure & Manual
          </h2>
        </div>
        <span className="text-xs text-slate-400">IIT Kharagpur Virtual Labs Protocol</span>
      </div>

      <div className="space-y-6 text-xs sm:text-sm text-slate-300">
        {/* Aim & Objectives */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
          <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-400" />
            Aim of the Experiment
          </h3>
          <p className="leading-relaxed text-slate-300">
            1. To study the working and output characteristics of single-phase half-wave (uncontrolled & controlled), single-phase full-wave bridge (uncontrolled & controlled), and three-phase 6-pulse bridge rectifiers.
          </p>
          <p className="leading-relaxed text-slate-300">
            2. To observe the voltage and current waveforms on the Digital Storage Oscilloscope (DSO) for Resistive (R), Inductive (R-L), and capacitive (R-C) loads.
          </p>
          <p className="leading-relaxed text-slate-300">
            3. To analyze the effect of firing angle (&alpha;) on average DC output voltage (V_dc), RMS voltage (V_rms), and harmonic ripple.
          </p>
          <p className="leading-relaxed text-slate-300">
            4. To evaluate the action of a Freewheeling Diode (FWD) in preventing negative output voltage swings in inductive loads.
          </p>
        </div>

        {/* Apparatus Required */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
          <h3 className="text-sm font-semibold text-sky-400 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-sky-400" />
            Apparatus / Virtual Components Required
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              • <strong>AC Power Supply:</strong> Single-phase (230V / step-down transformer) and 3-phase 50Hz AC source.
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              • <strong>Semiconductor Switches:</strong> Power Diodes (1N4007 / 1N5408) and Thyristors (SCR TY700).
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              • <strong>Loads:</strong> Variable Rheostat (5Ω - 500Ω), Decade Inductor Box (10mH - 250mH), Decade Capacitor.
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              • <strong>Instrumentation:</strong> Digital Storage Oscilloscope (DSO), True-RMS Digital Multimeters, Gate Pulse Generator.
            </div>
          </div>
        </div>

        {/* Step-by-Step Procedure */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-200">
            Step-by-Step Experimental Procedure
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex gap-3">
              <span className="font-mono font-bold text-sky-400 text-sm">01</span>
              <div>
                <strong className="text-slate-200">Select Converter Topology:</strong> Choose between Half-Wave Uncontrolled, Half-Wave Controlled, Full-Wave Bridge Uncontrolled, Full-Wave Controlled, or 3-Phase Bridge using the Converter Topology selector.
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex gap-3">
              <span className="font-mono font-bold text-sky-400 text-sm">02</span>
              <div>
                <strong className="text-slate-200">Configure AC Source Parameters:</strong> Set the peak input voltage $V_m$ (e.g. 50V, 100V, or 325V for mains equivalent) and supply frequency (50 Hz).
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex gap-3">
              <span className="font-mono font-bold text-sky-400 text-sm">03</span>
              <div>
                <strong className="text-slate-200">Select Load Model:</strong> Start with Pure Resistive (R = 50Ω). Note how current and voltage remain strictly in phase and proportional. Then switch to Inductive (R-L) to observe conduction extension and negative voltage dip.
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex gap-3">
              <span className="font-mono font-bold text-sky-400 text-sm">04</span>
              <div>
                <strong className="text-slate-200">Vary SCR Firing Angle (α):</strong> If using a controlled rectifier, adjust the slider from $\alpha = 0^\circ$ to $120^\circ$ in steps of $15^\circ$ or $30^\circ$. Observe the progressive chopping of the AC wave.
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex gap-3">
              <span className="font-mono font-bold text-sky-400 text-sm">05</span>
              <div>
                <strong className="text-slate-200">Measure Waveforms on Oscilloscope:</strong> Toggle Channel 1 ($v_s$) and Channel 2 ($v_o$). Enable Cursors A and B to measure conduction duration $\Delta t$, peak voltage, and ripple frequency.
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex gap-3">
              <span className="font-mono font-bold text-sky-400 text-sm">06</span>
              <div>
                <strong className="text-slate-200">Log Readings in Observation Table:</strong> Click <em>"Add to Observation Table"</em> for each setting. The system logs measured V_dc, theoretical V_dc, V_rms, ripple factor &gamma;, and efficiency &eta;.
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex gap-3">
              <span className="font-mono font-bold text-sky-400 text-sm">07</span>
              <div>
                <strong className="text-slate-200">Generate Performance Curves:</strong> Click <em>"Plot Vdc vs α"</em> to generate the characteristic curve comparing experimental points against theoretical cosine curves. Export results via <em>"Export CSV"</em>.
              </div>
            </div>
          </div>
        </div>

        {/* Precautions */}
        <div className="bg-slate-950 p-4 rounded-lg border border-amber-900/30 text-amber-200/90 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Safety Precautions for Physical Laboratory Implementations
          </div>
          <ul className="list-disc pl-4 space-y-1 text-slate-300">
            <li>Ensure input power is turned OFF before modifying circuit connections or changing load decade boxes.</li>
            <li>Always check diode polarity and SCR gate terminal connections to avoid reverse breakdown.</li>
            <li>When connecting DSO probes across non-isolated circuits, use differential probes or an isolation transformer to avoid earth ground loop short circuits.</li>
            <li>Ensure inductor ratings can sustain DC saturation current without overheating.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
