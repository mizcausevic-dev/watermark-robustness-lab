/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldCheck,
  Layers,
  Tv,
  BookOpen,
  Network,
  CornerDownRight,
  Info,
  ArrowUpRight,
  ArrowRight
} from 'lucide-react';
import ImageSandbox from './components/ImageSandbox';
import TextBypassSandbox from './components/TextBypassSandbox';
import ComfyUIWorkflow from './components/ComfyUIWorkflow';
import { RESEARCH_BACKGROUNDS } from './data';

type TabId = 'images' | 'text' | 'comfy' | 'research';

const KG_URL = 'https://kineticgain.com/';
const TRUST_URL = 'https://kineticgain.com/trust/';
const C2PA_URL = 'https://contentcredentials.org/';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('images');
  const [activeBgTopic, setActiveBgTopic] = useState<string>('how_synthid_works');

  return (
    <div className="min-h-screen bg-[#050508] text-white font-sans selection:bg-cyan-500/25 selection:text-cyan-200 relative overflow-x-hidden">

      {/* Animated Mesh Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-cyan-900/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header Container */}
      <header className="sticky top-0 z-50 h-16 flex items-center justify-between border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold tracking-tight text-white/90">
                  Watermark <span className="text-cyan-400">Robustness Lab</span>
                </h1>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono uppercase tracking-widest hidden sm:inline-block">
                  Educational
                </span>
              </div>
              <div className="text-[10px] text-white/40 font-mono leading-none mt-0.5 hidden sm:block">
                Provenance robustness · Kinetic Gain
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto p-0.5 bg-white/5 backdrop-blur-md rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab('images')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold leading-none cursor-pointer transition ${
                activeTab === 'images'
                  ? 'bg-white/10 border border-white/20 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Image Lab</span>
              <span className="sm:hidden">Images</span>
            </button>

            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold leading-none cursor-pointer transition ${
                activeTab === 'text'
                  ? 'bg-white/10 border border-white/20 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Text Lab</span>
              <span className="sm:hidden">Text</span>
            </button>

            <button
              onClick={() => setActiveTab('comfy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold leading-none cursor-pointer transition ${
                activeTab === 'comfy'
                  ? 'bg-white/10 border border-white/20 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              Pipeline
            </button>

            <button
              onClick={() => setActiveTab('research')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold leading-none cursor-pointer transition ${
                activeTab === 'research'
                  ? 'bg-white/10 border border-white/20 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.25)]'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Briefing
            </button>
          </nav>

          <a
            href={KG_URL}
            target="_blank"
            rel="noreferrer"
            className="hidden lg:flex items-center space-x-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-full transition"
          >
            <span className="text-[10px] text-white/60 font-mono tracking-widest uppercase">Kinetic Gain</span>
            <ArrowUpRight className="w-3 h-3 text-white/40" />
          </a>

        </div>
      </header>

      {/* Main content body grid layout space */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

        {/* Honest scope banner — the integrity guardrail, made unmissable */}
        <div className="flex items-start gap-3 bg-amber-500/[0.06] border border-amber-500/25 rounded-xl px-4 py-3">
          <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <p className="text-[11px] sm:text-xs text-amber-100/80 leading-relaxed">
            <strong className="text-amber-200">Educational simulation.</strong> This lab injects its own
            <em> synthetic</em> watermark and analyses it entirely in your browser. It does <strong>not</strong> detect,
            contain, or remove Google SynthID or any production watermark, and nothing you load is uploaded. The point is
            to show <em>why</em> in-band watermarks are fragile — and why durable provenance needs cryptographic
            {' '}<a href={C2PA_URL} target="_blank" rel="noreferrer" className="underline decoration-dotted hover:text-white">Content Credentials (C2PA)</a>.
          </p>
        </div>

        {/* Overview header callout card in Glassmorphic theme */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="space-y-2 max-w-2xl">
            <h2 className="text-lg font-bold tracking-tight text-white/90">
              Why hidden watermarks break — and what actually proves origin
            </h2>
            <p className="text-xs text-white/60 leading-relaxed">
              Steganographic watermarks (the family systems like Google&apos;s SynthID belong to) hide a recoverable
              signal in frequency coefficients or model latents. They survive casual edits, but a signal hidden
              <em> inside</em> the pixels can be attenuated by edits that target where it lives — notch filtering,
              denoising, re-encoding, rescaling, or paraphrasing. Use the labs to feel that fragility first-hand,
              then read why <strong className="text-white/80">cryptographically signed provenance</strong> is the
              durable layer underneath.
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0 bg-black/40 border border-white/10 rounded-xl p-4 font-mono text-[10px] text-white/50">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Mode: <strong className="text-white/80">In-browser simulation</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              <span>Signal: <strong className="text-white/80">Synthetic ring carrier</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              <span>Goal: <strong className="text-cyan-300">Make the case for C2PA</strong></span>
            </div>
          </div>
        </div>

        {/* Dynamic Display of Lab Workspace Views */}
        <div className="min-h-[460px]">
          <AnimatePresence mode="wait">
            {activeTab === 'images' && (
              <motion.div
                key="images"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.18 }}
              >
                <ImageSandbox />
              </motion.div>
            )}

            {activeTab === 'text' && (
              <motion.div
                key="text"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.18 }}
              >
                <TextBypassSandbox />
              </motion.div>
            )}

            {activeTab === 'comfy' && (
              <motion.div
                key="comfy"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.18 }}
              >
                <ComfyUIWorkflow />
              </motion.div>
            )}

            {activeTab === 'research' && (
              <motion.div
                key="research"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.18 }}
                className="grid grid-cols-1 md:grid-cols-12 gap-6"
              >

                {/* Topic navigation */}
                <div id="topics-nav" className="md:col-span-4 flex flex-col gap-3">
                  <div className="text-[10px] uppercase font-bold text-white/40 font-mono tracking-wider px-2">
                    Provenance Briefing
                  </div>

                  {RESEARCH_BACKGROUNDS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setActiveBgTopic(t.id)}
                      className={`p-3 text-left rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                        activeBgTopic === t.id
                          ? 'bg-white/10 border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.15)]'
                          : 'bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/20 text-white/60'
                      }`}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold leading-tight">{t.title}</span>
                        <span className="text-[10px] text-white/40 truncate mt-1">{t.summary}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  ))}
                </div>

                {/* Topic detail renderer */}
                <div id="topic-detail" className="md:col-span-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 shadow-xl space-y-5">
                  {(() => {
                    const topic = RESEARCH_BACKGROUNDS.find(r => r.id === activeBgTopic);
                    if (!topic) return null;
                    return (
                      <>
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <h3 className="text-base font-bold text-white/95">{topic.title}</h3>
                            <p className="text-xs text-white/50 mt-1">{topic.summary}</p>
                          </div>
                          {topic.reference && (
                            <a
                              href={topic.reference}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-mono px-2 py-1 rounded bg-black/40 border border-white/10 text-cyan-400 hover:text-white transition shrink-0 flex items-center gap-1"
                            >
                              Reference <ArrowUpRight className="w-3 h-3" />
                            </a>
                          )}
                        </div>

                        <div className="bg-black/30 border border-white/10 rounded-xl p-4 space-y-4">
                          {topic.details.map((detail, index) => {
                            const splitAt = detail.indexOf(': ');
                            const title = splitAt > -1 ? detail.slice(0, splitAt) : '';
                            const body = splitAt > -1 ? detail.slice(splitAt + 2) : detail;
                            return (
                              <div key={index} className="flex gap-3 items-start">
                                <CornerDownRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  {title && <h4 className="text-xs font-bold text-white/90">{title}</h4>}
                                  <p className="text-xs text-white/50 leading-relaxed font-sans">{body}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="p-3.5 bg-cyan-950/15 border border-cyan-800/30 rounded-lg flex gap-3 text-cyan-300">
                          <ShieldCheck className="w-5 h-5 shrink-0" />
                          <p className="text-[11px] font-medium leading-relaxed font-sans text-cyan-100">
                            <strong>Why this lab exists:</strong> mapping where a provenance signal breaks is how you
                            justify the layer that doesn&apos;t — cryptographic Content Credentials. Explore
                            {' '}<a href={TRUST_URL} target="_blank" rel="noreferrer" className="underline decoration-dotted hover:text-white">Kinetic Gain&apos;s Trust Pack</a> for the governance side.
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </main>

      <footer className="bg-[#050508]/60 backdrop-blur-md border-t border-white/5 flex flex-col sm:flex-row items-center justify-between px-8 text-[10px] text-white/30 font-mono tracking-wider z-10 gap-2 py-4 mt-12 w-full">
        <div>
          Educational simulation · no real watermark is processed · nothing leaves your browser
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 justify-center">
          <a href={C2PA_URL} target="_blank" rel="noreferrer" className="hover:text-white/60 transition">The fix → C2PA</a>
          <a href={KG_URL} target="_blank" rel="noreferrer" className="hover:text-white/60 transition">kineticgain.com</a>
          <span className="text-white/40">Apache-2.0</span>
        </div>
      </footer>

    </div>
  );
}
