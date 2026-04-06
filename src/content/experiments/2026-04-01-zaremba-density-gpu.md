---
title: "Zaremba Density: Exception Sets and Phase Transitions on 8x B200"
slug: zaremba-density-gpu
date: 2026-04-01
author: cahlen
author_github: https://github.com/cahlen
status: stalled

hardware:
  name: NVIDIA DGX B200
  gpus: 8x NVIDIA B200 (183 GB VRAM each)
  gpu_interconnect: NVLink
  cpus: Intel Xeon
  ram: 1.4 TB

software:
  cuda: "12.8"
  method: DFS over continued fraction tree with bitset marking
  custom_kernel: scripts/experiments/zaremba-density/zaremba_density_gpu.cu

tags:
  domain: [number-theory, continued-fractions, diophantine-approximation, computational-mathematics]
  hardware: [b200, rtx-5090]
  method: [dfs-enumeration, bitset-marking, gpu-parallel, atomicOr]

results:
  problem: "For digit sets A, compute the density of integers d <= N with a coprime a whose CF partial quotients all lie in A"
  total_runs: 65
  range_max: "10^12"
  closed_exception_sets: 5
  findings_produced: 5
  dataset: https://huggingface.co/datasets/cahlen/zaremba-density
code: https://github.com/cahlen/idontknow/tree/main/scripts/experiments/zaremba-density
---

# Zaremba Density: Exception Sets and Phase Transitions

## What This Experiment Does

For a digit set $A \subseteq \{1, \ldots, 10\}$ and range $N$, count how many integers $d \leq N$ have a coprime $a$ with all continued fraction partial quotients of $a/d$ lying in $A$. The **density** is the fraction of $d$ that are representable; the **exception set** is the set of $d$ that are not.

The CUDA kernel enumerates all continued fractions $[a_1, a_2, \ldots]$ with $a_i \in A$ by DFS over the convergent tree. Each node corresponds to a convergent $p_n/q_n$; children are formed via $q_{n+1} = a \cdot q_n + q_{n-1}$ for each $a \in A$, pruning when $q > N$. Reachable denominators are marked in a global bitset via `atomicOr`. The CPU generates prefixes to a dynamically chosen depth, then launches one GPU thread per prefix for the remaining DFS.

## Key Results

### {1,k} Pair Hierarchy at 10^11

| $k$ | Density | Hausdorff dim |
|-----|---------|---------------|
| 2 | 80.754% | 0.531 |
| 3 | 9.109% | 0.454 |
| 4 | 1.074% | 0.397 |
| 5 | 0.256% | 0.349 |
| 6 | 0.091% | 0.309 |
| 7 | 0.041% | 0.275 |
| 8 | 0.022% | 0.246 |
| 9 | 0.013% | 0.221 |
| 10 | 0.009% | 0.199 |

Power-law fit: $\text{density}(\{1,k\}) \approx 4090 \cdot k^{-5.83}$ ($R^2 = 0.994$).

Only $\{1,2\}$ has Hausdorff dimension above $1/2$, so only $\{1,2\}$ density grows with $N$; all others converge to zero.

### Closed Exception Sets (verified to 10^11)

| Digit set | Exceptions | Stable across |
|-----------|-----------|---------------|
| $\{1,2,3\}$ | **27** | $10^9 \to 10^{10}$ |
| $\{1,2,4\}$ | **64** | $10^9 \to 10^{10}$ |
| $\{1,2,5\}$ | **374** | $10^{10} \to 10^{11}$ |
| $\{1,2,6\}$ | **1,834** | $10^{10} \to 10^{11}$ |
| $\{1,2,7\}$ | **7,178** | $10^{10} \to 10^{11}$ |

"Closed" means the exception count did not change across a full decade of extension. This is observational stability, not a proof of finiteness.

### Open Exception Sets at 10^11

| Digit set | Exceptions | Status |
|-----------|-----------|--------|
| $\{1,2,8\}$ | 23,590 | Growing |
| $\{1,2,9\}$ | 77,109 | Growing |
| $\{1,2,10\}$ | 228,514 | Growing |
| $\{1,3,5\}$ | 80,945 | Slowly converging (9.5x deceleration per decade) |

### Digit 1 Amplification

The ratio $\text{density}(\{1,k\}) / \text{density}(\{2,k\})$ grows with scale:

| $k$ | Ratio at $10^{10}$ | Ratio at $10^{11}$ | Growth |
|-----|-------------------|-------------------|--------|
| 3 | 243x | 424x | 1.74x |
| 4 | 152x | 249x | 1.64x |
| 5 | 107x | 158x | 1.48x |

## Findings Produced

1. [Density phase transition](/findings/zaremba-density-phase-transition/)
2. [Exception hierarchy](/findings/zaremba-exception-hierarchy/)
3. [Digit pair hierarchy](/findings/zaremba-digit-pair-hierarchy/)
4. [$A=\{1,2\}$ logarithmic convergence](/findings/zaremba-A12-logarithmic-convergence/)
5. [Inverse-square amplification](/findings/zaremba-inverse-square-amplification/)

## Reproduce

```bash
nvcc -O3 -arch=sm_90 -o zaremba_density_gpu scripts/experiments/zaremba-density/zaremba_density_gpu.cu -lm

# Single pair
./zaremba_density_gpu 100000000000 1,3

# All {1,k} pairs at 10^11
for k in 2 3 4 5 6 7 8 9 10; do
    CUDA_VISIBLE_DEVICES=$((k-2)) ./zaremba_density_gpu 100000000000 1,$k &
done
```

## Status

65 completed GPU runs across ranges $10^6$ to $10^{12}$. Five closed exception sets confirmed. Runs in progress at $10^{11}$ for $\{1,2,3\}$, $\{1,2,4\}$, $\{1,2,3,4\}$, $\{1,2,3,4,5\}$. The $10^{12}$ runs for $\{1,2,3\}$ through $\{1,2,7\}$ are queued.

---

*Human-AI collaboration (Cahlen Humphreys + Claude). All code and data open at [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*
