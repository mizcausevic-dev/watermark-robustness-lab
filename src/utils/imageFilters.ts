/**
 * Image processing utilities for the SynthID Bypass Visualizer.
 * Incorporates real client-side pixel manipulation on <canvas> tags.
 */

// Generate a deterministic offset value based on coordinates for the SynthID watermark pattern.
// Specifically, a concentric sinusoid carrier that represents Google's frequency-domain watermark.
export function getWatermarkValue(x: number, y: number, cx: number, cy: number, strength = 3.5): number {
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // Creates concentric circle ridges (frequency = 0.15)
  return Math.sin(dist * 0.15) * strength;
}

/**
 * Apply a subtle SynthID watermark into the image data.
 * The watermark should be visually imperceptible (offsets of ±1 to ±4 on a 0-255 scale).
 */
export function injectSynthIDWatermark(
  srcData: ImageData,
  destData: ImageData,
  strength = 3.0
): void {
  const { width, height, data: src } = srcData;
  const dest = destData.data;
  const cx = width / 2;
  const cy = height / 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      
      const offset = getWatermarkValue(x, y, cx, cy, strength);
      
      // Inject primarily into the Blue and Green channels, which is highly effective and visually hidden
      // We clamp to keep values within 0-255 bounds
      dest[idx] = Math.max(0, Math.min(255, src[idx] + offset * 0.2));     // Red (slight tweak)
      dest[idx + 1] = Math.max(0, Math.min(255, src[idx + 1] - offset * 0.5)); // Green
      dest[idx + 2] = Math.max(0, Math.min(255, src[idx + 2] + offset));     // Blue (primary carrier)
      dest[idx + 3] = src[idx + 3]; // Alpha stays unchanged
    }
  }
}

/**
 * Subtract original image from the watermarked image and magnify the difference.
 * This reveals the "hidden invisible pattern" matching the visual explanation.
 */
export function extractWatermarkPattern(
  originalData: ImageData,
  watermarkedData: ImageData,
  outputData: ImageData,
  boostMultiplier = 35
): void {
  const srcOrig = originalData.data;
  const srcWater = watermarkedData.data;
  const dest = outputData.data;
  const len = srcOrig.length;

  for (let i = 0; i < len; i += 4) {
    // Difference calculation
    const diffR = srcWater[i] - srcOrig[i];
    const diffG = srcWater[i + 1] - srcOrig[i + 1];
    const diffB = srcWater[i + 2] - srcOrig[i + 2];

    // Amplify the changes so the ring becomes bright on a dark background
    // We add 128 to show signs (centered around gray) or use absolute difference on a dark canvas
    // Absolute difference on dark looks beautiful (cyan/magenta color matching SynthID)
    const ampR = Math.min(255, Math.abs(diffR) * boostMultiplier * 1.5);
    const ampG = Math.min(255, Math.abs(diffG) * boostMultiplier * 1.5);
    const ampB = Math.min(255, Math.abs(diffB) * boostMultiplier * 2.0);

    dest[i] = ampR;
    dest[i + 1] = ampG;
    dest[i + 2] = ampB;
    dest[i + 3] = 255; // Solid Alpha
  }
}

/**
 * Applies a mathematical notch filter in the frequency-domain (or spatial approximation)
 * around the specific frequency band matching the watermark's sinusoid periodicity.
 */
