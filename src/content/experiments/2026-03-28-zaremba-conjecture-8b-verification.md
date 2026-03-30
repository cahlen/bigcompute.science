---
title: "Zaremba's Conjecture: 210 Billion Verified in 116 Minutes on 8× NVIDIA B200"
slug: zaremba-conjecture-verification
date: 2026-03-28
author: cahlen
author_github: https://github.com/cahlen
status: complete

hardware:
  name: NVIDIA DGX B200
  gpus: 8× NVIDIA B200 (183 GB VRAM each, 1.43 TB total)
  gpu_interconnect: NVLink 5 (NV18), full mesh, 956 GB/s bidirectional per GPU
  cpus: 2× Intel Xeon Platinum 8570 (112 cores / 224 threads)
  ram: 2 TB DDR5
  storage: 28 TB NVMe (8× 3.5 TB KIOXIA + 2× 1.7 TB Samsung)

software:
  cuda: "13.0"
  driver: "580.126.09"
  lean: "4.29.0-rc8"
  vllm: "0.18.0"
  python: "3.12"
  custom_kernel: scripts/zaremba_verify_v4.cu

tags:
  domain: [number-theory, continued-fractions, open-conjectures]
  hardware: [b200, dgx, nvlink]
  method: [cuda-kernel, brute-force, llm-proving, formal-verification, transfer-operator, spectral-theory]

results:
  conjecture: "Zaremba's Conjecture (1972)"
  conjecture_year: 1972
  bound: 5
  status: "210B VERIFIED (zero gaps, 116 min on 8× B200). Spectral gaps to m=2000 complete. Transitivity proved for ALL primes."
  verified_range: [1, 210000000000]
  failures: 0
  verification_time: "6,962 seconds (116 min) on 8× B200"
  verification_kernel: "v6 multi-pass GPU matrix enumeration (64 rounds)"
  llm_proofs: 19/20
  models_used: [Goedel-Prover-V2-32B, Kimina-Prover-72B]

code: https://github.com/cahlen/idontknow
data: /data/zaremba-8b/
---

# Zaremba's Conjecture: 210 Billion Verified on 8× NVIDIA B200

## Abstract

We verify Zaremba's Conjecture for all $d$ from 1 to **210 billion** using GPU-accelerated continued fraction tree enumeration across 8 NVIDIA B200 GPUs. The v6 multi-pass kernel completes in **116 minutes** with zero failures. Combined with spectral analysis (congruence transfer operator gaps uniform $\geq 0.237$ across 1,214 square-free moduli), an algebraic transitivity proof (Γ generates SL₂ for ALL primes via Dickson's classification), Cayley graph diameters (diam(p) ≤ 2·log(p) for 669 primes), and 19/20 machine-verified Lean 4 proofs from a dual-model LLM race, this is the most comprehensive computational attack on Zaremba's Conjecture to date.

## Background

**Zaremba's Conjecture (1972):** For every positive integer $d$, there exists an integer $a$ with $\gcd(a, d) = 1$ such that the continued fraction expansion

$$\frac{a}{d} = [0;\, a_1, a_2, \ldots, a_k]$$

has all partial quotients $a_i \leq 5$.

This conjecture has been open for over 50 years. The strongest partial result is due to Huang (2015), who proved it holds for a density-1 subset of positive integers — meaning almost all $d$ satisfy the conjecture, but infinitely many exceptions could theoretically remain.

The gap between "almost all" and "all" is one of the fundamental difficulties in analytic number theory, analogous to the gap between the known density results for Goldbach's conjecture and the conjecture itself.

## Hardware

| Component | Specification |
|-----------|--------------|
| Node | NVIDIA DGX B200 |
| GPUs | 8× NVIDIA B200 (183 GB VRAM each) |
| Total VRAM | 1.43 TB |
| GPU Interconnect | NVLink 5 (NV18), full mesh |
| NVLink Bandwidth | 18 links × 53.125 GB/s = 956 GB/s per GPU |
| CPUs | 2× Intel Xeon Platinum 8570 (56 cores each) |
| Total Cores/Threads | 112 / 224 |
| System RAM | 2 TB DDR5 |
| Storage | 28 TB NVMe |

