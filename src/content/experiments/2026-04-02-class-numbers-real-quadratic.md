---
title: "Class Numbers of Real Quadratic Fields: Extending Tables to 10^13 on 8× B200"
slug: class-numbers-real-quadratic
date: 2026-04-02
author: cahlen
author_github: https://github.com/cahlen
status: planned

hardware:
  name: NVIDIA DGX B200
  gpus: 8× NVIDIA B200 (183 GB VRAM each, 1.43 TB total)
  gpu_interconnect: NVLink 5 (NV18), full mesh
  cpus: 2× Intel Xeon Platinum 8570 (112 cores / 224 threads)
  ram: 2 TB DDR5

software:
  cuda: "13.0"
  driver: "580.126.09"
  custom_kernel: scripts/experiments/class-numbers/class_number_rqf.cu

tags:
  domain: [algebraic-number-theory, class-groups, cohen-lenstra-heuristics]
  hardware: [b200, dgx, nvlink]
  method: [cuda-kernel, bsgs, continued-fractions, l-functions]

results:
  problem: "Class number distribution for real quadratic fields"
  current_frontier: "d up to ~10^11 (Jacobson et al.)"
  target: "d up to 10^13 (100× extension)"
  status: "NOT YET RUN"

code: https://github.com/cahlen/idontknow
data: /data/class-numbers/
---

# Class Numbers of Real Quadratic Fields: Extending Tables to $10^{13}$

## Abstract

We compute class numbers $h(d)$ of real quadratic fields $\mathbb{Q}(\sqrt{d})$ for all fundamental discriminants $d$ from $10^{11}$ to $10^{13}$ — a 100× extension of existing systematic tables. Each discriminant is handled by an independent CUDA thread using the analytic class number formula combined with continued-fraction computation of the regulator. The resulting dataset tests the Cohen-Lenstra heuristics at unprecedented scale, specifically the prediction that $h(d) = 1$ occurs with probability $\approx 75.446\%$ for real quadratic fields.

## Background

### Class Numbers

The **class number** $h(K)$ of a number field $K$ measures the failure of unique factorization in its ring of integers. For the real quadratic field $\mathbb{Q}(\sqrt{d})$:

- $h(d) = 1$ means the ring $\mathbb{Z}[\frac{1+\sqrt{d}}{2}]$ (or $\mathbb{Z}[\sqrt{d}]$) has unique factorization
- $h(d) > 1$ means unique factorization fails, and the class group has non-trivial structure

### The Analytic Class Number Formula

For a fundamental discriminant $d > 0$:

$$h(d) \cdot R(d) = \frac{\sqrt{d}}{2} \cdot L(1, \chi_d)$$

where:
- $R(d) = \log \varepsilon_d$ is the **regulator** (logarithm of the fundamental unit)
- $L(1, \chi_d) = \sum_{n=1}^{\infty} \frac{\chi_d(n)}{n}$ is the Dirichlet $L$-function
- $\chi_d(n) = \left(\frac{d}{n}\right)$ is the Kronecker symbol

The regulator is computed from the continued fraction expansion of $\sqrt{d}$: the period of the CF gives the fundamental unit $\varepsilon_d$, and $R(d) = \log \varepsilon_d$.

### The Cohen-Lenstra Heuristics

**Cohen and Lenstra (1984)** proposed a remarkable probabilistic model for class groups. For real quadratic fields, they predict:

$$\text{Prob}(h(d) = 1) = \prod_{p \text{ prime}} \left(1 - \frac{1}{p}\right)\left(1 - \frac{1}{p^2}\right) \approx 0.75446$$

More generally, they predict the distribution of the odd part of the class group: an abelian group $G$ occurs with probability proportional to $1/|\text{Aut}(G)|$.

These heuristics have been tested computationally up to $d \sim 10^{11}$ and agree beautifully, but more data at larger discriminants is needed to:
1. Test whether the convergence continues
2. Look for deviations that might reveal deeper structure
3. Understand the distribution of *large* class numbers

### Current Frontier

| Authors | Year | Range | Key Result |
|---------|------|-------|------------|
| Jacobson, Ramachandran, Williams | 2006-2015 | $d \leq 10^{11}$ | Systematic class numbers via BSGS |
| Watkins | 2004 | Imaginary quadratic, $d \leq 10^{10}$ | Complete tables |
| Belabas, Cohen | Various | Cubic fields, $d \leq 10^7$ | Limited by algorithm complexity |

**No systematic GPU-accelerated computation exists.** The BSGS algorithm is embarrassingly parallel — each discriminant is independent — making it ideal for GPU acceleration.

## Hardware

| Component | Specification |
|-----------|--------------|
| Node | NVIDIA DGX B200 |
| GPUs | 8× NVIDIA B200 (183 GB VRAM each) |
| Total VRAM | 1.43 TB |
| GPU Interconnect | NVLink 5 (NV18), full mesh |
| CPUs | 2× Intel Xeon Platinum 8570 |
| System RAM | 2 TB DDR5 |

## Method

### Per-Discriminant Computation

Each CUDA thread handles one discriminant $d$:

1. **Check fundamentality:** Verify $d$ is a fundamental discriminant (squarefree conditions on $d \bmod 4$)
2. **Compute regulator:** Run the continued fraction expansion of $\sqrt{d}$ until the period is found, extract the fundamental unit $\varepsilon_d$, compute $R(d) = \log \varepsilon_d$
3. **Approximate $L(1, \chi_d)$:** Sum the Dirichlet series $\sum_{n \leq N} \chi_d(n)/n$ with $N = O(\sqrt{d})$ terms
4. **Extract $h(d)$:** Round $\frac{\sqrt{d} \cdot L(1,\chi_d)}{2 R(d)}$ to the nearest integer

### Kronecker Symbol

The Kronecker symbol $\left(\frac{d}{n}\right)$ is computed via quadratic reciprocity (Jacobi symbol algorithm) in $O(\log n)$ steps — fast enough for the per-thread L-function summation.

### Parallelization

8 GPUs, each handling a contiguous range of discriminants from $10^{11}$ to $10^{13}$.

## Results

> **PENDING** — experiment not yet run.

### Class Number Distribution

| $h$ | Count | Fraction | Cohen-Lenstra prediction |
|-----|-------|----------|------------------------|
| 1 | **PENDING** | **PENDING** | $\approx 75.446\%$ |
| 2 | **PENDING** | **PENDING** | **PENDING** |
| 3 | **PENDING** | **PENDING** | **PENDING** |
| 4 | **PENDING** | **PENDING** | **PENDING** |
| $\geq 5$ | **PENDING** | **PENDING** | **PENDING** |

### Convergence of Cohen-Lenstra

| Range | Observed $h=1$ fraction | C-L prediction | Ratio |
|-------|------------------------|----------------|-------|
| $d \leq 10^{11}$ | ~75.4% (known) | 75.446% | ~1.000 |
| $10^{11} < d \leq 10^{12}$ | **PENDING** | 75.446% | **PENDING** |
| $10^{12} < d \leq 10^{13}$ | **PENDING** | 75.446% | **PENDING** |

## Reproducibility

```bash
git clone https://github.com/cahlen/idontknow
cd idontknow
nvcc -O3 -arch=sm_100a -o class_number_rqf scripts/experiments/class-numbers/class_number_rqf.cu -lm

# Quick test: d = 5 to 10000
./class_number_rqf 5 10000

# Full run: extend to 10^13
./scripts/experiments/class-numbers/run.sh
```

---

*Computed on NVIDIA DGX B200. Code: [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*
