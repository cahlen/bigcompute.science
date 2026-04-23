---
title: "Zaremba Exception Hierarchy: 27 → 2 → 0 as Digits Grow"
slug: zaremba-exception-hierarchy
date: 2026-03-31
author: cahlen
author_github: https://github.com/cahlen
significance: notable

domain: [number-theory, continued-fractions, diophantine-approximation]
related_experiment: /experiments/zaremba-conjecture-verification/

summary: "Corrected 2026-04-23 audit: the 27 uncovered denominators for A={1,2,3} through the completed 10^10 run are 6,20,28,38,42,54,96,150,156,164,216,228,318,350,384,558,770,876,1014,1155,1170,1410,1870,2052,2370,5052,6234. Adding digit 4 covers 25 of these, leaving only d=54 and d=150; adding digit 5 covers those two. The hierarchy 27→2→0 is a finite-range computational decomposition, not an analytic proof that no further {1,2,3} exceptions occur beyond the completed search range."
certification:
  level: bronze
  verdict: ACCEPT_WITH_REVISION
  reviewer: "GPT-5.2 audit (OpenAI)"
  date: 2026-04-23
  note: "Page rewritten after audit found a stale/corrupted exception list and obsolete hardware/method claims."
---

# Zaremba Exception Hierarchy: 27 → 2 → 0

## The Finding

For the digit set $A=\{1,2,3\}$, the completed CPU/GPU logs in this repository show exactly 27 uncovered denominators through $10^{10}$, all at most $6{,}234$:

$$6, 20, 28, 38, 42, 54, 96, 150, 156, 164, 216, 228, 318, 350, 384, 558, 770, 876, 1014, 1155, 1170, 1410, 1870, 2052, 2370, 5052, 6234.$$

Adding digit 4 resolves 25 of the 27. The only two remaining uncovered denominators for $A=\{1,2,3,4\}$ are:

$$54,\quad 150.$$

Adding digit 5 covers both, so the finite-range hierarchy is:

| Digit set | Uncovered among the 27 | Interpretation |
|-----------|-------------------------|----------------|
| $\{1,2,3\}$ | 27 | Not covered through the completed $10^{10}$ run |
| $\{1,2,3,4\}$ | 2 | Only $54$ and $150$ remain |
| $\{1,2,3,4,5\}$ | 0 | All 27 are covered |

This is a computational decomposition of a finite list. It does **not** prove that $A=\{1,2,3\}$ has no further exceptions beyond the completed search range.

## Verification

The local CPU reference implementation reproduces the 27 exceptions at $10^6$:

```bash
gcc -O3 -o zaremba_density scripts/experiments/zaremba-density/zaremba_density.c -lm
./zaremba_density 1000000 1,2,3
```

The committed GPU log `scripts/experiments/zaremba-density/results/gpu_A123_1e9.log` records the same 27 exceptions at $10^9`, and the density phase-transition finding records the completed $10^{10}$ run.

## Witnesses After Adding Digit 4

One witness numerator for each resolved denominator is listed below. Each row means $a/d = [0; a_1,\ldots,a_k]$ with every partial quotient in $\{1,2,3,4\}$.

| $d$ | $a$ | Continued fraction |
|---:|---:|---|
| 6 | 5 | $[0;1,4,1]$ |
| 20 | 11 | $[0;1,1,4,1,1]$ |
| 28 | 17 | $[0;1,1,1,1,4,1]$ |
| 38 | 21 | $[0;1,1,4,3,1]$ |
| 42 | 23 | $[0;1,1,4,1,2,1]$ |
| 96 | 53 | $[0;1,1,4,3,2,1]$ |
| 156 | 97 | $[0;1,1,1,1,1,4,3,1]$ |
| 164 | 103 | $[0;1,1,1,2,4,1,2,1]$ |
| 216 | 137 | $[0;1,1,1,2,1,3,4,1]$ |
| 228 | 139 | $[0;1,1,1,1,3,1,1,4,1]$ |
| 318 | 197 | $[0;1,1,1,1,1,2,4,1,1,1]$ |
| 350 | 207 | $[0;1,1,2,4,3,1,2,1]$ |
| 384 | 235 | $[0;1,1,1,1,2,1,2,1,4,1]$ |
| 558 | 347 | $[0;1,1,1,1,1,4,2,1,3,1]$ |
| 770 | 479 | $[0;1,1,1,1,1,4,1,2,1,1,1,1]$ |
| 876 | 559 | $[0;1,1,1,3,4,2,2,2,1]$ |
| 1014 | 629 | $[0;1,1,1,1,1,2,1,2,2,4,1]$ |
| 1155 | 713 | $[0;1,1,1,1,1,1,2,2,4,2,1]$ |
| 1170 | 751 | $[0;1,1,1,3,1,4,2,3,1,1]$ |
| 1410 | 877 | $[0;1,1,1,1,1,4,1,1,3,1,2,1]$ |
| 1870 | 1159 | $[0;1,1,1,1,1,2,2,1,2,4,1,1]$ |
| 2052 | 1265 | $[0;1,1,1,1,1,1,4,1,4,1,3,1]$ |
| 2370 | 1441 | $[0;1,1,1,1,4,2,1,1,3,4,1]$ |
| 5052 | 3115 | $[0;1,1,1,1,1,1,4,3,3,2,2,1]$ |
| 6234 | 3845 | $[0;1,1,1,1,1,1,3,1,1,1,2,4,2,1]$ |

## The Two Stubborn Exceptions

For $d=54$ and $d=150$, exhaustive search over coprime numerators shows no representation with all partial quotients in $\{1,2,3,4\}$. Allowing digit 5 gives representations, for example:

| $d$ | $a$ | Continued fraction |
|---:|---:|---|
| 54 | 35 | $[0;1,1,1,5,2,1]$ |
| 150 | 91 | $[0;1,1,1,1,5,2,1,1]$ |

These two denominators are therefore the hardest elements of the observed 27-exception list.

## References

1. Zaremba, S.K. (1972). "La méthode des bons treillis." *Applications of Number Theory to Numerical Analysis*, pp. 39–119.
2. Bourgain, J. and Kontorovich, A. (2014). "On Zaremba's conjecture." *Annals of Mathematics*, 180(1), pp. 137–196.
3. Hensley, D. (1996). "A polynomial time algorithm for the Hausdorff dimension of continued fraction Cantor sets." *Journal of Number Theory*, 58(1), pp. 9–45.

---

*This work was produced through human-AI collaboration. Not independently peer-reviewed. All code and data are open for verification at [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*
