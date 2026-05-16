import { BeaconedClient } from '@joshre/beaconed-api-client';

export function createClient(): BeaconedClient {
  const apiKey = process.env['BEACONED_API_KEY'];
  if (!apiKey) {
    process.stderr.write('BEACONED_API_KEY environment variable is required\n');
    process.exit(2);
  }

  return new BeaconedClient({
    apiKey,
    baseUrl: process.env['BEACONED_BASE_URL'] ?? 'https://beaconed.ai',
    userAgent: 'beaconed-mcp/0.0.1',
  });
}
