import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { calculate5Years, formatCurrency, STACKS } from '../utils/costCalculator.js'

function Section({ title, children }) {
  return (
    <div className="opinion-section">
      <h3 className="opinion-section-title">{title}</h3>
      {children}
    </div>
  )
}

function Callout({ type, children }) {
  const styles = {
    warning: { border: '#f59e0b', bg: 'rgba(245,158,11,0.07)', icon: '⚠️' },
    danger:  { border: '#ef4444', bg: 'rgba(239,68,68,0.07)',  icon: '🚨' },
    info:    { border: '#3b82f6', bg: 'rgba(59,130,246,0.07)', icon: '💡' },
    success: { border: '#10b981', bg: 'rgba(16,185,129,0.07)', icon: '✅' },
  }
  const s = styles[type] || styles.info
  return (
    <div className="opinion-callout" style={{ borderColor: s.border, background: s.bg }}>
      <span className="callout-icon">{s.icon}</span>
      <div>{children}</div>
    </div>
  )
}

function ServiceNote({ service, provider, issue, verdict }) {
  const verdictColor = { ok: '#10b981', low: '#f59e0b', high: '#ef4444', risk: '#f97316' }
  const verdictLabel = { ok: 'Accurate', low: 'Underestimated', high: 'Overestimated', risk: 'Architectural risk' }
  return (
    <div className="service-note">
      <div className="service-note-header">
        <span className="service-note-name">{service}</span>
        <span className="service-note-provider">{provider}</span>
        <span className="service-note-verdict" style={{ color: verdictColor[verdict], background: `${verdictColor[verdict]}18` }}>
          {verdictLabel[verdict]}
        </span>
      </div>
      <p className="service-note-text">{issue}</p>
    </div>
  )
}

