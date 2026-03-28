---
title: "Mandelbrot Set at 10^15 Zoom: 8K Renders with Double-Double Arithmetic on B200"
slug: mandelbrot-deep-zoom-8k
date: 2026-04-03
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
  custom_kernel: scripts/experiments/mandelbrot-depth/mandelbrot_deep.cu

tags:
  domain: [fractals, complex-dynamics, visualization]
  hardware: [b200, dgx]
  method: [cuda-kernel, double-double-arithmetic, high-precision]

results:
  max_zoom: "PENDING"
  resolution: "8192 × 8192"
  status: "NOT YET RUN"

code: https://github.com/cahlen/idontknow
data: /data/mandelbrot-deep/
---

# Mandelbrot Set at $10^{15}$ Zoom: 8K Renders with Double-Double Arithmetic

## Abstract

We render the Mandelbrot set at five zoom levels from $1\times$ to $10^{15}\times$ at 8192 × 8192 resolution using a custom CUDA kernel with **double-double arithmetic** — a technique that pairs two 64-bit floats to achieve ~31 decimal digits of precision. Standard double precision fails beyond zoom $\sim 10^{13}$; our approach pushes to $10^{15}$ before precision degrades, at each point iterating up to 1,000,000 times. We target the Misiurewicz point at $c \approx -0.74364 + 0.13183i$, one of the most visually rich regions of the set.

## Background

### The Mandelbrot Set

The **Mandelbrot set** $\mathcal{M}$ is the set of complex numbers $c$ for which the orbit of $0$ under iteration of $f_c(z) = z^2 + c$ remains bounded:

$$\mathcal{M} = \left\{ c \in \mathbb{C} : \sup_{n \geq 0} |f_c^n(0)| < \infty \right\}$$

The boundary $\partial\mathcal{M}$ has **Hausdorff dimension 2** (Shishikura, 1998) — it is as complex as a two-dimensional object despite being a curve. Zooming in reveals infinitely nested copies of the full set, connected by filaments of extraordinary delicacy.

### The Precision Problem

At zoom level $Z$, the pixel spacing is $\sim 4/(Z \cdot W)$ where $W$ is the image width. For $Z = 10^{15}$ and $W = 8192$:

$$\text{pixel size} \approx \frac{4}{10^{15} \times 8192} \approx 5 \times 10^{-19}$$

Standard `double` (IEEE 754) has ~15.9 decimal digits of precision ($2^{-52} \approx 2.2 \times 10^{-16}$), which is insufficient. We need at least 19 digits to resolve individual pixels.

### Double-Double Arithmetic

**Double-double** represents a number as $x = x_{\text{hi}} + x_{\text{lo}}$ where both are `double` and $|x_{\text{lo}}| \ll |x_{\text{hi}}|$. This gives approximately $2 \times 15.9 \approx 31$ decimal digits of precision with only $2\times$ the storage and $\sim 10\times$ the arithmetic cost of standard double.

The key operations:

$$\text{dd\_add}(a, b): \quad s = a_{\text{hi}} + b_{\text{hi}}, \quad t = \text{round-off}, \quad r = (s, t + a_{\text{lo}} + b_{\text{lo}})$$

$$\text{dd\_mul}(a, b): \quad p = a_{\text{hi}} \cdot b_{\text{hi}}, \quad e = \text{fma}(a_{\text{hi}}, b_{\text{hi}}, -p) + \text{cross terms}$$

The `fma` (fused multiply-add) instruction is critical — it computes $a \cdot b + c$ with a single rounding, giving us the exact error term from the multiplication.

### Why Misiurewicz Points?

**Misiurewicz points** are parameters $c$ where the critical orbit is eventually periodic but not periodic. Near these points, the Mandelbrot set exhibits particularly intricate structure — spirals, filaments, and miniature copies appear at every scale. The point $c \approx -0.74364388703 + 0.13182590421i$ is a classic target for deep zoom exploration.

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

Each CUDA thread computes one pixel:

1. Map pixel $(px, py)$ to complex coordinate $c = c_{\text{re}} + c_{\text{im}} i$ using double-double arithmetic
2. Iterate $z \leftarrow z^2 + c$ with double-double multiplication and addition
3. Check escape condition $|z|^2 > 4$ (using the `hi` component for speed)
4. Record iteration count

The kernel uses a 2D thread grid with 16×16 blocks, natural for image computation.

### Zoom Levels

| Level | Zoom | Max Iterations | Precision Needed | Description |
|-------|------|---------------|-----------------|-------------|
| 1 | $1\times$ | 10,000 | 8 digits | Full set overview |
| 2 | $500\times$ | 50,000 | 11 digits | Seahorse valley |
| 3 | $10^8\times$ | 100,000 | 17 digits | Misiurewicz spirals |
| 4 | $10^{12}\times$ | 500,000 | 21 digits | Deep filaments |
| 5 | $10^{15}\times$ | 1,000,000 | 24 digits | Extreme (DD required) |

## Results

> **PENDING** — experiment not yet run.

### Render Performance

| Zoom | Time | Mpix/sec | Avg iterations |
|------|------|----------|---------------|
| $1\times$ | **PENDING** | **PENDING** | **PENDING** |
| $10^8$ | **PENDING** | **PENDING** | **PENDING** |
| $10^{12}$ | **PENDING** | **PENDING** | **PENDING** |
| $10^{15}$ | **PENDING** | **PENDING** | **PENDING** |

### Images

> **PENDING** — rendered images will be linked here.

## Analysis

> **PENDING** — will analyze:
>
> 1. How does throughput (Mpix/sec) degrade with zoom level and max iterations?
> 2. At what zoom does double-double precision become insufficient?
> 3. Distribution of escape iterations — how many pixels hit max_iter?
> 4. Visual comparison of self-similarity across zoom levels

## Reproducibility

```bash
git clone https://github.com/cahlen/idontknow
cd idontknow
nvcc -O3 -arch=sm_100a -o mandelbrot_deep scripts/experiments/mandelbrot-depth/mandelbrot_deep.cu

# Quick test: 1K overview
./mandelbrot_deep 1024 1024 -0.5 0.0 1.0 1000 test.raw

# Full suite: 5 zoom levels at 8K
./scripts/experiments/mandelbrot-depth/run.sh
```

---

*Computed on NVIDIA DGX B200. Code: [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*
