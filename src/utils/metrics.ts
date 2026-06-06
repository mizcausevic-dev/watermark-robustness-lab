/**
 * Real, client-side image-quality + provenance metrics.
 * Everything here is genuine math on pixel buffers — no mock values.
 */

/** Mean Squared Error across RGB (ignores alpha). */
export function mse(a: Uint8ClampedArray, b: Uint8ClampedArray): number {
  let sum = 0;
  let n = 0;
  for (let i = 0; i < a.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const d = a[i + c] - b[i + c];
      sum += d * d;
    }
    n += 3;
  }
  return n ? sum / n : 0;
}

/** Peak Signal-to-Noise Ratio in dB (higher = more similar). */
export function psnr(a: Uint8ClampedArray, b: Uint8ClampedArray): number {
  const m = mse(a, b);
  if (m <= 1e-9) return 99;
  return 10 * Math.log10((255 * 255) / m);
}

function luma(d: Uint8ClampedArray, i: number): number {
  return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
}

/**
 * Structural Similarity (SSIM), 0..1. Windowed implementation: averages local
 * SSIM over non-overlapping 8x8 luma blocks (a faithful, lightweight version of
 * Wang et al. 2004 — not the single-window shortcut).
 */
export function ssim(a: ImageData, b: ImageData): number {
  const { width: w, height: h, data: da } = a;
  const db = b.data;
  const C1 = (0.01 * 255) ** 2;
  const C2 = (0.03 * 255) ** 2;
  const blk = 8;
  let acc = 0;
  let blocks = 0;
  for (let by = 0; by + blk <= h; by += blk) {
    for (let bx = 0; bx + blk <= w; bx += blk) {
      let ma = 0, mb = 0, n = 0;
      for (let y = by; y < by + blk; y++) {
        for (let x = bx; x < bx + blk; x++) {
          const i = (y * w + x) * 4;
          ma += luma(da, i);
          mb += luma(db, i);
          n++;
        }
      }
      ma /= n; mb /= n;
      let va = 0, vb = 0, cov = 0;
      for (let y = by; y < by + blk; y++) {
        for (let x = bx; x < bx + blk; x++) {
          const i = (y * w + x) * 4;
          const la = luma(da, i) - ma;
          const lb = luma(db, i) - mb;
          va += la * la; vb += lb * lb; cov += la * lb;
        }
      }
      va /= n - 1; vb /= n - 1; cov /= n - 1;
      const s = ((2 * ma * mb + C1) * (2 * cov + C2)) /
                ((ma * ma + mb * mb + C1) * (va + vb + C2));
      acc += s; blocks++;
    }
  }
  return blocks ? acc / blocks : 1;
}

/** Fraction of pixels (0..100) whose max channel delta exceeds `thresh`. */
export function percentChanged(a: Uint8ClampedArray, b: Uint8ClampedArray, thresh = 2): number {
  let changed = 0, total = 0;
  for (let i = 0; i < a.length; i += 4) {
    const d = Math.max(
      Math.abs(a[i] - b[i]),
      Math.abs(a[i + 1] - b[i + 1]),
      Math.abs(a[i + 2] - b[i + 2])
    );
    if (d > thresh) changed++;
    total++;
  }
  return total ? (changed / total) * 100 : 0;
}

/** Compact viridis-style colormap. t in 0..1 -> [r,g,b]. */
export function viridis(t: number): [number, number, number] {
  const stops: Array<[number, number, number]> = [
    [68, 1, 84], [59, 82, 139], [33, 145, 140], [94, 201, 98], [253, 231, 37],
  ];
  t = Math.min(1, Math.max(0, t));
  const seg = t * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(seg));
  const f = seg - i;
  const a = stops[i], b = stops[i + 1];
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
  ];
}

/** Render an amplified, colormapped per-pixel difference heatmap into `out`. */
export function diffHeatmap(orig: ImageData, proc: ImageData, out: ImageData, amp = 6): void {
  const a = orig.data, b = proc.data, o = out.data;
  for (let i = 0; i < a.length; i += 4) {
    const d = (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2])) / 3;
    const [r, g, bl] = viridis(Math.min(1, (d * amp) / 255));
    o[i] = r; o[i + 1] = g; o[i + 2] = bl; o[i + 3] = 255;
  }
}

/** SHA-256 of bytes -> lowercase hex (Web Crypto). Accepts any BufferSource. */
export async function sha256Hex(data: ArrayBuffer | ArrayBufferView): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', data as BufferSource);
  return [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
