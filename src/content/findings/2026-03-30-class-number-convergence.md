---
title: "Cohen-Lenstra at Scale: h=1 Rate Falls to 15% at 10^10, Genus Theory Dominates"
slug: class-number-convergence
date: 2026-03-30
author: cahlen
author_github: https://github.com/cahlen
significance: notable

domain: [algebraic-number-theory, cohen-lenstra-heuristics, computational-mathematics]
related_experiment: /experiments/class-numbers-real-quadratic/

summary: "GPU computation of 30 billion class numbers for real quadratic fields reveals that the h(d)=1 rate DECREASES from 42% at d~10^4 to 15.35% at d~10^10 and is still falling. This is NOT non-monotone convergence — the h=1 rate goes to 0 asymptotically because genus theory forces 2|h for discriminants with multiple prime factors (which become dominant by Erdos-Kac). The Cohen-Lenstra prediction of 75.4% applies to Prob(h_odd=1), not Prob(h=1). The odd-part distribution converges extremely slowly to C-L, with 3|h at 15% vs predicted 44%. CORRECTION (2026-04-01): original version incorrectly claimed non-monotone convergence to 75%. Peer review via MCP verification identified the error."

certification:
  level: silver
  verdict: ACCEPT_WITH_REVISION
  reviewer: "Claude Opus 4.6 (Anthropic)"
  date: 2026-04-01
  note: "h=1 rate corrected to →0. 75.4% is Prob(h_odd=1)."
---

# Cohen-Lenstra Convergence Is Non-Monotone

## Key Finding

The fraction of real quadratic fields $\mathbb{Q}(\sqrt{d})$ with class number $h(d) = 1$ **decreases monotonically** as the discriminant range increases from $10^4$ to $10^{10}$:

| Range | $h = 1$ fraction | Validated by |
|-------|-----------------|--------------|
| $d < 10^4$ | 42.1% | spot-checked against PARI/GP |
| $d \sim 10^6$ | 25.7% | spot-checked against PARI/GP |
| $d \in [10^9, 2 \times 10^9)$ | 17.5% | This work |
| $d \in [10^9, 10^{10})$ | 16.7% | This work |
| $d \in [10^{10}, 10^{11})$ | 15.35% | This work |
| Asymptotic | **→ 0** | Genus theory (see below) |
| $h_{\text{odd}} = 1$ asymptotic | 75.446% | Cohen-Lenstra (1984) |

> **Correction (2026-04-01):** The original version of this finding incorrectly claimed "non-monotone convergence to 75.4%". Peer review via the MCP verification process (Claude Opus 4.6, Anthropic) identified that 75.4% is the Cohen-Lenstra prediction for $\Pr(h_{\text{odd}} = 1)$, not $\Pr(h = 1)$. Since $h = 1$ requires the 2-part $h_2 = 1$, which requires at most one odd prime factor in the discriminant, and the density of such discriminants goes to 0 by the Erdős–Kac theorem, $\Pr(h = 1) \to 0$ monotonically. The rate will NOT turn around.

## Why This Happens

### Powers of 2 Dominate

The class number distribution at moderate discriminants is dominated by **genus theory** — the 2-rank of the class group is determined by the number of prime factors of $d$. For discriminants with many prime factors, $h(d)$ tends to be a large power of 2.

| $h$ | Fraction at $d \sim 10^{10}$ | Structure |
|-----|------------------------------|-----------|
| 1 | 16.7% | Trivial class group |
| 2 | 22.2% | Genus theory ($d$ has 2 prime factors) |
| 4 | 19.8% | Genus theory ($d$ has 3 prime factors) |
| 8 | 10.9% | Genus theory ($d$ has 4 prime factors) |
| 16 | 4.5% | Genus theory ($d$ has 5 prime factors) |

These five values account for **74.1%** of all discriminants — the entire distribution is shaped by genus theory at this scale.

### The Odd Part Is Where Cohen-Lenstra Applies

Cohen-Lenstra heuristics predict the distribution of the **odd part** of the class group, not the full class number. The 2-part is deterministic (from genus theory). As $d \to \infty$, the average number of prime factors of $d$ grows as $\log \log d$, so the genus-theoretic 2-part grows, making $h = 1$ less likely even as the odd part concentrates at 1.

This explains the monotonic decrease: as $d$ grows, discriminants have more prime factors (Erdős–Kac: the number of prime factors of $d$ concentrates around $\log \log d$), so the 2-part grows, making $h = 1$ less likely. The rate $\Pr(h = 1)$ goes to 0 — it does NOT converge to 75.4%.

The Cohen-Lenstra prediction of 75.446% applies to the **odd part**: $\Pr(h_{\text{odd}} = 1) \to 75.4\%$. This convergence is extremely slow — at $d \sim 10^{10}$, the 3-divisibility rate is 15.3% vs the predicted 44%, still far from asymptotic.

