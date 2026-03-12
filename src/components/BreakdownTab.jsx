import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import {
  calculate5Years, formatCurrency, formatNumber,
  COST_CATEGORIES,
} from '../utils/costCalculator.js'

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + p.value, 0)
  return (
    <div className="chart-tooltip">
      <p className="tooltip-title">Year {label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value, currency)}
        </p>
      ))}
      <p className="tooltip-total">Total: {formatCurrency(total, currency)}</p>
    </div>
  )
}

export default function BreakdownTab() {
  const config = useSelector(s => s.calculator)
  const { currency } = config
  const years = calculate5Years(config)
  const [selectedYear, setSelectedYear] = useState(1)

  const chartData = years.map(y => ({
    year: y.year,
    ...Object.fromEntries(COST_CATEGORIES.map(c => [c.label, y.monthly[c.key]])),
  }))

  const yearData = years[selectedYear - 1]
  const sortedCategories = [...COST_CATEGORIES].sort(
    (a, b) => yearData.monthly[b.key] - yearData.monthly[a.key]
  )

  return (
    <div className="tab-content">
      <div className="chart-card">
        <h3>Monthly Cost by Category — All Years</h3>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis
              dataKey="year"
              tickFormatter={v => `Year ${v}`}
              tick={{ fill: '#9ca3af', fontSize: 12 }}
            />
            <YAxis
              tickFormatter={v => formatCurrency(v, currency)}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              width={90}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            <Legend wrapperStyle={{ color: '#d1d5db', fontSize: 12 }} />
            {COST_CATEGORIES.map(cat => (
              <Bar key={cat.key} dataKey={cat.label} stackId="a" fill={cat.color} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="year-detail-section">
        <div className="year-selector">
          {years.map(y => (
            <button
              key={y.year}
              className={`year-btn ${selectedYear === y.year ? 'active' : ''}`}
              onClick={() => setSelectedYear(y.year)}
            >
              Year {y.year}
            </button>
          ))}
        </div>

        <div className="breakdown-table-wrapper">
          <table className="breakdown-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Monthly</th>
                <th>Annual</th>
                <th>% of Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortedCategories.map(cat => {
                const monthly = yearData.monthly[cat.key]
                const annual = monthly * 12
                const pct = ((monthly / yearData.monthly.total) * 100).toFixed(1)
                return (
                  <tr key={cat.key}>
                    <td>
                      <span className="cat-dot" style={{ background: cat.color }} />
                      {cat.label}
                    </td>
                    <td>{formatCurrency(monthly, currency)}</td>
                    <td>{formatCurrency(annual, currency)}</td>
                    <td>{pct}%</td>
                    <td>
                      <div className="pct-bar">
                        <div
                          className="pct-fill"
                          style={{ width: `${pct}%`, background: cat.color }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
              <tr className="table-total">
                <td>Total</td>
                <td>{formatCurrency(yearData.monthly.total, currency)}</td>
                <td>{formatCurrency(yearData.annual, currency)}</td>
                <td>100%</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="infra-info">
          <div className="infra-stat">
            <span>Active Users</span>
            <strong>{formatNumber(yearData.activeUsers)}</strong>
          </div>
          <div className="infra-stat">
            <span>Concurrent Users</span>
            <strong>{formatNumber(yearData.concurrentUsers)}</strong>
          </div>
          <div className="infra-stat">
            <span>App Servers</span>
            <strong>{yearData.serverCount}</strong>
          </div>
        </div>
      </div>
    </div>
  )
}
