import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Activity, Gauge, Download, Share2, SlidersHorizontal, Sparkles, ShieldQuestion, Check,
} from 'lucide-react';
import {
  injectSynthIDWatermark, scanSynthIDWatermark, applyNotchFilter, applyLatentJitter,
  applyVaeQuantization, applyNeuralDenoise, applyJPEGCompressionSimulation,
  applyGaussianBlurSimulation, applyCropAndScaleSimulation,
} from '../utils/imageFilters';
import { psnr, ssim, percentChanged, diffHeatmap } from '../utils/metrics';

const S = 200;
type Attack = 'notch' | 'jitter' | 'quantize' | 'denoise' | 'jpeg' | 'blur' | 'crop';

const ATTACKS: Record<Attack, string> = {
  notch: 'Frequency notch', jitter: 'Noise jitter', quantize: 'Quantize',
  denoise: 'Denoise', jpeg: 'JPEG re-save', blur: 'Gaussian blur', crop: 'Crop & rescale',
};

const SCENARIOS: Array<{ id: string; label: string; attack: Attack; intensity: number; note: string }> = [
  { id: 'social', label: 'Social re-upload', attack: 'jpeg', intensity: 65, note: 'Platforms re-encode every upload to JPEG.' },
  { id: 'shot', label: 'Screenshot + rescale', attack: 'quantize', intensity: 55, note: 'Screenshotting resamples and re-quantizes pixels.' },
  { id: 'msgr', label: 'Messenger heavy compress', attack: 'jpeg', intensity: 90, note: 'Chat apps compress aggressively to save bandwidth.' },
  { id: 'beautify', label: 'Beautify / denoise filter', attack: 'denoise', intensity: 70, note: 'One-tap "enhance" tools smooth away low-amplitude carriers.' },
];

function makeBase(ctx: CanvasRenderingContext2D): ImageData {
  const g = ctx.createLinearGradient(0, 0, S, S);
  g.addColorStop(0, '#0e7490'); g.addColorStop(0.5, '#4338ca'); g.addColorStop(1, '#be185d');
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 80; i++) {
    const x = (i * 71) % S, y = (i * 137) % S;
    ctx.fillStyle = `rgba(255,255,255,${0.02 + (i % 5) * 0.012})`;
    ctx.fillRect(x, y, 3, 3);
  }
  return ctx.getImageData(0, 0, S, S);
}

function applyAttack(src: ImageData, attack: Attack, intensity: number): ImageData {
  const out = new ImageData(new Uint8ClampedArray(src.data), S, S);
  switch (attack) {
    case 'notch': applyNotchFilter(src, out, 40, Math.max(2, Math.round(intensity * 0.12))); break;
    case 'jitter': applyLatentJitter(src, out, intensity * 0.5); break;
    case 'quantize': applyVaeQuantization(src, out, Math.max(2, Math.round(intensity / 12)), Math.max(4, 24 - Math.round(intensity * 0.2))); break;
    case 'denoise': applyNeuralDenoise(src, out, 2.0, Math.max(5, intensity * 0.6)); break;
    case 'jpeg': applyJPEGCompressionSimulation(src, out, Math.max(8, 100 - intensity * 0.9)); break;
    case 'blur': applyGaussianBlurSimulation(src, out, intensity * 0.04); break;
    case 'crop': applyCropAndScaleSimulation(src, out, intensity * 0.4); break;
  }
  return out;
}

