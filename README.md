# beaconed-mcp

MCP server for the Beaconed API — browse products, optimizations, scores, settings, and webhooks from Claude Desktop, Cursor, or any MCP-compatible client.

## Install

The package is not yet published to npm. Install directly from git:

```bash
npm install -g github:joshre/beaconed-mcp
```

Once published you will be able to use:

```bash
npm install -g @joshre/beaconed-mcp
```

## Claude Desktop Configuration

Add to your Claude Desktop `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "beaconed": {
      "command": "beaconed-mcp",
      "env": {
        "BEACONED_API_KEY": "your-key-here"
      }
    }
  }
}
```

Get your API key from Settings > API Keys in your Beaconed dashboard.

Optional: set `BEACONED_BASE_URL` to override the default `https://beaconed.ai` (useful for dev/staging).

## Tools

### Read tools

| Tool | Description | Key Inputs |
|------|-------------|------------|
| `beaconed_products_list` | GET /api/v1/products — list products | `status`, `min_score`, `max_score`, `grade`, `needs_optimization`, `q`, `page`, `per_page` |
| `beaconed_products_get` | GET /api/v1/products/{id} — product detail | `id` |
| `beaconed_products_scores` | GET /api/v1/products/{id}/scores — score history | `id`, `since`, `until`, `grade`, `page`, `per_page` |
| `beaconed_products_optimizations` | GET /api/v1/optimizations?product_id={id} — product optimizations | `id`, `status`, `field`, `page`, `per_page` |
| `beaconed_optimizations_list` | GET /api/v1/optimizations — list all optimizations | `status`, `field`, `product_id`, `since`, `page`, `per_page` |
| `beaconed_optimizations_get` | GET /api/v1/optimizations/{id} — optimization detail | `id` |
| `beaconed_scores_list` | GET /api/v1/scores — scores across all products (SPEC-ABSENT) | `since`, `until`, `grade`, `page`, `per_page` |
| `beaconed_scores_latest` | GET /api/v1/scores/latest — latest score per product (SPEC-ABSENT) | `since`, `until`, `grade`, `page`, `per_page` |
| `beaconed_settings_get` | GET /api/v1/settings — account optimization settings | (none) |
| `beaconed_webhooks_list` | GET /api/v1/webhooks — list webhook subscriptions | `page`, `per_page` |
| `beaconed_webhooks_get` | GET /api/v1/webhooks/{id} — webhook detail | `id` |
| `beaconed_webhooks_events` | GET /api/v1/webhooks/events — global event type catalog | `page`, `per_page` |

### Mutation tools

| Tool | Description | Key Inputs | Destructive | Idempotent |
|------|-------------|------------|-------------|------------|
| `beaconed_products_create` | POST /api/v1/products — create a product from external data | `title`, `status`, `external_id`, `images`, … | No | No |
| `beaconed_products_update` | PATCH /api/v1/products/{id} — update product fields | `id`, any `ProductInput` fields | No | Yes |
| `beaconed_products_sync` | POST /api/v1/products/{id}/sync — trigger Shopify sync | `id` | No | Yes |
| `beaconed_products_optimize` | POST /api/v1/products/{id}/optimization — queue AI optimization | `id`, `fields?` | No | No |
| `beaconed_products_calculate_score` | POST /api/v1/products/{id}/scores/calculation — recalculate readiness score | `id` | No | Yes |
| `beaconed_optimizations_approve` | POST /api/v1/optimizations/{id}/approval — approve a pending optimization | `id` | No | Yes |
| `beaconed_optimizations_reject` | POST /api/v1/optimizations/{id}/rejection — reject a pending optimization | `id`, `reason?` | No | Yes |
| `beaconed_optimizations_apply` | POST /api/v1/optimizations/{id}/application — apply optimization to live product | `id` | **Yes** | No |
| `beaconed_optimizations_revert` | POST /api/v1/optimizations/{id}/reversion — revert an applied optimization | `id` | **Yes** | No |
| `beaconed_webhooks_create` | POST /api/v1/webhooks — create a webhook subscription (returns one-time secret) | `url`, `events` | No | No |
| `beaconed_webhooks_update` | PATCH /api/v1/webhooks/{id} — update webhook URL, events, or status | `id`, `url?`, `events?`, `status?` | No | Yes |
| `beaconed_webhooks_delete` | DELETE /api/v1/webhooks/{id} — remove a webhook subscription | `id` | **Yes** | Yes |
| `beaconed_webhooks_test` | POST /api/v1/webhooks/{id}/test — send a test event to a webhook | `id` | No | No |

### Destructive operations

Three tools are annotated with `destructiveHint: true` — compliant MCP clients will prompt the user for confirmation before invoking them:

- **`beaconed_optimizations_apply`** — pushes AI-generated copy to the live Shopify product. Changes are visible to customers immediately.
- **`beaconed_optimizations_revert`** — overwrites the product's current copy with the original pre-optimization content.
- **`beaconed_webhooks_delete`** — permanently removes the webhook subscription. Deliveries stop immediately and the signing secret cannot be recovered.

## Resources

Resources allow Claude Desktop to browse Beaconed data directly:

| URI | Description |
|-----|-------------|
| `beaconed://products` | First page of products (20 per page, JSON) |
| `beaconed://products/{id}` | Full product detail by UUID |
| `beaconed://optimizations` | First page of optimizations (20 per page, JSON) |
| `beaconed://optimizations/{id}` | Full optimization detail by UUID |

## Error Handling

All API errors (401, 403, 404, 422, 429, 5xx) are returned as inline `isError: true` MCP tool results with a descriptive message — the model sees the error text directly rather than the transport throwing.
