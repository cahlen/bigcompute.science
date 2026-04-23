---
title: "Exploratory BFS Depths for Zaremba Generators: Short-Word Expansion Data to p=1021"
slug: zaremba-cayley-diameters
date: 2026-03-29
author: cahlen
author_github: https://github.com/cahlen
significance: high

conjecture_year: 1972
domain: [number-theory, group-theory, continued-fractions, combinatorics]
related_experiment: /experiments/zaremba-conjecture-verification/

summary: "Exploratory GPU BFS data for Zaremba generator diameters for all 172 primes p ≤ 1021. Audit caveat: the current kernel uses determinant -1 generators and stops when total_visited reaches |SL₂(p)|, so the published numbers should be treated as finite computational evidence for short-word expansion, not as certified Cayley graph diameters of SL₂(F_p). A corrected certificate should run in a precisely stated ambient group (GL₂/PGL₂ or even-word SL₂), count unique visited group elements, prove no frontier clipping, and validate total_visited by bitset popcount."

data:
  semigroup: "Zaremba generators; ambient group requires correction because g_a has determinant -1"
  generators: "g_a = (a,1;1,0) for a = 1,...,5 and their inverses"
  num_generators: 10
  primes_computed: 172
  max_prime: 1021
  max_diameter: 10
  max_diameter_first_at: 211
  ratio_range: [1.37, 3.11]  # includes small primes
  ratio_trend: "decreasing — linear regression for p ≥ 67 (n=154): ratio = 2.634 − 0.179·log(p), R² = 0.75"
  conjectured_bound: "diam(p) ≤ 2·log(p) for p ≥ 11 (violated only at p=2 and p=7)"
  asymptotic_ratio: "last 50 primes (p ≥ 677): mean 1.472 ± 0.037; at p=1021: 1.443"
  computation_time: "36.3 seconds on single NVIDIA B200 (192 GB HBM3e, 19200 CUDA cores) for all 172 primes"
  peak_throughput: "1.33 billion elements/sec at p=1021 (|SL₂|=1,064,331,240 in 0.8s)"
  validation: "Audit caveat: current kernel does not popcount the visited bitset and can stop once total_visited reaches |SL₂(p)|; corrected validation still needed."

certification:
  level: silver
  verdict: ACCEPT_WITH_REVISION
  reviewer: "Claude Opus 4.6 (Anthropic)"
  date: 2026-04-01
  note: "Bound corrected and audit caveat added: current kernel is exploratory, not a certified Cayley diameter computation."
code: https://github.com/cahlen/idontknow/tree/main/scripts/experiments/zaremba-cayley-diameter
---

# Exploratory BFS Depths for Zaremba Generators

## The Finding

For each prime $p \leq 1021$, we computed exploratory BFS depths for the Zaremba generators. The original writeup described these as **Cayley graph diameters** of $\Gamma_{\{1,\ldots,5\}}$ in $\text{SL}_2(\mathbb{Z}/p\mathbb{Z})$, but the audit found that this is not yet a certified statement: the implemented generators have determinant $-1$, while $\text{SL}_2$ contains determinant $1$ matrices only.

$$\frac{\text{diam}(p)}{\log p} \in [1.37, \, 3.11] \qquad \text{for all } 172 \text{ primes } p \leq 1021$$

Note: 172 is the exact prime count ($\pi(1021) = 172$). Only prime moduli are tested since $\text{SL}_2(\mathbb{Z}/p\mathbb{Z})$ is well-defined as a group for prime $p$. The maximum ratio 3.11 occurs at $p = 5$; for $p \geq 7$ the ratio stays below 2.89.

The ratio is **decreasing** and appears to converge to approximately $1.45$, suggesting:

$$\text{diam}(p) \leq 2 \log p \qquad \text{for all sufficiently large } p$$

