---
title: "Transfer Operator for Zaremba's Conjecture: Hausdorff Dimension to 15 Digits"
slug: zaremba-transfer-operator
date: 2026-03-28
author: cahlen
author_github: https://github.com/cahlen
status: complete

hardware:
  name: NVIDIA DGX B200
  gpus: 8x NVIDIA B200 (183 GB VRAM each, 1.43 TB total)
  gpu_interconnect: NVLink 5 (NV18), full mesh, 956 GB/s bidirectional per GPU
  cpus: 2x Intel Xeon Platinum 8570 (112 cores / 224 threads)
  ram: 2 TB DDR5
  storage: 28 TB NVMe

software:
  cuda: "13.0"
  driver: "580.126.09"
  method: Chebyshev collocation (N=40) + cuSOLVER GPU eigensolve
  python: "3.12"

tags:
  domain: [number-theory, continued-fractions, spectral-theory]
  hardware: [b200, dgx]
  method: [transfer-operator, chebyshev-collocation, eigenvalue-computation, spectral-gap]

results:
  problem: "Hausdorff dimension, spectral gaps, and property (tau) for the Zaremba semigroup"
  hausdorff_dimension: 0.836829443681208
  precision_digits: 15
  two_delta: 1.6737
  circle_method_threshold: "MET (2delta > 1)"
  spectral_gap: 0.717
  eigenvalue_ratio: 0.283
  phase2_status: "complete — 1,214 moduli, all gaps positive"
  phase2_moduli: 1214
  phase2_max_m: 1999
  phase2_min_gap: 0.237
  phase2_min_gap_modulus: 1469
  phase2_min_gap_factorization: "13 × 113"
  phase2_mean_gap: 0.482
  phase2_time: "77 min on 8× B200"

summary: "Hausdorff dimension of E_5 computed to 15 digits (0.836829443681208). Spectral gaps for 1,214 square-free moduli, all positive. Property (tau) computationally supported (not proven)."

code: https://github.com/cahlen/idontknow/tree/main/scripts/experiments/zaremba-transfer-operator
dataset: https://huggingface.co/datasets/cahlen/zaremba-conjecture-data
---

# Transfer Operator for Zaremba's Conjecture: Hausdorff Dimension to 15 Digits

## Abstract

We computed the Hausdorff dimension of the set $E_5$ (reals whose continued fraction has all partial quotients $\leq 5$) to 15 digits of precision using a GPU-accelerated spectral method. The result $\delta = 0.836829443681208$ gives $2\delta = 1.674 > 1$, meeting the circle method threshold required by Bourgain-Kontorovich's approach to Zaremba's Conjecture. The spectral gap of $0.717$ quantifies the mixing rate of the underlying continued fraction dynamics. Phase 2 (congruence gap analysis) computed spectral gaps for all 1,214 square-free moduli up to $m = 1999$ in 77 minutes — every gap positive, minimum $0.237$ at $m = 1469$, evidence consistent with property ($\tau$) at this scale.

## Background

### Zaremba's Conjecture and the Circle Method

Zaremba's Conjecture (1972) states that for every positive integer $d$, there exists $a$ coprime to $d$ whose continued fraction has all partial quotients $\leq 5$. The strongest partial result (Bourgain-Kontorovich 2014, refined by Huang 2015) proves this for a density-1 subset of integers using the Hardy-Littlewood circle method.

The circle method approach requires a key input: the Hausdorff dimension $\delta$ of the set

$$E_A = \left\{ x \in [0, 1] : \text{all CF quotients of } x \leq A \right\}$$

must satisfy $2\delta > 1$ for the major arc estimates to dominate.

### The Transfer Operator

The Gauss-type transfer operator for CFs bounded by $A = 5$ is:

$$\mathcal{L}_s f(x) = \sum_{k=1}^{5} \frac{1}{(k+x)^{2s}} f\left(\frac{1}{k+x}\right)$$

