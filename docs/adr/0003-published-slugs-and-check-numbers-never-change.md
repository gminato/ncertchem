# Published Section slugs and Check numbers never change

Once a Section is published, its frontmatter `slug` and the `n` value of every Check inside it are permanent. Learner Progress in `public.answered_checks`, `public.last_opened`, and browser `localStorage` keys off `(section_slug, check_number)` (combined as `<section_slug>:<check_number>` in the browser). Renaming or deleting a published slug or Check number silently strands every Learner's saved Progress for that Check and breaks `last_opened` resumption across both Accounts and browser storage. We enforce immutability with a checked-in manifest rather than maintaining alias maps or database migrations, because browser `localStorage` cannot be migrated server-side and stable identifiers cost nothing to keep.

## Consequences

- `src/lib/progress/published-checks.json` records every published Section slug and its published Check numbers.
- `src/lib/progress/published-checks.test.ts` scans all `.mdx` files under `content/` and fails if any published Section slug or Check number is missing or renamed, or if duplicate slugs appear.
- Adding new Sections or new Checks to an existing Section is allowed and never breaks existing Learner Progress; once published, append them to `published-checks.json` so they are protected going forward.
- Typos in a published `slug` or non-sequential Check numbers stay as they are. Change the Section's `title`, `section`, or Prose instead of renaming its `slug` or renumbering existing Checks.