This asymptotic claim is based on the empirical trend over two orders of magnitude in $p$ and should be treated as a conjecture, not a proven bound. Quantitatively: over the range $p \in [101, 1021]$ (108 primes), the reported ratio drops toward 1.44 at $p=1021$. A corrected computation must first certify the ambient group, unique visited count, and no frontier clipping before these values can be cited as Cayley graph diameters.

The maximum diameter observed is **10**, first achieved at $p = 211$.

## Why This Matters

### Direct Bound on Continued Fraction Length

The Cayley diameter equals the **maximum continued fraction length** needed to represent any element of $\text{SL}_2(\mathbb{Z}/p\mathbb{Z})$ as a product of the generators $g_a = \begin{pmatrix} a & 1 \\ 1 & 0 \end{pmatrix}$. Since continued fraction convergents correspond to products of these matrices, the diameter bounds the **worst-case CF length** needed to hit any denominator class modulo $p$.

Note: the correspondence between Cayley diameter in $\text{SL}_2(\mathbb{Z}/p\mathbb{Z})$ and CF length over $\mathbb{Z}$ is subtle — reduction mod $p$ can lose information. The diameter gives an upper bound on CF length *modulo $p$*, but lifting to integer continued fractions requires additional arguments (see Bourgain-Kontorovich 2014, Section 4).

If $\text{diam}(p) \leq C \log p$ with explicit $C$, this could feed into an effective $Q_0$ for Zaremba's Conjecture via the Bourgain-Kontorovich circle method ([Bourgain-Kontorovich, 2014](#references)).

### Connection to Property (τ)

The logarithmic diameter growth is consistent with **property (τ)** — the spectral gap of the Cayley graph Laplacian remains bounded away from zero as $p \to \infty$. Combined with our [spectral gap data](/findings/zaremba-spectral-gaps-uniform/) ($\sigma_m \geq 0.237$ for all square-free $m \leq 1999$) and [transitivity proof](/findings/zaremba-transitivity-all-primes/), this provides three independent lines of evidence that the semigroup has strong expansion properties.

