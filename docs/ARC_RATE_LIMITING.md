# Anonymous Rate-Limited Credentials (ARC) Implementation

## Overview

This implementation uses Anonymous Rate-Limited Credentials (ARCs) to provide effective rate limiting while preserving
user privacy. Unlike traditional IP-based rate limiting that stores raw IP addresses, ARCs use privacy-preserving
tokens.

## Architecture

### Core Components

1. **ArcRateLimiter** (`utils/rate-limiting/arc-rate-limiter.ts`) - Main rate limiting logic
2. **Rate Limit Headers** (`utils/rate-limiting/rate-limit-headers.ts`) - Standardized header generation
3. **API Integration** - Applied to both API endpoints and form submissions

## How It Works

### 1. Token Generation

- **Input**: Client identifier (IP from proxy headers or fallback identifiers) + daily salt + service identifier
- **Process**: SHA-256 hash of the combined input
- **Output**: Anonymous token that rotates daily

### 2. Privacy Protection

- **No IP Storage**: Raw IP addresses are never stored in memory or logs
- **Daily Rotation**: Tokens automatically rotate daily, preventing long-term tracking
- **Anonymous**: Tokens cannot be reverse-engineered to reveal original IP addresses
- **Unlinkable**: Previous day's tokens cannot be linked to current day's tokens

### 3. Rate Limiting Logic

- **Limit**: 10 requests per minute per ARC token
- **Blocking**: 5-minute block for rate limit violations
- **Headers**: Standard rate limit headers included in responses
- **Cleanup**: Automatic cleanup of expired entries

## API Response Headers

All responses include standard rate limiting headers:

- `X-RateLimit-Limit`: Maximum requests allowed per window
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: When the current window resets (ISO timestamp)
- `Retry-After`: Seconds to wait before retrying (429 responses only)

## Privacy Guarantees

1. **No Persistent Tracking**: Daily token rotation prevents cross-day tracking
2. **No IP Logging**: Raw IP addresses are never stored or logged
3. **Forward Secrecy**: Past tokens cannot be computed from current tokens
4. **Minimal Data**: Only rate limiting counters are stored, no user data

## Benefits

- **Effective Rate Limiting**: Prevents abuse and DoS attacks
- **Privacy Preserving**: Complies with privacy regulations and best practices
- **Scalable**: Memory usage is bounded by active users per day
- **Transparent**: Users can see their rate limit status via headers

## Configuration

Default settings (can be customized):

- **Rate Limit**: 10 requests per 60 seconds
- **Block Duration**: 5 minutes for violations
- **Cleanup Interval**: 10 minutes for expired entries
- **Token Rotation**: Daily (automatic)

## Code Architecture

### Endpoints Using ARC

- `POST /api/notes` - JSON API for note creation
- `POST /` - Form submission for note creation (no-JS fallback)

## Security Considerations

- Uses cryptographically secure SHA-256 hashing
- Daily salt rotation prevents rainbow table attacks
- Bounded memory usage prevents memory exhaustion attacks
- No correlation between tokens across different days
