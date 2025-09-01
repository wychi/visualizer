import React, { useEffect, useMemo, useRef, useState } from 'react';

// Helpers
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const asInt = (v: any) => Math.round(Number(v) || 0);
const clampInt = (v: any, lo: number, hi: number) => clamp(asInt(v), lo, hi);

export default function TwoNumberSolver() {
  // Given (integers)
  const [sum, setSum] = useState(69);
  const [diff, setDiff] = useState(27);

  // Student's guess (integers)
  const [xGuess, setXGuess] = useState(0);
  const [yGuess, setYGuess] = useState(sum);

  // Drag state for number-line pointers
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dragging, setDragging] = useState<null | 'x' | 'y'>(null);

  // Audio context for prank scream (fixed duplicate decl)
  const audioCtxRef = useRef<any>(null);

  // Hints
  const [showHint, setShowHint] = useState(false);

  // Prank: show once on first "Jump to solution" click
  const [prankShown, setPrankShown] = useState(false);
  const [prankOpen, setPrankOpen] = useState(false);

  // Reference values (not drawn)
  const x = useMemo(() => (sum + diff) / 2, [sum, diff]);
  const y = useMemo(() => (sum - diff) / 2, [sum, diff]);

  // --- Number line set up (range [0, sum]) ---
  const VB_W = 760; // internal width for SVG viewBox
  const VB_H = 260; // internal height for SVG viewBox
  const padding = 48;
  const baselineY = Math.round(VB_H * 0.55);
  const max = Math.max(1, sum); // ensure nonzero span

  // Map value -> px in internal SVG coords
  const scale = (v: number) => padding + (v / max) * (VB_W - 2 * padding);

  // Convert clientX -> internal SVG x (handles responsive scaling)
  const clientXToInternalX = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return 0;
    const rect = svg.getBoundingClientRect();
    const scaleX = VB_W / rect.width; // internal / css
    return (clientX - rect.left) * scaleX;
  };

  // px in internal coords -> value
  const pxToValue = (px: number) => clamp(((px - padding) / (VB_W - 2 * padding)) * max, 0, max);

  // For annotations
  const leftXY = Math.min(xGuess, yGuess);
  const rightXY = Math.max(xGuess, yGuess);
  const diffAbs = Math.abs(xGuess - yGuess);
  const sumGuess = xGuess + yGuess;

  const sumOK = sumGuess === sum;
  const diffOK = diffAbs === Math.abs(diff);

  // Keep inline SVG action buttons fully on-screen by clamping their center X
  // 5-item row: Hint (80 wide) and four 120-wide buttons → half width ≈ 340
  const ACTION_GROUP_HALF = 340;
  const actionCX = clamp(
    scale((xGuess + yGuess) / 2),
    ACTION_GROUP_HALF + 8,
    VB_W - ACTION_GROUP_HALF - 8
  );

  // Ticks (integers; dense when sum <= 20)
  const tickCount = 10;
  const ticks = sum <= 20
    ? Array.from({ length: sum + 1 }, (_, i) => i)
    : Array.from({ length: tickCount + 1 }, (_, i) => Math.round((i * sum) / tickCount));

  // Drag handlers
  const startDrag = (which: 'x' | 'y') => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDragging(which);
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    const internalX = clientXToInternalX(e.clientX);
    const val = clampInt(pxToValue(internalX), 0, sum);
    if (dragging === 'x') setXGuess(val);
    if (dragging === 'y') setYGuess(val);
  };
  const onMouseUp = () => setDragging(null);

  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging) return;
    const touch = e.touches[0];
    if (!touch) return;
    const internalX = clientXToInternalX(touch.clientX);
    const val = clampInt(pxToValue(internalX), 0, sum);
    if (dragging === 'x') setXGuess(val);
    if (dragging === 'y') setYGuess(val);
  };
  const onTouchEnd = () => setDragging(null);

  // ---- Helpers for actions ----
  const applyPair = (nx: number, ny: number) => {
    setXGuess(clampInt(nx, 0, sum));
    setYGuess(clampInt(ny, 0, sum));
  };

  const proposeFarther = () => {
    if (xGuess <= yGuess) {
      const canLeft = xGuess - 1 >= 0;
      const canRight = yGuess + 1 <= sum;
      if (canLeft && canRight) return [xGuess - 1, yGuess + 1] as const; // distance +2
      if (canRight) return [xGuess, yGuess + 1] as const;
      if (canLeft) return [xGuess - 1, yGuess] as const;
      return [xGuess, yGuess] as const;
    } else {
      const canRight = xGuess + 1 <= sum;
      const canLeft = yGuess - 1 >= 0;
      if (canRight && canLeft) return [xGuess + 1, yGuess - 1] as const;
      if (canRight) return [xGuess + 1, yGuess] as const;
      if (canLeft) return [xGuess, yGuess - 1] as const;
      return [xGuess, yGuess] as const;
    }
  };

  const proposeCloser = () => {
    if (xGuess <= yGuess) {
      const gap = yGuess - xGuess;
      const canRight = xGuess + 1 <= sum;
      const canLeft = yGuess - 1 >= 0;
      if (gap >= 2 && canRight && canLeft) return [xGuess + 1, yGuess - 1] as const; // distance −2
      if (gap >= 1) {
        if (canRight) return [xGuess + 1, yGuess] as const;
        if (canLeft) return [xGuess, yGuess - 1] as const;
      }
      return [xGuess, yGuess] as const;
    } else {
      const gap = xGuess - yGuess;
      const canLeft = xGuess - 1 >= 0;
      const canRight = yGuess + 1 <= sum;
      if (gap >= 2 && canLeft && canRight) return [xGuess - 1, yGuess + 1] as const;
      if (gap >= 1) {
        if (canLeft) return [xGuess - 1, yGuess] as const;
        if (canRight) return [xGuess, yGuess + 1] as const;
      }
      return [xGuess, yGuess] as const;
    }
  };

  const canMove = (pair: readonly [number, number]) => pair[0] !== xGuess || pair[1] !== yGuess;

  const incBothPair: [number, number] = (xGuess + 1 <= sum && yGuess + 1 <= sum) ? [xGuess + 1, yGuess + 1] : [xGuess, yGuess];
  const decBothPair: [number, number] = (xGuess - 1 >= 0 && yGuess - 1 >= 0) ? [xGuess - 1, yGuess - 1] : [xGuess, yGuess];
  const fartherPair = proposeFarther();
  const closerPair = proposeCloser();

  const canIncBoth = canMove(incBothPair);
  const canDecBoth = canMove(decBothPair);
  const canFarther = canMove(fartherPair);
  const canCloser = canMove(closerPair);

  const directHintLines = useMemo(() => {
    const lines: string[] = [];
    if (!sumOK) {
      if (sumGuess < sum) {
        lines.push(`Sum ${sumGuess} is too small by ${sum - sumGuess}.`);
        lines.push('Try "Increase both by 1" or drag both right.');
      } else {
        lines.push(`Sum ${sumGuess} is too large by ${sumGuess - sum}.`);
        lines.push('Try "Decrease both by 1" or drag both left.');
      }
    }
    if (!diffOK) {
      if (diffAbs < Math.abs(diff)) {
        lines.push(`Difference between the two numbers ${diffAbs} is too small by ${Math.abs(diff) - diffAbs}.`);
        lines.push('Move points farther apart.');
      } else {
        lines.push(`Difference between the two numbers ${diffAbs} is too big by ${diffAbs - Math.abs(diff)}.`);
        lines.push('Move points closer together.');
      }
    }
    if (lines.length === 0) lines.push('Great! Both sum and distance match.');
    return lines;
  }, [sumOK, diffOK, sumGuess, sum, diffAbs, diff]);

  // Play a short "scream" using the Web Audio API (triggered by user click)
  const playScream = () => {
    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current as AudioContext;
      if (ctx.state === 'suspended') ctx.resume();

      const master = ctx.createGain();
      master.gain.value = 0.0001;
      master.connect(ctx.destination);

      // Noise burst
      const noiseLen = Math.floor(1.2 * ctx.sampleRate);
      const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
      const ch = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / noiseLen);
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 700;
      noise.connect(hp);
      hp.connect(master);

      // Sawtooth dive
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      const now = ctx.currentTime;
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.9);
      const oGain = ctx.createGain();
      oGain.gain.setValueAtTime(0.0001, now);
      oGain.gain.exponentialRampToValueAtTime(0.7, now + 0.06);
      oGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
      osc.connect(oGain);
      oGain.connect(master);

      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.9, now + 0.03);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      noise.start(now);
      noise.stop(now + 0.7);
      osc.start(now);
      osc.stop(now + 1.1);
    } catch {}
  };

  // Keep guesses in range when sum changes
  const handleSumChange = (v: number) => {
    setSum(v);
    setXGuess((prev) => clampInt(prev, 0, v));
    setYGuess((prev) => clampInt(prev, 0, v));
  };

  // Internal non-UI tests (console only)
  useEffect(() => {
    const cases = [
      { S: 69, D: 27 },
      { S: 10, D: 4 },
      { S: 10, D: 0 },
      { S: 1, D: 1 },
      { S: 100, D: 50 },
      { S: 7, D: 3 },
      { S: 0, D: 0 },
      { S: 9, D: -3 },
      { S: 8, D: 2 },
      { S: 2, D: -2 },
      { S: 3, D: 1 },
      { S: 5, D: -1 },
    ];
    cases.forEach(({ S, D }) => {
      const X = (S + D) / 2;
      const Y = (S - D) / 2;
      console.assert(Math.abs(X + Y - S) < 1e-9, 'sum check failed', { S, D, X, Y });
      console.assert(Math.abs(X - Y - D) < 1e-9, 'diff check failed', { S, D, X, Y });
    });
  }, []);

  // === RENDER ===
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Two Numbers Solver (Iterative + Visualizations)</h1>

      {/* Controls */}
      <div className="grid grid-cols-1 gap-4">
        {/* Given */}
        <div className="rounded-2xl shadow p-4 space-y-3">
          <h2 className="font-semibold">Given</h2>
          <label className="block text-sm">Target sum</label>
          <input
            type="number"
            value={sum}
            min={0}
            step={1}
            onChange={(e) => {
              const v = Math.max(0, asInt(e.target.value));
              handleSumChange(v);
            }}
            className="w-full p-2 border rounded"
          />
          <label className="block text-sm">Target difference (first − second)</label>
          <input
            type="number"
            value={diff}
            step={1}
            onChange={(e) => setDiff(asInt(e.target.value))}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      {/* Number Line */}
      <div className="rounded-2xl shadow p-4">
        <h2 className="font-semibold mb-2">Number Line</h2>

        {/* Trackers for current vs target */}
        <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
          <div className={`px-2 py-1 rounded-full border ${sumOK ? 'border-emerald-300 text-emerald-700' : 'border-rose-300 text-rose-700'}`}>
            Sum now: <b>{sumGuess}</b> / target <b>{sum}</b> {sumOK ? '✅' : (sumGuess < sum ? 'too small' : 'too big')}
          </div>
          <div className={`px-2 py-1 rounded-full border ${diffOK ? 'border-emerald-300 text-emerald-700' : 'border-rose-300 text-rose-700'}`}>
            Difference between the two numbers: <b>{diffAbs}</b> / target <b>{Math.abs(diff)}</b> {diffOK ? '✅' : (diffAbs < Math.abs(diff) ? 'too small' : 'too big')}
          </div>
        </div>

        {/* Section (outside SVG) for direct hints */}
        {showHint && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-amber-900">Direct Hint</h3>
              <button onClick={() => setShowHint(false)} className="text-xs underline text-amber-900">hide</button>
            </div>
            <ul className="list-disc pl-5 text-sm text-amber-900">
              {directHintLines.map((line, i) => (<li key={i}>{line}</li>))}
            </ul>
          </div>
        )}

        <svg
          ref={svgRef}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-auto block"
          style={{ maxWidth: '100%' }}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Baseline */}
          <line x1={scale(0)} x2={scale(max)} y1={baselineY} y2={baselineY} stroke="#9ca3af" strokeWidth={2} />

          {/* Ticks */}
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={scale(t)} x2={scale(t)} y1={baselineY - 6} y2={baselineY + 6} stroke="#cbd5e1" />
              <text x={scale(t)} y={baselineY + 20} fontSize={10} textAnchor="middle" fill="#475569">{Math.round(t)}</text>
            </g>
          ))}

          {/* 0 label */}
          <text x={scale(0)} y={baselineY + 34} fontSize={11} textAnchor="middle" fill="#334155">0</text>

          {/* Guess markers (DRAGGABLE) */}
          <g>
            {/* first number marker */}
            <line x1={scale(xGuess)} x2={scale(xGuess)} y1={baselineY - 28} y2={baselineY + 28} stroke="#2563eb" opacity={0.25} />
            <circle
              cx={scale(xGuess)}
              cy={baselineY - 30}
              r={10}
              fill="#2563eb"
              onMouseDown={startDrag('x')}
              onTouchStart={startDrag('x')}
              style={{ cursor: dragging === 'x' ? 'grabbing' : 'grab' }}
            />
            <text x={scale(xGuess)} y={baselineY - 42} fontSize={12} textAnchor="middle" fill="#2563eb">{xGuess}</text>

            {/* second number marker */}
            <line x1={scale(yGuess)} x2={scale(yGuess)} y1={baselineY - 28} y2={baselineY + 28} stroke="#2563eb" opacity={0.25} />
            <circle
              cx={scale(yGuess)}
              cy={baselineY - 30}
              r={10}
              fill="#2563eb"
              onMouseDown={startDrag('y')}
              onTouchStart={startDrag('y')}
              style={{ cursor: dragging === 'y' ? 'grabbing' : 'grab' }}
            />
            <text x={scale(yGuess)} y={baselineY - 42} fontSize={12} textAnchor="middle" fill="#2563eb">{yGuess}</text>
          </g>

          {/* SVG Action Buttons (Hint + Farther/Closer, +/- both) */}
          <g transform={`translate(${actionCX}, ${baselineY - 100})`}>
            {/* Hint toggle */}
            <g
              transform="translate(-300, 0)"
              onClick={() => setShowHint((s) => !s)}
              style={{ cursor: 'pointer' }}
            >
              <rect x={-40} y={-14} width={80} height={24} rx={12} ry={12} fill="#fde68a" stroke="#b45309" />
              <text x={0} y={3} textAnchor="middle" fontSize={11} fill="#78350f">💡 Hint</text>
            </g>
            {/* Farther apart */}
            <g
              transform="translate(-180, 0)"
              onClick={() => { if (!canFarther) return; applyPair(...fartherPair); }}
              style={{ cursor: canFarther ? 'pointer' : 'not-allowed', pointerEvents: canFarther ? 'auto' : 'none', opacity: canFarther ? 1 : 0.5 }}
            >
              <rect x={-60} y={-14} width={120} height={24} rx={12} ry={12} fill="#ffffff" stroke="#475569" />
              <text x={0} y={3} textAnchor="middle" fontSize={11} fill="#0f172a">Farther apart</text>
            </g>
            {/* Closer together */}
            <g
              transform="translate(-60, 0)"
              onClick={() => { if (!canCloser) return; applyPair(...closerPair); }}
              style={{ cursor: canCloser ? 'pointer' : 'not-allowed', pointerEvents: canCloser ? 'auto' : 'none', opacity: canCloser ? 1 : 0.5 }}
            >
              <rect x={-60} y={-14} width={120} height={24} rx={12} ry={12} fill="#ffffff" stroke="#475569" />
              <text x={0} y={3} textAnchor="middle" fontSize={11} fill="#0f172a">Closer together</text>
            </g>
            {/* Increase both by 1 */}
            <g
              transform="translate(60, 0)"
              onClick={() => { if (!canIncBoth) return; applyPair(incBothPair[0], incBothPair[1]); }}
              style={{ cursor: canIncBoth ? 'pointer' : 'not-allowed', pointerEvents: canIncBoth ? 'auto' : 'none', opacity: canIncBoth ? 1 : 0.5 }}
            >
              <rect x={-60} y={-14} width={120} height={24} rx={12} ry={12} fill="#ffffff" stroke="#475569" />
              <text x={0} y={3} textAnchor="middle" fontSize={11} fill="#0f172a">Increase both by 1</text>
            </g>
            {/* Decrease both by 1 */}
            <g
              transform="translate(180, 0)"
              onClick={() => { if (!canDecBoth) return; applyPair(decBothPair[0], decBothPair[1]); }}
              style={{ cursor: canDecBoth ? 'pointer' : 'not-allowed', pointerEvents: canDecBoth ? 'auto' : 'none', opacity: canDecBoth ? 1 : 0.5 }}
            >
              <rect x={-60} y={-14} width={120} height={24} rx={12} ry={12} fill="#ffffff" stroke="#475569" />
              <text x={0} y={3} textAnchor="middle" fontSize={11} fill="#0f172a">Decrease both by 1</text>
            </g>
          </g>

          {/* Distance annotation */}
          <g>
            <line x1={scale(leftXY)} x2={scale(rightXY)} y1={baselineY - 10} y2={baselineY - 10} stroke={diffOK ? "#2563eb" : "#ef4444"} strokeWidth={2} />
            <line x1={scale(leftXY)} x2={scale(leftXY)} y1={baselineY - 16} y2={baselineY - 4} stroke={diffOK ? "#2563eb" : "#ef4444"} />
            <line x1={scale(rightXY)} x2={scale(rightXY)} y1={baselineY - 16} y2={baselineY - 4} stroke={diffOK ? "#2563eb" : "#ef4444"} />
            <text x={scale((leftXY + rightXY) / 2)} y={baselineY - 16} fontSize={12} textAnchor="middle" fill={diffOK ? "#2563eb" : "#ef4444"}>difference = {diffAbs}</text>
          </g>

          {/* Sum annotation from 0 */}
          <g>
            <line x1={scale(0)} x2={scale(sumGuess)} y1={baselineY + 24} y2={baselineY + 24} stroke={sumOK ? "#0ea5e9" : "#ef4444"} strokeWidth={2} />
            <line x1={scale(0)} x2={scale(0)} y1={baselineY + 18} y2={baselineY + 30} stroke={sumOK ? "#0ea5e9" : "#ef4444"} />
            <line x1={scale(sumGuess)} x2={scale(sumGuess)} y1={baselineY + 18} y2={baselineY + 30} stroke={sumOK ? "#0ea5e9" : "#ef4444"} />
            <text x={scale(sumGuess / 2)} y={baselineY + 40} fontSize={12} textAnchor="middle" fill={sumOK ? "#0ea5e9" : "#ef4444"}>sum = {sumGuess}</text>
          </g>
        </svg>
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        <button
          onClick={() => { if (!prankShown) { setPrankShown(true); setPrankOpen(true); playScream(); return; } setXGuess(asInt(x)); setYGuess(asInt(y)); }}
          className="px-3 py-1 rounded-full border hover:bg-gray-50"
        >Jump to solution</button>
      </div>

      {prankOpen && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPrankOpen(false)} />
          <div className="relative bg-white rounded-xl shadow-lg p-4 w-80">
            <h3 className="font-semibold mb-2">Cheating</h3>
            <p className="text-sm text-gray-700 mb-3">Caught you! Try solving it first 🙂</p>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1 rounded border hover:bg-gray-50" onClick={() => setPrankOpen(false)}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
