import React, { useState, useEffect } from 'react';
import {
  Type,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Binary,
  Lightbulb,
  Copy,
  Check,
  Sliders
} from 'lucide-react';
import { InfoTip } from './Tooltip';
import { GlossaryTerm } from './GlossaryTerm';

type Sample = { id: string; label: string; text: string; rephrased: string };

const SAMPLES: Sample[] = [
  {
    id: 'ai',
    label: 'AI & content',
    text:
      "The substantial development of modern artificial intelligence has fundamentally transformed the standard landscape of creative content creation. Many scholars agree that this progress introduces significant advantages for automated writing tasks, providing unprecedented speed and efficiency. However, it likewise poses complex concerns regarding authorship confirmation and misinformation propagation in public media forums. Thus, establishing robust mechanisms for provenance tracing remains extremely critical.",
    rephrased:
      "The huge growth of modern AI has totally changed how we make creative content today. A lot of researchers think this progress brings major perks for writing automation, making things faster and more efficient. Yet, it also brings up tricky issues about who wrote what and how fake news spreads on social networks. Because of this, making strong tools to track where text comes from is still super important.",
  },
  {
    id: 'climate',
    label: 'Climate science',
    text:
      "Recent observations consistently demonstrate that atmospheric carbon concentrations continue rising at unprecedented rates across industrialized regions. Numerous climatologists maintain that accelerating temperature anomalies threaten fragile coastal ecosystems and agricultural productivity worldwide. Consequently, governments increasingly prioritize substantial investment in renewable infrastructure and rigorous emissions monitoring. Establishing transparent accountability mechanisms therefore becomes absolutely essential for meaningful environmental progress.",
    rephrased:
      "New data keeps showing that the amount of carbon in the air is climbing faster than ever across big industrial areas. Plenty of climate experts warn that rising heat puts delicate coastal habitats and farm output at risk around the globe. So more governments are pouring money into clean energy and tighter pollution checks. Building open, honest tracking systems is now a must if we want real progress on the environment.",
  },
  {
    id: 'product',
    label: 'Product launch',
    text:
      "Our revolutionary platform fundamentally reimagines how distributed engineering teams collaborate across complex multinational organizations. Industry analysts repeatedly emphasize that seamless integration capabilities dramatically accelerate enterprise productivity and operational transparency. Furthermore, sophisticated automation features substantially reduce repetitive overhead, empowering specialists to concentrate on genuinely strategic initiatives. Ultimately, delivering measurable competitive advantage remains the defining priority behind every architectural decision.",
    rephrased:
      "Our new platform totally rethinks how spread-out engineering teams work together inside big global companies. Analysts keep pointing out that smooth, plug-and-play hookups speed up company output and make operations clearer. On top of that, smart automation cuts a lot of busywork, so experts can focus on the moves that actually matter. In the end, giving customers a real edge over rivals is the goal behind every design choice.",
  },
];

const SYNONYMS_MAP: Record<string, string> = {
  // Sample 1
  substantial: 'significant', development: 'growth', fundamentally: 'completely',
  transformed: 'reshaped', creative: 'originative', creation: 'production',
  progress: 'breakthrough', advantages: 'benefits', efficiency: 'productivity',
  likewise: 'also', propagation: 'dissemination', establishing: 'building',
  robust: 'strong', critical: 'vital',
  // Sample 2
  observations: 'measurements', demonstrate: 'show', atmospheric: 'airborne',
  concentrations: 'levels', unprecedented: 'record', industrialized: 'industrial',
  numerous: 'many', maintain: 'argue', accelerating: 'speeding', temperature: 'thermal',
  anomalies: 'spikes', threaten: 'endanger', fragile: 'delicate', coastal: 'shoreline',
  ecosystems: 'habitats', agricultural: 'farming', worldwide: 'globally',
  consequently: 'therefore', governments: 'states', increasingly: 'steadily',
  prioritize: 'favor', investment: 'funding', renewable: 'clean', infrastructure: 'systems',
  rigorous: 'strict', emissions: 'pollution', monitoring: 'tracking', transparent: 'open',
  accountability: 'oversight', essential: 'vital', meaningful: 'genuine', environmental: 'ecological',
  // Sample 3
  revolutionary: 'groundbreaking', platform: 'system', reimagines: 'rethinks',
  distributed: 'remote', engineering: 'technical', collaborate: 'cooperate',
  multinational: 'global', organizations: 'firms', analysts: 'experts', repeatedly: 'often',
  emphasize: 'stress', seamless: 'smooth', integration: 'linking', capabilities: 'features',
  dramatically: 'sharply', accelerate: 'speed', enterprise: 'business', operational: 'running',
  transparency: 'clarity', sophisticated: 'advanced', automation: 'tooling', substantially: 'greatly',
  repetitive: 'routine', overhead: 'busywork', empowering: 'enabling', specialists: 'experts',
  concentrate: 'focus', genuinely: 'truly', strategic: 'pivotal', initiatives: 'efforts',
  ultimately: 'finally', delivering: 'providing', measurable: 'tangible', competitive: 'market',
  advantage: 'edge', defining: 'central', priority: 'goal', architectural: 'design', decision: 'choice',
};

