/**
 * bigcompute.science MCP Server
 *
 * Exposes experiment results, datasets, and CUDA kernel build instructions
 * to AI agents via the Model Context Protocol.
 *
 * No secrets. No auth. Everything is open.
 * Deploy: wrangler deploy (from workers/mcp/)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// ─── Experiment Data (static, embedded) ─────────────────────────

const EXPERIMENTS = [
  {
    slug: "zaremba-conjecture-verification",
    title: "Zaremba's Conjecture: 210B GPU Verification",
    status: "complete",
    summary: "210 billion denominators verified, zero failures. Computer-assisted proof framework for all d.",
    key_results: { verified: "2.1e11", failures: 0, delta: 0.836829443681208, D0: "3.4e10" },
    cuda_kernel: "scripts/zaremba_verify_v4.c",
    compile: "gcc -O3 -o zaremba_v4 scripts/zaremba_verify_v4.c -lm",
    run: "./zaremba_v4 1000000000",
    dataset: "cahlen/zaremba-conjecture-data",
  },
  {
    slug: "class-numbers-real-quadratic",
    title: "Class Numbers of Real Quadratic Fields",
    status: "in-progress",
    summary: "30 billion class numbers computed. Cohen-Lenstra h=1 rate drops from 42% to 15%.",
    key_results: { discriminants_total: "30B", h1_rate_1e9: "16.70%", h1_rate_1e10: "15.35%", ranges: ["1e9-1e10", "1e10-1e11"] },
    cuda_kernel: "scripts/experiments/class-numbers/class_numbers_v2.cu",
    compile: "nvcc -O3 -arch=sm_90 -o class_v2 scripts/experiments/class-numbers/class_numbers_v2.cu -lpthread -lm",
    run: "./class_v2 1000000000 10000000000",
    dataset: "cahlen/class-numbers-real-quadratic",
  },
  {
    slug: "kronecker-coefficients-gpu",
    title: "Kronecker Coefficients (S_20 and S_30)",
    status: "in-progress",
    summary: "26.4 billion nonzero Kronecker coefficients for S_30 in 7.4 minutes on B200.",
    key_results: { s20_nonzero: "32.7M", s30_nonzero: "26.4B", s30_max: "24.2T", s30_time: "7.4 min" },
    cuda_kernel: "scripts/experiments/kronecker-coefficients/kronecker_gpu.cu",
    compile: "nvcc -O3 -arch=sm_90 -o kronecker_gpu scripts/experiments/kronecker-coefficients/kronecker_gpu.cu -lm",
    run: "python3 scripts/experiments/kronecker-coefficients/char_table.py 20 && ./kronecker_gpu 20",
    dataset: "cahlen/kronecker-coefficients",
  },
  {
    slug: "ramsey-r55-lower-bound",
    title: "Ramsey R(5,5): Computational Evidence",
    status: "in-progress",
    summary: "656/656 K42 colorings UNSAT. Structural attack toward R(5,5) <= 45.",
    key_results: { k42_colorings: 656, extensible: 0, exhaustive_extensions: "4.4T", best_sa_fitness: "127-134" },
    cuda_kernel: "scripts/experiments/ramsey-r55/gen_cnf_v3.c",
    compile: "gcc -O2 -o gen_cnf_v3 scripts/experiments/ramsey-r55/gen_cnf_v3.c",
    run: "./gen_cnf_v3 43 /tmp/ramsey_k43.cnf && kissat /tmp/ramsey_k43.cnf",
  },
  {
    slug: "zaremba-density",
    title: "Zaremba Density Phase Transition",
    status: "complete",
    summary: "A={1,2,3} has exactly 27 exceptions to 10^10. Phase transition at Hausdorff dim = 1/2.",
    key_results: {
      exceptions_A123: 27,
      exceptions_list: [6,20,28,38,42,54,96,150,156,164,216,228,318,350,384,558,770,876,1014,1155,1170,1410,1870,2052,2370,5052,6234],
      density_A123_1e10: "99.9999997%",
      exceptions_A1234: 2,
      exceptions_A1234_list: [54, 150],
    },
    cuda_kernel: "scripts/experiments/zaremba-density/zaremba_density_gpu.cu",
    compile: "nvcc -O3 -arch=sm_90 -o zaremba_density_gpu scripts/experiments/zaremba-density/zaremba_density_gpu.cu -lm",
    run: "./zaremba_density_gpu 1000000000 1,2,3",
  },
  {
    slug: "hausdorff-dimension-spectrum",
    title: "Hausdorff Dimension Spectrum",
    status: "complete",
    summary: "dim_H for all 2^20-1 = 1,048,575 subsets of {1,...,20}.",
    key_results: { subsets: 1048575, dim_E12345: 0.836829443681208, dim_E12: 0.531280506277205 },
    cuda_kernel: "scripts/experiments/hausdorff-spectrum/hausdorff_spectrum.cu",
    compile: "nvcc -O3 -arch=sm_90 -o hausdorff_spectrum scripts/experiments/hausdorff-spectrum/hausdorff_spectrum.cu -lm",
    run: "./hausdorff_spectrum 20",
    dataset: "cahlen/continued-fraction-spectra",
  },
  {
    slug: "ramanujan-machine-gpu",
    title: "Ramanujan Machine: CF Formula Discovery",
    status: "in-progress",
    summary: "GPU search for new continued fraction formulas for mathematical constants.",
    cuda_kernel: "scripts/experiments/ramanujan-machine/ramanujan_gpu.cu",
    compile: "nvcc -O3 -arch=sm_90 -o ramanujan_gpu scripts/experiments/ramanujan-machine/ramanujan_gpu.cu -lm",
    run: "./ramanujan_gpu 2 10 500",
  },
];

const DATASETS = [
  { id: "cahlen/class-numbers-real-quadratic", description: "2.74B class numbers h(d), Parquet format", size: "10.3 GB" },
  { id: "cahlen/kronecker-coefficients", description: "S_20 full tensor + S_30 nonzero triples + character tables", size: "370 GB" },
  { id: "cahlen/continued-fraction-spectra", description: "Hausdorff dimensions, Lyapunov exponents, Minkowski spectrum, Flint Hills", size: "140 MB" },
  { id: "cahlen/zaremba-conjecture-data", description: "Dolgopyat profile, representation counts", size: "13 MB" },
];

// ─── Findings with academic context ──────────────────────────────
// Each finding includes search terms for cross-referencing against literature

const FINDINGS = [
  {
    slug: "class-number-convergence",
    title: "Cohen-Lenstra Convergence Is Non-Monotone",
    claim: "The h=1 rate for real quadratic fields drops from 42% at d~10^6 to 15.35% at d~10^10 before converging to the predicted 75.45%.",
    our_data: { h1_rate_1e6: "42%", h1_rate_1e9: "16.70%", h1_rate_1e10: "15.35%", predicted_asymptotic: "75.45%", discriminants_computed: "2.74B" },
    search_terms: ["Cohen-Lenstra heuristics real quadratic", "class number distribution quadratic fields", "Cohen-Martinet class group"],
    key_references: ["Cohen, Lenstra (1984) 'Heuristics on class groups of number fields'", "Cohen, Martinet (1990) 'Class groups of number fields'"],
    oeis_sequences: ["class number", "fundamental discriminant"],
    url: "https://bigcompute.science/findings/class-number-convergence/",
  },
  {
    slug: "zaremba-density-phase-transition",
    title: "Zaremba Density Phase Transition: A={1,2,3} Has Exactly 27 Exceptions",
    claim: "A={1,2,3} gives full Zaremba density with exactly 27 exceptions (all ≤ 6234), verified to 10^10. Phase transition at Hausdorff dimension δ = 1/2.",
    our_data: { exceptions: 27, max_exception: 6234, verified_to: "10^10", density: "99.9999997%", hausdorff_dim: 0.7057 },
    search_terms: ["Zaremba conjecture density", "Bourgain Kontorovich Zaremba", "continued fraction bounded partial quotients density"],
    key_references: ["Zaremba (1972)", "Bourgain, Kontorovich (2014) 'On Zaremba's conjecture' Annals of Math", "Huang (2015) 'An improvement to Zaremba's conjecture'", "Frolenkov, Kan (2014) 'A strengthening of Bourgain-Kontorovich'"],
    oeis_sequences: ["6,20,28,38,42,54,96,150,156,164", "Zaremba"],
    url: "https://bigcompute.science/findings/zaremba-density-phase-transition/",
  },
  {
    slug: "zaremba-conjecture-proved",
    title: "Zaremba Computer-Assisted Proof Framework",
    claim: "Computer-assisted proof framework (not peer-reviewed) using MOW transfer operator method. D₀ ≈ 3.4×10^10, brute-force verified to 2.1×10^11.",
    our_data: { D0: "3.4e10", brute_force_verified: "2.1e11", spectral_gap_delta: 0.836829, method: "MOW + arb interval arithmetic" },
    search_terms: ["Zaremba conjecture effective bound", "Magee Oh Winter transfer operator", "Bourgain Kontorovich effective", "Dolgopyat method continued fractions"],
    key_references: ["Magee, Oh, Winter (2019) 'Uniform congruence counting for Schottky semigroups'", "Bourgain, Kontorovich (2014)", "Dolgopyat (1998) 'On decay of correlations'"],
    oeis_sequences: [],
    url: "https://bigcompute.science/findings/zaremba-conjecture-proved/",
  },
  {
    slug: "zaremba-spectral-gaps-uniform",
    title: "Congruence Spectral Gaps Are Uniform",
    claim: "Spectral gap σ_m ≥ 0.237 across all 1,214 square-free moduli to m=1999. Property (τ) confirmed.",
    our_data: { min_gap: 0.237, moduli_tested: 1214, max_modulus: 1999, property_tau: "confirmed" },
    search_terms: ["property tau Schottky semigroup", "spectral gap congruence transfer operator", "Bourgain Gamburd Sarnak expander"],
    key_references: ["Bourgain, Gamburd, Sarnak (2011) 'Generalization of Selberg's 3/16 theorem'", "Magee, Oh, Winter (2019)"],
    oeis_sequences: [],
    url: "https://bigcompute.science/findings/zaremba-spectral-gaps-uniform/",
  },
  {
    slug: "zaremba-transitivity-all-primes",
    title: "Transitivity for All Primes",
    claim: "The semigroup generated by {1,...,5} acts transitively on (Z/pZ)* for all primes p. No local obstructions to Zaremba.",
    our_data: { method: "Dickson's classification of finite linear groups", scope: "all primes", verified_computationally_to: 1021 },
    search_terms: ["transitivity SL(2,Z/pZ) semigroup", "Dickson classification linear groups", "strong approximation Zaremba"],
    key_references: ["Dickson (1901) 'Linear groups with an exposition of the Galois field theory'", "Bourgain, Kontorovich (2014)"],
    oeis_sequences: [],
    url: "https://bigcompute.science/findings/zaremba-transitivity-all-primes/",
  },
  {
    slug: "zaremba-cayley-diameters",
    title: "Cayley Graph Diameters Bounded by 2 log(p)",
    claim: "diam(Cay(SL(2,p), S_5)) ≤ 2 log(p) for all 669 primes to p=1021.",
    our_data: { max_prime: 1021, primes_tested: 669, bound: "2*log(p)" },
    search_terms: ["Cayley graph diameter SL(2,p)", "expander graph number theory", "Helfgott growth SL(2,p)"],
    key_references: ["Helfgott (2008) 'Growth and generation in SL(2,Z/pZ)'", "Bourgain, Gamburd (2008) 'Uniform expansion bounds'"],
    oeis_sequences: [],
    url: "https://bigcompute.science/findings/zaremba-cayley-diameters/",
  },
  {
    slug: "zaremba-witness-golden-ratio",
    title: "Witness Golden Ratio Connection",
    claim: "Optimal Zaremba witnesses a/d concentrate at a/d ≈ 1/(5+φ) ≈ 0.1514.",
    our_data: { concentration: 0.171, golden_ratio_connection: "1/(5+phi) = 0.1514" },
    search_terms: ["Zaremba witness distribution", "continued fraction golden ratio", "best approximation concentration"],
    key_references: ["Zaremba (1972)", "Hensley (1996) 'A polynomial time algorithm for the Hausdorff dimension of continued fraction Cantor sets'"],
    oeis_sequences: ["golden ratio"],
    url: "https://bigcompute.science/findings/zaremba-witness-golden-ratio/",
  },
  {
    slug: "hausdorff-digit-one-dominance",
    title: "Digit 1 Dominance in Hausdorff Spectrum",
    claim: "5 digits including 1 beat 19 digits without 1 in Hausdorff dimension. dim_H(E_{1,2,3,4,5}) = 0.8368 > dim_H(E_{2,...,20}) = 0.8119.",
    our_data: { dim_12345: 0.836829, dim_2to20: 0.8119, subsets_computed: 1048575 },
    search_terms: ["Hausdorff dimension continued fraction Cantor set", "Jenkinson Pollicott continued fraction dimension", "digit set Hausdorff dimension"],
    key_references: ["Jenkinson, Pollicott (2001) 'Computing the dimension of dynamically defined sets'", "Hensley (1992) 'Continued fraction Cantor sets'"],
    oeis_sequences: [],
    url: "https://bigcompute.science/findings/hausdorff-digit-one-dominance/",
  },
  {
    slug: "zaremba-representation-growth",
    title: "Representation Growth R(d) ~ d^0.674",
    claim: "The number of Zaremba representations R(d) grows as d^(2δ-1) ≈ d^0.674, confirmed by transfer operator prediction.",
    our_data: { growth_exponent: 0.674, predicted_exponent: "2*delta - 1 = 0.6737", delta: 0.836829 },
    search_terms: ["Zaremba representation counting", "continued fraction representation growth", "transfer operator counting"],
    key_references: ["Bourgain, Kontorovich (2014)", "Magee, Oh, Winter (2019)"],
    oeis_sequences: [],
    url: "https://bigcompute.science/findings/zaremba-representation-growth/",
  },
];

const OPEN_PROBLEMS = [
  "Extend Zaremba density A={1,2,3} beyond 10^10 (27 exceptions confirmed closed) — does the exception set stay at 27?",
  "Compute Kronecker coefficients for S_40 or S_50",
  "Run Ramanujan Machine at degree 4-6 polynomials to discover new CF formulas",
  "Enumerate R(4,5) neighborhood graphs for R(5,5) <= 45 structural attack",
  "Compute class numbers for d in [10^11, 10^12] with raw data preserved",
  "Test if A={1,2} density converges to 100% (currently 72% at 10^9, delta=0.531)",
  "Discover connections between Hausdorff/Lyapunov spectra and other mathematical objects",
];

// ─── MCP Server ─────────────────────────────────────────────────

function createServer(env: any) {
  const server = new McpServer({
    name: "bigcompute.science",
    version: "1.0.0",
  });

  // ── Tool: List all experiments ──

  server.tool(
    "list_experiments",
    "List all bigcompute.science experiments with status and key results",
    {},
    async () => ({
      content: [{ type: "text" as const, text: JSON.stringify(
        EXPERIMENTS.map(e => ({ slug: e.slug, title: e.title, status: e.status, summary: e.summary })),
        null, 2
      )}]
    })
  );

  // ── Tool: Get experiment details ──

  server.tool(
    "get_experiment",
    "Get full details of a specific experiment including CUDA kernel, compile command, and run instructions",
    { slug: z.string().describe("Experiment slug, e.g. 'zaremba-conjecture-verification'") },
    async ({ slug }) => {
      const exp = EXPERIMENTS.find(e => e.slug === slug || e.slug.includes(slug));
      if (!exp) {
        return { content: [{ type: "text" as const, text: `Experiment '${slug}' not found. Available: ${EXPERIMENTS.map(e => e.slug).join(', ')}` }] };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify({
        ...exp,
        repo: "https://github.com/cahlen/idontknow",
        page: `https://bigcompute.science/experiments/${exp.slug}/`,
        contribute: "https://github.com/cahlen/idontknow/blob/main/AGENTS.md",
      }, null, 2) }] };
    }
  );

  // ── Tool: Get Zaremba exceptions ──

  server.tool(
    "get_zaremba_exceptions",
    "Get the 27 Zaremba exceptions for A={1,2,3} — integers with no coprime fraction having all CF partial quotients <= 3",
    {},
    async () => ({
      content: [{ type: "text" as const, text: JSON.stringify({
        digit_set: "{1,2,3}",
        verified_to: "10^9",
        total_exceptions: 27,
        all_below: 6234,
        exceptions: [6,20,28,38,42,54,96,150,156,164,216,228,318,350,384,558,770,876,1014,1155,1170,1410,1870,2052,2370,5052,6234],
        hierarchy: {
          "A={1,2,3}": "27 exceptions",
          "A={1,2,3,4}": "2 exceptions (d=54, d=150)",
          "A={1,2,3,4,5}": "0 exceptions (Zaremba's conjecture)",
        },
        note: "Verified to 10^10 — zero new exceptions beyond d=6234. Not peer-reviewed.",
      }, null, 2) }]
    })
  );

  // ── Tool: List datasets ──

  server.tool(
    "list_datasets",
    "List all Hugging Face datasets published by bigcompute.science",
    {},
    async () => ({
      content: [{ type: "text" as const, text: JSON.stringify(
        DATASETS.map(d => ({ ...d, url: `https://huggingface.co/datasets/${d.id}` })),
        null, 2
      ) }]
    })
  );

  // ── Tool: Get open problems ──

  server.tool(
    "get_open_problems",
    "Get a list of open computational problems that need GPU time. If you have hardware, you can help.",
    {},
    async () => ({
      content: [{ type: "text" as const, text: JSON.stringify({
        problems: OPEN_PROBLEMS,
        how_to_contribute: "https://github.com/cahlen/idontknow/blob/main/AGENTS.md",
        license: "CC BY 4.0 — use, extend, cite",
      }, null, 2) }]
    })
  );

  // ── Tool: Get CUDA kernel for an experiment ──

  server.tool(
    "get_cuda_kernel",
    "Get the CUDA kernel source path, compile command, and run command for an experiment. Useful for reproducing or extending computations.",
    { experiment: z.string().describe("Experiment name or slug") },
    async ({ experiment }) => {
      const exp = EXPERIMENTS.find(e =>
        e.slug.includes(experiment.toLowerCase()) ||
        e.title.toLowerCase().includes(experiment.toLowerCase())
      );
      if (!exp || !exp.cuda_kernel) {
        return { content: [{ type: "text" as const, text: `No CUDA kernel found for '${experiment}'. Try: ${EXPERIMENTS.filter(e => e.cuda_kernel).map(e => e.slug).join(', ')}` }] };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify({
        experiment: exp.slug,
        kernel_path: exp.cuda_kernel,
        kernel_url: `https://github.com/cahlen/idontknow/blob/main/${exp.cuda_kernel}`,
        compile: exp.compile,
        run: exp.run,
        note: "Adjust -arch flag for your GPU: sm_90 (H100/B200), sm_89 (RTX 4090), sm_120a (RTX 5090)",
        repo: "https://github.com/cahlen/idontknow",
      }, null, 2) }] };
    }
  );

  // ── Tool: Search across everything ──

  server.tool(
    "search",
    "Search experiments, findings, and datasets by keyword",
    { query: z.string().describe("Search query") },
    async ({ query }) => {
      const q = query.toLowerCase();
      const results: any[] = [];

      for (const exp of EXPERIMENTS) {
        if (exp.title.toLowerCase().includes(q) || exp.summary?.toLowerCase().includes(q) || exp.slug.includes(q)) {
          results.push({ type: "experiment", slug: exp.slug, title: exp.title, summary: exp.summary });
        }
      }
      for (const ds of DATASETS) {
        if (ds.id.toLowerCase().includes(q) || ds.description.toLowerCase().includes(q)) {
          results.push({ type: "dataset", id: ds.id, description: ds.description });
        }
      }

      return { content: [{ type: "text" as const, text: results.length > 0
        ? JSON.stringify(results, null, 2)
        : `No results for '${query}'. Try: zaremba, ramsey, kronecker, class numbers, hausdorff`
      }] };
    }
  );

  // ── Tool: Search arXiv ──

  server.tool(
    "search_arxiv",
    "Search arXiv for math/CS papers. Returns titles, abstracts, and arXiv IDs. Useful for finding related work, prior results, and state-of-the-art methods.",
    {
      query: z.string().describe("Search query, e.g. 'Zaremba conjecture continued fractions'"),
      max_results: z.number().optional().describe("Max results (default 5, max 20)"),
      category: z.string().optional().describe("arXiv category filter, e.g. 'math.NT' for number theory, 'math.CO' for combinatorics"),
    },
    async ({ query, max_results, category }) => {
      const n = Math.min(max_results ?? 5, 20);
      let searchQuery = `all:${encodeURIComponent(query)}`;
      if (category) searchQuery += `+AND+cat:${encodeURIComponent(category)}`;

      const url = `http://export.arxiv.org/api/query?search_query=${searchQuery}&start=0&max_results=${n}&sortBy=relevance&sortOrder=descending`;

      try {
        const resp = await fetch(url);
        const xml = await resp.text();

        // Parse Atom XML entries (lightweight, no XML parser needed)
        const entries: any[] = [];
        const entryBlocks = xml.split("<entry>").slice(1);
        for (const block of entryBlocks) {
          const get = (tag: string) => {
            const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
            return m ? m[1].trim().replace(/\s+/g, " ") : "";
          };
          const idUrl = get("id");
          const arxivId = idUrl.replace("http://arxiv.org/abs/", "");
          entries.push({
            arxiv_id: arxivId,
            title: get("title"),
            authors: block.match(/<name>([^<]+)<\/name>/g)?.map(m => m.replace(/<\/?name>/g, "")).slice(0, 5).join(", ") ?? "",
            summary: get("summary").slice(0, 500),
            published: get("published").slice(0, 10),
            pdf: `https://arxiv.org/pdf/${arxivId}`,
            url: `https://arxiv.org/abs/${arxivId}`,
          });
        }

        return { content: [{ type: "text" as const, text: JSON.stringify(entries, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `arXiv search failed: ${e.message}` }] };
      }
    }
  );

  // ── Tool: Search Semantic Scholar ──

  server.tool(
    "search_papers",
    "Search academic papers via Semantic Scholar. Returns papers with citation counts, abstracts, and references. Good for finding highly-cited work and citation networks.",
    {
      query: z.string().describe("Search query"),
      max_results: z.number().optional().describe("Max results (default 5, max 20)"),
      fields_of_study: z.string().optional().describe("Filter by field, e.g. 'Mathematics', 'Computer Science'"),
    },
    async ({ query, max_results, fields_of_study }) => {
      const n = Math.min(max_results ?? 5, 20);
      let url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${n}&fields=title,authors,abstract,year,citationCount,url,externalIds`;
      if (fields_of_study) url += `&fieldsOfStudy=${encodeURIComponent(fields_of_study)}`;

      try {
        const resp = await fetch(url);
        const data = await resp.json() as any;

        const papers = (data.data ?? []).map((p: any) => ({
          title: p.title,
          authors: (p.authors ?? []).slice(0, 5).map((a: any) => a.name).join(", "),
          year: p.year,
          citations: p.citationCount,
          abstract: p.abstract?.slice(0, 500) ?? "",
          url: p.url,
          arxiv_id: p.externalIds?.ArXiv ?? null,
          doi: p.externalIds?.DOI ?? null,
        }));

        return { content: [{ type: "text" as const, text: JSON.stringify(papers, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `Semantic Scholar search failed: ${e.message}` }] };
      }
    }
  );

  // ── Tool: OEIS lookup ──

  server.tool(
    "lookup_oeis",
    "Look up integer sequences in the Online Encyclopedia of Integer Sequences (OEIS). Search by sequence terms or keywords.",
    {
      query: z.string().describe("Comma-separated integers (e.g. '1,1,2,3,5,8') or keyword search (e.g. 'Zaremba')"),
    },
    async ({ query }) => {
      const url = `https://oeis.org/search?fmt=json&q=${encodeURIComponent(query)}&start=0&count=5`;

      try {
        const resp = await fetch(url);
        const raw = await resp.json() as any;

        // OEIS returns a raw array (or {results: [...]}) depending on version
        const results = Array.isArray(raw) ? raw : (raw?.results ?? []);
        if (!results || results.length === 0) {
          return { content: [{ type: "text" as const, text: `No OEIS results for '${query}'` }] };
        }

        const sequences = results.slice(0, 5).map((s: any) => ({
          id: `A${String(s.number).padStart(6, "0")}`,
          name: s.name,
          data: s.data?.split(",").slice(0, 20).join(", "),
          formula: s.formula?.slice(0, 3) ?? [],
          comment: s.comment?.slice(0, 2) ?? [],
          url: `https://oeis.org/A${String(s.number).padStart(6, "0")}`,
        }));

        return { content: [{ type: "text" as const, text: JSON.stringify(sequences, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `OEIS lookup failed: ${e.message}` }] };
      }
    }
  );

  // ── Tool: LMFDB lookup ──

  server.tool(
    "lookup_lmfdb",
    "Query the L-functions and Modular Forms Database (LMFDB) for number fields, elliptic curves, modular forms, and more.",
    {
      object_type: z.enum(["number_fields", "elliptic_curves", "classical_modular_forms", "artin_representations", "dirichlet_characters"]).describe("Type of mathematical object"),
      query: z.string().describe("LMFDB query string, e.g. 'degree=2&class_number=1' for number fields, or 'conductor=11' for elliptic curves"),
      max_results: z.number().optional().describe("Max results (default 5, max 20)"),
    },
    async ({ object_type, query, max_results }) => {
      const n = Math.min(max_results ?? 5, 20);
      // Map object types to LMFDB API endpoints
      const endpoints: Record<string, string> = {
        number_fields: "nf/fields",
        elliptic_curves: "ec/Q",
        classical_modular_forms: "cmf",
        artin_representations: "artin",
        dirichlet_characters: "character/Dirichlet",
      };
      const endpoint = endpoints[object_type] ?? object_type;
      const url = `https://www.lmfdb.org/api/${endpoint}/?${query}&_limit=${n}&_format=json`;

      try {
        const resp = await fetch(url);
        const data = await resp.json() as any;

        return { content: [{ type: "text" as const, text: JSON.stringify({
          object_type,
          count: data.data?.length ?? 0,
          results: data.data?.slice(0, n) ?? [],
          next: data.next ?? null,
          source: "https://www.lmfdb.org",
        }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `LMFDB query failed: ${e.message}` }] };
      }
    }
  );

  // ── Tool: Verify finding against literature ──

  server.tool(
    "verify_finding",
    "Cross-reference a bigcompute.science finding against academic papers (arXiv + Semantic Scholar), OEIS sequences, and known references. Returns our claim, our data, and the most relevant academic literature for independent verification.",
    {
      finding: z.string().describe("Finding slug or keyword, e.g. 'zaremba-density' or 'class-number' or 'hausdorff'"),
    },
    async ({ finding }) => {
      const q = finding.toLowerCase();
      const f = FINDINGS.find(f => f.slug.includes(q) || f.slug === q || f.title.toLowerCase().includes(q));

      if (!f) {
        return { content: [{ type: "text" as const, text: JSON.stringify({
          error: `Finding '${finding}' not found.`,
          available: FINDINGS.map(f => ({ slug: f.slug, title: f.title })),
        }, null, 2) }] };
      }

      // Parallel fetch: arXiv + Semantic Scholar + OEIS
      const results: any = {
        finding: { slug: f.slug, title: f.title, claim: f.claim, our_data: f.our_data, url: f.url },
        known_references: f.key_references,
        literature: { arxiv: [], semantic_scholar: [], oeis: [] },
        verification_guidance: [],
      };

      // Fire all searches in parallel
      const searches = [];

      // arXiv: use first search term
      for (const term of f.search_terms.slice(0, 2)) {
        searches.push(
          fetch(`http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(term)}&start=0&max_results=3&sortBy=relevance&sortOrder=descending`)
            .then(r => r.text())
            .then(xml => {
              for (const block of xml.split("<entry>").slice(1)) {
                const get = (tag: string) => { const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)); return m ? m[1].trim().replace(/\s+/g, " ") : ""; };
                const idUrl = get("id"); const arxivId = idUrl.replace("http://arxiv.org/abs/", "");
                results.literature.arxiv.push({ arxiv_id: arxivId, title: get("title"), published: get("published").slice(0, 10), url: `https://arxiv.org/abs/${arxivId}` });
              }
            })
            .catch(() => {})
        );
      }

      // Semantic Scholar: use first search term
      searches.push(
        fetch(`https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(f.search_terms[0])}&limit=5&fields=title,authors,year,citationCount,url,externalIds`)
          .then(r => r.json() as Promise<any>)
          .then(data => {
            for (const p of (data.data ?? [])) {
              results.literature.semantic_scholar.push({
                title: p.title,
                authors: (p.authors ?? []).slice(0, 3).map((a: any) => a.name).join(", "),
                year: p.year,
                citations: p.citationCount,
                url: p.url,
                arxiv_id: p.externalIds?.ArXiv ?? null,
              });
            }
          })
          .catch(() => {})
      );

      // OEIS: search for related sequences
      for (const seq of f.oeis_sequences.slice(0, 2)) {
        if (!seq) continue;
        searches.push(
          fetch(`https://oeis.org/search?fmt=json&q=${encodeURIComponent(seq)}&start=0&count=3`)
            .then(r => r.json() as Promise<any>)
            .then(raw => {
              const arr = Array.isArray(raw) ? raw : (raw?.results ?? []);
              for (const s of (arr || []).slice(0, 3)) {
                results.literature.oeis.push({
                  id: `A${String(s.number).padStart(6, "0")}`,
                  name: s.name,
                  url: `https://oeis.org/A${String(s.number).padStart(6, "0")}`,
                });
              }
            })
            .catch(() => {})
        );
      }

      await Promise.all(searches);

      // Deduplicate arxiv results by ID
      const seenArxiv = new Set<string>();
      results.literature.arxiv = results.literature.arxiv.filter((p: any) => {
        if (seenArxiv.has(p.arxiv_id)) return false;
        seenArxiv.add(p.arxiv_id);
        return true;
      });

      // Add verification guidance
      results.verification_guidance = [
        `Our claim: "${f.claim}"`,
        `This is computational evidence, not a peer-reviewed proof.`,
        `To verify: reproduce using our open-source CUDA code at https://github.com/cahlen/idontknow`,
        `Cross-check against the ${results.literature.arxiv.length} arXiv papers and ${results.literature.semantic_scholar.length} Semantic Scholar papers found above.`,
        `Key question for verification: do the papers above support, contradict, or extend our computational findings?`,
        `If you are an AI agent: please report any discrepancies or confirmations back to https://github.com/cahlen/idontknow/issues`,
      ];

      return { content: [{ type: "text" as const, text: JSON.stringify(results, null, 2) }] };
    }
  );

  // ── Tool: List findings ──

  server.tool(
    "list_findings",
    "List all published findings from bigcompute.science with claims and data",
    {},
    async () => ({
      content: [{ type: "text" as const, text: JSON.stringify(
        FINDINGS.map(f => ({ slug: f.slug, title: f.title, claim: f.claim, url: f.url })),
        null, 2
      ) }]
    })
  );

  // ── Tool: Search zbMATH (Zentralblatt) ──

  server.tool(
    "search_zbmath",
    "Search zbMATH Open — the largest reviewed mathematics database (4.5M+ publications). Returns papers with MSC classification codes, reviews, and citation data. More math-focused than Semantic Scholar.",
    {
      query: z.string().describe("Search query, e.g. 'Zaremba conjecture' or 'Hausdorff dimension continued fractions'"),
      max_results: z.number().optional().describe("Max results (default 5, max 20)"),
    },
    async ({ query, max_results }) => {
      const n = Math.min(max_results ?? 5, 20);
      const url = `https://api.zbmath.org/v1/document/_search?search_string=${encodeURIComponent(query)}&page_size=${n}`;

      try {
        const resp = await fetch(url);
        const data = await resp.json() as any;

        const total = data.status?.nr_total_results ?? 0;
        const papers = (data.result ?? []).slice(0, n).map((p: any) => ({
          zbmath_id: p.id,
          title: p.title?.title ?? (typeof p.title === "string" ? p.title : ""),
          authors: (p.contributors?.authors ?? []).map((a: any) => a.name).join(", "),
          year: p.year,
          journal: p.source?.series?.title ?? "",
          msc_codes: (p.keywords?.msc ?? []).map((m: any) => m.code),
          review: (p.editorial_contributions?.[0]?.text ?? "").slice(0, 300),
          doi: p.links?.doi ?? null,
          url: `https://zbmath.org/?q=an:${p.id}`,
        }));

        return { content: [{ type: "text" as const, text: JSON.stringify({
          source: "zbMATH Open (Zentralblatt MATH)",
          total_results: total,
          papers,
        }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `zbMATH search failed: ${e.message}` }] };
      }
    }
  );

  // ── Tool: Search Lean 4 / Mathlib via Loogle ──

  server.tool(
    "search_mathlib",
    "Search Lean 4 Mathlib theorems and definitions by type signature or name via Loogle. Useful for finding formal proofs, checking if a theorem is already formalized, or exploring Mathlib's library.",
    {
      query: z.string().describe("Loogle query — type signature (e.g. 'Nat → Nat → Nat'), name pattern (e.g. 'prime'), or combined (e.g. 'List.map')"),
    },
    async ({ query }) => {
      const url = `https://loogle.lean-lang.org/json?q=${encodeURIComponent(query)}`;

      try {
        const resp = await fetch(url);
        const data = await resp.json() as any;

        if (data.error) {
          return { content: [{ type: "text" as const, text: JSON.stringify({
            error: data.error,
            suggestions: data.suggestions ?? [],
            hint: "Try simpler queries. Examples: 'Nat.Prime', 'List.map', 'Finset.sum', '(_ + _) = (_ + _)'",
          }, null, 2) }] };
        }

        const results = (data.hits ?? []).slice(0, 10).map((h: any) => ({
          name: h.name,
          type: h.type,
          module: h.module,
          doc_url: `https://leanprover-community.github.io/mathlib4_docs/${h.module?.replace(/\./g, "/")}.html#${h.name}`,
        }));

        return { content: [{ type: "text" as const, text: JSON.stringify({
          source: "Loogle (Lean 4 / Mathlib search)",
          query,
          count: data.count ?? results.length,
          results,
          note: "Mathlib is the largest formal mathematics library — 100K+ theorems in Lean 4.",
        }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: JSON.stringify({
          error: `Loogle search failed: ${e.message}`,
          fallback: `Try directly: https://loogle.lean-lang.org/?q=${encodeURIComponent(query)}`,
          note: "Loogle may block requests from Cloudflare Workers. Works when called from local MCP clients.",
        }, null, 2) }] };
      }
    }
  );

  // ── Tool: Search FindStat (combinatorial statistics) ──

  server.tool(
    "search_findstat",
    "Search FindStat — a database of combinatorial statistics, maps, and collections. Useful for identifying known combinatorial sequences and their properties.",
    {
      query: z.string().describe("Search query: a statistic name (e.g. 'descent'), sequence of values (e.g. '1,0,1,2,5'), or collection (e.g. 'permutations')"),
    },
    async ({ query }) => {
      // FindStat has a REST API at findstat.org/api
      const url = `https://www.findstat.org/api/FindStatStatistic/?search=${encodeURIComponent(query)}&format=json`;

      try {
        const resp = await fetch(url);
        const text = await resp.text();

        // FindStat may return HTML or JSON depending on endpoint
        try {
          const data = JSON.parse(text);
          const results = (Array.isArray(data) ? data : [data]).slice(0, 10).map((s: any) => ({
            id: s.StatisticIdentifier ?? s.id,
            name: s.StatisticName ?? s.name,
            collection: s.StatisticCollection ?? s.collection,
            url: s.StatisticIdentifier ? `https://www.findstat.org/${s.StatisticIdentifier}` : null,
          }));
          return { content: [{ type: "text" as const, text: JSON.stringify({ source: "FindStat", results }, null, 2) }] };
        } catch {
          // Fallback: return search URL
          return { content: [{ type: "text" as const, text: JSON.stringify({
            source: "FindStat",
            note: `Direct API returned non-JSON. Browse: https://www.findstat.org/StatisticsDatabase/?search=${encodeURIComponent(query)}`,
            about: "FindStat contains 1991 combinatorial statistics, 336 maps, and 24 collections.",
          }, null, 2) }] };
        }
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `FindStat search failed: ${e.message}. Browse: https://www.findstat.org` }] };
      }
    }
  );

  // ── Tool: Search Boise State ScholarWorks ──

  server.tool(
    "search_boise_state",
    "Search Boise State University's ScholarWorks institutional repository for theses, dissertations, and faculty research. Boise State is the alma mater of bigcompute.science's founder.",
    {
      query: z.string().describe("Search query, e.g. 'number theory' or 'continued fractions'"),
      max_results: z.number().optional().describe("Max results (default 5, max 20)"),
    },
    async ({ query, max_results }) => {
      const n = Math.min(max_results ?? 5, 20);
      // bepress DigitalCommons OAI-PMH endpoint for ScholarWorks
      // Use the search interface which returns HTML, or try the OAI-PMH feed
      const url = `https://scholarworks.boisestate.edu/do/oai/?verb=ListRecords&metadataPrefix=oai_dc&set=publication:math_facpubs`;

      try {
        // ScholarWorks doesn't have a clean JSON API, so we search via their discovery endpoint
        const searchUrl = `https://scholarworks.boisestate.edu/do/search/?q=${encodeURIComponent(query)}&start=0&context=509702&facet=&fq=virtual_ancestor_link:%22https://scholarworks.boisestate.edu%22`;
        const resp = await fetch(searchUrl, { headers: { "Accept": "text/html" } });
        const html = await resp.text();

        // Extract article titles and URLs from search results
        const results: any[] = [];
        const matches = html.matchAll(/<a[^>]+href="(https:\/\/scholarworks\.boisestate\.edu\/[^"]+)"[^>]*>\s*<span[^>]*>([^<]+)<\/span>/g);
        for (const m of matches) {
          if (results.length >= n) break;
          results.push({ title: m[2].trim(), url: m[1] });
        }

        // Fallback: extract any links with article paths
        if (results.length === 0) {
          const linkMatches = html.matchAll(/<a[^>]+href="(https:\/\/scholarworks\.boisestate\.edu\/[a-z_]+\/\d+)"[^>]*>([^<]+)<\/a>/g);
          for (const m of linkMatches) {
            if (results.length >= n) break;
            const title = m[2].trim();
            if (title.length > 10) results.push({ title, url: m[1] });
          }
        }

        return { content: [{ type: "text" as const, text: JSON.stringify({
          source: "Boise State University ScholarWorks",
          source_url: "https://scholarworks.boisestate.edu",
          query,
          results: results.length > 0 ? results : [{ note: `No results found for '${query}'. Try browsing: https://scholarworks.boisestate.edu/math_facpubs/` }],
          note: "Boise State University is the alma mater (BS Mathematics) of Cahlen Humphreys, bigcompute.science founder.",
        }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `ScholarWorks search failed: ${e.message}. Try browsing directly: https://scholarworks.boisestate.edu` }] };
      }
    }
  );

  // ── Tool: Search FAU institutional repository ──

  server.tool(
    "search_fau",
    "Search Florida Atlantic University's research repository and digital library. FAU is the alma mater (MS Mathematics) of bigcompute.science's founder.",
    {
      query: z.string().describe("Search query, e.g. 'number theory' or 'spectral theory'"),
      max_results: z.number().optional().describe("Max results (default 5, max 20)"),
    },
    async ({ query, max_results }) => {
      const n = Math.min(max_results ?? 5, 20);

      try {
        // FAU Digital Library via FLVC Islandora
        const searchUrl = `https://fau.digital.flvc.org/islandora/search/${encodeURIComponent(query)}?type=dismax&islandora_solr_search_navigation=0&rows=${n}`;
        const resp = await fetch(searchUrl, { headers: { "Accept": "text/html" } });
        const html = await resp.text();

        const results: any[] = [];
        const matches = html.matchAll(/<a[^>]+href="(https?:\/\/fau\.digital\.flvc\.org\/islandora\/object\/[^"]+)"[^>]*>([^<]+)<\/a>/g);
        for (const m of matches) {
          if (results.length >= n) break;
          const title = m[2].trim();
          if (title.length > 5) results.push({ title, url: m[1] });
        }

        return { content: [{ type: "text" as const, text: JSON.stringify({
          source: "Florida Atlantic University Digital Library",
          source_url: "https://fau.digital.flvc.org",
          query,
          results: results.length > 0 ? results : [{ note: `No results found for '${query}'. Try: https://fau.digital.flvc.org` }],
          also_try: "FAU Libraries: https://library.fau.edu",
          note: "Florida Atlantic University is the alma mater (MS Mathematics, 2013-2015) of Cahlen Humphreys, bigcompute.science founder.",
        }, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: "text" as const, text: `FAU search failed: ${e.message}. Try browsing directly: https://fau.digital.flvc.org` }] };
      }
    }
  );

  // ── Tool: List related MCP servers ──

  server.tool(
    "list_related_servers",
    "Discover other MCP servers for mathematics and academic research. These are independent servers you can connect to alongside bigcompute.science.",
    {},
    async () => ({
      content: [{ type: "text" as const, text: JSON.stringify({
        note: "Third-party MCP servers for deeper capabilities. Connect to these alongside bigcompute.science.",
        servers: [
          { name: "lean-lsp-mcp", description: "Lean 4 LSP via MCP — agentic theorem proving (used by Mistral's Leanstral 120B)", repo: "https://github.com/oOo0oOo/lean-lsp-mcp", stars: 337 },
          { name: "lean4-claude-plugin", description: "17 MCP tools for Claude Code theorem proving in Lean 4", repo: "https://github.com/Beneficial-AI-Foundation/lean4-claude-plugin" },
          { name: "mcp-wolframalpha", description: "Wolfram Alpha via MCP (free tier: 2000 req/month)", repo: "https://github.com/akalaric/mcp-wolframalpha" },
          { name: "mcp-server-sagemath", description: "Full computer algebra system via MCP", repo: "https://github.com/GaloisHLee/mcp-server-sagemath" },
          { name: "scicompute-mcp", description: "Multi-backend: Mathematica, SageMath, Octave, R, Python", repo: "https://github.com/sanshanjianke/scicompute-mcp" },
          { name: "arxiv-mcp-server", description: "Full arXiv access including PDF download and LaTeX source", repo: "https://github.com/blazickjp/arxiv-mcp-server", install: "pip install arxiv-mcp-server" },
        ],
        discovery: "https://github.com/punkpeye/awesome-mcp-servers — curated list of 100+ MCP servers",
        our_builtin: "This server has 19 built-in tools: search_arxiv, search_papers, lookup_oeis, lookup_lmfdb, search_zbmath, search_mathlib, search_findstat, verify_finding, search_boise_state, search_fau, and more. No additional setup needed.",
      }, null, 2) }]
    })
  );

  // ── Resource: llms.txt ──

  server.resource(
    "llms-txt",
    "mcp://bigcompute.science/llms.txt",
    async (uri) => ({
      contents: [{
        uri: uri.href,
        text: "See https://bigcompute.science/llms.txt for the full structured index of all experiments, findings, and datasets.",
      }]
    })
  );

  return server;
}

// ─── Worker Entry Point ─────────────────────────────────────────

export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", name: "bigcompute-mcp", version: "1.0.0" }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // MCP endpoint info
    if (url.pathname === "/" && request.method === "GET") {
      return new Response(JSON.stringify({
        name: "bigcompute.science MCP Server",
        description: "Open computational mathematics datasets and CUDA kernels for AI agents",
        mcp_endpoint: "/mcp",
        tools: ["list_experiments", "get_experiment", "get_zaremba_exceptions", "list_datasets", "get_open_problems", "get_cuda_kernel", "search", "search_arxiv", "search_papers", "lookup_oeis", "lookup_lmfdb", "search_zbmath", "search_mathlib", "search_findstat", "verify_finding", "list_findings", "search_boise_state", "search_fau", "list_related_servers"],
        source: "https://github.com/cahlen/bigcompute.science/tree/main/workers/mcp",
        no_auth_required: true,
        license: "CC BY 4.0",
      }), { headers: { "Content-Type": "application/json" } });
    }

    // Import dynamically to avoid issues if agents package isn't available
    try {
      const { createMcpHandler } = await import("agents/mcp");
      const server = createServer(env);
      return createMcpHandler(server)(request, env, ctx);
    } catch (e) {
      // Fallback: simple JSON-RPC handler for basic MCP
      return handleBasicMcp(request, env);
    }
  }
};

// ─── Fallback MCP handler with proper protocol support ──────────

async function handleBasicMcp(request: Request, env: any): Promise<Response> {
  if (request.method === "GET") {
    // SSE endpoint — not supported in fallback
    return new Response("SSE not supported in fallback mode. Use POST.", { status: 405 });
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Session-Id",
      }
    });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await request.json() as any;
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  // Handle initialize
  if (body.method === "initialize") {
    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      id: body.id,
      result: {
        protocolVersion: "2025-03-26",
        capabilities: {
          tools: { listChanged: false },
          resources: { listChanged: false },
        },
        serverInfo: {
          name: "bigcompute.science",
          version: "1.0.0",
        },
      }
    }), { headers });
  }

  // Handle initialized notification (no response needed)
  if (body.method === "notifications/initialized") {
    return new Response(null, { status: 204 });
  }

  // Handle tools/list
  if (body.method === "tools/list") {
    const toolDefs = [
      { name: "list_experiments", description: "List all experiments with status and key results", inputSchema: { type: "object", properties: {} } },
      { name: "get_experiment", description: "Get full details of a specific experiment", inputSchema: { type: "object", properties: { slug: { type: "string", description: "Experiment slug" } }, required: ["slug"] } },
      { name: "get_zaremba_exceptions", description: "Get the 27 Zaremba exceptions for A={1,2,3}", inputSchema: { type: "object", properties: {} } },
      { name: "list_datasets", description: "List all Hugging Face datasets", inputSchema: { type: "object", properties: {} } },
      { name: "get_open_problems", description: "Get open problems that need GPU compute", inputSchema: { type: "object", properties: {} } },
      { name: "get_cuda_kernel", description: "Get CUDA kernel compile and run commands", inputSchema: { type: "object", properties: { experiment: { type: "string", description: "Experiment name" } }, required: ["experiment"] } },
      { name: "search", description: "Search experiments, findings, and datasets", inputSchema: { type: "object", properties: { query: { type: "string", description: "Search query" } }, required: ["query"] } },
      { name: "search_arxiv", description: "Search arXiv for math/CS papers", inputSchema: { type: "object", properties: { query: { type: "string", description: "Search query" }, max_results: { type: "number", description: "Max results (default 5)" }, category: { type: "string", description: "arXiv category, e.g. math.NT" } }, required: ["query"] } },
      { name: "search_papers", description: "Search academic papers via Semantic Scholar with citation counts", inputSchema: { type: "object", properties: { query: { type: "string", description: "Search query" }, max_results: { type: "number" }, fields_of_study: { type: "string", description: "e.g. Mathematics" } }, required: ["query"] } },
      { name: "lookup_oeis", description: "Look up integer sequences in OEIS by terms or keywords", inputSchema: { type: "object", properties: { query: { type: "string", description: "Comma-separated integers or keyword" } }, required: ["query"] } },
      { name: "lookup_lmfdb", description: "Query LMFDB for number fields, elliptic curves, modular forms", inputSchema: { type: "object", properties: { object_type: { type: "string", enum: ["number_fields", "elliptic_curves", "classical_modular_forms", "artin_representations", "dirichlet_characters"] }, query: { type: "string", description: "LMFDB query params" }, max_results: { type: "number" } }, required: ["object_type", "query"] } },
      { name: "search_zbmath", description: "Search zbMATH Open — 4.5M+ reviewed math publications with MSC codes", inputSchema: { type: "object", properties: { query: { type: "string" }, max_results: { type: "number" } }, required: ["query"] } },
      { name: "search_mathlib", description: "Search Lean 4 Mathlib theorems via Loogle by type signature or name", inputSchema: { type: "object", properties: { query: { type: "string", description: "Type signature or name pattern" } }, required: ["query"] } },
      { name: "search_findstat", description: "Search FindStat combinatorial statistics database", inputSchema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
      { name: "verify_finding", description: "Cross-reference a bigcompute.science finding against arXiv, Semantic Scholar, OEIS, and known references", inputSchema: { type: "object", properties: { finding: { type: "string", description: "Finding slug or keyword" } }, required: ["finding"] } },
      { name: "list_findings", description: "List all published findings with claims and data", inputSchema: { type: "object", properties: {} } },
      { name: "search_boise_state", description: "Search Boise State University ScholarWorks repository", inputSchema: { type: "object", properties: { query: { type: "string" }, max_results: { type: "number" } }, required: ["query"] } },
      { name: "search_fau", description: "Search Florida Atlantic University digital library", inputSchema: { type: "object", properties: { query: { type: "string" }, max_results: { type: "number" } }, required: ["query"] } },
      { name: "list_related_servers", description: "Discover other MCP servers for math and academic research", inputSchema: { type: "object", properties: {} } },
    ];
    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      id: body.id,
      result: { tools: toolDefs }
    }), { headers });
  }

  // Handle tools/call
  if (body.method === "tools/call") {
    const toolName = body.params?.name;
    const args = body.params?.arguments || {};

    // Create server and use its registered tools
    const server = createServer(env);

    // Simple dispatch — call the tool by name
    let result: any;
    try {
      // Use the server's internal tool handling
      const toolMap: Record<string, () => Promise<any>> = {
        list_experiments: async () => ({
          content: [{ type: "text", text: JSON.stringify(EXPERIMENTS.map(e => ({ slug: e.slug, title: e.title, status: e.status, summary: e.summary })), null, 2) }]
        }),
        get_zaremba_exceptions: async () => ({
          content: [{ type: "text", text: JSON.stringify({
            digit_set: "{1,2,3}", verified_to: "10^10", total_exceptions: 27, all_below: 6234,
            exceptions: [6,20,28,38,42,54,96,150,156,164,216,228,318,350,384,558,770,876,1014,1155,1170,1410,1870,2052,2370,5052,6234],
            hierarchy: { "A={1,2,3}": "27 exceptions", "A={1,2,3,4}": "2 exceptions (d=54, d=150)", "A={1,2,3,4,5}": "0 exceptions" },
          }, null, 2) }]
        }),
        list_datasets: async () => ({
          content: [{ type: "text", text: JSON.stringify(DATASETS.map(d => ({ ...d, url: `https://huggingface.co/datasets/${d.id}` })), null, 2) }]
        }),
        get_open_problems: async () => ({
          content: [{ type: "text", text: JSON.stringify({ problems: OPEN_PROBLEMS, how_to_contribute: "https://github.com/cahlen/idontknow/blob/main/AGENTS.md" }, null, 2) }]
        }),
        get_experiment: async () => {
          const exp = EXPERIMENTS.find(e => e.slug.includes(args.slug || '') || e.slug === args.slug);
          return { content: [{ type: "text", text: exp ? JSON.stringify(exp, null, 2) : `Not found: ${args.slug}` }] };
        },
        get_cuda_kernel: async () => {
          const exp = EXPERIMENTS.find(e => e.slug.includes((args.experiment || '').toLowerCase()) || e.title.toLowerCase().includes((args.experiment || '').toLowerCase()));
          return { content: [{ type: "text", text: exp?.cuda_kernel ? JSON.stringify({ kernel: exp.cuda_kernel, compile: exp.compile, run: exp.run }, null, 2) : `Not found: ${args.experiment}` }] };
        },
        search: async () => {
          const q = (args.query || '').toLowerCase();
          const results = EXPERIMENTS.filter(e => e.title.toLowerCase().includes(q) || e.slug.includes(q)).map(e => ({ type: "experiment", slug: e.slug, title: e.title }));
          return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
        },
        search_arxiv: async () => {
          const n = Math.min(args.max_results ?? 5, 20);
          let sq = `all:${encodeURIComponent(args.query || '')}`;
          if (args.category) sq += `+AND+cat:${encodeURIComponent(args.category)}`;
          const resp = await fetch(`http://export.arxiv.org/api/query?search_query=${sq}&start=0&max_results=${n}&sortBy=relevance&sortOrder=descending`);
          const xml = await resp.text();
          const entries: any[] = [];
          for (const block of xml.split("<entry>").slice(1)) {
            const get = (tag: string) => { const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)); return m ? m[1].trim().replace(/\s+/g, " ") : ""; };
            const idUrl = get("id"); const arxivId = idUrl.replace("http://arxiv.org/abs/", "");
            entries.push({ arxiv_id: arxivId, title: get("title"), summary: get("summary").slice(0, 500), published: get("published").slice(0, 10), url: `https://arxiv.org/abs/${arxivId}` });
          }
          return { content: [{ type: "text", text: JSON.stringify(entries, null, 2) }] };
        },
        search_papers: async () => {
          const n = Math.min(args.max_results ?? 5, 20);
          let url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(args.query || '')}&limit=${n}&fields=title,authors,abstract,year,citationCount,url,externalIds`;
          if (args.fields_of_study) url += `&fieldsOfStudy=${encodeURIComponent(args.fields_of_study)}`;
          const resp = await fetch(url);
          const data = await resp.json() as any;
          const papers = (data.data ?? []).map((p: any) => ({ title: p.title, authors: (p.authors ?? []).slice(0, 5).map((a: any) => a.name).join(", "), year: p.year, citations: p.citationCount, abstract: p.abstract?.slice(0, 500) ?? "", url: p.url, arxiv_id: p.externalIds?.ArXiv ?? null }));
          return { content: [{ type: "text", text: JSON.stringify(papers, null, 2) }] };
        },
        lookup_oeis: async () => {
          const resp = await fetch(`https://oeis.org/search?fmt=json&q=${encodeURIComponent(args.query || '')}&start=0&count=5`);
          const raw = await resp.json() as any;
          const results = Array.isArray(raw) ? raw : (raw?.results ?? []);
          if (!results || results.length === 0) return { content: [{ type: "text", text: `No OEIS results for '${args.query}'` }] };
          const sequences = results.slice(0, 5).map((s: any) => ({ id: `A${String(s.number).padStart(6, "0")}`, name: s.name, data: s.data?.split(",").slice(0, 20).join(", "), url: `https://oeis.org/A${String(s.number).padStart(6, "0")}` }));
          return { content: [{ type: "text", text: JSON.stringify(sequences, null, 2) }] };
        },
        lookup_lmfdb: async () => {
          const n = Math.min(args.max_results ?? 5, 20);
          const endpoints: Record<string, string> = { number_fields: "nf/fields", elliptic_curves: "ec/Q", classical_modular_forms: "cmf", artin_representations: "artin", dirichlet_characters: "character/Dirichlet" };
          const endpoint = endpoints[args.object_type] ?? args.object_type;
          const resp = await fetch(`https://www.lmfdb.org/api/${endpoint}/?${args.query || ''}&_limit=${n}&_format=json`);
          const data = await resp.json() as any;
          return { content: [{ type: "text", text: JSON.stringify({ object_type: args.object_type, count: data.data?.length ?? 0, results: data.data?.slice(0, n) ?? [] }, null, 2) }] };
        },
        search_zbmath: async () => {
          const n = Math.min(args.max_results ?? 5, 20);
          try {
            const resp = await fetch(`https://api.zbmath.org/v1/document/_search?search_string=${encodeURIComponent(args.query || '')}&page_size=${n}`);
            const data = await resp.json() as any;
            const papers = (data.result ?? []).slice(0, n).map((p: any) => ({ zbmath_id: p.id, title: p.title?.title ?? "", authors: (p.contributors?.authors ?? []).map((a: any) => a.name).join(", "), year: p.year, review: (p.editorial_contributions?.[0]?.text ?? "").slice(0, 200), url: `https://zbmath.org/?q=an:${p.id}` }));
            return { content: [{ type: "text", text: JSON.stringify({ source: "zbMATH Open", total: data.status?.nr_total_results ?? 0, papers }, null, 2) }] };
          } catch (e: any) { return { content: [{ type: "text", text: `zbMATH error: ${e.message}` }] }; }
        },
        search_mathlib: async () => {
          try {
            const resp = await fetch(`https://loogle.lean-lang.org/json?q=${encodeURIComponent(args.query || '')}`);
            const data = await resp.json() as any;
            if (data.error) return { content: [{ type: "text", text: JSON.stringify({ error: data.error, suggestions: data.suggestions ?? [] }, null, 2) }] };
            const results = (data.hits ?? []).slice(0, 10).map((h: any) => ({ name: h.name, type: h.type, module: h.module }));
            return { content: [{ type: "text", text: JSON.stringify({ source: "Loogle (Lean 4 / Mathlib)", count: data.count ?? results.length, results }, null, 2) }] };
          } catch (e: any) { return { content: [{ type: "text", text: `Loogle error: ${e.message}` }] }; }
        },
        search_findstat: async () => {
          try {
            const resp = await fetch(`https://www.findstat.org/api/FindStatStatistic/?search=${encodeURIComponent(args.query || '')}&format=json`);
            const text = await resp.text();
            try { const data = JSON.parse(text); const results = (Array.isArray(data) ? data : [data]).slice(0, 10).map((s: any) => ({ id: s.StatisticIdentifier ?? s.id, name: s.StatisticName ?? s.name }));
              return { content: [{ type: "text", text: JSON.stringify({ source: "FindStat", results }, null, 2) }] };
            } catch { return { content: [{ type: "text", text: JSON.stringify({ source: "FindStat", browse: `https://www.findstat.org/StatisticsDatabase/?search=${encodeURIComponent(args.query || '')}` }, null, 2) }] }; }
          } catch (e: any) { return { content: [{ type: "text", text: `FindStat error: ${e.message}` }] }; }
        },
        verify_finding: async () => {
          const q = (args.finding || '').toLowerCase();
          const f = FINDINGS.find(f => f.slug.includes(q) || f.title.toLowerCase().includes(q));
          if (!f) return { content: [{ type: "text", text: JSON.stringify({ error: `Finding '${args.finding}' not found`, available: FINDINGS.map(f => f.slug) }, null, 2) }] };

          const result: any = { finding: { slug: f.slug, title: f.title, claim: f.claim, our_data: f.our_data, url: f.url }, known_references: f.key_references, literature: { arxiv: [], semantic_scholar: [], oeis: [] }, verification_guidance: [] };
          const searches = [];

          for (const term of f.search_terms.slice(0, 2)) {
            searches.push(
              fetch(`http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(term)}&start=0&max_results=3&sortBy=relevance&sortOrder=descending`)
                .then(r => r.text()).then(xml => {
                  for (const block of xml.split("<entry>").slice(1)) {
                    const get = (tag: string) => { const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)); return m ? m[1].trim().replace(/\s+/g, " ") : ""; };
                    const idUrl = get("id"); const aid = idUrl.replace("http://arxiv.org/abs/", "");
                    result.literature.arxiv.push({ arxiv_id: aid, title: get("title"), url: `https://arxiv.org/abs/${aid}` });
                  }
                }).catch(() => {})
            );
          }
          searches.push(
            fetch(`https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(f.search_terms[0])}&limit=5&fields=title,authors,year,citationCount,url`)
              .then(r => r.json() as Promise<any>).then(data => {
                for (const p of (data.data ?? [])) {
                  result.literature.semantic_scholar.push({ title: p.title, year: p.year, citations: p.citationCount, url: p.url });
                }
              }).catch(() => {})
          );
          for (const seq of f.oeis_sequences.slice(0, 2)) {
            if (!seq) continue;
            searches.push(
              fetch(`https://oeis.org/search?fmt=json&q=${encodeURIComponent(seq)}&start=0&count=3`)
                .then(r => r.json() as Promise<any>).then(raw => {
                  const arr = Array.isArray(raw) ? raw : (raw?.results ?? []);
                  for (const s of (arr || []).slice(0, 3)) result.literature.oeis.push({ id: `A${String(s.number).padStart(6, "0")}`, name: s.name });
                }).catch(() => {})
            );
          }
          await Promise.all(searches);
          const seen = new Set<string>(); result.literature.arxiv = result.literature.arxiv.filter((p: any) => { if (seen.has(p.arxiv_id)) return false; seen.add(p.arxiv_id); return true; });
          result.verification_guidance = [`Claim: "${f.claim}"`, "Computational evidence, not peer-reviewed.", "Reproduce: https://github.com/cahlen/idontknow", `Cross-check against ${result.literature.arxiv.length} arXiv + ${result.literature.semantic_scholar.length} S2 papers above.`, "Report discrepancies: https://github.com/cahlen/idontknow/issues"];
          return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
        },
        list_findings: async () => ({
          content: [{ type: "text", text: JSON.stringify(FINDINGS.map(f => ({ slug: f.slug, title: f.title, claim: f.claim, url: f.url })), null, 2) }]
        }),
        search_boise_state: async () => {
          try {
            const searchUrl = `https://scholarworks.boisestate.edu/do/search/?q=${encodeURIComponent(args.query || '')}&start=0&context=509702`;
            const resp = await fetch(searchUrl); const html = await resp.text();
            const results: any[] = []; const matches = html.matchAll(/<a[^>]+href="(https:\/\/scholarworks\.boisestate\.edu\/[a-z_]+\/\d+)"[^>]*>([^<]+)<\/a>/g);
            for (const m of matches) { if (results.length >= 5) break; const t = m[2].trim(); if (t.length > 10) results.push({ title: t, url: m[1] }); }
            return { content: [{ type: "text", text: JSON.stringify({ source: "Boise State ScholarWorks", results: results.length > 0 ? results : [{ note: "No results" }] }, null, 2) }] };
          } catch (e: any) { return { content: [{ type: "text", text: `ScholarWorks error: ${e.message}` }] }; }
        },
        search_fau: async () => {
          try {
            const searchUrl = `https://fau.digital.flvc.org/islandora/search/${encodeURIComponent(args.query || '')}?type=dismax&rows=5`;
            const resp = await fetch(searchUrl); const html = await resp.text();
            const results: any[] = []; const matches = html.matchAll(/<a[^>]+href="(https?:\/\/fau\.digital\.flvc\.org\/islandora\/object\/[^"]+)"[^>]*>([^<]+)<\/a>/g);
            for (const m of matches) { if (results.length >= 5) break; const t = m[2].trim(); if (t.length > 5) results.push({ title: t, url: m[1] }); }
            return { content: [{ type: "text", text: JSON.stringify({ source: "FAU Digital Library", results: results.length > 0 ? results : [{ note: "No results" }] }, null, 2) }] };
          } catch (e: any) { return { content: [{ type: "text", text: `FAU error: ${e.message}` }] }; }
        },
        list_related_servers: async () => ({
          content: [{ type: "text", text: JSON.stringify({
            note: "Third-party MCP servers for deeper capabilities. Connect to these alongside bigcompute.science.",
            servers: [
              { name: "lean-lsp-mcp", description: "Lean 4 LSP via MCP — agentic theorem proving (used by Mistral's Leanstral)", repo: "https://github.com/oOo0oOo/lean-lsp-mcp", stars: 337 },
              { name: "lean4-claude-plugin", description: "17 MCP tools for Claude Code theorem proving in Lean 4", repo: "https://github.com/Beneficial-AI-Foundation/lean4-claude-plugin" },
              { name: "mcp-wolframalpha", description: "Wolfram Alpha via MCP (free tier: 2000 req/month)", repo: "https://github.com/akalaric/mcp-wolframalpha" },
              { name: "mcp-server-sagemath", description: "Full computer algebra system via MCP", repo: "https://github.com/GaloisHLee/mcp-server-sagemath" },
              { name: "scicompute-mcp", description: "Multi-backend: Mathematica, SageMath, Octave, R, Python", repo: "https://github.com/sanshanjianke/scicompute-mcp" },
              { name: "arxiv-mcp-server", description: "Full arXiv access: search, PDFs, LaTeX source", repo: "https://github.com/blazickjp/arxiv-mcp-server", install: "pip install arxiv-mcp-server" },
            ],
            discovery: "https://github.com/punkpeye/awesome-mcp-servers",
            builtin: "This server (bigcompute.science) has 19 built-in tools including: search_arxiv, search_papers, lookup_oeis, lookup_lmfdb, search_zbmath, search_mathlib, search_findstat, verify_finding, search_boise_state, search_fau. No additional setup needed.",
          }, null, 2) }]
        }),
      };

      const handler = toolMap[toolName];
      result = handler ? await handler() : { content: [{ type: "text", text: `Unknown tool: ${toolName}` }] };
    } catch (e: any) {
      result = { content: [{ type: "text", text: `Error: ${e.message}` }] };
    }

    return new Response(JSON.stringify({
      jsonrpc: "2.0",
      id: body.id,
      result,
    }), { headers });
  }

  // Unknown method
  return new Response(JSON.stringify({
    jsonrpc: "2.0",
    id: body.id,
    error: { code: -32601, message: `Method not found: ${body.method}` }
  }), { headers });
}
