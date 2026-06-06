import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ShieldCheck, ShieldAlert, KeyRound, RefreshCw, Fingerprint, Stamp, Wand2,
} from 'lucide-react';
import {
  injectSynthIDWatermark, scanSynthIDWatermark, applyJPEGCompressionSimulation,
  applyBrightnessShift, applyCropAndScaleSimulation, applyNeuralDenoise,
} from '../utils/imageFilters';
import { sha256Hex } from '../utils/metrics';

const W = 224;
const H = 224;

type Verify = 'valid' | 'invalid' | null;

/** Draw a deterministic synthetic "AI render" into ctx and return its ImageData. */
function makeBase(ctx: CanvasRenderingContext2D): ImageData {
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#1e3a8a');
  g.addColorStop(0.5, '#0e7490');
  g.addColorStop(1, '#7e22ce');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = `rgba(${60 + i * 28},${200 - i * 18},${230 - i * 20},0.18)`;
    ctx.beginPath();
    ctx.ellipse(40 + i * 28, 60 + ((i * 53) % 120), 50 - i * 4, 26, i, 0, Math.PI * 2);
    ctx.fill();
  }
  return ctx.getImageData(0, 0, W, H);
}

export default function CredentialShowdown() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workRef = useRef<HTMLCanvasElement | null>(null);
  const baseRef = useRef<ImageData | null>(null);
  const curRef = useRef<ImageData | null>(null);

  const credRef = useRef<{ pub: CryptoKey; sig: ArrayBuffer } | null>(null);
  const [issued, setIssued] = useState(false);
  const [busy, setBusy] = useState(false);
  const [verify, setVerify] = useState<Verify>(null);
  const [contentHash, setContentHash] = useState<string>('');
  const [wmConf, setWmConf] = useState<number>(0);
  const [log, setLog] = useState<string[]>([]);
  const [tick, setTick] = useState(0);

  // init: load a real generated image, then watermark it once (same-origin so
  // the canvas isn't tainted and the bytes can be signed). Falls back to the
  // procedural gradient if the image can't load.
  useEffect(() => {
    const work = document.createElement('canvas');
    work.width = W; work.height = H;
    workRef.current = work;
    const wctx = work.getContext('2d')!;

    const finish = (base: ImageData) => {
      const wm = wctx.createImageData(W, H);
      injectSynthIDWatermark(base, wm, 3.2);
      baseRef.current = wm;
      curRef.current = new ImageData(new Uint8ClampedArray(wm.data), W, H);
      setWmConf(scanSynthIDWatermark(wm, true));
      setTick((t) => t + 1);
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const scale = Math.max(W / img.width, H / img.height); // cover-fit to square
      const dw = img.width * scale, dh = img.height * scale;
      wctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
      finish(wctx.getImageData(0, 0, W, H));
    };
    img.onerror = () => finish(makeBase(wctx));
    img.src = '/presets/cityscape.jpg';
  }, []);

  // paint current image whenever it changes
  useEffect(() => {
    const c = canvasRef.current, cur = curRef.current;
    if (c && cur) c.getContext('2d')!.putImageData(cur, 0, 0);
  }, [tick]);

  const issue = useCallback(async () => {
    if (!curRef.current) return;
    setBusy(true);
    try {
      const bytes = curRef.current.data;
      const kp = await crypto.subtle.generateKey(
        { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']
      );
      const sig = await crypto.subtle.sign(
        { name: 'ECDSA', hash: 'SHA-256' }, kp.privateKey, bytes
      );
      credRef.current = { pub: kp.publicKey, sig };
      setContentHash(await sha256Hex(bytes));
      setIssued(true);
      setVerify('valid');
      setLog(['Content Credential issued · ECDSA P-256 · SHA-256 binding']);
    } finally {
      setBusy(false);
    }
  }, []);

  const edit = useCallback(async (kind: 'jpeg' | 'bright' | 'crop' | 'denoise', label: string) => {
    const cur = curRef.current;
    if (!cur) return;
    setBusy(true);
    try {
      const out = new ImageData(new Uint8ClampedArray(cur.data), W, H);
      if (kind === 'jpeg') applyJPEGCompressionSimulation(cur, out, 55);
      else if (kind === 'bright') applyBrightnessShift(cur, out, 12);
      else if (kind === 'crop') applyCropAndScaleSimulation(cur, out, 10);
      else applyNeuralDenoise(cur, out, 2.0, 28);
      curRef.current = out;

      const conf = scanSynthIDWatermark(out, true);
      setWmConf(conf);

      let v: Verify = verify;
      if (credRef.current) {
        const ok = await crypto.subtle.verify(
          { name: 'ECDSA', hash: 'SHA-256' }, credRef.current.pub, credRef.current.sig, out.data
        );
        v = ok ? 'valid' : 'invalid';
        setVerify(v);
        setContentHash(await sha256Hex(out.data));
      }
      setLog((l) => [
        `${label} → watermark ${conf}% · credential ${v === 'valid' ? 'VALID' : 'INVALID'}`,
        ...l,
      ].slice(0, 6));
      setTick((t) => t + 1);
    } finally {
      setBusy(false);
    }
  }, [verify]);

  const reset = useCallback(() => {
    if (!baseRef.current) return;
    curRef.current = new ImageData(new Uint8ClampedArray(baseRef.current.data), W, H);
    credRef.current = null;
    setIssued(false); setVerify(null); setContentHash(''); setLog([]);
    setWmConf(scanSynthIDWatermark(baseRef.current, true));
    setTick((t) => t + 1);
  }, []);

  const editsDisabled = busy || !issued;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Stage + actions */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center gap-2">
            <Stamp className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-semibold tracking-wide uppercase text-white/90">The Asset</h3>
          </div>
          <p className="text-xs text-white/55 leading-relaxed">
            One synthetic image carrying <em>both</em> an in-band watermark and a signed Content Credential.
            Issue the credential, then edit the asset and watch the two provenance signals diverge.
          </p>
          <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40 self-center">
            <canvas ref={canvasRef} width={W} height={H} role="img"
              aria-label="Synthetic asset carrying a watermark and a signed credential" className="block w-[224px] h-[224px]" />
          </div>

          {!issued ? (
            <button onClick={issue} disabled={busy}
              className="w-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-200 hover:bg-cyan-500/25 disabled:opacity-50 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer">
              <KeyRound className="w-4 h-4" /> Issue Content Credential (sign)
            </button>
          ) : (
            <button onClick={reset}
              className="w-full bg-white/5 border border-white/10 text-white/70 hover:text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" /> Reset asset & re-issue
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            {([
              ['jpeg', 'Re-save (JPEG q55)'],
              ['bright', 'Brighten +12'],
              ['crop', 'Crop & rescale 10%'],
              ['denoise', 'Denoise pass'],
            ] as const).map(([k, lbl]) => (
              <button key={k} onClick={() => edit(k, lbl)} disabled={editsDisabled}
                className="text-[11px] font-semibold py-2 px-2 rounded-lg border border-indigo-500/25 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/20 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center justify-center gap-1.5">
                <Wand2 className="w-3.5 h-3.5" /> {lbl}
              </button>
            ))}
          </div>
          {!issued && <p className="text-[10px] text-white/40 text-center font-mono">Issue the credential to enable edits.</p>}
        </div>
      </div>

      {/* The two provenance lanes */}
      <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Watermark lane */}
        <div className="bg-white/5 backdrop-blur-md border border-amber-500/20 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
          <div className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-amber-300" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-white/90">In-band watermark</h3>
          </div>
          <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-1.5 text-center">
            <div className="text-4xl font-extrabold font-mono text-amber-300">{wmConf}%</div>
            <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Detection confidence</div>
            <div className="w-full h-2 bg-white/10 rounded mt-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-rose-400 transition-all duration-500" style={{ width: `${wmConf}%` }} />
            </div>
          </div>
          <p className="text-[11px] text-white/55 leading-relaxed">
            Edits quietly erode the score. There is <strong className="text-amber-200">no alarm</strong> — a faded mark
            is indistinguishable from content that was never watermarked. Absence proves nothing.
          </p>
        </div>

        {/* Credential lane */}
        <div className={`bg-white/5 backdrop-blur-md rounded-2xl p-5 flex flex-col gap-4 shadow-xl border ${
          verify === 'invalid' ? 'border-rose-500/40' : verify === 'valid' ? 'border-emerald-500/40' : 'border-white/10'}`}>
          <div className="flex items-center gap-2">
            {verify === 'invalid'
              ? <ShieldAlert className="w-5 h-5 text-rose-400" />
              : <ShieldCheck className="w-5 h-5 text-emerald-400" />}
            <h3 className="text-sm font-bold uppercase tracking-wide text-white/90">Signed Credential (C2PA-style)</h3>
          </div>
          <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2 text-center">
            {!issued ? (
              <div className="text-sm text-white/40 font-mono py-3">No credential issued</div>
            ) : (
              <>
                <div className={`text-2xl font-extrabold tracking-tight ${verify === 'invalid' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {verify === 'invalid' ? '✗ INVALID' : '✓ VALID'}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">
                  {verify === 'invalid' ? 'Signature failed — asset altered after signing' : 'Signature verifies against the asset'}
                </div>
              </>
            )}
          </div>
          <div className="bg-black/30 border border-white/10 rounded-lg p-3 text-[10px] font-mono text-white/50 space-y-1">
            <div className="flex justify-between"><span>Algorithm</span><span className="text-white/70">ECDSA P-256</span></div>
            <div className="flex justify-between"><span>Binding</span><span className="text-white/70">SHA-256</span></div>
            <div className="flex justify-between gap-2"><span>Content hash</span>
              <span className="text-white/70 truncate max-w-[120px]">{contentHash ? contentHash.slice(0, 16) + '…' : '—'}</span></div>
          </div>
          <p className="text-[11px] text-white/55 leading-relaxed">
            Any change breaks the signature <strong className="text-emerald-200">visibly</strong>. &ldquo;Invalid&rdquo; and
            &ldquo;no credential&rdquo; are explicit, auditable states — not a probability that quietly decayed.
          </p>
        </div>

        {/* Event log */}
        <div className="md:col-span-2 bg-black/30 border border-white/10 rounded-xl p-3 min-h-[64px]">
          <div className="text-[9px] uppercase font-bold tracking-widest text-white/30 font-mono mb-1.5">Event log</div>
          {log.length === 0
            ? <div className="text-[11px] text-white/30 font-mono">Issue the credential, then apply an edit…</div>
            : <ul className="space-y-1">{log.map((l, i) => (
                <li key={i} className={`text-[11px] font-mono ${i === 0 ? 'text-white/80' : 'text-white/40'}`}>⚡ {l}</li>
              ))}</ul>}
        </div>
      </div>
    </div>
  );
}
