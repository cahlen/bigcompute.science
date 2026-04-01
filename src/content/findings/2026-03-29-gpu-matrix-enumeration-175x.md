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

---

*Computed on NVIDIA DGX B200. Code: [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*

*This work was produced through human–AI collaboration (Cahlen Humphreys + Claude). Not independently peer-reviewed. All code and data open for verification at [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*