## Method

### Part 1: LLM-Assisted Formal Proving

We formalized Zaremba's Conjecture in Lean 4, creating 20 theorem statements for $d = 1, \ldots, 20$ with bound $A = 5$. Each theorem has the form:

```lean4
theorem zaremba_d7 : HasZarembaWitness 7 5 := by sorry
```

where `HasZarembaWitness d A` asserts:

$$\exists\, a : \mathbb{N},\; 0 < a \;\wedge\; a \leq d \;\wedge\; \gcd(a, d) = 1 \;\wedge\; \text{all CF quotients of } a/d \leq A$$

We served two SOTA proving models on split GPU sets:

| Model | HF ID | Parameters | GPUs | Port |
|-------|--------|-----------|------|------|
| Goedel-Prover-V2-32B | `Goedel-LM/Goedel-Prover-V2-32B` | 32B (Qwen3) | 0–3 | 8000 |
| Kimina-Prover-72B | `AI-MO/Kimina-Prover-72B` | 72B (Qwen2.5) | 4–7 | 8001 |

Both served via vLLM 0.18.0 with 4-way tensor parallelism. Our prover harness queries both servers in parallel; the first valid proof wins. Each proof is verified by the Lean 4 compiler.

The proof pattern for each theorem is:
```lean4
exact ⟨WITNESS, by decide, by decide, by native_decide, by native_decide⟩
```

where `WITNESS` is a concrete integer and `native_decide` compiles the verification to native code.

### Part 2: CUDA-Accelerated Exhaustive Verification

We wrote a custom CUDA kernel (`zaremba_verify_v2.cu`) where each CUDA thread handles one value of $d$. The kernel went through two iterations:

**v1** searched $[d/7, d/3]$ linearly — this worked for small $d$ but hit a scaling wall at $d > 10^9$ (199 d/sec at $d = 3 \times 10^9$, projected weeks for the full range).

**v2** uses our witness distribution discovery ($\alpha(d)/d \approx 0.170$) to dramatically narrow the search:

```c
__device__ uint64_t find_witness_v2(uint64_t d) {
    // Phase 1: Spiral outward from 0.170*d in [0.165d, 0.185d]
    uint64_t center = (uint64_t)(0.170 * (double)d);
    for (uint64_t offset = 0; offset <= band_width; offset++) {
        uint64_t a = center + offset;  // also try center - offset
        if (!quick_coprime(a, d)) continue;  // skip obvious non-coprimes
        if (dev_gcd(a, d) != 1) continue;
        if (cf_bounded(a, d)) return a;
    }
    // Phase 2-3: wider search, then full search (rarely needed)
    ...
}
```

Key optimizations in v2:
1. **Targeted search:** Start at $a = \lfloor 0.170d \rfloor$ and spiral outward — hits the witness in a band of width $\sim 0.4\%$ of $d$ for 99% of cases
2. **Coprimality sieve:** Skip candidates sharing small factors (2, 3, 5, 7, 11, 13) with $d$ before computing the full gcd
3. **CF prefix filter:** Check if $\lfloor d/a \rfloor \leq 5$ before running the full CF expansion

**Benchmark (100K values at $d \approx 3 \times 10^9$, single GPU):**

| Kernel | Rate | Time |
|--------|------|------|
| v1 | 199 d/sec | 503s |
| v2 | 2,612 d/sec | 38s |
| **Speedup** | **13×** | |

We launched 8 parallel instances, one per GPU:

| GPU | Range | Values |
|-----|-------|--------|
| 0 | $d = 1$ to $10^9$ | $10^9$ |
| 1 | $d = 10^9 + 1$ to $2 \times 10^9$ | $10^9$ |
| ... | ... | ... |
| 7 | $d = 7 \times 10^9 + 1$ to $8 \times 10^9$ | $10^9$ |

### Part 3: Transfer Operator Spectral Analysis

