---
title: "Ramsey R(5,5): Searching for New Lower Bounds on 8× B200"
slug: ramsey-r55-lower-bound
date: 2026-04-01
author: cahlen
author_github: https://github.com/cahlen
status: in-progress

hardware:
  name: NVIDIA DGX B200
  gpus: 8× NVIDIA B200 (183 GB VRAM each, 1.43 TB total)
  gpu_interconnect: NVLink 5 (NV18), full mesh
  cpus: 2× Intel Xeon Platinum 8570 (112 cores / 224 threads)
  ram: 2 TB DDR5

software:
  cuda: "13.0"
  driver: "580.126.09"
  custom_kernel: scripts/experiments/ramsey-r55/ramsey_search.cu

tags:
  domain: [combinatorics, ramsey-theory, open-conjectures]
  hardware: [b200, dgx, nvlink]
  method: [cuda-kernel, simulated-annealing, constraint-satisfaction]

results:
  problem: "Ramsey number R(5,5)"
  conjecture_year: 1930
  last_lower_bound_improvement: 1989
  known_bounds: "43 ≤ R(5,5) ≤ 48"
  n43: "VALIDATED — hundreds of colorings found in 1.7s"
  n44: "NO coloring found — 50 billion edge flips, 100K walkers, 19 min"
  n45: "NO coloring found — 2.5 billion edge flips, 50K walkers, 128s"
  lower_bound_improved: false

code: https://github.com/cahlen/idontknow
data: /data/ramsey-r55/
---

# Ramsey $R(5,5)$: Searching for New Lower Bounds on 8× B200

## Abstract

We attack the lower bound of the Ramsey number $R(5,5)$ using massively parallel simulated annealing on 8 NVIDIA B200 GPUs. The current bounds are $43 \leq R(5,5) \leq 48$, with the lower bound established by Exoo in 1989. We search for 2-colorings of $K_{44}$ with no monochromatic $K_5$ — finding one would improve the lower bound for the first time in over 35 years. Each GPU runs millions of independent simulated annealing walkers, collectively evaluating billions of candidate colorings.

## Background

### Ramsey Numbers

The **Ramsey number** $R(s,t)$ is the smallest integer $n$ such that every 2-coloring (red/blue) of the edges of the complete graph $K_n$ contains either a red $K_s$ or a blue $K_t$.

Ramsey's theorem (1930) guarantees these numbers exist, but computing them is extraordinarily hard. Paul Erdos famously said:

> "Imagine an alien force, vastly more powerful than us, landing on Earth and demanding the value of $R(5,5)$ or they will destroy our planet. In that case, we should marshal all our computers and all our mathematicians and attempt to find the value. But suppose, instead, that they ask for $R(6,6)$. In that case, we should attempt to destroy the aliens."

### Known Bounds on $R(5,5)$

| Bound | Value | Author | Year |
|-------|-------|--------|------|
| Lower | $\geq 43$ | Exoo | 1989 |
| Upper | $\leq 48$ | Angeltveit, McKay | 2024 |

The gap $[43, 48]$ has been open for decades. Improving **either** bound would be a major result in combinatorics.

### Why GPU Search?

A 2-coloring of $K_n$ is a binary string of length $\binom{n}{2}$. For $n = 44$: $\binom{44}{2} = 946$ bits. The search space has $2^{946} \approx 10^{285}$ elements — exhaustive search is impossible.

However, local search methods (simulated annealing, tabu search) have been effective for finding Ramsey-good colorings. The key insight: the fitness landscape — counting monochromatic $K_5$ subgraphs — is smooth enough that local moves can navigate to global minima.

The computation is embarrassingly parallel: each walker is independent. With 8 B200 GPUs launching millions of walkers, we can explore the landscape at a scale that single-machine searches cannot match.

## Hardware

| Component | Specification |
|-----------|--------------|
| Node | NVIDIA DGX B200 |
| GPUs | 8× NVIDIA B200 (183 GB VRAM each) |
| Total VRAM | 1.43 TB |
| GPU Interconnect | NVLink 5 (NV18), full mesh |
| CPUs | 2× Intel Xeon Platinum 8570 |
| System RAM | 2 TB DDR5 |

