// Stub type for BeaconedClient until @joshre/beaconed-api-client ships its src/ in M1.
// Switch this import to `import { BeaconedClient } from '@joshre/beaconed-api-client'`
// once the api-client package has been built and published.
interface BeaconedClientOptions {
  apiKey: string;
  baseUrl?: string;
  xClient?: string;
}

// Placeholder class — replaced by the real BeaconedClient from the api-client package in M1.
class BeaconedClient {
  constructor(public readonly options: BeaconedClientOptions) {}
}

export function createClient(): BeaconedClient {
  const apiKey = process.env['BEACONED_API_KEY'];
  if (!apiKey) {
    throw new Error('BEACONED_API_KEY environment variable is required');
  }

  return new BeaconedClient({
    apiKey,
    baseUrl: process.env['BEACONED_BASE_URL'] ?? 'https://beaconed.ai',
    xClient: 'beaconed-mcp',
  });
}
