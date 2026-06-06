# Watermark Stress Test

**An interactive teaching lab on why hidden AI-content watermarks are fragile — and why durable provenance needs cryptographic Content Credentials (C2PA).**

> ⚠️ **Educational simulation.** This app injects its *own synthetic* watermark and analyses it
> entirely in your browser. It does **not** detect, contain, or remove Google SynthID or any
> production watermarking system, and nothing you load is uploaded. The percentages and "detection"
> scores describe the lab's synthetic signal only. The goal is to make the case *for* robust
> provenance, not to evade it.

Live: _provenance-lab.kineticgain.com_ (deploy target) · A [Kinetic Gain](https://kineticgain.com/) project.

---

## What it shows

Steganographic watermarks hide a recoverable signal *inside* media — in image frequency
coefficients/latents, or in an LLM's token-selection bias. They survive casual edits, but a signal
hidden in the pixels can be attenuated by edits that target where it lives. This lab lets you feel
that first-hand:

- **Image Lab** — inject a synthetic concentric-ring carrier, then watch a real, client-side
  notch filter, latent/spatial jitter, quantization bottleneck, or bilateral denoise attenuate it.
  Includes an amplified difference view and an FFT magnitude view so you can *see* the carrier band.
- **Text Lab** — see how a token-level "favoured/neutral" bias produces an improbable Z-score, and
  how synonym swaps, homoglyphs, zero-width characters, or a full rewrite pull it back toward chance.
- **Pipeline** — a node-graph schematic of how those transformations compose into a multi-step pass.
- **Briefing** — short explainers ending where the evidence points: cryptographic
  **Content Credentials (C2PA)** as the durable, *tamper-evident* layer watermarking alone can't provide.

## Why it exists

You cannot claim a provenance signal is robust without probing where it breaks. Mapping those
failure modes is the argument for **defence in depth**: Content Credentials for verifiable origin,
watermarking as one corroborating signal, and disclosure policy on top. This lab is the hands-on
illustration of that argument.

## Tech

Pure client-side **React 19 + Vite + TypeScript + Tailwind v4**. No backend, no API key, no telemetry —
the entire simulation (canvas pixel ops, FFT view, statistics) runs in the browser. The image filters
in [`src/utils/imageFilters.ts`](src/utils/imageFilters.ts) are real signal-processing operations, not mock-ups.

## Run locally

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static bundle in dist/
npm run lint     # tsc --noEmit
```

Because it's fully static, `dist/` can be served from any static host (the intended target is a
Kinetic Gain subdomain; GitHub Pages also works).

## Scope & ethics

This is an AI-safety / provenance-education artifact. It demonstrates robustness boundaries on a
self-authored synthetic signal to argue for stronger provenance. It is **not** a tool for removing
real-world watermarks or laundering AI-generated content. See the in-app *Responsible Use & Scope*
briefing for the full statement.

## Related work

This project concerns **content provenance** watermarking — marks embedded in generated media
(the SynthID family). It is independent of, and not derived from, the
[Watermark-Robustness-Toolbox (WRT)](https://github.com/dnn-security/Watermark-Robustness-Toolbox)
by Lukas, Jiang, Li & Kerschbaum, which benchmarks the robustness of **DNN model-weight** watermarks
(used to prove ownership of trained neural networks) — a distinct subfield, in Python/PyTorch under
GPL-3.0. See their IEEE S&P 2022 paper, *"SoK: How Robust is Deep Neural Network Image Classification
Watermarking?"*. Different domain, different stack, no shared code.

## License

[Apache-2.0](LICENSE).

## Further reading

- C2PA — Coalition for Content Provenance and Authenticity: <https://c2pa.org/>
- Content Credentials: <https://contentcredentials.org/>
- Google DeepMind SynthID (the production system this lab is *about*, not *against*): <https://deepmind.google/science/synthid/>
