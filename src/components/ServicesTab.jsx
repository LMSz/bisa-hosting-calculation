import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { calculate5Years, formatCurrency, formatNumber, STACKS, CATEGORIES } from '../utils/costCalculator.js'

const ChartTip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="tooltip-title">{label}</p>
      {payload.map(p => <p key={p.name} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value, currency)}</p>)}
    </div>
  )
}

// Determine ownership for a key
function ownership(key, vendureMap, magentoMap) {
  const inV = !!vendureMap[key]
  const inM = !!magentoMap[key]
  if (inV && !inM) return 'vendure'
  if (inM && !inV) return 'magento'
  return 'both'
}

const OWNER_META = {
  vendure: { label: 'Vendure / Next.js', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)', border: '#3b82f6', rowBg: 'rgba(59,130,246,0.04)' },
  magento: { label: 'Magento 2 / Hyvä',  color: '#f97316', bg: 'rgba(249,115,22,0.10)',  border: '#f97316', rowBg: 'rgba(249,115,22,0.04)'  },
  both:    { label: 'Both stacks',        color: '#8892a4', bg: 'rgba(136,146,164,0.10)', border: '#252d3d', rowBg: 'transparent'             },
}

function SectionDivider({ owner }) {
  const m = OWNER_META[owner]
  const icons = { vendure: '🔷', magento: '🟧', both: '⬜' }
  return (
    <tr className="section-divider-row">
      <td colSpan={7}>
        <span className="section-divider-pill" style={{ background: m.bg, color: m.color, borderColor: m.border }}>
          {icons[owner]} {m.label}
        </span>
      </td>
    </tr>
  )
}

function ServiceRow({ sV, sM, owner, currency }) {
  const base = sV || sM
  const costV = sV?.monthly ?? null
  const costM = sM?.monthly ?? null
  const diff = costV !== null && costM !== null ? costM - costV : null
  const diffPct = diff !== null && costV > 0 ? Math.round((diff / costV) * 100) : null
  const m = OWNER_META[owner]

  return (
    <tr className={`svc-row svc-row--${owner}`} style={{ '--row-border': m.border, '--row-bg': m.rowBg }}>
      <td className="svc-owner-stripe" style={{ background: m.border }} />
      <td className="svc-name-cell">
        <span className="cat-dot" style={{ background: CATEGORIES[base.category] ?? '#666' }} />
        <span className="svc-name">{base.name}</span>
        {base.fixed && <span className="badge-shared">shared</span>}
      </td>
      <td>
        <span className="provider-pill">
          {owner === 'both' && sV?.provider !== sM?.provider
            ? <>{sV?.provider} <span className="provider-sep">/</span> {sM?.provider}</>
            : (base.provider ?? sV?.provider ?? sM?.provider)
          }
        </span>
      </td>
      <td>
        <span className="cat-label" style={{ background: `${CATEGORIES[base.category]}22`, color: CATEGORIES[base.category] }}>
          {base.category}
        </span>
      </td>
      <td className="cost-cell vendure-col">
        {costV !== null
          ? <>{formatCurrency(costV, currency)}{sV?.meta && <span className="svc-meta">{sV.meta}</span>}</>
          : <span className="na">—</span>}
      </td>
      <td className="cost-cell magento-col">
        {costM !== null
          ? <>{formatCurrency(costM, currency)}{sM?.meta && <span className="svc-meta">{sM.meta}</span>}</>
          : <span className="na">—</span>}
      </td>
      <td>
        {diff !== null && diff !== 0 && (
          <span className={`diff-badge ${diff > 0 ? 'more' : 'less'}`}>
            {diff > 0 ? '+' : ''}{formatCurrency(diff, currency)}
            {diffPct !== null && <span className="diff-pct"> ({diffPct > 0 ? '+' : ''}{diffPct}%)</span>}
          </span>
        )}
        {diff === 0    && <span className="diff-badge same">same</span>}
        {diff === null && owner !== 'both' && (
          <span className="diff-badge exclusive" style={{ color: m.color, background: m.bg }}>
            {owner === 'vendure' ? 'Vendure only' : 'Magento only'}
          </span>
        )}
      </td>
    </tr>
  )
}

