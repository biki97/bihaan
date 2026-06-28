import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home            from './pages/buyer/Home'
import Products        from './pages/buyer/Products'
import ProductDetail   from './pages/buyer/ProductDetail'
import Cart            from './pages/buyer/Cart'
import Login           from './pages/auth/Login'
import Checkout        from './pages/buyer/Checkout'
import OrderSuccess    from './pages/buyer/OrderSuccess'
import Wishlist        from './pages/buyer/Wishlist'
import Account         from './pages/buyer/Account'
import Legal           from './pages/Legal'
import About           from './pages/About'
import SellerRegister  from './pages/seller/SellerRegister'
import SellerDashboard from './pages/seller/SellerDashboard'
import AdminDashboard  from './pages/admin/AdminDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"                   element={<Home />} />
        <Route path="/products"           element={<Products />} />
        <Route path="/product/:id"        element={<ProductDetail />} />
        <Route path="/cart"               element={<Cart />} />
        <Route path="/login"              element={<Login />} />
        <Route path="/checkout"           element={<Checkout />} />
        <Route path="/order-success"      element={<OrderSuccess />} />
        <Route path="/wishlist"           element={<Wishlist />} />
        <Route path="/account"            element={<Account />} />
        <Route path="/legal"              element={<Legal />} />
        <Route path="/about"              element={<About />} />
        <Route path="/seller/register"    element={<SellerRegister />} />
        <Route path="/seller/dashboard"   element={<SellerDashboard />} />
        <Route path="/admin"              element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}