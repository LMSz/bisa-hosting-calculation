import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  currentActiveUsers: 118000,
  currentConcurrentUsers: 15000,
  annualGrowthRate: 20,
  videoStorageGB: 500,
  monthlyVideoBandwidthTB: 6,
  infrastructureTier: 'professional',
  vimeoTier: 'enterprise',
  currency: 'USD',
  activeTab: 'overview',
}

const calculatorSlice = createSlice({
  name: 'calculator',
  initialState,
  reducers: {
    setCurrentActiveUsers:      (s, a) => { s.currentActiveUsers = a.payload },
    setCurrentConcurrentUsers:  (s, a) => { s.currentConcurrentUsers = a.payload },
    setAnnualGrowthRate:        (s, a) => { s.annualGrowthRate = a.payload },
    setVideoStorageGB:          (s, a) => { s.videoStorageGB = a.payload },
    setMonthlyVideoBandwidthTB: (s, a) => { s.monthlyVideoBandwidthTB = a.payload },
    setInfrastructureTier:      (s, a) => { s.infrastructureTier = a.payload },
    setVimeoTier:               (s, a) => { s.vimeoTier = a.payload },
    setCurrency:                (s, a) => { s.currency = a.payload },
    setActiveTab:               (s, a) => { s.activeTab = a.payload },
    resetToDefaults: (s) => ({ ...initialState, currency: s.currency, activeTab: s.activeTab }),
  },
})

export const {
  setCurrentActiveUsers, setCurrentConcurrentUsers, setAnnualGrowthRate,
  setVideoStorageGB, setMonthlyVideoBandwidthTB, setInfrastructureTier,
  setVimeoTier, setCurrency, setActiveTab, resetToDefaults,
} = calculatorSlice.actions

export default calculatorSlice.reducer
