import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home          from './pages/buyer/Home'
import Products      from './pages/buyer/Products'
import ProductDetail from './pages/buyer/ProductDetail'
import Cart          from './pages/buyer/Cart'
import Login         from './pages/auth/Login'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/products"    element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart"        element={<Cart />} />
        <Route path="/login"       element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}