import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home          from './pages/buyer/Home'
import Products      from './pages/buyer/Products'
import ProductDetail from './pages/buyer/ProductDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/products"    element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
      </Routes>
    </BrowserRouter>
  )
}