# bigcompute.science

Experimental results from heavy computation. Custom CUDA kernels. GPU clusters. Big math. Serious hardware. Open results.

**Human-readable. Agent-consumable.** AI-audited, not peer-reviewed.

## Project Structure

This is the **website** repo. The project has three components:

| Repo | Purpose |
|------|---------|
| **[cahlen/bigcompute.science](https://github.com/cahlen/bigcompute.science)** | This repo — Astro website, experiment/finding pages, MCP server |
| **[cahlen/idontknow](https://github.com/cahlen/idontknow)** | Computation repo — CUDA kernels, results, paper, verifications |
| **[cahlen/guerrillamathematics.com](https://github.com/cahlen/guerrillamathematics.com)** | Merch store (private) |

### Datasets on Hugging Face

| Dataset | Contents |
|---------|----------|
| [cahlen/zaremba-conjecture-data](https://huggingface.co/datasets/cahlen/zaremba-conjecture-data) | Density logs, Dolgopyat profile, representation counts |
| [cahlen/ramanujan-machine-results](https://huggingface.co/datasets/cahlen/ramanujan-machine-results) | 586B candidate CF evaluations, hit CSVs |
| [cahlen/kronecker-coefficients](https://huggingface.co/datasets/cahlen/kronecker-coefficients) | S_20, S_30, S_40 character tables + Kronecker triples |
| [cahlen/continued-fraction-spectra](https://huggingface.co/datasets/cahlen/continued-fraction-spectra) | Hausdorff, Lyapunov, Minkowski, Flint Hills |

### MCP Server

22 tools at `mcp.bigcompute.science` — arXiv, zbMATH, OEIS, LMFDB, Mathlib, plus experiment data and AI audit tools. No auth required. Source in `workers/mcp/`.

## Adding an Experiment

Drop a markdown file in `src/content/experiments/`:

```
src/content/experiments/2026-04-15-my-experiment.md
```

Every experiment needs this frontmatter:

```yaml
---
title: "What You Did in One Line"
slug: my-experiment
date: 2026-04-15
author: your-github-username
author_github: https://github.com/your-github-username
status: complete  # or in-progress

hardware:
  name: Your Machine Name
  gpus: 8x NVIDIA B200 (183 GB each)
  gpu_interconnect: NVLink 5
  cpus: 2x Intel Xeon Platinum 8570
  ram: 2 TB DDR5

software:
  cuda: "13.0"
  python: "3.12"
  custom_kernel: path/to/your/kernel.cu  # if applicable

tags:
  domain: [number-theory, protein-folding, llm-training]  # what field
  hardware: [b200, a100, tpu-v5]                          # what iron
  method: [cuda-kernel, brute-force, mcts, vllm]          # how

results:
  summary: "One line of what you found"
  # add any structured key-value pairs here

code: https://github.com/you/your-repo
data: /data/my-experiment/  # optional, for raw data files
---

# Your Title

## Abstract
One paragraph.

## Hardware
What you used.

## Method
What you computed and how.

## Results
What you found.

## Analysis
What it means.

## Reproducibility
Exact commands to reproduce.
```

Then build:

```bash
npm install
npm run build    # static output in dist/
npm run dev      # local dev server at localhost:4321
```

## Agent Consumption

Every experiment has structured YAML frontmatter that agents can parse directly. See [`public/llms.txt`](public/llms.txt) for the consumption guide.

## Deploy

Connected to Cloudflare Pages. Push to `main` and it auto-deploys to [bigcompute.science](https://bigcompute.science).

- Build command: `npm run build`
- Output directory: `dist`

## Stack

- [Astro](https://astro.build) — static site generator
- [KaTeX](https://katex.org) — LaTeX math rendering
- [Cloudflare Pages](https://pages.cloudflare.com) — hosting
- Markdown + YAML frontmatter — content format

## License

Content is CC BY 4.0. Code is MIT.