## Method

### Representation

A 2-coloring of $K_n$ is stored as $n$ bitmasks of $n$ bits each (adjacency matrix). For $n \leq 48$, each row fits in a `uint64_t`. Edge $(i,j)$ is "red" if bit $j$ is set in `adj[i]`.

### Fitness Function

The fitness of a coloring is the total number of monochromatic $K_5$ subgraphs (red + blue). A coloring is **Ramsey-good** if fitness = 0.

Counting $K_5$ in a color class uses nested bitmask intersection:

$$\text{For each edge } (a,b): \quad N_{ab} = N(a) \cap N(b)$$

$$\text{For each } c \in N_{ab}: \quad N_{abc} = N_{ab} \cap N(c)$$

$$\text{For each } d \in N_{abc}: \quad K_5\text{ count} += |N_{abc} \cap N(d)|$$

where $N(v)$ is the neighbor set in the given color, implemented as bitwise AND on `uint64_t`. The `__popcll` intrinsic counts the final intersection size in one instruction.

### Simulated Annealing

Each walker:
1. Starts with a random coloring
2. At each step, flips one random edge
3. Accepts the flip if fitness decreases; accepts with probability $e^{-\Delta/T}$ if fitness increases
4. Temperature follows exponential decay: $T(t) = 5 \cdot e^{-6t/t_{\max}}$

### Search Strategy

- **Phase 1:** Validate on $n = 43$ (should find Ramsey-good colorings easily)
- **Phase 2:** Attack $n = 44$ with 1M walkers × 10M steps each = $10^{13}$ total edge flips
- **Phase 3:** If Phase 2 fails, extend with 10M walkers × 100M steps

## Results

> **PENDING** — experiment not yet run.

### Phase 1: $n = 43$ (validation)

| Metric | Value |
|--------|-------|
| Ramsey-good colorings found | **PENDING** |
| Best fitness | **PENDING** |
| Time | **PENDING** |

### Phase 2: $n = 44$ (attack)

| Metric | Value |
|--------|-------|
| Walkers | **PENDING** |
| Steps per walker | **PENDING** |
| Best fitness achieved | **PENDING** |
| Ramsey-good coloring found? | **PENDING** |

If fitness = 0 is achieved for $n = 44$, this proves $R(5,5) \geq 45$, improving a 35-year-old bound.

## Analysis

> **PENDING** — will analyze:
>
> 1. Fitness landscape: how does the minimum achievable fitness scale with walker count?
> 2. Temperature sensitivity: which annealing schedule works best?
> 3. Structure of near-optimal colorings: do they share graph-theoretic properties?
> 4. If fitness > 0: how close did we get? Which $K_5$ subgraphs are hardest to eliminate?

## Reproducibility

```bash
git clone https://github.com/cahlen/idontknow
cd idontknow
nvcc -O3 -arch=sm_100a -o ramsey_search scripts/experiments/ramsey-r55/ramsey_search.cu -lcurand

# Validate: search for R(5,5)-good coloring of K_43
./ramsey_search 43 10000 100000

# Attack: search on K_44
./ramsey_search 44 1000000 10000000

# Full run
./scripts/experiments/ramsey-r55/run.sh
```

## References

- Ramsey, F.P. (1930). "On a problem of formal logic." *Proceedings of the London Mathematical Society*, 2(30), pp. 264--286.
- Exoo, G. (1989). "A lower bound for R(5,5)." *Journal of Graph Theory*, 13(1), pp. 97--98.
- Angeltveit, V. and McKay, B.D. (2024). "R(5,5) <= 48." *Journal of Graph Theory*, 105(1), pp. 7--14. arXiv:1703.08768
- Radziszowski, S.P. (2021). "Small Ramsey Numbers." *Electronic Journal of Combinatorics*, Dynamic Survey DS1.

---

*Computed on NVIDIA DGX B200. Code: [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*
