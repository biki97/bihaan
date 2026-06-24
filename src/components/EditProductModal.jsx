// src/components/EditProductModal.jsx
//
// Lets a seller edit ONE of their own products: title, description, category,
// state, price, sale (MRP), stock, active/paused, and photos.
// Security: the "sellers update own" RLS policy means a seller can only ever
// update their OWN product — even though this is just a UI button.

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const S = {
  bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
  accent: '#8b2500', gold: '#c9922a', muted: '#7a6e62',
  border: '#e2d8ce', serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
}

const categories = [
  'Silk & Textiles', 'Handloom', 'Bamboo Crafts',
  'Brass & Metal', 'Tea & Spices', 'Heritage Crafts',
  'Pottery', 'Jewellery', 'Other',
]
const states = [
  'Assam', 'Manipur', 'Meghalaya', 'Nagaland',
  'Arunachal Pradesh', 'Mizoram', 'Tripura', 'Sikkim',
]

async function uploadToCloudinary(file) {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)
  formData.append('folder', 'bihaan')
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )
  const data = await response.json()
  if (!data.public_id) throw new Error('Upload failed')
  return data
}
function getEnhancedUrl(publicId) {
  const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  return `https://res.cloudinary.com/${cloud}/image/upload/e_improve,e_sharpen:80,e_vibrance:20,q_auto,f_auto,w_800,h_1067,c_fill/${publicId}`
}

const inputStyle = {
  width: '100%', padding: '10px 12px', border: `1px solid ${S.border}`,
  background: S.bg, fontSize: '13px', color: S.dark, outline: 'none', fontFamily: S.sans,
}
const labelStyle = {
  fontSize: '10px', letterSpacing: '.12em', color: S.muted,
  display: 'block', marginBottom: '5px', fontFamily: S.sans,
}

