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
- Frontend: React + Vite + Tailwind (note: pages use inline style objects, not Tailwind classes)
- Database + Auth: Supabase
- Payments: Razorpay (NOT yet activated — see Payments section)
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

⚠️ Env vars live in `.env` locally and are NOT pushed to Git. They must ALSO be
set in the Vercel dashboard (Settings → Environment Variables) or the live site
breaks. If a feature works locally but not live, a missing Vercel env var is why.

---

## Key Files
- src/context/AuthContext.jsx — user auth + role
- src/context/CartContext.jsx — cart state
- src/context/WishlistContext.jsx — wishlist (localStorage, persists without login)
- src/context/CurrencyContext.jsx — live rates via open.er-api.com, 24hr cache
- src/hooks/useIsMobile.js — responsive breakpoint hook (used in all buyer pages)
- src/pages/admin/AdminDashboard.jsx — admin panel (sellers, orders, payouts, money summary)
- src/pages/seller/SellerDashboard.jsx — seller panel (products, add, orders)
- src/pages/buyer/Products.jsx — product listing
- src/pages/buyer/ProductDetail.jsx — single product page
- src/pages/buyer/Checkout.jsx — checkout + saves order_items with seller split
- src/pages/buyer/Wishlist.jsx — /wishlist route
- api/generate-listing.js — AI listing serverless (uses process.env.GEMINI_API_KEY)
- api/send-email.js — email serverless (uses process.env.RESEND_API_KEY)

### New shared components (added this session)
- src/components/ExportBar.jsx — date-range filter + Download CSV + Print toolbar
  (exports helpers: filterByDate, printTable). Used by admin + seller dashboards.
- src/components/StarRating.jsx — star display + interactive input (1–5)
- src/components/ProductReviews.jsx — full reviews section for the product page
- src/components/EditProductModal.jsx — seller edit-product modal (price/sale/stock/photos)

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
- Multiple product photos (up to 4) — seller add + edit, buyer gallery

### New features (added this session)
- CSV export now has a DATE-RANGE FILTER + PRINT button (admin: sellers/orders/payouts;
  seller: orders). Filtering applies to the visible list, the CSV, and the print view.
  Print opens a clean printable page → browser "Save as PDF" works there too.
- Admin MONEY summary band: Received from buyers (gross collected), To pay sellers,
  Your commission (10%), Already paid to sellers. Plus a COD-not-collected warning.
  Top "Your Commission" overview card replaced the old "Platform Revenue" card.
- Seller SALES / DISCOUNTS: sellers set an optional MRP higher than the selling price;
  buyers see struck-through MRP + "% OFF" badge on cards and product page.
  (Data model: `price` = what buyer pays; new `mrp` column = original price for display.
   Money math is unchanged because cart/checkout/10%-split still use `price`.)
- Seller EDIT PRODUCT: edit any own product (title, desc, category, state, price, sale/MRP,
  stock, active/paused toggle, photos) via EditProductModal. Enforced by existing
  "sellers update own" RLS — a seller can only edit their own products.
- Customer REVIEWS: verified-purchase only, stars + written comment + up to 4 buyer photos.
  Average rating shows on product cards (Products.jsx) and on the product page.

### Not done yet / known gaps
- Home page (Home.jsx) does NOT show sale badges yet (never modified this session).
- Reviews + star-on-cards built but only lightly tested (test via a buyer who has ordered).
- Sales are manual on/off only — no scheduled/auto-expiring sales (by design).

## Category rename
- "Tribal Crafts" → "Heritage Crafts" across all files

---

## Cloudinary
- Cloud name: (set in env — VITE_CLOUDINARY_CLOUD_NAME)
- Upload preset: bihaan_products (Unsigned)
- Folder: bihaan/  (review photos go to bihaan/reviews/)
- AI enhancement params: e_improve,e_sharpen:80,e_vibrance:20,q_auto,f_auto,w_800,h_1067,c_fill
- Free tier: 25GB storage, 25GB bandwidth/month
- Review photos are uploaded WITHOUT AI enhancement (kept authentic)

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
- Checkout saves the REAL seller_id + quantity-correct amounts (price × qty × 0.9 / 0.1)
- Admin money band now surfaces: received / owed / commission / already paid

### ⚠️ Razorpay NOT activated yet
- Test live payment FAILED with: "merchant ID ... from domain bihaan-ochre.vercel.app
  has failed as it is not registered." This is the account-activation gate, NOT a code bug.
