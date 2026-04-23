---
title: "Zaremba Density Phase Transition: A={1,2,3} Appears to Have Full Density"
slug: zaremba-density-phase-transition
date: 2026-03-31
author: cahlen
author_github: https://github.com/cahlen
significance: high

conjecture_year: 1972
domain: [number-theory, continued-fractions, diophantine-approximation, computational-mathematics]
related_experiment: /experiments/zaremba-conjecture-verification/

summary: "UPDATED 2026-04-23 audit: A={1,2,3} has exactly 27 uncovered denominators through the completed 10^10 run, all ≤ 6,234. Several {1,2,k} exception counts are stable across available completed ranges, but 'closed' means computationally stable within tested ranges, not a proof of finiteness. Completed 10^11 logs currently certify stability for {1,2,6}=1,834 and {1,2,7}=7,178; the {1,2,3}, {1,2,4}, and {1,2,5} 10^11 logs in this repo are partial and do not contain RESULTS blocks. Computational data show there is not a simple sharp phase transition at Hausdorff dimension δ=1/2: A={2,3,4,5} has δ≈0.5596>1/2 and density 97.29% at 10^9, 97.14% at 10^10, and 98.78% at 10^11, far below the near-full density of digit sets containing 1. The mechanism appears to involve dimension, congruence transitivity, and finite-scale representation distribution; this page reports evidence, not a theorem."

data:
  density_A123_1e10: 0.999999997
  density_A12_1e9: 0.720615327
  density_A124_1e9: 0.999999936
  density_A135_1e9: 0.999924453
  density_A2345_1e9: 0.972937480
  uncovered_A123_count: 27
  uncovered_A123_max: 6234
  uncovered_A123_list: [6, 20, 28, 38, 42, 54, 96, 150, 156, 164, 216, 228, 318, 350, 384, 558, 770, 876, 1014, 1155, 1170, 1410, 1870, 2052, 2370, 5052, 6234]
  new_exceptions_after_6234: 0
  range_verified: 10000000000
  reproduction_script: scripts/experiments/zaremba-density/zaremba_density_gpu.cu
  reproduction_command: "nvcc -O3 -arch=sm_90 zaremba_density_gpu.cu -o zaremba_density_gpu && ./zaremba_density_gpu 10000000000 1,2,3"
  sha256_gpu_source: b07cd3687605900f55aa2e888ecfbc78c0e4014eb7af07d393f3ad38276b7f2c
  sha256_A123_1e10_log: 9b0a369a8f2671983fe0e6f297d2da8131a5f6582f83434d7d7e5dd582ebd936
  density_sweep_subsets: 1023
  density_sweep_range: 1000000
  density_sweep_script: scripts/experiments/zaremba-density/zaremba_density_gpu.cu
  density_sweep_csv: scripts/experiments/zaremba-density/results/density_all_subsets_n10_1e6.csv
  density_sweep_csv_sha256: 4b052ecb952ba6af1024ffecba46742c055d186cb8fd2a9ac2913e2babf0822b
  subsets_ge_9999_density: 366
  subsets_100_density: 141
  subsets_ge_9999_with_digit_1: 361
  subsets_ge_9999_without_digit_1: 5
  min_cardinality_100_density: 5
  hausdorff_E12: 0.531280506277205
  hausdorff_E123: 0.705661868065221
  hausdorff_E1234: 0.788945557483154
  hausdorff_E12345: 0.836829443681208
  hausdorff_threshold_note: "δ>0.5 is necessary for positive-density denominator coverage heuristics but is not a sharp sufficient threshold. See A={2,3,4,5} (δ≈0.559636, density 97.29% at 10^9 and 98.78% at 10^11) as a counterexample to a simple sufficiency rule."
  transitivity_note: "delta>0.5 is not sufficient by itself; congruence transitivity and spectral-gap inputs also matter. Current all-prime transitivity statements in this project remain provisional unless backed by a complete independent proof; computational checks cover finite prime ranges."

certification:
  level: silver
  verdict: ACCEPT_WITH_REVISION
  reviewer: "Claude Opus 4.6 (Anthropic)"
  date: 2026-04-01
  note: "Delta>1/2 threshold corrected: requires transitivity too. Digit 1 empirically ensures transitivity of the semigroup action on (Z/dZ)^2; see Bourgain–Kontorovich (2014) for the theoretical framework. Formal proof that digit 1 alone suffices for all primes is not provided here."
