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

### New shared components (added earlier this build)
- src/components/ExportBar.jsx — date-range filter + Download CSV + Print toolbar
  (exports helpers: filterByDate, printTable). Used by admin + seller dashboards.
- src/components/StarRating.jsx — star display + interactive input (1–5)
- src/components/ProductReviews.jsx — full reviews section for the product page
- src/components/EditProductModal.jsx — seller edit-product modal (price/sale/stock/photos)

### Account system (added this session)
- src/pages/buyer/Account.jsx — buyer account hub at route /account. Tabs:
  My Orders (real orders by buyer_id), Saved Addresses (full add/edit/delete/default
  with Home/Work/Other type tag + ⋮ menu), My Profile (editable first/last name + phone,
  read-only email), and Payout Details (SELLERS ONLY — reads/writes seller_kyc; shows masked
  PAN + masked bank account (last 4 only), PAN read-only, bank/IFSC/GST editable). Reads
  ?tab= query param (orders|addresses|profile|payout). Waits for auth `loading` before
  redirecting (fixes refresh-bounce-to-login bug).
- src/components/AccountMenu.jsx — nav avatar dropdown (My Profile/Orders/Addresses/
  Wishlist + Seller/Admin links when relevant + Logout). Drop-in, reads user itself.
  Now in the nav of ALL buyer pages: Home, Products, ProductDetail, Cart, Wishlist,
  OrderSuccess. NOT on Checkout (kept distraction-free) or Admin (its own panel).
- App.jsx: added `import Account` + `<Route path="/account" element={<Account />} />`,
  and `import Legal from './pages/Legal'` + `<Route path="/legal" element={<Legal />} />`

### Legal pages (added this session)
- src/pages/Legal.jsx — ONE page, five sections (Privacy, Terms, Refund & Cancellation,
  Shipping, Grievance) with a side-menu to switch. Route /legal. Deep-link a section via
  /legal?section=refund (privacy|terms|refund|shipping|grievance) — useful for Razorpay's form.
  NOTE: sits directly in src/pages/ (not buyer/), so its imports are `../components/...`.
  ⚠️ All real details live in the BIZ object at the top + inline [[brackets]]; placeholders are
  highlighted amber on-page so you can't ship one by accident. NOT legal advice — fill all
  placeholders + have a lawyer/CA review (esp. Refund + Grievance) before launch. Razorpay
  needs these live at real URLs on the real domain.

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
- products — has an `mrp` column (numeric, nullable) for sale display
- orders — buyer column is `buyer_id` (NOT user_id) — important for any order ownership check
- order_items — product_id, seller_id, seller_amount, platform_amount, payout_status, quantity
- reviews — id, product_id, user_id, rating(1–5), comment, images(text[]), created_at
  - one review per (product_id, user_id); RLS: public read, verified-buyer insert, own update/delete
  - verified-purchase check joins order_items → orders on o.buyer_id = auth.uid()
- addresses — NEW: id, user_id, label(Home/Work/Other), name, phone, address, city, state,
  pincode, is_default, created_at. RLS: each user manages only their own rows (select/insert/
  update/delete where user_id = auth.uid()). Used by the buyer Account address book.
- sellers — PUBLIC-readable (policy "anyone views sellers" = true so product pages show shop
  names). Holds ONLY non-sensitive shop info: shop_name, description, state, district,
  is_approved, total_earnings. bank_account / ifsc_code columns REMOVED (were a data-exposure
  risk in a public table — see Security).
