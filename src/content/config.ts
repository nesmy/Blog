import { defineCollection, z } from 'astro:content'

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    published: z.date(),
    updated: z.date().optional(),
    tag: z.enum(['devlog','tech','gaming','crossover']),
    featured: z.boolean().optional(),
    image: z.string().optional()
  })
})

export const collections = { posts }