- A FAILED payment does NOT debit money (any hold auto-reverses).
- For testing now: use Razorpay TEST MODE + test keys + Razorpay's test card numbers.
- For real payments: account must be activated (KYC + domain registered + business/legal
  details), which ties to GST + the required legal pages below.
- Contact for activation/risk: risk-notification@razorpay.com / Razorpay dashboard.

### Future: Razorpay Route (automatic split) — NOT built yet
- Decision made: STAY managed (money flows through me, I take 10%, I pay sellers).
  Sellers control their own product/price/sale only — never handle real money.
- Route would auto-split payment (seller→bank, my commission→me) and needs each seller
  to complete KYC as a Linked Account. Build only when volume makes manual a chore.

---

## Database — Supabase

### Tables of note
- products — now has an `mrp` column (numeric, nullable) for sale display
- orders — buyer column is `buyer_id` (NOT user_id) — important for any order ownership check
- order_items — product_id, seller_id, seller_amount, platform_amount, payout_status, quantity
- reviews — NEW table: id, product_id, user_id, rating(1–5), comment, images(text[]), created_at
  - one review per (product_id, user_id); RLS: public read, verified-buyer insert, own update/delete
  - verified-purchase check joins order_items → orders on o.buyer_id = auth.uid()

### Supabase gotcha (hit this session)
- After adding a column, the API may say "Could not find the 'x' column in the schema cache."
  Fix: run `notify pgrst, 'reload schema';` in SQL editor, wait ~15s, retry.

### Security — Row Level Security (RLS)
RLS is the REAL security layer. Frontend email checks only hide the UI; they do NOT
protect data. Anyone with the public anon key can hit the DB directly.

#### Admin helper function (created)
`is_admin()` — returns true only for bikidutta319@gmail.com. Reused across admin policies.
Note: `SELECT is_admin();` in the SQL editor returns false (no logged-in app user there) —
expected. Test on the LIVE site logged in as admin. If admin check ever fails on live,
switch to the `auth.jwt() ->> 'email'` version.

#### RLS status
- order_items — RLS ON. Policies: authenticated insert, admin read, admin update (mark paid)
- orders — RLS ON. Policies: admin view all, authenticated create, users view own
- products — RLS ON. Policies: anyone view active, sellers insert, sellers update own
- reviews — RLS ON. Policies: public read, verified-buyer insert, own update, own delete
- sellers — TODO: confirm RLS on + policies
- profiles — TODO: confirm RLS on + policies (reviewer name falls back to "Verified buyer"
  if profiles isn't readable by others — fine, but confirm intended)

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
- NOTE: 10% commission is GROSS. After ~2% Razorpay fee + TCS/TDS/GST, real take-home
  is closer to ~6–7%. Confirm exact numbers with a CA.

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
- [ ] Activate Razorpay + register domain + enable LIVE keys (replace test keys)
      — only after GST + legal pages
- [ ] Test one real ₹1 payment end-to-end
- [ ] Push all new code to Git so the live Vercel site has it (currently may be behind)

---

## Session changelog

### Earlier
- Fixed white-screen bug: isMobile used but useIsMobile() not called — fixed in
  Home (NavBar sub-component), ProductDetail (NavBar + main), Products, OrderSuccess, Checkout
- Removed `razorpay` from frontend deps (it's a Node-only server package)
- Checkout: now saves real seller_id + quantity-correct payout amounts + payout_status
- Added payout_status column to order_items
- AdminDashboard: added Payouts tab (per-seller owed amount, mark-as-paid)
- Wishlist: now shows real product image (was emoji-only); handles title/name + missing fields
- Security: enabled RLS + added policies (order_items, orders, products); created is_admin()

### This session
- Built ExportBar (date-range filter + CSV download + Print) → wired into admin
  (sellers/orders/payouts) and seller (orders) dashboards.
- Admin money summary band (received / owed / commission / paid) + COD-not-collected warning.
- Added `mrp` column; seller sales/discounts with struck-through price + % OFF on
  cards and product page.
- EditProductModal: sellers edit their own products (incl. sale, active toggle, photos).
- reviews table + RLS (verified-purchase only); StarRating + ProductReviews components;
  star averages on product cards; review form with stars + comment + up to 4 photos.
- Fixed: orders buyer column is `buyer_id` (corrected SQL policy + ProductReviews check).
- Learned: Razorpay live payment fails because account/domain not activated (expected gate).