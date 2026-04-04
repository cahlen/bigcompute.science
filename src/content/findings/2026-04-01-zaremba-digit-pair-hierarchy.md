---
title: "The {1,k} Density Hierarchy: Digit 2 Is Worth 7x More Than Digit 3"
slug: zaremba-digit-pair-hierarchy
date: 2026-04-01
author: cahlen
author_github: https://github.com/cahlen
significance: notable

conjecture_year: 1972
domain: [number-theory, continued-fractions, diophantine-approximation, computational-mathematics]
related_experiment: /experiments/zaremba-conjecture-verification/

summary: "Complete density computation for all {1,k} pairs at 10^10. Density drops exponentially: {1,2}=76.55%, {1,3}=11.06%, {1,4}=1.61%, ..., {1,10}=0.020%. Only {1,2} has Hausdorff dimension above 1/2. The ratio between consecutive pairs shows digit 2 is 6.9x more valuable than digit 3, consistent with the Gauss measure weight 1/k^2 as the dominant factor in Zaremba density. Four exception sets observed to be stable (no growth across a decade of extension): {1,2,3}=27, {1,2,4}=64, {1,2,5}=374, {1,2,6}=1,834."

data:
  pairs_computed: 9
  range: 10000000000
  densities:
    k2: 76.5487
    k3: 11.0568
    k4: 1.6096
    k5: 0.4398
    k6: 0.1721
    k7: 0.0840
    k8: 0.0475
    k9: 0.0297
    k10: 0.0201
  scaling: "approximately k^(-3 to -4), precise exponent uncertain"

certification:
  level: bronze
  verdict: ACCEPT
  reviewer: "Claude Opus 4.6 (Anthropic)"
  date: 2026-04-02
  note: "Gauss-Kuzmin supports theory. 4 stable exception sets observed (27, 64, 374, 1834). {1,k} hierarchy clean data." 
code: https://github.com/cahlen/idontknow/blob/main/scripts/experiments/zaremba-density/zaremba_density_gpu.cu
---

# The {1,k} Density Hierarchy

## The Finding

For each $k = 2, 3, \ldots, 10$, we computed the Zaremba density of the pair $A = \{1, k\}$ at $N = 10^{10}$. The density drops **exponentially** with $k$:

| $k$ | Density at $10^{10}$ | $\dim_H(E_{\{1,k\}})$ | Above $1/2$? | Ratio to $k-1$ |
|-----|---------------------|----------------------|-------------|-----------------|
| 2 | **76.5487%** | 0.531 | **Yes** | — |
| 3 | 11.0568% | 0.454 | No | 6.9x drop |
| 4 | 1.6096% | 0.397 | No | 6.9x drop |
| 5 | 0.4398% | 0.349 | No | 3.7x drop |
| 6 | 0.1721% | 0.309 | No | 2.6x drop |
| 7 | 0.0840% | 0.275 | No | 2.0x drop |
| 8 | 0.0475% | 0.246 | No | 1.8x drop |
| 9 | 0.0297% | 0.221 | No | 1.6x drop |
| 10 | 0.0201% | 0.199 | No | 1.5x drop |

## Why This Matters

### The critical jump is at $k = 2$

The jump from $k = 3$ (11%) to $k = 2$ (77%) is the largest in the entire hierarchy — a factor of **6.9x** in observed density. This ratio measures the density gap between consecutive pairs at a fixed search range ($10^{10}$), not an intrinsic "value" of a digit. The large jump reflects both $\{1,2\}$ crossing the Hausdorff dimension threshold ($\delta > 1/2$) and the Gauss measure weight $1/k^2$ dropping by a factor of $4/9 \approx 0.44$ from $k=2$ to $k=3$.

### Gauss measure predicts the hierarchy

The Gauss measure assigns weight proportional to $\log(1 + 1/(a(a+2)))$ to digit $a$ in a typical continued fraction. For small $a$:

| $a$ | Gauss weight | Relative to $a=1$ |
|-----|-------------|-------------------|
| 1 | 0.415 | 1.00 |
| 2 | 0.170 | 0.41 |
| 3 | 0.093 | 0.22 |
| 4 | 0.059 | 0.14 |
| 5 | 0.041 | 0.10 |

