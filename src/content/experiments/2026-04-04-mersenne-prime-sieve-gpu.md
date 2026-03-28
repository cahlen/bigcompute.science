---
title: "Mersenne Prime Sieve: Planned Trial Factoring of M_p to p = 10^7 on B200"
slug: mersenne-prime-sieve-gpu
date: 2026-04-04
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
  custom_kernel: scripts/experiments/mersenne-sieve/mersenne_check.cu

tags:
  domain: [number-theory, prime-numbers, mersenne-primes]
  hardware: [b200, dgx]
  method: [cuda-kernel, trial-factoring, modular-exponentiation]

results:
  target: "Mersenne prime candidates for p up to 10^7"
  status: "NOT YET RUN"

code: https://github.com/cahlen/idontknow
data: /data/mersenne-sieve/
---

# Mersenne Prime Sieve: Trial Factoring $M_p$ for $p$ up to 10 Million

## Abstract

We sieve Mersenne prime candidates $M_p = 2^p - 1$ for all prime exponents $p$ up to $10^7$ by trial factoring on GPU. Using the algebraic constraint that any factor of $M_p$ must have the form $q = 2kp + 1$ with $q \equiv \pm 1 \pmod{8}$, we test candidate factors up to $10^{12}$ using CUDA-accelerated modular exponentiation. Exponents that survive trial factoring are candidates for the full Lucas-Lehmer primality test. We compare our survivor list against the 51 known Mersenne primes.

## Background

### Mersenne Primes

A **Mersenne number** is an integer of the form $M_p = 2^p - 1$. If $M_p$ is prime, it is called a **Mersenne prime**. For $M_p$ to be prime, $p$ itself must be prime (since $2^{ab} - 1$ factors as $(2^a - 1)(2^{a(b-1)} + \cdots + 1)$).

As of 2024, there are **51 known Mersenne primes**, the largest being $M_{82589933}$ with 24,862,048 digits. The search for Mersenne primes is organized by **GIMPS** (Great Internet Mersenne Prime Search), one of the longest-running distributed computing projects.

### The Lucas-Lehmer Test

The definitive test for Mersenne primality: define the sequence

$$S_0 = 4, \qquad S_{n+1} = S_n^2 - 2 \pmod{M_p}$$

Then $M_p$ is prime if and only if $S_{p-2} \equiv 0 \pmod{M_p}$.

This requires $p - 2$ squarings modulo $M_p$, each involving numbers with up to $p$ bits. For $p = 10^7$, each squaring operates on 10-million-bit numbers — this is why GIMPS uses months of compute per candidate.

### Trial Factoring as a Pre-Filter

Before running the expensive LL test, we can cheaply eliminate most candidates by finding a small factor. Key number-theoretic constraints on factors $q$ of $M_p$:

1. $q \equiv 1 \pmod{2p}$ — every factor has this form
2. $q \equiv \pm 1 \pmod{8}$ — additional constraint from quadratic reciprocity
3. Checking if $q \mid M_p$ reduces to: $2^p \equiv 1 \pmod{q}$, a single modular exponentiation

Combined, we only need to test $q = 2kp + 1$ for $k = 1, 2, 3, \ldots$ where $q \bmod 8 \in \{1, 7\}$. This eliminates the vast majority of prime exponents before we ever run Lucas-Lehmer.

### What Our Sieve Does

For each prime $p \leq 10^7$, we test all candidate factors up to $10^{12}$. If no factor is found, $p$ is flagged as a **survivor** — a candidate needing the full LL test. We then compare our survivor list against the known Mersenne primes.

## Hardware

| Component | Specification |
|-----------|--------------|
| Node | NVIDIA DGX B200 |
| GPUs | 8× NVIDIA B200 (183 GB VRAM each) |
| Total VRAM | 1.43 TB |
| CPUs | 2× Intel Xeon Platinum 8570 |
| System RAM | 2 TB DDR5 |

## Method

### CUDA Kernel

Each CUDA thread handles one exponent $p$:

1. Check if $p$ is prime (trial division — $p$ is small)
2. Iterate through candidate factors $q = 2kp + 1$ for $k = 1, 2, \ldots$
3. Filter: skip $q$ unless $q \bmod 8 \in \{1, 7\}$
4. Test: compute $2^p \bmod q$ via binary exponentiation with 128-bit intermediate products
5. If $2^p \equiv 1 \pmod{q}$: factor found, $M_p$ is composite, stop
6. If no factor found up to $q = 10^{12}$: flag $p$ as a survivor

The modular exponentiation uses `__uint128_t` for the intermediate $a \cdot b \bmod m$ computation, which is exact for $q < 2^{64}$.

### Parallelization

The kernel launches one thread per exponent. With $\pi(10^7) \approx 620{,}000$ prime exponents, this fits easily in a single GPU launch. The trial factoring loop within each thread is the expensive part — some exponents take millions of iterations.

## Results

> **PENDING** — experiment not yet run.

### Survivors

| Metric | Value |
|--------|-------|
| Prime exponents tested | **PENDING** |
| Eliminated by trial factoring | **PENDING** |
| Survivors (candidates) | **PENDING** |
| Known Mersenne primes recovered | **PENDING** / 51 |
| New candidates found | **PENDING** |
| Total time | **PENDING** |

### Known Mersenne Primes in Range

The 51 known Mersenne primes have exponents: 2, 3, 5, 7, 13, 17, 19, 31, 61, 89, 107, 127, 521, 607, 1279, 2203, 2281, 3217, 4253, 4423, 9689, 9941, 11213, 19937, 21701, 23209, 44497, 86243, 110503, 132049, 216091, 756839, 859433, 1257787, 1398269, 2976221, 3021377, 6972593, ...

Of these, exponents up to $6{,}972{,}593$ fall within our range. All should appear as survivors.

## Analysis

> **PENDING** — will analyze:
>
> 1. What fraction of prime exponents survive trial factoring to $10^{12}$?
> 2. Do all known Mersenne primes in range appear as survivors?
> 3. How many unknown candidates survive — are they likely prime or just hard to factor?
> 4. Distribution of factor sizes — how large is the typical smallest factor?

## Reproducibility

```bash
git clone https://github.com/cahlen/idontknow
cd idontknow
nvcc -O3 -arch=sm_100a -o mersenne_check scripts/experiments/mersenne-sieve/mersenne_check.cu

# Quick test: exponents up to 10,000
./mersenne_check 10000

# Full run: exponents up to 10 million
./scripts/experiments/mersenne-sieve/run.sh
```

---

*Computed on NVIDIA DGX B200. Code: [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*
