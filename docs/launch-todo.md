# Launch to-do (`ncertchem.com`)

Pending items as of 2026-11-20. Branch: `master` (all Accounts, Progress, Legal, and Monetization changes merged).

## 1. Deploy `ncertchem.com` on GitHub + Vercel

- [ ] Create a private GitHub repo and push `master`.
- [ ] Create the Vercel project from that repo, connect `ncertchem.com` in Hostinger DNS, and set env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` (start with Test Mode keys so `https://ncertchem.com`, `/pricing`, `/terms`, and `/privacy` are live for Razorpay KYC review; never expose secret keys in public bundles).

## 2. Configure Google Cloud & Supabase for production

- [ ] Google Cloud: add `https://ncertchem.com` as an Authorized JavaScript origin and keep the Supabase callback configured; publish the OAuth consent screen with `https://ncertchem.com/privacy` and `ncertchem.com` (it stays in Testing until published).
- [ ] Supabase: set Site URL and Redirect URLs to `https://ncertchem.com`. Keep the Google client secret only in Supabase.

## 3. Razorpay Live KYC & Live Webhook

- [ ] Complete Razorpay merchant KYC (submit `https://ncertchem.com`), enable UPI & International Payments, and obtain Live Mode API keys.
- [ ] Switch `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` in Vercel to **Live Mode** and redeploy.
- [ ] Razorpay Dashboard (Live Mode): create webhook pointing to `https://ncertchem.com/api/webhooks/razorpay` with secret matching `RAZORPAY_WEBHOOK_SECRET` and active events `order.paid` and `refund.processed`.
- [ ] Get legal counsel review on `/privacy` and `/terms` (under-18 DPDP Act wording and non-refundable / cooling-off clauses) before scaling paid traffic.

## 4. Production smoke test

- [ ] Run an end-to-end signed-in sync and live payment check on `https://ncertchem.com` before announcing anything.

## Not in this launch

- A Teacher view of any kind; Progress stays private to the Learner.
- Live syncing between open devices (Progress refreshes on page load).
- Authenticated Playwright project for legacy `e2e/unit*.spec.ts` Paid Section visual-regression specs (currently gated by `<Paywall>` when unauthenticated, as expected).
