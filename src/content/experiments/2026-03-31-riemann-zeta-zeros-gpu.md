---
title: "Riemann Hypothesis: Planned Verification of 10M Zeta Zeros on 8× B200"
slug: riemann-zeta-zeros-gpu
date: 2026-03-31
author: cahlen
author_github: https://github.com/cahlen
status: in-progress

hardware:
  name: NVIDIA DGX B200
  gpus: 8× NVIDIA B200 (183 GB VRAM each, 1.43 TB total)
  gpu_interconnect: NVLink 5 (NV18), full mesh
  cpus: 2× Intel Xeon Platinum 8570 (112 cores / 224 threads)
  ram: 2 TB DDR5

software:
  cuda: "13.0"
  driver: "580.126.09"
  custom_kernel: scripts/experiments/riemann-zeta/riemann_zeros.cu

tags:
  domain: [number-theory, analytic-number-theory, open-conjectures]
  hardware: [b200, dgx, nvlink]
  method: [cuda-kernel, riemann-siegel, sign-change-detection]

results:
  conjecture: "Riemann Hypothesis"
  status: "NOT YET RUN"

code: https://github.com/cahlen/idontknow
data: /data/riemann-zeros/
---

# Riemann Hypothesis: Planned Verification of Zeta Zeros on 8× B200

## Abstract

We verify that the first $N$ non-trivial zeros of the Riemann zeta function $\zeta(s)$ lie on the critical line $\text{Re}(s) = \frac{1}{2}$ using a custom CUDA kernel implementing the Riemann-Siegel formula for the Hardy $Z$-function. The kernel evaluates $Z(t)$ on a fine grid across 8 NVIDIA B200 GPUs, detecting sign changes to locate zeros, and validates the count against the Riemann-von Mangoldt formula.

## Background

### The Riemann Hypothesis

The **Riemann zeta function** is defined for $\text{Re}(s) > 1$ by

$$\zeta(s) = \sum_{n=1}^{\infty} \frac{1}{n^s}$$

and extended to all $s \neq 1$ by analytic continuation. The **Riemann Hypothesis (1859)** states:

> All non-trivial zeros of $\zeta(s)$ have real part $\frac{1}{2}$.

This is arguably the most important open problem in mathematics. It implies sharp bounds on the distribution of prime numbers via the explicit formula:

$$\psi(x) = x - \sum_{\rho} \frac{x^\rho}{\rho} - \log(2\pi) - \frac{1}{2}\log(1 - x^{-2})$$

where the sum runs over non-trivial zeros $\rho$ of $\zeta$.

### The Hardy $Z$-Function

The **Hardy $Z$-function** is a real-valued function satisfying

$$Z(t) = e^{i\theta(t)} \zeta\!\left(\tfrac{1}{2} + it\right)$$

where $\theta(t)$ is the Riemann-Siegel theta function:

$$\theta(t) = \text{Im}\!\left(\log \Gamma\!\left(\tfrac{1}{4} + \tfrac{it}{2}\right)\right) - \frac{t}{2}\log\pi$$

The key property: **$Z(t) = 0$ if and only if $\zeta(\frac{1}{2} + it) = 0$**. Since $Z(t)$ is real, its zeros can be detected by sign changes, and every sign change corresponds to a zero *on* the critical line.

### The Riemann-Siegel Formula

For efficient computation, we use the **Riemann-Siegel formula**:

$$Z(t) = 2\sum_{n=1}^{N} \frac{\cos(\theta(t) - t\log n)}{\sqrt{n}} + R(t)$$

where $N = \lfloor\sqrt{t/(2\pi)}\rfloor$ and $R(t)$ is a correction term of order $O(t^{-1/4})$.

Each evaluation costs $O(\sqrt{t})$ operations — evaluating the first $10^7$ zeros requires grid points up to $t \approx 10^7$, with each evaluation summing $\sim 1200$ terms.

### The Riemann-von Mangoldt Formula

The number of zeros $N(T)$ with $0 < \text{Im}(\rho) < T$ satisfies:

