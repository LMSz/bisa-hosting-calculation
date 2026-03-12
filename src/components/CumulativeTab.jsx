import React from 'react'
import { useSelector } from 'react-redux'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
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

export default function CumulativeTab() {
  const config = useSelector(s => s.calculator)
  const { currency } = config
  const years = calculate5Years(config)

  const saving5yr = years[4].magento.cumulative - years[4].vendure.cumulative
  const avgMonthlySaving = Math.round(saving5yr / 60)

  const cumulativeData = years.map(y => ({
    year: y.year,
    [`${STACKS.vendure.name} (cumulative)`]: y.vendure.cumulative,
    [`${STACKS.magento.name} (cumulative)`]: y.magento.cumulative,
  }))

  const annualData = years.map(y => ({
    year: y.year,
    [STACKS.vendure.name]: y.vendure.annual,
    [STACKS.magento.name]: y.magento.annual,
    'Annual Saving': y.magento.annual - y.vendure.annual,
  }))

  return (
    <div className="tab-content">

      <div className="savings-banner banner-big">
        <div>
          <div className="savings-headline">
            Choosing Vendure saves <strong>{formatCurrency(saving5yr, currency)}</strong> over 5 years
          </div>
          <div className="savings-detail">
            ~{formatCurrency(avgMonthlySaving, currency)}/month on average &nbsp;·&nbsp;
            {Math.round((saving5yr / years[4].magento.cumulative) * 100)}% total cost reduction
          </div>
        </div>
      </div>

      <div className="cum-summary-row">
        {['vendure','magento'].map(sid => {
          const s = STACKS[sid]
          const d = years[4][sid]
          return (
            <div key={sid} className="cum-stat-card" style={{ '--stack-color': s.color }}>
              <div className="cum-stack-name" style={{ color: s.color }}>{s.name}</div>
              <div className="cum-total">{formatCurrency(d.cumulative, currency)}</div>
              <div className="cum-sub">5-year total</div>
              <div className="cum-breakdown-mini">
                {years.map(y => (
                  <div key={y.year} className="cum-mini-row">
                    <span>Year {y.year}</span>
                    <span>{formatCurrency(y[sid].annual, currency)}/yr</span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        <div className="cum-stat-card diff-stat-card">
          <div className="cum-stack-name" style={{ color: '#10b981' }}>Vendure Savings</div>
          <div className="cum-total" style={{ color: '#10b981' }}>{formatCurrency(saving5yr, currency)}</div>
          <div className="cum-sub">vs Magento over 5 years</div>
          <div className="cum-breakdown-mini">
            {years.map(y => {
              const saving = y.magento.annual - y.vendure.annual
              return (
                <div key={y.year} className="cum-mini-row">
                  <span>Year {y.year}</span>
                  <span style={{ color: '#10b981' }}>+{formatCurrency(saving, currency)}/yr</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="chart-card">
        <h3>Cumulative Investment — Vendure vs Magento</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={cumulativeData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
            <defs>
              <linearGradient id="gcV" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gcM" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="year" tickFormatter={v => `Year ${v}`} tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis tickFormatter={v => formatCurrency(v, currency)} tick={{ fill: '#9ca3af', fontSize: 11 }} width={110} />
            <Tooltip content={<ChartTip currency={currency} />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
            <Legend wrapperStyle={{ color: '#d1d5db' }} />
            <Area type="monotone" dataKey={`${STACKS.vendure.name} (cumulative)`} stroke="#3b82f6" fill="url(#gcV)" strokeWidth={2.5} dot={{ r: 5, fill: '#3b82f6' }} />
            <Area type="monotone" dataKey={`${STACKS.magento.name} (cumulative)`} stroke="#f97316" fill="url(#gcM)" strokeWidth={2.5} dot={{ r: 5, fill: '#f97316' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-card">
        <h3>Annual Cost + Yearly Saving</h3>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={annualData} margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
            <defs>
              <linearGradient id="gSaving" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="year" tickFormatter={v => `Year ${v}`} tick={{ fill: '#9ca3af', fontSize: 12 }} />
            <YAxis tickFormatter={v => formatCurrency(v, currency)} tick={{ fill: '#9ca3af', fontSize: 11 }} width={110} />
            <Tooltip content={<ChartTip currency={currency} />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
            <Legend wrapperStyle={{ color: '#d1d5db' }} />
            <Area type="monotone" dataKey={STACKS.vendure.name}  stroke="#3b82f6" fill="none" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 4, fill:'#3b82f6' }} />
            <Area type="monotone" dataKey={STACKS.magento.name}  stroke="#f97316" fill="none" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 4, fill:'#f97316' }} />
            <Area type="monotone" dataKey="Annual Saving"        stroke="#10b981" fill="url(#gSaving)" strokeWidth={2} dot={{ r: 4, fill:'#10b981' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary table */}
      <div className="cum-table-card">
        <h3>Year-by-Year Summary</h3>
        <div className="table-scroll">
          <table className="breakdown-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Users</th>
                <th className="vendure-col">Vendure/mo</th>
                <th className="vendure-col">Vendure/yr</th>
                <th className="magento-col">Magento/mo</th>
                <th className="magento-col">Magento/yr</th>
                <th style={{ color:'#10b981' }}>Annual Saving</th>
                <th>Vendure Cum.</th>
                <th>Magento Cum.</th>
              </tr>
            </thead>
            <tbody>
              {years.map(y => (
                <tr key={y.year}>
                  <td><strong>Year {y.year}</strong></td>
                  <td>{formatNumber(y.activeUsers)}</td>
                  <td className="vendure-col">{formatCurrency(y.vendure.total, currency)}</td>
                  <td className="vendure-col">{formatCurrency(y.vendure.annual, currency)}</td>
                  <td className="magento-col">{formatCurrency(y.magento.total, currency)}</td>
                  <td className="magento-col">{formatCurrency(y.magento.annual, currency)}</td>
                  <td><span className="yoy" style={{ color:'#10b981', background:'rgba(16,185,129,0.1)' }}>+{formatCurrency(y.magento.annual - y.vendure.annual, currency)}</span></td>
                  <td>{formatCurrency(y.vendure.cumulative, currency)}</td>
                  <td>{formatCurrency(y.magento.cumulative, currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
