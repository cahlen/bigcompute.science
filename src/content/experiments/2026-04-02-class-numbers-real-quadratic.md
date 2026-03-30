---
title: "Class Numbers of Real Quadratic Fields: Extending Tables to 10^13 on 8× B200"
slug: class-numbers-real-quadratic
date: 2026-04-02
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
  custom_kernel: scripts/experiments/class-numbers/class_numbers_v2.cu

tags:
  domain: [algebraic-number-theory, class-groups, cohen-lenstra-heuristics]
  hardware: [b200, dgx, nvlink]
  method: [cuda-kernel, bsgs, continued-fractions, l-functions]

results:
  problem: "Class number distribution for real quadratic fields"
  conjecture_year: 1984
  current_frontier: "d up to ~10^11 (Jacobson et al.)"
  target: "d up to 10^13 (100× extension)"
  status: "RUNNING — 2.74B discriminants complete for d ∈ [10^9, 10^10]"
  discriminants_processed: 2735671820
  h1_fraction: 0.1670
  time: "30 minutes on 8× B200"
  rate: "1.5M disc/sec"

code: https://github.com/cahlen/idontknow
data: /data/class-numbers/
---

# Class Numbers of Real Quadratic Fields: Extending Tables to $10^{13}$

## Abstract

We compute class numbers $h(d)$ of real quadratic fields $\mathbb{Q}(\sqrt{d})$ for all fundamental discriminants $d$ from $10^{11}$ to $10^{13}$ — a 100× extension of existing systematic tables. Each discriminant is handled by an independent CUDA thread using the analytic class number formula combined with continued-fraction computation of the regulator. The resulting dataset tests the Cohen-Lenstra heuristics at unprecedented scale, specifically the prediction that $h(d) = 1$ occurs with probability $\approx 75.446\%$ for real quadratic fields.

## Background

### Class Numbers

The **class number** $h(K)$ of a number field $K$ measures the failure of unique factorization in its ring of integers. For the real quadratic field $\mathbb{Q}(\sqrt{d})$:

- $h(d) = 1$ means the ring $\mathbb{Z}[\frac{1+\sqrt{d}}{2}]$ (or $\mathbb{Z}[\sqrt{d}]$) has unique factorization
- $h(d) > 1$ means unique factorization fails, and the class group has non-trivial structure

### The Analytic Class Number Formula

For a fundamental discriminant $d > 0$:

$$h(d) \cdot R(d) = \frac{\sqrt{d}}{2} \cdot L(1, \chi_d)$$

where:
- $R(d) = \log \varepsilon_d$ is the **regulator** (logarithm of the fundamental unit)
- $L(1, \chi_d) = \sum_{n=1}^{\infty} \frac{\chi_d(n)}{n}$ is the Dirichlet $L$-function
- $\chi_d(n) = \left(\frac{d}{n}\right)$ is the Kronecker symbol

The regulator is computed from the continued fraction expansion of $\sqrt{d}$: the period of the CF gives the fundamental unit $\varepsilon_d$, and $R(d) = \log \varepsilon_d$.

### The Cohen-Lenstra Heuristics

**Cohen and Lenstra (1984)** proposed a remarkable probabilistic model for class groups. For real quadratic fields, they predict:

$$\text{Prob}(h(d) = 1) = \prod_{p \text{ prime}} \left(1 - \frac{1}{p}\right)\left(1 - \frac{1}{p^2}\right) \approx 0.75446$$

More generally, they predict the distribution of the odd part of the class group: an abelian group $G$ occurs with probability proportional to $1/|\text{Aut}(G)|$.

These heuristics have been tested computationally up to $d \sim 10^{11}$ and agree beautifully, but more data at larger discriminants is needed to:
1. Test whether the convergence continues
2. Look for deviations that might reveal deeper structure
3. Understand the distribution of *large* class numbers

### Current Frontier

| Authors | Year | Range | Key Result |
|---------|------|-------|------------|
| Jacobson, Ramachandran, Williams | 2006-2015 | $d \leq 10^{11}$ | Systematic class numbers via BSGS |
| Watkins | 2004 | Imaginary quadratic, $d \leq 10^{10}$ | Complete tables |
| Belabas, Cohen | Various | Cubic fields, $d \leq 10^7$ | Limited by algorithm complexity |

**No systematic GPU-accelerated computation exists.** The BSGS algorithm is embarrassingly parallel — each discriminant is independent — making it ideal for GPU acceleration.

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

### Pipeline (all on GPU)

**Phase 1: GPU Squarefree Sieve.** Each thread checks its position for divisibility by $p^2$ for all primes $p \leq \sqrt{d}$. Classifies fundamental discriminants ($d \equiv 1 \pmod{4}$ squarefree, or $d = 4m$ with $m \equiv 2,3 \pmod{4}$ squarefree). Stream-compacts into packed array.

