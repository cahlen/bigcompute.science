---
title: "Digit 1 Amplification in Zaremba Density: Strong Effect, Inverse-Square Law Still Unconfirmed"
slug: zaremba-inverse-square-amplification
date: 2026-04-06
author: cahlen
author_github: https://github.com/cahlen
significance: high

domain: [continued-fractions, number-theory, diophantine-approximation]
related_experiment: /experiments/zaremba-conjecture-verification/

summary: "Audit revision: digit 1 strongly amplifies Zaremba density relative to digit 2, but the headline inverse-square law is not established by the current data. At matched N = 10^10 for {1,k} and {2,k}, k=3..10 gives ratios 243, 152, 107, 73.8, 64.6, 54.6, 46.6, 42.5 and a power-law fit ≈1143·k^(-1.46) (R²=0.990), not k^(-2). At N = 10^11, matched data currently exist only for k=3,4,5 and fit ≈3562·k^(-1.93), which is suggestive but only three points. Treat inverse-square behavior as a hypothesis requiring matched 10^11 or larger runs for k=6..10."

data:
  amplification_formula: "matched N=10^10 fit: ratio ≈ 1143 × k^(−1.463); matched N=10^11 overlap k=3..5 fit: ratio ≈ 3562 × k^(−1.931)"
  r_squared_1e10_matched: 0.99049
  exponent_1e10_matched: -1.463
  exponent_1e11_overlap: -1.931
  amplification_at_k3_1e10: "243×"
  amplification_at_k10_1e10: "42.5×"
  data_points: 8
  digit_range: "k = 3 to 10"
  scale: "matched 10^10 for k=3..10; matched 10^11 currently only k=3..5"
  hardware: "8×NVIDIA B200 (180GB each)"
  method: "GPU continued fraction tree enumeration with bitset marking"
  status: "REVISED — strong amplification confirmed; inverse-square law remains a hypothesis"

certification:
  level: bronze
  verdict: ACCEPT_WITH_REVISION
  reviewer: "o3-pro, o3, gpt-4.1"
  date: 2026-04-14
  note: "Reviewed by 3 AI models. Audit found the original inverse-square fit used mismatched cutoffs; matched-N data weaken the claim."
---

# Digit 1 Amplification in Zaremba Density

## The Finding

For Zaremba density — the fraction of integers $d \leq N$ representable as a continued fraction denominator using only digits from a set $A$ — replacing digit 2 with digit 1 amplifies density by a large factor. The original inverse-square headline is too strong: the current matched-cutoff data show strong amplification, but not a confirmed $k^{-2}$ law.

At matched $N=10^{10}$ for both $\{1,k\}$ and $\{2,k\}$:

$$\frac{\text{density}(\{1,k\})}{\text{density}(\{2,k\})} \approx 1143\,k^{-1.463}\qquad (R^2=0.990,\ k=3,\ldots,10).$$

At $N=10^{11}$, matched data currently exist only for $k=3,4,5$, giving a suggestive but underdetermined fit $\approx 3562\,k^{-1.93}$. That three-point overlap is not enough to claim an inverse-square law.

## Data

All densities in this table use the same cutoff, $N=10^{10}$:

| $k$ | density $\{1,k\}$ | density $\{2,k\}$ | Amplification |
|-----|-------------------|-------------------|---------------|
| 3 | 11.0568% | 0.045486% | **243×** |
| 4 | 1.6096% | 0.010605% | **152×** |
| 5 | 0.4398% | 0.004126% | **107×** |
| 6 | 0.1721% | 0.002333% | **73.8×** |
| 7 | 0.0840% | 0.001302% | **64.6×** |
| 8 | 0.0475% | 0.000869% | **54.6×** |
| 9 | 0.0297% | 0.000638% | **46.6×** |
| 10 | 0.0201% | 0.000472% | **42.5×** |

The earlier version mixed $\{1,k\}$ densities at $N=10^{11}$ with $\{2,k\}$ densities at $N=10^{10}$, which biases the fitted exponent because these densities are still scale-dependent.

## Why This Matters

### The golden ratio connection

Digit 1 in a continued fraction corresponds to the golden ratio $\phi = [1;1,1,1,\ldots]$. The Gauss measure assigns weight $\log_2(1 + 1/(a(a+2)))$ to digit $a$, giving digit 1 approximately 41.5% of the total weight — nearly half. But Gauss measure is about *typical* behavior. Our result quantifies the *extremal* behavior: how much more of the integer line digit 1 can reach compared to digit 2, as a function of the companion digit.

### Why an inverse-square law is still plausible but unproved

The Gauss measure weight ratio between digits 1 and 2 is:

$$\frac{\log(1 + 1/3)}{\log(1 + 1/8)} = \frac{\log(4/3)}{\log(9/8)} \approx 2.41$$

