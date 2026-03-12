// ─── Vimeo Tiers ────────────────────────────────────────────────────────────
export const VIMEO_TIERS = {
  standard:   { name: 'Vimeo Standard',   cost: 25,  description: 'Up to 2 TB storage, limited viewers' },
  advanced:   { name: 'Vimeo Advanced',   cost: 65,  description: 'Up to 7 TB, unlimited viewers' },
  enterprise: { name: 'Vimeo Enterprise', cost: 400, description: 'Unlimited, SSO, custom player, SLA' },
}

// ─── Infrastructure Tiers ────────────────────────────────────────────────────
// Vendure runs fully on Vercel (frontend + serverless API adapter).
// Magento runs on ECS Fargate (m6i.large) + Varnish.
export const INFRA_TIERS = {
  starter: {
    name: 'Starter', description: 'Dev / staging or low-traffic', color: '#6b7280',
    // Vendure / Vercel
    vercelBase: 200,           // Vercel Pro — low traffic / dev
    supabaseBase: 75,          // Supabase free–starter
    upstashBase: 30,           // Upstash pay-as-you-go
    // Magento / ECS Fargate
    magentoServerCost: 75,     // m6i.large ~$73/mo
    magentoUsersPerServer: 500,// effective concurrent PHP per m6i.large
    auroraBase: 150,           // Aurora MySQL single-AZ
    haBuffer: 1,
    // Shared multipliers
    redisMultiplier: 0.6, searchMultiplier: 0.6, monitoringMultiplier: 0.6,
  },
  professional: {
    name: 'Professional', description: 'Standard production', color: '#3b82f6',
    vercelBase: 500,           // Vercel Pro/Enterprise — production threshold
    supabaseBase: 150,         // Supabase Team + read replicas
    upstashBase: 65,           // Upstash Pay-as-you-go production
    magentoServerCost: 75,
    magentoUsersPerServer: 500,
    auroraBase: 300,           // Aurora MySQL Multi-AZ
    haBuffer: 2,
    redisMultiplier: 1, searchMultiplier: 1, monitoringMultiplier: 1,
  },
  enterprise: {
    name: 'Enterprise', description: 'Full HA + disaster recovery', color: '#8b5cf6',
    vercelBase: 1200,          // Vercel Enterprise — guaranteed SLAs
    supabaseBase: 350,         // Supabase Enterprise + replicas
    upstashBase: 150,          // Upstash Pro
    magentoServerCost: 75,
    magentoUsersPerServer: 500,
    auroraBase: 700,           // Aurora Global DB + replicas
    haBuffer: 3,
    redisMultiplier: 1.8, searchMultiplier: 1.7, monitoringMultiplier: 1.8,
  },
}

// ─── Stack metadata ───────────────────────────────────────────────────────────
export const STACKS = {
  vendure: {
    id: 'vendure', name: 'Vendure + Next.js', shortName: 'Vendure',
    color: '#3b82f6', bgColor: 'rgba(59,130,246,0.08)',
    tagline: 'Headless Commerce / Serverless',
    pros: ['Lowest hosting cost', 'Vercel handles both frontend & API', 'No dedicated servers to manage', 'Cloudflare CDN — zero egress fees'],
    cons: ['Newer ecosystem', 'Custom dev effort upfront', 'Smaller plugin library'],
  },
  magento: {
    id: 'magento', name: 'Magento 2 + Hyvä', shortName: 'Magento',
    color: '#f97316', bgColor: 'rgba(249,115,22,0.08)',
    tagline: 'Traditional PHP Commerce',
    pros: ['Battle-tested platform', 'Large extension ecosystem', 'Rich built-in features', 'Well-known among agencies'],
    cons: ['2–3× higher hosting cost', 'PHP is resource-heavy', 'Elasticsearch mandatory (M2.4+)', 'Dedicated servers required'],
  },
}

// ─── Category colors ─────────────────────────────────────────────────────────
export const CATEGORIES = {
  Compute:    '#3b82f6',
  Database:   '#10b981',
  Cache:      '#8b5cf6',
  Search:     '#ec4899',
  Storage:    '#ef4444',
  CDN:        '#f59e0b',
  Video:      '#06b6d4',
  Network:    '#84cc16',
  Email:      '#f97316',
  Monitoring: '#a78bfa',
  Backup:     '#6b7280',
}

