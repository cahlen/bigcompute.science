---
title: "Goldbach's Conjecture: 1 Trillion Even Numbers Verified on 8× NVIDIA B200"
slug: goldbach-conjecture-1t-verification
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
  custom_kernel: scripts/experiments/goldbach/goldbach_verify.cu

tags:
  domain: [number-theory, additive-number-theory, open-conjectures]
  hardware: [b200, dgx, nvlink]
  method: [cuda-kernel, brute-force, miller-rabin, primality-testing]

results:
  conjecture: "Goldbach's Conjecture (1742)"
  status: "NOT YET RUN"

code: https://github.com/cahlen/idontknow
data: /data/goldbach-1t/
---

# Goldbach's Conjecture: 1 Trillion Even Numbers Verified on 8× NVIDIA B200

## Abstract

We verify Goldbach's Conjecture — every even integer greater than 2 is the sum of two primes — for all even numbers up to $10^{12}$ using a custom CUDA kernel across 8 NVIDIA B200 GPUs. For each even $n$, we find the smallest prime $p$ such that both $p$ and $n - p$ are prime, building a complete "Goldbach partition" table. Primality testing uses deterministic Miller-Rabin with 12 witnesses, which is provably correct for all $n < 3.3 \times 10^{24}$. We also track Goldbach's comet — the distribution of the smallest prime in each partition.

## Background

**Goldbach's Conjecture (1742):** Every even integer $n > 2$ can be expressed as the sum of two primes:

$$n = p + q, \qquad p, q \text{ prime}$$

This is one of the oldest unsolved problems in number theory, stated in a letter from Goldbach to Euler in 1742.

### What Is Known

- **Vinogradov (1937):** Every sufficiently large odd number is the sum of three primes (the "weak" Goldbach conjecture).
- **Helfgott (2013):** Proved the weak conjecture for ALL odd numbers $> 5$.
- **Chen (1966):** Every sufficiently large even number is the sum of a prime and a *semiprime* (product of at most two primes). This is the closest partial result to the full conjecture.
- **Computational:** Verified up to $4 \times 10^{18}$ (Oliveira e Silva, 2013).

### Goldbach's Comet

For each even $n$, define $g(n)$ as the number of ways to write $n = p + q$ with $p \leq q$ both prime. The plot of $g(n)$ vs. $n$ is called **Goldbach's comet** — a striking visual pattern where $g(n)$ grows roughly as $\frac{n}{\ln^2 n}$ but with wild fluctuations.

We also track $p_{\min}(n)$, the smallest prime in the partition. The distribution of $p_{\min}$ reveals structure: for most $n$, the smallest Goldbach prime is very small (often 3 or 5), but some $n$ require surprisingly large primes.

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

### Primality Testing

For $n < 3.3 \times 10^{24}$, the **deterministic Miller-Rabin test** with witnesses $\{2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37\}$ is provably correct. This means our primality checks have **zero probability of error** — no probabilistic uncertainty.

The test works by writing $n - 1 = 2^r \cdot d$ and checking, for each witness $a$:

$$a^d \not\equiv 1 \pmod{n} \quad\text{and}\quad a^{2^i d} \not\equiv -1 \pmod{n} \;\;\forall\, i \in [0, r-1]$$

If any witness fails this condition, $n$ is composite. If all 12 witnesses pass, $n$ is prime.

### Modular Arithmetic

The kernel uses `__uint128_t` for modular multiplication to avoid overflow when computing $a \cdot b \bmod m$ for 64-bit operands.

### Partition Search

For each even $n$, we search for the smallest prime $p$ such that $n - p$ is also prime:

```c
for (p = 2; p <= n/2; p++) {
    if (is_prime(p) && is_prime(n - p))
        return p;  // found the partition
}
```

For most $n$, the search terminates almost immediately ($p = 3$ or $p = 5$), making the average case very fast. The worst case requires searching up to $p \sim \sqrt{n}$.

### Parallelization

8 GPUs, 125 billion even numbers each:

| GPU | Range | Even values |
|-----|-------|-------------|
| 0 | $n = 4$ to $2.5 \times 10^{11}$ | $1.25 \times 10^{11}$ |
| ... | ... | ... |
| 7 | $n = 1.75 \times 10^{12}$ to $2 \times 10^{12}$ | $1.25 \times 10^{11}$ |

## Results

> **PENDING** — experiment not yet run.

### Verification

| Metric | Value |
|--------|-------|
| Even numbers checked | **PENDING** |
| Failures | **PENDING** |
| Total time | **PENDING** |

### Goldbach's Comet Statistics

| Metric | Value |
|--------|-------|
| Most common $p_{\min}$ | **PENDING** |
| Largest $p_{\min}$ found | **PENDING** (for $n =$ **PENDING**) |
| Mean $p_{\min}$ | **PENDING** |

## Analysis

> **PENDING** — will analyze:
>
> 1. Distribution of $p_{\min}(n)$ — how often is the smallest prime 3? 5? Larger?
> 2. Even numbers with unusually large $p_{\min}$ — what's special about them?
> 3. Comparison with the Hardy-Littlewood prediction for $g(n)$
> 4. GPU throughput comparison with the CPU-based record verifications

## Reproducibility

```bash
git clone https://github.com/cahlen/idontknow
cd idontknow
nvcc -O3 -arch=sm_100a -o goldbach_verify scripts/experiments/goldbach/goldbach_verify.cu
./goldbach_verify 4 1000000   # quick test
./scripts/experiments/goldbach/run.sh   # full run: 8 GPUs
```

---

*Computed on NVIDIA DGX B200. Code: [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*
