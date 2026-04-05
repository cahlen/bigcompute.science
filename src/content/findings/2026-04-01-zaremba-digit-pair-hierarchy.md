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

For each $k = 2, 3, \ldots, 10$, we computed the Zaremba density of the pair $A = \{1, k\}$ at $N = 10^{10}$ and $10^{11}$. The density drops **exponentially** with $k$:

| $k$ | Density at $10^{10}$ | Density at $10^{11}$ | $\dim_H(E_{\{1,k\}})$ | Above $1/2$? |
|-----|---------------------|---------------------|----------------------|-------------|
| 2 | **76.5487%** | **80.7543%** | 0.531 | **Yes** |
| 3 | 11.0568% | 9.1109% | 0.454 | No |
| 4 | 1.6096% | 1.0735% | 0.397 | No |
| 5 | 0.4398% | 0.2564% | 0.349 | No |
| 6 | 0.1721% | 0.0876% | 0.309 | No |
| 7 | 0.0840% | 0.0387% | 0.275 | No |
| 8 | 0.0475% | 0.0202% | 0.246 | No |
| 9 | 0.0297% | 0.0117% | 0.221 | No |
| 10 | 0.0201% | 0.0074% | 0.199 | No |

Note: $\{1,2\}$ density **increases** with $N$ (converging toward 100%), while all other pairs **decrease** (converging toward 0%). This is the critical distinction: only $\{1,2\}$ has $\delta > 1/2$.

## Why This Matters

### The critical jump is at $k = 2$

At $N = 10^{10}$, the density ratio $\rho(\{1,2\}) / \rho(\{1,3\}) = 76.55 / 11.06 \approx 6.9$. This is the largest consecutive ratio in the hierarchy. It measures the density gap between two specific digit pairs at a fixed search range, not an intrinsic "value" of digit 2 vs. digit 3; at different $N$ the ratio may shift (though we expect it to stabilize as $N \to \infty$ because both sets have positive Hausdorff dimension). The large jump reflects both $\{1,2\}$ crossing the Hausdorff dimension threshold ($\delta > 1/2$) and the Gauss measure weight $1/k^2$ dropping by a factor of $4/9 \approx 0.44$ from $k=2$ to $k=3$.

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

**Digit 1 amplifies density by 42--243x** over the equivalent pair with digit 2 (ratios computed from the same GPU kernel at $N = 10^{10}$; see `results/gpu_A1k_1e10.log` and `results/gpu_A2k_1e10.log` for raw counts). The amplification is strongest for small $k$ (where digit 1's presence lifts the Hausdorff dimension above the critical threshold) and weakest for large $k$ (where both sets have such low dimension that density is near zero regardless).

Without digit 1, no pair achieves even 0.1% density. This is the strongest quantitative evidence for the digit 1 dominance phenomenon.

## Closed Exception Sets

Four $\{1, 2, k\}$ triples have computationally observed exception sets that appear *stable* — no new exceptions appear when extending the search range by a factor of 10. **This is observational stability, not a proof of finiteness.** No branch-and-bound or analytic argument rules out further exceptions beyond our search range. The search is exhaustive within the stated range (every integer $1 \leq d \leq N$ is checked via the bitset).

| Digit set | Exceptions | Exhaustive to | Stability window | Status |
|-----------|-----------|--------------|-----------------|--------|
| $\{1,2,3\}$ | **27** | $10^{10}$ | $10^9 \to 10^{10}$: no growth | $10^{11}$ in progress |
| $\{1,2,4\}$ | **64** | $10^{10}$ | $10^9 \to 10^{10}$: no growth | $10^{11}$ in progress |
| $\{1,2,5\}$ | **374** | $10^{11}$ | $10^{10} \to 10^{11}$: no growth | Closed |
| $\{1,2,6\}$ | **1,834** | $10^{11}$ | $10^{10} \to 10^{11}$: no growth | Closed |
| $\{1,2,7\}$ | **7,178** | $10^{11}$ | $10^{10} \to 10^{11}$: no growth | **NEW — Closed** |

The largest exception for $\{1,2,4\}$ is $d = 51{,}270$ (full list of all 64 values available in `results/gpu_A124_1e10.log`).

The sequence 27, 64, 374, 1,834, 7,178 grows rapidly with $k$. We cannot rigorously prove these sets are finite — additional exceptions could in principle appear beyond our search range. However, the stability across a full decade of extension is strong computational evidence.

**Update (2026-04-05):** $A=\{1,2,7\}$ at $10^{11}$ confirms exactly 7,178 exceptions — unchanged from $10^{10}$, making this the fifth closed exception set. Meanwhile $\{1,2,8\}$ has 23,590 at $10^{11}$ (growing), suggesting a sharp closed/open threshold at $k=7$.

### Open Exception Sets at $10^{11}$

| Digit set | Exceptions | Growth from $10^{10}$ | Status |
|-----------|-----------|----------------------|--------|
| $\{1,2,8\}$ | 23,590 | growing | Open |
| $\{1,2,9\}$ | 77,109 | growing | Open |
| $\{1,2,10\}$ | 228,514 | growing | Open |
| $\{1,3,5\}$ | 80,945 | +514 from 80,431 | Slowly growing |

## Reproduce

```bash
nvcc -O3 -arch=sm_100a -o zaremba_density_gpu scripts/experiments/zaremba-density/zaremba_density_gpu.cu -lm
for k in 2 3 4 5 6 7 8 9 10; do
    ./zaremba_density_gpu 10000000000 1,$k
done
```

**Algorithm.** The kernel enumerates all continued fractions $[a_1, a_2, \ldots]$ with $a_i \in A$ by DFS over the CF tree. Each node corresponds to a convergent $p_n/q_n$; children are formed via $q_{n+1} = a \cdot q_n + q_{n-1}$ for each $a \in A$, pruning when $q > N$. Reachable denominators are marked in a global bitset (1.25 GB for $N = 10^{10}$, one bit per integer). The CPU generates prefixes to depth 4--12 (depending on $|A|$ and $N$), then launches one GPU thread per prefix for the remaining DFS. Bit-marking uses `atomicOr` for thread safety. After GPU completion, the CPU counts marked bits.

**Timing per pair** (NVIDIA B200, CUDA 12.8, `nvcc -O3 -arch=sm_100a`):

| Pair | GPU enum (s) | Total (s) | Prefixes |
|------|-------------|-----------|----------|
| {1,2} | 79.8 | 88.4 | 4096 |
| {1,3} | 9.3 | 18.0 | 4096 |
| {1,4} | 2.4 | 11.1 | 4096 |
| {1,5} | 1.8 | 10.4 | 4096 |
| {1,6} | 1.9 | 10.6 | 4096 |
| {1,7} | 1.7 | 10.3 | 4095 |
| {1,8} | 1.6 | 10.3 | 4083 |
| {1,9} | 1.5 | 10.3 | 4083 |
| {1,10} | 1.4 | 10.1 | 4017 |

The large tree for $\{1,2\}$ (Hausdorff dimension 0.531) takes 88 s; all other pairs complete in 10--18 s. Full output logs are in `scripts/experiments/zaremba-density/results/`.

---

*Computed 2026-04-01 on NVIDIA B200. Human-AI collaboration (Cahlen Humphreys + Claude). Not peer-reviewed.*