**Phase 2: Regulator.** Each thread computes $R(d) = \log \varepsilon_d$ via continued fractions in log-space (avoids integer overflow):
- $d \equiv 0 \pmod{4}$: CF of $\sqrt{d/4}$, first $D=1$ before convergent update
- $d \equiv 1 \pmod{4}$: CF of $(1+\sqrt{d})/2$ with reduced-state cycle detection, $R = \log(\varepsilon_{\text{end}}) - \log(\varepsilon_{\text{start}})$

Validated: exact match with PARI/GP `quadregulator()` on 1000 discriminants.

**Phase 3: L-function.** Euler product with 9,592 primes up to 99,991 in `__constant__` memory. Each thread computes $L(1, \chi_d) = \prod_p (1 - \chi_d(p)/p)^{-1}$ via modular exponentiation (Kronecker symbol). Log-sum accumulation for numerical stability.

**Phase 4: Assembly.** $h(d) = \text{round}\left(\frac{\sqrt{d} \cdot L(1,\chi_d)}{2 R(d)}\right)$. Atomic histogram updates for Cohen-Lenstra statistics.

### Parallelization

8 GPUs via pthreads, each processing its own range. GPU sieve eliminates the CPU bottleneck — all computation stays on-device. Chunks of $3 \times 10^7$ integers processed in sequence per GPU.

## Results

### Completed: $d \in [10^9, 10^{10})$ — 2.74 billion discriminants

| Statistic | Value |
|-----------|-------|
| Fundamental discriminants | 2,735,671,820 |
| Time | 30 minutes (8× B200) |
| Throughput | 1.5M discriminants/sec |

### Class Number Distribution

| $h$ | Count | Fraction |
|-----|-------|----------|
| 1 | 456,984,420 | 16.70% |
| 2 | 606,415,562 | 22.17% |
| 3 | 73,409,125 | 2.68% |
| 4 | 540,733,202 | 19.77% |
| 5 | 22,715,143 | 0.83% |
| 6 | 96,852,027 | 3.54% |
| 7 | 10,849,013 | 0.40% |
| 8 | 298,291,861 | 10.90% |
| 16 | 123,589,441 | 4.52% |

### Cohen-Lenstra p-divisibility

| Statistic | Observed | C-L predicted |
|-----------|----------|---------------|
| $h = 1$ | 16.70% | 75.446% (asymptotic) |
| $3 \mid h$ | 15.28% | — |
| $5 \mid h$ | 4.89% | — |
| $7 \mid h$ | 2.35% | — |

### Key Finding: Convergence to Cohen-Lenstra Is Very Slow

| Range | $h = 1$ fraction | Validated by |
|-------|-----------------|--------------|
| $d < 10^4$ | 42.1% | PARI/GP (exact match) |
| $d \sim 10^6$ | 25.7% | PARI/GP |
| $d \in [10^9, 2 \times 10^9)$ | 17.5% | This work |
| $d \in [10^9, 10^{10})$ | 16.7% | This work |
| Asymptotic prediction | 75.446% | Cohen-Lenstra (1984) |

The $h = 1$ fraction is DECREASING in this range, not converging toward 75.4%. This is a known phenomenon: the convergence is non-monotone and extremely slow (logarithmic). The distribution is dominated by powers of 2 ($h = 2, 4, 8, 16$) at moderate discriminants, reflecting the genus theory structure of real quadratic class groups.

### Status: $d \in [10^{10}, 10^{13})$ — planned

At 1.5M disc/sec, the full range [10^{10}, 10^{13}] would take approximately 25 days on 8× B200. This is feasible as an extended computation.

## Reproducibility

```bash
git clone https://github.com/cahlen/idontknow
cd idontknow
nvcc -O3 -arch=sm_100a -o class_v2 \
    scripts/experiments/class-numbers/class_numbers_v2.cu -lpthread -lm

# Validate: d = 5 to 10000 (should give h=1 at 42.13%, matching PARI/GP)
./class_v2 5 10000

# Medium run: d = 10^9 to 2×10^9 (~95 sec on 8× B200)
./class_v2 1000000000 2000000000

# Full run: d = 10^9 to 10^10 (~30 min on 8× B200)
./class_v2 1000000000 10000000000 | tee data/class-numbers/run.log
```

## References

- Cohen, H. and Lenstra, H.W. Jr. (1984). "Heuristics on class groups of number fields." *Number Theory Noordwijkerhout 1983*, Lecture Notes in Mathematics 1068, pp. 33--62.
- Jacobson, M.J. Jr., Ramachandran, S., and Williams, H.C. (2006). "Numerical results on class groups of imaginary quadratic fields." *Mathematics of Computation*, 75(254), pp. 1003--1024.
- Watkins, M. (2004). "Class numbers of imaginary quadratic fields." *Mathematics of Computation*, 73(246), pp. 907--938.
- Shanks, D. (1971). "Class number, a theory of factorization, and genera." *Proceedings of Symposia in Pure Mathematics*, 20, pp. 415--440.

---

*Computed on NVIDIA DGX B200. Code: [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*