- seller_kyc — NEW, LOCKED-DOWN: user_id(pk), legal_name, pan_number, gst_number,
  bank_account, ifsc_code, created_at. RLS: only the seller (user_id = auth.uid()) and admin
  (auth.jwt() ->> 'email' = admin email) can read. This is where ALL sensitive seller data lives.

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
- order_items — RLS ON. Policies: authenticated insert, admin read, admin update (mark paid),
  AND "buyers view own order items" (select where the parent order's buyer_id = auth.uid()) ✓
- orders — RLS ON. Policies: admin view all, authenticated create, users view own
- products — RLS ON. Policies: anyone view active, sellers insert, sellers update own
- reviews — RLS ON. Policies: public read, verified-buyer insert, own update, own delete
- addresses — RLS ON. Policies: user manages only their own rows ✓
- seller_kyc — RLS ON. Policies: seller reads own + admin reads all (sensitive data) ✓
- sellers — RLS ON. "anyone views sellers" = true (public read, intentional for shop names).
  Safe because sensitive columns were moved out to seller_kyc.
- profiles — has "users update own profile" policy ✓ (confirmed when building profile editing).
  Still worth confirming the full read policy set.

### TODO security
- [x] Add buyer "view own order items" SELECT policy (done — account orders page uses it)
- [x] Move seller bank/PAN out of public sellers table into locked-down seller_kyc (done)
- [ ] Confirm full RLS policy set on profiles
- [ ] Make GitHub repo private (or .gitignore this NOTES.md)
- [ ] If any real secret key was ever in a public file, rotate it

### ⚠️ Sensitive-data exposure — found & fixed this session
- The `sellers` table has a public read policy ("anyone views sellers" = true) so product
  pages can show shop names. RLS is ROW-level, not column-level — a `true` read policy exposes
  ALL columns. The old `sellers.bank_account` / `ifsc_code` columns were therefore readable by
  anyone via the anon key.
- Fix: created `seller_kyc` (locked-down) for legal_name/PAN/GST/bank/IFSC; SellerRegister now
  writes sensitive data there and only non-sensitive shop info to `sellers`; removed the
  bank_account/ifsc_code columns from `sellers`.
- Lesson: never store sensitive data in any table that has a public/anon read policy.
- Also fixed misleading "bank details are encrypted" copy in the seller form (they're stored
  plain — RLS is what protects them; copy now says "private, visible only to you and the team").
- "Verification" = data COLLECTED, not verified. Real PAN/bank verification needs an API
  (Razorpay/Cashfree/Signzy) or manual admin review. Don't tell sellers they're "verified".

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
- [~] Privacy Policy        — built in src/pages/Legal.jsx (placeholders to fill)
- [~] Terms & Conditions    — built (placeholders to fill)
- [~] Refund & Return Policy — built (placeholders to fill)
- [~] Shipping Policy       — built (placeholders to fill)
- [~] Grievance Officer     — built; needs real name + email + address
- [ ] Fill ALL placeholders (BIZ object + [[brackets]]) and get lawyer/CA review
- [ ] Link /legal from the page footers so buyers + Razorpay reviewer can find it

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

### This session — account system + seller KYC + security
- Buyer ACCOUNT HUB (/account): My Orders, Saved Addresses, My Profile. New `addresses` table.
- Address book: add/edit/delete/set-default, Home/Work/Other type tag, ⋮ action menu.
- Profile editing: first/last name (split/joined from profiles.full_name) + phone; email
  read-only. Sectioned Personal Information / Email / Mobile layout. Skipped gender (extra PII).
- AccountMenu dropdown added to every buyer nav (Home, Products, ProductDetail, Cart,
  Wishlist, OrderSuccess). Left OFF Checkout (focus) and Admin (own panel).
- OrderSuccess now has a "VIEW MY ORDERS" button → /account?tab=orders.
- Fixed refresh-bounce-to-login on /account: wait for AuthContext `loading` before redirect.
- SELLER KYC: SellerRegister "Verification" step collects legal name (as on PAN), PAN
  (format-validated), GST (optional), bank account, IFSC → written to locked-down seller_kyc.
- SECURITY: closed the sellers-table sensitive-data exposure (see Security section). Confirmed
  sellers table no longer has bank_account/ifsc_code; seller_kyc holds all sensitive data.
- Decided NOT to collect Aadhaar (over-sensitive, not needed for payouts).
- Seller PAYOUT tab in /account (sellers only): reads/writes seller_kyc, masks PAN + bank
  account (last 4), PAN read-only, bank/IFSC/GST editable. Decided to put it in /account
  (seller-only tab) rather than the seller dashboard.
- LEGAL: built src/pages/Legal.jsx — one page, 5 sections, side menu, /legal route + deep-links.
  Tailored to Bihaan's managed model, handmade-variation refund caveat, ₹999/₹99/COD shipping,
  Razorpay-as-processor. All real details are placeholders (BIZ object + [[brackets]]),
  highlighted amber on-page. Still needs filling + lawyer/CA review before launch.

### Still pending after this session
- [ ] Fill the legal-page placeholders (BIZ object + [[brackets]] in Legal.jsx) + lawyer/CA review
- [ ] Link /legal from page footers (footers still show static ABOUT/ARTISANS/SELL/CONTACT)
- [ ] ₹1 test-priced product "Assam Muga Silk Mekhela Sador by Biki" — set a real price before launch
- [ ] Optional: checkout auto-fill from saved addresses (address book exists but checkout still
      uses a manual form)
- [ ] GST-required-or-optional for sellers — confirm with CA (currently optional in the form)
- [done] Seller payout tab in /account (masked PAN + bank, edit bank/IFSC/GST) — built this session