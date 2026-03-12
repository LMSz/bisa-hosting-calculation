import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { setActiveTab } from './store/calculatorSlice.js'
import ConfigPanel from './components/ConfigPanel.jsx'
import OverviewTab from './components/OverviewTab.jsx'
import ServicesTab from './components/ServicesTab.jsx'
import CumulativeTab from './components/CumulativeTab.jsx'
import OpinionTab from './components/OpinionTab.jsx'

const TABS = [
  { id: 'overview',    label: 'Overview' },
  { id: 'services',    label: 'Service Breakdown' },
  { id: 'cumulative',  label: 'Cumulative Analysis' },
  { id: 'opinion',     label: 'Analysis & Opinion' },
]

export default function App() {
  const dispatch = useDispatch()
  const activeTab = useSelector(s => s.calculator.activeTab)

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <div className="header-logo">G</div>
          <div>
            <h1>Hosting Cost Calculator</h1>
            <p>goganiko.hu — Vendure + Next.js vs Magento 2 + Hyvä · 5-Year Projection</p>
          </div>
        </div>
        <nav className="tab-nav">
          {TABS.map(t => (
            <button key={t.id}
              className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => dispatch(setActiveTab(t.id))}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="app-body">
        <ConfigPanel />
        <main className="main-content">
          {activeTab === 'overview'   && <OverviewTab />}
          {activeTab === 'services'   && <ServicesTab />}
          {activeTab === 'cumulative' && <CumulativeTab />}
          {activeTab === 'opinion'    && <OpinionTab />}
        </main>
      </div>
    </div>
  )
}
