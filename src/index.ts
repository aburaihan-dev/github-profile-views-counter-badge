import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Context } from 'hono'

const app = new Hono<{ Bindings: CloudflareBindings }>()

// ==================== VALIDATION UTILITIES ====================

function validateProfileName(profile: string): { valid: boolean; error?: string } {
  if (!profile || profile.length === 0) {
    return { valid: false, error: 'Profile name is required' }
  }
  if (profile.length > 39) {
    return { valid: false, error: 'Profile name must be 39 characters or less' }
  }
  // GitHub username rules: alphanumeric, hyphens, underscores
  // Cannot start or end with hyphen
  const validPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-_]{0,37}[a-zA-Z0-9])?$/
  if (!validPattern.test(profile)) {
    return { valid: false, error: 'Profile name must contain only alphanumeric characters, hyphens, and underscores' }
  }
  return { valid: true }
}

function validateDomain(domain: string): { valid: boolean; error?: string } {
  if (!domain || domain.length === 0) {
    return { valid: false, error: 'Domain name is required' }
  }
  if (domain.length > 253) {
    return { valid: false, error: 'Domain name too long' }
  }
  // Basic domain validation
  const validPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  if (!validPattern.test(domain)) {
    return { valid: false, error: 'Invalid domain name format' }
  }
  return { valid: true }
}

// ==================== RATE LIMITING MIDDLEWARE ====================

async function checkRateLimit(
  c: Context<{ Bindings: CloudflareBindings }>,
  endpoint: string,
  limit: number
): Promise<{ allowed: boolean; error?: string }> {
  try {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown'
    const now = new Date()
    const hour = `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`
    const key = `ratelimit:${ip}:${endpoint}:${hour}`
    
    const currentCount = await c.env.PROFILE_VIEWS.get(key)
    const count = currentCount ? parseInt(currentCount, 10) : 0
    
    if (count >= limit) {
      return { allowed: false, error: 'Rate limit exceeded. Please try again later.' }
    }
    
    // Increment counter with 2 hour expiration (to handle clock skew)
    await c.env.PROFILE_VIEWS.put(key, String(count + 1), { expirationTtl: 7200 })
    
    return { allowed: true }
  } catch (error) {
    console.error('Rate limit check error:', error)
    // On error, allow the request (fail open)
    return { allowed: true }
  }
}

// ==================== COUNTER SERVICE ====================

async function getCount(
  kv: KVNamespace,
  type: 'profile' | 'website',
  identifier: string
): Promise<{ count: number; error?: string }> {
  try {
    const key = `${type}:${identifier}`
    const value = await kv.get(key)
    const count = value ? parseInt(value, 10) : 0
    return { count }
  } catch (error) {
    console.error('Get count error:', error)
    return { count: 0, error: 'Failed to retrieve count' }
  }
}

async function incrementCount(
  kv: KVNamespace,
  type: 'profile' | 'website',
  identifier: string
): Promise<{ count: number; error?: string }> {
  try {
    const key = `${type}:${identifier}`
    const currentValue = await kv.get(key)
    const newCount = currentValue ? parseInt(currentValue, 10) + 1 : 1
    await kv.put(key, String(newCount))
    return { count: newCount }
  } catch (error) {
    console.error('Increment count error:', error)
    return { count: 0, error: 'Failed to increment count' }
  }
}

// ==================== BADGE GENERATION ====================

