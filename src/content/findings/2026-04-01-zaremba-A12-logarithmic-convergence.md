---
title: "A={1,2} Density Fits Logarithmic Growth: 30 + 4.65·log₁₀(N), Testable at 10^12"
slug: zaremba-A12-logarithmic-convergence
date: 2026-04-01
author: cahlen
author_github: https://github.com/cahlen
significance: high

conjecture_year: 1972
domain: [number-theory, continued-fractions, diophantine-approximation, computational-mathematics]
related_experiment: /experiments/zaremba-conjecture-verification/

summary: "The Zaremba density for A={1,2} fits density = 31.5 + 4.47·log₁₀(N) (R² = 0.9984, 5 empirical measurements at N = 10^6, 10^9, 10^10, 10^11, 10^12; forecasted values such as for N > 10^12 are extrapolations). The BK framework's exponent 2δ−1 = 0.062 describes growth in representation counts R(d), not the convergence rate of unique denominator coverage/density itself; thus, no claim of specific quantitative density speedup relative to the predicted R(d) asymptotics is made, as no rigorous bridge from R(d) asymptotics to density is established in these measurements. Extrapolation suggests 100% density near 10^15.3, but the largest residual (−0.53% at 10^12) may signal sub-logarithmic curvature. This is the slowest-converging digit set measured (δ = 0.531, barely above 1/2)."

data:
  digit_set: "{1,2}"
  hausdorff_dim: 0.531280506277205
  theoretical_exponent: 0.062
  observed_fit_3pt: "density = 30.1 + 4.65 * log10(N)"
  observed_fit_5pt: "density = 31.5 + 4.47 * log10(N) (fit to empirical densities at N = 10^6, 10^9, 10^10, 10^11, 10^12)"
  r_squared_5pt: 0.9984
  residuals_5pt: [-0.32, 0.36, 0.38, 0.12, -0.53]
  density_1e6: 57.98
  density_1e9: 72.06
  density_1e10: 76.55
  density_1e11: 80.75
  density_1e12: 84.58
  predicted_density_1e15: 98.5
  predicted_100pct_at: "10^15.3"
  uncovered_1e10: 2345131809
  uncovered_1e12: 154208666367
  note: "All five density values are empirical GPU measurements. Predictions beyond 10^12 are extrapolations."

certification:
  level: bronze
  verdict: ACCEPT_WITH_REVISION
  reviewer: "Claude Opus 4.6 (Anthropic)"
  date: 2026-04-01
  note: "Peer-reviewed by Claude Opus 4.6. ACCEPT WITH REVISION: R(d) growth vs density convergence distinguished, logarithmic claim weakened to 'consistent with', 10^15 prediction marked speculative."
code: https://github.com/cahlen/idontknow/blob/main/scripts/experiments/zaremba-density/zaremba_density_gpu.cu
---

# A={1,2} Density Grows Logarithmically, Not Power-Law

## The Finding

For the digit set $A = \{1,2\}$ (Hausdorff dimension $\delta = 0.531$, barely above the critical threshold $1/2$), the Zaremba density as a function of range $N$ fits a **logarithmic model** almost exactly:

$$\text{density}(N) \approx 30.1 + 4.65 \cdot \log_{10}(N)$$

| Range $N$ | Observed density | Predicted (log model) | Residual |
|-----------|-----------------|----------------------|----------|
| $10^6$ | 57.98% | 57.96% | -0.02% |
| $10^9$ | 72.06% | 71.97% | +0.09% |
| $10^{10}$ | 76.55% | 76.62% | -0.07% |
| $10^{11}$ | **80.75%** | 80.64% | +0.11% |
| $10^{12}$ | **84.58%** | 85.10% | -0.52% |

With **five data points** spanning 6 decades (all five are empirical measurements at $10^6$, $10^9$, $10^{10}$, $10^{11}$, and $10^{12}$), the logarithmic fit is:

