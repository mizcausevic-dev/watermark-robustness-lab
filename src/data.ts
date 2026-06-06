import { ImagePreset, BypassMethod, ResearchTopic, ComfyNode, ComfyEdge } from './types';

/**
 * NOTE ON HONESTY:
 * Everything in this lab operates on a *synthetic* watermark that the app injects itself
 * (a concentric-ring sinusoid carrier — see utils/imageFilters.ts). It does NOT detect,
 * contain, or remove Google SynthID or any production watermark. The percentages below
 * describe how each transformation affects THIS lab's synthetic signal, and exist to teach
 * the general robustness lesson — not to make claims about any real-world system.
 */

export const IMAGE_PRESETS: ImagePreset[] = [
  {
    id: 'portrait',
    name: 'High-Fidelity Portrait',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=320&auto=format&fit=crop',
    description: 'High-contrast neural render. High-contrast regions are where a frequency-domain carrier would sit most strongly.'
  },
  {
    id: 'cityscape',
    name: 'Detailed Cityscape',
    url: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?q=80&w=320&auto=format&fit=crop',
    description: 'Dense high-frequency detail, typical of diffusion-model output where carrier energy is easy to hide.'
  },
  {
    id: 'soft_gradient',
    name: 'Soft Gradient Study',
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=320&auto=format&fit=crop',
    description: 'Warm gradients and smooth lighting — the regime where a hidden carrier is most visible once amplified.'
  }
];

/**
 * Transformations studied in the image lab. These are standard signal-processing operations.
 * `reductionRate` = how much each one suppresses the lab's *synthetic* ring carrier.
 */
export const BYPASS_METHODS: BypassMethod[] = [
  {
    id: 'notch_filter',
    name: 'Frequency Notch Band-Filter',
    description: 'Targeted suppression in the 2D FFT magnitude spectrum around the radial band where a periodic carrier concentrates.',
    difficulty: 'Intermediate',
    qualityLoss: 'Very Low',
    reductionRate: '85% to 98%',
    details: 'Periodic frequency-domain carriers live at predictable radial diameters. A narrow radial band-stop (notch) filter attenuates that band while the human eye barely registers the loss of those exact sub-frequencies. This is the canonical illustration of why frequency-domain steganography is fragile: if the carrier band is predictable, it is filterable.'
  },
  {
    id: 'latent_jitter',
    name: 'Latent / Spatial Noise Jitter',
    description: 'Injecting low-amplitude high-frequency noise that perturbs the fine pixel correlations a carrier depends on.',
    difficulty: 'Advanced',
    qualityLoss: 'Low',
    reductionRate: '90% to 100%',
    details: 'Rather than attacking a specific band, broadband jitter scrambles the fine spatial correlations any low-amplitude carrier relies on. In a real diffusion pipeline the analogous move is perturbing latents before the VAE decode. The lesson: signals that survive only because pixels stay precisely aligned do not survive deliberate misalignment.'
  },
  {
    id: 'vae_quantize',
    name: 'Bottleneck Roundoff / Quantize',
    description: 'Reducing colour depth and downsampling spatial detail, simulating a lossy encode/decode bottleneck.',
    difficulty: 'Easy',
    qualityLoss: 'Medium',
    reductionRate: '75% to 90%',
    details: 'Dropping channel bit depth or block-averaging pixels clips the delicate micro-variations a carrier uses to the nearest grid step. Effective and almost free to apply — which is precisely why it is a problem for fragile schemes: even an innocent re-save can attenuate the mark, so absence of a watermark proves nothing.'
  },
  {
    id: 'neural_denoise',
    name: 'Bilateral Edge-Preserving Denoise',
    description: 'A bilateral / non-local-means style filter that treats low-amplitude carrier texture as sensor noise.',
    difficulty: 'Intermediate',
    qualityLoss: 'Low',
    reductionRate: '80% to 95%',
    details: 'Because a low-amplitude carrier looks like noise, edge-preserving denoisers wipe it while keeping crisp structure. Ordinary "clean up this photo" tooling can therefore strip the mark as a side effect — no adversarial intent required.'
  }
];

