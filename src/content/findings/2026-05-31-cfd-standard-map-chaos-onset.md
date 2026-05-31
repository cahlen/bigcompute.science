---
title: "Standard Map Chaos Onset: Λ(K) Crosses Literature K_crit on RTX 5090"
slug: cfd-standard-map-chaos-onset
date: 2026-05-31
author: cahlen
author_github: https://github.com/cahlen
significance: high

domain: [fluid-dynamics, chaotic-advection, dynamical-systems, ergodic-theory]
related_experiment: /experiments/cfd-chaotic-advection/

summary: "Custom CUDA Lyapunov sweep of the Chirikov standard map: 16.8M trajectories in 116.6s on RTX 5090, zero NaN/Inf. At literature K_crit ≈ 0.972, mean Λ ≈ 0.045 with >99.9% of ICs positive — consistent with chaotic advection onset in area-preserving mixing."

data:
  trajectories: 16777216
  k_grid: 2048
  ic_per_k: 8192
  iterations: 50000
  k_max: 5.0
  elapsed_s: 116.59
  mean_lambda_at_k_crit: 0.0446
  fraction_positive_at_k_crit: 0.999
  mean_lambda_at_k5: 0.956
  validation_k0: 0.0
  hardware: "NVIDIA RTX 5090"
  method: "Benettin tangent-vector Lyapunov, custom CUDA (sm_120)"
  status: "CONFIRMED — certifying run, zero numerical failures"

certification:
  level: silver
  verdict: ACCEPT_WITH_REVISION
  note: "3-model AI peer review (2026-05-31): gpt-4.1, o3-pro, gemini-2.5-pro — unanimous silver"
---

# Standard Map Chaos Onset: Λ(K) Crosses Literature K_crit on RTX 5090

## The Finding

We computed the **largest Lyapunov exponent** $\Lambda(K)$ of the **Chirikov standard map** — the canonical phase-space model for **chaotic advection** in 2D incompressible flows — using a custom CUDA kernel on a single **RTX 5090**.

Deep certifying sweep:

| Parameter | Value |
|-----------|-------|
| $K$ grid | 2048 points in $[0, 5]$ |
| Initial conditions per $K$ | 8192 |
| Iterations | 50,000 (Benettin) |
| Total trajectories | **16,777,216** |
| Wall time | **116.6 s** |
| NaN/Inf | **0** |

At the literature chaos threshold $K_{\mathrm{crit}} \approx 0.971635406$ (Chirikov, 1979):

$$\bar{\Lambda}(K_{\mathrm{crit}}) \approx 0.0446, \qquad \text{fraction}(\Lambda > 0) > 99.9\%$$

At $K = 5$: $\bar{\Lambda} \approx 0.956$ (fully developed chaos in our sampling).

![Lyapunov spectrum](/data/cfd-chaotic-advection/lyapunov_spectrum.svg)

## Important nuance (read before interpreting the curve)

**Finite-time sensitivity is not global chaos.** Our Benettin estimate uses 50,000 iterations per initial condition. At small $K$, some individual ICs can show slightly **negative** finite-time $\Lambda$ (regular islands, slow convergence) even while the **mean** over 8192 ICs is positive. The heuristic “onset” where $\bar{\Lambda} > 0.01$ appears near $K \approx 0.75$ is therefore **not** the literature chaos threshold $K_{\mathrm{crit}} \approx 0.972$ — it marks where finite-time tangent growth becomes detectable in our sampling, not where the phase space is globally chaotic.

**Mean $\bar{\Lambda}(K)$ is not strictly monotonic.** The deep sweep shows tiny non-monotonic wiggles in $\bar{\Lambda}(K)$ at the grid level (IC sampling noise at fixed iteration count). The overall trend is increasing; we do not claim a theorem of monotonicity.

**What we do claim:** at the established $K_{\mathrm{crit}}$, our certifying sweep finds $\bar{\Lambda} \approx 0.045$ with $>99.9\%$ of ICs positive — consistent with the known integrability-to-chaos transition, not a new threshold estimate.

## Why This Matters for CFD

The standard map

$$p' = p + K\sin\theta, \qquad \theta' = \theta + p' \pmod{2\pi}$$

is area-preserving on $\mathbb{T}^2$. The same structure appears in **Stokes flow with periodic forcing**: passive tracers can mix chaotically even when the velocity field is laminar (Aref 1984; Ottino 1989).

This experiment is the first **bigcompute-style CFD kernel**: reduce a fluid-mixing question to a parallel GPU primitive, certify the run, publish immediately.

The map connects to our **transfer-operator / Hausdorff** work: both study ergodic properties of composition operators; here the “digits” are replaced by a physical coupling parameter $K$.

## Key Results

### Integrable limit validated

$\bar{\Lambda}(0) = 0$ exactly (within floating point), as expected for $K=0$ (pure rotation on the torus).

### Growth of $\bar{\Lambda}(K)$

| $K$ | $\bar{\Lambda}(K)$ | frac($\Lambda>0$) |
|-----|---------------------|-------------------|
| 0.75 | 0.011 | 99.9% |
| **0.972** (literature $K_{\mathrm{crit}}$) | **0.045** | **>99.9%** |
| 1.0 | 0.050 | >99.9% |
| 2.0 | 0.332 | 100% |
| 5.0 | 0.956 | 100% |

$\bar{\Lambda}(K)$ **generally increases** with $K$ on our grid; small non-monotonic wiggles appear from finite IC sampling (see nuance above). The transition is **gradual**, not a sharp step — consistent with a progressive invasion of chaotic orbits near $K_{\mathrm{crit}}$ rather than an instantaneous flip.

### Reproducibility

```bash
git clone https://github.com/cahlen/idontknow.git
cd idontknow
./scripts/experiments/cfd-chaotic-advection/run.sh 2048 8192 50000 5.0
python3 scripts/experiments/cfd-chaotic-advection/plot_lyapunov.py \
  scripts/experiments/cfd-chaotic-advection/results/lyapunov_k2048_ic8192_iter50000.csv \
  -o lyapunov_spectrum.svg
```

## Limitations (to our knowledge)

- We estimate **one** Lyapunov exponent via Benettin averaging, not the full Lyapunov spectrum.
- 50,000 iterations may not saturate Lyapunov estimates for near-integrable orbits at small $K$; per-IC negative finite-time $\Lambda$ values can occur while ensemble means are positive.
- We do **not** refine $K_{\mathrm{crit}}$; we compare against the literature value at our grid resolution.
- Not peer-reviewed. AI audit pending.

## References

- Benettin, G., Galgani, L., Giorgilli, A., Strelcyn, J.-M. (1980). *Meccanica* — Lyapunov characteristic exponents (Benettin method)
- Chirikov, B. V. (1979). *Phys. Rep.* — standard map
- Greene, J. M. (1979). *J. Math. Phys.* — stochastic threshold for the standard map
- Aref, H. (1984). *J. Fluid Mech.* — chaotic advection
- Ottino, J. M. (1989). *The Kinematics of Mixing*

*Human–AI collaboration. Code: [idontknow/cfd-chaotic-advection](https://github.com/cahlen/idontknow/tree/main/scripts/experiments/cfd-chaotic-advection).*
