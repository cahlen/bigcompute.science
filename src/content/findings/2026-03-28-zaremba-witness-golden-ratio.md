---
title: "Zaremba Witnesses Concentrate at α(d)/d ≈ 0.171, Connected to the Golden Ratio"
slug: zaremba-witness-golden-ratio
date: 2026-03-28
author: cahlen
author_github: https://github.com/cahlen
significance: medium

conjecture_year: 1972
domain: [number-theory, continued-fractions, dynamical-systems]
related_experiment: /experiments/zaremba-conjecture-verification/

summary: "The smallest Zaremba witness for d concentrates at a/d ≈ 0.171 with 99.7% sharing CF prefix [0; 5, 1, ...]. The concentration lies between the convergents 1/6 and 2/11, with a heuristic connection to 1/(5+φ) where φ is the golden ratio. For 99.9% of d, the *minimal* witness uses max quotient 5 (this does not rule out larger witnesses with quotients ≤ 4)."

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

certification:
  level: bronze
  verdict: ACCEPT_WITH_REVISION
  reviewer: "Claude Opus 4.6 (Anthropic)"
  date: 2026-04-01
  note: "Novel observation. Golden ratio connection is heuristic."
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

**Caveat on the golden ratio.** The infinite CF $[0; 5, 1, 1, 1, \ldots]$ converges to $1/(5+\varphi) \approx 0.1511$, which is 13% below the observed mean of $0.1712$. The witnesses are finite (typically 3–6 terms) and cluster between the low-order convergents $1/6 \approx 0.1667$ and $2/11 \approx 0.1818$, not near the infinite limit. The appearance of the golden ratio is a *heuristic observation* about why digit 1 dominates after the leading 5 (digit 1 is the greedy choice that maximizes remaining CF flexibility), not a proven structural connection. A rigorous explanation for the concentration at $0.171$ remains open.

## Tightness of $A = 5$

| Max quotient used | Frequency |
|------------------|-----------|
| 5 | 99.91% |
| 4 | 0.07% |
| $\leq 3$ | 0.02% |

For 99.91% of moduli $d \leq 100{,}000$, the *smallest* witness $\alpha(d)$ requires a partial quotient of exactly 5. This does not imply that no witness with all quotients $\leq 4$ exists for those $d$ — larger witnesses may satisfy a tighter bound. The statistic measures minimal-witness tightness, not global tightness of Zaremba's conjecture at $A = 4$.

## Practical Impact

This observation enabled a **13x speedup** in our CUDA verification kernel (v2 over v1) by starting the witness search at $a = \lfloor 0.170d \rfloor$ instead of $a = 1$. Note: v2 also incorporated other optimizations (loop unrolling, early-exit predicates), so the full 13x factor is not solely attributable to the starting offset.

## Code

Analysis script and raw data: [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow)

## Data Availability

The complete table of $(d, \alpha(d))$ pairs for $d = 1$ to $100{,}000$ is available at [github.com/cahlen/idontknow/data/zaremba-witnesses/](https://github.com/cahlen/idontknow/data/zaremba-witnesses/). The file `witnesses_1_100000.csv` contains columns `d, alpha, ratio, cf_prefix, max_quotient`. SHA-256 checksum will be published alongside the dataset for independent verification.

## References

1. Zaremba, S.K. (1972). "La méthode des 'bons treillis' pour le calcul des intégrales multiples." *Applications of Number Theory to Numerical Analysis*, pp. 39–119.
2. Bourgain, J. and Kontorovich, A. (2014). "On Zaremba's conjecture." *Annals of Mathematics*, 180(1), pp. 137–196. [arXiv:1107.3776](https://arxiv.org/abs/1107.3776)
3. Khintchine, A.Ya. (1964). *Continued Fractions*. University of Chicago Press.

---

*Computed from exhaustive analysis of $d = 1$ to $100{,}000$ on NVIDIA DGX B200.*

*This work was produced through human–AI collaboration (Cahlen Humphreys + Claude). Not independently peer-reviewed. All code and data open for verification at [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*
