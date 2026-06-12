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