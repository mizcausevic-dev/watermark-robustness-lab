import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Network, 
  Settings, 
  Plus, 
  HelpCircle, 
  FolderLock, 
  Play, 
  Activity,
  Maximize2,
  Trash2,
  Sparkles
} from 'lucide-react';
import { INITIAL_COMFY_NODES, INITIAL_COMFY_EDGES } from '../data';
import { ComfyNode, ComfyEdge } from '../types';

export default function ComfyUIWorkflow() {
  const [nodes, setNodes] = useState<ComfyNode[]>(INITIAL_COMFY_NODES);
  const [edges, setEdges] = useState<ComfyEdge[]>(INITIAL_COMFY_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('3'); // Highlight SynthID Notch by default
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [simulatedLog, setSimulatedLog] = useState<string[]>(['[Pipeline] Loaded workflow schema successfully...', '[Pipeline] Bound reference latent architecture...']);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const handleDragStart = (e: React.MouseEvent, id: string) => {
    setDraggedNodeId(id);
    const node = nodes.find(n => n.id === id);
    if (node) {
      setDragOffset({
        x: e.clientX - node.position.x,
        y: e.clientY - node.position.y
      });
    }
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (draggedNodeId !== null) {
      const updatedNodes = nodes.map(n => {
        if (n.id === draggedNodeId) {
          return {
            ...n,
            position: {
              x: Math.min(1250, Math.max(10, e.clientX - dragOffset.x)),
              y: Math.min(480, Math.max(20, e.clientY - dragOffset.y))
            }
          };
        }
        return n;
      });
      setNodes(updatedNodes);
    }
  };

  const handleDragEnd = () => {
    setDraggedNodeId(null);
  };

  const updateNodeProperty = (nodeId: string, propKey: string, val: string | number | boolean) => {
    const updated = nodes.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          properties: {
            ...n.properties,
            [propKey]: val
          }
        };
      }
      return n;
    });
    setNodes(updated);
  };

  const autoAlignNodes = () => {
    // Determine topological order or level structure (left-to-right logical layout)
    const levels: Record<string, number> = {};
    nodes.forEach(n => {
      levels[n.id] = 0;
    });

    // Run custom relaxation to find dependencies and columns
    for (let iter = 0; iter < nodes.length; iter++) {
      edges.forEach(edge => {
        const fromLvl = levels[edge.fromNode] || 0;
        const toLvl = levels[edge.toNode] || 0;
        if (toLvl <= fromLvl) {
          levels[edge.toNode] = fromLvl + 1;
        }
      });
    }

    // Group nodes by levels
    const levelGroups: Record<number, string[]> = {};
    nodes.forEach(n => {
      const lvl = levels[n.id];
      if (!levelGroups[lvl]) {
        levelGroups[lvl] = [];
      }
      levelGroups[lvl].push(n.id);
    });

    // Remap positions to a clear layout flow
    const updatedNodes = nodes.map(n => {
      const lvl = levels[n.id];
      const siblings = levelGroups[lvl] || [];
      const itemIndex = siblings.indexOf(n.id);
      
      // Calculate scannable coordinates
      // Columns are spaced horizontally starting from 30px
      const x = 30 + lvl * 205;
      
      // Distribute nodes in the same column vertically
      const totalInCol = siblings.length;
      let y = 140; // Default vertical placement

      if (totalInCol > 1) {
        // Distribute nicely along the height
        const availableHeight = 280; // range from 40 to 320
        const step = availableHeight / (totalInCol + 1);
        y = step * (itemIndex + 1) + 40;
      } else {
        // Single central placement with a subtle staggered vertical offset depending on level
        y = 110 + (lvl % 2 === 0 ? 35 : 10);
      }

      return {
        ...n,
        position: { x: Math.round(x), y: Math.round(y) }
      };
    });

    setNodes(updatedNodes);
    setSimulatedLog(prev => [...prev, '[Workflow] Layout auto-aligned topologically from left to right!']);
  };

  const triggerComfyPipeline = () => {
    setIsRunning(true);
    setSimulatedLog(prev => [...prev, `[Workflow] Initializing perturbation pass...`]);

    // Simulate pipeline run logs step-by-step
    setTimeout(() => {
      setSimulatedLog(prev => [...prev, `[Node 1] Streaming input_artwork.png...`]);
    }, 400);

    setTimeout(() => {
      const notchNode = nodes.find(n => n.id === '3');
      const rad = notchNode?.properties['notch_radius'] || 42.0;
      setSimulatedLog(prev => [...prev, `[Node 3] Frequency notch filter applied (R: ${rad}px, BW: 6px)`]);
    }, 1000);

    setTimeout(() => {
      setSimulatedLog(prev => [...prev, `[Node 4] Noise jitter: applied random displacement scaling (0.08)`]);
    }, 1600);

    setTimeout(() => {
      setSimulatedLog(prev => [...prev, `[Node 6] Saved perturbed_output.png`]);
      setSimulatedLog(prev => [...prev, `[RESULT] Synthetic-carrier correlation dropped toward 0% — illustrates fragility`]);
      setIsRunning(false);
    }, 2200);
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div id="comfy-workflow-panel" className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col gap-6">
      
      {/* Visual Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2.5">
          <Network className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/95">
              Perturbation Pipeline — How Edits Compose
            </h3>
            <p className="text-[11px] text-white/55 mt-0.5 leading-snug">
              A schematic of how the same transformations chain together. Drag nodes and tune properties to see how a multi-step edit pass attenuates a fragile in-band signal.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={triggerComfyPipeline}
            disabled={isRunning}
            className="bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/25 disabled:opacity-50 text-xs font-bold py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running...' : 'Run Pipeline'}
          </button>

          <button
            onClick={autoAlignNodes}
            className="bg-cyan-500/10 hover:bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 hover:text-cyan-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_8px_rgba(34,211,238,0.15)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Auto-Align
          </button>

          <button
            onClick={() => {
              setNodes(INITIAL_COMFY_NODES);
              setEdges(INITIAL_COMFY_EDGES);
              setSimulatedLog(['[Comfy] Workflow layout restored to defaults...']);
            }}
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
          >
            Reset Flow
          </button>
        </div>
      </div>

      {/* Primary Layout grid: Interactive Stage & Node Properties Info */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        
        {/* Schematic Canvas Stage (100% interactive) */}
        <div 
          onMouseMove={handleDrag}
          onMouseUp={handleDragEnd}
          className="xl:col-span-8 bg-black/40 border border-white/10 rounded-xl min-h-[460px] relative overflow-hidden select-none"
          style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '16px 16px' }}
        >
          
          <div className="absolute top-3 left-3 bg-black/60 border border-white/10 rounded px-2 py-1 text-[10px] font-mono text-white/50 flex items-center gap-1.5 pointer-events-none z-10 select-none">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Interactive Node schematic</span>
          </div>

          <div className="absolute top-3 right-3 bg-black/60 border border-white/10 rounded px-2 py-1 text-[9px] font-mono text-white/40 pointer-events-none z-10 select-none">
            Drag Header to Move • Click node to Configure
          </div>

          {/* Render SVG lines representing the node edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
            {edges.map((edge) => {
              const fromNode = nodes.find(n => n.id === edge.fromNode);
              const toNode = nodes.find(n => n.id === edge.toNode);
              if (!fromNode || !toNode) return null;

              // Node spatial coordinates relative to outputs
              const startX = fromNode.position.x + 160;
              const startY = fromNode.position.y + 60;
              const endX = toNode.position.x;
              const endY = toNode.position.y + 60;

              // Compute nice Bezier cubic vector curves
              const cp1X = startX + 70;
              const cp1Y = startY;
              const cp2X = endX - 70;
              const cp2Y = endY;

              return (
                <path
                  key={edge.id}
                  d={`M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`}
                  fill="none"
                  stroke={fromNode.type === 'bypass' ? 'rgba(236, 72, 153, 0.7)' : 'rgba(34, 211, 238, 0.45)'}
                  strokeWidth="2.5"
                  className={isRunning ? "stroke-dash-animated" : ""}
                />
              );
            })}
          </svg>

          {/* Render draggable Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            return (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                className={`absolute w-44 bg-black/80 backdrop-blur-md border rounded-lg shadow-2xl z-20 ${
                  isSelected 
                    ? 'border-cyan-400 ring-4 ring-cyan-500/20' 
                    : node.type === 'bypass'
                    ? 'border-pink-500/50'
                    : 'border-white/10'
                }`}
                style={{ 
                  left: `${node.position.x}px`, 
                  top: `${node.position.y}px`,
                  transition: draggedNodeId === node.id ? 'none' : 'box-shadow 0.2s, border-color 0.2s'
                }}
              >
                {/* Node Drag Header */}
                <div
                  onMouseDown={(e) => handleDragStart(e, node.id)}
                  className={`text-[10px] uppercase tracking-wider font-bold p-1.5 rounded-t-lg select-none cursor-grab active:cursor-grabbing flex justify-between items-center ${
                    node.type === 'bypass' 
                      ? 'bg-pink-900/30 text-pink-300' 
                      : node.type === 'processor'
                      ? 'bg-white/10 text-cyan-300'
                      : 'bg-black/40 text-white/80'
                  }`}
                >
                  <span className="truncate pr-1">{node.title}</span>
                  <span className="text-[7px] bg-white/10 px-1 py-0.5 rounded text-white/50">v2</span>
                </div>

                {/* Node properties panel content preview */}
                <div className="p-2 space-y-1">
                  {Object.entries(node.properties).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-[8px] font-mono leading-none">
                      <span className="text-white/40 lowercase truncate max-w-[70px]">{k}:</span>
                      <span className="text-white/85 truncate max-w-[80px]">{v.toString()}</span>
                    </div>
                  ))}
                </div>

                {/* Left/Right connector handles visual only for clarity */}
                <div className="p-1 px-1.5 flex justify-between bg-black/40 rounded-b-lg border-t border-white/5">
                  <div className="text-[7px] text-white/45 font-mono">
                    {node.inputs[0] ? `● in` : ''}
                  </div>
                  <div className="text-[7px] text-white/45 font-mono text-right">
                    {node.outputs[0] ? `out ●` : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Node Properties Editor Dashboard */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-white/90 uppercase tracking-wider font-mono">
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>Node parameters</span>
            </div>

            {selectedNode ? (
              <div className="space-y-4">
                <div className="bg-black/40 border border-white/10 rounded-xl p-3">
                  <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider font-bold">Node Name</span>
                  <h4 className="text-xs font-bold text-white/90 mt-0.5">{selectedNode.title}</h4>
                  <span className="inline-block text-[9px] bg-black/60 border border-white/10 text-cyan-300 font-semibold px-1.5 py-0.5 rounded uppercase mt-2">
                    {selectedNode.type} Node
                  </span>
                </div>

                {/* Render input sliders based on Node type */}
                <div className="space-y-3">
                  <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider font-bold">Attributes (Mutable)</span>
                  
                  {Object.entries(selectedNode.properties).map(([k, v]) => {
                    const isNum = typeof v === 'number';
                    return (
                      <div key={k} className="space-y-1">
                        <div className="flex justify-between items-center text-[10px] font-mono leading-none">
                          <span className="text-white/60 lowercase">{k}</span>
                          <span className="text-teal-400 font-bold">{v.toString()}</span>
                        </div>
                        
                        {isNum ? (
                          <input
                            type="range"
                            min={k.includes('radius') ? "10" : "0"}
                            max={k.includes('strictness') ? "1" : "100"}
                            step={k.includes('strictness') ? "0.05" : "1"}
                            value={v as number}
                            onChange={(e) => updateNodeProperty(selectedNode.id, k, parseFloat(e.target.value))}
                            className="w-full h-1 bg-white/10 accent-teal-400 rounded-lg appearance-none cursor-pointer"
                          />
                        ) : (
                          <input
                            type="text"
                            value={v as string}
                            onChange={(e) => updateNodeProperty(selectedNode.id, k, e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded p-2 text-[10px] font-mono text-white/90 focus:outline-none focus:border-cyan-500/50"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-white/40 leading-relaxed font-mono">
                Click a node inside the schematic to adjust properties in real-time.
              </div>
            )}
          </div>

          {/* Comfy console logger readout feedback */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            <span className="text-[10px] uppercase text-white/40 font-bold font-mono tracking-wider">
              Comfy Terminal Pipeline logs
            </span>

            <div className="bg-black/60 border border-white/10 rounded-xl p-2.5 font-mono text-[9px] leading-relaxed text-white/60 space-y-1 max-h-[140px] overflow-y-auto">
              {simulatedLog.map((log, idx) => (
                <div 
                  key={idx} 
                  className={
                    log.includes('[RESULT]') 
                      ? 'text-emerald-400 font-bold animate-pulse' 
                      : log.includes('bypass') 
                      ? 'text-pink-300' 
                      : 'text-cyan-400'
                  }
                >
                  ⚡ {log}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
