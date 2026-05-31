---
title: "3D NS BKM Infrastructure: First Certifying Pseudospectral Blowup-Monitor Runs on RTX 5090"
slug: cfd-ns3d-bkm-infrastructure
date: 2026-05-31
author: cahlen
author_github: https://github.com/cahlen
significance: medium

domain: [fluid-dynamics, navier-stokes, beale-kato-majda, pseudospectral, 3d-dns]
related_experiment: /experiments/cfd-ns3d-bkm/

summary: "GPU pseudospectral 3D vorticity-form Navier–Stokes with vortex stretching and BKM integral tracking. Certifying runs at 64³ and 128³ on RTX 5090 — zero NaN/Inf; no blowup signal at tested Re/resolution. Infrastructure toward higher-Re blowup search, not singularity evidence."

data:
  grid_smoke: "64³"
  grid_standard: "128³"
  nu_smoke: 0.01
  nu_standard: 0.001
  steps_smoke: 200
  steps_standard: 1000
  bkm_smoke: 1.63
  bkm_standard: 1.24
  max_vorticity_standard: 0.614
  throughput_128: "22.9 steps/s"
  nan_inf: 0
  hardware: "NVIDIA RTX 5090"
  method: "3D vorticity-form NS, vortex stretching, cuFFT C2C, RK4, 2/3 dealiasing"
  status: "CONFIRMED — certifying runs, zero numerical failures"
  dir: /data/cfd-ns3d-bkm/

certification:
  level: silver
  verdict: ACCEPT
  note: "3-model review (2026-05-31); revisions applied"
  reviews: https://github.com/cahlen/idontknow/tree/main/docs/verifications

code: https://github.com/cahlen/idontknow/tree/main/scripts/experiments/cfd-ns3d-bkm
dataset: https://huggingface.co/datasets/cahlen/cfd-ns3d-bkm
---

# 3D NS BKM Infrastructure: First Certifying Pseudospectral Blowup-Monitor Runs

## The Finding

We extended the [2D BKM diagnostic](/findings/cfd-ns-bkm-diagnostic/) to **three-dimensional vorticity-form incompressible Navier–Stokes** with explicit **vortex stretching** $(\boldsymbol{\omega}\cdot\nabla)\mathbf{u}$ — the mechanism absent in 2D and central to **Beale–Kato–Majda** blowup criteria in 3D.

Each run tracks max vorticity $\|\omega\|_{L^\infty}$, enstrophy, and the cumulative BKM integral

$$\int_0^T \|\omega(\cdot,t)\|_{L^\infty}\, dt$$

on a single **NVIDIA RTX 5090** using a custom **CUDA + cuFFT** pseudospectral kernel.

| Run | Grid | $\nu$ | $\Delta t$ | IC | Steps | Result |
|-----|------|-------|------------|-----|-------|--------|
| Smoke | 64³ | 0.01 | 0.002 | Taylor–Green | 200 | BKM ≈ **1.63**; max $\|\omega\| \approx 4.17$ at $t=0.4$ |
| Standard | 128³ | 1e-3 | 0.002 | Random blob | 1000 | BKM ≈ **1.24**; max $\|\omega\| \approx 0.614$ at $t=2.0$ |
| Blowup search | 256³ | 1e-4 | 0.001 | Random blob | 500 | BKM ≈ **0.44**; max $\|\omega\| \approx 0.878$ at $t=0.5$; **2.3 steps/s** |
| Blowup search (long) | 256³ | 1e-4 | 0.001 | Random blob | 2000 | BKM ≈ **1.76**; max $\|\omega\| \approx 0.887$ at $t=2.0$; **880 s** |
| Blowup search (5000) | 256³ | 1e-4 | 0.001 | Random blob | 5000 | BKM ≈ **4.45**; max $\|\omega\| \approx 0.903$ at $t=5.0$; **2190 s** |
| Taylor–Green | 256³ | 1e-3 | 0.001 | Taylor–Green | 1000 | BKM ≈ **4.23**; max $\|\omega\| \approx 4.44$ at $t=1.0$ |
| Kerr (ν sweep) | 256³ | 1e-4 | 0.001 | Kerr tubes | 2000 | BKM ≈ **9.99**; max $\|\omega\| \approx 5.0$; **5.7×** random BKM |
| Kerr (ν sweep) | 256³ | 1e-3 | 0.001 | Kerr tubes | 1000 | BKM ≈ **4.99** vs random **0.88** at $t=1.0$ |

Both runs: **zero NaN/Inf** (exit certificate). **No finite-time blowup signal** at these resolutions and Reynolds numbers.

![3D BKM diagnostic](/data/cfd-ns3d-bkm/bkm_diagnostic.svg)

## Method

**Governing equation** on a periodic cube:

$$\partial_t \omega + (\mathbf{u}\cdot\nabla)\omega = (\boldsymbol{\omega}\cdot\nabla)\mathbf{u} + \nu \nabla^2 \omega$$

