/**
 * Single source of truth for every technical term used across the lab.
 * Consumed by two renderers:
 *   - <GlossaryTerm id="…"> — inline, dotted-underline word with a hover/focus tooltip (`short`)
 *   - <Glossary />          — the full reference section in the Briefing tab (`long`)
 *
 * HONESTY NOTE: definitions describe the general technique and THIS lab's *synthetic*
 * simulation. Nothing here claims to detect or defeat a production watermark.
 */
export type GlossaryGroup =
  | 'Watermarking'
  | 'Image / DSP'
  | 'Text'
  | 'Audio'
  | 'Metrics'
  | 'Provenance';

export interface GlossaryEntry {
  id: string;
  term: string;
  aka?: string;
  group: GlossaryGroup;
  /** ≤ ~150 chars — shown in the inline hover tooltip. */
  short: string;
  /** 1–2 sentences — shown in the Glossary reference section. */
  long: string;
}

export const GLOSSARY: GlossaryEntry[] = [
  // ── Watermarking ──────────────────────────────────────────────
  {
    id: 'steganographic-watermark',
    term: 'Steganographic watermark',
    aka: 'in-band watermark',
    group: 'Watermarking',
    short: 'A hidden, machine-recoverable signal embedded inside the content itself — pixels, tokens, or audio.',
    long: 'A watermark that hides a recoverable signal inside the media — in frequency coefficients, model latents, or token choices — so the content looks unchanged. Because the signal lives inside the content, editing the content attacks the signal. This is the family of approach the whole lab probes.',
  },
  {
    id: 'synthid',
    term: 'SynthID',
    group: 'Watermarking',
    short: 'Google DeepMind’s family of AI-content watermarks for images, text, and audio. This lab uses a SynthID-style synthetic carrier, not the real classifier.',
    long: 'Google DeepMind’s production watermarking system for AI-generated images, text, and audio. It is the best-known example of the steganographic family. This lab does not touch SynthID — it injects and analyses its own synthetic carrier to teach the general robustness lesson.',
  },
  {
    id: 'carrier',
    term: 'Carrier',
    aka: 'ring carrier',
    group: 'Watermarking',
    short: 'The hidden pattern a watermark adds; a detector correlates the asset against it to produce a match score.',
    long: 'The specific signal a watermark embeds — here, a synthetic concentric-ring sinusoid in the image. Detection works by correlating the asset against the expected carrier; weaken the carrier and the correlation score falls.',
  },
  {
    id: 'detection-confidence',
    term: 'Detection confidence',
    aka: 'correlation score',
    group: 'Watermarking',
    short: 'A probability a detector returns — not a yes/no certificate. It fades as the carrier weakens, so a low score never proves "human-made."',
    long: 'Watermark detectors return a probability that a carrier is present, not a definitive certificate. Because the score can fade with ordinary edits, a low or absent score proves nothing about authorship — the core limitation the lab demonstrates.',
  },

  // ── Image / DSP ───────────────────────────────────────────────
  {
    id: 'fft',
    term: 'FFT',
    aka: 'frequency domain',
    group: 'Image / DSP',
    short: 'Fast Fourier Transform — re-expresses an image as frequencies, where periodic carriers concentrate in predictable bands.',
    long: 'The Fast Fourier Transform converts an image from pixels into the frequencies that compose it. Periodic watermark carriers concentrate in predictable frequency bands — which is exactly what makes them targetable by a notch filter.',
  },
  {
    id: 'notch-filter',
    term: 'Notch filter',
    aka: 'band-stop',
    group: 'Image / DSP',
    short: 'A narrow band-stop filter that suppresses one specific frequency band — e.g., the band where a carrier hides — with little visible cost.',
    long: 'A filter that attenuates a narrow band of frequencies while leaving the rest intact. If a carrier sits in a predictable band, a notch filter removes it while the human eye barely registers the change.',
  },
  {
    id: 'latent-jitter',
    term: 'Latent / spatial jitter',
    group: 'Image / DSP',
    short: 'Low-amplitude broadband noise that scrambles the fine pixel correlations a carrier relies on.',
    long: 'Adding small, broadband noise across the image. Rather than targeting one band, it disrupts the fine spatial correlations any low-amplitude carrier depends on — the digital analogue of nudging a diffusion model’s latents.',
  },
  {
    id: 'latents',
    term: 'Latents',
    group: 'Image / DSP',
    short: 'A diffusion model’s compressed internal representation of an image, before it is decoded into pixels.',
    long: 'The compact numerical representation a generative model works in before decoding to pixels. Some watermarks are embedded at the latent stage, which is why perturbing latents is a natural attack surface.',
  },
  {
    id: 'quantization',
    term: 'Quantization',
    aka: 'bottleneck / re-encode',
    group: 'Image / DSP',
    short: 'Reducing color depth or downsampling — clips the micro-variations a carrier needs, like a lossy re-save.',
    long: 'Dropping bit depth or block-averaging pixels snaps subtle values to the nearest grid step. It mimics a lossy encode/decode and can attenuate a carrier even as an accidental side effect of an innocent re-save.',
  },
  {
    id: 'bilateral-denoise',
    term: 'Bilateral denoise',
    aka: 'NLM / edge-preserving',
    group: 'Image / DSP',
    short: 'Edge-preserving smoothing that treats a low-amplitude carrier as sensor noise and wipes it while keeping detail crisp.',
    long: 'A denoiser that smooths flat regions while preserving edges. Because a low-amplitude carrier looks like noise, ordinary "clean up this photo" tooling can strip the mark with no adversarial intent.',
  },
  {
    id: 'difference-heatmap',
    term: 'Difference heatmap',
    aka: 'viridis / amplified diff',
    group: 'Image / DSP',
    short: 'A per-pixel map of how much an image changed, color-mapped (viridis) and amplified so subtle edits become visible.',
    long: 'A visualization that color-maps the per-pixel difference between two images, normalized so faint changes — like a hidden carrier or the residue of an edit — become visible to the eye.',
  },

  // ── Text ──────────────────────────────────────────────────────
  {
    id: 'z-score',
    term: 'Z-score',
    group: 'Text',
    short: 'A statistic measuring how improbable the share of "favored" tokens is. High Z = likely watermarked; edits pull it back toward chance.',
    long: 'A standardized statistic for how far the share of favored tokens deviates from random chance. Watermarked text scores high; paraphrasing and synonym swaps reset the score toward zero.',
  },
  {
    id: 'favored-tokens',
    term: 'Favored tokens',
    aka: 'green list',
    group: 'Text',
    short: 'A per-context subset of the vocabulary a text watermark biases generation toward, creating a detectable statistical signature.',
    long: 'A text watermark splits the vocabulary into "favored" and "neutral" tokens per a context hash and nudges sampling toward the favored set. An improbably high favored-token share is the detectable signature.',
  },
  {
    id: 'context-hash',
    term: 'Context hash',
    group: 'Text',
    short: 'A hash of the preceding tokens that selects which words count as "favored" — editing the text breaks the chain.',
    long: 'The function that, from the preceding words, decides which tokens are favored next. Because it depends on exact prior text, any edit breaks the chain and pulls the favored-token bias back toward chance.',
  },
  {
    id: 'homoglyph',
    term: 'Homoglyph',
    group: 'Text',
    short: 'A character that looks identical to another (e.g., Cyrillic "а" vs Latin "a"). Swapping them resets a text watermark silently.',
    long: 'Characters from different scripts that render identically. Substituting them is invisible to a reader but changes the underlying bytes, breaking a token watermark’s context hash without any visible cue.',
  },

  // ── Audio ─────────────────────────────────────────────────────
  {
    id: 'spread-spectrum',
    term: 'Spread-spectrum carrier',
    group: 'Audio',
    short: 'An inaudible signal spread across many frequencies, keyed by a secret sequence — a technique borrowed from radio.',
    long: 'A watermark spread thinly across a wide band of frequencies and keyed by a secret chip sequence, making it inaudible yet recoverable. The lab’s audio demo embeds and detects exactly this kind of carrier.',
  },
  {
    id: 'matched-filter',
    term: 'Matched filter',
    group: 'Audio',
    short: 'The optimal detector for a known signal buried in noise; it correlates the audio against the expected carrier.',
    long: 'The mathematically optimal way to detect a known signal in noise — correlate the input against a template of the signal. It is how the lab recovers the spread-spectrum audio carrier and scores its strength.',
  },
  {
    id: 'low-pass',
    term: 'Low-pass filter',
    group: 'Audio',
    short: 'Removes high frequencies; a routine re-encode step that can strip an audio watermark.',
    long: 'A filter that keeps low frequencies and discards high ones. Common in any audio re-encode, it can wipe a watermark that lives in the higher band — no attacker required.',
  },

  // ── Metrics ───────────────────────────────────────────────────
  {
    id: 'psnr',
    term: 'PSNR',
    group: 'Metrics',
    short: 'Peak Signal-to-Noise Ratio (dB). Higher means an edit changed the image less; above ~40 dB is usually visually identical.',
    long: 'Peak Signal-to-Noise Ratio, in decibels, measures how little an edit altered an image. High PSNR after a watermark-removing edit is the lab’s point: the attack that erases the mark costs almost nothing visible.',
  },
  {
    id: 'ssim',
    term: 'SSIM',
    group: 'Metrics',
    short: 'Structural Similarity Index (0–1) — perceptual closeness of two images, where 1.0 means identical.',
    long: 'The Structural Similarity Index models perceived change in structure, luminance, and contrast on a 0–1 scale. Like PSNR, a near-1.0 SSIM after an attack shows the edit was perceptually almost free.',
  },

  // ── Provenance ────────────────────────────────────────────────
  {
    id: 'provenance',
    term: 'Provenance',
    group: 'Provenance',
    short: 'The verifiable origin and edit history of a piece of content — who made it, with what, and how it changed.',
    long: 'The record of where content came from and what happened to it. Durable provenance is verifiable and auditable, rather than a probability that can quietly fade.',
  },
  {
    id: 'c2pa',
    term: 'C2PA / Content Credentials',
    group: 'Provenance',
    short: 'An open standard that cryptographically signs provenance and binds it to an asset; tampering breaks the signature visibly.',
    long: 'The Coalition for Content Provenance and Authenticity standard, shipped to users as Content Credentials. It attaches cryptographically signed origin and edit history to an asset so that tampering breaks the signature in an explicit, auditable way — the durable layer the lab argues for.',
  },
  {
    id: 'in-band',
    term: 'In-band vs. signed',
    group: 'Provenance',
    short: 'In-band = provenance hidden inside the asset (can fade silently). Signed = provenance attached as signed metadata (breaks visibly).',
    long: 'A framing of the whole argument: in-band signals (watermarks) ride inside the content and fail silently; signed metadata (C2PA) sits alongside the content and fails loudly. The second is auditable; the first is not.',
  },
  {
    id: 'ecdsa',
    term: 'ECDSA P-256',
    group: 'Provenance',
    short: 'An elliptic-curve digital signature algorithm; the lab signs and verifies credentials with it via the Web Crypto API.',
    long: 'The Elliptic Curve Digital Signature Algorithm on the P-256 curve — a widely used signing scheme. The credentials demo really signs and verifies with it in your browser via Web Crypto, so a tampered asset fails verification for real.',
  },
  {
    id: 'hash',
    term: 'Cryptographic hash',
    aka: 'SHA-256',
    group: 'Provenance',
    short: 'A fixed-length fingerprint of data; any change to the data changes the hash, which is what makes tampering detectable.',
    long: 'A one-way function that turns any data into a fixed-length fingerprint. Changing a single byte changes the hash entirely, which is how a signed credential detects that an asset was altered.',
  },
  {
    id: 'tamper-evident',
    term: 'Tamper-evident',
    group: 'Provenance',
    short: 'A property where any alteration is detectable after the fact — the opposite of a watermark’s silent failure.',
    long: 'A system is tamper-evident when any change leaves a detectable trace. Signed Content Credentials are tamper-evident; in-band watermarks are not, because a stripped mark announces nothing.',
  },
];

/** id → entry, for O(1) lookups from <GlossaryTerm>. */
export const GLOSSARY_BY_ID: Record<string, GlossaryEntry> = Object.fromEntries(
  GLOSSARY.map((e) => [e.id, e]),
);

export const GLOSSARY_GROUPS: GlossaryGroup[] = [
  'Watermarking',
  'Image / DSP',
  'Text',
  'Audio',
  'Metrics',
  'Provenance',
];
