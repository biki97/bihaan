import { createContext, useContext, useState } from 'react'

// Approximate exchange rates from INR
const RATES = {
  INR: 1,
  USD: 0.012,
  GBP: 0.0095,
  EUR: 0.011,
}

const SYMBOLS = {
  INR: '₹',
  USD: '$',
  GBP: '£',
  EUR: '€',
}

const CurrencyContext = createContext()

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('INR')

  function formatPrice(inrPrice) {
    if (currency === 'INR') {
      return `₹${Number(inrPrice).toLocaleString()}`
    }
    const converted = Math.round(inrPrice * RATES[currency])
    return `${SYMBOLS[currency]}${converted.toLocaleString()}`
  }

  function formatDual(inrPrice) {
    if (currency === 'INR') return `₹${Number(inrPrice).toLocaleString()}`
    const converted = Math.round(inrPrice * RATES[currency])
    return `${SYMBOLS[currency]}${converted.toLocaleString()} · ₹${Number(inrPrice).toLocaleString()}`
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, formatDual, SYMBOLS }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}