Digit 1 appears 41.5% of the time in a typical CF. Digit 2 appears 17%. Digit 3 appears 9.3%. The exponential decay in our density hierarchy directly reflects this concentration: **pairs with rarer digits produce exponentially fewer CF representations, leading to exponentially lower density.**

### Power-law fit

The densities fit approximately:

$$\text{density}(\{1,k\}) \approx C \cdot k^{-\alpha} \qquad \text{for } k \geq 3$$

with $\alpha$ in the range 3--4 (a formal log-log regression with confidence intervals has not been performed; the exponent estimate is approximate given the small number of data points). The rough magnitude is consistent with twice the Gauss measure exponent $-2$ (from $1/k^2$), which is expected since density depends on the *product* of the two digits' contributions.

## Without Digit 1: The {2,k} Hierarchy

For comparison, we computed all $\{2, k\}$ pairs at $10^{10}$:

| $k$ | $\{1,k\}$ density | $\{2,k\}$ density | Digit 1 multiplier |
|-----|-------------------|-------------------|-------------------|
| 3 | 11.06% | 0.0455% | **243x** |
| 4 | 1.61% | 0.0106% | **152x** |
| 5 | 0.44% | 0.0041% | **107x** |
| 6 | 0.172% | 0.0023% | **75x** |
| 7 | 0.084% | 0.0013% | **65x** |
| 8 | 0.047% | 0.0009% | **55x** |
| 9 | 0.030% | 0.0006% | **47x** |
| 10 | 0.020% | 0.0005% | **42x** |

**Digit 1 amplifies density by 42-243x** over the equivalent pair with digit 2. The amplification is strongest for small $k$ (where digit 1's presence lifts the Hausdorff dimension above the critical threshold) and weakest for large $k$ (where both sets have such low dimension that density is near zero regardless).

Without digit 1, no pair achieves even 0.1% density. This is the strongest quantitative evidence for the digit 1 dominance phenomenon.

## Closed Exception Sets

Four $\{1, 2, k\}$ triples have computationally observed exception sets that appear *stable* — no new exceptions appear when extending the search range by a factor of 10. Note: stability across one decade of extension is strong computational evidence but does not constitute a proof of finiteness; additional exceptions could in principle appear at larger ranges.

| Digit set | Exceptions | Verified to | Status |
|-----------|-----------|------------|--------|
| $\{1,2,3\}$ | **27** | $10^{10}$ (pending $10^{11}$) | no growth from $10^9$ to $10^{10}$ |
| $\{1,2,4\}$ | **64** | $10^{10}$ (pending $10^{11}$) | no growth from $10^9$ to $10^{10}$ |
| $\{1,2,5\}$ | **374** | $10^{11}$ | no growth from $10^{10}$ to $10^{11}$ |
| $\{1,2,6\}$ | **1,834** | $10^{11}$ | no growth from $10^{10}$ to $10^{11}$ |

The sequence 27, 64, 374, 1,834 grows rapidly with $k$. We cannot rigorously prove these sets are finite — additional exceptions could in principle appear beyond our search range. However, the stability across a full decade of extension is strong computational evidence. The computation A=$\{1,2,7\}$ at $10^{10}$ found 7,178 uncovered; the $10^{11}$ run is underway to test stability.

## Reproduce

```bash
nvcc -O3 -arch=sm_100a -o zaremba_density_gpu scripts/experiments/zaremba-density/zaremba_density_gpu.cu -lm
for k in 2 3 4 5 6 7 8 9 10; do
    ./zaremba_density_gpu 10000000000 1,$k
done
```

Each pair takes 10-15 seconds on a B200 (Blackwell, 192 GB HBM3e, CUDA 12.8). The kernel uses an inverse CF construction (enumerating all CFs with digits in $A$ and marking their denominators in a bitset), not per-denominator modular inversion. Full algorithmic details and timing logs are available in the GitHub repository.

---

*Computed 2026-04-01 on NVIDIA B200. Human-AI collaboration (Cahlen Humphreys + Claude). Not peer-reviewed.*