// ─── Vendure + Next.js ────────────────────────────────────────────────────────
// Architecture: Vercel (Next.js frontend + Vendure serverless API) + Supabase
// + Upstash Redis + Cloudflare R2/CDN.  No dedicated servers.
// Source range: $800–$2,500/mo (Perplexity research + client xlsx)
function calcVendure(year, growthFactor, activeUsers, concurrentUsers, tier, config) {
  // Vercel Pro/Enterprise: covers SSR, API routes, edge functions, auto-scaling.
  // Scales with concurrent function load. Research: $500–1,500 at 30k concurrent.
  const vercel = Math.round(
    tier.vercelBase + tier.vercelBase * 0.4 * (concurrentUsers / 30000)
  )

  // Supabase: Postgres + auth + realtime + read replicas.
  // Research: $150–400 for 236k users.
  const database = Math.round(tier.supabaseBase + activeUsers * 0.0006)

  // Upstash: serverless Redis for sessions & cart cache.
  // Research: $50–150/mo.
  const cache = Math.round(tier.upstashBase * Math.pow(1.06, year - 1))

  // Cloudflare R2 storage ($0.015/GB, no egress fees on CDN).
  const videoStorGB  = config.videoStorageGB * Math.pow(1.15, year - 1)
  const assetStorGB  = 50 * Math.pow(1.05, year - 1)
  const storage      = Math.round((videoStorGB + assetStorGB) * 0.015)
  // Cloudflare CDN egress is free — only pay for storage above.
  const cdn          = 0

  // Vimeo (shared service)
  const vimeo = VIMEO_TIERS[config.vimeoTier].cost

  // SendGrid: transactional email.
  const email = Math.round(40 + activeUsers * 0.00008)

  // Sentry + Datadog.  Research: $50–250/mo.
  const monitoring = Math.round(80 * tier.monitoringMultiplier * Math.pow(1.05, year - 1))

  const subtotal = vercel + database + cache + storage + vimeo + email + monitoring
  const backup   = Math.round(subtotal * 0.04)   // 4% for backups
  const total    = subtotal + backup

  return {
    total,
    serverless: true, // no dedicated servers
    services: [
      { key:'vercel',     name:'Frontend + API (serverless)', provider:'Vercel Pro/Enterprise', category:'Compute',    meta:`~${Math.round(concurrentUsers/1000)}k peak concurrent funcs`,  monthly: vercel    },
      { key:'database',   name:'PostgreSQL + Auth + Realtime', provider:'Supabase',              category:'Database',   meta:`Team plan · ${Math.round(activeUsers/1000)}k users`,           monthly: database  },
      { key:'cache',      name:'Serverless Redis',             provider:'Upstash',               category:'Cache',      meta:'Sessions · cart · rate-limiting',                              monthly: cache     },
      { key:'storage',    name:'Object Storage',               provider:'Cloudflare R2',         category:'Storage',    meta:`${Math.round(videoStorGB + assetStorGB)} GB · $0.015/GB`,      monthly: storage   },
      { key:'cdn',        name:'Global CDN (zero egress)',      provider:'Cloudflare',            category:'CDN',        meta:'Included in R2 — no per-GB fee',                               monthly: cdn, note:'free' },
      { key:'vimeo',      name:'Video Hosting',                 provider:'Vimeo',                 category:'Video',      meta:VIMEO_TIERS[config.vimeoTier].name,                             monthly: vimeo, fixed: true },
      { key:'email',      name:'Transactional Email',           provider:'SendGrid',              category:'Email',      meta:`~${formatNumber(Math.round(activeUsers * 0.12))} emails/mo`,  monthly: email     },
      { key:'monitoring', name:'Error Tracking & APM',          provider:'Sentry + Datadog',      category:'Monitoring', meta:'Fully managed, no hosts',                                      monthly: monitoring},
      { key:'backup',     name:'DB Backups & Point-in-Time',    provider:'Supabase (built-in)',    category:'Backup',     meta:'4% of infra — included in Supabase plans',                    monthly: backup    },
    ],
  }
}

