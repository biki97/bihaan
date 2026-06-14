# Bihaan — Developer Notes

> ⚠️ Keep this file private. Make the GitHub repo private (Settings → Danger Zone)
> or keep NOTES.md local only via `.gitignore`. It documents internal structure.

---

## Live URLs
- App: https://bihaan-ochre.vercel.app
- GitHub: https://github.com/biki97/bihaan
- Supabase: dashboard project `txxpkypifykuwovqgwar`

## Admin
- URL: /admin
- Email: bikidutta319@gmail.com (only this email has admin access)

---

## Tech Stack
- Frontend: React + Vite + Tailwind
- Database + Auth: Supabase
- Payments: Razorpay
- AI listings: Gemini API (gemini-2.5-flash-lite)
- Emails: Resend
- Image hosting/enhancement: Cloudinary
- Hosting: Vercel

## Roles
- buyer — regular customer
- seller — artisan (has a row in `sellers` table)
- admin — bikidutta319@gmail.com only

---

## Environment Variables

Frontend (VITE_ prefix — bundled into public build, NOT for secrets):
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_RAZORPAY_KEY_ID
- VITE_GEMINI_API_KEY
- VITE_CLOUDINARY_CLOUD_NAME
- VITE_CLOUDINARY_UPLOAD_PRESET

Serverless functions (no VITE_ prefix — server-side only, safe for secrets):
- GEMINI_API_KEY   (same value as VITE_GEMINI_API_KEY)
- RESEND_API_KEY

Rule: VITE_ = public frontend. No prefix = private serverless. Never put a real
secret behind a VITE_ prefix — it becomes visible to anyone.

---

## Key Files
- src/context/AuthContext.jsx — user auth + role
- src/context/CartContext.jsx — cart state
- src/context/WishlistContext.jsx — wishlist (localStorage, persists without login)
- src/context/CurrencyContext.jsx — live rates via open.er-api.com, 24hr cache
- src/hooks/useIsMobile.js — responsive breakpoint hook (used in all buyer pages)
- src/pages/admin/AdminDashboard.jsx — admin panel (sellers, orders, payouts)
- src/pages/buyer/Checkout.jsx — checkout + saves order_items with seller split
- src/pages/buyer/Wishlist.jsx — /wishlist route
- api/generate-listing.js — AI listing serverless (uses process.env.GEMINI_API_KEY)
- api/send-email.js — email serverless (uses process.env.RESEND_API_KEY)

---

## Features
- Multi-currency (INR/USD/GBP/EUR) — all buyer pages
- Wishlist with heart icon — all product cards, shows real product image
- "Only X left" badge — stock <= 3
- Recently viewed — localStorage, shows on Home + ProductDetail
- AI image enhancement — Cloudinary auto-enhances seller photos
- Accordion state-category navigation — Home + Products sidebar
- Real Supabase products — Home, Products, ProductDetail all connected
- Real images in Cart, Checkout, and Wishlist
- Mobile responsive — all buyer pages (via useIsMobile hook)
- Seller payout tracking — admin Payouts tab (manual payout mode)

## Category rename
- "Tribal Crafts" → "Heritage Crafts" across all files

---

## Cloudinary
- Cloud name: (set in env — VITE_CLOUDINARY_CLOUD_NAME)
- Upload preset: bihaan_products (Unsigned)
- Folder: bihaan/
- AI enhancement params: e_improve,e_sharpen:80,e_vibrance:20,q_auto,f_auto,w_800,h_1067,c_fill
- Free tier: 25GB storage, 25GB bandwidth/month

## Exchange Rates
- Live rates via open.er-api.com (free, no API key)
- Cached in localStorage for 24 hours, auto-refreshes every 24 hours
- Fallback to hardcoded rates if API fails (USD 0.012, GBP 0.0095, EUR 0.011)
- File: src/context/CurrencyContext.jsx

---

## Payments & Seller Payouts (CURRENT: manual mode)
- Buyer pays → money goes to MY Razorpay account (not directly to seller)
- order_items stores per-item split: seller_amount (90%), platform_amount (10%)
- order_items.payout_status: 'pending' | 'paid'
- I pay sellers manually (UPI/bank), then click "Mark as Paid" in admin Payouts tab
- Checkout now saves the REAL seller_id (was previously null — fixed)
- Amounts are quantity-correct (price × qty × 0.9 / 0.1)

