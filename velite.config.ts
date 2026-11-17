import { defineCollection, defineConfig, s } from 'velite'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/contrib/mhchem'
import { countBlocks } from './src/lib/section-blocks'

const sections = defineCollection({
  name: 'Section',
  pattern: '**/*.mdx',
  schema: s.object({
    class: s.union([s.literal(11), s.literal(12)]),
    unit: s.number(),
    section: s.string(),
    order: s.number(),
    title: s.string(),
    summary: s.string().optional(),
    slug: s.slug('sections'),
    ncert: s.string().optional(),
    body: s.mdx(),
  })
    // Each Section also carries how many Simulations, Scrolly Animations and Checks it holds,
    // counted from its MDX source. The Syllabus Map shows these.
    .transform((data, { meta }) => ({ ...data, ...countBlocks(meta.content ?? '') })),
})

export default defineConfig({
  root: 'content',
  collections: { sections },
  mdx: {
    // Keep compiled MDX unminified. Minified, a Section is one ~470k-character line, and React's
    // dev-mode owner stacks pad a fake function to each element's column: GBs of memory and a
    // crashed tab on `next dev`. Unminified, every element sits on its own short line.
    minify: false,
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
})