function readHash() {
  const p = new URLSearchParams(location.hash.replace(/^#/, ''));
  const a = p.get('a') as Attack | null;
  return {
    attack: (a && a in ATTACKS) ? a : 'jpeg' as Attack,
    intensity: Math.min(100, Math.max(0, parseInt(p.get('i') || '60'))),
    threshold: Math.min(100, Math.max(0, parseInt(p.get('t') || '50'))),
  };
}

export default function AnalysisLab() {
  const init = readHash();
  const [attack, setAttack] = useState<Attack>(init.attack);
  const [intensity, setIntensity] = useState(init.intensity);
  const [threshold, setThreshold] = useState(init.threshold);
  const [scenarioNote, setScenarioNote] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [orig, setOrig] = useState<ImageData | null>(null);

  const origCv = useRef<HTMLCanvasElement>(null);
  const procCv = useRef<HTMLCanvasElement>(null);
  const heatCv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = document.createElement('canvas'); c.width = S; c.height = S;
    const ctx = c.getContext('2d')!;
    const base = makeBase(ctx);
    const wm = ctx.createImageData(S, S);
    injectSynthIDWatermark(base, wm, 3.2);
    setOrig(wm);
  }, []);

  const processed = useMemo(() => (orig ? applyAttack(orig, attack, intensity) : null), [orig, attack, intensity]);

  const metrics = useMemo(() => {
    if (!orig || !processed) return null;
    return {
      detection: scanSynthIDWatermark(processed, true),
      psnr: psnr(orig.data, processed.data),
      ssim: ssim(orig, processed),
      changed: percentChanged(orig.data, processed.data),
    };
  }, [orig, processed]);

  const curve = useMemo(() => {
    if (!orig) return [];
    const pts: Array<{ i: number; det: number; ssim: number }> = [];
    for (let i = 0; i <= 100; i += 10) {
      const p = applyAttack(orig, attack, i);
      pts.push({ i, det: scanSynthIDWatermark(p, true), ssim: ssim(orig, p) });
    }
    return pts;
  }, [orig, attack]);

  // draw canvases
  useEffect(() => {
    if (orig && origCv.current) origCv.current.getContext('2d')!.putImageData(orig, 0, 0);
    if (processed && procCv.current) procCv.current.getContext('2d')!.putImageData(processed, 0, 0);
    if (orig && processed && heatCv.current) {
      const out = new ImageData(S, S);
      diffHeatmap(orig, processed, out, 8);
      heatCv.current.getContext('2d')!.putImageData(out, 0, 0);
    }
  }, [orig, processed]);

  // sync deep-link hash
  useEffect(() => {
    const h = `a=${attack}&i=${intensity}&t=${threshold}`;
    if (location.hash.replace(/^#/, '') !== h) history.replaceState(null, '', `#${h}`);
  }, [attack, intensity, threshold]);

  const applyScenario = useCallback((s: typeof SCENARIOS[number]) => {
    setAttack(s.attack); setIntensity(s.intensity); setScenarioNote(s.note);
  }, []);

  const copyLink = useCallback(() => {
    navigator.clipboard.writeText(location.href);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  }, []);

  const downloadReport = useCallback(() => {
    if (!metrics) return;
    const report = {
      tool: 'Watermark Stress Test — Analysis', version: '0.1.0',
      generatedAt: new Date().toISOString(),
      note: 'Synthetic watermark; detection scores describe this lab signal, not any production system.',
      config: { attack, attackLabel: ATTACKS[attack], intensity, detectorThreshold: threshold },
      results: {
        detectionConfidence: metrics.detection,
        verdict: metrics.detection >= threshold ? 'watermark detected' : 'no watermark detected (unverifiable)',
        psnr_dB: +metrics.psnr.toFixed(2), ssim: +metrics.ssim.toFixed(4),
        pixelsChanged_pct: +metrics.changed.toFixed(2),
      },
      robustnessCurve: curve.map((p) => ({ intensity: p.i, detection: p.det, ssim: +p.ssim.toFixed(3) })),
      shareLink: location.href,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `stress-test-${attack}-${intensity}.json`;
    a.click(); URL.revokeObjectURL(a.href);
  }, [metrics, attack, intensity, threshold, curve]);

  const detected = metrics ? metrics.detection >= threshold : false;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Controls */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center gap-2"><SlidersHorizontal className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-semibold tracking-wide uppercase text-white/90">Attack</h3></div>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(ATTACKS) as Attack[]).map((a) => (
              <button key={a} onClick={() => { setAttack(a); setScenarioNote(''); }}
                className={`text-[11px] font-semibold py-1.5 rounded-lg border transition cursor-pointer ${
                  attack === a ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200' : 'bg-black/20 border-white/10 text-white/50 hover:text-white/80'}`}>
                {ATTACKS[a]}
              </button>
            ))}
          </div>
          <div className="mt-1">
            <div className="flex justify-between text-[10px] font-mono text-white/60"><span>Intensity</span><span className="text-cyan-300 font-bold">{intensity}</span></div>
            <input type="range" min="0" max="100" step="5" value={intensity} onChange={(e) => setIntensity(parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded appearance-none accent-cyan-400 cursor-pointer" />
          </div>
          <div>
            <div className="flex justify-between text-[10px] font-mono text-white/60"><span>Detector threshold</span><span className="text-indigo-300 font-bold">{threshold}%</span></div>
            <input type="range" min="0" max="100" step="5" value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded appearance-none accent-indigo-400 cursor-pointer" />
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold tracking-wide uppercase text-white/90">Real-world scenarios</h3></div>
          <div className="grid grid-cols-1 gap-1.5">
            {SCENARIOS.map((s) => (
              <button key={s.id} onClick={() => applyScenario(s)}
                className="text-left text-[11px] font-semibold py-1.5 px-2.5 rounded-lg border border-white/10 bg-black/20 text-white/60 hover:text-white hover:border-white/20 transition cursor-pointer">
                {s.label}
              </button>
            ))}
          </div>
          {scenarioNote && <p className="text-[10px] text-white/45 leading-relaxed italic">{scenarioNote}</p>}
        </div>

        <div className="flex gap-2">
          <button onClick={copyLink} className="flex-1 text-[11px] font-bold py-2 rounded-xl border border-white/10 bg-white/5 text-white/70 hover:text-white flex items-center justify-center gap-1.5 transition cursor-pointer">
            {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</> : <><Share2 className="w-3.5 h-3.5" /> Share link</>}
          </button>
          <button onClick={downloadReport} className="flex-1 text-[11px] font-bold py-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20 flex items-center justify-center gap-1.5 transition cursor-pointer">
            <Download className="w-3.5 h-3.5" /> Report
          </button>
        </div>
      </div>

      {/* Visuals + metrics */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[['Original', origCv], ['Attacked', procCv], ['Difference', heatCv]].map(([label, ref], idx) => (
            <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/40 font-mono">{label as string}</span>
              <canvas ref={ref as React.RefObject<HTMLCanvasElement>} width={S} height={S} role="img"
                aria-label={`${label} 200 by 200`} className="w-full aspect-square rounded-lg border border-white/10 bg-black/40" />
            </div>
          ))}
        </div>

        {/* metric tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            ['Detection', metrics ? `${metrics.detection}%` : '—', detected ? 'text-rose-300' : 'text-emerald-300'],
            ['PSNR', metrics ? `${metrics.psnr.toFixed(1)} dB` : '—', 'text-cyan-300'],
            ['SSIM', metrics ? metrics.ssim.toFixed(3) : '—', 'text-cyan-300'],
            ['Pixels changed', metrics ? `${metrics.changed.toFixed(1)}%` : '—', 'text-indigo-300'],
          ].map(([k, v, cls], i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-0.5">
              <span className="text-[9px] uppercase font-bold tracking-widest text-white/35 font-mono">{k as string}</span>
              <span className={`text-xl font-extrabold font-mono ${cls as string}`}>{v as string}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Robustness curve */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2"><Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wide text-white/80">Robustness curve · {ATTACKS[attack]}</span></div>
            <svg viewBox="0 0 320 140" className="w-full">
              <line x1="34" y1="10" x2="34" y2="116" stroke="rgba(255,255,255,0.15)" />
              <line x1="34" y1="116" x2="310" y2="116" stroke="rgba(255,255,255,0.15)" />
              {[0, 50, 100].map((v) => (
                <text key={v} x="28" y={116 - (v / 100) * 106 + 3} textAnchor="end" className="fill-white/30" fontSize="7">{v}</text>
              ))}
              {(['det', 'ssim'] as const).map((key) => {
                const stroke = key === 'det' ? '#CBF24C' : '#a78bfa';
                const d = curve.map((p, i) => {
                  const x = 34 + (p.i / 100) * 276;
                  const val = key === 'det' ? p.det : p.ssim * 100;
                  const y = 116 - (val / 100) * 106;
                  return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
                }).join(' ');
                return <path key={key} d={d} fill="none" stroke={stroke} strokeWidth="2" />;
              })}
              <line x1={34 + (intensity / 100) * 276} y1="10" x2={34 + (intensity / 100) * 276} y2="116" stroke="rgba(255,255,255,0.35)" strokeDasharray="3 3" />
            </svg>
            <div className="flex gap-4 text-[9px] font-mono">
              <span className="text-cyan-300">● detection %</span>
              <span className="text-violet-300">● SSIM ×100</span>
              <span className="text-white/30">┊ current intensity</span>
            </div>
          </div>

          {/* Provenance verdict */}
          <div className={`rounded-xl p-4 flex flex-col gap-2 border ${detected ? 'bg-rose-500/[0.05] border-rose-500/25' : 'bg-emerald-500/[0.05] border-emerald-500/25'}`}>
            <div className="flex items-center gap-2"><ShieldQuestion className="w-4 h-4 text-white/70" />
              <span className="text-xs font-bold uppercase tracking-wide text-white/80">Provenance verdict</span></div>
            <div className={`text-lg font-extrabold ${detected ? 'text-rose-300' : 'text-emerald-300'}`}>
              {detected ? 'Watermark detected' : 'No watermark detected'}
            </div>
            <p className="text-[11px] text-white/55 leading-relaxed">
              {detected
                ? <>Score {metrics?.detection}% ≥ threshold {threshold}%. But detection is a <strong>policy choice</strong>: raise the threshold and the same asset reads "clean."</>
                : <>Score {metrics?.detection}% &lt; threshold {threshold}%. The watermark can no longer vouch for origin — this is exactly where a <strong className="text-emerald-200">signed Content Credential</strong> still holds.</>}
            </p>
            <div className="mt-auto"><Gauge className="w-4 h-4 text-white/30" /></div>
          </div>
        </div>
      </div>
    </div>
  );
}
