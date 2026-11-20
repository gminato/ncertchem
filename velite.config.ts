import { defineCollection, defineConfig, s } from 'velite'
import { compile } from '@mdx-js/mdx'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/contrib/mhchem'
import { checkNumbers, countBlocks, extractHookSource } from './src/lib/section-blocks'

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
    access: s.enum(['free', 'paid']),
    ncert: s.string().optional(),
    body: s.mdx(),
  })
    // Each Section also carries how many Simulations, Scrolly Animations and Checks it holds,
    // counted from its MDX source. The Syllabus Map shows these. It carries the numbers of its
    // Checks too, because Progress is counted against the Checks a Section holds now. It also
    // compiles the `<Hook>` block on its own (`hookBody`) so a Paid Section can render its Hook
    // on the server without ever executing or exposing `body`.
    .transform(async (data, { meta }) => {
      const source = meta.content ?? ''
      const hookSource = extractHookSource(source)
      const hookBody = hookSource
        ? String(
            await compile(
              { value: hookSource, path: meta.path },
              {
                outputFormat: 'function-body',
                remarkPlugins: [remarkMath],
                rehypePlugins: [rehypeKatex],
              }
            )
          )
        : ''
      return {
        ...data,
        ...countBlocks(source),
        checkNumbers: checkNumbers(source),
        hookBody,
      }
    }),
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