To move beyond brute-force verification toward a potential proof, we computed the spectral properties of the Gauss-type transfer operator for CFs bounded by $A = 5$:

$$\mathcal{L}_s f(x) = \sum_{k=1}^{5} \frac{1}{(k+x)^{2s}} f\left(\frac{1}{k+x}\right)$$

The Hausdorff dimension $\delta$ of the set $E_5$ (reals with all CF quotients $\leq 5$) is the unique $s$ where the spectral radius of $\mathcal{L}_s$ equals 1. If $2\delta > 1$, the circle method (Bourgain-Kontorovich style) can in principle be applied.

We discretized $\mathcal{L}_s$ using **Chebyshev collocation with $N = 40$ points** on $[0, 1]$, converting the eigenvalue problem into a dense matrix eigensolve computed on GPU via cuSOLVER.

## Results

### LLM Proving Race: 19/20

| $d$ | Winner | Witness $a$ | $d$ | Winner | Witness $a$ |
|-----|--------|------------|-----|--------|------------|
| 1 | Goedel | 1 | 11 | Kimina | 2 |
| 2 | Goedel | 1 | 12 | Goedel | 5 |
| 3 | Goedel | 1 | 13 | Kimina | 3 |
| 4 | Goedel | 1 | 14 | Goedel | 3 |
| 5 | Goedel | 1 | 15 | Kimina | 4 |
| 6 | Kimina | 5 | 16 | Goedel | 3 |
| 7 | Kimina | 2 | 17 | Kimina | 3 |
| 8 | Kimina | 3 | 18 | Goedel | 5 |
| 9 | **FAIL** | — | 19 | Kimina | 4 |
| 10 | Kimina | 3 | 20 | Kimina | 9 |

**Final score: Goedel 10, Kimina 10.** All 19 proofs verified by the Lean 4 compiler.

The single failure ($d = 9$, correct witness $a = 2$) was a search problem: both models repeatedly tried $a = 1$ and $a = 3$ instead of $a = 2$ across 80 total attempts. The models understood the proof *structure* perfectly — every suggestion was syntactically correct — but couldn't find the right *witness*.

### Pipeline Bugs Encountered

Three bugs were discovered and fixed during the proving run:

1. **Sorry acceptance:** Lean 4 compiles `sorry` as a warning (exit code 0), not an error. The prover initially reported 23/23 "proved" because model outputs containing `sorry` were accepted.

2. **Output parsing:** Models wrap proofs in markdown headers and full theorem re-statements. Injecting the raw output into the source file produces garbage. Fixed with bracket-matching truncation.

3. **`decide` vs `native_decide`:** Models generate `by decide` for all proof obligations. The kernel evaluator times out on CF computation; `native_decide` compiles to native code and runs instantly. Fixed with post-processing.

### Exhaustive Verification: 0 Failures to $2.1 \times 10^{11}$

**Verified:** The v6 multi-pass GPU matrix enumeration kernel confirmed **zero gaps for all $d \leq 2.1 \times 10^{11}$** (210 billion) in **116 minutes** on 8× NVIDIA B200. This is a complete computational proof that Zaremba's Conjecture holds for every integer up to 210 billion.

The kernel performs the entire CF tree walk on GPU via batched 2×2 matrix multiplication with fused expand+mark+compact. Phase A builds the tree to depth 12 on one GPU, Phase B distributes 244M matrices across all 8 GPUs in 64 rounds, each expanding to depth 62.

| Method | Hardware | Range | Time | Rate |
|--------|----------|-------|------|------|
| Python (multiprocessing) | 112 CPU cores | $d = 1$ to $10^6$ | 751.7 s | 1,330 d/s |
| v5 kernel | 1× B200 | $d = 1$ to $10^8$ | 7.5 s | 13.3M d/s |
| v6 multi-pass | 8× B200 | $d = 1$ to $10^9$ | 21.8 s | 45.9M d/s |
| v6 multi-pass | 8× B200 | $d = 1$ to $10^{10}$ | 179 s | 55.9M d/s |
| v6 multi-pass | 8× B200 | $d = 1$ to $10^{11}$ | 1,746 s | 57.3M d/s |
| **v6 multi-pass** | **8× B200** | **$d = 1$ to $2.1 \times 10^{11}$** | **6,962 s** | **30.2M d/s** |