function generateBadgeSVG(
  label: string,
  value: string,
  style: string = 'flat',
  color: string = 'brightgreen'
): string {
  const colorMap: Record<string, string> = {
    brightgreen: '#4c1',
    green: '#97ca00',
    blue: '#007ec6',
    red: '#e05d44',
    orange: '#fe7d37',
    yellow: '#dfb317',
    lightgrey: '#9f9f9f',
    grey: '#555',
  }
  
  const bgColor = colorMap[color] || colorMap.brightgreen
  const labelWidth = label.length * 6 + 10
  const valueWidth = value.length * 7 + 10
  const totalWidth = labelWidth + valueWidth
  
  if (style === 'flat-square') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="${totalWidth}" height="20" rx="0" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${bgColor}"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="14" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="13">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelWidth + valueWidth / 2}" y="13">${value}</text>
  </g>
</svg>`
  } else if (style === 'for-the-badge') {
    const largeLabelWidth = label.length * 9 + 20
    const largeValueWidth = value.length * 9 + 20
    const largeTotalWidth = largeLabelWidth + largeValueWidth
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${largeTotalWidth}" height="28">
  <rect width="${largeLabelWidth}" height="28" fill="#555"/>
  <rect x="${largeLabelWidth}" width="${largeValueWidth}" height="28" fill="${bgColor}"/>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="12" font-weight="bold">
    <text x="${largeLabelWidth / 2}" y="18">${label.toUpperCase()}</text>
    <text x="${largeLabelWidth + largeValueWidth / 2}" y="18">${value.toUpperCase()}</text>
  </g>
</svg>`
  } else {
    // Default flat style
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <rect width="${labelWidth}" height="20" fill="#555"/>
    <rect x="${labelWidth}" width="${valueWidth}" height="20" fill="${bgColor}"/>
    <rect width="${totalWidth}" height="20" fill="url(#b)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
</svg>`
  }
}

// ==================== CORS MIDDLEWARE ====================

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}))

// ==================== ROUTES ====================

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'GitHub Profile Counter API',
    version: '1.0.0',
    endpoints: {
      badge: '/badge/:profile - Get profile view counter as badge (auto-increment)',
      count: '/count/:profile - Get profile view counter as JSON (auto-increment)',
      website: '/website/:domain - Get website view counter as JSON (auto-increment)',
      stats_profile: '/stats/:profile - Get profile view counter without incrementing',
      stats_website: '/stats/website/:domain - Get website view counter without incrementing',
    },
    query_params: {
      badge: 'style=flat|flat-square|for-the-badge, color=brightgreen|green|blue|red|orange|yellow|grey',
    },
  })
})

// Badge endpoint with auto-increment
app.get('/badge/:profile', async (c) => {
  const profile = c.req.param('profile')
  const style = c.req.query('style') || 'flat'
  const color = c.req.query('color') || 'brightgreen'
  
  // Validate profile name
  const validation = validateProfileName(profile)
  if (!validation.valid) {
    const errorBadge = generateBadgeSVG('profile views', 'invalid', style, 'red')
    return c.body(errorBadge, 400, {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
    })
  }
  
  // Check rate limit (300 requests/hour for badges)
  const rateLimit = await checkRateLimit(c, 'badge', 300)
  if (!rateLimit.allowed) {
    const errorBadge = generateBadgeSVG('profile views', 'rate limited', style, 'orange')
    return c.body(errorBadge, 429, {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
    })
  }
  
  // Increment counter
  const result = await incrementCount(c.env.PROFILE_VIEWS, 'profile', profile)
  
  if (result.error) {
    const errorBadge = generateBadgeSVG('profile views', 'error', style, 'red')
    return c.body(errorBadge, 500, {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
    })
  }
  
  const badge = generateBadgeSVG('profile views', String(result.count), style, color)
  
  return c.body(badge, 200, {
    'Content-Type': 'image/svg+xml',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Content-Type-Options': 'nosniff',
  })
})

// Profile count endpoint with auto-increment
app.get('/count/:profile', async (c) => {
  const profile = c.req.param('profile')
  
  // Validate profile name
  const validation = validateProfileName(profile)
  if (!validation.valid) {
    return c.json(
      { error: 'Invalid profile name', message: validation.error, code: 'INVALID_INPUT' },
      400
    )
  }
  
  // Check rate limit (30 requests/hour for counter endpoints)
  const rateLimit = await checkRateLimit(c, 'count', 30)
  if (!rateLimit.allowed) {
    return c.json(
      { error: 'Rate limit exceeded', message: rateLimit.error, code: 'RATE_LIMIT_EXCEEDED' },
      429
    )
  }
  
  // Increment counter
  const result = await incrementCount(c.env.PROFILE_VIEWS, 'profile', profile)
  
  if (result.error) {
    return c.json(
      { error: 'Internal server error', message: result.error, code: 'SERVER_ERROR' },
      500
    )
  }
  
  return c.json(
    { count: result.count, profile },
    200,
    {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  )
})

// Website count endpoint with auto-increment
app.get('/website/:domain', async (c) => {
  const domain = c.req.param('domain')
  
  // Validate domain name
  const validation = validateDomain(domain)
  if (!validation.valid) {
    return c.json(
      { error: 'Invalid domain name', message: validation.error, code: 'INVALID_INPUT' },
      400
    )
  }
  
  // Check rate limit (30 requests/hour for counter endpoints)
  const rateLimit = await checkRateLimit(c, 'website', 30)
  if (!rateLimit.allowed) {
    return c.json(
      { error: 'Rate limit exceeded', message: rateLimit.error, code: 'RATE_LIMIT_EXCEEDED' },
      429
    )
  }
  
  // Increment counter
  const result = await incrementCount(c.env.PROFILE_VIEWS, 'website', domain)
  
  if (result.error) {
    return c.json(
      { error: 'Internal server error', message: result.error, code: 'SERVER_ERROR' },
      500
    )
  }
  
  return c.json(
    { count: result.count, domain },
    200,
    {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    }
  )
})

// Read-only stats endpoint for profiles
app.get('/stats/:profile', async (c) => {
  const profile = c.req.param('profile')
  
  // Validate profile name
  const validation = validateProfileName(profile)
  if (!validation.valid) {
    return c.json(
      { error: 'Invalid profile name', message: validation.error, code: 'INVALID_INPUT' },
      400
    )
  }
  
  // No strict rate limit for stats (or use higher limit like 1000/hour)
  const rateLimit = await checkRateLimit(c, 'stats', 1000)
  if (!rateLimit.allowed) {
    return c.json(
      { error: 'Rate limit exceeded', message: rateLimit.error, code: 'RATE_LIMIT_EXCEEDED' },
      429
    )
  }
  
  // Get count without incrementing
  const result = await getCount(c.env.PROFILE_VIEWS, 'profile', profile)
  
  if (result.error) {
    return c.json(
      { error: 'Internal server error', message: result.error, code: 'SERVER_ERROR' },
      500
    )
  }
  
  return c.json(
    { count: result.count, profile, incremented: false },
    200,
    {
      'Cache-Control': 'public, max-age=60',
    }
  )
})

// Read-only stats endpoint for websites
app.get('/stats/website/:domain', async (c) => {
  const domain = c.req.param('domain')
  
  // Validate domain name
  const validation = validateDomain(domain)
  if (!validation.valid) {
    return c.json(
      { error: 'Invalid domain name', message: validation.error, code: 'INVALID_INPUT' },
      400
    )
  }
  
  // No strict rate limit for stats
  const rateLimit = await checkRateLimit(c, 'stats', 1000)
  if (!rateLimit.allowed) {
    return c.json(
      { error: 'Rate limit exceeded', message: rateLimit.error, code: 'RATE_LIMIT_EXCEEDED' },
      429
    )
  }
  
  // Get count without incrementing
  const result = await getCount(c.env.PROFILE_VIEWS, 'website', domain)
  
  if (result.error) {
    return c.json(
      { error: 'Internal server error', message: result.error, code: 'SERVER_ERROR' },
      500
    )
  }
  
  return c.json(
    { count: result.count, domain, incremented: false },
    200,
    {
      'Cache-Control': 'public, max-age=60',
    }
  )
})

export default app