// ─── Magento 2 + Hyvä ────────────────────────────────────────────────────────
// Architecture: ECS Fargate (m6i.large PHP-FPM) + Varnish + Aurora MySQL
// + ElastiCache + OpenSearch + S3 + CloudFront.
// Source range: $1,200–$3,500/mo (Perplexity research + client xlsx)
function calcMagento(year, growthFactor, activeUsers, concurrentUsers, tier, config) {
  // Varnish absorbs ~72% of traffic → PHP sees ~28%
  const effectiveConcurrent = Math.round(concurrentUsers * 0.28)
  const phpCount     = Math.ceil(effectiveConcurrent / tier.magentoUsersPerServer) + tier.haBuffer
  const varnishCount = Math.max(2, tier.haBuffer)

  // m6i.large ~$73/mo.  Research: 10–20 units = $600–1,500.
  const phpCompute = Math.round(phpCount    * tier.magentoServerCost)
  const varnish    = Math.round(varnishCount * 73)   // c5.large equivalent
  const compute    = phpCompute + varnish

  // Aurora MySQL Multi-AZ + read replicas.  Research: $300–800.
  const database = Math.round(tier.auroraBase + activeUsers * 0.0006)

  // ElastiCache Redis: sessions + FPC + cache (3 roles in Magento).
  const cache  = Math.round(150 * tier.redisMultiplier * Math.pow(1.06, year - 1))

  // OpenSearch: REQUIRED in Magento 2.4+.
  const search = Math.round(200 * tier.searchMultiplier + activeUsers * 0.00007)

  // S3 + CloudFront.  Research: $100–300.
  const videoStorGB = config.videoStorageGB * Math.pow(1.15, year - 1)
  const assetStorGB = 80 * Math.pow(1.05, year - 1)
  const storage     = Math.round((videoStorGB + assetStorGB) * 0.023)
  const cdnGB       = activeUsers * 0.015 * growthFactor
  const cdn         = Math.round(cdnGB * 0.065)

  // Vimeo (shared)
  const vimeo = VIMEO_TIERS[config.vimeoTier].cost

  // ALB: required for ECS Fargate.
  const lb = 50

  // Transactional email (SES).
  const email = Math.round(20 + activeUsers * 0.00008)

  // CloudWatch + Datadog.  Research: $50–200.
  const monitoring = Math.round(100 * tier.monitoringMultiplier * Math.pow(1.05, year - 1))

  const subtotal = compute + database + cache + search + storage + cdn + vimeo + lb + email + monitoring
  const backup   = Math.round(subtotal * 0.06)   // 6% — more infra to snapshot
  const total    = subtotal + backup

  return {
    total, phpCount, varnishCount,
    services: [
      { key:'php',        name:'PHP-FPM Web Servers',         provider:'AWS ECS Fargate',     category:'Compute',    meta:`${phpCount}× m6i.large`,                                        monthly: phpCompute },
      { key:'varnish',    name:'Varnish Full-Page Cache',      provider:'AWS ECS Fargate',     category:'Compute',    meta:`${varnishCount}× c5.large`,                                    monthly: varnish    },
      { key:'database',   name:'MySQL (Multi-AZ + replicas)',  provider:'AWS Aurora MySQL',    category:'Database',   meta:'db.r6g.xlarge cluster',                                        monthly: database   },
      { key:'cache',      name:'Redis (Session/Cache/FPC)',    provider:'AWS ElastiCache',     category:'Cache',      meta:'r6g.large cluster — 3 roles',                                  monthly: cache      },
      { key:'search',     name:'Elasticsearch (required)',     provider:'AWS OpenSearch',      category:'Search',     meta:'r6g.large.search · mandatory M2.4+',                           monthly: search     },
      { key:'storage',    name:'Object Storage',               provider:'AWS S3',              category:'Storage',    meta:`${Math.round(videoStorGB + assetStorGB)} GB`,                  monthly: storage    },
      { key:'cdn',        name:'CDN & Static Assets',          provider:'AWS CloudFront',      category:'CDN',        meta:`${Math.round(cdnGB)} GB/mo transferred`,                       monthly: cdn        },
      { key:'vimeo',      name:'Video Hosting',                provider:'Vimeo',               category:'Video',      meta:VIMEO_TIERS[config.vimeoTier].name,                             monthly: vimeo, fixed: true },
      { key:'lb',         name:'Load Balancer',                provider:'AWS ALB',             category:'Network',    meta:'Required for ECS Fargate',                                     monthly: lb         },
      { key:'email',      name:'Transactional Email',          provider:'AWS SES',             category:'Email',      meta:`~${formatNumber(Math.round(activeUsers * 0.12))} emails/mo`,  monthly: email      },
      { key:'monitoring', name:'Monitoring & Alerts',          provider:'CloudWatch + Datadog',category:'Monitoring', meta:`${phpCount + varnishCount} hosts`,                             monthly: monitoring },
      { key:'backup',     name:'Backups & Snapshots',          provider:'AWS Backup',          category:'Backup',     meta:'6% of infra — DB snapshots + S3',                             monthly: backup     },
    ],
  }
}

// ─── Public: 5-year projection for both stacks ───────────────────────────────
export function calculate5Years(config) {
  const tier = INFRA_TIERS[config.infrastructureTier]
  const years = []
  let cumVendure = 0, cumMagento = 0

  for (let y = 1; y <= 5; y++) {
    const gf              = Math.pow(1 + config.annualGrowthRate / 100, y - 1)
    const activeUsers     = Math.round(config.currentActiveUsers * gf)
    const concurrentUsers = Math.round(config.currentConcurrentUsers * gf)

    const vendure = calcVendure(y, gf, activeUsers, concurrentUsers, tier, config)
    const magento = calcMagento(y, gf, activeUsers, concurrentUsers, tier, config)

    cumVendure += vendure.total * 12
    cumMagento += magento.total * 12

    years.push({
      year: y, activeUsers, concurrentUsers,
      vendure: { ...vendure, annual: vendure.total * 12, cumulative: cumVendure },
      magento: { ...magento, annual: magento.total * 12, cumulative: cumMagento },
    })
  }
  return years
}

// ─── Formatters ──────────────────────────────────────────────────────────────
export const USD_TO_HUF = 370

export function formatCurrency(amount, currency) {
  if (currency === 'HUF') {
    return new Intl.NumberFormat('hu-HU', {
      style: 'currency', currency: 'HUF', maximumFractionDigits: 0,
    }).format(Math.round(amount * USD_TO_HUF))
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(n) {
  return new Intl.NumberFormat('hu-HU').format(n)
}