const HOMOGLYPHS_MAP: Record<string, string> = {
  a: 'а', // Cyrillic small letter a
  e: 'е', // Cyrillic small letter ie
  o: 'о', // Cyrillic small letter o
  p: 'р', // Cyrillic small letter er
  c: 'с', // Cyrillic small letter es
  i: 'і', // Cyrillic small letter byelorussian-ukrainian i
};

export default function TextBypassSandbox() {
  const [activeSample, setActiveSample] = useState<number>(0);
  const [inputText, setInputText] = useState<string>(SAMPLES[0].text);
  const [activeTactic, setActiveTactic] = useState<'none' | 'synonyms' | 'homoglyphs' | 'rephrase'>('none');

  // Text attack configuration states
  const [caseMutation, setCaseMutation] = useState<'standard' | 'upper' | 'lower' | 'leet'>('standard');
  const [smartPunc, setSmartPunc] = useState<boolean>(false);
  const [zeroWidthInjection, setZeroWidthInjection] = useState<boolean>(false);
  const [synonymRate, setSynonymRate] = useState<number>(100);

  // Statistics
  const [zScore, setZScore] = useState<number>(4.82);
  const [greenRatio, setGreenRatio] = useState<number>(76);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(processedTextData.plainText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Dynamic NLP token analysis + replacement simulation
  const processedTextData = React.useMemo(() => {
    const words = inputText.split(/\s+/);
    let greenCount = 0;
    let totalCount = 0;
    let plainText = '';

    const wordComponents = words.map((word, idx) => {
      const cleanWord = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");

      // Pseudo "favored / green" token (illustrative heuristic, not a real SynthID classifier)
      const isGreenDefault =
        cleanWord.length > 5 &&
        (cleanWord.includes('e') || cleanWord.includes('a') || cleanWord.includes('i')) &&
        cleanWord !== 'modern' && cleanWord !== 'scholars';

      let renderedWord = word;
      let isBypassed = false;
      let isHomoglyphModified = false;

      if (isGreenDefault) totalCount++;

      let shouldSwapSynonym = true;
      if (activeTactic === 'synonyms') {
        shouldSwapSynonym = ((idx * 31) % 100) < synonymRate;
      }

      if (activeTactic === 'synonyms' && shouldSwapSynonym) {
        if (isGreenDefault && SYNONYMS_MAP[cleanWord]) {
          const synonym = SYNONYMS_MAP[cleanWord];
          const isCapitalized = word[0] === word[0].toUpperCase();
          renderedWord = isCapitalized ? synonym[0].toUpperCase() + synonym.slice(1) : synonym;
          const lastChar = word[word.length - 1];
          if (/[.,/#!$%^&*;:{}=\-_`~()]/.test(lastChar)) renderedWord += lastChar;
          isBypassed = true;
        } else if (isGreenDefault) {
          greenCount++;
        }
      } else if (activeTactic === 'homoglyphs') {
        if (isGreenDefault) {
          let wordStr = word;
          let changed = false;
          for (const [latin, cyril] of Object.entries(HOMOGLYPHS_MAP)) {
            if (wordStr.includes(latin)) {
              wordStr = wordStr.split(latin).join(cyril);
              changed = true;
            }
          }
          renderedWord = wordStr;
          isHomoglyphModified = changed;
          isBypassed = changed;
        }
      } else if (activeTactic === 'rephrase') {
        // handled by loading the sample's rephrased text
      } else if (isGreenDefault) {
        greenCount++;
      }

      // Invisible zero-width space injection
      if (zeroWidthInjection && isGreenDefault && !isBypassed) {
        const mid = Math.floor(renderedWord.length / 2);
        renderedWord = renderedWord.slice(0, mid) + '​' + renderedWord.slice(mid);
        isBypassed = true;
        if (greenCount > 0) greenCount--;
      }

      // Smart curly punctuation adjustments
      if (smartPunc) {
        renderedWord = renderedWord
          .replace(/'/g, '’')
          .replace(/"/g, '”')
          .replace(/-/g, '—')
          .replace(/,/g, ' ,')
          .replace(/\./g, ' .');
      }

      // Case mutation
      if (caseMutation === 'upper') {
        renderedWord = renderedWord.toUpperCase();
      } else if (caseMutation === 'lower') {
        renderedWord = renderedWord.toLowerCase();
      } else if (caseMutation === 'leet') {
        renderedWord = renderedWord
          .replace(/[eE]/g, '3').replace(/[aA]/g, '4').replace(/[oO]/g, '0')
          .replace(/[tT]/g, '7').replace(/[iI]/g, '1');
      }

      plainText += renderedWord + ' ';

      return {
        id: idx,
        originalWord: word,
        displayedWord: renderedWord,
        isGreen: isGreenDefault && activeTactic !== 'rephrase',
        isBypassed,
        isHomoglyph: isHomoglyphModified,
      };
    });

    return { components: wordComponents, plainText: plainText.trim(), greenCount, totalCount };
  }, [inputText, activeTactic, caseMutation, smartPunc, zeroWidthInjection, synonymRate]);

  // Recalculate detector score
  useEffect(() => {
    if (activeTactic === 'rephrase') {
      setZScore(0.85);
      setGreenRatio(48);
    } else {
      const gCount = processedTextData.greenCount;
      const tCount = processedTextData.totalCount;
      if (tCount === 0) { setZScore(0); setGreenRatio(50); return; }
      setGreenRatio(Math.round((gCount / tCount) * 100));
      const stdDev = Math.sqrt(tCount * 0.25);
      const rawZ = (gCount - tCount * 0.5) / stdDev;
      setZScore(Math.max(0, Math.min(6.5, parseNumber(rawZ.toFixed(2)))));
    }
  }, [processedTextData, activeTactic]);

  function parseNumber(val: string): number {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  }

  const handleApplyTacticText = (t: 'none' | 'synonyms' | 'homoglyphs' | 'rephrase') => {
    setActiveTactic(t);
    if (t === 'rephrase') {
      setInputText(SAMPLES[activeSample].rephrased);
    } else if (inputText === SAMPLES[activeSample].rephrased) {
      setInputText(SAMPLES[activeSample].text);
    }
  };

  const selectSample = (i: number) => {
    setActiveSample(i);
    setInputText(SAMPLES[i].text);
    setActiveTactic('none');
  };

  const isBypassed = zScore < 1.96; // 95% confidence threshold is z = 1.96

  // --- shared blocks ---------------------------------------------------------
  const tacticBtn = (
    t: 'none' | 'synonyms' | 'homoglyphs' | 'rephrase',
    title: string,
    sub: React.ReactNode,
    subClass = 'text-white/40'
  ) => (
    <button
      onClick={() => handleApplyTacticText(t)}
      className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition cursor-pointer ${
        activeTactic === t
          ? 'bg-white/10 border-cyan-500/40 text-cyan-200 shadow-[0_0_8px_rgba(0,229,255,0.15)]'
          : 'bg-black/30 border-white/5 hover:border-white/10 text-white/60 hover:text-white'
      }`}
    >
      <div className={`w-3.5 h-3.5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
        activeTactic === t ? 'border-cyan-400' : 'border-white/20'
      }`}>
        {activeTactic === t && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-xs font-bold">{title}</span>
        <span className={`text-[10px] mt-1 font-mono ${subClass}`}>{sub}</span>
      </div>
    </button>
  );

  return (
    <div className="flex flex-col gap-6">

      {/* Row 1: sandbox + Z-score */}
      <div id="text-bypass-sandbox" className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Sandbox */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Type className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold uppercase tracking-wide text-white/90">
                  Text Watermark Token Sandbox
                </h3>
              </div>

              <div className="flex gap-1.5 items-center flex-wrap">
                {SAMPLES.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => selectSample(i)}
                    className={`text-[10px] px-2 py-1 rounded font-mono transition cursor-pointer border ${
                      activeSample === i
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200 font-bold'
                        : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
                <button
                  onClick={() => { setInputText(''); handleApplyTacticText('none'); }}
                  className="text-[10px] px-2 py-1 rounded bg-white/5 border border-white/10 text-white/50 hover:text-rose-400 flex items-center gap-1 transition cursor-pointer font-mono"
                >
                  <Trash2 className="w-3 h-3" /> Clear
                </button>
              </div>
            </div>

            <p className="text-xs text-white/55 mb-4 leading-relaxed">
              LLM output watermarked with a <strong className="text-white/75">SynthID-style</strong> token bias carries a
              structured sequence. Switch samples and edit the text below to watch the statistical signal fall out of sync
              with the detector. (Illustrative simulation — not a real SynthID classifier.)
            </p>

            <div className="grid grid-cols-1 gap-4">
              {/* Source textarea */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase font-bold text-white/40 font-mono">Source Document Text</label>
                <textarea
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    if (activeTactic === 'rephrase') setActiveTactic('none');
                  }}
                  disabled={activeTactic === 'rephrase'}
                  rows={4}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white/90 focus:outline-none focus:border-cyan-500/50 font-sans leading-relaxed resize-none disabled:opacity-60"
                  placeholder="Type or paste AI-generated text here..."
                />
              </div>

              {/* Stego token visualization */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] uppercase font-bold text-white/40 font-mono">stego-token stream visualization</label>
                  <div className="flex gap-3 text-[9px] font-mono leading-none">
                    <span className="flex items-center gap-1 text-white/40">
                      <span className="w-2 h-2 rounded bg-white/5 border border-white/10 inline-block" />
                      Regular Word
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="w-2 h-2 rounded bg-emerald-500/20 border border-emerald-500/40 inline-block" />
                      Favored Token (Stego)
                    </span>
                    {activeTactic !== 'none' && (
                      <span className="flex items-center gap-1 text-pink-400">
                        <span className="w-2 h-2 rounded bg-pink-500/15 border border-pink-500/35 inline-block" />
                        Perturbed / Bypassed
                      </span>
                    )}
                  </div>
                </div>

                <div className="w-full bg-black/40 border border-white/10 rounded-xl p-4 font-sans text-xs text-white/90 leading-6 min-h-[140px] relative">
                  {processedTextData.components.length === 0 ? (
                    <span className="text-white/30 font-mono">Type text above to verify stego hashes...</span>
                  ) : (
                    <div className="flex flex-wrap gap-x-1 gap-y-1">
                      {processedTextData.components.map((c) => (
                        <span
                          key={c.id}
                          className={`px-1 rounded inline-block transition duration-200 ${
                            c.isBypassed
                              ? c.isHomoglyph
                                ? 'bg-pink-500/15 border border-pink-500/35 text-pink-300 font-mono text-[11px] font-bold line-through'
                                : 'bg-pink-500/15 border border-pink-500/35 text-pink-300 font-semibold'
                              : c.isGreen
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-medium'
                              : 'text-white/70 border border-transparent'
                          }`}
                          title={
                            c.isHomoglyph
                              ? `Adversarial Unicode Swap:\n'${c.originalWord}' -> '${c.displayedWord}'`
                              : c.isBypassed
                              ? `Synonym Shifted:\n'${c.originalWord}' -> '${c.displayedWord}'`
                              : c.isGreen
                              ? `Favored Stego Carrier Word`
                              : `Standard Unbiased Word`
                          }
                        >
                          {c.displayedWord}
                        </span>
                      ))}
                    </div>
                  )}

                  {processedTextData.components.length > 0 && (
                    <button
                      onClick={handleCopyText}
                      className="absolute bottom-3 right-3 bg-black/60 border border-white/10 text-white/60 hover:text-white hover:border-white/20 py-1.5 px-2.5 rounded text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                    >
                      {isCopied ? (<><Check className="w-3 h-3 text-emerald-400 animate-scale" /> Copied!</>) : (<><Copy className="w-3 h-3" /> Copy Plaintxt</>)}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Z-score metric */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Binary className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-white/95">Stego <GlossaryTerm id="z-score" side="bottom">Z-Score</GlossaryTerm> Metric</h3>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2 text-center">
              <div className={`text-4xl font-extrabold tracking-tight font-mono ${isBypassed ? 'text-emerald-400' : 'text-red-400 animate-pulse'}`}>
                {zScore}
              </div>
              <div className="text-[10px] uppercase tracking-wider font-semibold text-white/40 flex items-center justify-center">Detector Z-Score<InfoTip label="Standard score for how skewed the word choice is. Above 1.96 (95% confidence) the favored-token bias is statistically improbable for human writing." /></div>

              <div className={`text-[10px] px-2.5 py-1 font-bold rounded flex items-center gap-1.5 ${
                isBypassed ? 'bg-emerald-500/10 border border-emerald-500/35 text-emerald-400' : 'bg-red-500/10 border border-red-500/35 text-rose-400'
              }`}>
                {isBypassed ? (<><ShieldCheck className="w-3.5 h-3.5" /> Watermark Signal Lost</>) : (<><ShieldAlert className="w-3.5 h-3.5" /> Watermark Detected</>)}
              </div>

              <p className="text-[10px] text-white/50 text-center leading-normal mt-1.5">
                {isBypassed ? (
                  <span>Z-score is <strong className="text-emerald-400">&lt; 1.96</strong>. The token distribution fits normal human writing statistics. No detection.</span>
                ) : (
                  <span>Z-score is <strong className="text-red-400">&gt; 1.96</strong>. Improbably high count of <GlossaryTerm id="favored-tokens">favored words</GlossaryTerm> — a statistical detector flags this as AI-marked.</span>
                )}
              </p>

              <div className="border-t border-white/5 pt-3.5 mt-2 flex flex-col gap-1.5 w-full text-left font-sans">
                <span className="text-[9px] uppercase font-bold tracking-widest text-white/40">Calibrate Robustness Class</span>
                <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-lg border border-white/5 font-mono text-[9px] font-bold">
                  <button onClick={() => handleApplyTacticText('none')}
                    className={`py-1 px-1.5 rounded transition text-center cursor-pointer ${zScore >= 3.0 ? 'bg-red-500/25 border border-red-500/40 text-red-300 shadow-[0_0_8px_rgba(255,74,46,0.2)]' : 'text-white/40 hover:text-white/80'}`}>
                    Class A
                  </button>
                  <button onClick={() => handleApplyTacticText('synonyms')}
                    className={`py-1 px-1.5 rounded transition text-center cursor-pointer ${zScore >= 1.96 && zScore < 3.0 ? 'bg-amber-500/25 border border-amber-500/40 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]' : 'text-white/40 hover:text-white/80'}`}>
                    Class B
                  </button>
                  <button onClick={() => handleApplyTacticText('rephrase')}
                    className={`py-1 px-1.5 rounded transition text-center cursor-pointer ${zScore < 1.96 ? 'bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 shadow-[0_0_8px_rgba(0,229,255,0.2)]' : 'text-white/40 hover:text-white/80'}`}>
                    Class C
                  </button>
                </div>
                <p className="text-[8.5px] text-white/55 leading-normal select-none font-mono min-h-[30px]">
                  {zScore >= 3.0 && "Class A: Unaltered output structure. Favored-token markers highly active (Z > 3)."}
                  {zScore >= 1.96 && zScore < 3.0 && "Class B: Weakened markers due to synonym substitution (1.96 ≤ Z < 3)."}
                  {zScore < 1.96 && "Class C: Sequence correlation scrambled by a full rephrase (Z < 1.96)."}
                </p>
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl p-3 text-[10px] font-mono text-white/50 space-y-1.5">
              <div className="flex justify-between">
                <span className="flex items-center">Favored Token Share:<InfoTip label="Share of words the watermark nudged the model to prefer. An improbably high share (vs a 50% baseline) is the statistical fingerprint." /></span>
                <span className={isBypassed ? "text-white/70" : "text-emerald-400"}>{greenRatio}% (vs 50% baseline)</span>
              </div>
              <div className="flex justify-between"><span>Preceding <GlossaryTerm id="context-hash">Context Hash</GlossaryTerm> N:</span><span className="text-white/70">4 tokens</span></div>
              <div className="flex justify-between"><span>Statistical Validation:</span><span className="text-white/70">Pearson Chi-Squared</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: controls under the sandbox (balanced 2-up) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Text Edit Tactics */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/90 font-mono">Text Edit Tactics</h3>
          <div className="flex flex-col gap-2">
            {tacticBtn('none', 'Clean Stego Output', 'No edits. Fully watermarked.')}
            {tacticBtn('synonyms', 'Synonym Jitter Attack', 'Replaces favored words with synonyms.')}
            {tacticBtn('homoglyphs', 'Unicode Homoglyph Swap', 'Visually identical — breaks byte matching', 'text-rose-400 font-semibold')}
            {tacticBtn('rephrase', 'Full Deep Rephrase / Rewrite', 'Simulates a rewrite pass.')}
          </div>
          <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex gap-2.5">
            <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-white/55 leading-normal">
              <strong>Why did the Z-score drop?</strong> Token watermarks (the SynthID-for-Text family) are incredibly
              fragile to <GlossaryTerm id="homoglyph">homoglyph</GlossaryTerm> or synonym changes — altering spelling breaks the context-hash chain and resets the
              favored/neutral sequence.
            </p>
          </div>
        </div>

        {/* Adversarial Noise Sliders */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/90 font-mono">Adversarial Noise Sliders</h3>
          </div>
          <p className="text-xs text-white/55 leading-relaxed">
            Direct character and sequencing adjustments. Test the detection resistance of the active token group.
          </p>

          <div className="space-y-4 font-mono text-[10px] bg-black/30 p-3 rounded-xl border border-white/5">
            <div className="space-y-1">
              <div className="flex justify-between text-white/75">
                <span>Synonym Jitter Rate:</span>
                <span className="text-indigo-300 font-bold">{synonymRate}%</span>
              </div>
              <input type="range" min="10" max="100" step="10" disabled={activeTactic !== 'synonyms'} value={synonymRate}
                onChange={(e) => setSynonymRate(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded appearance-none accent-indigo-400 cursor-pointer disabled:opacity-30" />
              <span className="text-[8px] text-white/30 block leading-tight">Controls synonym substitution density. Only active in synonym mode.</span>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-2">
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-white/80 font-bold leading-normal">Zero-Width Space Injection</span>
                <span className="text-[8.5px] text-white/40 leading-normal font-sans text-left">Splits word tokens invisibly in the DOM, keeping text readable while breaking byte matches.</span>
              </div>
              <button onClick={() => setZeroWidthInjection(!zeroWidthInjection)}
                className={`text-[9px] font-bold px-2.5 py-1 rounded transition select-none flex-shrink-0 cursor-pointer ${zeroWidthInjection ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-200 shadow-[0_0_8px_rgba(99,102,241,0.2)]' : 'bg-white/5 border border-white/10 text-white/40'}`}>
                {zeroWidthInjection ? 'INJECTED' : 'OFF'}
              </button>
            </div>

            <div className="space-y-1 border-t border-white/5 pt-2 flex flex-col gap-1.5">
              <span className="text-white/75 font-semibold text-left">Casing Token Mutator:</span>
              <div className="grid grid-cols-4 gap-1 text-[8.5px]">
                {(['standard', 'upper', 'lower', 'leet'] as const).map((mode) => (
                  <button key={mode} onClick={() => setCaseMutation(mode)}
                    className={`py-1 px-0.5 rounded border transition cursor-pointer text-center select-none uppercase font-bold text-[8.2px] ${caseMutation === mode ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200 font-extrabold shadow-[0_0_6px_rgba(99,102,241,0.15)]' : 'bg-black/20 border-white/5 text-white/40 hover:text-white/70'}`}>
                    {mode === 'standard' ? 'STD' : mode === 'leet' ? '1337' : mode}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-2">
              <div className="flex flex-col pr-2">
                <span className="text-white/80 font-bold text-left">Smart Punc Modifier</span>
                <span className="text-[8.5px] text-white/40 leading-normal font-sans text-left">Swaps straight quotes and dashes and adds spacing cues to fail precise regex matching.</span>
              </div>
              <button onClick={() => setSmartPunc(!smartPunc)}
                className={`text-[9px] font-bold px-2.5 py-1 rounded transition select-none flex-shrink-0 cursor-pointer ${smartPunc ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-200 shadow-[0_0_8px_rgba(99,102,241,0.2)]' : 'bg-white/5 border border-white/10 text-white/40'}`}>
                {smartPunc ? 'ACTIVE' : 'OFF'}
              </button>
            </div>
          </div>

          <button
            onClick={() => { setCaseMutation('standard'); setSmartPunc(false); setZeroWidthInjection(false); setSynonymRate(100); }}
            className="w-full text-[10px] font-bold py-1.5 border border-dashed border-white/10 hover:border-white/20 hover:bg-white/5 rounded-lg text-white/50 hover:text-white/80 transition cursor-pointer text-center font-mono"
          >
            Reset NLP Noise
          </button>
        </div>
      </div>
    </div>
  );
}
