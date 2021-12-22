import { z } from 'zod'

export const defaultConfig = z.object({
  type: z.literal('VariableDeclarator'),
  init: z.object({
    type: z.literal('ObjectExpression'),
    properties: z
      .object({
        key: z.object({
          type: z.literal('Identifier'),
        }),
        value: z.any(),
      })
      .array(),
  }),
})