### Future: Razorpay Route (automatic split) — NOT built yet
- Would auto-split payment: seller share → their bank, my commission → mine
- Requires each seller to complete KYC (PAN, Aadhaar, bank) as a Linked Account
- Build only when seller/order volume makes manual payouts a chore

---

## Security — Supabase Row Level Security (RLS)
RLS is the REAL security layer. Frontend email checks only hide the UI;
they do NOT protect data. Anyone with the public anon key can hit the DB directly.

### Admin helper function (created)
`is_admin()` — returns true only for bikidutta319@gmail.com.
Reused across admin policies so the admin identity lives in one place.
Note: `SELECT is_admin();` in the SQL editor returns false (no logged-in app
user there) — that's expected. Test on the LIVE site logged in as admin instead.
If admin check ever fails on live, switch to the `auth.jwt() ->> 'email'` version.

### RLS status (each table should say "Disable RLS" = ON)
- order_items — RLS ON. Policies: authenticated insert, admin read, admin update (mark paid)
- orders — RLS ON. Policies: admin view all, authenticated create, users view own
- products — RLS ON. Policies: anyone view active, sellers insert, sellers update own
- sellers — TODO: confirm RLS on + policies
- profiles — TODO: confirm RLS on + policies

### TODO security
- [ ] Confirm RLS ON for sellers and profiles (they hold personal data)
- [ ] Add buyer "view own order items" SELECT policy when order-history page is built
- [ ] Make GitHub repo private (or .gitignore this NOTES.md)
- [ ] If any real secret key was ever in a public file, rotate it

---

## Marketplace Compliance (India) — for going live with real payments
Bihaan is an E-Commerce Operator (like Meesho/Amazon), which carries heavier rules:
- GST registration is MANDATORY regardless of turnover (the real gatekeeper)
- Every SELLER also needs their own GSTIN to sell on the platform
- Must collect TCS (1%) and file GSTR-8 monthly
- Must deduct TDS (0.1%) on seller payouts
- Shop & Establishment / Trade License for business address (file in parallel)
- A CA is strongly recommended once money flows (one-time setup + monthly filing)
- International later: IEC code + AD code + Razorpay international settlement

---

## Before Launch checklist

Business / legal:
- [ ] Register Udyam (MSME) — free
- [ ] GST registration (mandatory for marketplace)
- [ ] Shop & Establishment / Trade License
- [ ] Open current (business) bank account
- [ ] One-time CA consult to set up TCS/TDS/GSTR-8 correctly

Domain / email:
- [ ] Buy bihaan.in domain
- [ ] Connect bihaan.in to Vercel (DNS records)
- [ ] Verify domain on Resend
- [ ] Change onboarding@resend.dev → orders@bihaan.in in api/send-email.js

Legal pages on site (required by Razorpay + Indian e-commerce law):
- [ ] Privacy Policy
- [ ] Terms & Conditions
- [ ] Refund & Return Policy
- [ ] Shipping Policy
- [ ] Grievance Officer (name + email + address)

Technical / security:
- [ ] Confirm RLS on all tables (sellers, profiles still to verify)
- [ ] Make GitHub repo private
- [ ] Set Supabase email confirmation ON
- [ ] Enable Razorpay LIVE keys (replace test keys) — only after GST + legal pages
- [ ] Test one real ₹1 payment end-to-end

---

## Session changelog (what was fixed/added recently)
- Fixed white-screen bug: isMobile used but useIsMobile() not called — fixed in
  Home (NavBar sub-component), ProductDetail (NavBar + main), Products, OrderSuccess, Checkout
- Removed `razorpay` from frontend deps (it's a Node-only server package)
- Checkout: now saves real seller_id + quantity-correct payout amounts + payout_status
- Added payout_status column to order_items
- AdminDashboard: added Payouts tab (per-seller owed amount, mark-as-paid)
- Wishlist: now shows real product image (was emoji-only); handles title/name + missing fields
- Security: enabled RLS + added policies (order_items, orders, products); created is_admin()