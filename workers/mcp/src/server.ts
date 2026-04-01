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
        tools: ["list_experiments", "get_experiment", "get_zaremba_exceptions", "list_datasets", "get_open_problems", "get_cuda_kernel", "search"],
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