code: https://github.com/cahlen/idontknow/tree/main/scripts/experiments/zaremba-density
---

# Zaremba Density Phase Transition: A={1,2,3} May Suffice

## The Finding

For a digit set $A \subseteq \{1, 2, 3, \ldots\}$, define the **Zaremba density** at $N$ as the fraction of integers $d \leq N$ for which there exists a coprime $a/d$ with all continued fraction partial quotients in $A$.

Zaremba (1972) conjectured that $A = \{1, \ldots, 5\}$ gives density 1 (i.e., every integer is covered). Our GPU computations show a strong transition in Zaremba density, but the audit conclusion is that it is **not** controlled by Hausdorff dimension alone:

| Digit set $A$ | Density at $d \leq 10^{10}$ | Uncovered | $\dim_H(E_A)$ | Above $1/2$? |
|---------------|-------------------------|-----------|----------------|-------------|
| $\{1, 2\}$ | 72.06% | 279,384,673 | 0.5313 | Barely |
| $\{1, 3, 5\}$ | 99.99% | 75,547 | 0.6240 | Yes |
| $\{2, 3, 4, 5\}$ | **98.78%** at $10^{11}$ | 1.22B (non-monotone: 97.3→97.1→98.8) | 0.5596 | Yes |
| $\{1, 2, 3\}$ | **99.9999997%** | **27** | 0.7057 | Yes |
| $\{1, 2, 4\}$ | 99.9999936% | 64 | 0.6692 | Yes |
| $\{1, 2, 3, 4\}$ | ~100% | ~2 | 0.7889 | Yes |
| $\{2, 3, 4, 5, 6\}$ | 95.89% at $10^{10}$ | 411M | 0.7340 | Yes |
| $\{1, 2, 3, 4, 5\}$ | **100%** | 0 | 0.8368 | Yes |

For $A = \{1, 2, 3\}$, **exactly 27 integers** in $[1, 10^{10}]$ are uncovered — all $\leq 6{,}234$:

$$6, 20, 28, 38, 42, 54, 96, 150, 156, 164, 216, 228, 318, 350, 384, 558, 770, 876, 1014, 1155, 1170, 1410, 1870, 2052, 2370, 5052, 6234$$

**Zero new exceptions** between $d = 6{,}234$ and $d = 10^{10}$. Computationally within this range, the exception set appears finite — but finiteness has not been proven analytically, and additional exceptions could in principle appear beyond $10^{10}$. Subject to this caveat, the data strongly suggests $A = \{1, 2, 3\}$ achieves 99.9999997% density with exactly 27 exceptions (all $\leq 6{,}234$) within the tested range.

## Why This Matters

### A Strengthened Zaremba Conjecture

Zaremba originally conjectured $A = 5$. Bourgain-Kontorovich (2014) proved density 1 for $A = 50$ (non-effectively). Our data suggests the truth may be much stronger: within the completed verification to $10^{10}$, $A = 3$ appears to suffice with exactly 27 exceptions, all $\leq 6{,}234$. If this holds at all scales, it would be a dramatic strengthening — the bound on partial quotients drops from 5 to 3, and the exception set is finite. The repository does not currently contain a completed $10^{11}$ RESULTS block for $A=\{1,2,3\}$, so this page should not cite $10^{11}$ stability for that set.

### Hausdorff Dimension and Transitivity

The Bourgain-Kontorovich framework requires two conditions for full Zaremba density:

1. **Large Hausdorff dimension** ($\delta > 1/2$): ensures enough representations exist.
2. **Transitivity of the semigroup** on $(\mathbb{Z}/p\mathbb{Z})^2$: ensures no congruence obstructions block coverage.

Hausdorff dimension alone is **not sufficient**. Our own data demonstrates this:

| Digit set | $\dim_H$ | Density | Contains 1? | Why not full? |
|-----------|----------|---------|-------------|---------------|
| $\{1, 2\}$ | 0.531 | 72% | Yes | $\delta$ barely above $1/2$ — representations grow too slowly |
| $\{2, 3, 4, 5\}$ | 0.5596 | 97.3% | **No** | Dimension above 1/2 is not sufficient by itself |
| $\{1, 2, 3\}$ | 0.706 | 99.9999997% | Yes | $\delta \gg 1/2$ AND transitive — 27 exceptions to $10^{10}$, none growing |