export default function OpinionTab() {
  const config = useSelector(s => s.calculator)
  const { currency } = config
  const years = calculate5Years(config)
  const y1 = years[0]
  const saving5yr = years[4].magento.cumulative - years[4].vendure.cumulative

  return (
    <div className="tab-content opinion-tab">

      <div className="opinion-header">
        <div className="opinion-header-title">Estimation Analysis & Technical Opinion</div>
        <div className="opinion-header-sub">
          An honest review of the hosting cost estimates — what's accurate, what's risky,
          and where the client could be misled.
        </div>
      </div>

      {/* ── TL;DR ── */}
      <Section title="TL;DR — Short Version">
        <Callout type="warning">
          <strong>The stated ranges ($800–$2,500 for Vendure, $1,200–$3,500 for Magento) are correct,
          but clients tend to anchor on the low end.</strong> At 118k active users and 15k concurrent peak,
          neither stack will realistically run in production at its lower bound. Expect Year 1 costs
          to land in the <strong>upper half</strong> of each range.
        </Callout>
        <div className="tldr-row">
          <div className="tldr-card" style={{ borderColor: STACKS.vendure.color }}>
            <div className="tldr-stack" style={{ color: STACKS.vendure.color }}>Vendure + Next.js</div>
            <div className="tldr-stated">Stated: $800–$2,500/mo</div>
            <div className="tldr-realistic">Realistic Year 1: {formatCurrency(y1.vendure.total, currency)}/mo</div>
            <div className="tldr-note">Upper half of range — Vimeo Enterprise alone is $400/mo</div>
          </div>
          <div className="tldr-card" style={{ borderColor: STACKS.magento.color }}>
            <div className="tldr-stack" style={{ color: STACKS.magento.color }}>Magento 2 + Hyvä</div>
            <div className="tldr-stated">Stated: $1,200–$3,500/mo</div>
            <div className="tldr-realistic">Realistic Year 1: {formatCurrency(y1.magento.total, currency)}/mo</div>
            <div className="tldr-note">Upper half of range — Aurora + OpenSearch + ElastiCache alone ~$650/mo</div>
          </div>
        </div>
      </Section>

      {/* ── Why the lower bounds are misleading ── */}
      <Section title="Why the Lower Bounds Are Misleading">
        <p className="opinion-p">
          The $800/mo (Vendure) and $1,200/mo (Magento) lower bounds assume a best-case scenario
          where every service runs at minimum usage, no redundancy is configured, and traffic
          stays perfectly flat. None of these hold true in production.
        </p>
        <p className="opinion-p">
          Consider the fixed costs that exist regardless of traffic: <strong>Vimeo Enterprise</strong> is
          $400/mo before a single server is provisioned. <strong>Aurora MySQL Multi-AZ</strong> starts
          at $300/mo. <strong>OpenSearch</strong> (mandatory for Magento 2.4+) starts at $200/mo.
          Those three line items alone total $900/mo for Magento — already above its stated lower bound.
        </p>
        <Callout type="danger">
          If the client budgets based on the lower bound, they will run out of money before the
          infrastructure is stable. <strong>The lower bounds should never be presented as a planning
          figure</strong> — only as a theoretical minimum under ideal conditions.
        </Callout>
      </Section>

      {/* ── Vendure architecture concern ── */}
      <Section title="Vendure Architecture — The Serverless Question">
        <p className="opinion-p">
          The calculator currently shows Vendure running fully serverless on Vercel (both Next.js
          frontend and the Vendure API). This is the cheapest architecture and it does technically
          exist via <code>@vendure/platform-serverless</code> — but it carries real production risks
          at this scale that should be disclosed to the client.
        </p>
        <Callout type="danger">
          <strong>Vendure's job queue requires persistent processes.</strong> Serverless functions
          spin up and down — they cannot run background jobs reliably. Vendure uses its job queue
          for order processing, email sending, stock updates, and scheduled tasks. A purely
          serverless deployment either breaks this or requires a separate always-on worker,
          which adds cost back.
        </Callout>
        <Callout type="warning">
          <strong>Database connection pooling breaks under serverless concurrency.</strong> At 15k
          concurrent users, each serverless function invocation opens a new database connection.
          PostgreSQL has a connection limit (~100 by default on most managed plans). Without
          PgBouncer or Supabase's built-in pooler, this causes connection exhaustion under load.
          It's solvable, but it's not "just deploy to Vercel."
        </Callout>
        <p className="opinion-p">
          The more honest and production-safe architecture for Vendure at this scale is:
        </p>
        <ul className="opinion-list">
          <li><strong>Next.js frontend → Vercel</strong> (this is correct and ideal)</li>
          <li><strong>Vendure API → ECS Fargate</strong> (persistent Node.js containers, not serverless)</li>
          <li><strong>PostgreSQL → Supabase or AWS RDS</strong> (both work)</li>
          <li><strong>Redis → Upstash or ElastiCache</strong> (both work)</li>
        </ul>
        <p className="opinion-p">
          This hybrid approach costs roughly $200–300/mo more than the pure-serverless model
          shown in the calculator, but it's what a senior architect would actually recommend
          for production e-commerce at 15k concurrent.
        </p>
      </Section>

      {/* ── Service-level review ── */}
      <Section title="Service-Level Review — Vendure Stack">
        <ServiceNote
          service="Vercel (Frontend + API)"
          provider="Vercel Pro/Enterprise"
          verdict="risk"
          issue="The $500–1,500 range is accurate for Vercel Enterprise, but the serverless architecture for the Vendure API backend has the limitations described above. Vercel is the right home for Next.js — the question is whether the Vendure API should also live there."
        />
        <ServiceNote
          service="PostgreSQL"
          provider="Supabase"
          verdict="low"
          issue="Supabase Pro charges $25/mo base + $0.00325 per MAU over 50k. At 118k users that's already ~$246/mo before adding compute upgrades, read replicas, or the Team plan ($599/mo flat). The $150–400 range is achievable but tight at the lower end."
        />
        <ServiceNote
          service="Redis"
          provider="Upstash"
          verdict="ok"
          issue="Upstash is genuinely a good fit for this architecture and the $50–150 range is realistic. At 15k concurrent users with moderate Redis usage (sessions, cart, rate-limiting), expect $80–130/mo. Scales predictably."
        />
        <ServiceNote
          service="CDN & Storage"
          provider="Cloudflare R2"
          verdict="ok"
          issue="Cloudflare R2 is excellent here — $0.015/GB storage with zero egress fees vs CloudFront's $0.065/GB transfer. For a video-heavy site where the actual video goes through Vimeo, R2 handles product images and assets cheaply. This is a smart choice."
        />
        <ServiceNote
          service="Video Hosting"
          provider="Vimeo Enterprise"
          verdict="ok"
          issue="At 118k users with a training video library, Enterprise is the right tier. $400/mo is a fixed cost that doesn't scale with your user growth — it's the same price whether 1,000 or 15,000 users are streaming. Good value at this scale."
        />
      </Section>

      {/* ── Magento service review ── */}
      <Section title="Service-Level Review — Magento Stack">
        <ServiceNote
          service="PHP Web Servers"
          provider="AWS ECS Fargate (m6i.large)"
          verdict="ok"
          issue="The research-backed 10–20× m6i.large ($600–1,500) is accurate. With Varnish absorbing ~72% of traffic, PHP servers see ~4,200 effective concurrent requests. At 500 concurrent PHP workers per m6i.large, you need ~10–12 instances at current scale. This math checks out."
        />
        <ServiceNote
          service="MySQL Database"
          provider="AWS Aurora MySQL"
          verdict="ok"
          issue="Aurora is the right upgrade from standard RDS for Magento at this scale. Multi-AZ failover, read replicas for reporting queries, and auto-scaling storage. The $300–800 range is accurate — expect to land around $370/mo at Year 1 with one read replica."
        />
        <ServiceNote
          service="Elasticsearch"
          provider="AWS OpenSearch"
          verdict="low"
          issue="OpenSearch is non-negotiable for Magento 2.4+ — it's not optional. The $200/mo base estimate is realistic for an r6g.large.search instance. However, as the product catalog grows, this scales up. With 5TB of training videos and product data, expect $250–350/mo by Year 3."
        />
        <ServiceNote
          service="Redis"
          provider="AWS ElastiCache"
          verdict="ok"
          issue="Magento uses Redis for three separate roles: session storage, full-page cache (FPC), and object cache. You ideally run two separate Redis instances to avoid eviction conflicts. $150–200/mo for ElastiCache is accurate — don't try to combine all three roles on one small instance."
        />
      </Section>

      {/* ── 5-year outlook ── */}
      <Section title="5-Year Outlook — What the Numbers Don't Show">
        <p className="opinion-p">
          The calculator projects hosting costs growing with user count, but there are cost
          factors it cannot model that will affect the real total:
        </p>
        <ul className="opinion-list">
          <li>
            <strong>Magento upgrade costs:</strong> Magento releases major versions requiring paid developer
            work to upgrade (typically 2–4 weeks of agency time every 18 months). This is a hidden
            "hosting-adjacent" cost that doesn't appear in infrastructure bills.
          </li>
          <li>
            <strong>Vendure custom development:</strong> Vendure's smaller plugin ecosystem means features
            Magento has out-of-the-box (subscriptions, advanced promotions, multi-warehouse) require
            custom builds. Higher upfront cost, but lower ongoing hosting.
          </li>
          <li>
            <strong>Vimeo contract renegotiation:</strong> At projected Year 5 scale (~{Math.round(118000 * Math.pow(1.2, 4) / 1000)}k
            users), Vimeo Enterprise pricing will likely need renegotiation. Build in 20–30% price
            growth for Vimeo by Year 4–5.
          </li>
          <li>
            <strong>AWS price decreases:</strong> AWS typically reduces prices 1–3% annually on compute.
            Over 5 years this partially offsets growth. The calculator doesn't model this — so
            real Magento costs may be 5–8% lower than projected.
          </li>
        </ul>
        <Callout type="info">
          Over 5 years, the calculator shows Vendure saving {formatCurrency(saving5yr, currency)} vs Magento
          in pure hosting costs. But factor in Vendure's higher upfront development cost (estimated
          ~25% more in the client's own documents) and the break-even point is likely around Year 2–3.
          Beyond that, Vendure is clearly the cheaper option.
        </Callout>
      </Section>

      {/* ── Final recommendation ── */}
      <Section title="Final Recommendation">
        <Callout type="success">
          <strong>The ranges are correct. Present them as ranges, not single numbers.</strong> When
          discussing with the client, anchor the conversation around the midpoint of each range:
          ~$1,500/mo for Vendure and ~$2,200/mo for Magento in Year 1. These are defensible,
          realistic, and won't cause surprises.
        </Callout>
        <p className="opinion-p">
          If the client pushes back on costs, the most honest thing to say is:
          <em> "The lower end is possible in theory, but we'd be cutting redundancy and reliability
          to get there. For a production platform with 118k active users, that's a risk we wouldn't
          recommend."</em>
        </p>
        <p className="opinion-p">
          The choice between Vendure and Magento ultimately comes down to development philosophy,
          not hosting cost — the hosting difference ({formatCurrency(y1.magento.total - y1.vendure.total, currency)}/mo
          at Year 1) is real but not the deciding factor for a business at this scale.
          The bigger question is which stack the development team can move fastest on
          and maintain most reliably over 5 years.
        </p>
      </Section>

    </div>
  )
}