export default function EditProductModal({ product, onClose, onSaved }) {
  const [form,      setForm]      = useState(null)
  const [images,    setImages]    = useState([])
  const [onSale,    setOnSale]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)

  useEffect(() => {
    if (!product) return
    setForm({
      title:       product.title || '',
      description: product.description || '',
      price:       product.price ?? '',
      mrp:         product.mrp ?? '',
      stock:       product.stock ?? '',
      category:    product.category || '',
      state:       product.state || '',
      is_active:   product.is_active ?? true,
    })
    setImages(Array.isArray(product.images) ? product.images : [])
    setOnSale(product.mrp != null && Number(product.mrp) > Number(product.price))
  }, [product])

  if (!product || !form) return null

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  async function handleAddImages(e) {
    const files = Array.from(e.target.files).slice(0, 4 - images.length)
    if (files.length === 0) return
    setUploading(true)
    for (const file of files) {
      try {
        const data = await uploadToCloudinary(file)
        const enhanced = getEnhancedUrl(data.public_id)
        setImages(prev => [...prev, enhanced])
      } catch (err) {
        alert('Image upload failed: ' + err.message)
      }
    }
    setUploading(false)
    e.target.value = ''
  }

  async function save() {
    if (!form.title || form.price === '' || form.stock === '') {
      alert('Title, price and stock are required'); return
    }
    const price = Number(form.price)
    const stock = Number(form.stock)
    if (price <= 0)  { alert('Price must be greater than 0'); return }
    if (stock < 0)   { alert('Stock cannot be negative'); return }

    let mrp = null
    if (onSale) {
      mrp = Number(form.mrp)
      if (!mrp || mrp <= price) {
        alert('For a sale, the original price (MRP) must be higher than the selling price'); return
      }
    }

    setSaving(true)
    const { error } = await supabase.from('products').update({
      title:       form.title,
      description: form.description,
      price,
      mrp,
      stock,
      category:    form.category,
      state:       form.state,
      is_active:   form.is_active,
      images,
    }).eq('id', product.id)
    setSaving(false)

    if (error) { alert('Could not save: ' + error.message); return }
    onSaved && onSaved()
    onClose && onClose()
  }

  const priceNum = Number(form.price) || 0
  const mrpNum   = Number(form.mrp) || 0
  const pctOff   = (onSale && mrpNum > priceNum && mrpNum > 0)
    ? Math.round((mrpNum - priceNum) / mrpNum * 100) : 0

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(26,18,8,0.55)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 16px', zIndex: 100, overflowY: 'auto' }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: S.white, width: '100%', maxWidth: '560px', borderRadius: '4px', border: `1px solid ${S.border}`, padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontFamily: S.serif, fontSize: '1.4rem', fontWeight: 400, color: S.dark }}>Edit product</h2>
          <button onClick={onClose}
            style={{ background: 'transparent', border: 'none', fontSize: '22px', color: S.muted, cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          <div>
            <label style={labelStyle}>PRODUCT TITLE *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>DESCRIPTION</label>
            <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>CATEGORY</label>
              <select value={form.category} onChange={e => set('category', e.target.value)} style={inputStyle}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>STATE</label>
              <select value={form.state} onChange={e => set('state', e.target.value)} style={inputStyle}>
                <option value="">Select state</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Pricing + sale */}
          <div style={{ background: S.bg, border: `1px solid ${S.border}`, borderRadius: '3px', padding: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle}>SELLING PRICE (₹) *</label>
                <input type="number" value={form.price} onChange={e => set('price', e.target.value)}
                  placeholder="What the customer pays" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>STOCK *</label>
                <input type="number" value={form.stock} onChange={e => set('stock', e.target.value)} style={inputStyle} />
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', cursor: 'pointer' }}>
              <input type="checkbox" checked={onSale} onChange={e => setOnSale(e.target.checked)}
                style={{ accentColor: S.accent, width: '15px', height: '15px' }} />
              <span style={{ fontSize: '13px', color: S.dark, fontFamily: S.sans }}>Show this as a discounted sale</span>
            </label>

            {onSale && (
              <div style={{ marginTop: '12px' }}>
                <label style={labelStyle}>ORIGINAL PRICE / MRP (₹) — must be higher than selling price</label>
                <input type="number" value={form.mrp} onChange={e => set('mrp', e.target.value)}
                  placeholder="e.g. 1500" style={inputStyle} />
                {pctOff > 0 && (
                  <p style={{ fontSize: '12px', color: '#15803d', fontFamily: S.sans, marginTop: '6px' }}>
                    Buyers will see <strong>{pctOff}% OFF</strong> — ₹{mrpNum.toLocaleString()} crossed out, ₹{priceNum.toLocaleString()} as the price.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Active / paused */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)}
              style={{ accentColor: S.accent, width: '15px', height: '15px' }} />
            <span style={{ fontSize: '13px', color: S.dark, fontFamily: S.sans }}>
              Active (visible in the store). Uncheck to pause it without deleting.
            </span>
          </label>

          {/* Images */}
          <div>
            <label style={labelStyle}>PHOTOS (UP TO 4)</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {images.map((url, i) => (
                <div key={i} style={{ position: 'relative', width: '72px', height: '96px', borderRadius: '3px', overflow: 'hidden', border: i === 0 ? `2px solid ${S.accent}` : `1px solid ${S.border}` }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                    style={{ position: 'absolute', top: '3px', right: '3px', background: 'rgba(139,37,0,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '17px', height: '17px', cursor: 'pointer', fontSize: '11px', lineHeight: 1 }}>×</button>
                  {i === 0 && (
                    <div style={{ position: 'absolute', bottom: '3px', left: '3px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '8px', padding: '1px 4px', fontFamily: S.sans }}>MAIN</div>
                  )}
                </div>
              ))}
              {images.length < 4 && (
                <label style={{ width: '72px', height: '96px', border: `2px dashed ${S.border}`, borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: S.bg, fontSize: '22px', color: S.muted }}>
                  {uploading ? '⏳' : '+'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleAddImages} disabled={uploading} style={{ display: 'none' }} />
                </label>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button onClick={onClose}
              style={{ flex: '0 0 auto', background: 'transparent', color: S.muted, border: `1px solid ${S.border}`, padding: '12px 22px', fontSize: '11px', letterSpacing: '.1em', cursor: 'pointer', fontFamily: S.sans }}>
              CANCEL
            </button>
            <button onClick={save} disabled={saving}
              style={{ flex: 1, background: saving ? '#888' : S.dark, color: '#fff', padding: '12px', fontSize: '11px', letterSpacing: '.12em', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: S.sans }}>
              {saving ? 'SAVING…' : 'SAVE CHANGES'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}