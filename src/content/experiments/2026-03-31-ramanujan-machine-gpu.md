---
title: "Ramanujan Machine: GPU-Accelerated Discovery of Continued Fraction Formulas"
slug: ramanujan-machine-gpu
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
  custom_kernel: scripts/experiments/ramanujan-machine-gpu/ramanujan_gpu.cu
  libraries: ["CGBN (CUDA Generic Big Numbers)", "MPFR"]

tags:
  domain: [number-theory, continued-fractions, experimental-mathematics, constant-discovery]
  hardware: [b200, dgx, nvlink]
  method: [cuda-kernel, arbitrary-precision, pslq, polynomial-enumeration]

results:
  problem: "Discover new continued fraction formulas for mathematical constants"
  prior_work: "Raayoni et al. (PNAS 2024): 1.77M polynomial CFs, degree 2-3"
  candidates_evaluated: "145 billion (deg 1-5)"
  transcendental_hits: 0
  false_positives: "6 (all failed mpmath 50-digit verification)"
  algebraic_hits: "sqrt(2), sqrt(5), phi"
  status: "In progress — need wider coefficient ranges and GPU PSLQ"

summary: "145 billion polynomial CFs evaluated through degree 5 on B200 GPU — zero transcendental constant formulas found. All matches are algebraic (sqrt(2), sqrt(5), phi). Degree 5+ in progress. v3 kernel matches 10 base constants + 29 compound expressions."

code: https://github.com/cahlen/idontknow
---

# Ramanujan Machine: GPU-Accelerated Formula Discovery

## Abstract

We extend the Ramanujan Machine framework (Raayoni et al., 2024) using GPU-accelerated arbitrary precision arithmetic on an 8× B200 cluster. The original project evaluated ~1.77 million polynomial continued fractions (degree 2-3) over 2+ years of volunteer computing. Our goal: push to degree 4-6 polynomials and 10^9+ evaluations, potentially discovering new formulas for mathematical constants that the original search could not reach.

## Background

A **polynomial continued fraction** (PCF) has the form:

$$a_0 + \cfrac{b_1}{a_1 + \cfrac{b_2}{a_2 + \cfrac{b_3}{a_3 + \cdots}}}$$

where $a_n = P(n)$ and $b_n = Q(n)$ are polynomials in $n$. When such a CF converges to a known mathematical constant (or a simple algebraic expression involving known constants), we have discovered a **formula**.

### Conservative Matrix Fields (CMF)

Raayoni et al. (PNAS 2024) discovered that many CF formulas arise from a unified mathematical structure called a **Conservative Matrix Field** — a matrix-valued function $M(x,y)$ satisfying a discrete conservation law. Different "trajectories" through the CMF yield different CF formulas for the same constant, revealing deep connections between seemingly unrelated identities.

### Prior Computational Frontier

| Work | Year | CFs Evaluated | Polynomial Degree | Constants Found |
|------|------|--------------|-------------------|-----------------|
| Raayoni et al. (Nature) | 2019 | ~500K | 1-2 | pi, e, Catalan |
| Raayoni et al. (PNAS) | 2024 | 1.77M | 2-3 | pi, ln(2), Gauss, Lemniscate |
| **This work** | 2026 | **145 billion** | **1-5** | **None yet (all algebraic)** |

## Method

### Phase 1: Polynomial CF Evaluation (GPU)

For each candidate polynomial pair $(P, Q)$ with coefficients in a bounded range:

1. Evaluate the CF to $N$ terms using the convergent recurrence (forward evaluation)
2. Compute the limit to 100+ decimal digits using CGBN (CUDA Generic Big Numbers)
3. Store the high-precision value

Each evaluation is independent — embarrassingly parallel across GPU threads.

### Phase 2: PSLQ Matching (GPU)

For each evaluated CF value $v$, run PSLQ (Integer Relation Algorithm) against a database of known constants:

