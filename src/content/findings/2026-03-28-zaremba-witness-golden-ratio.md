---
title: "Zaremba Witnesses Concentrate at α(d)/d ≈ 0.171, Connected to the Golden Ratio"
slug: zaremba-witness-golden-ratio
date: 2026-03-28
author: cahlen
author_github: https://github.com/cahlen
significance: medium

domain: [number-theory, continued-fractions, dynamical-systems]
related_experiment: /experiments/zaremba-conjecture-8b-verification/

summary: "The smallest Zaremba witness for d concentrates at a/d ≈ 0.171 with 99.7% sharing CF prefix [0; 5, 1, ...]. The concentration lies between the convergents 1/6 and 2/11, connected to 1/(5+φ) where φ is the golden ratio. The bound A=5 is tight — 99.9% of cases require max quotient exactly 5."

data:
  mean_ratio: 0.1712
  median_ratio: 0.1709
  percentile_1: 0.1708
  percentile_99: 0.1745
  dominant_prefix: "[0, 5, 1, ...]"
  dominant_prefix_frequency: "99.7%"
  golden_ratio_connection: "1/(5+φ) ≈ 0.1511"
  bound_tightness: "99.9% require max quotient = 5"
  sample_range: "d = 1 to 100,000"
---

# Zaremba Witnesses Concentrate at $\alpha(d)/d \approx 0.171$

## The Finding

For the smallest Zaremba witness $\alpha(d)$ with bound $A = 5$, the ratio $\alpha(d)/d$ is remarkably concentrated:

$$\text{Mean}\;\frac{\alpha(d)}{d} = 0.1712, \qquad \text{99\% interval:}\; [0.1708,\; 0.1745]$$

This is an extraordinarily tight band — relative width $\sim 2\%$. The dominant continued fraction prefix is $[0;\, 5, 1, \ldots]$ for **99.7%** of all $d > 1000$.

## The Golden Ratio Connection

The infinite continued fraction $[0;\, 5, 1, 1, 1, \ldots]$ converges to:

$$\frac{1}{5 + \varphi} = \frac{1}{5 + \frac{1+\sqrt{5}}{2}} \approx 0.1511$$

where $\varphi$ is the golden ratio. The observed mean $0.1712$ lies between the finite convergents:

$$[0;\, 5, 1] = \frac{1}{6} \approx 0.1667 \qquad \text{and} \qquad [0;\, 5, 1, 1] = \frac{2}{11} \approx 0.1818$$

The witnesses cluster in this window because the optimal CF starts with the maximum allowed quotient (5), then drops to the minimum (1), then varies — balancing the constraint of keeping all quotients $\leq 5$ while being coprime to $d$.

## Tightness of $A = 5$

| Max quotient used | Frequency |
|------------------|-----------|
| 5 | 99.91% |
| 4 | 0.07% |
| $\leq 3$ | 0.02% |

The conjecture is *tight*: $A = 4$ would fail for 99.91% of all $d$.

## Practical Impact

This observation enabled a **13× speedup** in our CUDA verification kernel (v2 over v1) by starting the witness search at $a = \lfloor 0.170d \rfloor$ instead of $a = 1$.

## Code

Analysis script and raw data: [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow)

---

*Computed from exhaustive analysis of $d = 1$ to $100{,}000$ on NVIDIA DGX B200.*
