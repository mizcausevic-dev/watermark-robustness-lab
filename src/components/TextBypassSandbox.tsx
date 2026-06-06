import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Type, 
  RefreshCw, 
  Trash2, 
  HelpCircle, 
  ShieldCheck, 
  ShieldAlert, 
  Binary, 
  Lightbulb,
  Copy,
  Check,
  Sliders
} from 'lucide-react';

const WATERMARKED_TEXT_EXAMPLE = 
  "The substantial development of modern artificial intelligence has fundamentally transformed the standard landscape of creative content creation. Many scholars agree that this progress introduces significant advantages for automated writing tasks, providing unprecedented speed and efficiency. However, it likewise poses complex concerns regarding authorship confirmation and misinformation propagation in public media forums. Thus, establishing robust mechanisms for provenance tracing remains extremely critical.";

const REPHRASED_TEXT_EXAMPLE =
  "The huge growth of modern AI has totally changed how we make creative content today. A lot of researchers think this progress brings major perks for writing automation, making things faster and more efficient. Yet, it also brings up tricky issues about who wrote what and how fake news spreads on social networks. Because of this, making strong tools to track where text comes from is still super important.";

const SYNONYMS_MAP: Record<string, string> = {
  'substantial': 'significant',
  'development': 'growth',
  'fundamentally': 'completely',
  'transformed': 'reshaped',
  'creative': 'originative',
  'creation': 'production',
  'progress': 'breakthrough',
  'advantages': 'benefits',
  'efficiency': 'productivity',
  'likewise': 'also',
  'propagation': 'dissemination',
  'establishing': 'building',
  'robust': 'strong',
  'critical': 'vital'
};

const HOMOGLYPHS_MAP: Record<string, string> = {
  'a': 'а', // Cyrillic small letter a
  'e': 'е', // Cyrillic small letter ie
  'o': 'о', // Cyrillic small letter o
  'p': 'р', // Cyrillic small letter er
  'c': 'с', // Cyrillic small letter es
  'i': 'і', // Cyrillic small letter byelorussian-ukrainian i
};

