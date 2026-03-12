import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setCurrentActiveUsers, setCurrentConcurrentUsers, setAnnualGrowthRate,
  setVideoStorageGB, setMonthlyVideoBandwidthTB, setInfrastructureTier,
  setVimeoTier, setCurrency, resetToDefaults,
} from '../store/calculatorSlice.js'
import { INFRA_TIERS, VIMEO_TIERS, formatNumber } from '../utils/costCalculator.js'

function SliderField({ label, hint, value, min, max, step, onChange, format }) {
  return (
    <div className="config-field">
      <div className="config-field-header">
        <label>{label}</label>
        <span className="config-value">{format ? format(value) : value}</span>
      </div>
      {hint && <p className="config-hint">{hint}</p>}
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))} className="slider" />
      <div className="slider-bounds">
        <span>{format ? format(min) : min}</span>
        <span>{format ? format(max) : max}</span>
      </div>
    </div>
  )
}

export default function ConfigPanel() {
  const dispatch = useDispatch()
  const config = useSelector(s => s.calculator)

  return (
    <aside className="config-panel">
      <div className="config-panel-header">
        <h2>Configuration</h2>
        <button className="btn-reset" onClick={() => dispatch(resetToDefaults())}>Reset</button>
      </div>

      <section className="config-section">
        <h3>Current Traffic</h3>
        <SliderField label="Active Users" hint="Total registered / active users"
          value={config.currentActiveUsers} min={10000} max={500000} step={5000}
          onChange={v => dispatch(setCurrentActiveUsers(v))} format={formatNumber} />
        <SliderField label="Peak Concurrent Users" hint="Online simultaneously at peak"
          value={config.currentConcurrentUsers} min={1000} max={100000} step={500}
          onChange={v => dispatch(setCurrentConcurrentUsers(v))} format={formatNumber} />
      </section>

      <section className="config-section">
        <h3>Growth Projection</h3>
        <SliderField label="Annual Growth Rate" hint="Expected YoY user growth"
          value={config.annualGrowthRate} min={0} max={100} step={1}
          onChange={v => dispatch(setAnnualGrowthRate(v))} format={v => `${v}%`} />
      </section>

      <section className="config-section">
        <h3>Content & Media</h3>
        <SliderField label="Video Library Size" hint="Total training video storage"
          value={config.videoStorageGB} min={50} max={5000} step={50}
          onChange={v => dispatch(setVideoStorageGB(v))}
          format={v => v >= 1024 ? `${(v/1024).toFixed(1)} TB` : `${v} GB`} />
        <SliderField label="Monthly Video Bandwidth" hint="Video data streamed per month"
          value={config.monthlyVideoBandwidthTB} min={0.5} max={50} step={0.5}
          onChange={v => dispatch(setMonthlyVideoBandwidthTB(v))} format={v => `${v} TB/mo`} />
      </section>

      <section className="config-section">
        <h3>Vimeo Plan</h3>
        <div className="tier-grid">
          {Object.entries(VIMEO_TIERS).map(([key, t]) => (
            <button key={key}
              className={`tier-btn ${config.vimeoTier === key ? 'active' : ''}`}
              style={{ '--tier-color': '#06b6d4' }}
              onClick={() => dispatch(setVimeoTier(key))}>
              <div className="tier-row">
                <span className="tier-name" style={{ color: '#06b6d4' }}>{t.name}</span>
                <span className="tier-price">${t.cost}/mo</span>
              </div>
              <span className="tier-desc">{t.description}</span>
            </button>
          ))}
        </div>
        {config.monthlyVideoBandwidthTB > 7 && config.vimeoTier !== 'enterprise' && (
          <p className="config-warn">⚠ {config.monthlyVideoBandwidthTB} TB/mo exceeds Vimeo Advanced — Enterprise recommended</p>
        )}
      </section>

      <section className="config-section">
        <h3>Infrastructure Tier</h3>
        <div className="tier-grid">
          {Object.entries(INFRA_TIERS).map(([key, t]) => (
            <button key={key}
              className={`tier-btn ${config.infrastructureTier === key ? 'active' : ''}`}
              style={{ '--tier-color': t.color }}
              onClick={() => dispatch(setInfrastructureTier(key))}>
              <span className="tier-name" style={{ color: t.color }}>{t.name}</span>
              <span className="tier-desc">{t.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="config-section">
        <h3>Currency</h3>
        <div className="currency-toggle">
          {['HUF', 'USD'].map(c => (
            <button key={c} className={`currency-btn ${config.currency === c ? 'active' : ''}`}
              onClick={() => dispatch(setCurrency(c))}>{c}</button>
          ))}
        </div>
      </section>
    </aside>
  )
}
