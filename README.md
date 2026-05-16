# beaconed-mcp

MCP server for the Beaconed API — manage products, optimizations, and webhooks from Claude Desktop, Cursor, or any MCP-compatible client.

## Install

```bash
npm install -g @joshre/beaconed-mcp
```

## Claude Desktop Configuration

Add to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "beaconed": {
      "command": "npx",
      "args": ["@joshre/beaconed-mcp"],
      "env": { "BEACONED_API_KEY": "your-key-here" }
    }
  }
}
```

Get your API key from Settings > API Keys in the Beaconed dashboard.

## Status

Alpha. Real tools land in M2; this release wires the server transport and proves connectivity.