export default function TextBypassSandbox() {
  const [inputText, setInputText] = useState<string>(WATERMARKED_TEXT_EXAMPLE);
  const [activeTactic, setActiveTactic] = useState<'none' | 'synonyms' | 'homoglyphs' | 'rephrase'>('none');
  const [copied, setCopied] = useState<boolean>(false);

  // New text attack models configuration states
  const [caseMutation, setCaseMutation] = useState<'standard' | 'upper' | 'lower' | 'leet'>('standard');
  const [smartPunc, setSmartPunc] = useState<boolean>(false);
  const [zeroWidthInjection, setZeroWidthInjection] = useState<boolean>(false);
  const [synonymRate, setSynonymRate] = useState<number>(100);

  // Statistics
  const [zScore, setZScore] = useState<number>(4.82); // Standard score > 3.0 represents likely AI watermark
  const [greenRatio, setGreenRatio] = useState<number>(76); // High concentration of colored green tokens
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleCopyText = () => {
    navigator.clipboard.writeText(processedTextData.plainText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Perform dynamic NLP token analysis and replacement simulation
  const processedTextData = React.useMemo(() => {
    const words = inputText.split(/\s+/);
    let greenCount = 0;
    let totalCount = 0;
    let plainText = '';

    const wordComponents = words.map((word, idx) => {
      // Clean word for key comparison
      const cleanWord = word.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
      
      // Determine if this is a "Favored / Green" Token
      // In SynthID, this is pseudorandom based on context. For visualization comfort, we label certain terms.
      const isGreenDefault = 
        cleanWord.length > 5 && 
        (cleanWord.includes('e') || cleanWord.includes('a') || cleanWord.includes('i')) &&
        cleanWord !== 'modern' && cleanWord !== 'scholars';

      let renderedWord = word;
      let isBypassed = false;
      let isHomoglyphModified = false;
      let originalTokenText = word;

      if (isGreenDefault) {
        totalCount++;
      }

      // Appling Adversarial Tactic
      let shouldSwapSynonym = true;
      if (activeTactic === 'synonyms') {
        // Use stable deterministic index-based random factor to prevent re-evaluation on typings
        shouldSwapSynonym = ((idx * 31) % 100) < synonymRate;
      }

      if (activeTactic === 'synonyms' && shouldSwapSynonym) {
        if (isGreenDefault && SYNONYMS_MAP[cleanWord]) {
          const synonym = SYNONYMS_MAP[cleanWord];
          // Preserve capitalization
          const isCapitalized = word[0] === word[0].toUpperCase();
          renderedWord = isCapitalized ? synonym[0].toUpperCase() + synonym.slice(1) : synonym;
          
          // Re-append punctuation if any
          const lastChar = word[word.length - 1];
          if (/[.,/#!$%^&*;:{}=\-_`~()]/.test(lastChar)) {
            renderedWord += lastChar;
          }
          isBypassed = true;
        } else if (isGreenDefault) {
          greenCount++;
        }
      } else if (activeTactic === 'homoglyphs') {
        if (isGreenDefault) {
          // Replace matching chars with unicode lookalikes
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
        } else {
          // Normal word
        }
      } else if (activeTactic === 'rephrase') {
        // Handled by loading REPHRASED_TEXT_EXAMPLE
      } else {
        // activeTactic === 'none' (or synonyms skipped by subset percentage)
        if (isGreenDefault) {
          greenCount++;
        }
      }

      // Invisible zero-width space injection
      if (zeroWidthInjection && isGreenDefault && !isBypassed) {
        const mid = Math.floor(renderedWord.length / 2);
        renderedWord = renderedWord.slice(0, mid) + '\u200b' + renderedWord.slice(mid);
        isBypassed = true;
        if (greenCount > 0) {
          greenCount--;
        }
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
          .replace(/[eE]/g, '3')
          .replace(/[aA]/g, '4')
          .replace(/[oO]/g, '0')
          .replace(/[tT]/g, '7')
          .replace(/[iI]/g, '1');
      }

      plainText += renderedWord + ' ';

      return {
        id: idx,
        originalWord: word,
        displayedWord: renderedWord,
        isGreen: isGreenDefault && activeTactic !== 'rephrase',
        isBypassed,
        isHomoglyph: isHomoglyphModified
      };
    });

    plainText = plainText.trim();

    return {
      components: wordComponents,
      plainText,
      greenCount,
      totalCount
    };
  }, [inputText, activeTactic, caseMutation, smartPunc, zeroWidthInjection, synonymRate]);

  // Recalculate detector score based on structural changes
  useEffect(() => {
    if (activeTactic === 'rephrase') {
      setZScore(0.85); // Completely bypassed, background noise Z-score
      setGreenRatio(48); // Normal token distribution is ~50% green/red splitting
    } else {
      const gCount = processedTextData.greenCount;
      const tCount = processedTextData.totalCount;
      
      if (tCount === 0) {
        setZScore(0);
        setGreenRatio(50);
        return;
      }

      // Percentage calculation
      const ratio = Math.round((gCount / tCount) * 100);
      setGreenRatio(ratio);

      // Z-Score approximation formula: z = (observed_green - expected_green) / std_dev
      // Standard LLM expectancy is 50/50. 
      // Higher ratio = mathematically impossible bias
      const stdDev = Math.sqrt(tCount * 0.25);
      const obsGreen = gCount;
      const expGreen = tCount * 0.5;
      const rawZ = (obsGreen - expGreen) / stdDev;
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
      setInputText(REPHRASED_TEXT_EXAMPLE);
    } else if (inputText === REPHRASED_TEXT_EXAMPLE) {
      // Restore standard text if coming back from rephrase
      setInputText(WATERMARKED_TEXT_EXAMPLE);
    }
  };

  const handleLoadSampleText = () => {
    setInputText(WATERMARKED_TEXT_EXAMPLE);
    setActiveTactic('none');
  };

  const isBypassed = zScore < 1.96; // 95% confidence threshold for watermark detection is z = 1.96

  return (
    <div id="text-bypass-sandbox" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Visual representation of current token distribution */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-white/90">
                SynthID Text Token Sandbox
              </h3>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleLoadSampleText}
                className="text-xs px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-white/70 hover:text-white flex items-center gap-1 transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reload Sample
              </button>
              
              <button
                onClick={() => { setInputText(''); handleApplyTacticText('none'); }}
                className="text-xs px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-white/50 hover:text-rose-400 flex items-center gap-1 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
          </div>

          <p className="text-xs text-white/55 mb-4 leading-relaxed">
            LLM output generated under SynthID contains structured token sequences. Modify the paragraphs below to watch how stego sequence hashes fall out of sync with statistical classifiers.
          </p>

          <div className="grid grid-cols-1 gap-4">
            
            {/* Raw Input Textarea */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase font-bold text-white/40 font-mono">
                Source Document Text
              </label>
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

            {/* Simulated Stego Token Highlight Panel */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase font-bold text-white/40 font-mono">
                  stego-token stream visualization
                </label>
                
                {/* Visual Legend */}
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

              {/* Rendered output panel with rich highlighting */}
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
                
                {/* Floating copy buttons for plain text output */}
                {processedTextData.components.length > 0 && (
                  <button
                    onClick={handleCopyText}
                    className="absolute bottom-3 right-3 bg-black/60 border border-white/10 text-white/60 hover:text-white hover:border-white/20 py-1.5 px-2.5 rounded text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400 animate-scale" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy Plaintxt
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Z-score tracking and tactical controls */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        
        {/* Statistics and Gauges */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Binary className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-white/95">
              Stego Z-Score Metric
            </h3>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-2 text-center">
            
            {/* Z-Score relative value */}
            <div className={`text-4xl font-extrabold tracking-tight font-mono ${
              isBypassed ? 'text-emerald-400' : 'text-red-400 animate-pulse'
            }`}>
              {zScore}
            </div>

            <div className="text-[10px] uppercase tracking-wider font-semibold text-white/40">
              Detector Z-Score
            </div>

            {/* High level verification display */}
            <div className={`text-[10px] px-2.5 py-1 font-bold rounded flex items-center gap-1.5 ${
              isBypassed 
                ? 'bg-emerald-500/10 border border-emerald-500/35 text-emerald-400' 
                : 'bg-red-500/10 border border-red-500/35 text-rose-400'
            }`}>
              {isBypassed ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Watermark Signal Lost
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Watermark Detected
                </>
              )}
            </div>

            {/* Small helper explanation */}
            <p className="text-[10px] text-white/50 text-center leading-normal mt-1.5">
              {isBypassed ? (
                <span>Z-score is <strong className="text-emerald-400">&lt; 1.96</strong>. The sequence distribution fits normal human writing statistics. Zero detection.</span>
              ) : (
                <span>Z-score is <strong className="text-red-400">&gt; 1.96</strong>. Improbably high count of favored words. Google classifiers flag as AI-marked.</span>
              )}
            </p>

            {/* Robustness Target Class Calibration */}
            <div className="border-t border-white/5 pt-3.5 mt-2 flex flex-col gap-1.5 w-full text-left font-sans">
              <span className="text-[9px] uppercase font-bold tracking-widest text-white/40">Calibrate Robustness Class</span>
              <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-lg border border-white/5 font-mono text-[9px] font-bold">
                <button
                  onClick={() => {
                    handleApplyTacticText('none');
                  }}
                  className={`py-1 px-1.5 rounded transition text-center cursor-pointer ${
                    zScore >= 3.0
                      ? 'bg-red-500/25 border border-red-500/40 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
                      : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  Class A
                </button>
                <button
                  onClick={() => {
                    handleApplyTacticText('synonyms');
                  }}
                  className={`py-1 px-1.5 rounded transition text-center cursor-pointer ${
                    zScore >= 1.96 && zScore < 3.0
                      ? 'bg-amber-500/25 border border-amber-500/40 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                      : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  Class B
                </button>
                <button
                  onClick={() => {
                    handleApplyTacticText('rephrase');
                  }}
                  className={`py-1 px-1.5 rounded transition text-center cursor-pointer ${
                    zScore < 1.96
                      ? 'bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                      : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  Class C
                </button>
              </div>
              <p className="text-[8.5px] text-white/55 leading-normal select-none font-mono min-h-[30px]">
                {zScore >= 3.0 && "Class A: Unaltered LLM output structure. Red-green coordinate markers highly active (Z > 3)."}
                {zScore >= 1.96 && zScore < 3.0 && "Class B: Weakened stochastic markers due to Synonym Jitter attack (1.96 <= Z < 3)."}
                {zScore < 1.96 && "Class C: Sequence correlation fully scrambled due to complete structural rephrasing (Z < 1.96)."}
              </p>
            </div>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-3 text-[10px] font-mono text-white/50 space-y-1.5">
            <div className="flex justify-between">
              <span>Favored Token Share:</span>
              <span className={isBypassed ? "text-white/70" : "text-emerald-400"}>
                {greenRatio}% (vs 50% baseline)
              </span>
            </div>
            <div className="flex justify-between">
              <span>Preceding Context Hash N:</span>
              <span className="text-white/70">4 tokens (gemma_seed)</span>
            </div>
            <div className="flex justify-between">
              <span>Statistical Validation:</span>
              <span className="text-white/70">Pearson Chi-Squared</span>
            </div>
          </div>
        </div>

        {/* NLP Attack Tactics */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/90 font-mono">
            Text Edit Tactics
          </h3>
          
          <div className="flex flex-col gap-2">
            
            {/* None */}
            <button
              onClick={() => handleApplyTacticText('none')}
              className={`p-2 rounded-lg border text-left flex items-start gap-2.5 transition cursor-pointer ${
                activeTactic === 'none'
                  ? 'bg-white/10 border-white/20 text-cyan-200 shadow-[0_0_8px_rgba(203,242,76,0.1)]'
                  : 'bg-black/30 border-white/5 hover:border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                activeTactic === 'none' ? 'border-cyan-400' : 'border-white/20'
              }`}>
                {activeTactic === 'none' && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-xs font-semibold">Clean Stego Output</span>
                <span className="text-[10px] text-white/40 mt-1 font-mono">No edits. Fully watermarked.</span>
              </div>
            </button>

            {/* Synonym substitution */}
            <button
              onClick={() => handleApplyTacticText('synonyms')}
              className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition cursor-pointer ${
                activeTactic === 'synonyms'
                  ? 'bg-white/10 border-cyan-500/40 text-cyan-200 shadow-[0_0_8px_rgba(203,242,76,0.15)]'
                  : 'bg-black/30 border-white/5 hover:border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                activeTactic === 'synonyms' ? 'border-cyan-400' : 'border-white/20'
              }`}>
                {activeTactic === 'synonyms' && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-xs font-bold">Synonym Jitter Attack</span>
                <span className="text-[10px] text-white/40 mt-1 font-mono">Replaces highlighted adjectives.</span>
              </div>
            </button>

            {/* Homoglyph unicode swap */}
            <button
              onClick={() => handleApplyTacticText('homoglyphs')}
              className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition cursor-pointer ${
                activeTactic === 'homoglyphs'
                  ? 'bg-white/10 border-cyan-500/40 text-cyan-200 shadow-[0_0_8px_rgba(203,242,76,0.15)]'
                  : 'bg-black/30 border-white/5 hover:border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                activeTactic === 'homoglyphs' ? 'border-cyan-400' : 'border-white/20'
              }`}>
                {activeTactic === 'homoglyphs' && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-xs font-bold">Unicode Homoglyph Swap</span>
                <span className="text-[10px] text-white/40 mt-1 font-mono font-semibold text-rose-400">Visually identical — breaks byte matching</span>
              </div>
            </button>

            {/* Deep Rephrasing rewrite */}
            <button
              onClick={() => handleApplyTacticText('rephrase')}
              className={`p-2.5 rounded-lg border text-left flex items-start gap-2.5 transition cursor-pointer ${
                activeTactic === 'rephrase'
                  ? 'bg-white/10 border-cyan-500/40 text-cyan-200 shadow-[0_0_8px_rgba(203,242,76,0.15)]'
                  : 'bg-black/30 border-white/5 hover:border-white/10 text-white/60 hover:text-white'
              }`}
            >
              <div className={`w-3.5 h-3.5 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                activeTactic === 'rephrase' ? 'border-cyan-400' : 'border-white/20'
              }`}>
                {activeTactic === 'rephrase' && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-xs font-bold font-sans">Full Deep Rephrase / Rewrite</span>
                <span className="text-[10px] text-white/40 mt-1 font-mono">Simulates a rewrite pass.</span>
              </div>
            </button>
          </div>

          <div className="bg-black/40 border border-white/10 rounded-xl p-3 flex gap-2.5">
            <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-white/55 leading-normal">
              <strong>Why did Z-score Drop?</strong> SynthID Text watermarks are incredibly fragile to character changes or synonyms. Altering spelling triggers byte hash discrepancies and totally resets Red/Green sequences.
            </p>
          </div>
        </div>

        {/* Advanced NLP Adversarial Direct Attacks (Layered 4 distortion methods) */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/90 font-mono">
              Adversarial Noise Sliders
            </h3>
          </div>
          <p className="text-xs text-white/55 leading-relaxed">
            Execute direct NLP character and sequencing adjustments. Test detection resistance of the active token group.
          </p>

          <div className="space-y-4 font-mono text-[10px] bg-black/30 p-3 rounded-xl border border-white/5">
            {/* 1. Synonym substituting Jitter Slider (only active when synonym is selected) */}
            <div className="space-y-1">
              <div className="flex justify-between text-white/75">
                <span>Synonym Jitter Rate:</span>
                <span className="text-indigo-300 font-bold">{synonymRate}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="10"
                disabled={activeTactic !== 'synonyms'}
                value={synonymRate}
                onChange={(e) => setSynonymRate(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded appearance-none accent-indigo-400 cursor-pointer disabled:opacity-30"
              />
              <span className="text-[8px] text-white/30 block leading-tight">Controls synonym substitution density. Only active in synonym mode.</span>
            </div>

            {/* 2. Invisible Zero-Width Space Injection Toggle */}
            <div className="flex items-center justify-between border-t border-white/5 pt-2">
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-white/80 font-bold leading-normal">Zero-Width Space Injection</span>
                <span className="text-[8.5px] text-white/40 leading-normal font-sans text-left">Splits word tokens invisibly in the DOM, keeping text completely readable while breaking byte matches.</span>
              </div>
              <button
                onClick={() => setZeroWidthInjection(!zeroWidthInjection)}
                className={`text-[9px] font-bold px-2.5 py-1 rounded transition select-none flex-shrink-0 cursor-pointer ${
                  zeroWidthInjection
                    ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-200 shadow-[0_0_8px_rgba(99,102,241,0.2)]'
                    : 'bg-white/5 border border-white/10 text-white/40'
                }`}
              >
                {zeroWidthInjection ? 'INJECTED' : 'OFF'}
              </button>
            </div>

            {/* 3. Case Mutation Option Select */}
            <div className="space-y-1 border-t border-white/5 pt-2 flex flex-col gap-1.5">
              <span className="text-white/75 font-semibold text-left">Casing Token Mutator:</span>
              <div className="grid grid-cols-4 gap-1 text-[8.5px]">
                {(['standard', 'upper', 'lower', 'leet'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setCaseMutation(mode)}
                    className={`py-1 px-0.5 rounded border transition cursor-pointer text-center select-none uppercase font-bold text-[8.2px] ${
                      caseMutation === mode
                        ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200 font-extrabold shadow-[0_0_6px_rgba(99,102,241,0.15)]'
                        : 'bg-black/20 border-white/5 text-white/40 hover:text-white/70'
                    }`}
                  >
                    {mode === 'standard' ? 'STD' : mode === 'leet' ? '1337' : mode}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Smart/Curly Punctuation Switch */}
            <div className="flex items-center justify-between border-t border-white/5 pt-2">
              <div className="flex flex-col pr-2">
                <span className="text-white/80 font-bold text-left">Smart Punc Modifier</span>
                <span className="text-[8.5px] text-white/40 leading-normal font-sans text-left">Swaps straight quotes and dashes and adds spacing cues to fail precise regex matching.</span>
              </div>
              <button
                onClick={() => setSmartPunc(!smartPunc)}
                className={`text-[9px] font-bold px-2.5 py-1 rounded transition select-none flex-shrink-0 cursor-pointer ${
                  smartPunc
                    ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-200 shadow-[0_0_8px_rgba(99,102,241,0.2)]'
                    : 'bg-white/5 border border-white/10 text-white/40'
                }`}
              >
                {smartPunc ? 'ACTIVE' : 'OFF'}
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              setCaseMutation('standard');
              setSmartPunc(false);
              setZeroWidthInjection(false);
              setSynonymRate(100);
            }}
            className="w-full text-[10px] font-bold py-1.5 border border-dashed border-white/10 hover:border-white/20 hover:bg-white/5 rounded-lg text-white/50 hover:text-white/80 transition cursor-pointer text-center font-mono"
          >
            Reset NLP Noise
          </button>
        </div>
      </div>
    </div>
  );
}
