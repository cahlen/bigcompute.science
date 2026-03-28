---
title: "MCTS vs. Naive Sampling for LLM Theorem Proving: A Scaling Benchmark"
slug: mcts-proof-search-benchmark
date: 2026-03-30
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
  vllm: "0.18.0"
  lean: "4.29.0-rc8"
  python: "3.12"
  custom_kernel: scripts/experiments/mcts-proof-search/mcts_prover.py

tags:
  domain: [theorem-proving, ai, search-algorithms]
  hardware: [b200, dgx]
  method: [mcts, llm-proving, tree-search, formal-verification]

results:
  benchmark: "MCTS vs naive sampling for Lean 4 proof search"
  models_tested: [Goedel-Prover-V2-32B, Kimina-Prover-72B]
  test_suite: "Zaremba's Conjecture d=1..50"
  naive_success_rate: "PENDING"
  mcts_success_rate: "PENDING"
  speedup: "PENDING"

code: https://github.com/cahlen/idontknow
data: /data/mcts-benchmark/
---

# MCTS vs. Naive Sampling for LLM Theorem Proving

## Abstract

In our previous experiment ([Zaremba verification](/experiments/zaremba-conjecture-8b-verification/)), we discovered that SOTA theorem-proving LLMs nail proof *structure* but fail at witness *search* — producing syntactically perfect proofs with wrong values across 80 attempts. This experiment tests whether Monte Carlo Tree Search (MCTS) over the tactic space fixes this bottleneck. We compare naive i.i.d. sampling (the standard approach) against UCB1-guided tree search on the same proof obligations, measuring success rate vs. compute budget.

## Background

### The Witness Search Problem

When proving $\exists a,\; P(a)$ in Lean 4, the LLM must find a concrete witness $a$ satisfying $P$. In our Zaremba experiment:

- Both Goedel-32B and Kimina-72B always generated the correct proof *template*: `exact ⟨WITNESS, by decide, by decide, by native_decide, by native_decide⟩`
- But for $d = 9$, both models tried $a = 1$ and $a = 3$ across 80 samples without ever trying the correct $a = 2$
- **The failure mode is not reasoning — it's exploration**

### Why MCTS Should Help

Naive sampling draws $N$ independent proofs from the LLM. If the correct witness has probability $p$ per sample, success probability is $1 - (1-p)^N$. But LLMs have **mode collapse** — they repeat the same high-probability witnesses and never explore the tail.

MCTS addresses this by:
1. **Tracking which tactics failed** — the UCB1 score deprioritizes repeatedly-failing branches
2. **Feeding failures back to the LLM** — the prompt includes previous failed attempts
3. **Systematic exploration** — UCB1's exploration term forces trying new branches

### SOTA Context

- **AlphaProof (DeepMind, 2024):** Used AlphaZero-style MCTS to solve 4 out of 6 IMO 2024 problems. The search component was critical.
- **Seed Prover 1.5 (ByteDance, 2025):** Best-first tree search with DPO-trained value function. 99.6% on MiniF2F.
- **BFS-Prover-V2 (ByteDance, 2025):** Step-level prover with planner enhancement. 95.08% on MiniF2F with search.

All SOTA systems use search. Nobody has published clean **ablations** comparing search vs. no-search on the same model and benchmark. That's what we measure.

## Method

### Test Suite

Zaremba's Conjecture for $d = 1, \ldots, 50$ with $A = 5$. Each theorem requires finding a witness $a$ coprime to $d$ with bounded CF quotients. Difficulty varies: $d = 1$ is trivial ($a = 1$), $d = 49$ requires finding a non-obvious witness.

### Comparison

| Method | Description | Budget |
|--------|-------------|--------|
| **Naive** | Sample $N$ independent proofs, accept first that compiles | $N$ evals |
| **MCTS** | UCB1 tree search, 8 children per expansion, backpropagation | $N$ evals |

Both methods use the **same LLM** (Goedel-32B or Kimina-72B), the **same total Lean evaluations**, and the **same prompts** (modulo MCTS feeding back failures). The only difference is whether we search or sample.

We sweep $N \in \{8, 32, 64, 128, 256, 512\}$ and measure:
- **Success rate:** fraction of 50 theorems proved
- **First-proof eval:** how many evals until the first proof is found
- **Unique tactics tried:** how many distinct proof attempts were generated

### Models

Served on split GPU sets via vLLM:

| Model | GPUs | Port |
|-------|------|------|
| Goedel-Prover-V2-32B | 0–3 | 8000 |
| Kimina-Prover-72B | 4–7 | 8001 |

## Results

> **PENDING** — experiment not yet run.

### Success Rate vs. Budget

| Budget $N$ | Naive (Goedel) | MCTS (Goedel) | Naive (Kimina) | MCTS (Kimina) |
|-----------|----------------|---------------|----------------|---------------|
| 8 | **PENDING** | **PENDING** | **PENDING** | **PENDING** |
| 32 | **PENDING** | **PENDING** | **PENDING** | **PENDING** |
| 64 | **PENDING** | **PENDING** | **PENDING** | **PENDING** |
| 128 | **PENDING** | **PENDING** | **PENDING** | **PENDING** |
| 256 | **PENDING** | **PENDING** | **PENDING** | **PENDING** |
| 512 | **PENDING** | **PENDING** | **PENDING** | **PENDING** |

### Exploration Efficiency

| Budget $N$ | Unique Tactics (Naive) | Unique Tactics (MCTS) |
|-----------|----------------------|---------------------|
| 64 | **PENDING** | **PENDING** |
| 256 | **PENDING** | **PENDING** |

### Case Study: $d = 9$

The theorem that defeated both models in naive mode (correct witness $a = 2$):

| Method | Budget to prove | Witnesses tried before success |
|--------|----------------|-------------------------------|
| Naive (Goedel) | **PENDING** | **PENDING** |
| MCTS (Goedel) | **PENDING** | **PENDING** |

## Analysis

> **PENDING** — will analyze:
>
> 1. Does MCTS consistently outperform naive sampling, or only on "hard" witnesses?
> 2. What's the scaling law: how does success rate grow with budget for each method?
> 3. Is the MCTS exploration term (UCB1) actually necessary, or does just feeding back failures suffice?
> 4. Does MCTS help more for larger models or smaller models?

## Reproducibility

```bash
git clone https://github.com/cahlen/idontknow
cd idontknow

# Start model servers (requires downloaded weights)
CUDA_VISIBLE_DEVICES=0,1,2,3 ./scripts/serve-model.sh models/Goedel-Prover-V2-32B --tp 4 --port 8000 &
CUDA_VISIBLE_DEVICES=4,5,6,7 ./scripts/serve-model.sh models/Kimina-Prover-72B --tp 4 --port 8001 &

# Run MCTS prover
python scripts/experiments/mcts-proof-search/mcts_prover.py \
    --server http://localhost:8000 \
    --file lean4-proving/conjectures/zaremba.lean \
    --budget 256 --rollouts 8

# Run naive prover (for comparison)
python lean4-proving/prover.py \
    --server http://localhost:8000 \
    --file lean4-proving/conjectures/zaremba.lean \
    --max-attempts 32 --zaremba
```

---

*Computed on NVIDIA DGX B200. Code: [github.com/cahlen/idontknow](https://github.com/cahlen/idontknow).*
