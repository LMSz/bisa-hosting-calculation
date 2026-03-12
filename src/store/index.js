import { configureStore } from '@reduxjs/toolkit'
import calculatorReducer from './calculatorSlice.js'

export const store = configureStore({
  reducer: {
    calculator: calculatorReducer,
  },
})
