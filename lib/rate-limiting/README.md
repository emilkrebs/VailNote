# Fresh Rate Limit 🚦

A privacy-preserving rate limiting middleware for
[Fresh](https://fresh.deno.dev) applications using Anonymous Rate-Limited
Credentials (ARC).

## Features

- 🔒 **Privacy-First**: Uses ARC tokens instead of storing raw IP addresses
- ⏰ **Daily Token Rotation**: Automatic daily rotation of client tokens
- 🚫 **Configurable Blocking**: Temporary blocking after rate limit exceeded
- 🧹 **Auto Cleanup**: Automatic cleanup of expired entries
- 📊 **Monitoring**: Built-in statistics for monitoring
- 🏗️ **Fresh Integration**: Seamless integration with Fresh middleware

## Installation

```bash
deno add jsr:@vailnote/rate-limiter
```

## Quick Start

```typescript
import { App } from "fresh";
import { ArcRateLimiter } from "@vailnote/rate-limiter";

const rateLimiter = new ArcRateLimiter({
  maxRequests: 10, // 10 requests
  windowMs: 60 * 1000, // per minute
  blockDurationMs: 5 * 60 * 1000, // 5-minute block
  serverSecret: Deno.env.get("ARC_SECRET")!, // required
});

const app = new App()
  .use(rateLimiter.middleware())
  .get("/", () => new Response("Hello World!"));

await app.listen({ port: 8000 });
```

## How ARC (Anonymous Rate-Limited Credentials) Works

Traditional rate limiting stores client IP addresses, which raises privacy
concerns. This library implements ARC tokens that provide rate limiting while
preserving user privacy:

1. **Client Identification**: Extracts client identifier from request headers
   (IP address when available)
2. **Daily Salt Generation**: Creates a daily rotating salt based on current
   date
3. **Token Generation**:
   `HMAC-SHA256(client_identifier + daily_salt + service_identifier, serverSecret)`
4. **Privacy Protection**: Raw IP addresses are never stored, only hashed tokens

### Daily Token Rotation

Tokens automatically rotate daily, providing these benefits:

- **Privacy**: Old tokens become invalid, limiting long-term tracking
- **Fresh Start**: Clients get a fresh rate limit quota each day
- **Abuse Mitigation**: Temporary blocks don't persist indefinitely

## API Reference

### `ArcRateLimiter`

The main rate limiter class.

#### Constructor

```typescript
new ArcRateLimiter(options: ArcRateLimiterOptions)
```

| Option                  | Type       | Default         | Description                                 |
| ----------------------- | ---------- | --------------- | ------------------------------------------- |
| `maxRequests`           | `number`   | `10`            | Maximum requests allowed per window         |
| `windowMs`              | `number`   | `60000`         | Time window in milliseconds (1 minute)      |
| `blockDurationMs`       | `number`   | `300000`        | Block duration in milliseconds (5 minutes)  |
| `identifier`            | `string`   | `"default-arc"` | Service identifier for token generation     |
| `serverSecret`          | `string`   | **required**    | Secret key for HMAC token generation        |
| `enablePeriodicCleanup` | `boolean`  | `true`          | Enable automatic cleanup of expired entries |
| `store`                 | `ArcStore` | In-memory store | Custom store (e.g. Redis, SQL)              |

#### Methods

##### `checkRateLimit(request: Request)`

Manually check rate limit for a request.

```typescript
const result = await rateLimiter.checkRateLimit(request);
console.log(result);
// {
//   allowed: true,
//   remaining: 9,
//   resetTime: 1234567890,
//   arcToken: "abc123..."
// }
```

##### `middleware<State>()`

Returns Fresh middleware function.

```typescript
app.use(rateLimiter.middleware());
```

##### `getStats()`

Get monitoring statistics.

```typescript
const stats = rateLimiter.getStats();
// { activeTokens: 5, blockedTokens: 2 }
```

##### `destroy()`

Cleanup resources and stop periodic cleanup.

```typescript
rateLimiter.destroy();
```

## Configuration Examples

### Basic Rate Limiting

```typescript
// 100 requests per hour
const rateLimiter = new ArcRateLimiter({
  maxRequests: 100,
  windowMs: 60 * 60 * 1000,
  serverSecret: Deno.env.get("ARC_SECRET")!,
});
```

### API Protection

```typescript
// Strict API rate limiting
const apiLimiter = new ArcRateLimiter({
  maxRequests: 30,
  windowMs: 15 * 60 * 1000, // per 15 minutes
  blockDurationMs: 60 * 60 * 1000, // 1 hour block
  identifier: "api-v1",
  serverSecret: Deno.env.get("ARC_SECRET")!,
});

app.use("/api", apiLimiter.middleware());
```

### Custom Store Integration (Deno KV Example)

```typescript
const redis = new RedisClient(...);

const rateLimiter = new ArcRateLimiter({
  maxRequests: 50,
  windowMs: 60 * 1000,
  serverSecret: Deno.env.get("ARC_SECRET")!,
  store: await (new DenoKVArcStore()).init(), // Custom Deno KV store
});
```

## Response Headers

When rate limiting is active, these headers are automatically added:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: ISO timestamp when the limit resets
- `Retry-After`: Seconds to wait before retrying (when blocked)

## Error Handling

When rate limit is exceeded, the middleware throws an `HttpError`:

```typescript
// This is handled automatically by the middleware
throw new HttpError(429, "Too Many Requests", {
  cause: {
    allowed: false,
    remaining: 0,
    retryAfter: 300,
    resetTime: 1234567890,
  },
});
```

## Privacy Considerations

### What's Stored

- ✅ Hashed ARC tokens (not reversible to IP addresses)
- ✅ Request counts and timestamps
- ✅ Block status and duration

### What's NOT Stored

- ❌ Raw IP addresses
- ❌ User agent strings (only used for fallback hashing)
- ❌ Any personally identifiable information

### Client Identification Fallback

When IP address is not available (e.g., behind certain proxies), the system
falls back to:

```
hash(user_agent:accept_header:daily_salt:service_id)
```

This provides rate limiting functionality while maintaining privacy.

## Monitoring

### Statistics

```typescript
const stats = rateLimiter.getStats();
console.log(`Active tokens: ${stats.activeTokens}`);
console.log(`Blocked tokens: ${stats.blockedTokens}`);
```

### Custom Monitoring

```typescript
app.get("/admin/rate-limit-stats", () => {
  const stats = rateLimiter.getStats();
  return new Response(JSON.stringify({
    ...stats,
    timestamp: new Date().toISOString(),
    memoryUsage: (stats.activeTokens * 100) + " bytes (estimated)",
  }));
});
```

## Testing

Run the test suite:

```bash
deno test -A
```

For development testing, disable cleanup:

```typescript
const rateLimiter = new ArcRateLimiter({
  maxRequests: 10,
  windowMs: 60000,
  enablePeriodicCleanup: false, // Disable cleanup for testing
  serverSecret: Deno.env.get("ARC_SECRET")!,
});
```

## Example Application

See `main.ts` for a complete example:

```bash
deno task dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run `deno fmt` and `deno lint`
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Related

- [Fresh Framework](https://fresh.deno.dev)
- [Deno](https://deno.land)
- [Rate Limiting Best Practices](https://tools.ietf.org/html/rfc6585)