This is a constant — it doesn't depend on $k$. So the $1/k^2$ decay in amplification must come from the *interaction* between digit 1 and digit $k$, not from digit 1 alone. As $k$ grows, the continued fraction tree for $\{1,k\}$ and $\{2,k\}$ become increasingly similar in structure (both dominated by their small digit), and the advantage of digit 1 over digit 2 diminishes — but at a rate governed by $1/k^2$.

This is reminiscent of the $\sum 1/a^2$ predictor for Hausdorff dimension (see [Hausdorff digit-one dominance](/findings/hausdorff-digit-one-dominance/)): the difference $1/1^2 - 1/2^2 = 3/4$ is a constant, but its *relative* importance compared to $1/k^2$ decays as $k$ grows. The current data are consistent with a drift toward a quadratic law at larger $N$, but matched larger-scale runs are required before making that claim.

## Additional Patterns

### {1,2,k} exception count growth

The number of integers with no $\{1,2,k\}$-representation grows as a decelerating exponential in $k$:

| $k$ | Exceptions | Ratio $E(k)/E(k-1)$ | Status |
|-----|-----------|---------------------|--------|
| 3 | 27 | — | Stable candidate through $10^{10}$; 10^11 repo log is partial |
| 4 | 64 | 2.4 | Stable candidate through $10^{10}$; 10^11 repo log is partial |
| 5 | 374 | 5.8 | Stable candidate through $10^{10}$; 10^11 repo log is partial |
| 6 | 1,834 | 4.9 | Stable candidate through $10^{11}$ |
| 7 | 7,178 | 3.9 | Stable candidate through $10^{11}$ |
| 8 | 23,590 | 3.3 | Open at $10^{11}$ |
| 9 | 77,109 | 3.3 | Open at $10^{11}$ |
| 10 | 228,514 | 3.0 | Open at $10^{11}$ |

The growth ratios converge toward $\approx 3.2$, suggesting asymptotic behavior $E(k) \sim C \cdot 3.2^k$. A quadratic-log model $\log E(k) = -0.030k^2 + 1.73k - 1.90$ fits with $R^2 = 0.997$.

### {1,3,5} approaching a finite limit

The exception set for $A = \{1,3,5\}$ shows strong evidence of convergence:

| $N$ | Exceptions | New exceptions |
|-----|-----------|---------------|
| $10^9$ | 75,547 | — |
| $10^{10}$ | 80,431 | +4,884 |
| $10^{11}$ | 80,945 | +514 |

The increment dropped 9.5× per decade. Geometric extrapolation gives a limit of approximately **81,005**, with fewer than 60 exceptions remaining beyond $10^{11}$. If confirmed at $10^{12}$, this would be evidence for another stable exception set and the first such candidate with non-consecutive digits.

## Method

- **Transfer operator enumeration**: GPU threads enumerate all continued fraction trees with digits in $A$, marking denominators in a bitset
- **Prefix splitting**: CPU generates tree prefixes to bounded depth; GPU threads do DFS on subtrees
- **Hardware**: 8×NVIDIA B200 GPUs (180 GB each), RTX 5090 for smaller runs
- All densities computed from complete enumeration up to $N$, not sampling

## Connection to Other Findings

- **[Zaremba digit pair hierarchy](/findings/zaremba-digit-pair-hierarchy/)**: Established the $\{1,k\}$ and $\{2,k\}$ hierarchies separately; this finding quantifies the *ratio* between them
- **[Zaremba exception hierarchy](/findings/zaremba-exception-hierarchy/)**: Exception counts for $\{1,2,k\}$; this finding adds the growth model and {1,3,5} convergence
- **[Hausdorff digit-one dominance](/findings/hausdorff-digit-one-dominance/)**: The $\sum 1/a^2$ predictor for dimension motivates testing inverse-square amplification in density, but does not prove it

## Code

- Density kernel: [`scripts/experiments/zaremba-density/zaremba_density_gpu.cu`](https://github.com/cahlen/idontknow)
- All results: `scripts/experiments/zaremba-density/results/`

## References

- Zaremba, S. K. (1972). "La méthode des 'bons treillis' pour le calcul des intégrales multiples." In *Applications of Number Theory to Numerical Analysis*, pp. 39–119.
- Bourgain, J. and Kontorovich, A. (2014). "On Zaremba's conjecture." Annals of Mathematics, 180(1), pp. 137–196.
- Hensley, D. (1996). "A polynomial time algorithm for the Hausdorff dimension of continued fraction Cantor sets." Journal of Number Theory, 58(1), pp. 9–45.

---

*Computed on 8×NVIDIA B200 GPUs. All data open at [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*

*This work was produced through human–AI collaboration (Cahlen Humphreys + Claude). Not independently peer-reviewed. All code and data open for verification.*
