# Server-side gating for Paid Sections

Paid Sections are rendered dynamically on the server, where the Learner's Account session cookie is verified against active database Entitlements before delivering the Section body. Unsubscribed visitors receive only the Section title and the Hook, followed by a Paywall component. We chose dynamic server gating over pre-built static pages with client-side overlays because compiled MDX containing our original Prose, Animations, Simulations, and Checks cannot be protected in client bundles. Free Sections remain statically generated and cached for maximum performance.

## Status

Accepted (supersedes the static-only constraint in ADR 0002 for Paid Sections).

## Consequences

- Next.js dynamic rendering and Supabase auth cookie verification run on Paid Section page requests.
- Unauthorized browsers receive zero HTML, JavaScript, or data for the protected Prose, Animations, and Simulations, making client-side bypass impossible.
- The Hook remains public across all Sections, giving every visitor a preview of the concept before the Paywall.
- An entitled Learner must be connected to the internet to load a Paid Section; offline access remains supported only for Free Sections and local Progress caching.
