import { createContext, useContext, useState, useEffect } from 'react'

// Fallback rates in case API fails
const FALLBACK_RATES = {
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
  const [rates,    setRates]    = useState(FALLBACK_RATES)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetchRates()
  }, [])

  async function fetchRates() {
    try {
      // Check localStorage cache first (refresh every 24 hours)
      const cached = localStorage.getItem('bihaan_rates')
      if (cached) {
        const { rates: cachedRates, timestamp } = JSON.parse(cached)
        const ageHours = (Date.now() - timestamp) / (1000 * 60 * 60)
        if (ageHours < 24) {
          setRates(cachedRates)
          setLoading(false)
          return
        }
      }

      // Fetch fresh rates — free API, no key needed
      const response = await fetch('https://open.er-api.com/v6/latest/INR')
      const data = await response.json()

      if (data.result === 'success') {
        const newRates = {
          INR: 1,
          USD: data.rates.USD,
          GBP: data.rates.GBP,
          EUR: data.rates.EUR,
        }
        setRates(newRates)
        // Cache in localStorage
        localStorage.setItem('bihaan_rates', JSON.stringify({
          rates: newRates,
          timestamp: Date.now()
        }))
      }
    } catch (err) {
      // Silently fall back to hardcoded rates
      console.log('Using fallback exchange rates:', err.message)
    } finally {
      setLoading(false)
    }
  }

  function formatPrice(inrPrice) {
    if (currency === 'INR') {
      return `₹${Number(inrPrice).toLocaleString()}`
    }
    const converted = Math.round(inrPrice * rates[currency])
    return `${SYMBOLS[currency]}${converted.toLocaleString()}`
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, SYMBOLS, loading }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}