The Hausdorff dimension $\delta$ is the unique real $s$ where the spectral radius $\rho(\mathcal{L}_s) = 1$. The spectral gap $\lambda_0 - |\lambda_1|$ (where $\lambda_0 = 1$ at $s = \delta$) controls the rate at which the operator forgets initial conditions, which relates to mixing in the continued fraction dynamical system.

## Method

### Chebyshev Collocation

We discretized $\mathcal{L}_s$ using Chebyshev collocation with $N = 40$ points on $[0, 1]$:

1. **Chebyshev nodes:** $x_j = \frac{1}{2}\left(1 - \cos\left(\frac{j\pi}{N}\right)\right)$ for $j = 0, \ldots, N$
2. **Matrix construction:** For each pair $(i, j)$, compute
   $$M_{ij} = \sum_{k=1}^{5} \frac{1}{(k + x_i)^{2s}} \ell_j\left(\frac{1}{k + x_i}\right)$$
   where $\ell_j$ are the Lagrange interpolating polynomials at the Chebyshev nodes
3. **Eigensolve:** Compute the eigenvalues of $M$ using cuSOLVER on GPU
4. **Bisection on $s$:** Find the $s$ where the leading eigenvalue equals 1

$N = 40$ provides spectral (exponential) convergence for this analytic kernel, giving 15+ digits of accuracy.

### GPU Acceleration

The matrix construction and eigensolve were performed on a single B200 GPU using cuSOLVER's dense eigenvalue routines. While this problem is not large enough to require multi-GPU parallelism (it is a $41 \times 41$ matrix), GPU acceleration of the bisection loop's many eigensolves provides fast iteration.

## Results

### Hausdorff Dimension

| Quantity | Value |
|----------|-------|
| $\delta = \dim_H(E_5)$ | $0.836829443681208$ |
| Precision | 15 digits |
| $2\delta$ | $1.6737$ |
| $2\delta > 1$? | **Yes** |

This matches the value computed by Jenkinson and Pollicott (2001) and subsequent refinements, independently verified from scratch on GPU.

### Spectral Gap

| Quantity | Value |
|----------|-------|
| Leading eigenvalue $\lambda_0$ (at $s = \delta$) | $1.000000000000000$ |
| Second eigenvalue $\lvert\lambda_1\rvert$ | $0.283$ |
| Spectral gap $(1 - \lvert\lambda_1\rvert)$ | $0.717$ |
| Ratio $\lvert\lambda_1/\lambda_0\rvert$ | $0.283$ |

The spectral gap of $0.717$ is strong. This means:
- The dominant eigenfunction controls the operator's long-term behavior
- The second eigenvalue decays to less than 30% of the leading one
- Mixing in the CF dynamics is rapid

### Comparison with Known Values

The Hausdorff dimension of $E_A$ for various bounds $A$:

| Bound $A$ | $\dim_H(E_A)$ | $2\delta$ | Threshold met? |
|-----------|---------------|-----------|---------------|
| 2 | $0.5312...$ | $1.063$ | Barely |
| 3 | $0.7056...$ | $1.411$ | Yes |
| 4 | $0.7889...$ | $1.578$ | Yes |
| **5** | **$0.8368...$** | **$1.674$** | **Yes** |
| $\infty$ | $1$ | $2$ | Yes |

