import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider }     from './context/AuthContext'
import { CartProvider }     from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { CurrencyProvider } from './context/CurrencyContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <CurrencyProvider>
            <App />
          </CurrencyProvider>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  </StrictMode>,
)