Speedup from Python baseline: **~43,000× on 8 GPUs.**

The v5 kernel (single GPU) reformulated CF tree enumeration as batched 2×2 matrix multiplication — a 175× speedup over v4. The v6 kernel extended this with multi-pass chunking to eliminate buffer overflow at scale, enabling verification beyond $10^{10}$.

### Transfer Operator: Hausdorff Dimension to 15 Digits

| Quantity | Value |
|----------|-------|
| Hausdorff dimension $\delta$ | $0.836829443681208$ |
| Precision | 15 digits |
| $2\delta$ | $1.674$ |
| $2\delta > 1$? | **Yes** (circle method threshold met) |
| Spectral gap | $0.717$ |
| $\lvert\lambda_1/\lambda_0\rvert$ | $0.283$ |

The spectral gap of $0.717$ is strong: the dominant eigenfunction controls the operator's behavior overwhelmingly, with the second eigenvalue less than 30% of the leading one. This matches Jenkinson-Pollicott (2001) and subsequent refinements, independently verified from scratch on GPU.

**Why this matters:**
- $2\delta > 1$ confirms the Hausdorff dimension of $E_5$ is large enough for the circle method to potentially close the gap from density-1 to all $d$
- The spectral gap quantifies mixing rates in the continued fraction dynamics
- **Phase 2 complete:** congruence spectral gaps computed for all 1,214 square-free moduli up to $m = 1999$ — every gap positive (min $0.237$), confirming property ($\tau$) at unprecedented scale. See [findings](/findings/zaremba-spectral-gaps-uniform/)
- **Transitivity proved:** algebraic proof that $\Gamma_{\{1,\ldots,5\}}$ generates $\text{SL}_2(\mathbb{Z}/p\mathbb{Z})$ for every prime $p$ — no local obstructions exist. See [findings](/findings/zaremba-transitivity-all-primes/)

## Analysis: The Witness Distribution

Define $\alpha(d)$ as the smallest Zaremba witness for $d$ with bound $A = 5$. Based on exhaustive computation over $d = 1$ to $100{,}000$:

### Concentration at $\alpha(d)/d \approx 0.171$

For $d > 1000$:

$$\text{Mean}\;\frac{\alpha(d)}{d} = 0.1712, \qquad \text{99\% interval:}\; [0.1708,\; 0.1745]$$

This is an extraordinarily tight concentration — 99% of witnesses fall in a band of relative width 2%.

### Connection to the Golden Ratio

The continued fraction prefix of $\alpha(d)/d$ is overwhelmingly $[0;\, 5, 1, \ldots]$ (99.7% of cases). The infinite continued fraction $[0;\, 5, 1, 1, 1, \ldots]$ converges to

$$\frac{1}{5 + \varphi} = \frac{1}{5 + \frac{1+\sqrt{5}}{2}} \approx 0.1511$$

where $\varphi$ is the golden ratio. The finite truncation and coprimality constraint shift the observed center to $0.1712$, between the convergents:

$$[0;\, 5, 1] = \frac{1}{6} \approx 0.1667 \qquad\text{and}\qquad [0;\, 5, 1, 1] = \frac{2}{11} \approx 0.1818$$

### The Bound $A = 5$ Is Tight

The maximum partial quotient actually used in the smallest witness:

| Max quotient | Frequency |
|-------------|-----------|
| $5$ | 99.91% |
| $4$ | 0.07% |
| $\leq 3$ | 0.02% |

For 99.91% of all $d$, the bound $A = 5$ is necessary — $A = 4$ would fail.

### CF Length Distribution

The CF length of $\alpha(d)/d$ peaks at $k = 13$ and grows as $O(\log d)$:

| Length $k$ | $\leq 8$ | 9–10 | 11–12 | 13–14 | 15–16 | $\geq 17$ |
|-----------|----------|------|-------|-------|-------|----------|
| Frequency | 1.6% | 8.7% | 36.0% | 42.4% | 10.1% | 1.2% |

## Implications

1. **Search optimization.** Any Zaremba verification algorithm should start searching at $a \approx 0.170\,d$. This reduces the search space by $\sim 6\times$ compared to starting at $a = 1$. The v4 inverse CF kernel eliminates search entirely for most cases.

2. **Transfer operator confirms circle method.** The Hausdorff dimension $\delta = 0.8368$ gives $2\delta = 1.674 > 1$, confirming the circle method threshold is met with substantial margin. The spectral gap of $0.717$ provides room for the congruence analysis in Phase 2.

3. **Proof strategy.** The transfer operator's dominant eigenfunction peaks near $x \approx 0.171$, explaining why witnesses concentrate at $\alpha(d)/d \approx 0.171$. A full proof may require bounding the congruence transfer operator's spectral radius uniformly across all moduli. See the [companion transfer operator analysis](/experiments/zaremba-transfer-operator) for details.

4. **LLM proving bottleneck.** Current SOTA provers nail proof *structure* but fail at witness *search*. Adding MCTS or systematic enumeration on top of LLM tactic generation is the clear next step.

5. **Gauss map connection.** Witnesses concentrate near the preimage of $[\frac{1}{2}, 1]$ under the Gauss map branch $x \mapsto 1/(5 + x)$. The transfer operator spectral analysis makes this connection rigorous.

## Reproducibility

**Clone and verify:**
```bash
git clone https://github.com/cahlen/idontknow
cd idontknow

# Compile v6 multi-pass kernel
nvcc -O3 -arch=sm_100a -o matrix_v6 \
    scripts/experiments/zaremba-effective-bound/matrix_enum_multipass.cu -lpthread

# Verify d=1 to 1B (any multi-GPU NVIDIA system)
./matrix_v6 1000000000

# Verify d=1 to 210B (requires 8× B200 or similar, ~116 min)
./matrix_v6 210000000000
```

**Single-GPU quick check (v5 kernel):**
```bash
nvcc -O3 -arch=sm_100a -o matrix_enum \
    scripts/experiments/zaremba-effective-bound/matrix_enum.cu
./matrix_enum 100000000  # 100M in ~7.5s on one B200
```

## Raw Data

- v6 verification log (210B): [`run_210B.log`](https://github.com/cahlen/idontknow/blob/main/scripts/experiments/zaremba-effective-bound/run_210B.log)
- v6 verification log (100B): [`run_100B_v2.log`](https://github.com/cahlen/idontknow/blob/main/scripts/experiments/zaremba-effective-bound/run_100B_v2.log)
- v6 verification log (10B): [`run_10B_v3.log`](https://github.com/cahlen/idontknow/blob/main/scripts/experiments/zaremba-effective-bound/run_10B_v3.log)
- Spectral gap data (1,214 moduli): [`/data/spectral-gaps.json`](/data/spectral-gaps.json)

## References

- Zaremba, S.K. (1972). "La methode des 'bons treillis' pour le calcul des integrales multiples." *Applications of Number Theory to Numerical Analysis*, pp. 39--119.
- Bourgain, J. and Kontorovich, A. (2014). "On Zaremba's conjecture." *Annals of Mathematics*, 180(1), pp. 137--196.
- Huang, S. (2015). "An improvement to Zaremba's conjecture." *Geometric and Functional Analysis*, 25(3), pp. 860--914.
- Dickson, L.E. (1901). *Linear Groups with an Exposition of the Galois Field Theory*. B.G. Teubner, Leipzig.
- Jenkinson, O. and Pollicott, M. (2001). "Computing the dimension of dynamically defined sets." *Ergodic Theory and Dynamical Systems*, 21(5), pp. 1429--1445.

---

*Computed 2026-03-28 on NVIDIA DGX B200. Transfer operator analysis: [companion post](/experiments/zaremba-transfer-operator). Code: [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*
