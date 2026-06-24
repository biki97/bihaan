// src/components/ProductReviews.jsx
//
// Drop-in reviews section for the product page:  <ProductReviews productId={id} />
// - Shows the average rating + all reviews (with buyer photos).
// - Write form ONLY appears for a logged-in VERIFIED BUYER who hasn't reviewed yet.
// - Buyers can attach photos (Cloudinary, folder bihaan/reviews).
// Security: verified-purchase is also enforced in Supabase RLS (database-setup.sql).

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import StarRating from './StarRating'

const S = {
  bg: '#f8f4ef', white: '#ffffff', dark: '#1a1208',
  accent: '#8b2500', gold: '#c9922a', muted: '#7a6e62',
  border: '#e2d8ce', serif: "'Playfair Display', Georgia, serif",
  sans: "'Inter', system-ui, sans-serif",
}

async function uploadReviewPhoto(file) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET)
  fd.append('folder', 'bihaan/reviews')
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: fd }
  )
  const data = await res.json()
  if (!data.secure_url) throw new Error('Upload failed')
  return data.secure_url
}

export default function ProductReviews({ productId }) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [reviews,   setReviews]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [canReview, setCanReview] = useState(false)
  const [myReview,  setMyReview]  = useState(null)

  const [rating,     setRating]     = useState(0)
  const [comment,    setComment]    = useState('')
  const [photos,     setPhotos]     = useState([])
  const [uploading,  setUploading]  = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadReviews()
    checkEligibility()
  }, [productId, user])

  async function loadReviews() {
    setLoading(true)
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles ( full_name )')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
    setReviews(data || [])
    setLoading(false)
  }

  async function checkEligibility() {
    if (!user) { setCanReview(false); setMyReview(null); return }

    const { data: mine } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('user_id', user.id)
      .maybeSingle()
    setMyReview(mine || null)

    const { data: bought } = await supabase
      .from('order_items')
      .select('id, orders!inner(buyer_id)')
      .eq('product_id', productId)
      .eq('orders.buyer_id', user.id)
      .limit(1)
    setCanReview((bought?.length || 0) > 0)
  }

  async function handlePhotoUpload(e) {
    const files = Array.from(e.target.files).slice(0, 4 - photos.length)
    if (files.length === 0) return
    setUploading(true)
    for (const file of files) {
      try {
        const url = await uploadReviewPhoto(file)
        setPhotos(prev => [...prev, url])
      } catch (err) {
        alert('Photo upload failed: ' + err.message)
      }
    }
    setUploading(false)
    e.target.value = ''
  }

  async function submitReview() {
    if (rating < 1) { alert('Please select a star rating'); return }
    setSubmitting(true)
    const { error } = await supabase.from('reviews').insert({
      product_id: productId,
      user_id:    user.id,
      rating,
      comment:    comment.trim() || null,
      images:     photos,
    })
    setSubmitting(false)
    if (error) { alert('Could not submit review: ' + error.message); return }
    setRating(0); setComment(''); setPhotos([])
    await loadReviews()
    await checkEligibility()
  }

  const count = reviews.length
  const avg   = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0
  const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  return (
    <div>
      <h2 style={{ fontFamily: S.serif, fontSize: '1.6rem', fontWeight: 400, color: S.dark, marginBottom: '20px' }}>
        Customer reviews
      </h2>

      {/* Summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', paddingBottom: '20px', borderBottom: `1px solid ${S.border}` }}>
        {count > 0 ? (
          <>
            <span style={{ fontFamily: S.serif, fontSize: '2.4rem', color: S.dark, lineHeight: 1 }}>{avg.toFixed(1)}</span>
            <div>
              <StarRating value={avg} size={18} />
              <p style={{ fontSize: '12px', color: S.muted, fontFamily: S.sans, marginTop: '4px' }}>
                Based on {count} review{count > 1 ? 's' : ''}
              </p>
            </div>
          </>
        ) : (
          <p style={{ fontSize: '14px', color: S.muted, fontFamily: S.sans }}>No reviews yet — be the first to review this product.</p>
        )}
      </div>

      {/* Write-a-review area */}
      <div style={{ marginBottom: '32px' }}>
        {!user ? (
          <div style={{ background: S.white, border: `1px solid ${S.border}`, padding: '18px 20px', borderRadius: '3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <p style={{ fontSize: '13px', color: S.muted, fontFamily: S.sans }}>Sign in to write a review.</p>
            <button onClick={() => navigate('/login')}
              style={{ background: S.dark, color: '#fff', fontSize: '11px', letterSpacing: '.1em', padding: '9px 20px', border: 'none', cursor: 'pointer', fontFamily: S.sans }}>
              SIGN IN
            </button>
          </div>
        ) : myReview ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: '16px 20px', borderRadius: '3px' }}>
            <p style={{ fontSize: '13px', color: '#15803d', fontFamily: S.sans, marginBottom: '6px' }}>✓ You reviewed this product</p>
            <StarRating value={myReview.rating} size={16} />
            {myReview.comment && <p style={{ fontSize: '13px', color: S.dark, fontFamily: S.sans, marginTop: '8px', lineHeight: 1.6 }}>{myReview.comment}</p>}
          </div>
        ) : canReview ? (
          <div style={{ background: S.white, border: `1px solid ${S.border}`, padding: '24px', borderRadius: '3px' }}>
            <p style={{ fontSize: '12px', fontWeight: 500, color: S.dark, fontFamily: S.sans, letterSpacing: '.05em', marginBottom: '16px' }}>
              WRITE A REVIEW
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '10px', letterSpacing: '.12em', color: S.muted, display: 'block', marginBottom: '8px', fontFamily: S.sans }}>YOUR RATING *</label>
              <StarRating value={rating} onChange={setRating} size={28} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '10px', letterSpacing: '.12em', color: S.muted, display: 'block', marginBottom: '8px', fontFamily: S.sans }}>YOUR REVIEW</label>
              <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4}
                placeholder="Share how the product looked and felt when it arrived…"
                style={{ width: '100%', padding: '10px 12px', border: `1px solid ${S.border}`, background: S.bg, fontSize: '13px', color: S.dark, outline: 'none', fontFamily: S.sans, resize: 'vertical' }} />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '10px', letterSpacing: '.12em', color: S.muted, display: 'block', marginBottom: '8px', fontFamily: S.sans }}>ADD PHOTOS (OPTIONAL · UP TO 4)</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {photos.map((url, i) => (
                  <div key={i} style={{ position: 'relative', width: '64px', height: '64px', borderRadius: '3px', overflow: 'hidden', border: `1px solid ${S.border}` }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button onClick={() => setPhotos(prev => prev.filter((_, j) => j !== i))}
                      style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(139,37,0,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', cursor: 'pointer', fontSize: '11px', lineHeight: 1 }}>×</button>
                  </div>
                ))}
                {photos.length < 4 && (
                  <label style={{ width: '64px', height: '64px', border: `2px dashed ${S.border}`, borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: S.bg, fontSize: '20px', color: S.muted }}>
                    {uploading ? '⏳' : '+'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handlePhotoUpload} disabled={uploading} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
            </div>

            <button onClick={submitReview} disabled={submitting}
              style={{ background: submitting ? '#888' : S.accent, color: '#fff', padding: '12px 28px', fontSize: '11px', letterSpacing: '.12em', border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: S.sans }}>
              {submitting ? 'POSTING…' : 'POST REVIEW'}
            </button>
          </div>
        ) : (
          <div style={{ background: S.white, border: `1px solid ${S.border}`, padding: '16px 20px', borderRadius: '3px' }}>
            <p style={{ fontSize: '13px', color: S.muted, fontFamily: S.sans }}>
              Only verified buyers can review this product. Once you purchase it, you'll be able to leave a review here.
            </p>
          </div>
        )}
      </div>

      {/* Review list */}
      {loading ? (
        <p style={{ fontSize: '13px', color: S.muted, fontFamily: S.sans }}>Loading reviews…</p>
      ) : count > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {reviews.map(r => (
            <div key={r.id} style={{ borderBottom: `1px solid ${S.border}`, paddingBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <StarRating value={r.rating} size={15} />
                  <span style={{ fontSize: '13px', color: S.dark, fontFamily: S.sans, fontWeight: 500 }}>
                    {r.profiles?.full_name || 'Verified buyer'}
                  </span>
                  <span style={{ fontSize: '9px', letterSpacing: '.08em', color: '#15803d', background: '#f0fdf4', border: '1px solid #86efac', padding: '2px 6px', fontFamily: S.sans }}>
                    ✓ VERIFIED PURCHASE
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: S.muted, fontFamily: S.sans }}>{fmtDate(r.created_at)}</span>
              </div>

              {r.comment && (
                <p style={{ fontSize: '14px', color: S.muted, lineHeight: 1.7, fontFamily: S.sans, marginTop: '8px' }}>{r.comment}</p>
              )}

              {Array.isArray(r.images) && r.images.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                  {r.images.map((url, i) => (
                    <img key={i} src={url} alt="" onClick={() => window.open(url, '_blank')}
                      style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '3px', border: `1px solid ${S.border}`, cursor: 'pointer' }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}