export const RESEARCH_BACKGROUNDS: ResearchTopic[] = [
  {
    id: 'how_synthid_works',
    title: 'How AI Content Watermarking Works',
    summary: 'Steganographic watermarks hide a recoverable signal inside the media itself.',
    details: [
      'Imperceptible embedding: Image watermarks (the family Google DeepMind\'s SynthID belongs to) modulate frequency coefficients or diffusion-model latents so the visible image is unchanged while a hidden, key-recoverable pattern is present.',
      'Keyed detection: A classifier holding the secret key correlates the media against the expected carrier and returns a confidence score, not a yes/no certificate.',
      'Engineered robustness: These systems are deliberately hardened against compression, resizing, and colour edits by scattering the signature redundantly — robust against casual transforms, but never unconditionally robust.'
    ]
  },
  {
    id: 'why_fragile',
    title: 'Why Steganographic Watermarks Are Fragile',
    summary: 'A signal hidden in the pixels can be attenuated by edits that target where it lives.',
    details: [
      'Predictable carriers are filterable: if energy concentrates in a known frequency band or channel, a notch filter or denoiser can attenuate it with little visible cost.',
      'Re-encoding is lossy by design: quantization, rescaling, and format conversion clip the micro-variations a carrier depends on — often as an accidental side effect of normal editing.',
      'Confidence, not proof: because detection returns a probability and the carrier can fade, a low score never proves "human-made" and a stripped mark is invisible. This is the structural ceiling of any in-band watermark — and the reason provenance should not rest on watermarking alone.'
    ],
    reference: 'https://c2pa.org/'
  },
  {
    id: 'text_watermarking',
    title: 'Text Watermarking — and Why Edits Break It',
    summary: 'Token-level watermarks bias word choice; routine rewriting resets the bias.',
    details: [
      'Biased sampling: text watermarks (again, the family SynthID-for-Text belongs to) split the vocabulary into "favoured" and "neutral" tokens per a context hash, nudging generation toward favoured tokens.',
      'Statistical signature: watermarked text carries an improbably high share of favoured tokens, verifiable with a Z- or G-test over enough words.',
      'Edits reset the hash: paraphrasing, synonym swaps, back-translation, or even character-level substitution break the context-hash chain and pull the favoured-token share back toward chance — so the mark is strongest exactly when text is left untouched, and weakest the moment a human edits it.'
    ]
  },
  {
    id: 'the_fix_c2pa',
    title: 'The Durable Fix: Cryptographic Content Credentials (C2PA)',
    summary: 'Sign provenance instead of hiding it — a broken credential is detectable.',
    details: [
      'Tamper-evident by construction: C2PA / Content Credentials bind cryptographically signed provenance (who, what tool, what edits) to the asset. Alter the asset and the signature fails to verify — the break is visible rather than silent.',
      'Auditable, not probabilistic: unlike a fading carrier, a missing or invalid credential is an explicit, checkable state. That is the difference between "we cannot detect a watermark" and "this asset has no valid provenance."',
      'Defence in depth: the durable posture is layered — Content Credentials for verifiable origin, watermarking as one corroborating signal, and disclosure policy on top. This lab exists to make the case for that layering by showing, hands-on, why the watermark layer cannot carry the load by itself.'
    ],
    reference: 'https://contentcredentials.org/'
  },
  {
    id: 'responsible_use',
    title: 'Responsible Use & Scope',
    summary: 'Why studying robustness boundaries is part of building trustworthy provenance.',
    details: [
      'Adversarial testing is constructive: you cannot claim a provenance signal is robust without probing where it breaks. Mapping failure modes is how the field moves toward signals that hold up.',
      'Honest scope: this lab operates only on a synthetic watermark it injects itself, entirely in your browser. It does not target, detect, or remove any real-world watermarking system, and no content is uploaded.',
      'The takeaway: fragility in steganographic marks is the argument for cryptographic credentials — not an invitation to launder AI content. Use it to explain provenance trade-offs to stakeholders, not to evade them.'
    ]
  }
];

export const INITIAL_COMFY_NODES: ComfyNode[] = [
  {
    id: '1',
    title: 'Load Watermarked Image',
    type: 'loader',
    inputs: [],
    outputs: ['IMAGE'],
    properties: { image_path: 'input_artwork.png' },
    position: { x: 30, y: 120 }
  },
  {
    id: '2',
    title: 'Watermark Correlation Probe',
    type: 'processor',
    inputs: ['IMAGE'],
    outputs: ['PROBABILITY'],
    properties: { model: 'synthetic_carrier_v1', strictness: 0.85 },
    position: { x: 320, y: 350 }
  },
  {
    id: '3',
    title: 'Frequency Notch Filter',
    type: 'bypass',
    inputs: ['IMAGE'],
    outputs: ['IMAGE'],
    properties: { notch_radius: 42.0, notch_bandwidth: 6.0, strength: 0.95 },
    position: { x: 280, y: 80 }
  },
  {
    id: '4',
    title: 'Encode with Noise Jitter',
    type: 'encoder',
    inputs: ['IMAGE'],
    outputs: ['LATENT'],
    properties: { noise_scale: 0.08, encoder: 'approx_v2' },
    position: { x: 550, y: 80 }
  },
  {
    id: '5',
    title: 'Resample (Low Denoise)',
    type: 'sampler',
    inputs: ['LATENT'],
    outputs: ['LATENT'],
    properties: { steps: 12, denoise: 0.12, sampler: 'euler_ancestral' },
    position: { x: 800, y: 80 }
  },
  {
    id: '6',
    title: 'Save Perturbed Output',
    type: 'saver',
    inputs: ['LATENT'],
    outputs: [],
    properties: { filename_prefix: 'perturbed_output' },
    position: { x: 1040, y: 150 }
  }
];

export const INITIAL_COMFY_EDGES: ComfyEdge[] = [
  { id: 'e1', fromNode: '1', fromOutput: 'IMAGE', toNode: '3', toInput: 'IMAGE' },
  { id: 'e2', fromNode: '1', fromOutput: 'IMAGE', toNode: '2', toInput: 'IMAGE' },
  { id: 'e3', fromNode: '3', fromOutput: 'IMAGE', toNode: '4', toInput: 'IMAGE' },
  { id: 'e4', fromNode: '4', fromOutput: 'LATENT', toNode: '5', toInput: 'LATENT' },
  { id: 'e5', fromNode: '5', fromOutput: 'LATENT', toNode: '6', toInput: 'LATENT' }
];
