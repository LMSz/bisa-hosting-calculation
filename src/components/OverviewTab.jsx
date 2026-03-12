import React from 'react'
import { useSelector } from 'react-redux'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar,
} from 'recharts'
import { calculate5Years, formatCurrency, formatNumber, STACKS } from '../utils/costCalculator.js'

const ChartTip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="tooltip-title">Year {label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value, currency)}</p>)}
    </div>
  )
}

function StackCard({ stackId, yearData, currency }) {
  const stack = STACKS[stackId]
  const d = yearData[stackId]
  return (
    <div className="stack-overview-card" style={{ '--stack-color': stack.color, '--stack-bg': stack.bgColor }}>
      <div className="soc-header">
        <div>
          <div className="soc-name">{stack.name}</div>
          <div className="soc-tagline">{stack.tagline}</div>
        </div>
        <div className="soc-badge" style={{ background: stack.color }}>{stack.shortName}</div>
      </div>
      <div className="soc-cost">{formatCurrency(d.total, currency)}<span>/mo</span></div>
      <div className="soc-annual">{formatCurrency(d.annual, currency)} / year</div>
      <div className="soc-stats">
        <span>{stackId === 'vendure' ? 'Serverless — no dedicated nodes' : `${d.phpCount} PHP + ${d.varnishCount} Varnish (m6i.large)`}</span>
      </div>
    </div>
  )
}

export default function OverviewTab() {
  const config = useSelector(s => s.calculator)
  const { currency } = config
  const years = calculate5Years(config)

  const y1 = years[0]
  const y5 = years[4]
  const saving5yr = y5.magento.cumulative - y5.vendure.cumulative
  const savingPct = Math.round((saving5yr / y5.magento.cumulative) * 100)

  const trendData = years.map(y => ({
    year: y.year,
    [STACKS.vendure.name]: y.vendure.total,
    [STACKS.magento.name]: y.magento.total,
  }))

  const annualData = years.map(y => ({
    year: y.year,
    [STACKS.vendure.name]: y.vendure.annual,
    [STACKS.magento.name]: y.magento.annual,
  }))

  return (
    <div className="tab-content">

      {/* Savings callout */}
      <div className="savings-banner">
        <div className="savings-icon">💡</div>
        <div>
          <strong>Vendure + Next.js saves {formatCurrency(saving5yr, currency)}</strong> over 5 years compared to Magento 2 + Hyvä
          <span className="savings-pct"> — {savingPct}% lower total cost</span>
        </div>
      </div>

      {/* Year 1 side-by-side */}
      <div className="section-label">Year 1 — Current Scale ({formatNumber(y1.activeUsers)} active users)</div>
      <div className="stack-compare-row">
        <StackCard stackId="vendure" yearData={y1} currency={currency} />
        <div className="vs-divider">VS</div>
        <StackCard stackId="magento" yearData={y1} currency={currency} />
        <div className="diff-card">
          <div className="diff-label">Monthly difference</div>
          <div className="diff-value">+{formatCurrency(y1.magento.total - y1.vendure.total, currency)}</div>
          <div className="diff-sub">Magento costs {Math.round((y1.magento.total / y1.vendure.total - 1) * 100)}% more</div>
        </div>
      </div>

      {/* Year 5 side-by-side */}
      <div className="section-label">Year 5 — Projected Scale ({formatNumber(y5.activeUsers)} active users)</div>
      <div className="stack-compare-row">
        <StackCard stackId="vendure" yearData={y5} currency={currency} />
        <div className="vs-divider">VS</div>
        <StackCard stackId="magento" yearData={y5} currency={currency} />
        <div className="diff-card">
          <div className="diff-label">Monthly difference</div>
          <div className="diff-value">+{formatCurrency(y5.magento.total - y5.vendure.total, currency)}</div>
          <div className="diff-sub">Magento costs {Math.round((y5.magento.total / y5.vendure.total - 1) * 100)}% more</div>
        </div>
      </div>

      {/* Monthly trend chart */}
      <div className="chart-card">
        <h3>Monthly Cost Trend — Vendure vs Magento</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={trendData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
            <defs>
              <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gM" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f97316" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="year" tickFormatter={v => `Year ${v}`} tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis tickFormatter={v => formatCurrency(v, currency)} tick={{ fill: '#9ca3af', fontSize: 11 }} width={100} />
            <Tooltip content={<ChartTip currency={currency} />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
            <Legend wrapperStyle={{ color: '#d1d5db' }} />
            <Area type="monotone" dataKey={STACKS.vendure.name} stroke="#3b82f6" fill="url(#gV)" strokeWidth={2} />
            <Area type="monotone" dataKey={STACKS.magento.name} stroke="#f97316" fill="url(#gM)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Annual bar chart */}
      <div className="chart-card">
        <h3>Annual Cost Comparison</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={annualData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="year" tickFormatter={v => `Year ${v}`} tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis tickFormatter={v => formatCurrency(v, currency)} tick={{ fill: '#9ca3af', fontSize: 11 }} width={100} />
            <Tooltip content={<ChartTip currency={currency} />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
            <Legend wrapperStyle={{ color: '#d1d5db' }} />
            <Bar dataKey={STACKS.vendure.name} fill="#3b82f6" radius={[4,4,0,0]} />
            <Bar dataKey={STACKS.magento.name} fill="#f97316" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pros/cons */}
      <div className="pros-cons-row">
        {['vendure','magento'].map(sid => {
          const s = STACKS[sid]
          return (
            <div key={sid} className="pros-cons-card" style={{ '--stack-color': s.color }}>
              <div className="pc-title" style={{ color: s.color }}>{s.name}</div>
              <div className="pc-cols">
                <div>
                  <div className="pc-header">Advantages</div>
                  {s.pros.map(p => <div key={p} className="pc-item pro">✓ {p}</div>)}
                </div>
                <div>
                  <div className="pc-header">Considerations</div>
                  {s.cons.map(c => <div key={c} className="pc-item con">• {c}</div>)}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
