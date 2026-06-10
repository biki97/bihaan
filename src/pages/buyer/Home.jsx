import { useNavigate } from 'react-router-dom'
import Logo from '../../components/Logo'

const categories = [
  { name: 'Silk & Textiles', emoji: '🧵', color: 'bg-rose-50 border-rose-200' },
  { name: 'Bamboo Crafts', emoji: '🎋', color: 'bg-green-50 border-green-200' },
  { name: 'Brass & Metal', emoji: '🏺', color: 'bg-yellow-50 border-yellow-200' },
  { name: 'Tea & Spices', emoji: '🍵', color: 'bg-amber-50 border-amber-200' },
  { name: 'Handloom', emoji: '🪡', color: 'bg-purple-50 border-purple-200' },
  { name: 'Tribal Crafts', emoji: '🎨', color: 'bg-blue-50 border-blue-200' },
  { name: 'Pottery', emoji: '🏛️', color: 'bg-orange-50 border-orange-200' },
  { name: 'Jewellery', emoji: '💍', color: 'bg-pink-50 border-pink-200' },
]

const states = [
  'Assam', 'Manipur', 'Meghalaya',
  'Nagaland', 'Arunachal Pradesh',
  'Mizoram', 'Tripura', 'Sikkim'
]

const featured = [
  { id: 1, name: 'Muga Silk Saree', price: 4500, seller: 'Rekha Bora', state: 'Assam', category: 'Silk & Textiles', color: 'bg-rose-100' },
  { id: 2, name: 'Bamboo Lamp', price: 850, seller: 'Mohan Das', state: 'Tripura', category: 'Bamboo Crafts', color: 'bg-green-100' },
  { id: 3, name: 'Xorai Brass Tray', price: 1200, seller: 'Dipali Gogoi', state: 'Assam', category: 'Brass & Metal', color: 'bg-yellow-100' },
  { id: 4, name: 'Assam Orthodox Tea', price: 450, seller: 'Rahim Ali', state: 'Assam', category: 'Tea & Spices', color: 'bg-amber-100' },
  { id: 5, name: 'Naga Shawl', price: 2800, seller: 'Leno Angami', state: 'Nagaland', category: 'Handloom', color: 'bg-purple-100' },
  { id: 6, name: 'Manipuri Pottery', price: 650, seller: 'Sana Devi', state: 'Manipur', category: 'Pottery', color: 'bg-orange-100' },
  { id: 7, name: 'Cane Basket', price: 380, seller: 'Biren Singh', state: 'Manipur', category: 'Bamboo Crafts', color: 'bg-green-100' },
  { id: 8, name: 'Tribal Silver Ring', price: 920, seller: 'Pemba Sherpa', state: 'Sikkim', category: 'Jewellery', color: 'bg-pink-100' },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Logo size={36} showText={true} />
        <div className="hidden md:flex items-center gap-6">
          <span className="text-gray-500 text-sm cursor-pointer hover:text-gray-800">Products</span>
          <span className="text-gray-500 text-sm cursor-pointer hover:text-gray-800">Artisans</span>
          <span className="text-gray-500 text-sm cursor-pointer hover:text-gray-800">States</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/seller/register')}
            className="text-sm text-rose-500 font-medium hover:text-rose-600">
            Sell on Bihaan
          </button>
          <button
            onClick={() => navigate('/login')}
            className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors">
            Sign in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="bg-white px-6 py-16 text-center border-b border-gray-100">
        <p className="text-rose-500 text-sm font-medium tracking-widest uppercase mb-3">
          Where the sun rises first
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Handmade with love from<br />
          <span className="text-rose-500">Northeast India</span>
        </h1>
        <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
          Discover authentic handcrafted products from local artisans across all 8 states of Northeast India.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/products')}
            className="bg-rose-500 hover:bg-rose-600 text-white font-medium px-8 py-3 rounded-full transition-colors">
            Explore products
          </button>
          <button
            onClick={() => navigate('/seller/register')}
            className="border border-gray-200 hover:border-rose-300 text-gray-700 font-medium px-8 py-3 rounded-full transition-colors">
            Start selling
          </button>
        </div>
      </div>

      {/* States strip */}
      <div className="bg-rose-500 px-6 py-3 overflow-x-auto">
        <div className="flex gap-6 justify-center min-w-max mx-auto">
          {states.map(state => (
            <span
              key={state}
              className="text-white text-sm font-medium cursor-pointer hover:text-rose-100 whitespace-nowrap transition-colors">
              {state}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Categories */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Shop by category</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {categories.map(cat => (
              <div
                key={cat.name}
                className={`${cat.color} border rounded-xl p-3 text-center cursor-pointer hover:shadow-sm transition-all`}>
                <div className="text-2xl mb-1">{cat.emoji}</div>
                <p className="text-xs font-medium text-gray-700 leading-tight">{cat.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Products */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Featured products</h2>
            <button
              onClick={() => navigate('/products')}
              className="text-rose-500 text-sm font-medium hover:text-rose-600">
              View all →
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featured.map(product => (
              <div
                key={product.id}
                onClick={() => navigate(`/product/${product.id}`)}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-all cursor-pointer">
                <div className={`${product.color} aspect-square flex items-center justify-center`}>
                  <span className="text-4xl">
                    {categories.find(c => c.name === product.category)?.emoji || '🎁'}
                  </span>
                </div>
                <div className="p-3">
                  <p className="font-medium text-gray-900 text-sm mb-1 truncate">{product.name}</p>
                  <p className="text-xs text-gray-400 mb-2">{product.seller} · {product.state}</p>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-900">₹{product.price.toLocaleString()}</p>
                    <button
                      className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
                      onClick={e => { e.stopPropagation() }}>
                      Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Why Bihaan */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8 mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Why Bihaan?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { emoji: '🤝', title: 'Direct from artisan', desc: 'Every product comes directly from the maker. No middlemen. Full price goes to the artisan.' },
              { emoji: '✅', title: 'Verified authentic', desc: 'Every seller is verified by us. Every product is genuinely handmade from Northeast India.' },
              { emoji: '🌅', title: 'Stories behind products', desc: 'Each listing includes the artisan story — who made it, where, and how long it took.' },
            ].map(item => (
              <div key={item.title} className="text-center">
                <div className="text-3xl mb-3">{item.emoji}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 px-6 py-8 text-center">
        <div className="flex justify-center mb-4">
          <Logo size={28} showText={true} />
        </div>
        <p className="text-gray-400 text-sm">
          © 2026 Bihaan · Empowering artisans of Northeast India
        </p>
      </footer>

    </div>
  )
}