export function applyNotchFilter(
  srcData: ImageData,
  destData: ImageData,
  bandCenter = 40,
  bandWidth = 8
): void {
  const { width, height, data: src } = srcData;
  const dest = destData.data;
  const cx = width / 2;
  const cy = height / 2;

  // Spatial-frequency notch filter is emulated by suppressing matching radial frequencies.
  // When we detect gradients aligned with the watermark frequency, we smooth them out.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // We determine if this pixel lies in the target carrier frequency band
      const inFreqBand = Math.abs(dist - bandCenter) < bandWidth || 
                         Math.abs((dist % 42) - 21) < 4; // repeating carrier aliases

      if (inFreqBand) {
        // Average the pixel with its neighbors to "erase" high frequency patterns
        // Simple 3x3 box blur dynamically on that specific coordinate radius.
        let sumR = 0, sumG = 0, sumB = 0, count = 0;
        for (let ny = -1; ny <= 1; ny++) {
          for (let nx = -1; nx <= 1; nx++) {
            const px = Math.max(0, Math.min(width - 1, x + nx));
            const py = Math.max(0, Math.min(height - 1, y + ny));
            const nIdx = (py * width + px) * 4;
            sumR += src[nIdx];
            sumG += src[nIdx + 1];
            sumB += src[nIdx + 2];
            count++;
          }
        }
        dest[idx] = sumR / count;
        dest[idx + 1] = sumG / count;
        dest[idx + 2] = sumB / count;
      } else {
        // Copy unmodified
        dest[idx] = src[idx];
        dest[idx + 1] = src[idx + 1];
        dest[idx + 2] = src[idx + 2];
      }
      dest[idx + 3] = src[idx + 3];
    }
  }
}

/**
 * Add latent-layer spatial jitter (simulates the ComfyUI noise node).
 * This perturbs the fragile pixel relations of SynthID.
 */
export function applyLatentJitter(
  srcData: ImageData,
  destData: ImageData,
  intensity = 15 // 0 to 50
): void {
  const { data: src } = srcData;
  const dest = destData.data;
  const len = src.length;

  for (let i = 0; i < len; i += 4) {
    const noiseR = (Math.random() - 0.5) * intensity;
    const noiseG = (Math.random() - 0.5) * intensity;
    const noiseB = (Math.random() - 0.5) * intensity;

    dest[i] = Math.max(0, Math.min(255, src[i] + noiseR));
    dest[i + 1] = Math.max(0, Math.min(255, src[i + 1] + noiseG));
    dest[i + 2] = Math.max(0, Math.min(255, src[i + 2] + noiseB));
    dest[i + 3] = src[i + 3];
  }
}

/**
 * Simulates VAE bottleneck quantization by compressing the resolution
 * and color levels (bit depth) and interpolating back up.
 */
export function applyVaeQuantization(
  srcData: ImageData,
  destData: ImageData,
  downScaleFactor = 4, // Downscale by 4x
  colorLevels = 16    // Color levels per channel
): void {
  const { width, height, data: src } = srcData;
  const dest = destData.data;

  // We loop spatial neighborhoods to compute average and clamp color depth
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Find downscaled grid coordinates
      const gx = Math.floor(x / downScaleFactor) * downScaleFactor;
      const gy = Math.floor(y / downScaleFactor) * downScaleFactor;
      
      let sumR = 0, sumG = 0, sumB = 0, count = 0;
      for (let dy = 0; dy < downScaleFactor; dy++) {
        for (let dx = 0; dx < downScaleFactor; dx++) {
          const px = Math.min(width - 1, gx + dx);
          const py = Math.min(height - 1, gy + dy);
          const nIdx = (py * width + px) * 4;
          sumR += src[nIdx];
          sumG += src[nIdx + 1];
          sumB += src[nIdx + 2];
          count++;
        }
      }

      // Quantized color components
      let r = sumR / count;
      let g = sumG / count;
      let b = sumB / count;

      // Bit quantization
      const step = 255 / (colorLevels - 1);
      r = Math.round(r / step) * step;
      g = Math.round(g / step) * step;
      b = Math.round(b / step) * step;

      // Blend slightly with original to simulate a VAE decoder (which tries to restore elements)
      dest[idx] = Math.max(0, Math.min(255, r * 0.7 + src[idx] * 0.3));
      dest[idx + 1] = Math.max(0, Math.min(255, g * 0.7 + src[idx + 1] * 0.3));
      dest[idx + 2] = Math.max(0, Math.min(255, b * 0.7 + src[idx + 2] * 0.3));
      dest[idx + 3] = src[idx + 3];
    }
  }
}