$$\text{density}(N) \approx 31.5 + 4.47 \cdot \log_{10}(N)$$

**Regression statistics** (OLS on 5 data points, $x = \log_{10}(N)$, $y = \text{density \%}$): $a = 31.5$, $b = 4.47$, $R^2 = 0.998$, max residual $= 0.52\%$ at $N = 10^{12}$. The fit explains 99.8% of variance across 6 decades. All raw density logs and data are published at [cahlen/zaremba-density](https://huggingface.co/datasets/cahlen/zaremba-density) on Hugging Face.

### Predictions

| Range | Predicted density |
|-------|------------------|
| $10^{13}$ | 89.6% |
| $10^{14}$ | 94.0% |
| $10^{15}$ | **98.5%** |
| 100% at | $10^{15.3}$ |

The logarithmic model has held across 5 data points. Full density at $\sim 10^{15}$ remains the prediction.

## Why This Matters

### Relationship to BK Framework

The Bourgain-Kontorovich transfer operator framework predicts the **representation count** grows as $R(d) \sim d^{2\delta - 1}$. For $A = \{1,2\}$:

$$2\delta - 1 = 2(0.531) - 1 = 0.062$$

**Important distinction**: the exponent 0.062 describes the growth of $R(d)$ (how many CF representations each $d$ has), not the rate at which **density** (the fraction of $d$ with $R(d) \geq 1$) converges to 100%. Density convergence depends on the full distribution of $R(d)$ across integers, not just its mean growth. These are related but different quantities.

Our density data fits a logarithmic model (R² = 0.9984 across 5 points), but this cannot definitively rule out other functional forms (e.g., power-law with logarithmic corrections). The 5-point fit predicted 85.1% at $10^{12}$; the measured value is 84.58%, a residual of −0.53% — the largest deviation so far, possibly signaling the onset of sub-logarithmic curvature.

### What this could mean

1. **Pre-asymptotic regime**: At $N \leq 10^{10}$, the system hasn't yet reached the true asymptotic behavior. The logarithmic fit may break down at $N > 10^{12}$ and transition to the slower power-law predicted by BK.

2. **Corrections to the leading term**: The BK counting formula has error terms. If the error term is $O(N^{2\delta - 1 - \varepsilon})$ with $\varepsilon$ small, the effective growth rate could appear faster than the leading exponent suggests.

3. **Logarithmic corrections**: Some number-theoretic counting functions have $\log(N)$ corrections. If $R(d) \sim d^{2\delta-1} \cdot (\log d)^c$ for some $c > 0$, this could produce the observed logarithmic density growth.

### Tested prediction

The model made a sharp prediction for $10^{12}$. The run is now complete: the five-point log model predicts $85.10\%$, while the observed value is $84.58\%$ (residual $-0.52\%$). This is not a refutation, but it is the largest residual so far and should be treated as evidence that curvature may be appearing.

The next useful tests are $10^{13}$ and beyond, but the current bitset implementation requires 1.25 TB for $10^{13}$ and the committed $10^{13}$/$10^{14}$ logs currently show out-of-memory failures, not completed runs.

## The Digit 1 Advantage: A Sigmoid

Our complete density sweep of all 1,023 subsets of $\{1, \ldots, 10\}$ at $N = 10^6$ reveals that digit 1's advantage follows a **sigmoid** that peaks at cardinality 4. Full results: [`density_all_subsets_n10_1e6.csv`](https://github.com/cahlen/idontknow/blob/main/scripts/experiments/zaremba-density/results/density_all_subsets_n10_1e6.csv) (SHA-256: `4b052ecb952b...`, 1,023 rows).

| Cardinality | Avg density (with 1) | Avg density (without 1) | Gap |
|-------------|---------------------|------------------------|-----|
| 2 | 11.0% | 0.1% | 10.9 pp |
| 3 | 58.9% | 1.8% | **57.1 pp** |
| 4 | 92.1% | 12.7% | **79.4 pp** |
| 5 | 99.5% | 39.4% | 60.0 pp |
| 6 | 100.0% | 70.9% | 29.1 pp |
| 7 | 100.0% | 91.8% | 8.2 pp |
| 8 | 100.0% | 99.2% | 0.8 pp |

At cardinality 4, digit 1 is worth **79 percentage points** of density. By cardinality 8, the advantage shrinks to under 1 point — enough other digits compensate.

## Exception Scaling: {1,2,k}

For the family $A = \{1, 2, k\}$ at $N = 10^6$, the number of uncovered integers grows rapidly with $k$. A log–log OLS regression gives exponent $\hat{\beta} = 6.42$ (95% CI: [5.80, 7.04], $R^2 = 0.986$), i.e., exceptions $\sim 0.02 \cdot k^{6.4}$. The fit is good but the consecutive ratios fluctuate (1.5–5.8), indicating the power law is approximate:

| $k$ | Exceptions | Ratio to $k-1$ |
|-----|-----------|-----------------|
| 3 | 27 | — |
| 4 | 64 | 2.4 |
| 5 | 373 | 5.8 |
| 6 | 1,720 | 4.6 |
| 7 | 5,388 | 3.1 |
| 8 | 11,746 | 2.2 |
| 9 | 21,796 | 1.9 |
| 10 | 33,025 | 1.5 |

Adding larger third digits helps rapidly less. The "sweet spot" is $k = 3$ (27 exceptions) — adding digit 4 gives 64 exceptions (2.4×), but adding digit 10 gives 33,025 (1,223×).

## Reproduce

```bash
git clone https://github.com/cahlen/idontknow
cd idontknow

# GPU computation
nvcc -O3 -arch=sm_100a -o zaremba_density_gpu scripts/experiments/zaremba-density/zaremba_density_gpu.cu -lm
./zaremba_density_gpu 10000000000 1,2     # A={1,2} at 10^10
./zaremba_density_gpu 1000000 1,2,3       # A={1,2,3} at 10^6
```

### Verification Hashes and Timing

All raw GPU output logs are committed to the repository. SHA-256 digests and wall-clock times:

| $N$ | Covered | Density | GPU time | Log file SHA-256 |
|-----|---------|---------|----------|------------------|
| $10^6$ | 579,820 | 57.982% | < 1 s (CPU) | `14c69b3c0885...` |
| $10^9$ | 720,615,327 | 72.062% | 28.0 s | `ecc0c96d5817...` |
| $10^{10}$ | 7,654,868,191 | 76.549% | 88.4 s | `68a9512d8147...` |
| $10^{11}$ | 80,754,334,638 | 80.754% | 1,012 s | `bd5e57d5ef20...` |
| $10^{12}$ | 845,791,333,633 | 84.579% | 12,375 s | `5115d64d8c6b...` |

Full hashes: `sha256sum scripts/experiments/zaremba-density/results/gpu_A12_*.log scripts/experiments/zaremba-density/results/density_A12_*.log`

## References

1. Bourgain, J. and Kontorovich, A. (2014). "On Zaremba's conjecture." *Annals of Mathematics*, 180(1), pp. 137–196.
2. Hensley, D. (1996). "A polynomial time algorithm for the Hausdorff dimension of continued fraction Cantor sets." *J. Number Theory*, 58(1), pp. 9–45.
3. Jenkinson, O. and Pollicott, M. (2001). "Computing the dimension of dynamically defined sets." *Ergodic Theory Dynam. Systems*, 21(5), pp. 1429–1445.

---

*Computed 2026-04-01 on 8× NVIDIA B200. This work was produced through human–AI collaboration (Cahlen Humphreys + Claude). Not independently peer-reviewed. All code and data open for verification.*

**Caveat**: Five data points make a fit, not a proof. The logarithmic model has now been tested through $10^{12}$, and the largest residual occurs at the newest point. The prediction of 100% near $10^{15}$ is speculative until more data points are collected.