$$N(T) = \frac{T}{2\pi}\log\frac{T}{2\pi e} + \frac{7}{8} + S(T)$$

where $|S(T)|$ is bounded (conditionally on RH, $S(T) = O(\log T / \log\log T)$). This lets us **validate** our zero count: if we find the right number of sign changes, we haven't missed any zeros.

### Previous Computational Work

| Year | Authors | Zeros verified |
|------|---------|---------------|
| 1903 | Gram | 15 |
| 1936 | Titchmarsh | 1,041 |
| 1968 | Rosser, Yohe, Schoenfeld | 3,500,000 |
| 1986 | van de Lune, te Riele, Winter | 1,500,000,001 |
| 2004 | Gourdon | $10^{13}$ |
| 2020 | Platt, Trudgian | Verified to height $3 \times 10^{12}$ |

Our goal is not to set a new record (Gourdon's $10^{13}$ used months of computation with carefully optimized code), but to demonstrate B200 GPU throughput and collect data on zero spacings.

## Hardware

| Component | Specification |
|-----------|--------------|
| Node | NVIDIA DGX B200 |
| GPUs | 8× NVIDIA B200 (183 GB VRAM each) |
| Total VRAM | 1.43 TB |
| GPU Interconnect | NVLink 5 (NV18), full mesh |
| CPUs | 2× Intel Xeon Platinum 8570 (56 cores each) |
| System RAM | 2 TB DDR5 |

## Method

### CUDA Kernel

Each CUDA thread evaluates $Z(t)$ at one grid point using the Riemann-Siegel formula. Adjacent threads compare signs to detect zero crossings.

Key implementation details:

1. **Theta function:** Stirling approximation with three correction terms, accurate to $O(t^{-5})$
2. **Main sum:** Direct summation of $N = \lfloor\sqrt{t/(2\pi)}\rfloor$ cosine terms
3. **Correction:** First-order Riemann-Siegel $C_0$ coefficient
4. **Grid density:** 20 points per unit $t$ (sufficient to resolve all zeros for moderate $t$)

### Parallelization

The computation is embarrassingly parallel — each grid point is independent. We distribute chunks of 10M grid points across 8 GPUs in round-robin fashion.

## Results

> **PENDING** — experiment not yet run.

### Zero Count

| Metric | Value |
|--------|-------|
| Zeros verified | **PENDING** |
| Expected (R-vM formula) | **PENDING** |
| Discrepancy | **PENDING** |
| Max $t$ reached | **PENDING** |
| Total time | **PENDING** |

### Zero Spacing Distribution

> **PENDING** — will analyze the distribution of normalized zero spacings $\delta_n = (\gamma_{n+1} - \gamma_n) \cdot \frac{\log(\gamma_n / 2\pi)}{2\pi}$ and compare with the GUE (Gaussian Unitary Ensemble) prediction from random matrix theory.

## Analysis

> **PENDING** — will analyze:
>
> 1. Does the zero count match the Riemann-von Mangoldt formula exactly?
> 2. Do the normalized spacings follow the GUE distribution (Montgomery's pair correlation conjecture)?
> 3. What is the throughput in zeros/second on B200 vs. historical CPU-based verifications?
> 4. Are there any "close calls" — zeros that nearly violate Gram's law?

## Reproducibility

```bash
git clone https://github.com/cahlen/idontknow
cd idontknow

# Compile
nvcc -O3 -arch=sm_100a -o riemann_zeros scripts/experiments/riemann-zeta/riemann_zeros.cu -lm

# Quick test: first 1000 zeros
./riemann_zeros 1000

# Full run: 10 million zeros
./scripts/experiments/riemann-zeta/run.sh 10000000
```

## Raw Data

- Zero locations: [`/data/riemann-zeros/zeros.csv`](/data/riemann-zeros/zeros.csv)
- Spacing distribution: [`/data/riemann-zeros/spacings.json`](/data/riemann-zeros/spacings.json)
- GPU logs: [`/data/riemann-zeros/gpu_logs/`](/data/riemann-zeros/gpu_logs/)

---

*Computed on NVIDIA DGX B200. Code: [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*