/**
 * Neural Bilateral Filter (mimics custom denoiser nodes in ComfyUI).
 * Smoothes out uniform areas containing watermark carrier noise while preserving major edges.
 */
export function applyNeuralDenoise(
  srcData: ImageData,
  destData: ImageData,
  spatialSigma = 2.0,
  rangeSigma = 25.0
): void {
  const { width, height, data: src } = srcData;
  const dest = destData.data;

  // Emulate a swift Bilateral filter
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = src[idx];
      const g = src[idx + 1];
      const b = src[idx + 2];

      let sumR = 0, sumG = 0, sumB = 0;
      let weightSum = 0;

      // Small 5x5 spatial kernel
      const radius = 2;
      for (let ky = -radius; ky <= radius; ky++) {
        for (let kx = -radius; kx <= radius; kx++) {
          const px = Math.max(0, Math.min(width - 1, x + kx));
          const py = Math.max(0, Math.min(height - 1, y + ky));
          const nIdx = (py * width + px) * 4;

          const nr = src[nIdx];
          const ng = src[nIdx + 1];
          const nb = src[nIdx + 2];

          // Spatial weight (Gaussian dist)
          const spatialDistSq = kx * kx + ky * ky;
          const spatialWeight = Math.exp(-spatialDistSq / (2 * spatialSigma * spatialSigma));

          // Color weight (Gaussian difference)
          const colorColorSq = (r - nr) * (r - nr) + (g - ng) * (g - ng) + (b - nb) * (b - nb);
          const colorWeight = Math.exp(-colorColorSq / (2 * rangeSigma * rangeSigma));

          const weight = spatialWeight * colorWeight;
          sumR += nr * weight;
          sumG += ng * weight;
          sumB += nb * weight;
          weightSum += weight;
        }
      }

      dest[idx] = sumR / weightSum;
      dest[idx + 1] = sumG / weightSum;
      dest[idx + 2] = sumB / weightSum;
      dest[idx + 3] = src[idx + 3];
    }
  }
}

/**
 * Calculates a dynamic cross-correlation score between the current image
 * and the expected SynthID sinusoidal watermark key.
 * 
 * Returns a score from 0 to 100 representing the detection confidence.
 */
export function scanSynthIDWatermark(
  currentData: ImageData,
  hasWatermarkInjected: boolean
): number {
  if (!hasWatermarkInjected) {
    // If no watermark is injected at all, there might only be trivial natural noise matches (0-3%)
    return Math.floor(Math.random() * 3);
  }

  const { width, height, data } = currentData;
  const cx = width / 2;
  const cy = height / 2;

  let correlationSum = 0;
  let count = 0;

  // Sample every few pixels for rapid interactive calculation
  const step = 3; 

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = (y * width + x) * 4;
      
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // Extract the Blue relative high frequencies (primary carrier)
      const carrierValue = b - (r + g) / 2;

      // Expected watermark pattern at this coordinate
      const expected = getWatermarkValue(x, y, cx, cy, 1.0);

      correlationSum += carrierValue * expected;
      count++;
    }
  }

  const avgCorrelation = correlationSum / count;
  
  // Normalize the score to a beautiful 0-100 gauge scale
  // Raw correlation for full strength is around 1.5 to 2.5
  let score = (avgCorrelation / 1.7) * 100;

  // Adding subtle clipping / smoothing so it behaves nicely as an interactive game
  score = Math.max(0, Math.min(100, score));

  // If score fluctuates slightly to match live scanner behavior, add a minor jitter
  const jitteredScore = Math.max(0, Math.min(100, score + (Math.sin(Date.now() / 200) * 1)));

  return Math.round(jitteredScore);
}

/**
 * Simulates classical JPEG compression blocking artifacts directly on pixel matrix layout.
 */
