# GitHub Profile Counter API Documentation

A Cloudflare Workers-based service to track profile, website, and repository hit counts with badge generation.

## Features

- 🎯 Profile view counter with auto-increment
- 🌐 Website view counter with auto-increment
- 📦 Repository hit counter with auto-increment
- 🏷️ Dynamic SVG badge generation with multiple styles
- 📊 Read-only analytics endpoints
- 🛡️ Conservative rate limiting (30-300 req/hour per IP)
- ✅ Input validation for profiles and domains
- 🚨 Comprehensive error handling with clear error states
- 🔄 Real-time counts (no caching)

## Base URL

- Development: `http://localhost:8788`
- Production: `https://your-worker.your-subdomain.workers.dev`

## Endpoints

### 1. Root Endpoint

**GET /** - API Information

```bash
curl http://localhost:8788/
```

Returns API documentation and available endpoints.

---

### 2. Badge Endpoint (Auto-increment)

**GET /badge/:profile**

Generate an SVG badge showing profile view count. Increments on each call.

**Parameters:**
- `profile` (path) - GitHub username (alphanumeric, hyphens, underscores, max 39 chars)

**Query Parameters:**
- `style` (optional) - Badge style: `flat` (default), `flat-square`, `for-the-badge`
- `color` (optional) - Badge color: `brightgreen` (default), `green`, `blue`, `red`, `orange`, `yellow`, `grey`

**Rate Limit:** 300 requests/hour per IP

**Examples:**

```bash
# Default style (flat, brightgreen)
curl http://localhost:8788/badge/octocat

# Flat-square style with blue color
curl http://localhost:8788/badge/octocat?style=flat-square&color=blue

# For-the-badge style with orange color
curl http://localhost:8788/badge/torvalds?style=for-the-badge&color=orange
```

**Response:**
- Content-Type: `image/svg+xml`
- Cache-Control: `no-cache, no-store, must-revalidate`

**Error States:**
- Returns error badge with appropriate message for validation errors, rate limits, or server errors

**Markdown Usage:**

```markdown
![Profile Views](https://your-worker.your-subdomain.workers.dev/badge/yourusername)
![Profile Views](https://your-worker.your-subdomain.workers.dev/badge/yourusername?style=flat-square&color=blue)
```

---

### 2.1 Website Badge Endpoint (Auto-increment)

**GET /badge/website/:domain**

Generate an SVG badge showing website hit count. Increments on each call.

**Parameters:**
- `domain` (path) - Domain name (e.g., `example.com`)

**Query Parameters:**
- `style` (optional) - Badge style: `flat` (default), `flat-square`, `for-the-badge`
- `color` (optional) - Badge color: `brightgreen` (default), `green`, `blue`, `red`, `orange`, `yellow`, `grey`

**Rate Limit:** 300 requests/hour per IP

**Examples:**

```bash
curl http://localhost:8788/badge/website/example.com
curl http://localhost:8788/badge/website/example.com?style=flat-square&color=blue
```

**Markdown Usage:**

```markdown
![Website Hits](https://your-worker.your-subdomain.workers.dev/badge/website/example.com)
```

---

### 2.2 Repository Badge Endpoint (Auto-increment)

**GET /badge/repo/:owner/:repo**

Generate an SVG badge showing repository hit count. Increments on each call.

**Parameters:**
- `owner` (path) - GitHub owner/user name
- `repo` (path) - Repository name

**Query Parameters:**
- `style` (optional) - Badge style: `flat` (default), `flat-square`, `for-the-badge`
- `color` (optional) - Badge color: `brightgreen` (default), `green`, `blue`, `red`, `orange`, `yellow`, `grey`

**Rate Limit:** 300 requests/hour per IP

**Examples:**

```bash
curl http://localhost:8788/badge/repo/octocat/hello-world
curl http://localhost:8788/badge/repo/octocat/hello-world?style=for-the-badge&color=orange
```

**Markdown Usage:**

```markdown
![Repo Hits](https://your-worker.your-subdomain.workers.dev/badge/repo/octocat/hello-world)
```

---

### 3. Profile Count Endpoint (Auto-increment)

**GET /count/:profile**

Get profile view count as JSON. Increments on each call.

**Parameters:**
- `profile` (path) - GitHub username

**Rate Limit:** 30 requests/hour per IP

**Example:**

```bash
curl http://localhost:8788/count/octocat
```

**Success Response (200):**

```json
{
  "count": 42,
  "profile": "octocat"
}
```

**Error Responses:**

```json
// 400 - Invalid Input
{
  "error": "Invalid profile name",
  "message": "Profile name must contain only alphanumeric characters, hyphens, and underscores",
  "code": "INVALID_INPUT"
}

// 429 - Rate Limit Exceeded
{
  "error": "Rate limit exceeded",
  "message": "Rate limit exceeded. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED"
}

// 500 - Server Error
{
  "error": "Internal server error",
  "message": "Failed to increment count",
  "code": "SERVER_ERROR"
}
```

---

### 4. Website Count Endpoint (Auto-increment)

**GET /website/:domain**

Get website view count as JSON. Increments on each call.

**Parameters:**
- `domain` (path) - Domain name (e.g., `example.com`, `subdomain.example.com`)

**Rate Limit:** 30 requests/hour per IP

**Example:**

```bash
curl http://localhost:8788/website/example.com
```

**Success Response (200):**

```json
{
  "count": 1337,
  "domain": "example.com"
}
```

**Error Responses:** Same structure as profile count endpoint

---

### 5. Repository Hits Endpoint (Auto-increment)

**GET /repo/:owner/:repo**

Get repository hit count as JSON. Increments on each call.

**Parameters:**
- `owner` (path) - GitHub owner/user name
- `repo` (path) - Repository name

**Rate Limit:** 30 requests/hour per IP

**Example:**

```bash
curl http://localhost:8788/repo/octocat/hello-world
```

**Success Response (200):**

```json
{
  "count": 7,
  "owner": "octocat",
  "repo": "hello-world",
  "repository": "octocat/hello-world"
}
```

**Error Responses:** Same structure as profile count endpoint

---

### 6. Profile Stats Endpoint (Read-only)

**GET /stats/:profile**

Get profile view count WITHOUT incrementing. Useful for analytics dashboards.

**Parameters:**
- `profile` (path) - GitHub username

**Rate Limit:** 1000 requests/hour per IP

**Example:**

```bash
curl http://localhost:8788/stats/octocat
```

**Success Response (200):**

```json
{
  "count": 42,
  "profile": "octocat",
  "incremented": false
}
```

**Cache-Control:** `public, max-age=60` (cached for 60 seconds)

---

### 7. Website Stats Endpoint (Read-only)

**GET /stats/website/:domain**

Get website view count WITHOUT incrementing.

**Parameters:**
- `domain` (path) - Domain name

**Rate Limit:** 1000 requests/hour per IP

**Example:**

```bash
curl http://localhost:8788/stats/website/example.com
```

**Success Response (200):**

```json
{
  "count": 1337,
  "domain": "example.com",
  "incremented": false
}
```

---

### 8. Repository Stats Endpoint (Read-only)

**GET /stats/repo/:owner/:repo**

Get repository hit count WITHOUT incrementing.

**Parameters:**
- `owner` (path) - GitHub owner/user name
- `repo` (path) - Repository name

**Rate Limit:** 1000 requests/hour per IP

**Example:**

```bash
curl http://localhost:8788/stats/repo/octocat/hello-world
```

**Success Response (200):**

```json
{
  "count": 7,
  "owner": "octocat",
  "repo": "hello-world",
  "repository": "octocat/hello-world",
  "incremented": false
}
```

---

## Rate Limits

Conservative rate limits per IP address per hour:

| Endpoint Type | Limit/Hour | Reason |
|--------------|------------|---------|
| Badge | 300 | Higher limit for README embeds |
| Count | 30 | Conservative for API calls |
| Website | 30 | Conservative for API calls |
| Stats | 1000 | Read-only, no increment |

Rate limits reset every hour based on UTC time.

---

## Validation Rules

### Profile Names (GitHub Username Rules)
- Required, non-empty
- Maximum 39 characters
- Only alphanumeric characters, hyphens (`-`), and underscores (`_`)
- Cannot start or end with hyphen
- Pattern: `^[a-zA-Z0-9]([a-zA-Z0-9-_]{0,37}[a-zA-Z0-9])?$`

### Domain Names
- Required, non-empty
- Maximum 253 characters
- Valid domain format with labels separated by dots
- Each label: alphanumeric and hyphens only
- Pattern: `^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$`

### Repository Identifiers
- Owner follows profile name rules
- Repository name is required
- Repository name maximum 100 characters
- Repository can contain alphanumeric characters, hyphens (`-`), underscores (`_`), and dots (`.`)
- Pattern: `^[a-zA-Z0-9._-]+$`

---

## Error Handling

All endpoints return appropriate HTTP status codes and error messages:

- **400 Bad Request** - Invalid input (validation failed)
- **429 Too Many Requests** - Rate limit exceeded
- **500 Internal Server Error** - KV operation failed

Badge endpoint returns error badges (SVG) instead of JSON for seamless README integration.

---

## CORS

All endpoints support CORS with:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, OPTIONS`
- Suitable for embedding in any website

---

## Caching Strategy

- **Increment endpoints** (all badge endpoints, count, website, repo): `no-cache, no-store, must-revalidate` for real-time counts
- **Stats endpoints**: `public, max-age=60` for 60-second cache

This ensures badges and counters always show current values.

---

## Development

```bash
# Install dependencies
pnpm install

# Start local development server
pnpm run dev

# Deploy to Cloudflare Workers
pnpm run deploy

# Generate TypeScript types
pnpm run cf-typegen
```

---

## Storage

Data is stored in Cloudflare Workers KV with keys:

- Profile views: `profile:{username}`
- Website views: `website:{domain}`
- Repository hits: `repo:{owner}/{repo}`
- Rate limits: `ratelimit:{ip}:{endpoint}:{hour}`

Rate limit keys expire after 2 hours automatically.

---

## Example Use Cases

### 1. GitHub Profile README

```markdown
# Hi there 👋

![Profile Views](https://your-worker.workers.dev/badge/yourusername?style=flat-square&color=blue)

<!-- Rest of your README -->
```

### 2. Website Footer

```html
<div class="stats">
  <img src="https://your-worker.workers.dev/badge/yoursite.com?style=for-the-badge&color=green" 
       alt="Site Views" />
</div>
```

### 3. Analytics Dashboard

```javascript
// Fetch stats without incrementing
const response = await fetch('https://your-worker.workers.dev/stats/username');
const data = await response.json();
console.log(`Profile has ${data.count} views`);
```

---

## Security Features

- Input validation prevents injection attacks
- Rate limiting prevents abuse
- CORS configured for safe cross-origin usage
- Security headers: `X-Content-Type-Options: nosniff`
- No user data collection beyond IP for rate limiting

---

## License

MIT
