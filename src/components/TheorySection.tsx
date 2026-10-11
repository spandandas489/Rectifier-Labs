import React, { useState } from 'react';
import { RectifierTopology } from '../types/rectifier';
import { BookOpen, CheckCircle, HelpCircle, ArrowRight } from 'lucide-react';

interface TheorySectionProps {
  currentTopology: RectifierTopology;
}

export const TheorySection: React.FC<TheorySectionProps> = ({ currentTopology }) => {
  const [selectedTopic, setSelectedTopic] = useState<RectifierTopology>(currentTopology);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-sky-400" />
          <h2 className="text-base font-bold text-slate-100">
            Theoretical Principles & Mathematical Derivations
          </h2>
        </div>
        <span className="text-xs text-slate-400 hidden sm:inline">
          Power Electronics Virtual Laboratory - IIT Kharagpur Standard
        </span>
      </div>

      {/* Navigation Pills between Topologies */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800">
        {[
          { id: 'single_phase_half_wave_uncontrolled', name: '1Φ HW Diode' },
          { id: 'single_phase_half_wave_controlled', name: '1Φ HW SCR' },
          { id: 'single_phase_full_wave_bridge_uncontrolled', name: '1Φ FW Diode' },
          { id: 'single_phase_full_wave_semi_controlled', name: '1Φ Semi-Converter' },
          { id: 'single_phase_full_wave_bridge_controlled', name: '1Φ FW Full-SCR' },
          { id: 'three_phase_uncontrolled_bridge', name: '3Φ Diode Bridge' },
          { id: 'three_phase_controlled_bridge', name: '3Φ SCR Bridge' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTopic(t.id as RectifierTopology)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              selectedTopic === t.id
                ? 'bg-sky-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Content for Selected Topology */}
      <div className="space-y-6 text-sm text-slate-300 leading-relaxed">
        {/* 1. SINGLE PHASE HALF WAVE UNCONTROLLED */}
        {selectedTopic === 'single_phase_half_wave_uncontrolled' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-sky-300">
              1. Single-Phase Half-Wave Uncontrolled Rectifier (Diode)
            </h3>
            <p>
              A single-phase half-wave rectifier uses a single semiconductor diode to convert alternating current (AC) into pulsating direct current (DC). The diode conducts only during the positive half-cycle of the AC supply ($0 \le \omega t \le \pi$), allowing current to flow to the load. During the negative half-cycle ($\pi \le \omega t \le 2\pi$), the diode is reverse-biased and blocks current flow.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs space-y-2">
                <div className="text-amber-400 font-bold font-sans text-sm">Key Equations (Pure R Load):</div>
                <div>Average DC Voltage:</div>
                <div className="text-sky-300 text-sm font-bold pl-2">
                  V_dc = (1 / 2π) ∫₀^π Vm sin(ωt) d(ωt) = Vm / π ≈ 0.318 Vm
                </div>
                <div>RMS Output Voltage:</div>
                <div className="text-sky-300 text-sm font-bold pl-2">
                  V_rms = √[(1 / 2π) ∫₀^π (Vm sin ωt)² d(ωt)] = Vm / 2 = 0.5 Vm
                </div>
                <div>Form Factor:</div>
                <div className="text-emerald-300 pl-2">FF = V_rms / V_dc = (Vm / 2) / (Vm / π) = π / 2 ≈ 1.57</div>
                <div>Ripple Factor:</div>
                <div className="text-emerald-300 pl-2">γ = √(FF² - 1) = √(1.57² - 1) ≈ 1.21 (121%)</div>
                <div>Maximum Efficiency:</div>
                <div className="text-emerald-300 pl-2">η = (V_dc · I_dc) / (V_rms · I_rms) = (4 / π²) ≈ 40.5%</div>
                <div>Peak Inverse Voltage:</div>
                <div className="text-rose-400 pl-2">PIV = Vm</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs">
                <div className="text-amber-400 font-bold text-sm">Behavior with Inductive (R-L) Load:</div>
                <p>
                  When an inductive load is connected, the energy stored in the inductor ($E = \frac{1}{2} L i^2$) prevents instantaneous current collapse when the input voltage goes negative at $\omega t = \pi$.
                </p>
                <p>
                  The diode continues conducting beyond $\pi$ until the current decays to zero at the <strong>extinction angle $\beta$</strong> ($\pi &lt; \beta &lt; 2\pi$).
                </p>
                <div className="p-2 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono">
                  V_dc = (Vm / 2π) · (1 - cos β)
                </div>
                <p>
                  Notice that from $\pi$ to $\beta$, $v_o(t)$ is negative, which reduces the average DC output voltage!
                </p>
                <p>
                  <strong>Role of Freewheeling Diode (FWD):</strong> Connecting an antiparallel diode across the load clamps $v_o(t) \ge 0$ at $\pi$, eliminating negative output spikes and allowing inductive current to freewheel harmlessly.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. SINGLE PHASE HALF WAVE CONTROLLED */}
        {selectedTopic === 'single_phase_half_wave_controlled' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-sky-300">
              2. Single-Phase Half-Wave Controlled Rectifier (SCR / Thyristor)
            </h3>
            <p>
              In a controlled half-wave rectifier, the diode is replaced by a Silicon Controlled Rectifier (SCR). Conduction is delayed until a gate firing pulse is injected at an angle $\omega t = \alpha$, known as the <strong>firing angle (or delay angle)</strong>. By varying $\alpha$ from $0^\circ$ to $180^\circ$, the average DC output voltage can be smoothly regulated.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs space-y-2">
                <div className="text-amber-400 font-bold font-sans text-sm">Key Equations (Pure R Load):</div>
                <div>Average DC Output Voltage:</div>
                <div className="text-sky-300 text-sm font-bold pl-2">
                  V_dc = (1 / 2π) ∫_α^π Vm sin(ωt) d(ωt) = (Vm / 2π) · (1 + cos α)
                </div>
                <div>For α = 0°: V_dc = Vm / π (same as diode)</div>
                <div>For α = 90°: V_dc = Vm / 2π</div>
                <div>For α = 180°: V_dc = 0 V</div>
                <div className="pt-1">RMS Output Voltage:</div>
                <div className="text-sky-300 text-xs font-bold pl-2">
                  V_rms = (Vm / 2) · √[(1 / π) · ((π - α) + ½ sin 2α)]
                </div>
                <div>Peak Inverse Voltage:</div>
                <div className="text-rose-400 pl-2">PIV = Vm</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs">
                <div className="text-amber-400 font-bold text-sm">Effect on RL Load with and without FWD:</div>
                <p>
                  <strong>Without FWD:</strong> The thyristor conducts from $\alpha$ to $\beta$.
                </p>
                <div className="p-2 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono">
                  V_dc = (Vm / 2π) · (cos α - cos β)
                </div>
                <p>
                  Energy transferred back from inductor into the AC source during $[\pi, \beta]$ pulls down the average output.
                </p>
                <p>
                  <strong>With FWD:</strong> As soon as $v_s$ crosses zero at $\pi$, the freewheeling diode becomes forward-biased and conducts, turning off the SCR and clamping $v_o(t) = 0$.
                </p>
                <div className="p-2 rounded bg-slate-900 border border-slate-700 text-emerald-300 font-mono">
                  V_dc = (Vm / 2π) · (1 + cos α)
                </div>
                <p>
                  The FWD improves power factor, eliminates negative voltage spikes, and ensures smooth load current.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. SINGLE PHASE FULL WAVE BRIDGE UNCONTROLLED */}
        {selectedTopic === 'single_phase_full_wave_bridge_uncontrolled' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-sky-300">
              3. Single-Phase Full-Wave Bridge Uncontrolled Rectifier (Diodes)
            </h3>
            <p>
              The bridge rectifier uses four diodes in a Graetz bridge configuration. During the positive half-cycle ($0 \le \omega t \le \pi$), diodes $D_1$ and $D_2$ conduct. During the negative half-cycle ($\pi \le \omega t \le 2\pi$), diodes $D_3$ and $D_4$ conduct, routing current through the load in the identical direction during both halves.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs space-y-2">
                <div className="text-amber-400 font-bold font-sans text-sm">Performance Parameters:</div>
                <div>Average DC Output Voltage:</div>
                <div className="text-sky-300 text-sm font-bold pl-2">
                  V_dc = (2 / π) · Vm ≈ 0.6366 Vm (2x of Half-Wave!)
                </div>
                <div>RMS Output Voltage:</div>
                <div className="text-sky-300 text-sm font-bold pl-2">
                  V_rms = Vm / √2 ≈ 0.7071 Vm
                </div>
                <div>Form Factor:</div>
                <div className="text-emerald-300 pl-2">FF = V_rms / V_dc = (π / 2√2) ≈ 1.11</div>
                <div>Ripple Factor:</div>
                <div className="text-emerald-300 pl-2">γ = √(FF² - 1) = √(1.11² - 1) ≈ 0.483 (48.3%)</div>
                <div>Rectification Efficiency:</div>
                <div className="text-emerald-300 pl-2">η = (8 / π²) ≈ 81.2% (Double the Half-Wave)</div>
                <div>Ripple Frequency:</div>
                <div className="text-cyan-300 pl-2">f_ripple = 2 · f_supply = 100 Hz (at 50 Hz supply)</div>
                <div>Peak Inverse Voltage per Diode:</div>
                <div className="text-rose-400 pl-2">PIV = Vm (unlike center-tap which requires 2Vm)</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs">
                <div className="text-amber-400 font-bold text-sm">Advantages over Center-Tapped & Half-Wave:</div>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-300">
                  <li>No expensive center-tapped secondary transformer required.</li>
                  <li>Diode PIV rating is only $V_m$, half of the center-tapped transformer configuration ($2V_m$).</li>
                  <li>Higher Transformer Utilization Factor (TUF = 0.812).</li>
                  <li>Ripple frequency is doubled, requiring smaller filtering inductors and capacitors to achieve pure DC.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 4. SINGLE PHASE FULL WAVE CONTROLLED BRIDGE */}
        {selectedTopic === 'single_phase_full_wave_bridge_controlled' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-sky-300">
              4. Single-Phase Full-Wave Controlled Bridge Rectifier (SCR)
            </h3>
            <p>
              A fully controlled bridge rectifier consists of four thyristors ($T_1, T_2, T_3, T_4$). Firing pulses are applied in pairs: $T_1$ and $T_2$ are fired at $\omega t = \alpha$, while $T_3$ and $T_4$ are fired at $\omega t = \pi + \alpha$.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs space-y-2">
                <div className="text-amber-400 font-bold font-sans text-sm">Governing Equations:</div>
                <div className="text-slate-400">Pure Resistive Load (R):</div>
                <div className="text-sky-300 font-bold pl-2">
                  V_dc = (Vm / π) · (1 + cos α)
                </div>
                <div className="text-slate-400 pt-1">Highly Inductive Continuous Load (RL):</div>
                <div className="text-amber-300 font-bold pl-2">
                  V_dc = (2Vm / π) · cos α
                </div>
                <div className="text-slate-400 text-[11px] pl-2">
                  * Note: For 0° &lt; α &lt; 90°, V_dc &gt; 0 (Rectifier mode: AC to DC)
                </div>
                <div className="text-slate-400 text-[11px] pl-2">
                  * For 90° &lt; α &lt; 180°, V_dc &lt; 0 (Inverter mode: DC to AC regenerates power!)
                </div>
                <div>RMS Output Voltage:</div>
                <div className="text-emerald-300 pl-2">
                  V_rms = Vm · √[ (1 / π) · ((π - α)/2 + (sin 2α)/4) ]
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs">
                <div className="text-amber-400 font-bold text-sm">Continuous vs Discontinuous Conduction:</div>
                <p>
                  In heavily inductive DC motor loads ($L/R \gg 1$), load current never drops to zero (continuous conduction mode).
                </p>
                <p>
                  When $\alpha &gt; 0$, output voltage $v_o(t)$ follows the input wave and dips negative during $[\pi, \pi + \alpha]$ because the outgoing SCR pair remains latched on until the incoming pair is triggered.
                </p>
                <p>
                  This gives a linear cosine control characteristic: V_dc &prop; cos &alpha;.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 5. THREE PHASE 6-PULSE UNCONTROLLED BRIDGE */}
        {selectedTopic === 'three_phase_uncontrolled_bridge' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-sky-300">
              5. Three-Phase 6-Pulse Uncontrolled Bridge Rectifier
            </h3>
            <p>
              In industrial high-power installations, three-phase rectifiers are universally preferred over single-phase rectifiers due to their exceptionally low ripple, high efficiency, and balanced loading on the supply grid. The 6-pulse bridge consists of 6 diodes: 3 in the upper common-cathode commutating group ($D_1, D_3, D_5$) and 3 in the lower common-anode commutating group ($D_4, D_6, D_2$).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs space-y-2">
                <div className="text-amber-400 font-bold font-sans text-sm">Theoretical Parameters:</div>
                <div>Average DC Voltage:</div>
                <div className="text-sky-300 text-sm font-bold pl-2">
                  V_dc = (3√3 / π) · V_m(phase) ≈ 1.654 V_m(phase)
                </div>
                <div className="text-slate-400 pl-2">
                  Or in terms of line-to-line peak V_mL: V_dc = (3 / π) · V_mL ≈ 0.955 V_mL
                </div>
                <div>RMS Output Voltage:</div>
                <div className="text-sky-300 text-sm font-bold pl-2">
                  V_rms = V_m · √[ 3/2 + (9√3 / 4π) ] ≈ 1.6554 V_m
                </div>
                <div>Ripple Factor:</div>
                <div className="text-emerald-300 text-sm font-bold pl-2">
                  γ = √[(1.6554 / 1.654)² - 1] ≈ 0.042 (Only 4.2% ripple!)
                </div>
                <div>Ripple Frequency:</div>
                <div className="text-amber-300 pl-2">
                  f_ripple = 6 · f_supply = 300 Hz (at 50 Hz grid)
                </div>
                <div>Efficiency:</div>
                <div className="text-emerald-300 pl-2">η ≈ 99.8%</div>
                <div>Conduction Angle per Diode:</div>
                <div className="text-slate-300 pl-2">120° (2π/3 radians)</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs">
                <div className="text-amber-400 font-bold text-sm">Commutation and Conduction Sequence:</div>
                <p>
                  At any given instant, conduction occurs between:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-300">
                  <li>The upper diode connected to the phase with the <strong>most positive</strong> instantaneous potential.</li>
                  <li>The lower diode connected to the phase with the <strong>most negative</strong> instantaneous potential.</li>
                </ol>
                <p>
                  Commutation shifts naturally every $60^\circ$ ($\pi/3$), resulting in 6 distinct conduction intervals per $360^\circ$ AC cycle (hence termed "6-pulse"). The resulting DC voltage is composed of the crests of the line-to-line AC waveforms, maintaining a remarkably steady DC level even without filter capacitors.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 6. SINGLE-PHASE FULL-WAVE SEMI-CONTROLLED BRIDGE (SEMI-CONVERTER) */}
        {selectedTopic === 'single_phase_full_wave_semi_controlled' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-sky-300">
              6. Single-Phase Full-Wave Semi-Controlled Rectifier (Semi-Converter)
            </h3>
            <p>
              A semi-converter uses a combination of controlled thyristors (T1, T2) and uncontrolled diodes (D1, D2). It is commonly used in industrial DC motor drives because it provides single-quadrant control (V_dc &ge; 0, Io &ge; 0) at lower cost than a fully controlled converter, and has inherent freewheeling capability provided by the diodes without needing an external freewheeling diode.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs space-y-2">
                <div className="text-amber-400 font-bold font-sans text-sm">Governing Equations:</div>
                <div className="text-slate-400">Average DC Output Voltage (for ALL loads):</div>
                <div className="text-sky-300 font-bold text-sm pl-2">
                  V_dc = (Vm / &pi;) &middot; (1 + cos &alpha;)
                </div>
                <div>For &alpha; = 0&deg;: V_dc = 2Vm / &pi; &asymp; 0.6366 Vm</div>
                <div>For &alpha; = 90&deg;: V_dc = Vm / &pi; &asymp; 0.3183 Vm</div>
                <div>For &alpha; = 180&deg;: V_dc = 0 V</div>
                <div className="pt-1">RMS Output Voltage:</div>
                <div className="text-emerald-300 pl-2">
                  V_rms = Vm &middot; &radic;[(1 / 2&pi;) &middot; ((&pi; - &alpha;) + &frac12; sin 2&alpha;)]
                </div>
                <div>Ripple Frequency:</div>
                <div className="text-amber-300 pl-2">f_ripple = 2 &middot; f_supply = 100 Hz (at 50 Hz supply)</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs">
                <div className="text-amber-400 font-bold text-sm">Inherent Freewheeling Action:</div>
                <p>
                  In the positive half-cycle, $T_1$ and $D_1$ conduct from $\alpha$ to $\pi$. At $\omega t = \pi$, the supply voltage reverses polarity.
                </p>
                <p>
                  This forward-biases diode $D_2$. The load current now commutes naturally through $D_2$ and $T_1$ (or through the two diodes), clamping the load voltage to zero.
                </p>
                <p>
                  Because the output voltage is never negative, the average DC output voltage is higher, the input displacement factor is superior to fully controlled bridges, and power flow is strictly unidirectional (cannot invert power back to AC).
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 7. THREE-PHASE 6-PULSE FULLY CONTROLLED BRIDGE */}
        {selectedTopic === 'three_phase_controlled_bridge' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-sky-300">
              7. Three-Phase 6-Pulse Fully Controlled Bridge Rectifier (6 SCRs)
            </h3>
            <p>
              The 3-phase fully controlled bridge converter uses six thyristors ($T_1$ to $T_6$) to convert 3-phase AC into variable DC. It is widely used in high-power DC drives (paper mills, rolling mills), HVDC transmission, and battery fast-chargers. Firing pulses are applied at an angle $\alpha$ relative to the natural commutation crossings ($\omega t = 30^\circ$).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-xs space-y-2">
                <div className="text-amber-400 font-bold font-sans text-sm">Key Equations:</div>
                <div className="text-slate-400">Average DC Output Voltage (Continuous RL Load):</div>
                <div className="text-sky-300 font-bold text-sm pl-2">
                  V_dc = (3&radic;3 &middot; Vm / &pi;) &middot; cos &alpha; &asymp; 1.654 Vm &middot; cos &alpha;
                </div>
                <div>In terms of line-to-line peak V_mL:</div>
                <div className="text-sky-300 pl-2">V_dc = (3 / &pi;) &middot; V_mL &middot; cos &alpha;</div>
                <div className="text-slate-400 pt-1">Two-Quadrant Operation:</div>
                <div className="text-emerald-300 pl-2">&bull; 0&deg; &le; &alpha; &lt; 90&deg;: V_dc &gt; 0 (Rectifier mode: AC &rarr; DC)</div>
                <div className="text-rose-400 pl-2">&bull; 90&deg; &lt; &alpha; &lt; 180&deg;: V_dc &lt; 0 (Inverter mode: DC &rarr; AC regenerates power)</div>
                <div className="pt-1">Ripple Frequency:</div>
                <div className="text-amber-300 pl-2">f_ripple = 6 &middot; f_supply = 300 Hz (at 50 Hz supply)</div>
              </div>

              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs">
                <div className="text-amber-400 font-bold text-sm">Gate Triggering Sequence:</div>
                <p>
                  Each thyristor conducts for $120^\circ$ ($2\pi/3$). Every $60^\circ$ ($\pi/3$), one thyristor commutates off and the next is triggered.
                </p>
                <p>
                  Firing Sequence: $T_1(30^\circ+\alpha) \to T_2(90^\circ+\alpha) \to T_3(150^\circ+\alpha) \to T_4(210^\circ+\alpha) \to T_5(270^\circ+\alpha) \to T_6(330^\circ+\alpha)$.
                </p>
                <p>
                  To start up conduction with two switches in series across the line, gate pulses must either be broad (&gt; 60&deg;) or double-pulsed (a main pulse for the incoming switch and a simultaneous pulse to the outgoing switch).
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
