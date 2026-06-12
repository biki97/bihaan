import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Logo from '../../components/Logo'

const S = {
  bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
  accent: '#8b2500', gold: '#c9922a', muted: '#7a6e62',
  border: '#e2d8ce', serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
}

const categories = [
  'Silk & Textiles', 'Handloom', 'Bamboo Crafts',
  'Brass & Metal', 'Tea & Spices', 'Heritage Crafts',
  'Pottery', 'Jewellery', 'Other'
]

const states = [
  'Assam', 'Manipur', 'Meghalaya', 'Nagaland',
  'Arunachal Pradesh', 'Mizoram', 'Tripura', 'Sikkim'
]

const timeOptions = [
  '1 day', '2 days', '3 days', '4 days',
  '5 days', '1 week', '2 weeks', '1 month'
]

// ── AI Listing Generator ──
async function generateListing(inputs) {
  const prompt = `You are helping an artisan from Northeast India list their handmade product on Bihaan marketplace.

Artisan details:
- Name: ${inputs.artisanName}
- Village: ${inputs.village}
- State: ${inputs.state}
- Experience: ${inputs.experience}
- Product: ${inputs.productName}
- Category: ${inputs.category}
- Material: ${inputs.material}
- Time to make: ${inputs.timeTomake}
- Technique: ${inputs.technique || 'Traditional methods'}

Respond ONLY with a valid JSON object, no markdown:
{
  "title": "product title under 60 characters",
  "description": "warm authentic 100-130 word story about the artisan and product",
  "features": ["feature 1", "feature 2", "feature 3", "feature 4", "feature 5"],
  "meta": "SEO description under 160 characters"
}`

  const isDev = window.location.hostname === 'localhost'

  if (isDev) {
    // Direct Gemini call for local development
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7 }
        })
      }
    )
    if (!response.ok) {
      const err = await response.json()
      throw new Error(`Gemini error ${response.status}: ${err?.error?.message}`)
    }
    const data = await response.json()
    const text = data.candidates[0].content.parts[0].text
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean)
  } else {
    // Serverless function for Vercel production
    const response = await fetch('/api/generate-listing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Generation failed')
    return data
  }
}

