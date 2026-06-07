import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Music, Play, Waves, ShieldCheck, ShieldAlert } from 'lucide-react';
import { GlossaryTerm } from './GlossaryTerm';

const SR = 44100;
const DUR = 1.5;
const N = Math.floor(SR * DUR);
const F_WM = 16000;          // high-frequency carrier
const WM_AMP = 0.035;        // imperceptible amplitude

/** Pseudo-random ±1 chip sequence from a fixed seed (the detector's secret key). */
function template(): Float32Array {
  const t = new Float32Array(N);
  let s = 1234567;
  const rng = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  let chip = 1, next = 0;
  for (let i = 0; i < N; i++) {
    if (i >= next) { chip = rng() > 0.5 ? 1 : -1; next = i + 220; }
    t[i] = chip * Math.sin((2 * Math.PI * F_WM * i) / SR) * WM_AMP;
  }
  return t;
}

/** A pleasant low-frequency chord — the "content". */
function base(): Float32Array {
  const out = new Float32Array(N);
  const freqs = [220, 277.2, 329.6];
  for (let i = 0; i < N; i++) {
    let v = 0;
    for (const f of freqs) v += Math.sin((2 * Math.PI * f * i) / SR);
    const env = Math.min(1, i / 2000) * Math.min(1, (N - i) / 2000);
    out[i] = (v / freqs.length) * 0.5 * env;
  }
  return out;
}

function add(a: Float32Array, b: Float32Array): Float32Array {
  const o = new Float32Array(a.length);
  for (let i = 0; i < a.length; i++) o[i] = a[i] + b[i];
  return o;
}

/** Cascaded one-pole RC low-pass — strips the high-frequency carrier. */
function lowpass(x: Float32Array, fc: number, stages = 4): Float32Array {
  const dt = 1 / SR, rc = 1 / (2 * Math.PI * fc), alpha = dt / (rc + dt);
  let cur = x;
  for (let s = 0; s < stages; s++) {
    const o = new Float32Array(cur.length);
    o[0] = cur[0];
    for (let i = 1; i < cur.length; i++) o[i] = o[i - 1] + alpha * (cur[i] - o[i - 1]);
    cur = o;
  }
  return cur;
}

function detect(sig: Float32Array, tmpl: Float32Array): number {
  let dot = 0, norm = 0;
  for (let i = 0; i < sig.length; i++) { dot += sig[i] * tmpl[i]; norm += tmpl[i] * tmpl[i]; }
  return Math.round(Math.min(100, Math.max(0, (dot / norm) * 100)));
}

export default function AudioLab() {
  const ctxRef = useRef<AudioContext | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  const { variants } = useMemo(() => {
    const tmpl = template();
    const b = base();
    const marked = add(b, tmpl);
    const attacked = lowpass(marked, 6000);
    return {
      variants: [
        { id: 'clean', label: 'Clean (no watermark)', buf: b, conf: detect(b, tmpl), tone: 'text-white/50' },
        { id: 'marked', label: 'Watermarked', buf: marked, conf: detect(marked, tmpl), tone: 'text-emerald-300' },
        { id: 'attacked', label: 'After low-pass (6 kHz)', buf: attacked, conf: detect(attacked, tmpl), tone: 'text-rose-300' },
      ],
    };
  }, []);

  useEffect(() => () => { ctxRef.current?.close(); }, []);

  const play = (id: string, data: Float32Array) => {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = ctxRef.current;
    const buf = ctx.createBuffer(1, data.length, SR);
    buf.copyToChannel(data, 0);
    const src = ctx.createBufferSource();
    src.buffer = buf; src.connect(ctx.destination);
    src.onended = () => setPlaying(null);
    src.start(); setPlaying(id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col gap-3 shadow-xl">
          <div className="flex items-center gap-2"><Music className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-semibold tracking-wide uppercase text-white/90">Audio watermark</h3></div>
          <p className="text-xs text-white/55 leading-relaxed">
            The same fragility applies to audio. We embed an inaudible high-frequency <GlossaryTerm id="spread-spectrum">spread-spectrum carrier</GlossaryTerm>
            (~16&nbsp;kHz) keyed by a secret chip sequence, then detect it by correlation. A routine <GlossaryTerm id="low-pass">low-pass</GlossaryTerm> — the
            kind any re-encode or "enhance" step applies — strips it out. <strong className="text-white/75">Headphones recommended;
            the carrier is near the edge of hearing.</strong>
          </p>
          <div className="bg-black/30 border border-white/10 rounded-lg p-3 text-[10px] font-mono text-white/50 space-y-1">
            <div className="flex justify-between"><span><GlossaryTerm id="carrier">Carrier</GlossaryTerm></span><span className="text-white/70">{F_WM / 1000} kHz spread-spectrum</span></div>
            <div className="flex justify-between"><span>Amplitude</span><span className="text-white/70">{WM_AMP} (imperceptible)</span></div>
            <div className="flex justify-between"><span>Detector</span><span className="text-white/70"><GlossaryTerm id="matched-filter">matched-filter</GlossaryTerm> correlation</span></div>
          </div>
        </div>
      </div>

      <div className="lg:col-span-7 flex flex-col gap-3">
        {variants.map((v) => (
          <div key={v.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4">
            <button onClick={() => play(v.id, v.buf)}
              className="shrink-0 w-11 h-11 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-200 hover:bg-cyan-500/25 flex items-center justify-center transition cursor-pointer"
              aria-label={`Play ${v.label}`}>
              {playing === v.id ? <Waves className="w-5 h-5 animate-pulse" /> : <Play className="w-5 h-5" />}
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-white/85 truncate">{v.label}</span>
                <span className={`text-sm font-extrabold font-mono ${v.tone}`}>{v.conf}%</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded mt-1.5 overflow-hidden">
                <div className={`h-full transition-all duration-500 ${v.conf >= 50 ? 'bg-emerald-400' : 'bg-rose-400'}`} style={{ width: `${v.conf}%` }} />
              </div>
            </div>
            <div className="shrink-0">
              {v.conf >= 50 ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> : <ShieldAlert className="w-5 h-5 text-rose-400" />}
            </div>
          </div>
        ))}
        <p className="text-[11px] text-white/45 leading-relaxed px-1">
          Watermarked → near 100%. After a single low-pass the correlation collapses, and nothing in the audio flags that
          a mark was ever there. As with images and text: in-band signals don't survive routine processing — which is the
          case for signing provenance instead.
        </p>
      </div>
    </div>
  );
}
