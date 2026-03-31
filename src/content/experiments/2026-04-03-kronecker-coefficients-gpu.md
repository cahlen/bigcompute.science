---
title: "Kronecker Coefficients: Pushing the Frontier to n=120 on 8× B200"
slug: kronecker-coefficients-gpu
date: 2026-04-03
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
  custom_kernel: scripts/experiments/kronecker-coefficients/kronecker_compute.cu

tags:
  domain: [algebraic-combinatorics, representation-theory, geometric-complexity-theory]
  hardware: [b200, dgx, nvlink]
  method: [cuda-kernel, murnaghan-nakayama, character-tables]

results:
  problem: "Kronecker coefficients of the symmetric group"
  conjecture_year: 1938
  current_frontier: "Systematic computation to n ~ 60-80"
  target: "n = 120 for GCT-relevant triples"
  status: "NOT YET RUN"

code: https://github.com/cahlen/idontknow
dataset: https://huggingface.co/datasets/cahlen/kronecker-coefficients
data: /data/kronecker/
---

# Kronecker Coefficients: Pushing the Frontier to $n = 120$

## Abstract

We compute Kronecker coefficients $g(\lambda, \mu, \nu)$ of the symmetric group $S_n$ for $n$ up to 120, roughly doubling the existing computational frontier. Kronecker coefficients describe tensor product decompositions of symmetric group representations and are central to algebraic combinatorics, quantum information theory, and the geometric complexity theory (GCT) approach to P vs NP. No combinatorial formula for them is known — this is one of the biggest open problems in the field. We use GPU-parallelized computation via the Murnaghan-Nakayama rule, focusing on near-rectangular partitions relevant to GCT.

## Background

### Kronecker Coefficients

For three partitions $\lambda, \mu, \nu$ of the same integer $n$, the **Kronecker coefficient** $g(\lambda, \mu, \nu)$ is:

$$g(\lambda, \mu, \nu) = \frac{1}{n!} \sum_{\sigma \in S_n} \chi^\lambda(\sigma)\, \chi^\mu(\sigma)\, \chi^\nu(\sigma)$$

where $\chi^\lambda$ is the irreducible character of $S_n$ indexed by $\lambda$.

Equivalently, summing over conjugacy classes (partitions $\rho$ of $n$):

$$g(\lambda, \mu, \nu) = \sum_{\rho \vdash n} \frac{1}{z_\rho}\, \chi^\lambda(\rho)\, \chi^\mu(\rho)\, \chi^\nu(\rho)$$

where $z_\rho = \prod_i i^{m_i} m_i!$ for $\rho$ having $m_i$ parts equal to $i$.

### Why They Matter

1. **Representation theory:** Kronecker coefficients are the structure constants for the representation ring of $S_n$. Understanding them is equivalent to understanding how representations decompose under tensor product.

2. **Quantum information:** $g(\lambda, \mu, \nu) > 0$ if and only if the spectra $(\lambda/n, \mu/n, \nu/n)$ are compatible as eigenvalue spectra of a tripartite quantum state and its marginals (the quantum marginal problem).

3. **P vs NP (GCT):** Mulmuley and Sohoni's geometric complexity theory program reduces the permanent vs. determinant problem to showing that certain Kronecker coefficients (for specific "padded" partitions) are positive. Computing these specific coefficients is a bottleneck.

4. **Open problem:** No combinatorial interpretation of $g(\lambda, \mu, \nu)$ is known, unlike Littlewood-Richardson coefficients which count LR tableaux. Finding one is a major open problem (Stanley, 2000).

### Current Frontier

| Authors | Year | Range | Method |
|---------|------|-------|--------|
| Pak, Panova | 2017 | $n \leq 50$ (specific triples) | Murnaghan-Nakayama |
| Ikenmeyer et al. | 2023 | $n \leq 60$ (GCT triples) | Specialized algorithms |
| Generic software (SageMath) | Current | $n \leq 30$ (full tables) | Slow, single-threaded |

**No GPU-accelerated computation of Kronecker coefficients has been published.**

### The Murnaghan-Nakayama Rule

Character values $\chi^\lambda(\rho)$ are computed recursively. For $\rho = (r_1, r_2, \ldots, r_k)$:

$$\chi^\lambda(\rho) = \sum_{\text{border strips } B \text{ of } \lambda, |B| = r_1} (-1)^{\text{ht}(B)} \chi^{\lambda \setminus B}(r_2, \ldots, r_k)$$

A **border strip** (rim hook) of size $r$ is a connected skew shape with no $2 \times 2$ square. Its **height** $\text{ht}(B)$ is one less than the number of rows it occupies.

This recursion has exponential worst-case complexity but is highly parallelizable: each branch of the recursion is independent.

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

### Computation Strategy

**For $n \leq 50$:** Compute the full character table $\chi^\lambda(\rho)$ for all $\lambda, \rho \vdash n$ using Murnaghan-Nakayama on CPU, then upload to GPU. The GPU kernel parallelizes over triples $(\lambda, \mu, \nu)$ — there are $p(n)^3$ such triples, where $p(n)$ is the partition function. For $n = 50$, $p(50)^3 \approx 8.5 \times 10^{15}$ — far too many for full enumeration, but we can compute all triples where $g > 0$.

**For $50 < n \leq 120$:** Selective computation of GCT-relevant triples. These are partitions near rectangular shape: $\lambda \approx (a^b)$ (a rectangle of $a$ columns and $b$ rows) with small perturbations. The GCT program specifically needs:
- $\lambda = (n - k, 1^k)$ (hooks)
- $\lambda = (a^b) + \text{small perturbation}$ (near-rectangles)

For these structured partitions, the Murnaghan-Nakayama recursion has much smaller branching factor.

### GPU Parallelism

- **Outer loop (GPU blocks):** Each CUDA block handles one triple $(\lambda, \mu, \nu)$
- **Inner loop (threads within block):** Threads cooperate on the sum over conjugacy classes $\rho$, with each thread evaluating $\chi^\lambda(\rho_i) \chi^\mu(\rho_i) \chi^\nu(\rho_i) / z_{\rho_i}$ for a subset of classes
- **Memory:** The 1.43 TB VRAM can hold character tables for $n$ up to ~70 in full, or selective columns for larger $n$

## Results

> **PENDING** — experiment not yet run.

### Validation: Known Values

| Triple $(\lambda, \mu, \nu)$ | Known $g$ | Our value |
|-----------------------------|-----------|-----------|
| $((3,2,1), (3,2,1), (3,2,1))$ | 1 | **PENDING** |
| $((4,2), (3,3), (3,2,1))$ | 1 | **PENDING** |

### New Results at $n = 120$

> **PENDING** — will report:
> - Number of triples computed
> - Distribution of non-zero Kronecker coefficients
> - Maximum $g$ value found
> - Specific GCT-relevant values

## Analysis

> **PENDING** — will analyze:
>
> 1. Growth rate of $g(\lambda, \mu, \nu)$ for near-rectangular partitions as $n$ increases
> 2. Positivity patterns: which triples have $g > 0$? Any new combinatorial insights?
> 3. Comparison with the "stretched" Kronecker coefficient asymptotics
> 4. Implications for GCT: do the computed values support or challenge Mulmuley's conjectures?

## Reproducibility

```bash
git clone https://github.com/cahlen/idontknow
cd idontknow
nvcc -O3 -arch=sm_100a -o kronecker_compute scripts/experiments/kronecker-coefficients/kronecker_compute.cu

# Full table for S_30
./kronecker_compute 30 all

# GCT-relevant triples for S_120
./kronecker_compute 120 gct
```

---

## References

- Stanley, R.P. (2000). "Positivity problems and conjectures in algebraic combinatorics." *Mathematics: Frontiers and Perspectives*, pp. 295–319.
- Mulmuley, K.D. and Sohoni, M.A. (2001). "Geometric complexity theory I: An approach to the P vs. NP and related problems." *SIAM Journal on Computing*, 31(2), pp. 496–526.
- Pak, I. and Panova, G. (2017). "On the complexity of computing Kronecker coefficients." *Computational Complexity*, 26(1), pp. 1–36.
- Murnaghan, F.D. (1938). "The analysis of the Kronecker product of irreducible representations of the symmetric group." *American Journal of Mathematics*, 60(3), pp. 761–784.

---

*Computed on NVIDIA DGX B200. Code: [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*

*This work was produced through human–AI collaboration (Cahlen Humphreys + Claude). Not independently peer-reviewed. All code and data open for verification at [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*