export default function ServicesTab() {
  const config = useSelector(s => s.calculator)
  const { currency } = config
  const [selectedYear, setSelectedYear] = useState(1)
  const years = calculate5Years(config)
  const yearData = years[selectedYear - 1]

  const allKeys = [...new Set([
    ...yearData.vendure.services.map(s => s.key),
    ...yearData.magento.services.map(s => s.key),
  ])]

  const vendureMap = Object.fromEntries(yearData.vendure.services.map(s => [s.key, s]))
  const magentoMap = Object.fromEntries(yearData.magento.services.map(s => [s.key, s]))

  const vendureOnly = allKeys.filter(k => ownership(k, vendureMap, magentoMap) === 'vendure')
  const magentoOnly = allKeys.filter(k => ownership(k, vendureMap, magentoMap) === 'magento')
  const bothKeys    = allKeys.filter(k => ownership(k, vendureMap, magentoMap) === 'both')

  const catData = [...new Set([
    ...yearData.vendure.services.map(s => s.category),
    ...yearData.magento.services.map(s => s.category),
  ])].map(cat => ({
    cat,
    [STACKS.vendure.shortName]: yearData.vendure.services.filter(s => s.category === cat).reduce((a, s) => a + s.monthly, 0),
    [STACKS.magento.shortName]: yearData.magento.services.filter(s => s.category === cat).reduce((a, s) => a + s.monthly, 0),
  })).filter(d => d[STACKS.vendure.shortName] + d[STACKS.magento.shortName] > 0)

  // Legend items for the ownership types
  const legend = [
    { owner: 'vendure', label: 'Vendure + Next.js exclusive' },
    { owner: 'magento', label: 'Magento 2 + Hyvä exclusive' },
    { owner: 'both',    label: 'Present in both stacks' },
  ]

  return (
    <div className="tab-content">
      <div className="year-selector-row">
        <span className="section-label" style={{ margin: 0 }}>Select year</span>
        <div className="year-selector">
          {years.map(y => (
            <button key={y.year}
              className={`year-btn ${selectedYear === y.year ? 'active' : ''}`}
              onClick={() => setSelectedYear(y.year)}>
              Year {y.year}
              <span className="year-btn-sub">{formatNumber(y.activeUsers)} users</span>
            </button>
          ))}
        </div>
        <div className="ownership-legend">
          {legend.map(l => (
            <span key={l.owner} className="legend-item">
              <span className="legend-stripe" style={{ background: OWNER_META[l.owner].border }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <div className="chart-card">
        <h3>Monthly Cost by Category — Year {selectedYear}</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={catData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
            <XAxis type="number" tickFormatter={v => formatCurrency(v, currency)} tick={{ fill: '#9ca3af', fontSize: 11 }} />
            <YAxis type="category" dataKey="cat" tick={{ fill: '#9ca3af', fontSize: 12 }} width={90} />
            <Tooltip content={<ChartTip currency={currency} />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
            <Legend wrapperStyle={{ color: '#d1d5db' }} />
            <Bar dataKey={STACKS.vendure.shortName} fill="#3b82f6" radius={[0,4,4,0]} />
            <Bar dataKey={STACKS.magento.shortName} fill="#f97316" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="services-table-card">
        <div className="svc-table-header">
          <h3>Service-Level Breakdown — Year {selectedYear}</h3>
          <div className="svc-totals">
            <span style={{ color: STACKS.vendure.color }}>
              {STACKS.vendure.shortName}: <strong>{formatCurrency(yearData.vendure.total, currency)}/mo</strong>
            </span>
            <span style={{ color: STACKS.magento.color }}>
              {STACKS.magento.shortName}: <strong>{formatCurrency(yearData.magento.total, currency)}/mo</strong>
            </span>
          </div>
        </div>
        <div className="table-scroll">
          <table className="breakdown-table services-table">
            <thead>
              <tr>
                <th style={{ width: 4, padding: 0 }} />
                <th>Service</th>
                <th>Provider</th>
                <th>Category</th>
                <th className="vendure-col">{STACKS.vendure.name}</th>
                <th className="magento-col">{STACKS.magento.name}</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              {vendureOnly.length > 0 && (
                <>
                  <SectionDivider owner="vendure" />
                  {vendureOnly.map(k => (
                    <ServiceRow key={k} sV={vendureMap[k]} sM={magentoMap[k]} owner="vendure" currency={currency} />
                  ))}
                </>
              )}
              {magentoOnly.length > 0 && (
                <>
                  <SectionDivider owner="magento" />
                  {magentoOnly.map(k => (
                    <ServiceRow key={k} sV={vendureMap[k]} sM={magentoMap[k]} owner="magento" currency={currency} />
                  ))}
                </>
              )}
              {bothKeys.length > 0 && (
                <>
                  <SectionDivider owner="both" />
                  {bothKeys.map(k => (
                    <ServiceRow key={k} sV={vendureMap[k]} sM={magentoMap[k]} owner="both" currency={currency} />
                  ))}
                </>
              )}

              <tr className="table-total">
                <td />
                <td colSpan={3}><strong>Total Monthly</strong></td>
                <td className="cost-cell vendure-col"><strong>{formatCurrency(yearData.vendure.total, currency)}</strong></td>
                <td className="cost-cell magento-col"><strong>{formatCurrency(yearData.magento.total, currency)}</strong></td>
                <td>
                  <span className="diff-badge more">
                    +{formatCurrency(yearData.magento.total - yearData.vendure.total, currency)}
                    {' '}(+{Math.round((yearData.magento.total / yearData.vendure.total - 1) * 100)}%)
                  </span>
                </td>
              </tr>
              <tr className="table-total">
                <td />
                <td colSpan={3}><strong>Total Annual</strong></td>
                <td className="cost-cell vendure-col"><strong>{formatCurrency(yearData.vendure.annual, currency)}</strong></td>
                <td className="cost-cell magento-col"><strong>{formatCurrency(yearData.magento.annual, currency)}</strong></td>
                <td>
                  <span className="diff-badge more">
                    +{formatCurrency(yearData.magento.annual - yearData.vendure.annual, currency)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
