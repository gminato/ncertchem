import { defineCollection, defineConfig, s } from 'velite'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/contrib/mhchem'

const sections = defineCollection({
  name: 'Section',
  pattern: '**/*.mdx',
  schema: s.object({
    class: s.union([s.literal(11), s.literal(12)]),
    unit: s.number(),
    section: s.string(),
    title: s.string(),
    slug: s.slug('sections'),
    body: s.mdx(),
  }),
})

export default defineConfig({
  root: 'content',
  collections: { sections },
  mdx: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
})
