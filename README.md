# @beaconed/mcp

MCP server exposing the Beaconed v1 API to Claude Desktop, Cursor, and any MCP-compatible client. Ask Claude to list your products, queue optimizations, approve AI-generated copy, and manage webhooks — all via natural language.

## Install

```bash
npm install -g @beaconed/mcp
```

## Setup

Add to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "beaconed": {
      "command": "beaconed-mcp",
      "env": {
        "BEACONED_API_KEY": "your-api-key"
      }
    }
  }
}
```

Get your API key at [beaconed.ai](https://beaconed.ai) under Settings > API Keys.

Set `BEACONED_BASE_URL` to override the default `https://beaconed.ai` (useful for local dev or staging).

## Tools

### Read tools

- `beaconed_products_list` — list products with filters for status, score, grade, and title search
- `beaconed_products_get` — full product detail including images, score history, and latest optimization
- `beaconed_products_scores` — score history for a specific product
- `beaconed_products_optimizations` — list optimizations scoped to a product
- `beaconed_optimizations_list` — list all AI-generated optimizations across all products
- `beaconed_optimizations_get` — full optimization detail (original vs. suggested content)
- `beaconed_scores_list` — readiness scores across all products
- `beaconed_scores_latest` — latest score per product
- `beaconed_settings_get` — account optimization settings (brand voice, keywords, auto-push config)
- `beaconed_webhooks_list` — list webhook subscriptions
- `beaconed_webhooks_get` — webhook detail including last error info
- `beaconed_webhooks_events` — global catalog of all available webhook event types

### Mutation tools

- `beaconed_products_create` — create a product from external (non-Shopify) data
- `beaconed_products_update` — update product fields (partial update)
- `beaconed_products_sync` — trigger a Shopify sync for a product (EXPENSIVE: 10 req/min)
- `beaconed_products_optimize` — queue AI optimization for one or more product fields (EXPENSIVE: 10 req/min)
- `beaconed_products_calculate_score` — recalculate readiness score for a product (EXPENSIVE: 10 req/min)
- `beaconed_optimizations_approve` — approve a pending optimization (EXPENSIVE: 10 req/min)
- `beaconed_optimizations_reject` — reject a pending optimization with an optional reason
- `beaconed_optimizations_apply` — apply an approved optimization to the live product (DESTRUCTIVE, EXPENSIVE: 10 req/min)
- `beaconed_optimizations_revert` — revert an applied optimization to original content (DESTRUCTIVE, EXPENSIVE: 10 req/min)
- `beaconed_webhooks_create` — create a webhook subscription (signing secret returned once only)
- `beaconed_webhooks_update` — update a webhook URL, events, or status
- `beaconed_webhooks_delete` — permanently remove a webhook subscription (DESTRUCTIVE)
- `beaconed_webhooks_test` — send a test event to verify delivery
- `beaconed_bulk_optimize` — queue AI optimization for multiple products in one request (EXPENSIVE: 10 req/min)

DESTRUCTIVE tools are annotated with `destructiveHint: true` — compliant MCP clients will prompt for confirmation before invoking them.

## License

MIT — see [LICENSE](LICENSE).
