---
title: "Minkowski ?(x) Singularity Spectrum"
slug: minkowski-spectrum
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
  method: Weighted transfer operator L_{q,s} with Minkowski measure weights, bisection per q-value, Legendre transform, Chebyshev collocation (N=40)
  custom_kernel: scripts/experiments/minkowski-spectrum/minkowski_spectrum.cu

tags:
  domain: [continued-fractions, fractal-geometry, multifractal-analysis, number-theory]
  hardware: [rtx-5090]
  method: [transfer-operator, chebyshev-collocation, thermodynamic-formalism, legendre-transform]

results:
  q_values: 2001
  q_range: "-10 to 10"
  q_step: 0.01
  computation_time: "4.9 seconds"
  max_f_alpha: 0.987
  alpha_min: 0.747
  alpha_max: 4.459
  tau_0: 0.987
  tau_1: 0.000
  status: "COMPLETE — 2,001 q-values computed in 4.9s on RTX 5090"
  validation_tau0: "τ(0) = 0.987 = dim_H (correct)"
  validation_tau1: "τ(1) = 0 (normalization, correct)"

code: https://github.com/cahlen/idontknow
data: /data/minkowski-spectrum/
dataset: https://huggingface.co/datasets/cahlen/continued-fraction-spectra
---

# Minkowski ?(x) Singularity Spectrum

## Abstract

We compute the multifractal singularity spectrum $f(\alpha)$ of the Minkowski question mark function $?(x)$ — to our knowledge, the first numerical computation of this spectrum. Using a weighted transfer operator with Minkowski measure weights, bisection over 2,001 $q$-values, and a Legendre transform, the full spectrum is obtained in **4.9 seconds** on a single RTX 5090.

## Background

The Minkowski question mark function $?(x)$ is a continuous, strictly increasing function from $[0,1]$ to $[0,1]$ that maps quadratic irrationals to rationals and vice versa. It arises naturally from the Stern-Brocot tree and mediants of Farey fractions. Despite being continuous, $?'(x) = 0$ almost everywhere (Lebesgue), yet the function increases from 0 to 1 — it is a singular function.

The multifractal singularity spectrum $f(\alpha)$ describes the fractal dimension of the set of points where the local Holder exponent of $?(x)$ equals $\alpha$:

$$f(\alpha) = \dim_H \left\{ x \in [0,1] : \lim_{r \to 0} \frac{\log \mu_?([x-r, x+r])}{\log r} = \alpha \right\}$$

where $\mu_?$ is the Minkowski measure (the Stieltjes measure of $?(x)$). The spectrum $f(\alpha)$ reveals the fine multifractal structure of $?(x)$: points where the function is "maximally singular" (small $\alpha$), "typical" (moderate $\alpha$), or "maximally smooth" (large $\alpha$).

Kesseböhmer and Stratmann (2007, 2008) developed the thermodynamic formalism theory for this spectrum but did not compute it numerically.

## Method

The computation uses a weighted transfer operator approach:

$$(\mathcal{L}_{q,s} f)(x) = \sum_{a=1}^{\infty} 2^{-qa} (a+x)^{-2s} \, f\!\left(\frac{1}{a+x}\right)$$

where the weights $2^{-qa}$ come from the Minkowski measure (the $a$-th branch of the Gauss map carries measure $2^{-a}$ under $\mu_?$).

For each $q$-value:

1. **Bisect** over $s$ to find $\tau(q)$ where the leading eigenvalue of $\mathcal{L}_{q,s}$ equals 1
2. The eigenvalue is computed via Chebyshev collocation ($N = 40$) and power iteration
3. The digit sum is truncated at $a = 20$ (consistent with other experiments)

After computing $\tau(q)$ for 2,001 values of $q \in [-10, 10]$ with step 0.01, the singularity spectrum is obtained by Legendre transform:

$$\alpha(q) = -\tau'(q), \qquad f(\alpha) = q \cdot \alpha + \tau(q)$$

## Results

| Quantity | Value |
|---|---|
| $\alpha_{\min}$ | 0.747 |
| $\alpha_{\max}$ | 4.459 |
| $\max f(\alpha)$ | 0.987 |
| $\tau(0)$ | 0.987 ($= \dim_H$, correct) |
| $\tau(1)$ | 0.000 (normalization, correct) |
| Computation time | 4.9 seconds |

### Validation

Two key consistency checks:

- **$\tau(0) = \dim_H(E_{\{1,\ldots,20\}})$**: The free energy at $q=0$ must equal the Hausdorff dimension of the full continued fraction Cantor set. We obtain $\tau(0) = 0.987$, matching the value from the [Hausdorff dimension spectrum](/experiments/hausdorff-dimension-spectrum/).
- **$\tau(1) = 0$**: This is the normalization condition — the Minkowski measure is a probability measure. We obtain $\tau(1) = 0.000$, confirming correctness.

The concave shape of $f(\alpha)$ and the range $\alpha \in [0.747, 4.459]$ are consistent with the theoretical predictions of Kesseböhmer-Stratmann.

## Reproduction

```bash
git clone https://github.com/cahlen/idontknow.git
cd idontknow
nvcc -O3 -arch=sm_120 -o minkowski_spectrum \
    scripts/experiments/minkowski-spectrum/minkowski_spectrum.cu -lm
mkdir -p scripts/experiments/minkowski-spectrum/results
./minkowski_spectrum 2001 40
```

Requires: CUDA 13.0+, GPU with compute capability 12.0 (RTX 5090) or adjust `-arch` flag.

## References

- M. Kesseböhmer and B. O. Stratmann, "A multifractal analysis for Stern-Brocot intervals, continued fractions and Diophantine growth rates," *J. reine angew. Math.* **605** (2007), 133-163.
- M. Kesseböhmer and B. O. Stratmann, "Fractal analysis for sets of non-differentiability of Minkowski's question mark function," *J. Number Theory* **128** (2008), 2663-2686.
- Minkowski, H. (1904). "Zur Geometrie der Zahlen." *Verhandlungen des III Internationalen Mathematiker-Kongresses*, pp. 164–173.
- Salem, R. (1943). "On some singular monotonic functions which are strictly increasing." *Transactions of the AMS*, 53(3), pp. 427–439.
- Denjoy, A. (1938). "Sur une fonction de Minkowski." *Journal de Mathématiques Pures et Appliquées*, 17, pp. 105–151.

## Why This Matters for AI

- **To our knowledge, first numerical computation:** This spectrum has been studied theoretically but never computed. No training data exists for AI models to learn the shape of $f(\alpha)$ for the Minkowski measure.
- **Multifractal analysis benchmark:** The $\tau(0)$ and $\tau(1)$ checks provide hard ground truth. Any AI system claiming to reason about multifractal spectra can be tested against this data.
- **Connects number theory and ergodic theory:** The Minkowski function bridges continued fractions, Farey sequences, and fractal geometry — a rich intersection that AI models currently cannot navigate.

*This work was produced through human–AI collaboration (Cahlen Humphreys + Claude). Not independently peer-reviewed. All code and data open for verification at [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*
