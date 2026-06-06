export interface ImagePreset {
  id: string;
  name: string;
  url: string;
  description: string;
}

export type BypassMethodId = 'none' | 'notch_filter' | 'latent_jitter' | 'vae_quantize' | 'neural_denoise';

export interface BypassMethod {
  id: BypassMethodId;
  name: string;
  description: string;
  difficulty: string;
  qualityLoss: 'Very Low' | 'Low' | 'Medium' | 'High';
  reductionRate: string;
  details: string;
}

export interface DetectionResult {
  confidence: number; // 0 to 100
  status: 'Strongly Detected' | 'Weak / Suspect' | 'Bypassed / Undetectable';
  scannedPixels: number;
}

export interface ComfyNode {
  id: string;
  title: string;
  type: 'loader' | 'processor' | 'sampler' | 'encoder' | 'saver' | 'bypass';
  inputs: string[];
  outputs: string[];
  properties: Record<string, string | number | boolean>;
  position: { x: number; y: number };
}

export interface ComfyEdge {
  id: string;
  fromNode: string;
  fromOutput: string;
  toNode: string;
  toInput: string;
}

export interface ResearchTopic {
  id: string;
  title: string;
  summary: string;
  details: string[];
  reference?: string;
}
