# bigcompute.science MCP Server

Model Context Protocol server for AI agents to query experiment results,
datasets, and CUDA kernel build instructions.

**No auth required. No secrets. Everything is open.**

## Tools

| Tool | Description |
|------|-------------|
| `list_experiments` | All experiments with status and key results |
| `get_experiment` | Full details including CUDA kernel and compile command |
| `get_zaremba_exceptions` | The 27 Zaremba exceptions for A={1,2,3} |
| `list_datasets` | All Hugging Face datasets |
| `get_open_problems` | Problems that need GPU compute — contribute! |
| `get_cuda_kernel` | Source path + compile + run for any experiment |
| `search` | Search across experiments, findings, and datasets |

## Deploy

```bash
cd workers/mcp
npm install
npx wrangler deploy
```

## Connect

Point any MCP client to `https://mcp.bigcompute.science/mcp`

Or use Claude Code:
```json
{
  "mcpServers": {
    "bigcompute": {
      "url": "https://mcp.bigcompute.science/mcp"
    }
  }
}
```

## No Secrets

This server is entirely public. The data it serves is CC BY 4.0.
The code is in a public repo. There are no API keys, no auth tokens,
no credentials of any kind.
