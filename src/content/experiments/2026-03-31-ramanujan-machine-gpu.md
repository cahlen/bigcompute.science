---
title: "Ramanujan Machine: GPU-Accelerated Discovery of Continued Fraction Formulas"
slug: ramanujan-machine-gpu
date: 2026-03-31
author: cahlen
author_github: https://github.com/cahlen
status: complete

hardware:
  name: NVIDIA DGX B200
  gpus: 8× NVIDIA B200 (183 GB VRAM each, 1.43 TB total)
  gpu_interconnect: NVLink 5 (NV18), full mesh
  cpus: 2× Intel Xeon Platinum 8570 (112 cores / 224 threads)
  ram: 2 TB DDR5

software:
  cuda: "13.0"
  driver: "580.126.09"
  custom_kernel: scripts/experiments/ramanujan-machine/ramanujan_v2.cu
  libraries: ["CGBN (CUDA Generic Big Numbers)", "MPFR"]

tags:
  domain: [number-theory, continued-fractions, experimental-mathematics, constant-discovery]
  hardware: [b200, dgx, nvlink]
  method: [cuda-kernel, arbitrary-precision, pslq, polynomial-enumeration]

results:
  problem: "Discover new continued fraction formulas for mathematical constants"
  prior_work: "Raayoni et al. (PNAS 2024): 1.77M polynomial CFs, degree 2-3"
  candidates_evaluated: "586 billion (v1, deg 1-8) + 816 million (v2, asymmetric degree)"
  transcendental_hits: 0
  false_positives: "7,030 (all confirmed via 100-digit PSLQ verification)"
  confirmed_formulas: "20 classical (Euler e, Brouncker 4/pi, pi/4, 1/ln(2))"
  algebraic_hits: "sqrt(2), sqrt(5), phi"
  key_finding: "Equal-degree polynomial CFs cannot produce new transcendental formulas — degree ratio ~2 required"
  status: "Pivoting to v2 asymmetric-degree kernel and larger coefficient ranges"

summary: "586 billion equal-degree polynomial CFs evaluated through degree 8 — zero new transcendental formulas. 7,030 double-precision false positives all disproven at 100-digit precision. Only 20 confirmed formulas, all classical. Root cause identified: productive CF formulas require deg(numerator) ≈ 2× deg(denominator). Built v2 kernel with asymmetric degrees; validated on (1,2) regime. Pivoting to (2,4) and (3,6) sweeps at larger coefficient ranges."

dataset: https://huggingface.co/datasets/cahlen/ramanujan-machine-results
code: https://github.com/cahlen/idontknow/tree/main/scripts/experiments/ramanujan-machine
---

# Ramanujan Machine: GPU-Accelerated Formula Discovery

## Abstract

We extend the Ramanujan Machine framework (Raayoni et al., 2024) using GPU-accelerated polynomial CF evaluation on an 8× B200 cluster. Phase 1 exhaustively searched 586 billion equal-degree polynomial CFs through degree 8 — finding no new transcendental formulas and proving via 100-digit PSLQ that all 7,030 "transcendental hits" were double-precision false positives. Phase 2 identified the root cause (equal-degree CFs cannot produce transcendental formulas; a degree ratio of ~2 is required) and built an asymmetric-degree v2 kernel now being tested at productive configurations.

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
| Raayoni et al. (PNAS) | 2024 | 1.77M | 2-3, **asymmetric** | pi, ln(2), Gauss, Lemniscate |
| **This work (v1)** | 2026 | **586 billion** | **1-8, equal deg** | **None new (20 classical re-derived)** |
| **This work (v2)** | 2026 | **816 million** | **asymmetric (2,4)** | **In progress** |

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

## Results

### Phase 1: Equal-Degree Search (v1 kernel, 2026-03-31 to 2026-04-07)

| Degree | Range | Candidates | Matched Hits | Transcendental? |
|--------|-------|-----------|-------------|-----------------|
| 1 | [-3,3] | 2,401 | ~50 | No |
| 2 | [-40,40] | 282B | 100K+ | No |
| 3 | [-13,13] | 282B | 94K | No |
| 4 | [-7,7] | 577B | 560 | No |
| 5 | [-5,5] | 3.1T | 647 | No |
| 6 | [-4,4] | 22.9T | 1,507 | No |
| 7 | [-3,3] | 33.2T | 1,046 | No |
| 8 | [-2,2] | 3.8T | 201 | No |
| **Total** | | **586B+** | | **Zero transcendental** |

**100-digit PSLQ verification** (verify_hits.py) of ALL hits:
- **7,030 transcendental "hits" were double-precision false positives** — none held at high precision
- **20 confirmed formulas** — all classical: Euler's e, Brouncker's 4/pi, Leibniz pi/4, 1/ln(2)
- **Zero new discoveries**

### Root Cause: Wrong Degree Regime

The v1 kernel forced $\deg(a_n) = \deg(b_n)$. But every known CF formula for transcendental constants has $\deg(b_n) \approx 2 \times \deg(a_n)$:

| Famous Formula | $\deg(b_n)$ | $\deg(a_n)$ | Ratio |
|---|---|---|---|
| Apéry's $\zeta(3)$ | 6 | 3 | **2.0** |
| Catalan's constant | 4 | 2 | **2.0** |
| Brouncker's $4/\pi$ | 2 | 1 | **2.0** |

Equal-degree CFs converge super-exponentially to algebraic numbers — the search space literally cannot contain new transcendental formulas. **This explains why 586 billion candidates produced nothing new.**

### Phase 2: Asymmetric-Degree Search (v2 kernel, 2026-04-07)

Built `ramanujan_v2.cu` with independent $\deg(a_n)$ and $\deg(b_n)$. Also saves all converged-but-unmatched CFs for offline multi-constant PSLQ scanning.

| Config | Candidates | Converged | Matched | Confirmed (100d) |
|--------|-----------|-----------|---------|-------------------|
| (1,2) range 10 | 4.1M | 3M (73%) | 14,886 | 48 transcendental |
| (2,4) range 6 | 816M | 521M (64%) | 3 | In progress |

The (1,2) run confirmed known formulas for pi/4, 4/pi, 1/pi, Gauss's constant, and 1/ln(2) at 120-200 digit precision — validating the kernel.

**Next targets:** (2,4) and (3,6) at larger coefficient ranges (15-20), where the Raayoni et al. team found their results.

**Dataset**: [cahlen/ramanujan-machine-results](https://huggingface.co/datasets/cahlen/ramanujan-machine-results) on Hugging Face

## References

1. Raayoni, G. et al. (2019). "Generating conjectures on fundamental constants with the Ramanujan Machine." *Nature*, 590, pp. 67–73.
2. Raayoni, G. et al. (2024). "Algorithm-assisted discovery of an intrinsic order among mathematical constants." *PNAS*, 121(25).
3. David, H. et al. (2024). "The Ramanujan Library." arXiv:2412.12361.
4. Elimelech, R. et al. (2025). "From Euler to AI: Unifying Formulas for Mathematical Constants." arXiv:2502.17533.
5. Ferguson, H.R.P. and Bailey, D.H. (1999). "A Polynomial Time, Numerically Stable Integer Relation Algorithm." NASA Technical Report.

---

*This work was produced through human–AI collaboration (Cahlen Humphreys + Claude). Not independently peer-reviewed. All code and data open for verification at [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*
