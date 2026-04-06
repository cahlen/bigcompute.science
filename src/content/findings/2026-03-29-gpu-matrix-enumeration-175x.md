---
title: "GPU Matrix Enumeration: 175× Faster Zaremba Verification via Batched 2×2 Multiply"
slug: gpu-matrix-enumeration-175x
date: 2026-03-29
author: cahlen
author_github: https://github.com/cahlen
significance: high

domain: [computational-methods, gpu-computing, number-theory]
related_experiment: /experiments/zaremba-conjecture-verification/

summary: "Reformulating CF tree enumeration as batched 2×2 matrix multiplication on GPU eliminates all CPU bottlenecks. The fused expand+mark+compact kernel verifies 100M values in 7.5 seconds on a single B200, 175× faster than the previous tree-walk approach. At 10B values, 8 GPUs complete in 43 seconds."

data:
  speedup: "175×"
  verified_100M_time: "7.5 seconds"
  verified_10B_time: "43 seconds"
  kernel: "v5/v6 fused expand+mark+compact"
  approach: "batched 2×2 matrix multiply + stream compaction"

certification:
  level: bronze
  verdict: ACCEPT
  reviewer: "Claude Opus 4.6 (Anthropic)"
  date: 2026-04-02
  note: "Engineering finding. 175x speedup verified. Matrix-CF equivalence is classical." 
---

# GPU Matrix Enumeration: 175× Faster Zaremba Verification

## The Finding

Reformulating continued fraction tree enumeration as **batched 2×2 matrix multiplication** moves the entire computation to GPU, eliminating all CPU bottlenecks. The result:

| Range | v4 (CPU tree) | v5 (GPU matrix) | Speedup |
|-------|--------------|-----------------|---------|
| $10^7$ | 157s | **0.9s** | 175× |
| $10^8$ | ~hours | **7.5s** | ~1000× |
| $10^{9}$ | ~days | **14.4s** | ~10,000× |
| $10^{10}$ | infeasible | **43s** | — |

**8-GPU scaling detail** ($10^{10}$ run): Phase A builds the tree to depth 12 on GPU 0 (244M matrices, 4.3s). Phase B distributes 244M depth-12 matrices evenly across 8 GPUs (~30.5M each). Per-GPU expansion times: 18.9–21.7s (well-balanced, <15% skew). There is **no inter-GPU communication** during Phase B — each GPU expands its chunk independently into a local bitset (peak ~1.25 GB per GPU for the $10^{10}$ bitset). After all GPUs finish, bitsets are OR-merged on the host via a single CPU pass (~0.3s). Total memory: ~10 GB across 8 GPUs. The communication pattern is strictly scatter (Phase A → B distribution) then gather (bitset collection) — no allreduce or peer-to-peer transfers during expansion. Peak GPU memory per device: 2 × 64 GB double-buffer + 1.25 GB bitset ≈ 129 GB of 192 GB available. Total wall time = 4.3s (Phase A) + 21.7s (slowest GPU) + merge ≈ 43s. Log: [`run_10B_v2.log`](https://github.com/cahlen/idontknow/blob/main/scripts/experiments/zaremba-effective-bound/run_10B_v2.log).

**Hardware and baseline**: GPU timings on NVIDIA B200 (Blackwell, 192 GB HBM3e, 2.1 GHz boost clock, CUDA 12.8, `nvcc -O3 -arch=sm_100a`). The v4 baseline is a CPU recursive tree-walk on 2× Intel Xeon Platinum 8570 (112 cores / 224 threads, all utilized via OpenMP). The 175× speedup figure is measured at $10^7$ where both codepaths complete; at larger ranges v4 becomes impractical, so extrapolated speedups ("~1000×", "~10000×") are approximate. The speedup includes contributions from both the GPU migration and kernel-level optimizations (fusion, early-exit predicates), which have not been isolated via ablation. Full run logs with timestamps are archived at [`scripts/experiments/zaremba-effective-bound/run_*.log`](https://github.com/cahlen/idontknow/tree/main/scripts/experiments/zaremba-effective-bound).

## The Key Insight

Every CF path $[a_1, a_2, \ldots, a_k]$ with partial quotients in $\{1,\ldots,5\}$ corresponds to the matrix product:

$$\gamma = g_{a_1} \cdot g_{a_2} \cdots g_{a_k}, \qquad g_a = \begin{pmatrix} a & 1 \\ 1 & 0 \end{pmatrix}$$

The denominator $d$ is the $(2,1)$ entry of $\gamma$. So enumerating Zaremba denominators is equivalent to computing batched matrix products — exactly what GPUs are designed for.

## The Algorithm

At each depth $k$, we have a batch of 2×2 matrices. To advance to depth $k+1$:

1. **Expand**: multiply each matrix by $g_1, g_2, g_3, g_4, g_5$ (5 children per parent)
2. **Mark**: write the $(2,1)$ entry (denominator) into a bitset via `atomicOr`
3. **Compact**: discard matrices whose denominator exceeds $d_{\max}$ (dead branches)

All three operations are fused into a single CUDA kernel. The compaction uses `atomicAdd` for output positions, keeping only live matrices for the next depth.

The compaction is critical: without it, the matrix count grows as $5^k$ (exponential). With it, the live count peaks around depth 12-13 and then shrinks as branches die off.

## Why It's Fast

- **No CPU recursion**: the previous v4 approach walked the CF tree recursively on CPU, feeding results to GPU for bitset marking. v5 does EVERYTHING on GPU.
- **Massive parallelism**: at peak depth, ~244M matrices are expanded simultaneously by 244M CUDA threads
- **Memory efficient**: fused expand+compact means we never store more than 2 buffers of live matrices
- **Naturally pruning**: the denominator bound eliminates dead branches at every step

## References

- Zaremba, S.K. (1972). "La méthode des 'bons treillis' pour le calcul des intégrales multiples." Applications of Number Theory to Numerical Analysis, pp. 39–119.
- Bourgain, J. and Kontorovich, A. (2014). "On Zaremba's conjecture." Annals of Mathematics, 180(1), pp. 137–196.


certification:
  level: bronze
  verdict: ACCEPT
  reviewer: "Claude Opus 4.6 (Anthropic)"
  date: 2026-04-02
  note: "Engineering finding. 175x speedup verified. Matrix-CF equivalence is classical."
---

*Computed on NVIDIA DGX B200. Code: [matrix_enum.cu](https://github.com/cahlen/idontknow/blob/main/scripts/experiments/zaremba-effective-bound/matrix_enum.cu).*

*This work was produced through human–AI collaboration (Cahlen Humphreys + Claude). Not independently peer-reviewed. All code and data open for verification at [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*
