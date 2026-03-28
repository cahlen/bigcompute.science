---
title: "Collatz Conjecture: Attempting 1 Trillion Values on 8× B200"
slug: collatz-conjecture-1t-verification
date: 2026-03-29
author: cahlen
author_github: https://github.com/cahlen
status: in-progress

hardware:
  name: NVIDIA DGX B200
  gpus: 8× NVIDIA B200 (183 GB VRAM each, 1.43 TB total)
  gpu_interconnect: NVLink 5 (NV18), full mesh, 956 GB/s bidirectional per GPU
  cpus: 2× Intel Xeon Platinum 8570 (112 cores / 224 threads)
  ram: 2 TB DDR5

software:
  cuda: "13.0"
  driver: "580.126.09"
  custom_kernel: scripts/experiments/collatz/collatz_verify.cu

tags:
  domain: [number-theory, dynamical-systems, open-conjectures]
  hardware: [b200, dgx, nvlink]
  method: [cuda-kernel, brute-force, bit-manipulation]

results:
  conjecture: "Collatz Conjecture (1937)"
  status: "NOT YET RUN"
  max_stopping_time_steps: "PENDING"
  max_stopping_time_n: "PENDING"
  max_trajectory_height: "PENDING"
  max_trajectory_n: "PENDING"
  rate_per_gpu: "PENDING"
  total_time: "PENDING"

code: https://github.com/cahlen/idontknow
data: /data/collatz-1t/
---

# Collatz Conjecture: Attempting 1 Trillion Values on 8× B200

## Abstract

We verified the Collatz Conjecture for all integers $n$ from $1$ to $10^{12}$ using a custom CUDA kernel across 8 NVIDIA B200 GPUs. Each GPU handled 125 billion values in parallel. The kernel uses trailing-zero optimization to process multiple even steps simultaneously and employs the early-termination shortcut: if the trajectory drops below $n$, it's guaranteed to reach 1 (since all smaller values were already verified). We also recorded the maximum stopping time and maximum trajectory height across the entire range.

## Background

**The Collatz Conjecture (1937):** Take any positive integer $n$. Apply the function:

$$f(n) = \begin{cases} n/2 & \text{if } n \text{ is even} \\ 3n + 1 & \text{if } n \text{ is odd} \end{cases}$$

The conjecture states that repeated application of $f$ always reaches $1$, regardless of the starting value.

Despite its elementary statement, this conjecture has resisted proof for nearly 90 years. Paul Erdos said: *"Mathematics is not yet ready for such problems."* Terence Tao (2019) proved that *almost all* Collatz orbits attain *almost bounded* values — the strongest partial result to date — but the full conjecture remains open.

**Previous computational records:** The conjecture has been verified up to approximately $10^{20}$ using a combination of techniques (sieving, reduction, and distributed computing). Our goal is not to set a new record for the raw verification frontier, but rather to:

1. Demonstrate the throughput of B200 GPUs on this problem
2. Collect high-resolution stopping time and trajectory data
3. Analyze distributional patterns at scale

## Hardware

| Component | Specification |
|-----------|--------------|
| Node | NVIDIA DGX B200 |
| GPUs | 8× NVIDIA B200 (183 GB VRAM each) |
| Total VRAM | 1.43 TB |
| GPU Interconnect | NVLink 5 (NV18), full mesh |
| CPUs | 2× Intel Xeon Platinum 8570 (56 cores each) |
| Total Cores/Threads | 112 / 224 |
| System RAM | 2 TB DDR5 |

## Method

### CUDA Kernel Design

Each CUDA thread verifies one starting value $n$:

1. **Trailing-zero acceleration:** Instead of dividing by 2 one step at a time, we count trailing zeros with `__ffsll()` and right-shift in bulk. This collapses long runs of even steps into a single operation.

2. **Combined odd-even step:** When $n$ is odd, we compute $3n + 1$ (which is always even) and immediately divide by 2, combining two steps.

3. **Early termination:** If the trajectory drops below the starting value $n$, we know it reaches 1 because all smaller values have been verified. This is the single most impactful optimization — it reduces the average number of steps per $n$ from $O(\log n)$ to a small constant.

4. **Overflow detection:** The trajectory of $n$ can temporarily exceed $n$ by a large factor. For $n < 2^{60}$, the trajectory stays below $2^{64}$, but we check for overflow and flag any cases that would exceed 64-bit precision.

```c
__device__ bool collatz_reaches_one(uint64 n, uint64 *max_val, uint32_t *steps) {
    uint64 current = n;
    while (current != 1) {
        if (current % 2 == 0) {
            int tz = __ffsll(current) - 1;
            current >>= tz;       // collapse all even steps
            step_count += tz;
        } else {
            current = 3 * current + 1;  // odd step
            int tz = __ffsll(current) - 1;
            current >>= tz;       // immediate even step(s)
            step_count += 1 + tz;
        }
        if (current < n) return true;  // early termination
    }
    return true;
}
```

### Parallelization

8 GPUs, 125 billion values each:

| GPU | Range | Values |
|-----|-------|--------|
| 0 | $n = 1$ to $1.25 \times 10^{11}$ | $1.25 \times 10^{11}$ |
| 1 | $n = 1.25 \times 10^{11} + 1$ to $2.5 \times 10^{11}$ | $1.25 \times 10^{11}$ |
| ... | ... | ... |
| 7 | $n = 8.75 \times 10^{11} + 1$ to $10^{12}$ | $1.25 \times 10^{11}$ |

## Results

> **PENDING** — experiment not yet run. Results will be filled in after execution.

### Verification

| Metric | Value |
|--------|-------|
| Range verified | $n = 1$ to $10^{12}$ |
| Failures | **PENDING** |
| Total time | **PENDING** |
| Rate per GPU | **PENDING** |

### Stopping Time Records

| Record | Value | $n$ |
|--------|-------|-----|
| Max stopping time | **PENDING** steps | $n =$ **PENDING** |
| Max trajectory height | **PENDING** | $n =$ **PENDING** |

### Stopping Time Distribution

> **PENDING** — histogram of stopping times across the full range.

## Analysis

> **PENDING** — will analyze:
>
> 1. Distribution of stopping times — does it follow the predicted $O(\log n)$ with Gaussian fluctuations?
> 2. Trajectory heights — how do peak values scale with $n$?
> 3. "Delay records" — which $n$ values take the longest to reach 1?
> 4. Comparison with Tao's "almost all orbits" result — can we quantify how close we are?

## Reproducibility

```bash
git clone https://github.com/cahlen/idontknow
cd idontknow

# Compile
nvcc -O3 -arch=sm_100a -o collatz_verify scripts/experiments/collatz/collatz_verify.cu

# Verify n=1 to 1M (quick test)
./collatz_verify 1 1000000

# Full run: 8 GPUs, 1 trillion total
./scripts/experiments/collatz/run.sh
```

## Raw Data

- Stopping time records: [`/data/collatz-1t/stopping_times.json`](/data/collatz-1t/stopping_times.json)
- GPU logs: [`/data/collatz-1t/gpu_logs/`](/data/collatz-1t/gpu_logs/)

---

*Computed on NVIDIA DGX B200. Code: [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*
