import React, { useState } from 'react';
import { HelpCircle, CheckCircle, XCircle, RotateCcw, Award } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUIZ_QUESTIONS: Question[] = [
  {
    id: 1,
    question: 'What is the Peak Inverse Voltage (PIV) rating required for each diode in a single-phase full-wave bridge rectifier?',
    options: ['Vm / 2', 'Vm', '2 Vm', '√2 Vm'],
    correctIndex: 1,
    explanation:
      'In a bridge rectifier, when one pair of diodes conducts, the non-conducting diodes experience a reverse voltage of Vm. In contrast, a center-tapped full-wave rectifier requires a PIV of 2Vm.',
  },
  {
    id: 2,
    question: 'What is the fundamental ripple frequency of a single-phase full-wave bridge rectifier supplied by a 50 Hz AC source?',
    options: ['25 Hz', '50 Hz', '100 Hz', '300 Hz'],
    correctIndex: 2,
    explanation:
      'Since both positive and negative half-cycles are rectified, the output waveform repeats every half-period (T/2). Therefore, f_ripple = 2 × 50 Hz = 100 Hz.',
  },
  {
    id: 3,
    question: 'Why does the output voltage of a half-wave rectifier go negative when feeding an inductive (R-L) load without a freewheeling diode?',
    options: [
      'The diode breaks down due to reverse overvoltage',
      'The magnetic field in the inductor collapses, generating an EMF that keeps the diode conducting past π',
      'The supply frequency doubles during the negative half cycle',
      'The load resistance drops to zero',
    ],
    correctIndex: 1,
    explanation:
      'The energy stored in the inductor (E = ½ L i²) maintains current flow even after the input AC voltage drops below zero at π, forcing the diode to remain forward biased until the current decays to zero at extinction angle β.',
  },
  {
    id: 4,
    question: 'What is the average DC output voltage of a single-phase full-wave controlled bridge rectifier with continuous current and firing angle α?',
    options: [
      'Vdc = (Vm / π) · (1 + cos α)',
      'Vdc = (2Vm / π) · cos α',
      'Vdc = (2Vm / π) · sin α',
      'Vdc = (Vm / 2π) · (1 + cos α)',
    ],
    correctIndex: 1,
    explanation:
      'For continuous conduction in a fully controlled bridge, the thyristors conduct for 180° intervals from α to π+α, yielding Vdc = (1/π) ∫_α^(π+α) Vm sin(ωt) d(ωt) = (2Vm / π) cos α.',
  },
  {
    id: 5,
    question: 'What is the theoretical ripple factor (γ) of an uncontrolled single-phase full-wave rectifier with a pure resistive load?',
    options: ['1.21', '0.483', '0.042', '0.110'],
    correctIndex: 1,
    explanation:
      'The form factor FF = Vrms / Vdc = (Vm / √2) / (2Vm / π) = π / (2√2) ≈ 1.11. The ripple factor γ = √(FF² - 1) = √(1.11² - 1) ≈ 0.483 (48.3%).',
  },
  {
    id: 6,
    question: 'What is the ripple frequency and efficiency of a 3-phase 6-pulse bridge rectifier on a 50 Hz supply?',
    options: [
      '100 Hz, 81.2%',
      '150 Hz, 90.0%',
      '300 Hz, 99.8%',
      '600 Hz, 95.0%',
    ],
    correctIndex: 2,
    explanation:
      'A 3-phase 6-pulse bridge generates 6 output voltage crests per AC cycle: f_ripple = 6 × 50 Hz = 300 Hz. The ripple factor is only 4.2% and efficiency reaches ~99.8%.',
  },
  {
    id: 7,
    question: 'What is the key purpose of adding a Freewheeling Diode (FWD) across an inductive load?',
    options: [
      'To increase the peak inverse voltage of main switches',
      'To clamp load voltage to ≥ 0V, eliminate negative voltage dips, and dissipate inductive stored energy',
      'To convert single phase into three phase power',
      'To decrease the load resistance automatically',
    ],
    correctIndex: 1,
    explanation:
      'The freewheeling diode prevents the load voltage from swinging negative when the supply reverses, circulating inductive current locally and improving the power factor and average DC output.',
  },
  {
    id: 8,
    question: 'If the firing angle α of a single-phase fully controlled converter with continuous load current exceeds 90°, and an external DC source is connected, the converter acts as a:',
    options: [
      'Line-commutated Inverter (regenerating power from DC to AC)',
      'High-frequency cycloconverter',
      'Step-up DC-DC chopper',
      'Passive capacitive filter',
    ],
    correctIndex: 0,
    explanation:
      'When α > 90°, cos α becomes negative, resulting in a negative average output voltage (Vdc < 0). Since current Io remains unidirectional, power flow reverses (P = Vdc · Io < 0), meaning power is transferred from DC to the AC supply (line-commutated inverter mode).',
  },
];