export function applyJPEGCompressionSimulation(srcData: ImageData, destData: ImageData, quality: number): void {
  const { width, height, data: src } = srcData;
  const dest = destData.data;
  const factor = Math.min(1.0, quality / 100);
  
  for (let y = 0; y < height; y += 8) {
    for (let x = 0; x < width; x += 8) {
      // Gather colors for this 8x8 block
      let rSum = 0, gSum = 0, bSum = 0, pixCount = 0;
      for (let by = 0; by < 8; by++) {
        for (let bx = 0; bx < 8; bx++) {
          const px = Math.min(width - 1, x + bx);
          const py = Math.min(height - 1, y + by);
          const idx = (py * width + px) * 4;
          rSum += src[idx];
          gSum += src[idx + 1];
          bSum += src[idx + 2];
          pixCount++;
        }
      }
      const rAvg = rSum / pixCount;
      const gAvg = gSum / pixCount;
      const bAvg = bSum / pixCount;
      
      // Interpolate classic JPEG blocking factors
      for (let by = 0; by < 8; by++) {
        for (let bx = 0; bx < 8; bx++) {
          const px = Math.min(width - 1, x + bx);
          const py = Math.min(height - 1, y + by);
          const idx = (py * width + px) * 4;
          dest[idx] = Math.max(0, Math.min(255, src[idx] * factor + rAvg * (1 - factor)));
          dest[idx + 1] = Math.max(0, Math.min(255, src[idx + 1] * factor + gAvg * (1 - factor)));
          dest[idx + 2] = Math.max(0, Math.min(255, src[idx + 2] * factor + bAvg * (1 - factor)));
          dest[idx + 3] = src[idx + 3];
        }
      }
    }
  }
}

/**
 * Standard median noise suppression filter targeting micro-peaks of SynthID textures.
 */
export function applyMedianFilter(srcData: ImageData, destData: ImageData, size = 3): void {
  const { width, height, data: src } = srcData;
  const dest = destData.data;
  const half = Math.floor(size / 2);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const rSamples: number[] = [];
      const gSamples: number[] = [];
      const bSamples: number[] = [];
      
      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const px = Math.max(0, Math.min(width - 1, x + kx));
          const py = Math.max(0, Math.min(height - 1, y + ky));
          const nIdx = (py * width + px) * 4;
          rSamples.push(src[nIdx]);
          gSamples.push(src[nIdx + 1]);
          bSamples.push(src[nIdx + 2]);
        }
      }
      
      rSamples.sort((a, b) => a - b);
      gSamples.sort((a, b) => a - b);
      bSamples.sort((a, b) => a - b);
      
      const mid = Math.floor(rSamples.length / 2);
      dest[idx] = rSamples[mid];
      dest[idx + 1] = gSamples[mid];
      dest[idx + 2] = bSamples[mid];
      dest[idx + 3] = src[idx + 3];
    }
  }
}

/**
 * Standard Gaussian Blur solver to simulate lens defocusing / spatial high frequency wiping.
 */
export function applyGaussianBlurSimulation(srcData: ImageData, destData: ImageData, radius: number): void {
  const { width, height, data: src } = srcData;
  const dest = destData.data;
  
  if (radius <= 0.1) {
    dest.set(src);
    return;
  }
  
  const kernelSize = Math.max(3, Math.ceil(radius * 2) * 2 + 1);
  const half = Math.floor(kernelSize / 2);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let rSum = 0, gSum = 0, bSum = 0, wSum = 0;
      
      for (let ky = -half; ky <= half; ky++) {
        for (let kx = -half; kx <= half; kx++) {
          const px = Math.max(0, Math.min(width - 1, x + kx));
          const py = Math.max(0, Math.min(height - 1, y + ky));
          const nIdx = (py * width + px) * 4;
          
          const weight = Math.exp(-(kx * kx + ky * ky) / (2 * radius * radius));
          rSum += src[nIdx] * weight;
          gSum += src[nIdx + 1] * weight;
          bSum += src[nIdx + 2] * weight;
          wSum += weight;
        }
      }
      
      dest[idx] = rSum / wSum;
      dest[idx + 1] = gSum / wSum;
      dest[idx + 2] = bSum / wSum;
      dest[idx + 3] = src[idx + 3];
    }
  }
}

/**
 * Simulates cropping the image and scaling back up to represent center crop alignments.
 */
