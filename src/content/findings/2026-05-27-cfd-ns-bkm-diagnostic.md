---
title: "2D NS BKM Diagnostic: Certifying Pseudospectral Vorticity Tracking on RTX 5090"
slug: cfd-ns-bkm-diagnostic
date: 2026-05-27
author: cahlen
author_github: https://github.com/cahlen
significance: medium

domain: [fluid-dynamics, navier-stokes, beale-kato-majda, pseudospectral]
related_experiment: /experiments/cfd-ns-bkm/

summary: "GPU pseudospectral 2D Navier–Stokes with BKM integral ∫||ω||∞ dt. Taylor–Green validates decay (max |ω|: 2.0→0.16); random-IC sweep at ν=1e-4 on 512² grid — certifying infrastructure, not blowup evidence (2D is globally regular)."

data:
  grid_smoke: "256²"
  grid_standard: "512²"
  nu_smoke: 0.001
  nu_standard: 0.0001
  steps_smoke: 2000
  steps_standard: 5000
  bkm_taylor_green: 12.8
  bkm_random: 1.77
  max_vorticity_t0: 2.0
  max_vorticity_t20: 0.16
  throughput_256: "1108 steps/s"
  throughput_512: "532 steps/s"
  nan_inf: 0
  hardware: "NVIDIA RTX 5090"
  method: "Pseudospectral vorticity-form NS, cuFFT C2C, RK4, 2/3 dealiasing"
  status: "CONFIRMED — certifying runs, zero numerical failures"
  dir: /data/cfd-ns-bkm/

certification:
  level: silver
  verdict: ACCEPT
  note: "3-model review (2026-05-31); revisions applied; gpt-4.1/o3-pro/gemini-2.5-pro"
  reviews: https://github.com/cahlen/idontknow/tree/main/docs/verifications

code: https://github.com/cahlen/idontknow/tree/main/scripts/experiments/cfd-ns-bkm
dataset: https://huggingface.co/datasets/cahlen/cfd-ns-bkm
---

# 2D NS BKM Diagnostic: Certifying Pseudospectral Vorticity Tracking

## The Finding

We built and validated a **pseudospectral 2D incompressible Navier–Stokes** solver on a single **RTX 5090**, tracking the **Beale–Kato–Majda (BKM)** diagnostic

$$\int_0^T \|\omega(\cdot,t)\|_{L^\infty}\, dt$$

alongside enstrophy. **Two-dimensional incompressible flow is globally regular** — we do **not** claim blowup or singularity. This is **certifying CFD infrastructure** toward 3D BKM searches.

| Run | Grid | ν | IC | Result |
|-----|------|---|-----|--------|
| Smoke | 256² | 1e-3 | Taylor–Green | max \|ω\|: **2.0 → 0.16** (t=20); BKM ≈ **12.8** |
| Standard | 512² | 1e-4 | Random blob | BKM ≈ **1.77**; **532 steps/s** |

Both runs: **zero NaN/Inf** (exit certificate).

![BKM diagnostic](/data/cfd-ns-bkm/bkm_diagnostic.svg)

## Method

**Equations.** Vorticity form on $[0,2\pi)^2$:

$$\omega_t + \mathbf{u}\cdot\nabla\omega = \nu\nabla^2\omega, \quad \omega = -\nabla^2\psi, \quad \mathbf{u} = (\partial_y\psi, -\partial_x\psi)$$

**Discretization.** cuFFT complex-to-complex transforms, **2/3 Orszag dealiasing** (zero modes with $|k| > 2N/3$), **RK4** time integration. All arithmetic is **fp64**. Physical-space nonlinear products use **1/N²** scaling after inverse FFT (cuFFT unnormalized convention on RTX 5090).

**Random IC.** Gaussian-envelope vorticity blob centered at $(\pi,\pi)$ with SplitMix64 pseudorandom amplitudes per grid point (see `init_random_vorticity` in `ns2d_bkm.cu`).

**Hardware.** Physical **NVIDIA GeForce RTX 5090** (32 GB, Blackwell, CC 12.0), measured on this machine — not a projection.

**Limitations.** No formal spatial/temporal convergence study yet; explicit RK4 requires CFL-limited $\Delta t$ (we use $\Delta t = 0.005$–$0.01$ at $N=512$).

## References

- Beale, Kato, Majda (1984) — BKM blowup criterion
- Orszag (1971) — 2/3 dealiasing rule
- Ladyzhenskaya (1969); Temam (1977) — 2D global regularity
- Canuto et al. (1988) — spectral methods
- Brachet et al. (1983) — Taylor–Green vortex DNS benchmark

## External validation

| Check | Expected | This work |
|-------|----------|-----------|
| Taylor–Green t=0 | max \|ω\| = 2 | 2.0 |
| Enstrophy t=0 | $4\pi^2 \approx 39.48$ | 39.48 |
| Comparison to Brachet et al. (1983) TG decay | Qualitative agreement | Exponential enstrophy decay; no blowup |
| Numerical stability | No NaN/Inf | 0 failures |

**Diagnostics.** Each logged step records max $\|\omega\|_\infty$, enstrophy $\int|\omega|^2 dx$, and cumulative BKM integral.

## Claim validation

| Claim | Status | Evidence |
|-------|--------|----------|
| **BKM diagnostic tracking** | Valid infrastructure | CSV logs max \|ω\| and cumulative integral |
| **Pseudospectral accuracy** | Taylor–Green validates | Correct initial enstrophy and decay |
| **Blowup / singularity** | **Not claimed** | 2D global regularity (Ladyzhenskaya) |
| **World-record DNS scale** | **Not claimed** | Single-GPU 512² diagnostic sweeps |

## What we do not claim

- Evidence of finite-time blowup (impossible in 2D with finite energy)
- Resolution-independent convergence study (future work)
- Comparison to published 2D NS benchmarks at identical Re (grid differs)

**Data:** [Hugging Face cahlen/cfd-ns-bkm](https://huggingface.co/datasets/cahlen/cfd-ns-bkm) · [Experiment](/experiments/cfd-ns-bkm/) · [Phase 3 finding](/findings/cfd-ns3d-bkm-infrastructure/)

## Reproduction

```bash
git clone https://github.com/cahlen/idontknow.git
cd idontknow
./scripts/experiments/cfd-ns-bkm/run.sh 256 0.001 2000 0.01 taylor-green
./scripts/experiments/cfd-ns-bkm/run.sh 512 0.0001 5000 0.005 random
```

*Human–AI collaboration. Silver-certified (2026-05-31). All code open for verification.*