export default function SellerDashboard() {
  const navigate       = useNavigate()
  const { user }       = useAuth()
  const [tab,          setTab]          = useState('products')
  const [seller,       setSeller]       = useState(null)
  const [products,     setProducts]     = useState([])
  const [orders,       setOrders]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [aiLoading,    setAiLoading]    = useState(false)
  const [aiResult,     setAiResult]     = useState(null)
  const [saveLoading,  setSaveLoading]  = useState(false)

  const [aiInputs, setAiInputs] = useState({
    artisanName: '', village: '', state: '',
    experience: '', productName: '', category: '',
    material: '', timeTomake: '', technique: ''
  })

  const [productForm, setProductForm] = useState({
    title: '', description: '', price: '',
    stock: '', category: '', state: '',
  })

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    loadData()
  }, [user])

  async function loadData() {
    setLoading(true)
    const { data: sellerData } = await supabase
      .from('sellers')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!sellerData) { navigate('/seller/register'); return }
    setSeller(sellerData)

    const { data: prods } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', sellerData.id)
      .order('created_at', { ascending: false })

    setProducts(prods || [])
    setLoading(false)
  }

  async function handleGenerateListing() {
    const required = ['artisanName','village','state','experience','productName','category','material','timeTomake']
    if (required.some(k => !aiInputs[k])) {
      alert('Please fill in all required fields')
      return
    }
    setAiLoading(true)
    setAiResult(null)
    try {
      const result = await generateListing(aiInputs)
      setAiResult(result)
      setProductForm(prev => ({
        ...prev,
        title:       result.title,
        description: result.description,
        category:    aiInputs.category,
        state:       aiInputs.state,
      }))
    } catch (err) {
      alert('AI generation failed: ' + err.message)
      console.error(err)
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSaveProduct() {
    if (!productForm.title || !productForm.price || !productForm.stock) {
      alert('Please fill in title, price and stock')
      return
    }
    setSaveLoading(true)
    try {
      const { error } = await supabase.from('products').insert({
        seller_id:   seller.id,
        title:       productForm.title,
        description: productForm.description,
        price:       Number(productForm.price),
        stock:       Number(productForm.stock),
        category:    productForm.category,
        state:       productForm.state,
        is_active:   true,
      })
      if (error) throw error
      setAiResult(null)
      setAiInputs({ artisanName:'', village:'', state:'', experience:'', productName:'', category:'', material:'', timeTomake:'', technique:'' })
      setProductForm({ title:'', description:'', price:'', stock:'', category:'', state:'' })
      setTab('products')
      loadData()
    } catch (err) {
      alert('Failed to save product: ' + err.message)
    } finally {
      setSaveLoading(false)
    }
  }

  function handleAiInput(e) {
    setAiInputs(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleProductInput(e) {
    setProductForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  if (loading) return (
    <div style={{ background: S.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: S.sans }}>
      <p style={{ color: S.muted }}>Loading your dashboard...</p>
    </div>
  )

  return (
    <div style={{ background: S.bg, minHeight: '100vh', fontFamily: S.sans }}>

      <div style={{ background: S.dark, color: S.gold, textAlign: 'center', padding: '8px', fontSize: '11px', letterSpacing: '.15em' }}>
        SELLER DASHBOARD · BIHAAN MARKETPLACE
      </div>

      <nav style={{ background: S.white, borderBottom: `1px solid ${S.border}`, padding: '16px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <Logo size={36} showText={true} />
        </div>
        <p style={{ fontSize: '13px', color: S.muted, fontFamily: S.sans }}>{seller?.shop_name}</p>
        <button onClick={() => navigate('/')}
          style={{ fontSize: '11px', letterSpacing: '.1em', color: S.muted, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
          ← BACK TO STORE
        </button>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '36px 40px' }}>

        {/* Stats */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '.2em', color: S.accent, marginBottom: '6px', fontFamily: S.sans }}>
            {seller?.is_approved ? '✓ APPROVED SELLER' : '⏳ PENDING APPROVAL'}
          </p>
          <h1 style={{ fontFamily: S.serif, fontSize: '2rem', fontWeight: 400, color: S.dark, marginBottom: '20px' }}>
            Welcome, {seller?.shop_name}
          </h1>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px' }}>
            {[
              ['Total Products',  products.length],
              ['Active Listings', products.filter(p => p.is_active).length],
              ['Total Orders',    orders.length],
              ['Total Earnings',  `₹${(seller?.total_earnings || 0).toLocaleString()}`],
            ].map(([label, value]) => (
              <div key={label} style={{ background: S.white, border: `1px solid ${S.border}`, padding: '20px', borderRadius: '3px' }}>
                <p style={{ fontFamily: S.serif, fontSize: '1.8rem', color: S.dark, marginBottom: '4px' }}>{value}</p>
                <p style={{ fontSize: '11px', color: S.muted, fontFamily: S.sans, letterSpacing: '.05em' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '2px', marginBottom: '28px', borderBottom: `1px solid ${S.border}` }}>
          {['products', 'add', 'orders'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '10px 20px', fontSize: '11px', letterSpacing: '.1em', border: 'none', cursor: 'pointer', fontFamily: S.sans, background: 'transparent', color: tab === t ? S.accent : S.muted, borderBottom: tab === t ? `2px solid ${S.accent}` : '2px solid transparent', marginBottom: '-1px' }}>
              {t === 'products' ? 'MY PRODUCTS' : t === 'add' ? '+ ADD PRODUCT' : 'ORDERS'}
            </button>
          ))}
        </div>

        {/* Products tab */}
        {tab === 'products' && (
          <div>
            {products.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontFamily: S.serif, fontSize: '1.2rem', color: S.dark, marginBottom: '8px' }}>No products yet</p>
                <p style={{ fontSize: '13px', color: S.muted, marginBottom: '20px', fontFamily: S.sans }}>Add your first product using the AI listing generator</p>
                <button onClick={() => setTab('add')}
                  style={{ background: S.accent, color: '#fff', padding: '12px 28px', fontSize: '11px', letterSpacing: '.12em', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
                  + ADD YOUR FIRST PRODUCT
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
                {products.map(p => (
                  <div key={p.id} style={{ background: S.white, border: `1px solid ${S.border}`, padding: '20px', borderRadius: '3px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                      <span style={{ fontSize: '10px', letterSpacing: '.1em', color: p.is_active ? '#2d6a4f' : S.muted, fontFamily: S.sans }}>
                        {p.is_active ? '● ACTIVE' : '○ INACTIVE'}
                      </span>
                      <span style={{ fontSize: '10px', color: S.muted, fontFamily: S.sans }}>{p.category}</span>
                    </div>
                    <p style={{ fontFamily: S.serif, fontSize: '1rem', color: S.dark, marginBottom: '6px' }}>{p.title}</p>
                    <p style={{ fontSize: '11px', color: S.muted, fontFamily: S.sans, marginBottom: '12px', lineHeight: 1.5 }}>
                      {p.description?.substring(0, 80)}...
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: S.serif, fontSize: '1.1rem', color: S.dark }}>₹{Number(p.price).toLocaleString()}</span>
                      <span style={{ fontSize: '11px', color: S.muted, fontFamily: S.sans }}>Stock: {p.stock}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Add product tab */}
        {tab === 'add' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>

            {/* Left — AI inputs */}
            <div style={{ background: S.white, border: `1px solid ${S.border}`, padding: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '32px', background: S.accent, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>✨</div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: S.dark, fontFamily: S.sans }}>AI Listing Generator</p>
                  <p style={{ fontSize: '11px', color: S.muted, fontFamily: S.sans }}>Fill in simple details — AI writes the listing</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  ['artisanName', 'ARTISAN NAME *',            'e.g. Rekha Bora'],
                  ['village',     'VILLAGE / DISTRICT *',      'e.g. Sualkuchi'],
                  ['experience',  'YEARS OF EXPERIENCE *',     'e.g. 25 years'],
                  ['productName', 'PRODUCT NAME *',            'e.g. Muga Silk Saree'],
                  ['material',    'MATERIAL USED *',           'e.g. Pure Muga silk'],
                  ['technique',   'SPECIAL TECHNIQUE (optional)', 'e.g. Hand-loomed'],
                ].map(([name, label, placeholder]) => (
                  <div key={name}>
                    <label style={{ fontSize: '10px', letterSpacing: '.12em', color: S.muted, display: 'block', marginBottom: '5px', fontFamily: S.sans }}>{label}</label>
                    <input type="text" name={name} value={aiInputs[name]} onChange={handleAiInput}
                      placeholder={placeholder}
                      style={{ width: '100%', padding: '10px 12px', border: `1px solid ${S.border}`, background: S.bg, fontSize: '13px', color: S.dark, outline: 'none', fontFamily: S.sans }} />
                  </div>
                ))}

                <div>
                  <label style={{ fontSize: '10px', letterSpacing: '.12em', color: S.muted, display: 'block', marginBottom: '5px', fontFamily: S.sans }}>STATE *</label>
                  <select name="state" value={aiInputs.state} onChange={handleAiInput}
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${S.border}`, background: S.bg, fontSize: '13px', color: S.dark, outline: 'none', fontFamily: S.sans }}>
                    <option value="">Select state</option>
                    {states.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '10px', letterSpacing: '.12em', color: S.muted, display: 'block', marginBottom: '5px', fontFamily: S.sans }}>CATEGORY *</label>
                  <select name="category" value={aiInputs.category} onChange={handleAiInput}
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${S.border}`, background: S.bg, fontSize: '13px', color: S.dark, outline: 'none', fontFamily: S.sans }}>
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '10px', letterSpacing: '.12em', color: S.muted, display: 'block', marginBottom: '5px', fontFamily: S.sans }}>TIME TO MAKE *</label>
                  <select name="timeTomake" value={aiInputs.timeTomake} onChange={handleAiInput}
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${S.border}`, background: S.bg, fontSize: '13px', color: S.dark, outline: 'none', fontFamily: S.sans }}>
                    <option value="">Select time</option>
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <button onClick={handleGenerateListing} disabled={aiLoading}
                  style={{ background: aiLoading ? '#888' : S.accent, color: '#fff', padding: '13px', fontSize: '11px', letterSpacing: '.12em', border: 'none', cursor: aiLoading ? 'not-allowed' : 'pointer', fontFamily: S.sans, marginTop: '4px' }}>
                  {aiLoading ? '✨ GENERATING...' : '✨ GENERATE LISTING WITH AI'}
                </button>
              </div>
            </div>

            {/* Right — product form */}
            <div style={{ background: S.white, border: `1px solid ${S.border}`, padding: '28px' }}>
              <p style={{ fontSize: '12px', fontWeight: 500, color: S.dark, fontFamily: S.sans, marginBottom: '20px', letterSpacing: '.05em' }}>
                PRODUCT DETAILS
              </p>

              {aiResult && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '12px 14px', marginBottom: '16px', borderRadius: '3px' }}>
                  <p style={{ fontSize: '12px', color: '#15803d', fontFamily: S.sans }}>✓ AI generated — review and edit before saving</p>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '10px', letterSpacing: '.12em', color: S.muted, display: 'block', marginBottom: '5px', fontFamily: S.sans }}>PRODUCT TITLE *</label>
                  <input name="title" value={productForm.title} onChange={handleProductInput}
                    placeholder="Generated by AI or type manually"
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${S.border}`, background: S.bg, fontSize: '13px', color: S.dark, outline: 'none', fontFamily: S.sans }} />
                </div>

                <div>
                  <label style={{ fontSize: '10px', letterSpacing: '.12em', color: S.muted, display: 'block', marginBottom: '5px', fontFamily: S.sans }}>DESCRIPTION *</label>
                  <textarea name="description" value={productForm.description} onChange={handleProductInput}
                    placeholder="Generated by AI or type manually"
                    rows={6}
                    style={{ width: '100%', padding: '10px 12px', border: `1px solid ${S.border}`, background: S.bg, fontSize: '13px', color: S.dark, outline: 'none', fontFamily: S.sans, resize: 'vertical' }} />
                </div>

                {aiResult?.features && (
                  <div style={{ background: S.bg, border: `1px solid ${S.border}`, padding: '14px', borderRadius: '3px' }}>
                    <p style={{ fontSize: '10px', letterSpacing: '.1em', color: S.muted, marginBottom: '8px', fontFamily: S.sans }}>KEY FEATURES</p>
                    {aiResult.features.map((f, i) => (
                      <p key={i} style={{ fontSize: '12px', color: S.dark, fontFamily: S.sans, marginBottom: '4px' }}>▸ {f}</p>
                    ))}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '10px', letterSpacing: '.12em', color: S.muted, display: 'block', marginBottom: '5px', fontFamily: S.sans }}>PRICE (₹) *</label>
                    <input type="number" name="price" value={productForm.price} onChange={handleProductInput}
                      placeholder="e.g. 1200"
                      style={{ width: '100%', padding: '10px 12px', border: `1px solid ${S.border}`, background: S.bg, fontSize: '13px', color: S.dark, outline: 'none', fontFamily: S.sans }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', letterSpacing: '.12em', color: S.muted, display: 'block', marginBottom: '5px', fontFamily: S.sans }}>STOCK *</label>
                    <input type="number" name="stock" value={productForm.stock} onChange={handleProductInput}
                      placeholder="e.g. 5"
                      style={{ width: '100%', padding: '10px 12px', border: `1px solid ${S.border}`, background: S.bg, fontSize: '13px', color: S.dark, outline: 'none', fontFamily: S.sans }} />
                  </div>
                </div>

                <button onClick={handleSaveProduct} disabled={saveLoading}
                  style={{ background: saveLoading ? '#888' : S.dark, color: '#fff', padding: '13px', fontSize: '11px', letterSpacing: '.12em', border: 'none', cursor: saveLoading ? 'not-allowed' : 'pointer', fontFamily: S.sans }}>
                  {saveLoading ? 'SAVING...' : 'SAVE PRODUCT'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders tab */}
        {tab === 'orders' && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontFamily: S.serif, fontSize: '1.2rem', color: S.dark, marginBottom: '8px' }}>No orders yet</p>
            <p style={{ fontSize: '13px', color: S.muted, fontFamily: S.sans }}>Orders will appear here once buyers start purchasing your products</p>
          </div>
        )}

      </div>
    </div>
  )
}