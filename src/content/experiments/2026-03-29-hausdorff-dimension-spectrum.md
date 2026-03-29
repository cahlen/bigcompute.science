---
title: "Hausdorff Dimension Spectrum: All Subsets of {1,...,20}"
slug: hausdorff-dimension-spectrum
date: 2026-03-29
author: cahlen
author_github: https://github.com/cahlen
status: complete

hardware:
  name: NVIDIA GeForce RTX 5090
  gpus: 1x RTX 5090 (32 GB VRAM)
  gpu_interconnect: N/A (single GPU)
  cpus: Intel Core Ultra 9 285K (24 cores)
  ram: 188 GB DDR5

software:
  cuda: "13.0"
  method: Chebyshev collocation (N=40) + power iteration + bisection (55 steps)
  custom_kernel: scripts/experiments/hausdorff-spectrum/hausdorff_spectrum.cu

tags:
  domain: [continued-fractions, fractal-geometry, spectral-theory, diophantine-approximation]
  hardware: [rtx-5090]
  method: [transfer-operator, chebyshev-collocation, eigenvalue-computation, hausdorff-dimension]

results:
  total_subsets: 1048575
  max_digit: 20
  chebyshev_order: 40
  bisection_steps: 55
  precision_digits: 15
  status: "COMPLETE — 1,048,575 subsets computed in 4,322s on RTX 5090"
  scaling_n20: "1,048,575 subsets in 4,322s"
  validation_e12: "0.531280506277205 (exact match to Jenkinson-Pollicott)"
  validation_e12345: "0.836829443681209 (diff 6.66e-16 from Zaremba transfer operator)"
  validation_monotonicity: "PASS"
  scaling_n5: "31 subsets in 1.8s"
  scaling_n10: "1,023 subsets in 3.8s"
  scaling_n15: "32,767 subsets in 126.1s"

code: https://github.com/cahlen/idontknow
data: /data/hausdorff-spectrum/
---

# Hausdorff Dimension Spectrum: All Subsets of {1,...,20}

## Abstract

We compute the Hausdorff dimension $\dim_H(E_A)$ for every non-empty subset $A \subseteq \{1,\ldots,20\}$ — a total of $2^{20} - 1 = 1{,}048{,}575$ subsets. This is the first complete mapping of the "dimension spectrum" of continued fraction Cantor sets, producing a structured dataset that does not exist anywhere in the literature.

## Background

For a non-empty set $A$ of positive integers, define:

$$E_A = \{ \alpha \in (0,1) : \text{every partial quotient of } \alpha \text{'s continued fraction is in } A \}$$

$E_A$ is a Cantor-like fractal subset of $[0,1]$. Its Hausdorff dimension $\dim_H(E_A)$ measures the "size" of the set of real numbers whose continued fraction digits are restricted to $A$.

Individual values have been computed in the literature — notably $\dim_H(E_{\{1,2\}}) \approx 0.5313$ by Jenkinson and Pollicott (2001, refined to 100+ digits in 2016) and $\dim_H(E_{\{1,\ldots,5\}}) \approx 0.8368$ in our [Zaremba transfer operator experiment](/experiments/zaremba-transfer-operator/). But the full combinatorial landscape — how dimension depends on which digits are allowed — has never been mapped.

## Method

The transfer operator for digit set $A$ at parameter $s > 0$ is:

$$(\mathcal{L}_s f)(x) = \sum_{a \in A} (a+x)^{-2s} \, f\!\left(\frac{1}{a+x}\right)$$

$\dim_H(E_A) = \delta$ where the leading eigenvalue $\lambda_0(\delta) = 1$.

For each of the $2^n - 1$ non-empty subsets:

1. **Discretize** the operator on $N = 40$ Chebyshev nodes via barycentric interpolation
2. **Bisect** over $s \in (0, 1)$ with 55 steps (precision $\sim 10^{-16}$)
3. At each step, find the leading eigenvalue via **power iteration** (300 steps)

Each subset is encoded as a bitmask and processed independently on one GPU thread. Subsets are batched 1024 at a time.

## Scaling

| $n$ | Subsets | Time | Rate |
|---|---|---|---|
| 5 | 31 | 1.8s | 17/s |
| 10 | 1,023 | 3.8s | 269/s |
| 15 | 32,767 | 126.1s | 260/s |
| 20 | 1,048,575 | ~67 min (est.) | ~260/s |

## Preliminary Results (n=15)

### Dimension by Cardinality

| $|A|$ | Count | Min $\dim_H$ | Mean $\dim_H$ | Max $\dim_H$ |
|---|---|---|---|---|
| 1 | 15 | 0.000 | 0.000 | 0.000 |
| 2 | 105 | 0.129 | 0.205 | 0.531 |
| 3 | 455 | 0.208 | 0.328 | 0.706 |
| 5 | 3,003 | 0.314 | 0.497 | 0.837 |
| 10 | 3,003 | 0.505 | 0.766 | 0.926 |
| 15 | 1 | 0.953 | 0.953 | 0.953 |

Key observations:
- **Singletons all have dimension 0** — $E_{\{a\}}$ is a single point for any digit $a$
- **Dimension grows with cardinality** — more allowed digits means a larger Cantor set
- **Low digits dominate** — $E_{\{1,2\}}$ (dim 0.531) is much larger than $E_{\{9,10\}}$ (dim 0.153)
- **$\dim_H(E_{\{1,\ldots,n\}}) \to 1$** as $n \to \infty$ — consistent with $E_{\{1,2,3,\ldots\}} = (0,1) \setminus \mathbb{Q}$

### Validation

| Known value | Computed | Expected | Diff |
|---|---|---|---|
| $\dim_H(E_{\{1,2\}})$ | 0.531280506277205 | 0.531280506277205 | $0$ |
| $\dim_H(E_{\{1,\ldots,5\}})$ | 0.836829443681209 | 0.836829443681208 | $6.66 \times 10^{-16}$ |
| $\dim_H(E_{\{1\}})$ | 0.000000000000000 | 0 | $0$ |
| Monotonicity | PASS | — | — |

## Reproduction

```bash
git clone https://github.com/cahlen/idontknow.git
cd idontknow
nvcc -O3 -arch=sm_120 -o hausdorff_spectrum \
    scripts/experiments/hausdorff-spectrum/hausdorff_spectrum.cu -lm
mkdir -p scripts/experiments/hausdorff-spectrum/results
./hausdorff_spectrum 20 40
```

Requires: CUDA 13.0+, GPU with compute capability 12.0 (RTX 5090) or adjust `-arch` flag. For older GPUs, `sm_89` (RTX 4090) or `sm_100a` (B200) should work — the kernel uses no architecture-specific features.

## Why This Matters for AI

- **Zero existing training data:** No AI model has been trained on dimension spectra of continued fraction Cantor sets. Models asked about $\dim_H(E_A)$ for non-trivial $A$ will hallucinate.
- **Operator spectral theory:** The transfer operator $\mathcal{L}_s$ is mathematically identical to kernel operators in Gaussian processes and neural tangent kernels. Understanding how its spectrum depends on the digit set teaches AI about function approximation.
- **Structured combinatorial data:** 1M+ data points mapping subset → dimension, with clear monotonicity and growth patterns. Ideal for training AI on fractal geometry and Diophantine approximation.
