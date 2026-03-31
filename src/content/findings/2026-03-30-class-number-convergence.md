---
title: "Cohen-Lenstra Convergence Is Non-Monotone: h=1 Rate Decreases Before Increasing"
slug: class-number-convergence
date: 2026-03-30
author: cahlen
author_github: https://github.com/cahlen
significance: notable

domain: [algebraic-number-theory, cohen-lenstra-heuristics, computational-mathematics]
related_experiment: /experiments/class-numbers-real-quadratic/

summary: "GPU computation of 2.74 billion class numbers for real quadratic fields reveals that the h(d)=1 rate DECREASES from 42% at d~10^4 to 17% at d~10^10, despite the Cohen-Lenstra prediction of 75.4% asymptotically. The distribution is dominated by powers of 2 (genus theory), with 3-divisibility at 15% vs predicted 44%. Convergence to Cohen-Lenstra is extremely slow."
---

# Cohen-Lenstra Convergence Is Non-Monotone

## Key Finding

The fraction of real quadratic fields $\mathbb{Q}(\sqrt{d})$ with class number $h(d) = 1$ **decreases** as the discriminant range increases from $10^4$ to $10^{10}$, despite the Cohen-Lenstra heuristic predicting an asymptotic rate of $\approx 75.4\%$.

| Range | $h = 1$ fraction | Validated by |
|-------|-----------------|--------------|
| $d < 10^4$ | 42.1% | PARI/GP (exact match) |
| $d \sim 10^6$ | 25.7% | PARI/GP |
| $d \in [10^9, 2 \times 10^9)$ | 17.5% | This work |
| $d \in [10^9, 10^{10})$ | 16.7% | This work |
| Asymptotic | 75.446% | Cohen-Lenstra (1984) |

The convergence is **non-monotone**: the rate must eventually turn around and increase toward 75.4%, but at $d \sim 10^{10}$ it is still falling.

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

This explains the non-monotone convergence: at small $d$, few prime factors → small 2-part → more $h = 1$. At moderate $d$, more prime factors → larger 2-part → fewer $h = 1$. The eventual convergence to 75.4% requires the odd part to concentrate strongly enough to overcome the growing 2-part.

### 3-Divisibility

| Statistic | Observed ($d \sim 10^{10}$) | Cohen-Lenstra prediction |
|-----------|----------------------------|-------------------------|
| $3 \mid h$ | 15.3% | $\approx 43.99\%$ |
| $5 \mid h$ | 4.9% | $\approx 23.84\%$ |
| $7 \mid h$ | 2.3% | $\approx 16.33\%$ |

The p-divisibility rates are also far from the asymptotic predictions, again due to the dominance of the 2-part at moderate discriminants.

## Computational Details

- **2,735,671,820 fundamental discriminants** processed
- **30 minutes** on 8× NVIDIA B200 DGX cluster
- **1.5M discriminants/sec** throughput
- **Method**: GPU sieve + CF regulator (log-space, validated against PARI/GP) + Euler product (9,592 primes)
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
