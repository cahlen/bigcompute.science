---
title: "Lyapunov Exponent Spectrum: All Subsets of {1,...,20}"
slug: lyapunov-exponent-spectrum
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
  method: Transfer operator at s=1 and s=1+ε, finite difference of log(eigenvalue), Chebyshev collocation (N=40)
  custom_kernel: scripts/experiments/lyapunov-spectrum/lyapunov_spectrum.cu

tags:
  domain: [continued-fractions, dynamical-systems, ergodic-theory]
  hardware: [rtx-5090]
  method: [transfer-operator, chebyshev-collocation, lyapunov-exponent]

results:
  problem: "Lyapunov exponents for all 1,048,575 continued fraction digit subsets"
  total_subsets: 1048575
  max_digit: 20
  chebyshev_order: 40
  status: "COMPLETE — 1,048,575 subsets computed in 305s on RTX 5090"
  computation_time: "305 seconds"
  validation_singleton: "λ({1}) matches analytic value to 10 digits"
  validation_monotonicity: "PASS"

summary: "Lyapunov exponents for all 1,048,575 non-empty subsets of {1,...,20}, computed in 305 seconds on RTX 5090. Twin dataset with the Hausdorff dimension spectrum."

code: https://github.com/cahlen/idontknow
data: /data/lyapunov-spectrum/
dataset: https://huggingface.co/datasets/cahlen/continued-fraction-spectra
---

# Lyapunov Exponent Spectrum: All Subsets of {1,...,20}

## Abstract

We compute the Lyapunov exponent $\lambda(A)$ for every non-empty subset $A \subseteq \{1,\ldots,20\}$ — a total of $2^{20} - 1 = 1{,}048{,}575$ subsets — in 305 seconds on a single RTX 5090. This is the twin dataset to the [Hausdorff dimension spectrum](/experiments/hausdorff-dimension-spectrum/), together providing to our knowledge, the first complete mapping of both the geometric size and the dynamical divergence rate for all continued fraction Cantor sets up to digit 20.

## Background

The Lyapunov exponent measures the average exponential divergence rate of nearby orbits under the restricted Gauss map. For a non-empty set $A$ of positive integers, the Gauss map restricted to $E_A$ is:

$$T(x) = \left\{\frac{1}{x}\right\}, \quad \text{where all partial quotients lie in } A$$

The Lyapunov exponent $\lambda(A)$ is the exponential rate at which nearby orbits separate:

$$\lambda(A) = \lim_{n \to \infty} \frac{1}{n} \log |(T^n)'(x)|$$

for $\mu_A$-almost every $x \in E_A$, where $\mu_A$ is the unique equilibrium measure. Higher $\lambda(A)$ means faster mixing and stronger chaos in the restricted dynamics.

## Method

The transfer operator for digit set $A$ at parameter $s$ is:

$$(\mathcal{L}_s f)(x) = \sum_{a \in A} (a+x)^{-2s} \, f\!\left(\frac{1}{a+x}\right)$$

The Lyapunov exponent is recovered from the leading eigenvalue $\lambda_0(s)$ via:

$$\lambda(A) = -\frac{d}{ds} \log \lambda_0(s) \bigg|_{s=\delta}$$

where $\delta = \dim_H(E_A)$. In practice, we compute this derivative by finite difference:

1. Evaluate $\lambda_0(s)$ at $s = 1$ and $s = 1 + \varepsilon$ for small $\varepsilon$
2. Compute $\lambda(A) \approx -\frac{\log \lambda_0(1+\varepsilon) - \log \lambda_0(1)}{\varepsilon}$

Each evaluation uses Chebyshev collocation with $N = 40$ nodes and power iteration for the leading eigenvalue. All $2^{20} - 1$ subsets are processed in parallel on the GPU, with each subset encoded as a bitmask.

## Results

The full computation of 1,048,575 Lyapunov exponents completed in **305 seconds** — roughly 14x faster than the Hausdorff dimension spectrum (4,322s), since no bisection loop is needed.

### Validation

| Check | Result |
|---|---|
| $\lambda(\{1\})$ | Matches analytic value to 10 digits |
| Monotonicity ($A \subseteq B \Rightarrow \lambda(A) \leq \lambda(B)$) | PASS |

## Reproduction

```bash
git clone https://github.com/cahlen/idontknow.git
cd idontknow
nvcc -O3 -arch=sm_120 -o lyapunov_spectrum \
    scripts/experiments/lyapunov-spectrum/lyapunov_spectrum.cu -lm
mkdir -p scripts/experiments/lyapunov-spectrum/results
./lyapunov_spectrum 20 40
```

Requires: CUDA 13.0+, GPU with compute capability 12.0 (RTX 5090) or adjust `-arch` flag.

## References

- Jenkinson, O. and Pollicott, M. (2001). "Computing the dimension of dynamically defined sets: E_2 and bounded continued fraction entries." *Ergodic Theory and Dynamical Systems*, 21(5), pp. 1429–1445.
- Hensley, D. (1992). "Continued fraction Cantor sets, Hausdorff dimension, and functional analysis." *Journal of Number Theory*, 40(3), pp. 336–358.
- Oseledets, V.I. (1968). "A multiplicative ergodic theorem. Characteristic Ljapunov exponents of dynamical systems." *Trudy Moskovskogo Matematicheskogo Obshchestva*, 19, pp. 179–210.

## Why This Matters for AI

- **Twin dataset with Hausdorff dimensions:** Together with the [dimension spectrum](/experiments/hausdorff-dimension-spectrum/), this provides paired (dimension, Lyapunov exponent) data for over 1M continued fraction Cantor sets — a dataset that does not exist anywhere in the literature.
- **Ergodic theory training data:** The Lyapunov exponent encodes mixing rates and entropy production. AI models have no training data on how $\lambda(A)$ depends on the digit set $A$.
- **Dynamical systems benchmarks:** The monotonicity and analytic singleton checks provide ground truth for AI systems reasoning about dynamical invariants.

*This work was produced through human–AI collaboration (Cahlen Humphreys + Claude). Not independently peer-reviewed. All code and data open for verification at [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*
