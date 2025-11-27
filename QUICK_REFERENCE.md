# Quick Reference Guide

## Project Structure

```
github-profile-counter/
├── src/
│   └── index.ts              # Main application with all routes
├── wrangler.jsonc            # Cloudflare Worker configuration
├── worker-configuration.d.ts # Auto-generated TypeScript types
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── README.md                 # Main documentation
├── API.md                    # Detailed API documentation
├── examples.html             # Live examples page
├── test.sh                   # Test script
└── .gitignore                # Git ignore rules
```

## Quick Commands

```bash
# Development
pnpm run dev              # Start local dev server (http://localhost:8788)

# Deployment
pnpm run deploy           # Deploy to Cloudflare Workers

# Type Generation
pnpm run cf-typegen       # Generate TypeScript types

# Testing
./test.sh                 # Run API tests
```

## Key Endpoints

```
GET /                              # API documentation
GET /badge/:profile                # SVG badge (auto-increment)
GET /count/:profile                # JSON count (auto-increment)
GET /website/:domain               # Website count (auto-increment)
GET /stats/:profile                # Profile stats (read-only)
GET /stats/website/:domain         # Website stats (read-only)
```

## Rate Limits (per IP per hour)

- Badges: 300 requests/hour
- Counters: 30 requests/hour
- Stats: 1000 requests/hour

## Badge Query Parameters

```
?style=flat|flat-square|for-the-badge
&color=brightgreen|green|blue|red|orange|yellow|grey
```

## KV Storage Keys

```
profile:{username}           # Profile view counts
website:{domain}             # Website view counts
ratelimit:{ip}:{endpoint}:{hour}  # Rate limiting (auto-expires)
```

## Code Structure in src/index.ts

1. **Validation Utilities** (lines 7-45)
   - `validateProfileName()` - GitHub username validation
   - `validateDomain()` - Domain name validation

2. **Rate Limiting Middleware** (lines 47-69)
   - `checkRateLimit()` - IP-based hourly rate limits

3. **Counter Service** (lines 71-106)
   - `getCount()` - Read count without incrementing
   - `incrementCount()` - Atomic increment operation

4. **Badge Generation** (lines 108-187)
   - `generateBadgeSVG()` - Dynamic SVG generation
   - Supports 3 styles, 8 colors

5. **CORS Middleware** (lines 189-194)
   - Allows all origins for embedding

6. **Route Handlers** (lines 196-end)
   - Root endpoint - API info
   - Badge endpoint - SVG with increment
   - Count endpoints - JSON with increment
   - Stats endpoints - Read-only counts

## Example Usage

### In GitHub README
```markdown
![Profile Views](https://your-worker.workers.dev/badge/yourusername)
```

### Via cURL
```bash
# Increment and get count
curl https://your-worker.workers.dev/count/username

# Read without incrementing
curl https://your-worker.workers.dev/stats/username
```

### Via JavaScript
```javascript
// Fetch stats without incrementing
const response = await fetch('https://your-worker.workers.dev/stats/username');
const data = await response.json();
console.log(`Views: ${data.count}`);
```

## Error Response Structure

```json
{
  "error": "Error type",
  "message": "Detailed message",
  "code": "ERROR_CODE"
}
```

Error codes:
- `INVALID_INPUT` - Validation failed
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `SERVER_ERROR` - KV operation failed

## Security Features

- ✅ Input validation (prevents injection)
- ✅ Rate limiting (prevents abuse)
- ✅ CORS configured (safe embedding)
- ✅ Security headers (`X-Content-Type-Options: nosniff`)
- ✅ No user data collection (only IP for rate limiting)

## Configuration

KV namespace binding in `wrangler.jsonc`:
```jsonc
{
  "kv_namespaces": [
    {
      "binding": "PROFILE_VIEWS",
      "id": "a9a3b3d03f044f059c4476d1bdcff61f"
    }
  ]
}
```

## Testing Checklist

- [ ] Root endpoint returns API info
- [ ] Badge generates valid SVG
- [ ] Counter increments correctly
- [ ] Stats doesn't increment
- [ ] Rate limiting works
- [ ] Invalid input returns 400
- [ ] Error badges display correctly
- [ ] CORS headers present
- [ ] All styles render properly
- [ ] All colors work

## Deployment Checklist

- [ ] Test locally with `pnpm run dev`
- [ ] Run test script `./test.sh`
- [ ] Check for TypeScript errors
- [ ] Review wrangler.jsonc configuration
- [ ] Deploy with `pnpm run deploy`
- [ ] Test production endpoints
- [ ] Update README with production URL
- [ ] Test badge in actual GitHub README

## Performance Notes

- KV reads: ~50ms typical
- KV writes: ~100ms typical
- Badge generation: <5ms
- Rate limiting: <10ms
- Total response time: ~150-200ms

## Known Limitations

- Rate limits are per-IP, shared across endpoints types
- KV eventually consistent (rare count discrepancies possible)
- Badge cache bypass may increase costs at high scale
- No authentication (public service)

## Future Enhancements

- [ ] Add authentication for private counters
- [ ] Support custom badge labels
- [ ] Add more badge styles (shields.io compatible)
- [ ] Implement counter reset endpoint
- [ ] Add webhook notifications for milestones
- [ ] Support custom domains
- [ ] Add analytics dashboard
- [ ] Implement A/B testing for badge designs