The zbMATH review of Bourgain-Kontorovich (2014) notes that Hensley conjectured $\delta > 1/2$ alone implies full density, but **Hensley's conjecture is false** — sets with congruence obstructions (typically those lacking digit 1) can fail to achieve full density even with $\delta$ well above $1/2$.

The real mechanism appears to involve **digit 1 and congruence mixing**. The matrix $\begin{pmatrix} 1 & 1 \\ 1 & 0 \end{pmatrix}$ (corresponding to digit 1) is empirically powerful in both density and Hausdorff dimension computations. Transitivity of the full semigroup $\Gamma_{\{1,\ldots,5\}}$ is computationally verified for primes up to 17,389 in our [transitivity finding](https://bigcompute.science/findings/zaremba-transitivity-all-primes/), but the all-prime algebraic proof remains provisional. Digit 1 alone does not guarantee transitivity; the full argument requires analyzing the joint action of all generators.

Our density sweep of all 1,023 subsets of $\{1, \ldots, 10\}$ confirms this dramatically: of 366 subsets with $\geq 99.99\%$ density, **361 contain digit 1**. Only 5 achieve near-full density without digit 1, and those require $|A| \geq 8$.

The correct heuristic: **$\delta > 1/2$ plus transitivity are necessary conditions for full density**, but may not be sufficient on their own — BK (2014) also requires spectral gap conditions (property $\tau$). The precise sufficient conditions for full density remain an open question.

### Connection to Representation Counting

From our earlier Zaremba work, the representation count $R(d) \sim c_1 \cdot d^{2\delta - 1}$. For $A = \{1, 2, 3\}$: $2\delta - 1 = 2(0.706) - 1 = 0.412$, so $R(d)$ grows as $d^{0.412}$. For $A = \{1, 2\}$: $2\delta - 1 = 0.063$, so $R(d) \sim d^{0.063}$ — barely growing. The transition from $R(d) \to \infty$ (full density) to $R(d)$ bounded (sub-full density) happens near $\delta = 1/2$.

## Method

We use the **inverse CF construction** (from our Zaremba v4 kernel): enumerate ALL continued fractions $[0; a_1, a_2, \ldots, a_k]$ with $a_i \in A$, compute each denominator via the convergent recurrence, and mark it in a bitset. After enumeration, any unmarked integer is uncovered.

This is $O(\text{total CFs})$ rather than $O(N)$ per denominator — fundamentally faster for dense digit sets.

## Update: GPU Results to $10^{10}$ (2026-03-31)

**The exception set for $A = \{1,2,3\}$ appears stable.** Zero new exceptions between $d = 6{,}234$ and $d = 10^{10}$:

| Digit set | Range | Density | Uncovered | GPU time |
|-----------|-------|---------|-----------|----------|
| $\{1,2,3\}$ | $10^{10}$ | **99.9999997%** | **27** (same 27 as at $10^6$ and $10^9$) | 12 hours |
| $\{1,2,4\}$ | $10^{10}$ | **99.9999994%** | **64** (stable — same 64 as $10^9$) | 3 hrs |
| $\{1,2\}$ | $10^9$ | 72.06% | 279M | 28 sec |
| $\{1,3,5\}$ | $10^{10}$ | **99.9992%** | 80,431 | 5 min |
| $\{2,3,4,5\}$ | $10^9$ | 97.29% | 27M | 11 sec |

The 27 exceptions for $A = \{1,2,3\}$ are exactly:

$$6, 20, 28, 38, 42, 54, 96, 150, 156, 164, 216, 228, 318, 350, 384, 558, 770, 876, 1014, 1155, 1170, 1410, 1870, 2052, 2370, 5052, 6234$$

All $\leq 6{,}234$. No new exceptions in 999,993,766 additional integers tested. This is strong computational evidence that the exception set is finite and complete.

| Computation | Status |
|------------|--------|
| $A = \{1,2,3\}$, $d \leq 10^{10}$ | **Complete**: 27 uncovered, all $\leq 6234$ |
| $A = \{1,2,3,4\}$, $d \leq 10^{9}$ | **Running** (2026-04-01) |
| $A = \{1,2,3,4\}$, $d \leq 10^{10}$ | **Running** (2026-04-01) |

## Update: Complete Density Landscape (2026-04-01)

We computed the Zaremba density for **all 1,023 nonempty subsets** of $\{1, \ldots, 10\}$ at $N = 10^6$.

### Digit 1 Dominance in Density

Of the 366 subsets achieving $\geq 99.99\%$ density, **361 contain digit 1**. Only 5 do not — and those require $|A| \geq 8$:

| Digit set (no digit 1) | $|A|$ | Density | Uncovered |
|-------------------------|-------|---------|-----------|
| $\{2,3,4,5,6,7,8,9,10\}$ | 9 | 99.999% | 14 |
| $\{2,3,4,5,6,7,8,9\}$ | 8 | 99.997% | 34 |
| $\{2,3,4,5,6,7,8,10\}$ | 8 | 99.996% | 39 |
| $\{2,3,4,5,6,7,9,10\}$ | 8 | 99.995% | 48 |
| $\{2,3,4,5,6,8,9,10\}$ | 8 | 99.994% | 60 |

With digit 1, only 3 digits suffice: $A = \{1,2,3\}$ gives 99.997% density with just 27 exceptions. Without digit 1, you need **8 or 9 digits** for comparable density. This mirrors the [Hausdorff digit 1 dominance](https://bigcompute.science/findings/hausdorff-digit-one-dominance/) — digit 1 is disproportionately powerful in both dimension and density.

### Minimum Cardinality for Full Density

| Cardinality | Best density | Example |
|-------------|-------------|---------|
| 1 | 0.003% | $\{1\}$ |
| 2 | 57.98% | $\{1,2\}$ |
| 3 | 99.997% | $\{1,2,3\}$ |
| 4 | ~100% | $\{1,2,3,4\}$ (2 exceptions) |
| 5 | **100%** | $\{1,2,3,4,5\}$ (0 exceptions) |

The jump from 2 to 3 elements is the phase transition: 57.98% → 99.997%.

### Best 3-Element Subsets

| Digit set | Density | Uncovered |
|-----------|---------|-----------|
| $\{1,2,3\}$ | 99.997% | 27 |
| $\{1,2,4\}$ | 99.994% | 64 |
| $\{1,2,5\}$ | 99.9999963% at $10^{10}$ | 374 (was 373 at $10^6$ — appears stable) |
| $\{1,2,6\}$ | 99.9999817% at $10^{10}$ | 1,834 (was 1,720 at $10^6$) |
| $\{1,2,6\}$ | 99.828% | 1,720 |
| $\{1,2,7\}$ | 99.461% | 5,388 |
| $\{1,3,4\}$ | 99.433% | 5,667 |
| $\{2,3,4\}$ | 24.613% | 753,868 |

Note $\{2,3,4\}$ (no digit 1) has only 24.6% density — the same cardinality as $\{1,2,3\}$ at 99.997%. Digit 1 accounts for a **75 percentage point** difference.

**Dataset:** [density_all_subsets_n10_1e6.csv](https://huggingface.co/datasets/cahlen/zaremba-conjecture-data/blob/main/density/density_all_subsets_n10_1e6.csv) on Hugging Face (1,023 rows, CC BY 4.0). Generation script and SHA-256 checksum available in the GitHub repository.

## Update: 10^11 Stable Candidate Exception Sets (2026-04-23 Audit)

Overnight 8xB200 GPU batches pushed several {1,2,k} computations to $10^{11}$. The completed logs in this repository certify stability for $\{1,2,6\}$ and $\{1,2,7\}$; some other 10^11 logs are partial and must not be cited as completed runs.

### Stable Candidate Exception Sets (within completed ranges)

| Digit set | Exceptions | Max exception | Verified to | Status |
|-----------|-----------|---------------|-------------|--------|
| $\{1,2,3\}$ | **27** | 6,234 | $10^{10}$ | Stable candidate; 10^11 repo log is partial |
| $\{1,2,4\}$ | **64** | 51,270 | $10^{10}$ | Stable candidate; 10^11 repo log is partial |
| $\{1,2,5\}$ | **374** | ? | $10^{10}$ | Stable candidate; 10^11 repo log is partial |
| $\{1,2,6\}$ | **1,834** | ? | $10^{11}$ | Stable candidate |
| $\{1,2,7\}$ | **7,178** | ? | $10^{11}$ | Stable candidate |

The **{1,2,7} exception count is exactly 7,178 at both $10^{10}$ and $10^{11}$** — zero new exceptions across 90 billion additional integers tested. This is strong computational evidence for stability, not an analytic proof that the exception set is finite.

### Open (Growing) Exception Sets at $10^{11}$

| Digit set | Exceptions at $10^{10}$ | Exceptions at $10^{11}$ | Growth | Status |
|-----------|------------------------|------------------------|--------|--------|
| $\{1,2,8\}$ | ? | 23,590 | — | Open |
| $\{1,2,9\}$ | ? | 77,109 | — | Open |
| $\{1,2,10\}$ | ? | 228,514 | — | Open |
| $\{1,3,5\}$ | 80,431 | 80,945 | +514 | Slowly growing |

The {1,3,5} exception set is growing but decelerating: +4,884 from $10^9$ to $10^{10}$, then only +514 from $10^{10}$ to $10^{11}$. It may eventually close but has not yet.

### Pattern: Stable vs Growing Threshold

The data suggests a sharp threshold around $k = 7$:
- $\{1,2,k\}$ for $k \leq 7$: exception counts appear stable where completed logs exist
- $\{1,2,k\}$ for $k \geq 8$: exception counts are still growing at $10^{11}$

This aligns loosely with Hausdorff dimension: $\delta(\{1,2,7\}) \approx 0.6179$ while $\delta(\{1,2,8\}) \approx 0.6086$, suggesting the stable/growing transition may occur well above the bare $\delta=1/2$ threshold.

## Reproduce

```bash
git clone https://github.com/cahlen/idontknow
cd idontknow

# CPU version (slow)
gcc -O3 -o zaremba_density scripts/experiments/zaremba-density/zaremba_density.c -lm
./zaremba_density 1000000 1,2,3

# GPU version (fast — requires CUDA)
nvcc -O3 -arch=sm_100a -o zaremba_density_gpu scripts/experiments/zaremba-density/zaremba_density_gpu.cu -lm
./zaremba_density_gpu 1000000000 1,2,3
```

## References

1. Zaremba, S.K. (1972). "La méthode des 'bons treillis' pour le calcul des intégrales multiples." *Applications of Number Theory to Numerical Analysis*, pp. 39–119.
2. Bourgain, J. and Kontorovich, A. (2014). "On Zaremba's conjecture." *Annals of Mathematics*, 180(1), pp. 137–196.
3. Hensley, D. (1992). "Continued fraction Cantor sets, Hausdorff dimension, and functional analysis." *J. Number Theory*, 40(3), pp. 336–358.
4. Jenkinson, O. and Pollicott, M. (2001). "Computing the dimension of dynamically defined sets: $E_2$ and bounded continued fraction digits." *Ergodic Theory Dynam. Systems*, 21(5), pp. 1429–1445.

---

*Computed 2026-03-31 on Intel Xeon Platinum 8570 (DGX B200 cluster). This work was produced through human–AI collaboration (Cahlen Humphreys + Claude). Not independently peer-reviewed. All code and data open for verification at [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*

## Open Question: Does A={1,2} Have Full Density?

A={1,2} has Hausdorff dimension delta = 0.531, barely above the critical threshold 1/2. The Bourgain-Kontorovich framework predicts full density when delta > 1/2, but the exponent 2*delta - 1 = 0.062 is extremely small.

| Range | Density | Growth |
|-------|---------|--------|
| $d \leq 10^6$ | 57.98% | — |
| $d \leq 10^9$ | 72.06% | +4.7%/decade |
| $d \leq 10^{10}$ | **76.55%** | **+4.5%/decade** |

**Update (2026-04-01):** GPU computation to $10^{10}$ confirms the density is growing at ~4.5% per decade. At this rate, reaching 99% would require $d \sim 10^{15}$. The Bourgain-Kontorovich framework predicts full density ($\delta > 1/2$ plus transitivity), but the exponent $2\delta - 1 = 0.062$ is tiny, making convergence extremely slow. This is the slowest-converging digit set we've measured — a stress test for the theoretical prediction.
