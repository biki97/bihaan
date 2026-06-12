# Bihaan — Developer Notes

## Live URLs
- App: https://bihaan-ochre.vercel.app
- GitHub: https://github.com/biki97/bihaan
- Supabase: https://supabase.com/dashboard/project/txxpkypifykuwovqgwar

## Admin
- URL: /admin
- Email: bikidutta319@gmail.com

## Environment Variables needed
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_RAZORPAY_KEY_ID
- VITE_GEMINI_API_KEY
- RESEND_API_KEY

## Before Launch checklist
- [ ] Buy bihaan.in domain
- [ ] Verify domain on Resend
- [ ] Change onboarding@resend.dev to orders@bihaan.in in api/send-email.js
- [ ] Enable Razorpay live keys (replace test keys)
- [ ] Set Supabase email confirmation ON

## Tech Stack
- Frontend: React + Vite + Tailwind
- Database + Auth: Supabase
- Payments: Razorpay
- AI listings: Gemini API (gemini-2.5-flash-lite)
- Emails: Resend
- Hosting: Vercel

## Key files
- src/context/AuthContext.jsx — user auth + role
- src/context/CartContext.jsx — cart state
- api/generate-listing.js — AI listing serverless
- api/send-email.js — email serverless
- src/pages/admin/AdminDashboard.jsx — admin panel

## Roles
- buyer — regular customer
- seller — artisan (has sellers table row)
- admin — bikidutta319@gmail.com only

## New Features Added
- Multi-currency toggle (INR/USD/GBP/EUR) — hardcoded rates, in all navbars
- Wishlist — localStorage, persists without login, /wishlist page
- "Only X left" — shows when stock <= 3, on all product cards
- Recently viewed — localStorage, shows on Home + ProductDetail

## New Context Files
- src/context/WishlistContext.jsx
- src/context/CurrencyContext.jsx

## New Pages
- src/pages/buyer/Wishlist.jsx — /wishlist route

## Category rename
- "Tribal Crafts" → "Heritage Crafts" across all files

## Exchange Rates (hardcoded — update periodically)
- USD: 0.012 (1 INR = 0.012 USD)
- GBP: 0.0095
- EUR: 0.011
- File to update: src/context/CurrencyContext.jsx

## Exchange Rates
- Live rates via open.er-api.com (free, no API key)
- Cached in localStorage for 24 hours
- Auto-refreshes every 24 hours
- Fallback to hardcoded rates if API fails
- File: src/context/CurrencyContext.jsx

## API Files (in /api folder)
- api/generate-listing.js — uses process.env.GEMINI_API_KEY (NOT VITE_ prefix)
- api/send-email.js — uses process.env.RESEND_API_KEY

## Vercel Environment Variables (both VITE_ and non-VITE_ needed)
Frontend (VITE_ prefix):
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_RAZORPAY_KEY_ID
- VITE_GEMINI_API_KEY
- VITE_CLOUDINARY_CLOUD_NAME
- VITE_CLOUDINARY_UPLOAD_PRESET

Serverless functions (no VITE_ prefix):
- GEMINI_API_KEY  ← same value as VITE_GEMINI_API_KEY
- RESEND_API_KEY

## Cloudinary
- Cloud name: your_cloud_name
- Upload preset: bihaan_products (Unsigned)
- Folder: bihaan/
- AI enhancement params: e_improve,e_sharpen:80,e_vibrance:20,q_auto,f_auto,w_800,h_1067,c_fill
- Free tier: 25GB storage, 25GB bandwidth/month

## New Pages Added
- /wishlist — src/pages/buyer/Wishlist.jsx
- /admin — src/pages/admin/AdminDashboard.jsx (only bikidutta319@gmail.com)

## New Context Files
- src/context/WishlistContext.jsx — localStorage, persists without login
- src/context/CurrencyContext.jsx — live rates via open.er-api.com, 24hr cache

## Features Added
- Multi-currency (INR/USD/GBP/EUR) — all buyer pages
- Wishlist with heart icon — all product cards
- "Only X left" badge — stock <= 3
- Recently viewed — localStorage, shows on Home + ProductDetail
- AI image enhancement — Cloudinary auto-enhances seller photos
- Accordion state-category navigation — Home + Products sidebar
- Real Supabase products — Home, Products, ProductDetail all connected
- Real images in Cart and Checkout

## Important Notes
- VITE_ prefix = frontend only (Vite build)
- No VITE_ prefix = serverless functions (Node.js)
- Heritage Crafts = renamed from Tribal Crafts everywhere
- Resend from: onboarding@resend.dev → change to orders@bihaan.in after domain verified
- Razorpay: currently test keys → switch to live before launch