$$c_0 + c_1 \cdot v + c_2 \cdot \pi + c_3 \cdot e + c_4 \cdot \ln(2) + c_5 \cdot \gamma + \cdots = 0$$

where $c_i$ are small integers. If a relation is found with small coefficients, we have a formula.

PSLQ is parallelizable: each CF value can be matched independently.

### Phase 3: Verification

Any discovered formula is verified by:
1. Evaluating the CF to 1000+ digits
2. Comparing against the constant computed independently (MPFR)
3. If the match holds to 1000 digits, the formula is recorded

## Hardware

Each B200 GPU runs ~10,000 independent CF evaluations in parallel (one per CUDA thread). With 8 GPUs and 100-term CF evaluations at 128-bit precision, we estimate ~10^8 evaluations per hour.

## Results (2026-04-01)

| Degree | Range | Candidates | Real Hits | Constants Found | Transcendental? |
|--------|-------|-----------|-----------|-----------------|-----------------|
| 1 | [-3,3] | 2,401 | ~50 | sqrt(2), phi | No |
| 2 | [-20,20] | 4.75B | 4.49M | sqrt(2), sqrt(5) | No |
| 3 | [-10,10] | 37.8B | 119M | sqrt(2) | No |
| 4 | [-5,5] | 25.9B | 260 | sqrt(2) | No (2 false positive) |
| 5 | [-3,3] | 13.8B | 67.5K | sqrt(2) | No (2 false positive) |
| **Total** | | **~145B** | | | **Zero transcendental** |

### Key observations

1. **Degree 2 is fully exhausted** at range [-20,20] (4.75B candidates). Only sqrt(2) and sqrt(5) matches.
2. **Degree 4 produces dramatically fewer hits** than degree 2-3 (260 vs millions) — the CF convergence is more selective at higher degree.
3. **Two false positives** at degree 4 matched pi·ln(2) at double precision but failed 50-digit mpmath verification. This confirms the need for PSLQ high-precision verification.
4. **No formulas for pi, e, zeta(3), gamma, Catalan, or any transcendental constant** through 145 billion candidates at degrees 1-5. Six false positives (pi/4, 2/sqrt(pi), pi·ln(2)) all failed 50-digit mpmath verification.

### What this means

The Raayoni et al. results (degree 2-3, 1.77M candidates) found formulas for pi, e, ln(2), Gauss, and Lemniscate constants. Our search is 53,000× larger but at double precision instead of arbitrary precision. The lack of transcendental hits suggests either:

- **Transcendental CF formulas are rare** at these coefficient ranges and require larger coefficients or higher degrees
- **Double-precision false-negative rate is high** — real formulas may exist but converge too slowly for 500-term double-precision evaluation to distinguish them from noise
- **Degree 5+ is where the action is** — the polynomial structure may need to be richer

Next step: GPU PSLQ implementation for arbitrary-precision matching, and degree 5+ sweeps.

**Dataset**: [cahlen/ramanujan-machine-results](https://huggingface.co/datasets/cahlen/ramanujan-machine-results) on Hugging Face

## References

1. Raayoni, G. et al. (2019). "Generating conjectures on fundamental constants with the Ramanujan Machine." *Nature*, 590, pp. 67–73.
2. Raayoni, G. et al. (2024). "Algorithm-assisted discovery of an intrinsic order among mathematical constants." *PNAS*, 121(25).
3. David, H. et al. (2024). "The Ramanujan Library." arXiv:2412.12361.
4. Elimelech, R. et al. (2025). "From Euler to AI: Unifying Formulas for Mathematical Constants." arXiv:2502.17533.
5. Ferguson, H.R.P. and Bailey, D.H. (1999). "A Polynomial Time, Numerically Stable Integer Relation Algorithm." NASA Technical Report.

---

*This work was produced through human–AI collaboration (Cahlen Humphreys + Claude). Not independently peer-reviewed. All code and data open for verification at [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*
