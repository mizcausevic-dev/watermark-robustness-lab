import React, { useState, useEffect, useRef } from 'react';
import {
  Network, Settings, Play, Activity, Sparkles, Gauge, ArrowRight, RotateCcw,
} from 'lucide-react';
import { INITIAL_COMFY_NODES, INITIAL_COMFY_EDGES } from '../data';
import { ComfyNode, ComfyEdge } from '../types';
import {
  injectSynthIDWatermark, scanSynthIDWatermark, applyNotchFilter,
  applyVaeQuantization, applyNeuralDenoise,
} from '../utils/imageFilters';
import { InfoTip } from './Tooltip';

const SIZE = 144;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const NODE_TIP: Record<string, string> = {
  loader: 'Loads the source asset (a generated image carrying the synthetic watermark).',
  processor: 'The keyed detector — correlates the image against the expected carrier and reports a confidence.',
  bypass: 'A perturbation node — attenuates the carrier in a specific way (e.g. a frequency notch).',
  encoder: 'Injects broadband noise that scrambles the fine pixel correlations the carrier needs.',
  sampler: 'A denoise / resample pass — treats the low-amplitude carrier as sensor noise and smooths it away.',
  saver: 'Writes the final perturbed image.',
};

export default function ComfyUIWorkflow() {
  const [nodes, setNodes] = useState<ComfyNode[]>(INITIAL_COMFY_NODES);
  const [edges, setEdges] = useState<ComfyEdge[]>(INITIAL_COMFY_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('3');
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [log, setLog] = useState<string[]>(['[pipeline] workflow schema loaded', '[pipeline] waiting for run…']);
  const [isRunning, setIsRunning] = useState(false);
  const [runStage, setRunStage] = useState<string | null>(null);
  const [detection, setDetection] = useState<number | null>(null);

  const workRef = useRef<HTMLCanvasElement | null>(null);
  const baseRef = useRef<ImageData | null>(null);
  const inCanvasRef = useRef<HTMLCanvasElement>(null);
  const outCanvasRef = useRef<HTMLCanvasElement>(null);

  const drawTo = (ref: React.RefObject<HTMLCanvasElement>, data: ImageData) => {
    const c = ref.current;
    if (c) c.getContext('2d')!.putImageData(data, 0, 0);
  };

  // Load a real watermarked asset once (same-origin → no canvas taint).
  useEffect(() => {
    const work = document.createElement('canvas');
    work.width = SIZE; work.height = SIZE;
    workRef.current = work;
    const wctx = work.getContext('2d')!;
    const finish = (base: ImageData) => {
      const wm = wctx.createImageData(SIZE, SIZE);
      injectSynthIDWatermark(base, wm, 3.4);
      baseRef.current = wm;
      drawTo(inCanvasRef, wm);
      drawTo(outCanvasRef, wm);
      setDetection(scanSynthIDWatermark(wm, true));
    };
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const s = Math.max(SIZE / img.width, SIZE / img.height);
      const dw = img.width * s, dh = img.height * s;
      wctx.drawImage(img, (SIZE - dw) / 2, (SIZE - dh) / 2, dw, dh);
      finish(wctx.getImageData(0, 0, SIZE, SIZE));
    };
    img.onerror = () => {
      const g = wctx.createLinearGradient(0, 0, SIZE, SIZE);
      g.addColorStop(0, '#0e7490'); g.addColorStop(1, '#7e22ce');
      wctx.fillStyle = g; wctx.fillRect(0, 0, SIZE, SIZE);
      finish(wctx.getImageData(0, 0, SIZE, SIZE));
    };
    img.src = '/presets/gradient.jpg';
  }, []);

  const numProp = (id: string, key: string, def: number): number => {
    const v = nodes.find((n) => n.id === id)?.properties[key];
    return typeof v === 'number' ? v : def;
  };

  const runPipeline = async () => {
    if (isRunning || !baseRef.current) return;
    setIsRunning(true);
    let cur = new ImageData(new Uint8ClampedArray(baseRef.current.data), SIZE, SIZE);
    drawTo(outCanvasRef, cur);
    let det = scanSynthIDWatermark(baseRef.current, true);
    setDetection(det);
    setLog([`[load] input watermarked · carrier correlation ${det}%`]);

    const stages: { id: string; label: string; run: (s: ImageData, o: ImageData) => void }[] = [
      { id: '3', label: 'frequency notch', run: (s, o) => applyNotchFilter(s, o, numProp('3', 'notch_radius', 42), Math.max(4, numProp('3', 'notch_bandwidth', 6) * 2)) },
      { id: '4', label: 'quantize bottleneck', run: (s, o) => applyVaeQuantization(s, o, 8, Math.max(4, Math.round(12 - numProp('4', 'noise_scale', 0.08) * 50))) },
      { id: '5', label: 'bilateral denoise', run: (s, o) => applyNeuralDenoise(s, o, 4.0, Math.max(45, numProp('5', 'denoise', 0.12) * 400)) },
    ];

    for (const st of stages) {
      setRunStage(st.id);
      await sleep(560);
      const out = new ImageData(new Uint8ClampedArray(cur.data), SIZE, SIZE);
      st.run(cur, out);
      cur = out;
      drawTo(outCanvasRef, cur);
      det = scanSynthIDWatermark(cur, true);
      setDetection(det);
      setLog((p) => [...p, `[${st.label}] carrier correlation → ${det}%`]);
    }

    setRunStage('6');
    await sleep(420);
    setLog((p) => [...p, '[save] perturbed_output.png written', `[result] carrier ${det <= 12 ? 'erased' : 'attenuated'} — ${det}% remaining`]);
    setRunStage(null);
    setIsRunning(false);
  };

  // --- node graph interactions (unchanged) ---------------------------------
  const handleDragStart = (e: React.MouseEvent, id: string) => {
    setDraggedNodeId(id);
    const node = nodes.find((n) => n.id === id);
    if (node) setDragOffset({ x: e.clientX - node.position.x, y: e.clientY - node.position.y });
  };
  const handleDrag = (e: React.MouseEvent) => {
    if (draggedNodeId !== null) {
      setNodes(nodes.map((n) => n.id === draggedNodeId
        ? { ...n, position: { x: Math.min(1250, Math.max(10, e.clientX - dragOffset.x)), y: Math.min(480, Math.max(20, e.clientY - dragOffset.y)) } }
        : n));
    }
  };
  const handleDragEnd = () => setDraggedNodeId(null);

  const updateNodeProperty = (nodeId: string, propKey: string, val: string | number) => {
    setNodes(nodes.map((n) => n.id === nodeId ? { ...n, properties: { ...n.properties, [propKey]: val } } : n));
  };

  const autoAlignNodes = () => {
    const levels: Record<string, number> = {};
    nodes.forEach((n) => { levels[n.id] = 0; });
    for (let i = 0; i < nodes.length; i++) {
      edges.forEach((e) => { if ((levels[e.toNode] || 0) <= (levels[e.fromNode] || 0)) levels[e.toNode] = (levels[e.fromNode] || 0) + 1; });
    }
    const groups: Record<number, string[]> = {};
    nodes.forEach((n) => { (groups[levels[n.id]] ||= []).push(n.id); });
    setNodes(nodes.map((n) => {
      const lvl = levels[n.id];
      const sib = groups[lvl] || [];
      const idx = sib.indexOf(n.id);
      const x = 30 + lvl * 205;
      const y = sib.length > 1 ? (280 / (sib.length + 1)) * (idx + 1) + 40 : 110 + (lvl % 2 === 0 ? 35 : 10);
      return { ...n, position: { x: Math.round(x), y: Math.round(y) } };
    }));
    setLog((p) => [...p, '[layout] auto-aligned left → right']);
  };

  const sliderProps = (k: string) => {
    if (k.includes('radius')) return { min: 10, max: 100, step: 1 };
    if (k.includes('bandwidth')) return { min: 1, max: 30, step: 1 };
    if (k.includes('noise')) return { min: 0, max: 0.5, step: 0.01 };
    if (k.includes('denoise')) return { min: 0, max: 1, step: 0.02 };
    if (k.includes('strictness') || k.includes('strength')) return { min: 0, max: 1, step: 0.05 };
    if (k.includes('steps')) return { min: 1, max: 30, step: 1 };
    return { min: 0, max: 100, step: 1 };
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div id="comfy-workflow-panel" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2.5">
          <Network className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/95 flex items-center">
              Perturbation Pipeline — Run It Live
              <InfoTip label="A real, in-browser pipeline. Run flows a watermarked image through each node and reports the actual carrier correlation after every stage." />
            </h3>
            <p className="text-[11px] text-white/55 mt-0.5 leading-snug">
              The same edits, chained. Drag nodes, tune properties, then run — and watch the real detection score collapse stage by stage.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={runPipeline} disabled={isRunning}
            className="bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 disabled:opacity-50 text-xs font-bold py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer">
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running…' : 'Run Pipeline'}
          </button>
          <button onClick={autoAlignNodes}
            className="bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_8px_rgba(0,229,255,0.15)]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Auto-Align
          </button>
          <button onClick={() => { setNodes(INITIAL_COMFY_NODES); setEdges(INITIAL_COMFY_EDGES); setLog(['[pipeline] flow reset']); }}
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">

        {/* Schematic stage */}
        <div onMouseMove={handleDrag} onMouseUp={handleDragEnd}
          className="xl:col-span-8 bg-black/40 border border-white/10 rounded-xl min-h-[460px] relative overflow-hidden select-none"
          style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
          <div className="absolute top-3 left-3 bg-black/60 border border-white/10 rounded px-2 py-1 text-[10px] font-mono text-white/50 flex items-center gap-1.5 pointer-events-none z-10">
            <Activity className="w-3.5 h-3.5 text-cyan-400" /><span>Interactive node schematic</span>
          </div>
          <div className="absolute top-3 right-3 bg-black/60 border border-white/10 rounded px-2 py-1 text-[9px] font-mono text-white/40 pointer-events-none z-10">
            Drag header to move • click to configure
          </div>

          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            {edges.map((edge) => {
              const fromNode = nodes.find((n) => n.id === edge.fromNode);
              const toNode = nodes.find((n) => n.id === edge.toNode);
              if (!fromNode || !toNode) return null;
              const startX = fromNode.position.x + 160, startY = fromNode.position.y + 60;
              const endX = toNode.position.x, endY = toNode.position.y + 60;
              const active = isRunning && (runStage === edge.toNode || runStage === edge.fromNode);
              return (
                <path key={edge.id}
                  d={`M ${startX} ${startY} C ${startX + 70} ${startY}, ${endX - 70} ${endY}, ${endX} ${endY}`}
                  fill="none"
                  stroke={active ? 'rgba(0,229,255,0.95)' : fromNode.type === 'bypass' ? 'rgba(236,72,153,0.6)' : 'rgba(0,229,255,0.4)'}
                  strokeWidth={active ? 3 : 2.5}
                  className={isRunning ? 'stroke-dash-animated' : ''} />
              );
            })}
          </svg>

          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isActive = runStage === node.id;
            return (
              <div key={node.id} onClick={() => setSelectedNodeId(node.id)}
                className={`absolute w-44 bg-black/80 backdrop-blur-md border rounded-lg shadow-2xl z-20 ${
                  isActive ? 'border-cyan-300 ring-4 ring-cyan-500/40' : isSelected ? 'border-cyan-400 ring-4 ring-cyan-500/20' : node.type === 'bypass' ? 'border-pink-500/50' : 'border-white/10'
                }`}
                style={{ left: `${node.position.x}px`, top: `${node.position.y}px`, transition: draggedNodeId === node.id ? 'none' : 'box-shadow .2s, border-color .2s' }}>
                <div onMouseDown={(e) => handleDragStart(e, node.id)}
                  className={`text-[10px] uppercase tracking-wider font-bold p-1.5 rounded-t-lg select-none cursor-grab active:cursor-grabbing flex justify-between items-center ${
                    node.type === 'bypass' ? 'bg-pink-900/30 text-pink-300' : node.type === 'processor' ? 'bg-white/10 text-cyan-300' : 'bg-black/40 text-white/80'
                  }`}>
                  <span className="truncate pr-1">{node.title}</span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse shrink-0" />}
                </div>
                <div className="p-2 space-y-1">
                  {Object.entries(node.properties).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[8px] font-mono leading-none">
                      <span className="text-white/40 lowercase truncate max-w-[70px]">{k}:</span>
                      <span className="text-white/85 truncate max-w-[80px]">{v.toString()}</span>
                    </div>
                  ))}
                </div>
                <div className="p-1 px-1.5 flex justify-between bg-black/40 rounded-b-lg border-t border-white/5">
                  <div className="text-[7px] text-white/45 font-mono">{node.inputs[0] ? '● in' : ''}</div>
                  <div className="text-[7px] text-white/45 font-mono text-right">{node.outputs[0] ? 'out ●' : ''}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right column: live output + params + log */}
        <div className="xl:col-span-4 flex flex-col gap-4">

          {/* Live output */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90 uppercase tracking-wider font-mono">
              <Gauge className="w-4 h-4 text-cyan-400" /> Live output
            </div>
            <div className="flex items-center justify-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <canvas ref={inCanvasRef} width={SIZE} height={SIZE} role="img" aria-label="Input watermarked image"
                  className="w-[84px] h-[84px] rounded-lg border border-white/10 bg-black/40" />
                <span className="text-[8px] font-mono text-white/40 uppercase">input</span>
              </div>
              <ArrowRight className="w-4 h-4 text-white/30 shrink-0" />
              <div className="flex flex-col items-center gap-1">
                <canvas ref={outCanvasRef} width={SIZE} height={SIZE} role="img" aria-label="Pipeline output image"
                  className="w-[84px] h-[84px] rounded-lg border border-white/10 bg-black/40" />
                <span className="text-[8px] font-mono text-white/40 uppercase">output</span>
              </div>
            </div>
            <div className="bg-black/40 border border-white/10 rounded-xl p-3 text-center">
              <div className="text-3xl font-extrabold font-mono text-cyan-400">{detection == null ? '—' : `${detection}%`}</div>
              <div className="text-[9px] uppercase tracking-wider text-white/40 font-mono flex items-center justify-center">
                carrier correlation
                <InfoTip label="How strongly the synthetic ring carrier is still detectable in the output (0–100%). Watch it fall as the pipeline runs." />
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded mt-2 overflow-hidden">
                <div className="h-full bg-cyan-400 transition-all duration-500" style={{ width: `${detection ?? 0}%` }} />
              </div>
            </div>
            <p className="text-[9px] text-white/40 leading-snug">
              Mild edits attenuate but rarely <em>erase</em> a redundant carrier — a surviving score doesn&apos;t prove
              origin, and an absent one proves nothing. The case for signing provenance (C2PA).
            </p>
          </div>

          {/* Node parameters */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90 uppercase tracking-wider font-mono">
              <Settings className="w-4 h-4 text-cyan-400" /> Node parameters
            </div>
            {selectedNode ? (
              <div className="space-y-4">
                <div className="bg-black/40 border border-white/10 rounded-xl p-3">
                  <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider font-bold">Node</span>
                  <h4 className="text-xs font-bold text-white/90 mt-0.5">{selectedNode.title}</h4>
                  <span className="inline-flex items-center text-[9px] bg-black/60 border border-white/10 text-cyan-300 font-semibold px-1.5 py-0.5 rounded uppercase mt-2">
                    {selectedNode.type} node
                    <InfoTip label={NODE_TIP[selectedNode.type] || 'Pipeline node.'} />
                  </span>
                </div>
                <div className="space-y-3">
                  <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider font-bold">Attributes (mutable)</span>
                  {Object.entries(selectedNode.properties).map(([k, v]) => {
                    const isNum = typeof v === 'number';
                    const sp = sliderProps(k);
                    return (
                      <div key={k} className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-mono leading-none">
                          <span className="text-white/60 lowercase">{k}</span>
                          <span className="text-cyan-400 font-bold">{v.toString()}</span>
                        </div>
                        {isNum ? (
                          <input type="range" min={sp.min} max={sp.max} step={sp.step} value={v as number}
                            onChange={(e) => updateNodeProperty(selectedNode.id, k, parseFloat(e.target.value))}
                            className="w-full h-1 bg-white/10 accent-cyan-400 rounded-lg appearance-none cursor-pointer" />
                        ) : (
                          <input type="text" value={v as string}
                            onChange={(e) => updateNodeProperty(selectedNode.id, k, e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-[10px] font-mono text-white/90 focus:outline-none focus:border-cyan-500/50" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-white/40 leading-relaxed font-mono">Click a node to adjust its parameters.</div>
            )}
          </div>

          {/* Run log */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            <span className="text-[10px] uppercase text-white/40 font-bold font-mono tracking-wider">Pipeline run log</span>
            <div className="bg-black/60 border border-white/10 rounded-xl p-2.5 font-mono text-[9px] leading-relaxed text-white/60 space-y-1 max-h-[140px] overflow-y-auto">
              {log.map((l, idx) => (
                <div key={idx} className={l.includes('[result]') ? 'text-cyan-300 font-bold' : l.includes('correlation') ? 'text-white/70' : 'text-cyan-400/80'}>
                  ⚡ {l}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