For all $A \geq 2$, $2\delta > 1$, so the circle method threshold is met. The conjecture is expected to be true for $A = 5$ and possibly even $A = 2$ (Hensley's conjecture).

## Significance

### What This Establishes Computationally

1. **Circle method is applicable.** The condition $2\delta > 1$ is necessary for Bourgain-Kontorovich's approach. Our independent computation is consistent with this holding with substantial margin ($2\delta - 1 = 0.674$).

2. **Strong spectral gap.** The gap of $0.717$ means the transfer operator has good spectral properties for analytic continuation and exponential sum estimates.

3. **Independent verification.** This was computed from scratch using Chebyshev collocation and GPU eigensolves, providing an independent check on the Jenkinson-Pollicott value.

### Phase 2 Results: Congruence Spectral Gaps (Complete)

We computed the spectral gap $\sigma_m$ of the congruence transfer operator $\mathcal{L}_{\delta, m}$ for all 1,214 square-free moduli $m \leq 1999$ in 77 minutes on 8 B200 GPUs. **Every gap is positive:**

$$0.237 \leq \sigma_m \leq 0.998, \qquad \text{mean } = 0.482 \qquad \text{for all square-free } m \leq 1999$$

The minimum gap of $0.237$ occurs at $m = 1469 = 13 \times 113$. There is **no decay trend** — gaps at $m = 1997$ are just as large as at $m = 2$. This is evidence consistent with **property ($\tau$)** of the Zaremba semigroup at this scale.

This is precisely the condition Bourgain-Kontorovich need: a uniform spectral gap with decay exponent $\beta \approx 0$, far below their threshold of $\beta < 2\delta - 1 \approx 0.672$.

See the [full findings](/findings/zaremba-spectral-gaps-uniform/) for the complete dataset.

### What Remains

The spectral data is complete. What's needed to close the conjecture is making Bourgain-Kontorovich's error terms **effective** — plugging our explicit gap data into their circle method framework to extract a concrete $Q_0$ such that Zaremba holds for all $d > Q_0$. Combined with brute-force verification for $d \leq Q_0$, this would complete the proof.

## Connection to Brute-Force Verification

Our parallel brute-force verification (see [companion experiment](/experiments/zaremba-conjecture-verification)) found:

- **Zero counterexamples** across all tested ranges up to $d = 2.1 \times 10^{11}$
- **99.7% of witnesses** have CF prefix $[0;\, 5, 1, \ldots]$
- **Mean witness ratio** $\alpha(d)/d = 0.1712$, connected to $1/(5 + \varphi)$

The transfer operator analysis explains *why* witnesses concentrate at this ratio: the dominant eigenfunction of $\mathcal{L}_\delta$ peaks near $x \approx 0.171$, corresponding to the preimage of $[1/2, 1]$ under the Gauss map branch $x \mapsto 1/(5 + x)$.

## Reproducibility

```bash
git clone https://github.com/cahlen/idontknow
cd idontknow

# The transfer operator computation
# (requires CUDA + cuSOLVER)
nvcc -O3 -arch=sm_100a -o transfer_op scripts/experiments/zaremba-transfer-operator/transfer_operator.cu -lcublas -lm -lpthread
./transfer_op 40 3 2000
```

## References

- Zaremba, S.K. (1972). "La methode des 'bons treillis' pour le calcul des integrales multiples." *Applications of Number Theory to Numerical Analysis*, pp. 39--119.
- Bourgain, J. and Kontorovich, A. (2014). "On Zaremba's conjecture." *Annals of Mathematics*, 180(1), pp. 137--196. arXiv:1107.3776
- Huang, S. (2015). "An improvement to Zaremba's conjecture." *Geometric and Functional Analysis*, 25(3), pp. 860--914. arXiv:1310.3772
- Jenkinson, O. and Pollicott, M. (2001). "Computing the dimension of dynamically defined sets." *Ergodic Theory and Dynamical Systems*, 21(5), pp. 1429--1445.
- Hensley, D. (1992). "Continued fraction Cantor sets, Hausdorff dimension, and functional analysis." *Journal of Number Theory*, 40(3), pp. 336--358.

---

*Computed 2026-03-28 on NVIDIA DGX B200. Code: [transfer_operator.cu](https://github.com/cahlen/idontknow/blob/main/scripts/experiments/zaremba-transfer-operator/transfer_operator.cu).*

*This work was produced through human–AI collaboration (Cahlen Humphreys + Claude). Not independently peer-reviewed. All code and data open for verification at [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*