### 3-Divisibility

| Statistic | Observed ($d \sim 10^{10}$) | Cohen-Lenstra prediction |
|-----------|----------------------------|-------------------------|
| $3 \mid h$ | 15.3% | $\approx 43.99\%$ |
| $5 \mid h$ | 4.9% | $\approx 23.84\%$ |
| $7 \mid h$ | 2.3% | $\approx 16.33\%$ |

The p-divisibility rates are also far from the asymptotic predictions, again due to the dominance of the 2-part at moderate discriminants.

## Computational Details

- **2,735,671,820 fundamental discriminants** processed in the $[10^9, 10^{10})$ range
- **30 minutes** on 8× NVIDIA B200 DGX cluster (Blackwell, 192 GB HBM3e each, CUDA 12.8) for the first 2.7 billion
- Total wall-clock for the full 30 billion discriminants (including $[10^{10}, 10^{11})$): approximately 5 hours
- **1.5M discriminants/sec** throughput
- **Method**: GPU sieve + CF regulator (log-space, spot-checked against PARI/GP for $d < 10^6$) + Euler product (9,592 primes). Note: spot-checking a small prefix does not guarantee absence of silent errors over the full 30 billion inputs. A randomized cross-check on a $\geq 0.1\%$ subsample using an independent algorithm is planned.
- **Raw data**: every (d, h) pair preserved in binary format, to be uploaded to [Hugging Face](https://huggingface.co/cahlen)

Full paper: [experiment page](/experiments/class-numbers-real-quadratic/)
Source code: [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow/tree/main/scripts/experiments/class-numbers)

## References

- Cohen, H. and Lenstra, H.W. Jr. (1984). "Heuristics on class groups of number fields." *Number Theory Noordwijkerhout 1983*, Lecture Notes in Mathematics 1068, pp. 33–62.
- Jacobson, M.J. Jr., Ramachandran, S., and Williams, H.C. (2006). "Numerical results on class groups of imaginary quadratic fields." *Mathematics of Computation*, 75(254), pp. 1003–1024.
- Stevenhagen, P. (1993). "The number of real quadratic fields having units of negative norm." *Experimental Mathematics*, 2(2), pp. 121–136.

---

*Computed 2026-03-30 on 8× NVIDIA B200. All code and data at [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow). Published at [bigcompute.science](https://bigcompute.science).*

*This work was produced through human–AI collaboration (Cahlen Humphreys + Claude). Not independently peer-reviewed. All code and data open for verification at [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*

## Update: d ∈ [10^10, 10^11] — 27.4 Billion Discriminants (2026-03-31)

| Statistic | [10^9, 10^10] | [10^10, 10^11] |
|-----------|--------------|----------------|
| Discriminants | 2,735,671,820 | 27,356,719,769 |
| h=1 rate | 16.70% | **15.35%** |
| h=2 | 22.17% | 21.27% |
| h=4 | 19.77% | 19.92% |
| h=8 | 10.90% | **11.67%** |
| h=16 | 4.52% | **5.15%** |
| 3 divides h | 15.28% | 15.48% |

The h=1 rate continues to fall (16.7% → 15.4%). Powers of 2 are increasing (h=8: 10.9% → 11.7%, h=16: 4.5% → 5.2%), consistent with genus theory dominating at larger discriminants. Total: **30 billion discriminants** across both ranges.

**Computational details for the 27B block**: Wall-clock time was approximately 4.5 hours on 8× NVIDIA B200 (Blackwell) GPUs at ~82% average GPU utilization (measured via `nvidia-smi`). Throughput sustained at ~1.7M discriminants/sec across the cluster. Validation: a random 0.01% subsample (~2.7M discriminants) from the $[10^{10}, 10^{11})$ range was spot-checked against PARI/GP `qfbclassno()`, with exact agreement on all sampled values.

## Genus Theory Shift: Powers of 2 Redistributing

The class number distribution is dominated by powers of 2 (genus theory), and this dominance is evolving:

| h | d ~ 10^9 | d ~ 10^10 | Change |
|---|---------|----------|--------|
| 1 | 16.71% | 15.35% | -1.35% |
| 2 | 22.17% | 21.27% | -0.90% |
| 4 | 19.77% | 19.92% | +0.15% |
| 8 | 10.90% | 11.67% | +0.77% |
| 16 | 4.52% | 5.15% | +0.63% |

The h=1 and h=2 "drain" is flowing into h=8 and h=16. This is consistent with discriminants at larger d having more prime factors on average (grows as log log d), which increases the 2-rank of the class group via genus theory. The total power-of-2 share is slowly decreasing (74.1% to 73.4%), meaning odd class numbers are very gradually gaining ground.
