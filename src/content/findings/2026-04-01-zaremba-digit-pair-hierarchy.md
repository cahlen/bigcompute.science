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

summary: "Complete density computation for all {1,k} pairs at 10^11. Density drops exponentially: {1,2}=80.75%, {1,3}=9.11%, {1,4}=1.07%, ..., {1,10}=0.0085%. Only {1,2} has Hausdorff dimension above 1/2. Updated 2026-04-06 with {2,k} and {3,k} pairs at 10^11: digit 1 amplifies density by 249x for k=4, and {3,k} pairs are 9x sparser than {2,k}. Five closed exception sets confirmed."

data:
  pairs_computed: 9
  range: 100000000000
  densities:
    k2: 80.7543
    k3: 9.1093
    k4: 1.0735
    k5: 0.2564
    k6: 0.0912
    k7: 0.0414
    k8: 0.0221
    k9: 0.0132
    k10: 0.0085
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
| 6 | 0.1721% | 0.0912% | 0.309 | No |
| 7 | 0.0840% | 0.0414% | 0.275 | No |
| 8 | 0.0475% | 0.0221% | 0.246 | No |
| 9 | 0.0297% | 0.0132% | 0.221 | No |
| 10 | 0.0201% | 0.0085% | 0.199 | No |

## Why This Matters

### {1,2} is the only pair whose density grows

The 10^11 data reveals something you cannot see at a single scale: $\{1,2\}$ density **increases** from 76.5% to 80.8% as $N$ grows from $10^{10}$ to $10^{11}$, while **every other pair's density decreases**. The set $\{1,3\}$ drops from 11.1% to 9.1%. The set $\{1,10\}$ drops from 0.020% to 0.0085%.

This is the Hausdorff dimension threshold at work. The dimension $\delta$ of the underlying Cantor set controls the long-term behavior: when $2\delta > 1$ (equivalently $\delta > 1/2$), the set of representable denominators is dense enough that its density converges toward 100%. When $2\delta < 1$, the set is too thin and density converges to 0%.

Only $\{1,2\}$ has $\delta = 0.531 > 1/2$. Every other pair has $\delta < 1/2$. So the 10^11 data is the first scale where we see the density trajectories clearly diverging — one pair headed toward full coverage, the rest headed toward nothing.

### The critical jump is at $k = 2$

At $N = 10^{11}$, the density ratio $\rho(\{1,2\}) / \rho(\{1,3\}) = 80.75 / 9.11 \approx 8.9$. This is the largest consecutive ratio in the hierarchy, and it has *widened* from 6.9 at $10^{10}$ — confirming that $\{1,2\}$ is diverging upward while $\{1,3\}$ is converging to zero. The ratio will continue to grow since $\{1,2\}$ has $\delta > 1/2$ (density $\to 1$) while $\{1,3\}$ has $\delta < 1/2$ (density $\to 0$). The large jump reflects both $\{1,2\}$ crossing the Hausdorff dimension threshold and the Gauss measure weight $1/k^2$ dropping by a factor of $4/9 \approx 0.44$ from $k=2$ to $k=3$.

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

## Without Digit 1: The {2,k} and {3,k} Hierarchies

Removing digit 1 collapses density by orders of magnitude. We now have $\{2,k\}$ data at $10^{10}$ and select pairs at $10^{11}$:

| $k$ | $\{1,k\}$ at $10^{11}$ | $\{2,k\}$ at $10^{10}$ | $\{2,k\}$ at $10^{11}$ | Digit 1 multiplier ($10^{11}$) |
|-----|----------------------|----------------------|----------------------|-------------------------------|
| 4 | 1.0735% | 0.0106% | 0.00431% | **249x** |
| 5 | 0.2564% | 0.0041% | 0.00162% | **158x** |

**Digit 1 amplifies density by 158--249x** at $10^{11}$ (up from 107--152x at $10^{10}$). The amplification *increases* with scale because $\{1,k\}$ pairs have higher Hausdorff dimension than $\{2,k\}$ pairs, so their density decays more slowly.

### Dropping further: {3,k} pairs at $10^{11}$

| Pair | Density at $10^{11}$ | Ratio to $\{2,k\}$ | Ratio to $\{1,k\}$ |
|------|---------------------|--------------------|--------------------|
| $\{3,4\}$ | 0.000474% | $\{2,4\}$ is **9.1x** larger | $\{1,4\}$ is **2,264x** larger |
| $\{3,5\}$ | 0.000202% | $\{2,5\}$ is **8.0x** larger | $\{1,5\}$ is **1,269x** larger |

Each step down in the smallest digit costs roughly an order of magnitude. Without digit 1, no pair achieves even 0.01% density at $10^{11}$. Without digits 1 or 2, density drops below 0.001%. This is the strongest quantitative evidence for the digit 1 dominance phenomenon.

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
    ./zaremba_density_gpu 100000000000 1,$k
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

*Computed 2026-04-01, updated 2026-04-06 with 10^11 data including {2,k} and {3,k} pairs. NVIDIA B200. Human-AI collaboration (Cahlen Humphreys + Claude). Not peer-reviewed.*
