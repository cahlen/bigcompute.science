---
title: "CFD Chaotic Advection: Standard Map Lyapunov Spectrum (RTX 5090)"
slug: cfd-chaotic-advection
date: 2026-05-31
author: cahlen
author_github: https://github.com/cahlen
status: complete

hardware:
  name: NVIDIA GeForce RTX 5090
  gpus: 1x RTX 5090 (32 GB VRAM)
  gpu_interconnect: N/A (single GPU)
  cpus: Intel Core Ultra 9 285K
  ram: 188 GB DDR5

software:
  cuda: "13.0"
  method: Benettin tangent-vector Lyapunov estimation on Chirikov standard map
  custom_kernel: scripts/experiments/cfd-chaotic-advection/standard_map_lyapunov.cu

tags:
  domain: [fluid-dynamics, chaotic-advection, dynamical-systems, ergodic-theory]
  hardware: [rtx-5090]
  method: [cuda-kernel, lyapunov-exponent, parameter-sweep]

results:
  problem: "Map K → largest Lyapunov exponent Λ(K) for the Chirikov standard map on T²"
  conjecture_class: "Integrability-to-chaos transition in area-preserving advection (K_crit ≈ 0.972)"
  status: "COMPLETE — 16,777,216 trajectories in 116.6s (deep certifying sweep), zero NaN/Inf"
  sweep: "2048 K × 8192 ICs × 50000 iterations, K ∈ [0, 5]"
  mean_lambda_at_k_crit: 0.0446
  validation_k0: "Λ(0) = 0 (integrable limit)"
  throughput: "143,901 trajectories/s (deep sweep)"

summary: "First CFD experiment on bigcompute: Chirikov standard map Lyapunov spectrum on RTX 5090. Deep certifying sweep (16.8M trajectories, 116.6s). Finding published: Λ(K) at literature K_crit."

code: https://github.com/cahlen/idontknow/tree/main/scripts/experiments/cfd-chaotic-advection
data: /data/cfd-chaotic-advection/
dataset: https://huggingface.co/datasets/cahlen/cfd-chaotic-advection
cuda_kernels: https://huggingface.co/cahlen/bigcompute-cuda-kernels/tree/main/cfd-chaotic-advection
finding: /findings/cfd-standard-map-chaos-onset/
---

# CFD Chaotic Advection: Standard Map Lyapunov Spectrum

## Abstract

We begin a **computational fluid dynamics conjecture program** on bigcompute.science using the same custom-CUDA methodology as our number-theory experiments. The first target is the **Chirikov standard map** on the 2-torus — an area-preserving map that models **chaotic advection** in periodically driven 2D flows.

For each coupling parameter $K$, we estimate the largest Lyapunov exponent $\Lambda(K)$ by averaging Benettin tangent-vector growth over thousands of random initial conditions on a single **RTX 5090**.

## Why this map?

The standard map

$$p' = p + K\sin\theta, \qquad \theta' = \theta + p' \pmod{2\pi}$$

is the simplest symplectic model exhibiting a transition from integrability ($K=0$) to widespread chaos ($K \gtrsim 0.972$). In fluid mechanics, identical phase-space structure arises in **Stokes flow with periodic forcing** — passive tracers mix chaotically even when the velocity field is laminar.

This connects our **transfer-operator / ergodic-theory** expertise to **CFD conjectures** without requiring a full Navier–Stokes DNS stack on day one.

## Method

1. Grid $K \in [0, K_{\max}]$ with `n_k` points
2. For each $K$, sample `n_ic` random $(\theta, p) \in \mathbb{T}^2$
3. Iterate $n_{\mathrm{iters}}$ steps; accumulate $\frac{1}{n}\sum \log\|J v\|$ (Benettin)
4. Output CSV: mean, std, min, max, fraction of ICs with $\Lambda > 0$
5. Certificate: exit code 2 on NaN/Inf; validate $\Lambda(0) \approx 0$

## Reproduction

```bash
git clone https://github.com/cahlen/idontknow.git
cd idontknow
./scripts/experiments/cfd-chaotic-advection/run.sh 64 512 5000 2.0   # smoke test
./scripts/experiments/cfd-chaotic-advection/run.sh                  # overnight defaults
```

Requires CUDA 13+, RTX 5090 (`-arch=sm_120`) or adjust architecture flag.

## Next steps

- ~~Compare empirical chaos onset against literature $K_{\mathrm{crit}}$~~ → [finding](/findings/cfd-standard-map-chaos-onset/)
- Extend to **linked twist maps** and **sinewave flow** models for laminar chaotic mixing
- Phase 2: 2D pseudospectral Navier–Stokes blowup search (Beale–Kato–Majda)

*Human–AI collaboration. Not peer-reviewed. All code open for verification.*
