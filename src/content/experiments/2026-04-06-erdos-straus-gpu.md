---
title: "Erdos-Straus Conjecture: Solution Counting to 10^8 on B200"
slug: erdos-straus-gpu
date: 2026-04-06
author: cahlen
author_github: https://github.com/cahlen
status: in-progress

hardware:
  name: NVIDIA DGX B200
  gpus: 1x NVIDIA B200 (183 GB VRAM)
  gpu_interconnect: N/A (single GPU)
  cpus: Intel Xeon
  ram: 1.4 TB

software:
  cuda: "12.8"
  method: GPU-parallel solution enumeration per prime
  custom_kernel: scripts/experiments/erdos-straus/erdos_straus.cu

tags:
  domain: [number-theory, diophantine-equations, computational-mathematics]
  hardware: [b200]
  method: [exhaustive-enumeration, prime-sieve, solution-counting]

results:
  problem: "Verify the Erdos-Straus conjecture (4/n = 1/x + 1/y + 1/z) and count solutions f(p) for all primes p up to N"
  status: "Kernel compiled, first run in progress"
  open_questions:
    - "Growth rate of f(p): does mean f(p) grow as c*log(p)?"
    - "Distribution of barely-solvable primes (f(p) = 1)"
    - "Are there primes > 10^8 with unusually low f(p)?"
    - "Connection between f(p) and p mod 4, p mod 24 residue classes"
  data: https://huggingface.co/datasets/cahlen/zaremba-conjecture-data
  code: https://github.com/cahlen/idontknow/blob/main/scripts/experiments/erdos-straus/erdos_straus.cu
---

# Erdos-Straus Conjecture: GPU Solution Counting

## The Conjecture

For every integer $n \geq 2$, the equation

$$\frac{4}{n} = \frac{1}{x} + \frac{1}{y} + \frac{1}{z}$$

has a solution in positive integers $x, y, z$. This has been verified computationally for all $n \leq 10^{14}$ (Swett 1999, Elsholtz-Tao 2013 framework) but remains unproven.

## What This Experiment Does

Rather than just verifying the conjecture (which is known to hold to enormous bounds), we count the **number of solutions** $f(p)$ for each prime $p$. Composites always have solutions inherited from their factors, so primes are the hard cases.

The solution count $f(p)$ and its distribution contain structural information:
- **Barely-solvable primes** ($f(p) = 1$): How rare are these? Do they thin out?
- **Growth rate**: Does mean $f(p)$ grow logarithmically, polynomially?
- **Residue class structure**: How does $f(p)$ depend on $p \pmod{4}$, $p \pmod{24}$?

## Method

For each prime $p$, the kernel enumerates all ordered triples $(x, y, z)$ with $x \leq y \leq z$ satisfying $4/p = 1/x + 1/y + 1/z$:

1. For $x$ in $[\lfloor p/4 \rfloor + 1, \lfloor 3p/4 \rfloor]$:
   - Compute remainder: $\text{num}/\text{den} = (4x - p) / (px)$
   - For $y$ in $[\lceil \text{den}/\text{num} \rceil, \lfloor 2\text{den}/\text{num} \rfloor]$:
     - Check if $z = \text{den} \cdot y / (\text{num} \cdot y - \text{den})$ is a positive integer with $z \geq y$

Each GPU thread handles one prime independently. Primes are sieved on CPU (Eratosthenes), then the full array is uploaded to GPU for parallel processing.

## Reproduce

```bash
nvcc -O3 -arch=sm_90 -o erdos_straus scripts/experiments/erdos-straus/erdos_straus.cu -lm
./erdos_straus 100   # all primes to 10^8
```

## References

1. Erdos, P. (1950). "On a Diophantine equation." Mat. Lapok, 1, pp. 192-210.
2. Elsholtz, C. and Tao, T. (2013). "Counting the number of solutions to the Erdos-Straus equation on unit fractions." Journal of the Australian Mathematical Society, 94(1), pp. 59-105.
3. Swett, A. (1999). "Proof that 4/n = 1/x + 1/y + 1/z for n up to 10^14."

---

*Human-AI collaboration (Cahlen Humphreys + Claude). All code and data open.*
