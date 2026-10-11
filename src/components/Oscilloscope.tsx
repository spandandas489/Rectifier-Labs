import React, { useRef, useEffect, useState, useMemo } from 'react';
import { SimulationSample, RectifierParameters } from '../types/rectifier';
import { Play, Pause, Crosshair, ZoomIn, ZoomOut, SplitSquareVertical, Layers } from 'lucide-react';

interface OscilloscopeProps {
  samples: SimulationSample[];
  params: RectifierParameters;
  isPlaying: boolean;
  onTogglePlay: () => void;
  speed: number;
  onSpeedChange: (speed: number) => void;
  activeSampleIndex: number;
  onSelectSampleIndex: (idx: number) => void;
  msPerDiv: number;
  onMsPerDivChange: (val: number) => void;
}

export type ScopeDisplayMode = 'split' | 'combined' | 'voltage' | 'current';

export interface ChannelConfig {
  id: string;
  name: string;
  shortName: string;
  color: string;
  type: 'voltage' | 'current';
  enabled: boolean;
  scalePerDiv: number; // Volts or Amps
  unit: string;
}

export const Oscilloscope: React.FC<OscilloscopeProps> = ({
  samples,
  params,
  isPlaying,
  onTogglePlay,
  speed,
  onSpeedChange,
  activeSampleIndex,
  msPerDiv,
  onMsPerDivChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Display Mode: Default to 'split' so voltage and current waveforms are separated!
  const [displayMode, setDisplayMode] = useState<ScopeDisplayMode>('split');

  // Channels state
  const [channels, setChannels] = useState<Record<string, ChannelConfig>>({
    ch_vs: {
      id: 'ch_vs',
      name: 'Vs (Input AC Voltage)',
      shortName: 'Vs',
      color: '#eab308',
      type: 'voltage',
      enabled: true,
      scalePerDiv: 50,
      unit: 'V',
    },
    ch_vo: {
      id: 'ch_vo',
      name: 'Vo (Output Load Voltage)',
      shortName: 'Vo',
      color: '#06b6d4',
      type: 'voltage',
      enabled: true,
      scalePerDiv: 50,
      unit: 'V',
    },
    ch_io: {
      id: 'ch_io',
      name: 'Io (Load Current)',
      shortName: 'Io',
      color: '#10b981',
      type: 'current',
      enabled: true,
      scalePerDiv: 1,
      unit: 'A',
    },
    ch_is: {
      id: 'ch_is',
      name: 'Is (Input Source Current)',
      shortName: 'Is',
      color: '#a855f7',
      type: 'current',
      enabled: true,
      scalePerDiv: 1,
      unit: 'A',
    },
    ch_vdev: {
      id: 'ch_vdev',
      name: 'V_switch (Anode-Cathode)',
      shortName: 'V_sw',
      color: '#f97316',
      type: 'voltage',
      enabled: false,
      scalePerDiv: 50,
      unit: 'V',
    },
    ch_gate: {
      id: 'ch_gate',
      name: 'V_gate (Firing Trigger)',
      shortName: 'V_gate',
      color: '#ec4899',
      type: 'voltage',
      enabled: params.topology.includes('controlled'),
      scalePerDiv: 2,
      unit: 'V',
    },
  });

  // Measurement Cursors
  const [showCursors, setShowCursors] = useState(false);
  const [cursorA, setCursorA] = useState<number>(0.25);
  const [cursorB, setCursorB] = useState<number>(0.65);
  const [draggingCursor, setDraggingCursor] = useState<'A' | 'B' | null>(null);

  // Auto-adapt gate channel visibility
  useEffect(() => {
    setChannels((prev) => ({
      ...prev,
      ch_gate: {
        ...prev.ch_gate,
        enabled: params.topology.includes('controlled'),
      },
    }));
  }, [params.topology]);

  // Adjust default volts/div according to voltagePeak
  useEffect(() => {
    const defaultVDiv = params.voltagePeak > 150 ? 100 : params.voltagePeak > 70 ? 50 : 20;
    setChannels((prev) => ({
      ...prev,
      ch_vs: { ...prev.ch_vs, scalePerDiv: defaultVDiv },
      ch_vo: { ...prev.ch_vo, scalePerDiv: defaultVDiv },
      ch_vdev: { ...prev.ch_vdev, scalePerDiv: defaultVDiv },
    }));
  }, [params.voltagePeak]);

  const toggleChannel = (id: string) => {
    setChannels((prev) => ({
      ...prev,
      [id]: { ...prev[id], enabled: !prev[id].enabled },
    }));
  };

  const updateScalePerDiv = (id: string, factor: number) => {
    setChannels((prev) => {
      const current = prev[id].scalePerDiv;
      const next = Math.max(0.2, Math.min(500, current * factor));
      return {
        ...prev,
        [id]: { ...prev[id], scalePerDiv: Number(next.toFixed(1)) },
      };
    });
  };

  // Canvas drawing effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = rect.height;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Screen Background
    ctx.fillStyle = '#060d15';
    ctx.fillRect(0, 0, width, height);

    const leftMargin = 54;
    const rightMargin = displayMode === 'combined' ? 54 : 16;
    const plotWidth = width - leftMargin - rightMargin;
    const xStart = leftMargin;
    const xEnd = leftMargin + plotWidth;

    const numHDivs = 10;
    const divWidth = plotWidth / numHDivs;
    const timeWindow = numHDivs * (msPerDiv * 1e-3);

    // Number formatter for Y-axis division values
    const formatYVal = (val: number, unit: string) => {
      if (Math.abs(val) < 1e-4) {
        return unit === 'A' ? '0.0 A' : '0 V';
      }
      const sign = val > 0 ? '+' : '';
      const abs = Math.abs(val);
      if (abs >= 100) {
        return `${sign}${Math.round(val)} ${unit}`;
      } else if (abs >= 10) {
        return `${sign}${Number(val.toFixed(1))} ${unit}`;
      } else {
        return `${sign}${Number(val.toFixed(2))} ${unit}`;
      }
    };

    interface AxisConfig {
      scalePerDiv: number;
      unit: string;
      color: string;
      secondary?: {
        scalePerDiv: number;
        unit: string;
        color: string;
      };
    }

    // Helper to draw an oscilloscope graticule grid with labeled Y-axes
    const drawGrid = (
      yTop: number,
      h: number,
      numVDivs: number,
      label: string,
      axisConfig: AxisConfig,
      showTimeAxis = false
    ) => {
      const divHeight = h / numVDivs;
      const centerY = yTop + h / 2;

      // Left gutter background for Y-axis scale
      ctx.fillStyle = '#03080e';
      ctx.fillRect(0, yTop, xStart, h);

      if (axisConfig.secondary) {
        // Right gutter background for secondary Y-axis scale
        ctx.fillRect(xEnd, yTop, rightMargin, h);
      }

      // Plot area background
      ctx.fillStyle = '#060d15';
      ctx.fillRect(xStart, yTop, plotWidth, h);

      // Outer border of plot area
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(xStart, yTop, plotWidth, h);

      // Minor vertical grid lines
      ctx.strokeStyle = '#0f2438';
      ctx.lineWidth = 1;
      for (let i = 1; i < numHDivs; i++) {
        const x = xStart + i * divWidth;
        ctx.beginPath();
        ctx.moveTo(x, yTop);
        ctx.lineTo(x, yTop + h);
        ctx.stroke();
      }

      // Minor horizontal grid lines and labeled Y-axis values
      for (let j = 0; j <= numVDivs; j++) {
        const y = yTop + j * divHeight;
        const divOffset = numVDivs / 2 - j; // Divisions offset from center (positive = up, negative = down)
        const isCenter = divOffset === 0;

        // Grid line across plot
        ctx.strokeStyle = isCenter ? '#1e3a5f' : '#0f2438';
        ctx.lineWidth = isCenter ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(xStart, y);
        ctx.lineTo(xEnd, y);
        ctx.stroke();

        // Left Y-axis tick mark
        ctx.strokeStyle = isCenter ? axisConfig.color : '#334155';
        ctx.lineWidth = isCenter ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(xStart - 5, y);
        ctx.lineTo(xStart, y);
        ctx.stroke();

        // Primary Left Y-axis value calculation & label
        const leftVal = divOffset * axisConfig.scalePerDiv;
        const leftText = formatYVal(leftVal, axisConfig.unit);

        ctx.font = isCenter ? 'bold 10px monospace' : '9.5px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = j === 0 ? 'top' : j === numVDivs ? 'bottom' : 'middle';

        if (isCenter) {
          // Highlight zero/ground reference with arrow marker
          ctx.fillStyle = axisConfig.color;
          ctx.beginPath();
          ctx.moveTo(xStart - 2, centerY);
          ctx.lineTo(xStart - 8, centerY - 4);
          ctx.lineTo(xStart - 8, centerY + 4);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.fillText(leftText, xStart - 10, y);
        } else {
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(leftText, xStart - 7, y);
        }

        // Secondary Right Y-axis (for combined mode)
        if (axisConfig.secondary) {
          const rightVal = divOffset * axisConfig.secondary.scalePerDiv;
          const rightText = formatYVal(rightVal, axisConfig.secondary.unit);

          // Right tick mark
          ctx.strokeStyle = isCenter ? axisConfig.secondary.color : '#334155';
          ctx.beginPath();
          ctx.moveTo(xEnd, y);
          ctx.lineTo(xEnd + 5, y);
          ctx.stroke();

          ctx.font = isCenter ? 'bold 10px monospace' : '9.5px monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = j === 0 ? 'top' : j === numVDivs ? 'bottom' : 'middle';

          if (isCenter) {
            ctx.fillStyle = axisConfig.secondary.color;
            ctx.beginPath();
            ctx.moveTo(xEnd + 2, centerY);
            ctx.lineTo(xEnd + 8, centerY - 4);
            ctx.lineTo(xEnd + 8, centerY + 4);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.fillText(rightText, xEnd + 10, y);
          } else {
            ctx.fillStyle = '#6ee7b7';
            ctx.fillText(rightText, xEnd + 7, y);
          }
        }
      }

      // Center crosshair tick marks (0.2 div ticks along horizontal center)
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 1;
      for (let i = 0; i <= numHDivs * 5; i++) {
        const x = xStart + (i * divWidth) / 5;
        const tickH = i % 5 === 0 ? 6 : 3;
        ctx.beginPath();
        ctx.moveTo(x, centerY - tickH / 2);
        ctx.lineTo(x, centerY + tickH / 2);
        ctx.stroke();
      }

      // Vertical center line tick marks
      const centerX = xStart + (numHDivs / 2) * divWidth;
      for (let j = 0; j <= numVDivs * 5; j++) {
        const y = yTop + (j * divHeight) / 5;
        const tickW = j % 5 === 0 ? 6 : 3;
        ctx.beginPath();
        ctx.moveTo(centerX - tickW / 2, y);
        ctx.lineTo(centerX + tickW / 2, y);
        ctx.stroke();
      }

      // Time (X-axis) division values along bottom
      if (showTimeAxis) {
        for (let i = 0; i <= numHDivs; i += 2) {
          const x = xStart + i * divWidth;
          const tMs = i * msPerDiv;
          ctx.fillStyle = '#64748b';
          ctx.font = '9px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(`${tMs}ms`, x, yTop + h - 14);
        }
      }

      // Pane Label Badges inside plot
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;

      // Primary Badge (Left Y Axis info)
      const badgeText = `${label} | ${axisConfig.scalePerDiv} ${axisConfig.unit}/div`;
      ctx.font = 'bold 9.5px monospace';
      const textWidth = ctx.measureText(badgeText).width;
      ctx.fillRect(xStart + 8, yTop + 6, textWidth + 14, 18);
      ctx.strokeRect(xStart + 8, yTop + 6, textWidth + 14, 18);
      ctx.fillStyle = axisConfig.color;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, xStart + 15, yTop + 15);

      // Secondary Badge if present (Right Y Axis info)
      if (axisConfig.secondary) {
        const secBadgeText = `CURRENT | ${axisConfig.secondary.scalePerDiv} ${axisConfig.secondary.unit}/div (Right)`;
        const secWidth = ctx.measureText(secBadgeText).width;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(xEnd - secWidth - 22, yTop + 6, secWidth + 14, 18);
        ctx.strokeRect(xEnd - secWidth - 22, yTop + 6, secWidth + 14, 18);
        ctx.fillStyle = axisConfig.secondary.color;
        ctx.fillText(secBadgeText, xEnd - secWidth - 15, yTop + 15);
      }
    };

    // Helper to draw a single channel trace inside a given pane
    const drawTrace = (
      getValue: (s: SimulationSample) => number,
      scalePerDiv: number,
      color: string,
      yTop: number,
      paneHeight: number,
      numVDivs: number,
      isDashed = false
    ) => {
      const divHeight = paneHeight / numVDivs;
      const centerY = yTop + paneHeight / 2;
      const N = samples.length;
      if (N < 2) return;

      ctx.save();
      // Clip to grid plot area to prevent traces from drawing into the Y-axis margins
      ctx.beginPath();
      ctx.rect(xStart, yTop, plotWidth, paneHeight);
      ctx.clip();

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.shadowColor = color;
      ctx.shadowBlur = 4;
      if (isDashed) {
        ctx.setLineDash([4, 4]);
      } else {
        ctx.setLineDash([]);
      }

      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const x = xStart + (i / (N - 1)) * plotWidth;
        const val = getValue(samples[i]);
        const pixelOffset = (val / scalePerDiv) * divHeight;
        const y = centerY - pixelOffset;
        const clampedY = Math.max(yTop + 1, Math.min(yTop + paneHeight - 1, y));

        if (i === 0) {
          ctx.moveTo(x, clampedY);
        } else {
          ctx.lineTo(x, clampedY);
        }
      }
      ctx.stroke();
      ctx.restore();
    };

    if (displayMode === 'split') {
      // -------------------------------------------------------------
      // SPLIT SCREEN: TOP PANE = VOLTAGES, BOTTOM PANE = CURRENTS
      // -------------------------------------------------------------
      const halfHeight = height / 2;
      const numVDivsPane = 4;
      const vScale = channels.ch_vo.enabled ? channels.ch_vo.scalePerDiv : channels.ch_vs.scalePerDiv;
      const iScale = channels.ch_io.enabled ? channels.ch_io.scalePerDiv : channels.ch_is.scalePerDiv;

      // Pane 1: Voltages (Top)
      drawGrid(
        0,
        halfHeight,
        numVDivsPane,
        'VOLTAGE PANE',
        {
          scalePerDiv: vScale,
          unit: 'V',
          color: '#38bdf8',
        },
        false
      );

      // Pane 2: Currents (Bottom)
      drawGrid(
        halfHeight,
        halfHeight,
        numVDivsPane,
        'CURRENT PANE',
        {
          scalePerDiv: iScale,
          unit: 'A',
          color: '#10b981',
        },
        true
      );

      // Draw Voltage Traces in Top Pane
      if (channels.ch_vs.enabled) {
        if (params.topology.includes('three_phase')) {
          drawTrace((s) => s.vSource, channels.ch_vs.scalePerDiv, '#ef4444', 0, halfHeight, numVDivsPane);
          drawTrace((s) => s.vSourceB || 0, channels.ch_vs.scalePerDiv, '#eab308', 0, halfHeight, numVDivsPane);
          drawTrace((s) => s.vSourceC || 0, channels.ch_vs.scalePerDiv, '#3b82f6', 0, halfHeight, numVDivsPane);
        } else {
          drawTrace((s) => s.vSource, channels.ch_vs.scalePerDiv, channels.ch_vs.color, 0, halfHeight, numVDivsPane);
        }
      }
      if (channels.ch_vdev.enabled) {
        drawTrace((s) => s.vDevice, channels.ch_vdev.scalePerDiv, channels.ch_vdev.color, 0, halfHeight, numVDivsPane);
      }
      if (channels.ch_vo.enabled) {
        drawTrace((s) => s.vOutput, channels.ch_vo.scalePerDiv, channels.ch_vo.color, 0, halfHeight, numVDivsPane);
      }
      if (channels.ch_gate.enabled && params.topology.includes('controlled')) {
        drawTrace((s) => s.vGate || 0, channels.ch_gate.scalePerDiv, channels.ch_gate.color, 0, halfHeight, numVDivsPane);
      }

      // Draw Current Traces in Bottom Pane
      if (channels.ch_is.enabled) {
        drawTrace((s) => s.iSource, channels.ch_is.scalePerDiv, channels.ch_is.color, halfHeight, halfHeight, numVDivsPane);
      }
      if (channels.ch_io.enabled) {
        drawTrace((s) => s.iOutput, channels.ch_io.scalePerDiv, channels.ch_io.color, halfHeight, halfHeight, numVDivsPane);
      }
    } else if (displayMode === 'voltage') {
      // -------------------------------------------------------------
      // VOLTAGE ONLY PANE
      // -------------------------------------------------------------
      const numVDivs = 8;
      const vScale = channels.ch_vo.enabled ? channels.ch_vo.scalePerDiv : channels.ch_vs.scalePerDiv;
      drawGrid(
        0,
        height,
        numVDivs,
        'VOLTAGE SCOPE',
        {
          scalePerDiv: vScale,
          unit: 'V',
          color: '#38bdf8',
        },
        true
      );

      if (channels.ch_vs.enabled) {
        if (params.topology.includes('three_phase')) {
          drawTrace((s) => s.vSource, channels.ch_vs.scalePerDiv, '#ef4444', 0, height, numVDivs);
          drawTrace((s) => s.vSourceB || 0, channels.ch_vs.scalePerDiv, '#eab308', 0, height, numVDivs);
          drawTrace((s) => s.vSourceC || 0, channels.ch_vs.scalePerDiv, '#3b82f6', 0, height, numVDivs);
        } else {
          drawTrace((s) => s.vSource, channels.ch_vs.scalePerDiv, channels.ch_vs.color, 0, height, numVDivs);
        }
      }
      if (channels.ch_vdev.enabled) {
        drawTrace((s) => s.vDevice, channels.ch_vdev.scalePerDiv, channels.ch_vdev.color, 0, height, numVDivs);
      }
      if (channels.ch_vo.enabled) {
        drawTrace((s) => s.vOutput, channels.ch_vo.scalePerDiv, channels.ch_vo.color, 0, height, numVDivs);
      }
      if (channels.ch_gate.enabled && params.topology.includes('controlled')) {
        drawTrace((s) => s.vGate || 0, channels.ch_gate.scalePerDiv, channels.ch_gate.color, 0, height, numVDivs);
      }
    } else if (displayMode === 'current') {
      // -------------------------------------------------------------
      // CURRENT ONLY PANE
      // -------------------------------------------------------------
      const numVDivs = 8;
      const iScale = channels.ch_io.enabled ? channels.ch_io.scalePerDiv : channels.ch_is.scalePerDiv;
      drawGrid(
        0,
        height,
        numVDivs,
        'CURRENT SCOPE',
        {
          scalePerDiv: iScale,
          unit: 'A',
          color: '#10b981',
        },
        true
      );

      if (channels.ch_is.enabled) {
        drawTrace((s) => s.iSource, channels.ch_is.scalePerDiv, channels.ch_is.color, 0, height, numVDivs);
      }
      if (channels.ch_io.enabled) {
        drawTrace((s) => s.iOutput, channels.ch_io.scalePerDiv, channels.ch_io.color, 0, height, numVDivs);
      }
    } else {
      // -------------------------------------------------------------
      // COMBINED OVERLAY PANE (Dual-Scale: Left = Volts, Right = Amps)
      // -------------------------------------------------------------
      const numVDivs = 8;
      const vScale = channels.ch_vo.enabled ? channels.ch_vo.scalePerDiv : channels.ch_vs.scalePerDiv;
      const iScale = channels.ch_io.enabled ? channels.ch_io.scalePerDiv : channels.ch_is.scalePerDiv;
      drawGrid(
        0,
        height,
        numVDivs,
        'VOLTAGE',
        {
          scalePerDiv: vScale,
          unit: 'V',
          color: '#38bdf8',
          secondary: {
            scalePerDiv: iScale,
            unit: 'A',
            color: '#10b981',
          },
        },
        true
      );

      if (channels.ch_vs.enabled) {
        drawTrace((s) => s.vSource, channels.ch_vs.scalePerDiv, channels.ch_vs.color, 0, height, numVDivs);
      }
      if (channels.ch_vdev.enabled) {
        drawTrace((s) => s.vDevice, channels.ch_vdev.scalePerDiv, channels.ch_vdev.color, 0, height, numVDivs);
      }
      if (channels.ch_vo.enabled) {
        drawTrace((s) => s.vOutput, channels.ch_vo.scalePerDiv, channels.ch_vo.color, 0, height, numVDivs);
      }
      if (channels.ch_is.enabled) {
        drawTrace((s) => s.iSource, channels.ch_is.scalePerDiv, channels.ch_is.color, 0, height, numVDivs);
      }
      if (channels.ch_io.enabled) {
        drawTrace((s) => s.iOutput, channels.ch_io.scalePerDiv, channels.ch_io.color, 0, height, numVDivs);
      }
      if (channels.ch_gate.enabled && params.topology.includes('controlled')) {
        drawTrace((s) => s.vGate || 0, channels.ch_gate.scalePerDiv, channels.ch_gate.color, 0, height, numVDivs);
      }
    }

    // Active scanhead marker
    if (activeSampleIndex >= 0 && activeSampleIndex < samples.length) {
      const curSample = samples[activeSampleIndex];
      const tRel = (curSample.time - samples[0].time) % timeWindow;
      const curX = xStart + (tRel / timeWindow) * plotWidth;

      ctx.save();
      ctx.beginPath();
      ctx.rect(xStart, 0, plotWidth, height);
      ctx.clip();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(curX, 0);
      ctx.lineTo(curX, height);
      ctx.stroke();
      ctx.restore();
    }

    // Cursors
    if (showCursors) {
      const xA = xStart + cursorA * plotWidth;
      const xB = xStart + cursorB * plotWidth;

      ctx.save();
      ctx.beginPath();
      ctx.rect(xStart, 0, plotWidth, height);
      ctx.clip();

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(xA, 0);
      ctx.lineTo(xA, height);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText('A', xA + 4, 16);

      ctx.strokeStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(xB, 0);
      ctx.lineTo(xB, height);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.fillText('B', xB + 4, 16);
      ctx.restore();
    }
  }, [samples, channels, msPerDiv, displayMode, showCursors, cursorA, cursorB, activeSampleIndex, params]);

  // Handle Dragging Cursors
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!showCursors) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const leftMargin = 54;
    const rightMargin = displayMode === 'combined' ? 54 : 16;
    const plotWidth = rect.width - leftMargin - rightMargin;
    const mouseX = (e.clientX - rect.left - leftMargin) / plotWidth;

    if (Math.abs(mouseX - cursorA) < 0.05) setDraggingCursor('A');
    else if (Math.abs(mouseX - cursorB) < 0.05) setDraggingCursor('B');
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingCursor) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const leftMargin = 54;
    const rightMargin = displayMode === 'combined' ? 54 : 16;
    const plotWidth = rect.width - leftMargin - rightMargin;
    const mouseX = Math.max(0, Math.min(1, (e.clientX - rect.left - leftMargin) / plotWidth));

    if (draggingCursor === 'A') setCursorA(mouseX);
    if (draggingCursor === 'B') setCursorB(mouseX);
  };

  const handleMouseUp = () => setDraggingCursor(null);

  const cursorCalculations = useMemo(() => {
    const totalTimeMs = 10 * msPerDiv;
    const tA = cursorA * totalTimeMs;
    const tB = cursorB * totalTimeMs;
    const deltaT = Math.abs(tB - tA);
    const freq = deltaT > 0.01 ? (1000 / deltaT).toFixed(1) : '---';

    const N = samples.length;
    const idxA = Math.max(0, Math.min(N - 1, Math.round(cursorA * (N - 1))));
    const idxB = Math.max(0, Math.min(N - 1, Math.round(cursorB * (N - 1))));
    const sA = samples[idxA];
    const sB = samples[idxB];

    const voA = sA?.vOutput ?? 0;
    const voB = sB?.vOutput ?? 0;
    const ioA = sA?.iOutput ?? 0;
    const ioB = sB?.iOutput ?? 0;
    const deltaVo = voB - voA;
    const deltaIo = ioB - ioA;

    return {
      tA: tA.toFixed(2),
      tB: tB.toFixed(2),
      deltaT: deltaT.toFixed(2),
      freq,
      voA: voA.toFixed(1),
      voB: voB.toFixed(1),
      deltaVo: deltaVo.toFixed(1),
      ioA: ioA.toFixed(2),
      ioB: ioB.toFixed(2),
      deltaIo: deltaIo.toFixed(2),
    };
  }, [cursorA, cursorB, msPerDiv, samples]);

  const currentSample = samples[activeSampleIndex] || null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col text-slate-100 shadow-xl">
      {/* Top Header & Display Mode Tabs */}
      <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Model and Mode Selector */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-sky-950 border border-sky-800/80 text-sky-400 font-mono text-xs font-semibold">
            <span>DSO-2050X</span>
            <span className="text-sky-600">|</span>
            <span className="text-slate-300">Dual-Beam Scope</span>
          </div>

          {/* Waveform View Switcher (Separate Voltage & Current!) */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setDisplayMode('split')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                displayMode === 'split'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Separate Voltage (Top) and Current (Bottom) Screens"
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>Separate V & I</span>
            </button>
            <button
              onClick={() => setDisplayMode('voltage')}
              className={`px-2 py-1 rounded transition-colors ${
                displayMode === 'voltage'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Voltage Only
            </button>
            <button
              onClick={() => setDisplayMode('current')}
              className={`px-2 py-1 rounded transition-colors ${
                displayMode === 'current'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Current Only
            </button>
            <button
              onClick={() => setDisplayMode('combined')}
              className={`px-2 py-1 rounded transition-colors ${
                displayMode === 'combined'
                  ? 'bg-sky-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Overlay
            </button>
          </div>
        </div>

        {/* Play/Pause & Speed */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              isPlaying
                ? 'bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40'
                : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'PAUSE' : 'RUN'}</span>
          </button>

          <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60 text-xs">
            {[0.5, 1, 2].map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2 py-0.5 rounded font-mono transition-colors ${
                  speed === s ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCursors(!showCursors)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border transition-colors ${
              showCursors
                ? 'bg-sky-950 text-sky-300 border-sky-600'
                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cursors</span>
          </button>
        </div>
      </div>

      {/* Main CRT Canvas */}
      <div className="relative w-full aspect-[16/10] min-h-[360px] max-h-[500px] bg-[#060d15]">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="w-full h-full cursor-crosshair block"
        />

        {/* Live Top-Left On-Screen Readouts */}
        <div className="absolute top-2 left-[62px] pointer-events-none flex flex-wrap gap-2 text-[11px] font-mono">
          <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded px-2 py-0.5 text-slate-300">
            TB: <span className="text-amber-400 font-bold">{msPerDiv} ms/div</span>
          </div>
          {channels.ch_vo.enabled && (
            <div className="bg-slate-900/80 backdrop-blur-sm border border-cyan-500/40 rounded px-2 py-0.5 text-cyan-400">
              Vo: {channels.ch_vo.scalePerDiv} V/div
            </div>
          )}
          {channels.ch_io.enabled && (
            <div className="bg-slate-900/80 backdrop-blur-sm border border-emerald-500/40 rounded px-2 py-0.5 text-emerald-400">
              Io: {channels.ch_io.scalePerDiv} A/div
            </div>
          )}
        </div>

        {/* Live Instantaneous Probe Readouts at Top Right */}
        {currentSample && (
          <div className={`absolute top-2 ${displayMode === 'combined' ? 'right-[62px]' : 'right-3'} pointer-events-none bg-slate-950/85 backdrop-blur-sm border border-slate-800 rounded px-2.5 py-1 text-[11px] font-mono space-y-0.5 text-right`}>
            <div className="text-cyan-400">
              Vo(t) = <span className="font-bold">{currentSample.vOutput.toFixed(1)} V</span>
            </div>
            <div className="text-emerald-400">
              Io(t) = <span className="font-bold">{currentSample.iOutput.toFixed(2)} A</span>
            </div>
            <div className="text-purple-400">
              Is(t) = <span className="font-bold">{currentSample.iSource.toFixed(2)} A</span>
            </div>
          </div>
        )}

        {/* Measurement Cursors readout */}
        {showCursors && (
          <div className="absolute bottom-3 left-[62px] bg-slate-950/95 backdrop-blur-md border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-300 space-y-1.5 shadow-xl pointer-events-none min-w-[220px]">
            <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex justify-between">
              <span>Dual Measuring Cursors</span>
              <span className="text-emerald-400 font-bold">{cursorCalculations.freq} Hz</span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] pt-1 border-t border-slate-800">
              <span className="text-sky-400">tA: {cursorCalculations.tA} ms</span>
              <span className="text-amber-400">tB: {cursorCalculations.tB} ms</span>
              <span className="text-sky-400">Vo_A: {cursorCalculations.voA} V</span>
              <span className="text-amber-400">Vo_B: {cursorCalculations.voB} V</span>
              <span className="text-emerald-400">Io_A: {cursorCalculations.ioA} A</span>
              <span className="text-emerald-400">Io_B: {cursorCalculations.ioB} A</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
              <span className="text-white font-bold">Δt: {cursorCalculations.deltaT} ms</span>
              <span className="text-cyan-300 font-bold">ΔVo: {cursorCalculations.deltaVo} V</span>
            </div>
          </div>
        )}
      </div>

      {/* DSO Controls Panel (Channels & Timebase) */}
      <div className="bg-slate-950 p-3 border-t border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Channel Activation & Scale Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {Object.values(channels).map((ch) => (
            <div
              key={ch.id}
              className={`flex items-center rounded-lg border px-2 py-1 transition-all ${
                ch.enabled
                  ? 'bg-slate-900 border-slate-700 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 opacity-60'
              }`}
            >
              <button
                onClick={() => toggleChannel(ch.id)}
                className="flex items-center gap-1.5 font-medium mr-2"
                style={{ color: ch.enabled ? ch.color : '#64748b' }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: ch.enabled ? ch.color : '#475569' }}
                />
                <span className="truncate max-w-[110px]">{ch.shortName}</span>
              </button>

              {ch.enabled && (
                <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
                  <button
                    onClick={() => updateScalePerDiv(ch.id, 0.5)}
                    className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                    title="Scale In"
                  >
                    <ZoomIn className="w-3 h-3" />
                  </button>
                  <span className="font-mono text-[10px] text-slate-300 w-12 text-center">
                    {ch.scalePerDiv}
                    {ch.unit}
                  </span>
                  <button
                    onClick={() => updateScalePerDiv(ch.id, 2)}
                    className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                    title="Scale Out"
                  >
                    <ZoomOut className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Timebase (Time/Div) Control */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-slate-400 font-medium">Time/Div:</span>
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
            {[2, 5, 10, 20].map((tVal) => (
              <button
                key={tVal}
                onClick={() => onMsPerDivChange(tVal)}
                className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                  msPerDiv === tVal
                    ? 'bg-sky-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tVal}ms
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