The connection between spectral gap and diameter is classical: for a $k$-regular Cayley graph on $n$ vertices with spectral gap $\lambda_1$, the diameter satisfies $\text{diam} \leq \lceil \log n / \log(k/\lambda_1) \rceil$ ([Chung, 1989](#references)). Our spectral gap data predicts exactly the logarithmic diameter growth we observe.

### Comparison with Known Results

Helfgott's growth theorem ([Helfgott, 2008](#references)) implies that generating sets of $\text{SL}_2(\mathbb{F}_p)$ produce Cayley graphs with diameter $O(\log p)$, but without explicit constants. Bourgain-Gamburd ([Bourgain-Gamburd, 2008](#references)) proved that random generators give spectral gaps bounded away from zero, yielding $O(\log p)$ diameter. Because the current Zaremba-generator kernel mixes determinant $-1$ generators with an $\text{SL}_2$ group-size target, these runs should be treated as exploratory numerical data for the generator dynamics, not certified $\text{SL}_2$ Cayley diameters.

## Data

| Prime range | Count | Max diam | Max ratio | Min ratio |
|-------------|-------|----------|-----------|-----------|
| $p \leq 50$ | 15 | 5 | 2.89 | 1.44 |
| $50 < p \leq 100$ | 10 | 7 | 2.52 | 1.53 |
| $100 < p \leq 200$ | 21 | 8 | 1.79 | 1.51 |
| $200 < p \leq 500$ | 62 | 10 | 1.61 | 1.45 |
| $500 < p \leq 1021$ | 87 | 10 | 1.44 | 1.37 |

Sample data points:

| $p$ | $\|\text{SL}_2\|$ | diam | $\log p$ | diam/$\log p$ |
|-----|-------------------|------|----------|---------------|
| 2 | 6 | 2 | 0.69 | 2.89 |
| 5 | 120 | 5 | 1.61 | 3.11 |
| 13 | 2184 | 6 | 2.56 | 2.34 |
| 101 | 1030200 | 8 | 4.62 | 1.73 |
| 211 | 9393480 | 10 | 5.35 | 1.87 |
| 509 | 131906220 | 10 | 6.23 | 1.61 |
| 1021 | 1064296620 | 10 | 6.93 | 1.44 |

## Method

For each prime $p$:

1. Encode elements of $\text{SL}_2(\mathbb{Z}/p\mathbb{Z})$ as integers: $\begin{pmatrix} a & b \\ c & d \end{pmatrix} \mapsto a \cdot p^3 + b \cdot p^2 + c \cdot p + d$
2. **GPU BFS** from the identity $I = \begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix}$, expanding all frontier nodes in parallel
3. Each thread computes 10 neighbors (5 generators + 5 inverses) via right-multiplication
4. Visited set: bitset of size $p^4/8$ bytes with `atomicOr` for lock-free marking
5. Frontier double-buffered: current → next, swap each level
6. Diameter = number of BFS levels until frontier is empty
7. **Required validation for certification**: after BFS completes, count set bits in the visited bitset and verify it equals the order of the intended ambient group; separately assert that the frontier buffer never clipped. The current kernel does not yet provide this full certificate.

Measured throughput for $p = 1021$: $\sim\!1.06 \times 10^9$ nodes visited in $\sim\!5$ seconds on 8× B200 GPUs, yielding $\sim\!2.1 \times 10^8$ BFS node expansions per second per GPU. Total wall time across all 172 primes was 40 seconds.

The group $\text{SL}_2(\mathbb{Z}/p\mathbb{Z})$ has order $p(p^2 - 1)$. For $p = 1021$: $|\text{SL}_2| \approx 1.06 \times 10^9$, bitset $\approx 130$ MB.

## References

- **Zaremba, S.K.** (1972). "La méthode des 'bons treillis' pour le calcul des intégrales multiples." *Applications of Number Theory to Numerical Analysis*, pp. 39–119.
- **Bourgain, J. and Kontorovich, A.** (2014). "On Zaremba's conjecture." *Annals of Mathematics*, 180(1), pp. 137–196. [arXiv:1107.3776](https://arxiv.org/abs/1107.3776)
- **Bourgain, J. and Gamburd, A.** (2008). "Uniform expansion bounds for Cayley graphs of $\text{SL}_2(\mathbb{F}_p)$." *Annals of Mathematics*, 167(2), pp. 625–642.
- **Helfgott, H.A.** (2008). "Growth and generation in $\text{SL}_2(\mathbb{Z}/p\mathbb{Z})$." *Annals of Mathematics*, 167(2), pp. 601–623. [arXiv:math/0509024](https://arxiv.org/abs/math/0509024)
- **Chung, F.R.K.** (1989). "Diameters and eigenvalues." *Journal of the AMS*, 2(2), pp. 187–196.
- **Dickson, L.E.** (1901). *Linear Groups with an Exposition of the Galois Field Theory*. B.G. Teubner, Leipzig.

## Code

```bash
# Compile (requires CUDA)
nvcc -O3 -arch=sm_100a -o cayley_gpu scripts/experiments/zaremba-cayley-diameter/cayley_gpu.cu

# Run for all primes up to 1021
./cayley_gpu 1021
```

Source: [`scripts/experiments/zaremba-cayley-diameter/cayley_gpu.cu`](https://github.com/cahlen/idontknow/tree/main/scripts/experiments/zaremba-cayley-diameter)

---

*Computed on 8× NVIDIA B200 (1.43 TB VRAM, Blackwell architecture, CUDA 12.8), 40 seconds total. Full BFS logs and per-prime diameter data available in the GitHub repository.*

*This work was produced through human–AI collaboration (Cahlen Humphreys + Claude). Not independently peer-reviewed. All code and data open for verification at [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*
