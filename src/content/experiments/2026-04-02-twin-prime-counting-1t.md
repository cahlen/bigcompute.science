---
title: "Twin Prime Counting to 10^12: GPU Sieve vs. Hardy-Littlewood Prediction"
slug: twin-prime-counting-1t
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
  custom_kernel: scripts/experiments/twin-primes/twin_prime_count.cu

tags:
  domain: [number-theory, prime-distribution, open-conjectures]
  hardware: [b200, dgx, nvlink]
  method: [cuda-kernel, segmented-sieve, eratosthenes]

results:
  conjecture: "Twin Prime Conjecture"
  status: "NOT YET RUN"

code: https://github.com/cahlen/idontknow
data: /data/twin-primes-1t/
---

# Twin Prime Counting to $10^{12}$: GPU Sieve vs. Hardy-Littlewood

## Abstract

We count all twin prime pairs $(p, p+2)$ up to $10^{12}$ using a segmented sieve of Eratosthenes implemented as a CUDA kernel on 8 NVIDIA B200 GPUs. We compare the count $\pi_2(N)$ against the Hardy-Littlewood prediction and analyze the ratio's convergence. We also collect statistics on gaps between consecutive twin prime pairs.

## Background

**Twin Prime Conjecture:** There are infinitely many primes $p$ such that $p + 2$ is also prime.

The **twin prime counting function** $\pi_2(N)$ counts the number of primes $p \leq N$ such that $p + 2$ is also prime. The Hardy-Littlewood conjecture gives an asymptotic prediction:

$$\pi_2(N) \sim 2C_2 \frac{N}{(\ln N)^2}$$

where $C_2$ is the **twin prime constant**:

$$C_2 = \prod_{p \geq 3} \frac{p(p-2)}{(p-1)^2} = 0.6601618158\ldots$$

This product runs over all odd primes $p$. The constant arises from the heuristic that primes $p$ and $p+2$ are "independently" prime except for the constraint that they can't both be divisible by any small prime.

### What Is Known

- **Brun (1919):** The sum of reciprocals of twin primes converges (unlike the sum over all primes). This implies the twin primes, if infinite, are sparse.
- **Zhang (2013):** There are infinitely many pairs of primes differing by at most 70,000,000. The first finite bound.
- **Maynard (2015) / Polymath 8b:** Reduced the gap to 246. That is: there are infinitely many pairs of primes differing by at most 246.
- **Computational:** $\pi_2(10^{16})$ is known (Oliveira e Silva).

### Known Values of $\pi_2(N)$

| $N$ | $\pi_2(N)$ |
|-----|-----------|
| $10^3$ | 35 |
| $10^6$ | 8,169 |
| $10^9$ | 3,424,506 |
| $10^{12}$ | 1,177,209,242 |
| $10^{15}$ | 346,513,491,404 |

We aim to reproduce and verify $\pi_2(10^{12}) = 1{,}177{,}209{,}242$.

## Hardware

| Component | Specification |
|-----------|--------------|
| Node | NVIDIA DGX B200 |
| GPUs | 8× NVIDIA B200 (183 GB VRAM each) |
| Total VRAM | 1.43 TB |
| GPUs | NVLink 5 (NV18), full mesh |
| CPUs | 2× Intel Xeon Platinum 8570 |
| System RAM | 2 TB DDR5 |

## Method

### Segmented Sieve

The sieve of Eratosthenes is the most efficient way to enumerate primes up to $N$, but it requires $O(N)$ memory. For $N = 10^{12}$, that's 1 TB — feasible on our cluster but inefficient.

Instead, we use a **segmented sieve**: divide $[1, N]$ into segments of size $10^6$, sieve each segment independently using precomputed small primes (up to $\sqrt{N} \approx 10^6$), and count twin primes within each segment.

The small primes are stored in CUDA **constant memory** for fast access by all threads. Each thread in the sieve kernel marks composites for one small prime within the segment.

### Twin Detection

After sieving a segment, a second kernel scans for pairs $(n, n+2)$ where both are marked prime. An atomic counter accumulates the twin prime count across all segments.

### Parallelization

Segments are distributed round-robin across 8 GPUs. Since each segment is independent, this is embarrassingly parallel.

## Results

> **PENDING** — experiment not yet run.

### Twin Prime Count

| Metric | Value |
|--------|-------|
| $\pi_2(10^{12})$ found | **PENDING** |
| Expected | $1{,}177{,}209{,}242$ |
| Match | **PENDING** |
| Total time | **PENDING** |

### Hardy-Littlewood Ratio

$$R(N) = \frac{\pi_2(N)}{2C_2 \cdot N / (\ln N)^2}$$

| $N$ | $R(N)$ |
|-----|--------|
| $10^6$ | **PENDING** |
| $10^9$ | **PENDING** |
| $10^{12}$ | **PENDING** |

The ratio $R(N) \to 1$ as $N \to \infty$ if the Hardy-Littlewood conjecture is correct. Its rate of convergence is of independent interest.

## Analysis

> **PENDING** — will analyze:
>
> 1. Does our count match the known value $\pi_2(10^{12}) = 1{,}177{,}209{,}242$?
> 2. How does $R(N)$ evolve across the range — is convergence monotonic?
> 3. Distribution of gaps between consecutive twin prime pairs
> 4. GPU throughput: how does segmented sieve performance scale with $N$?

## Reproducibility

```bash
git clone https://github.com/cahlen/idontknow
cd idontknow
nvcc -O3 -arch=sm_100a -o twin_prime_count scripts/experiments/twin-primes/twin_prime_count.cu
./twin_prime_count 1000000       # quick test: count twins up to 10^6
./scripts/experiments/twin-primes/run.sh   # full run to 10^12
```

---

*Computed on NVIDIA DGX B200. Code: [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*
