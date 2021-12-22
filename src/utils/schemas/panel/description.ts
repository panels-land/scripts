import { z } from 'zod'

export const description = z.object({
  type: z.literal('VariableDeclarator'),
  init: z.object({
    type: z.literal('Literal'),
    value: z.string(),
  }),
})
