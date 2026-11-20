# Pages stay static, and Progress loads in the browser

Every Unit and Section page is pre-built, and adding Accounts does not change that. The browser signs the Learner in and reads and writes Progress by talking to Supabase directly, and a database rule lets each Account touch only its own rows. We chose this over server-rendered pages with sign-in cookies because sign-in currently carries only Progress: every Section is open to everyone, so there is nothing for a server to protect, and static pages stay fast and cheap to host.

## Consequences

- Progress appears a moment after the page loads, not with it.
- The browser keeps its own copy of Progress. That copy is what a signed-out Learner uses, and it lets a Check answered offline be saved later.
- Two devices open at once do not update each other live. Progress refreshes when a page loads.
- This decision must be revisited when Paid Sections arrive. Paid content cannot be protected in a pre-built page, so gating needs a server.