export const VivaQuiz: React.FC = () => {
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    if (submitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleReset = () => {
    setUserAnswers({});
    setSubmitted(false);
  };

  const answeredCount = Object.keys(userAnswers).length;
  const score = QUIZ_QUESTIONS.reduce((acc, q) => {
    return acc + (userAnswers[q.id] === q.correctIndex ? 1 : 0);
  }, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-slate-100 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-sky-400" />
          <h2 className="text-base font-bold text-slate-100">
            Viva-Voce & Concept Assessment Quiz
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {submitted ? (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-slate-950 border border-slate-700 font-mono text-xs">
                Score:{' '}
                <strong className={score >= 6 ? 'text-emerald-400' : 'text-amber-400'}>
                  {score} / {QUIZ_QUESTIONS.length}
                </strong>{' '}
                ({((score / QUIZ_QUESTIONS.length) * 100).toFixed(0)}%)
              </span>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSubmitted(true)}
              disabled={answeredCount === 0}
              className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Submit Quiz ({answeredCount}/{QUIZ_QUESTIONS.length} answered)
            </button>
          )}
        </div>
      </div>

      {/* Score Banner when Submitted */}
      {submitted && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            score >= 6
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-amber-950/40 border-amber-500/50 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 shrink-0 text-amber-400" />
            <div>
              <div className="font-bold text-sm">
                {score >= 6 ? 'Excellent Performance!' : 'Good Effort! Keep Reviewing the Theory.'}
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                You answered {score} out of {QUIZ_QUESTIONS.length} questions correctly. Detailed solutions are highlighted below.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {QUIZ_QUESTIONS.map((q, idx) => {
          const selected = userAnswers[q.id];
          const isCorrect = submitted && selected === q.correctIndex;
          const isWrong = submitted && selected !== undefined && selected !== q.correctIndex;

          return (
            <div
              key={q.id}
              className={`p-4 rounded-lg border text-xs sm:text-sm transition-colors ${
                submitted
                  ? isCorrect
                    ? 'bg-emerald-950/20 border-emerald-500/40'
                    : isWrong
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : 'bg-slate-950 border-slate-800'
                  : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="font-semibold text-slate-200 leading-snug">
                  <span className="text-sky-400 font-mono mr-1.5">{idx + 1}.</span>
                  {q.question}
                </div>
                {submitted && (
                  <div className="shrink-0">
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                        <CheckCircle className="w-4 h-4" /> Correct
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-400 font-semibold text-xs">
                        <XCircle className="w-4 h-4" /> Incorrect
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {q.options.map((opt, optIdx) => {
                  const isThisSelected = selected === optIdx;
                  const isThisCorrect = submitted && optIdx === q.correctIndex;

                  let optClass = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';
                  if (submitted) {
                    if (isThisCorrect) {
                      optClass = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-semibold';
                    } else if (isThisSelected && !isThisCorrect) {
                      optClass = 'bg-rose-950/80 border-rose-500 text-rose-200 line-through';
                    }
                  } else if (isThisSelected) {
                    optClass = 'bg-sky-950 border-sky-500 text-sky-200 font-medium';
                  }

                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      className={`p-2.5 rounded-lg border text-left text-xs transition-all flex items-center gap-2 cursor-pointer ${optClass}`}
                    >
                      <span className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center shrink-0 font-mono text-[10px]">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Explanation after submission */}
              {submitted && (
                <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-400 bg-slate-900/60 p-2.5 rounded mt-2">
                  <strong className="text-slate-200">Explanation: </strong>
                  {q.explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
