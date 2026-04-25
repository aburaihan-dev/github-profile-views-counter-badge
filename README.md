# GitHub Profile Counter

A Cloudflare Workers-based service to track profile, website, and repository counts with dynamic SVG badge generation.

## Features

- 🎯 **Profile View Counter** - Track views per GitHub profile with auto-increment
- 🌐 **Website View Counter** - Track website visits with auto-increment
- 📦 **Repository Hit Counter** - Track hits per GitHub repository with auto-increment
- 🏷️ **Dynamic SVG Badges** - Generate beautiful badges with multiple styles and colors
- 📊 **Analytics Endpoints** - Read-only stats without incrementing counters
- 🛡️ **Rate Limiting** - Conservative limits (30-1000 req/hour) to prevent abuse
- ✅ **Input Validation** - Validates profile names and domain names
- 🚨 **Error Handling** - Clear error states for validation, rate limits, and server errors
- 🔄 **Real-time Counts** - No caching for accurate view counts
- 🌍 **CORS Enabled** - Embed badges anywhere

## Quick Start

### Installation

```bash
pnpm install
```

### Development

```bash
# Start local development server
pnpm run dev

# Server runs at http://localhost:8788
```

### Testing

```bash
# Run test script
./test.sh
```

### Deployment

```bash
# Deploy to Cloudflare Workers
pnpm run deploy
```

### Generate Types

```bash
# Generate TypeScript types from Worker configuration
pnpm run cf-typegen
```

## API Documentation

See [API.md](./API.md) for complete API documentation including:
- All available endpoints
- Request/response formats
- Rate limits
- Validation rules
- Error handling
- Usage examples

## Quick Examples

### 1. Profile Badge in GitHub README

```markdown
![Profile Views](https://your-worker.workers.dev/badge/yourusername)
![Profile Views](https://your-worker.workers.dev/badge/yourusername?style=flat-square&color=blue)
```

### 1.1 Website Badge in README

```markdown
![Website Hits](https://your-worker.workers.dev/badge/website/example.com)
![Website Hits](https://your-worker.workers.dev/badge/website/example.com?style=for-the-badge&color=green)
```

### 1.2 Repository Badge in README

```markdown
![Repo Hits](https://your-worker.workers.dev/badge/repo/aburaihan-dev/jenkins-in-docker)
![Repo Hits](https://your-worker.workers.dev/badge/repo/aburaihan-dev/jenkins-in-docker?style=flat-square&color=blue)
```

### 2. Get Profile Count (JSON)

```bash
curl https://your-worker.workers.dev/count/octocat
# {"count": 42, "profile": "octocat"}
```

### 3. Website Counter

```bash
curl https://your-worker.workers.dev/website/example.com
# {"count": 1337, "domain": "example.com"}
```

### 4. Read-Only Stats (No Increment)

```bash
curl https://your-worker.workers.dev/stats/octocat
# {"count": 42, "profile": "octocat", "incremented": false}
```

### 5. Repository Hits

```bash
curl https://your-worker.workers.dev/repo/octocat/hello-world
# {"count": 7, "owner": "octocat", "repo": "hello-world", "repository": "octocat/hello-world"}
```

## Badge Styles

### Available Styles
- `flat` (default) - Classic flat design
- `flat-square` - Flat design with square edges
- `for-the-badge` - Large bold badge

### Available Colors
- `brightgreen` (default)
- `green`
- `blue`
- `red`
- `orange`
- `yellow`
- `grey`

### Example URLs

```
/badge/username                                    # Default: flat, brightgreen
/badge/username?style=flat-square                  # Flat-square style
/badge/username?style=flat-square&color=blue       # Blue flat-square
/badge/username?style=for-the-badge&color=orange   # Large orange badge
/badge/website/example.com                         # Website hits badge
/badge/website/example.com?style=for-the-badge&color=green  # Website hits badge (styled)
/badge/repo/octocat/hello-world                    # Repository hits badge
/badge/repo/aburaihan-dev/jenkins-in-docker        # Repository hits badge for jenkins-in-docker
/badge/repo/aburaihan-dev/jenkins-in-docker?style=flat-square&color=blue  # Styled repo badge
```

## Endpoints Overview

| Endpoint | Method | Increments | Rate Limit | Purpose |
|----------|--------|------------|------------|---------|
| `/badge/:profile` | GET | ✅ Yes | 300/hour | SVG badge with count |
| `/badge/website/:domain` | GET | ✅ Yes | 300/hour | SVG website hits badge |
| `/badge/repo/:owner/:repo` | GET | ✅ Yes | 300/hour | SVG repository hits badge |
| `/count/:profile` | GET | ✅ Yes | 30/hour | JSON profile count |
| `/website/:domain` | GET | ✅ Yes | 30/hour | JSON website count |
| `/repo/:owner/:repo` | GET | ✅ Yes | 30/hour | JSON repository hits |
| `/stats/:profile` | GET | ❌ No | 1000/hour | Read-only profile stats |
| `/stats/website/:domain` | GET | ❌ No | 1000/hour | Read-only website stats |
| `/stats/repo/:owner/:repo` | GET | ❌ No | 1000/hour | Read-only repository stats |

## Architecture

### Technology Stack
- **Runtime**: Cloudflare Workers
- **Framework**: Hono
- **Storage**: Cloudflare Workers KV
- **Language**: TypeScript

### Data Storage

Cloudflare Workers KV stores:
- Profile views: `profile:{username}`
- Website views: `website:{domain}`
- Repository hits: `repo:{owner}/{repo}`
- Rate limits: `ratelimit:{ip}:{endpoint}:{hour}` (auto-expires)

### Rate Limiting

Per-IP rate limits reset hourly (UTC):
- Badge endpoints: 300 requests/hour
- Counter endpoints: 30 requests/hour
- Stats endpoints: 1000 requests/hour

## Configuration

The KV namespace is configured in `wrangler.jsonc`:

```jsonc
{
  "kv_namespaces": [
    {
      "binding": "PROFILE_VIEWS",
      "id": "your-namespace-id"
    }
  ]
}
```

## Development Setup

1. Clone the repository
2. Install dependencies: `pnpm install`
3. KV namespace is already configured
4. Run dev server: `pnpm run dev`
5. Test endpoints: `./test.sh`

## Security

- Input validation prevents injection attacks
- Rate limiting prevents abuse
- No user data collection (only IP for rate limiting)
- CORS configured for safe embedding
- Security headers included

## License

MIT
