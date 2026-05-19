import {
  BeaconedError,
  BeaconedAuthError,
  BeaconedForbiddenError,
  BeaconedNotFoundError,
  BeaconedRateLimitError,
  BeaconedServerError,
  BeaconedNetworkError,
  BeaconedValidationError,
} from '@beaconed/api-client';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

function describeError(err: BeaconedError, toolName: string): string {
  const base = `[${toolName}] `;

  if (err instanceof BeaconedAuthError) {
    return `${base}Authentication failed (401). Check your BEACONED_API_KEY. ${err.message}`;
  }
  if (err instanceof BeaconedForbiddenError) {
    return `${base}Access denied (403). Your API key lacks permission for this resource. ${err.message}`;
  }
  if (err instanceof BeaconedNotFoundError) {
    return `${base}Not found (404). The requested resource does not exist. ${err.message}`;
  }
  if (err instanceof BeaconedValidationError) {
    const details =
      err.validationErrors.length > 0 ? ` Validation errors: ${err.validationErrors.join(', ')}` : '';
    return `${base}Validation error (422).${details} ${err.message}`;
  }
  if (err instanceof BeaconedRateLimitError) {
    const retry = err.retryAfterSeconds != null ? ` Retry after ${err.retryAfterSeconds}s.` : '';
    return `${base}Rate limit exceeded (429).${retry} ${err.message}`;
  }
  if (err instanceof BeaconedServerError) {
    return `${base}Server error (${err.status}). The Beaconed API returned an internal error. ${err.message}`;
  }
  if (err instanceof BeaconedNetworkError) {
    return `${base}Network error. Could not reach the Beaconed API. Check connectivity. ${err.message}`;
  }
  return `${base}API error (${err.status}, code=${err.code}). ${err.message}`;
}

export function formatError(err: unknown, toolName: string): CallToolResult {
  if (err instanceof BeaconedError) {
    return {
      content: [{ type: 'text', text: describeError(err, toolName) }],
      isError: true,
    };
  }
  const message = err instanceof Error ? err.message : String(err);
  return {
    content: [{ type: 'text', text: `[${toolName}] Unexpected error: ${message}` }],
    isError: true,
  };
}