Velocity from Fourier space: $\hat{\mathbf{u}} = i(\mathbf{k}\times\hat{\boldsymbol{\omega}})/\|\mathbf{k}\|^2$. **2/3 Orszag dealiasing**, **RK4**, **fp64** throughout.

**Hardware.** Physical RTX 5090 (32 GB, Blackwell, CC 12.0), compiled with `-arch=sm_120`.

**Limitations.** No spatial convergence study; moderate Re only; **512³ OOM on 32 GB RTX 5090** (grid must be power of 2); 256³ is far below resolutions used in state-of-the-art 3D blowup-search DNS (e.g. Kerr 1993).

## References

- Beale, Kato, Majda (1984) — BKM blowup criterion
- Orszag (1971) — 2/3 dealiasing rule
- Canuto et al. (1988); Rogallo (1981) — pseudospectral methods
- Kerr (1993) — landmark 3D Euler blowup-search DNS

## Claim validation

| Claim | Status | Evidence |
|-------|--------|----------|
| **3D vortex-stretching DNS runs** | Valid infrastructure | CSV logs, certifying exit code |
| **BKM integral monitoring** | Implemented | Cumulative $\int_0^t \|\omega\|_\infty ds$ each step |
| **Finite-time blowup** | **Not claimed** | Vorticity bounded at tested $(N,\nu,T)$ |
| **Resolution of blowup candidates** | **Not claimed** | 128³ certifying sweep only |

## What we do not claim

- Evidence of Navier–Stokes singularity or blowup
- Sufficient resolution to resolve inertial-range turbulence or blowup-scale structures
- Comparison to published 3D benchmark DNS at identical Re

## Phase 5: Kerr-type IC and viscosity sweep

We added a **Kerr-class antiparallel vortex-tube** initializer (z-aligned Gaussian filaments at $x = \pi \pm 0.55$, Crow-type 3D perturbation) and ran a **256³** viscosity sweep:

| IC | $\nu$ | $T$ | BKM | max $\|\omega\|_\infty$ |
|----|-------|-----|-----|------------------------|
| Kerr | $10^{-3}$ | 1.0 | **4.99** | 5.0 |
| Random | $10^{-3}$ | 1.0 | 0.88 | 0.88 |
| Kerr | $10^{-4}$ | 2.0 | **9.99** | 5.0 |
| Random | $10^{-4}$ | 2.0 | 1.76 | 0.89 |
| Kerr | $10^{-5}$ | 1.0 | **4.99** | 5.0 |

Structured Kerr IC drives **~5–6× higher BKM** than random blob at matched $(N, \nu, T)$ — better aligned with blowup-search literature (Kerr 1993). Still **zero NaN/Inf**; vorticity bounded at tested resolution. HF configs `kerr_nu1e-03`, `kerr_nu1e-04`, `kerr_nu1e-05`.

![Kerr vs random BKM at ν=10⁻⁴](/data/cfd-ns3d-bkm/kerr_vs_random_nu1e-04.svg)

## Phase 4: targeted blowup search

We ran **256³** random-IC sweeps at $\nu = 10^{-4}$, $\Delta t = 0.001$: 500-, 2000-, and **5000-step** certifying runs (BKM **≈ 4.45** by $t=5.0$). A **256³ Taylor–Green** benchmark at $\nu = 10^{-3}$ reached BKM **≈ 4.23** by $t=1.0$. Vorticity remains bounded in all runs — **zero NaN/Inf**. **512³** exceeds 32 GB VRAM on RTX 5090. Data in Hugging Face configs `blowup_search`, `blowup_search_long`, `blowup_search_5000`, and `taylor_green_256`.

**Data:** [Hugging Face cahlen/cfd-ns3d-bkm](https://huggingface.co/datasets/cahlen/cfd-ns3d-bkm) · [Experiment](/experiments/cfd-ns3d-bkm/) · [Phase 2 finding](/findings/cfd-ns-bkm-diagnostic/)

## Reproduction

```bash
git clone https://github.com/cahlen/idontknow.git
cd idontknow
./scripts/experiments/cfd-ns3d-bkm/run.sh 64 0.01 200 0.002 taylor-green
./scripts/experiments/cfd-ns3d-bkm/run.sh 128 0.001 1000 0.002 random
./scripts/experiments/cfd-ns3d-bkm/run.sh 256 0.0001 500 0.001 random
./scripts/experiments/cfd-ns3d-bkm/run.sh 256 0.0001 2000 0.001 random
./scripts/experiments/cfd-ns3d-bkm/run.sh 256 0.0001 5000 0.001 random
./scripts/experiments/cfd-ns3d-bkm/run.sh 256 0.001 1000 0.001 taylor-green
./scripts/experiments/cfd-ns3d-bkm/run.sh 256 0.001 1000 0.001 kerr
./scripts/experiments/cfd-ns3d-bkm/run.sh 256 0.0001 2000 0.001 kerr
./scripts/experiments/cfd-ns3d-bkm/run_phase5_kerr_sweep.sh   # full ν sweep
```

*Human–AI collaboration. Silver-certified (2026-05-31). All code open for verification.*