export function applyCropAndScaleSimulation(srcData: ImageData, destData: ImageData, percentage: number): void {
  const { width, height, data: src } = srcData;
  const dest = destData.data;
  
  if (percentage <= 0) {
    dest.set(src);
    return;
  }
  
  const cropFrac = percentage / 100;
  const cropX = Math.round((width * cropFrac) / 2);
  const cropY = Math.round((height * cropFrac) / 2);
  const cropW = width - cropX * 2;
  const cropH = height - cropY * 2;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const srcX = Math.min(width - 1, Math.max(0, cropX + Math.floor((x / width) * cropW)));
      const srcY = Math.min(height - 1, Math.max(0, cropY + Math.floor((y / height) * cropH)));
      const srcIdx = (srcY * width + srcX) * 4;
      
      dest[idx] = src[srcIdx];
      dest[idx + 1] = src[srcIdx + 1];
      dest[idx + 2] = src[srcIdx + 2];
      dest[idx + 3] = src[srcIdx + 3];
    }
  }
}

/**
 * Direct salt & pepper binary/extreme values noise substitution.
 */
export function applySaltAndPepperNoiseSimulation(srcData: ImageData, destData: ImageData, percentage: number): void {
  const { data: src } = srcData;
  const dest = destData.data;
  dest.set(src);
  const noiseFrac = percentage / 100;
  
  for (let i = 0; i < src.length; i += 4) {
    if (Math.random() < noiseFrac) {
      const isSalt = Math.random() > 0.5;
      const val = isSalt ? 255 : 0;
      dest[i] = val;
      dest[i + 1] = val;
      dest[i + 2] = val;
    }
  }
}

/**
 * Exponential gamma warping simulator.
 */
export function applyGammaCorrection(srcData: ImageData, destData: ImageData, gamma: number): void {
  const { data: src } = srcData;
  const dest = destData.data;
  for (let i = 0; i < src.length; i += 4) {
    dest[i] = Math.max(0, Math.min(255, Math.pow(src[i] / 255, gamma) * 255));
    dest[i + 1] = Math.max(0, Math.min(255, Math.pow(src[i + 1] / 255, gamma) * 255));
    dest[i + 2] = Math.max(0, Math.min(255, Math.pow(src[i + 2] / 255, gamma) * 255));
    dest[i + 3] = src[i + 3];
  }
}

/**
 * Offsets entire RGB channels statically.
 */
export function applyBrightnessShift(srcData: ImageData, destData: ImageData, offset: number): void {
  const { data: src } = srcData;
  const dest = destData.data;
  for (let i = 0; i < src.length; i += 4) {
    dest[i] = Math.max(0, Math.min(255, src[i] + offset));
    dest[i + 1] = Math.max(0, Math.min(255, src[i + 1] + offset));
    dest[i + 2] = Math.max(0, Math.min(255, src[i + 2] + offset));
    dest[i + 3] = src[i + 3];
  }
}

/**
 * Classical spatial rotation transformation matrix representation.
 */
export function applyShearRotation(srcData: ImageData, destData: ImageData, angle: number): void {
  const { width, height, data: src } = srcData;
  const dest = destData.data;
  const angleRad = (angle * Math.PI) / 180;
  const cx = width / 2;
  const cy = height / 2;
  const cosVal = Math.cos(angleRad);
  const sinVal = Math.sin(angleRad);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const dx = x - cx;
      const dy = y - cy;
      const rx = cosVal * dx - sinVal * dy + cx;
      const ry = sinVal * dx + cosVal * dy + cy;
      const px = Math.min(width - 1, Math.max(0, Math.round(rx)));
      const py = Math.min(height - 1, Math.max(0, Math.round(ry)));
      const srcIdx = (py * width + px) * 4;
      
      dest[idx] = src[srcIdx];
      dest[idx + 1] = src[srcIdx + 1];
      dest[idx + 2] = src[srcIdx + 2];
      dest[idx + 3] = src[srcIdx + 3];
    }
  }
}
